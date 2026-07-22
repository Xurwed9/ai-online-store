import os
import re
import json
from openai import AsyncOpenAI
from sqlalchemy.ext.asyncio import AsyncSession
from app.mcp.server import get_tools_description, get_tool_function
from dotenv import load_dotenv

load_dotenv()

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SYSTEM_PROMPT = """Ты — AI-ассистент онлайн-магазина одежды и обуви. Твоя задача — помогать пользователям находить товары, отвечать на вопросы о наличии, ценах и помогать оформлять заказы.

ПРАВИЛА:
1. Если пользователь описывает товар — ищи его через search_products.
2. Если товар не найден — предложи альтернативы, а не просто скажи "нет".
3. Если размер или цвет не указаны — уточни у пользователя.
4. НИКОГДА не подтверждай оплату без явного согласия пользователя.
5. Отвечай на языке пользователя (русский/английский).
6. Будь дружелюбным и помогай находить лучшие варианты.

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
    tools_desc = get_tools_description()
    system_msg = SYSTEM_PROMPT.format(tools=tools_desc)

    full_messages = [{"role": "system", "content": system_msg}] + messages

    response = await client.chat.completions.create(
        model="gpt-4o-mini",
        messages=full_messages,
        temperature=0.7,
        max_tokens=1500,
    )

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

            followup_response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=followup_messages,
                temperature=0.7,
                max_tokens=1500,
            )

            final_text = followup_response.choices[0].message.content
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
