import os
import re
import json
import logging
from openai import AsyncOpenAI, AuthenticationError, APIConnectionError, RateLimitError
from sqlalchemy.ext.asyncio import AsyncSession
from app.mcp.server import get_tools_description, get_tool_function
from dotenv import load_dotenv

load_dotenv(override=True)

logger = logging.getLogger(__name__)

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_MODEL = "llama-3.3-70b-versatile"


def _get_client() -> AsyncOpenAI:
    api_key = os.getenv("GROQ_API_KEY", "")
    return AsyncOpenAI(api_key=api_key, base_url=GROQ_BASE_URL)

SYSTEM_PROMPT = """Ты — AI-ассистент онлайн-магазина одежды и обуви. Твоя задача — помогать пользователям находить товары, отвечать на вопросы о наличии, ценах и помогать оформлять заказы.

ПРАВИЛА:
1. Если пользователь описывает товар — ищи его через search_products.
2. Если товар не найден — предложи альтернативы через recommend_products или search_products с другими параметрами, а не просто скажи "нет".
3. Если размер или цвет не указаны — уточни у пользователя, а не угадывай.
4. НИКОГДА не подтверждай оплату без явного согласия пользователя.
5. Отвечай на языке пользователя (русский/английский).
6. Будь дружелюбным и помогай находить лучшие варианты.
7. Если пользователь спрашивает "что мне купить" или "что посоветуешь" — используй recommend_products для персонализированных рекомендаций на основе истории покупок.
8. Если пользователь смотрит товар — предложи похожие через get_similar_products.
9. Если товар закончился на складе — предложи альтернативы из той же категории, а не просто сообщи об отсутствии.
10. Учитывай предпочтения пользователя (если они указаны в профиле) при рекомендациях.

ДОСТУПНЫЕ ИНСТРУМЕНТЫ (вызывай их когда нужно):
{tools}

ФОРМАТ ОТВЕТА:
- Сначала кратко ответь пользователю
- Если нашёл товары — покажи их в удобном формате (название, цена, размер, цвет)
- Если нужен вызов инструмента — используй JSON-блок:
```tool_call
{{"tool": "имя_инструмента", "args": {{...}}}}
```"""

TOOL_CALL_PATTERN = r'```tool_call\s*(\{.*?\})\s*```'


async def call_tool(tool_name: str, args: dict, user_id: int, db: AsyncSession) -> dict:
    """Вызвать MCP-инструмент по имени."""
    func = get_tool_function(tool_name)
    if not func:
        return {"error": f"Инструмент '{tool_name}' не найден"}

    # Добавляем user_id к аргументам если инструмент это требует
    if "user_id" in func.__code__.co_varnames:
        args["user_id"] = user_id

    args["db"] = db
    return await func(**args)


async def chat_with_ai(
    messages: list[dict],
    user_id: int,
    db: AsyncSession,
) -> dict:
    """Основная функция AI-ассистента.

    Принимает историю сообщений, возвращает ответ.
    Может вызывать MCP-инструменты для работы с БД.
    """
    from sqlalchemy import select
    from app.models.models import User

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    user_preferences = user.preferences if user and user.preferences else None

    tools_desc = get_tools_description()
    system_msg = SYSTEM_PROMPT.format(tools=tools_desc)

    if user_preferences:
        system_msg += f"\n\nПРЕДПОЧТЕНИЯ ПОЛЬЗОВАТЕЛЯ: {user_preferences}"

    full_messages = [{"role": "system", "content": system_msg}] + messages

    try:
        response = await _get_client().chat.completions.create(
            model=GROQ_MODEL,
            messages=full_messages,
            temperature=0.7,
            max_tokens=1500,
        )
    except AuthenticationError:
        return {
            "reply": "Ошибка: невалидный API-ключ GROQ. Проверьте переменную GROQ_API_KEY в файле .env.",
            "tool_called": None,
            "tool_result": None,
            "error": "Invalid GROQ API key",
        }
    except APIConnectionError:
        return {
            "reply": "Ошибка: не удалось подключиться к API Groq. Проверьте подключение к интернету.",
            "tool_called": None,
            "tool_result": None,
            "error": "Cannot connect to Groq API",
        }
    except RateLimitError:
        return {
            "reply": "Превышен лимит запросов к AI. Подождите немного и попробуйте снова.",
            "tool_called": None,
            "tool_result": None,
            "error": "Rate limit exceeded",
        }
    except Exception as e:
        logger.exception("Unexpected error in AI chat")
        return {
            "reply": "Произошла непредвиденная ошибка при обращении к AI. Попробуйте позже.",
            "tool_called": None,
            "tool_result": None,
            "error": str(e),
        }

    assistant_text = response.choices[0].message.content

    # Проверяем, есть ли вызов инструмента
    match = re.search(TOOL_CALL_PATTERN, assistant_text)
    if match:
        try:
            tool_call = json.loads(match.group(1))
            tool_name = tool_call.get("tool")
            tool_args = tool_call.get("args", {})

            result = await call_tool(tool_name, tool_args, user_id, db)

            # Формируем ответ с результатом инструмента
            followup_messages = full_messages + [
                {"role": "assistant", "content": assistant_text},
                {
                    "role": "user",
                    "content": f"Результат вызова инструмента {tool_name}: {json.dumps(result, ensure_ascii=False)}",
                },
            ]

            try:
                followup_response = await _get_client().chat.completions.create(
                    model=GROQ_MODEL,
                    messages=followup_messages,
                    temperature=0.7,
                    max_tokens=1500,
                )
                final_text = followup_response.choices[0].message.content
            except Exception as e:
                logger.exception("Error in AI followup after tool call")
                final_text = f"Инструмент {tool_name} вернул результат, но не удалось получить ответ AI: {e}"

            return {
                "reply": final_text,
                "tool_called": tool_name,
                "tool_result": result,
            }
        except (json.JSONDecodeError, KeyError) as e:
            return {
                "reply": assistant_text,
                "tool_called": None,
                "tool_result": None,
                "error": str(e),
            }

    return {
        "reply": assistant_text,
        "tool_called": None,
        "tool_result": None,
    }
