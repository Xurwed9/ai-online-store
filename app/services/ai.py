import os
import re
import json
import logging
import asyncio
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from app.mcp.client import mcp_manager
from dotenv import load_dotenv

load_dotenv(override=True)

logger = logging.getLogger(__name__)

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
GROQ_MODEL = "llama-3.3-70b-versatile"

MAX_TOOL_ROUNDS = 2

TOOLS_NEEDING_USER_ID = {
    "add_to_cart", "get_cart", "get_cart_total", "remove_from_cart",
    "update_cart_quantity", "clear_cart",
    "create_order", "cancel_order", "get_order_status", "get_user_orders", "track_order",
    "recommend_products",
    "add_to_favorites", "remove_from_favorites", "get_favorites", "check_is_favorite",
}

ADMIN_TOOLS = {"product_create", "product_update", "product_delete"}

ADMIN_ONLY_MESSAGE = "Sorry, this action is available only for administrators."

pending_confirmations: dict[int, dict] = {}


def _sanitize_tools_for_groq(tools: list[dict]) -> list[dict]:
    sanitized = []
    for tool in tools:
        func = tool.get("function", {})
        params = func.get("parameters", {})
        clean_props = {}
        for name, prop in params.get("properties", {}).items():
            clean_prop = {}
            if "type" in prop:
                clean_prop["type"] = prop["type"]
            if "description" in prop:
                clean_prop["description"] = prop["description"]
            if "enum" in prop:
                clean_prop["enum"] = prop["enum"]
            if "default" in prop:
                clean_prop["default"] = prop["default"]
            clean_props[name] = clean_prop
        clean_params = {"type": params.get("type", "object"), "properties": clean_props}
        if "required" in params:
            clean_params["required"] = params["required"]
        sanitized.append({
            "type": "function",
            "function": {
                "name": func.get("name", ""),
                "description": func.get("description", ""),
                "parameters": clean_params,
            },
        })
    return sanitized


def _parse_text_tool_calls(text: str) -> list[dict]:
    pattern = r'<function=(\w+)\s*\(?\s*(\{.*?\})\s*\)?\s*(?:</function>|<function>|>)'
    matches = re.findall(pattern, text, re.DOTALL)
    calls = []
    for name, args_str in matches:
        try:
            args = json.loads(args_str)
        except json.JSONDecodeError:
            args = {}
        calls.append({"name": name, "arguments": args})
    return calls


async def _groq_chat(messages: list[dict], tools: list[dict] = None, retries: int = 3, recover: bool = True) -> dict:
    api_key = os.getenv("GROQ_API_KEY", "")
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {"model": GROQ_MODEL, "messages": messages, "temperature": 0.7, "max_tokens": 2000}
    if tools:
        payload["tools"] = tools

    for attempt in range(retries):
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(f"{GROQ_BASE_URL}/chat/completions", headers=headers, json=payload)

        if resp.status_code == 429:
            if attempt < retries - 1:
                await asyncio.sleep(3 + attempt * 3)
                continue
            raise ValueError("Rate limit exceeded")
        if resp.status_code == 401:
            raise ValueError("Invalid GROQ API key")
        if resp.status_code == 400:
            if recover:
                try:
                    err_body = resp.json()
                    failed_gen = err_body.get("error", {}).get("failed_generation", "")
                    if failed_gen:
                        logger.warning(f"Groq failed_generation: {failed_gen[:200]}")
                        text_calls = _parse_text_tool_calls(failed_gen)
                        if text_calls:
                            synthetic_message = {
                                "role": "assistant",
                                "content": "",
                                "tool_calls": [
                                    {"type": "function", "id": f"recovered_{i}", "function": {"name": tc["name"], "arguments": json.dumps(tc["arguments"])}}
                                    for i, tc in enumerate(text_calls)
                                ],
                            }
                            return {"choices": [{"message": synthetic_message}]}
                except Exception:
                    pass
            error_body = resp.text[:1000]
            logger.error(f"Groq API error {resp.status_code}: {error_body}")
            raise ValueError(f"Groq API error {resp.status_code}")
        if resp.status_code != 200:
            error_body = resp.text[:1000]
            logger.error(f"Groq API error {resp.status_code}: {error_body}")
            raise ValueError(f"Groq API error {resp.status_code}")
        return resp.json()
    raise ValueError("Rate limit exceeded")


def _format_products(products: list[dict]) -> str:
    if not products:
        return "No products found."
    lines = ["Here are the products I found:\n"]
    for p in products:
        name = p.get("name", "?")
        price = p.get("price", 0)
        color = p.get("color") or ""
        size = p.get("size") or ""
        stock = p.get("stock", 0)
        pid = p.get("id", "?")
        parts = [f"[{pid}] {name} — ${price:.2f}"]
        if size:
            parts.append(f"Size: {size}")
        if color:
            parts.append(f"Color: {color}")
        parts.append(f"In stock: {stock}")
        lines.append(" | ".join(parts))
    lines.append("\nType the product number to add it to your cart (e.g., \"add product 3\")")
    return "\n".join(lines)


def _format_cart_total(data: dict) -> str:
    items_count = data.get("total_units", 0)
    subtotal = data.get("subtotal", 0)
    discount = data.get("discount_percent", 0)
    discount_amount = data.get("discount_amount", 0)
    total = data.get("total", 0)
    lines = [f"Cart: {items_count} items"]
    lines.append(f"Subtotal: ${subtotal:.2f}")
    if discount > 0:
        lines.append(f"Discount {discount}%: -${discount_amount:.2f}")
    lines.append(f"Total: ${total:.2f}")
    return "\n".join(lines)


async def _auto_search(user_message: str, user_id: int) -> list[dict]:
    """If model failed to call tools, extract search params from user text and search directly."""
    msg = user_message.lower()

    if _is_update_command(msg):
        return []

    search_keywords = [
        "нужн", "ищ", "хоч", "покаж", "найд", "есть ли", "сколько сто",
        "купить", "заказать", "выбрать", "подбер", "посоветуй", "рекоменд",
        "куртк", "плать", "джинс", "футбол", "рубаш", "штан", "шорт",
        "обув", "кроссов", "сапог", "туфл", "сумк", "шапк", "перчат",
        "курт", "блуз", "свитш", "худи", "пиджак", "жилет",
        "need", "find", "show", "looking", "want", "buy", "search",
        "jacket", "dress", "jeans", "shirt", "pants", "shorts",
        "shoes", "sneakers", "boots", "bag", "hat", "gloves",
        "hoodie", "sweater", "blazer", "vest", "coat",
    ]
    is_search = any(kw in msg for kw in search_keywords)
    if not is_search:
        return []

    color_map = {
        "черн": "чёрн", "чёрн": "чёрн",
        "бел": "бел", "син": "син", "красн": "красн",
        "зелен": "зелен", "зелё": "зелен", "жёлт": "жёлт",
        "сер": "сер", "голуб": "голуб", "оранж": "оранж",
        "розов": "розов", "фиолет": "фиолет", "коричн": "коричн",
        "бежев": "бежев", "бирюзов": "бирюзов", "марен": "марен",
        "black": "Black", "white": "White", "blue": "Blue", "red": "Red",
        "green": "Green", "yellow": "Yellow", "grey": "Grey", "gray": "Grey",
        "pink": "Pink", "orange": "Orange", "purple": "Purple", "brown": "Brown",
        "beige": "Beige", "navy": "Navy", "silver": "Silver", "gold": "Gold",
    }
    color = ""
    for key, val in color_map.items():
        if key in msg:
            color = val
            break

    size_match = re.search(r'\b(xs|s|m|l|xl|xxl|xxxl|xxs|4[0-9]|3[0-9]|5[0-9])\b', msg, re.IGNORECASE)
    size = size_match.group(1).upper() if size_match else ""

    price_match = re.search(r'(?:до|менее|дешевле|цена|бюджет|максимум|under|under|less than|max|budget|up to|under)\s*(?:\$?(\d+[\.,]?\d*))', msg)
    max_price = 0
    if price_match:
        max_price = float(price_match.group(1).replace(",", "."))
    else:
        price_match2 = re.search(r'(\d+[\.,]?\d*)\s*(?:\$|доллар|бакс)', msg)
        if price_match2:
            max_price = float(price_match2.group(1).replace(",", "."))

    category = ""
    cat_words_ru = [
        "куртк", "плать", "джинс", "футбол", "рубаш", "штан", "шорт",
        "обув", "кроссов", "сапог", "туфл", "сумк", "шапк", "перчат",
        "блуз", "свитш", "худи", "пиджак", "жилет", "бельё", "носк",
        "юбк", "брюк", "пальто", "пухов", "ветровк", "жакет",
    ]
    cat_words_en = [
        "jacket", "dress", "jeans", "shirt", "pants", "shorts",
        "shoes", "sneakers", "boots", "bag", "hat", "gloves",
        "hoodie", "sweater", "blazer", "vest", "coat", "skirt",
    ]
    for cw in cat_words_ru + cat_words_en:
        if cw in msg:
            category = cw.rstrip("к") if cw in cat_words_ru else cw
            break

    keyword = ""
    words = msg.split()
    stop_words = {"i", "need", "a", "an", "the", "under", "with", "in", "for", "and", "or", "my", "me", "show", "find", "get", "buy", "want", "looking", "black", "white", "blue", "red", "green", "yellow", "grey", "gray", "pink", "orange", "purple", "brown", "beige", "navy", "silver", "gold"}
    meaningful = [w for w in words if w not in stop_words and len(w) > 2 and not re.match(r'^\d+$', w)]
    if meaningful and not category:
        keyword = " ".join(meaningful[:3])

    if not color and not size and not max_price and not category and not keyword:
        return []

    logger.info(f"Auto-search: keyword={keyword}, category={category}, color={color}, size={size}, max_price={max_price}")
    try:
        result = await mcp_manager.call_tool("search_products", {
            "keyword": keyword,
            "category": category,
            "color": color,
            "size": size,
            "max_price": max_price,
        })
        if isinstance(result, list):
            return result
        return []
    except Exception as e:
        logger.error(f"Auto-search failed: {e}")
        return []


async def _auto_create(user_message: str, user_id: int, user_role: str) -> dict | None:
    """If admin asks to create a product and Groq is down, parse and create directly."""
    if user_role != "admin":
        return None

    msg = user_message.lower()
    create_keywords = ["создай", "добавь товар", "создать товар", "добавить товар", "новый товар"]
    if not any(kw in msg for kw in create_keywords):
        return None

    name = ""
    price = 0
    color = ""
    size = ""
    stock = 0
    category_name = ""
    description = ""

    name_match = re.search(r'(?:товар|продукт)\s+["\']?(.+?)["\']?\s+(?:за|по|цена|стоит)', msg)
    if name_match:
        name = name_match.group(1).strip().title()
    else:
        name_match2 = re.search(r'(?:создай|добавь)\s+(?:товар\s+)?["\']?(.+?)["\']?\s+(?:за|по|цена)', msg)
        if name_match2:
            name = name_match2.group(1).strip().title()
        else:
            words = msg.split()
            for i, w in enumerate(words):
                if w in ("за", "по", "цена", "стоит") and i > 0:
                    candidate = " ".join(words[1:i]).strip()
                    if len(candidate) > 1:
                        name = candidate.title()
                    break

    price_match = re.search(r'(?:за|по|цена|стоит)\s*\$?\s*(\d+[\.,]?\d*)', msg)
    if price_match:
        price = float(price_match.group(1).replace(",", "."))

    color_map = {
        "черн": "чёрн", "чёрн": "чёрн", "бел": "бел", "син": "син",
        "красн": "красн", "зелен": "зелен", "жёлт": "жёлт",
        "сер": "сер", "голуб": "голуб", "оранж": "оранж",
        "розов": "розов", "коричн": "коричн", "бежев": "бежев",
    }
    for key, val in color_map.items():
        if key in msg:
            color = val
            break

    size_match = re.search(r'\b(xs|s|m|l|xl|xxl|xxxl)\b', msg, re.IGNORECASE)
    size = size_match.group(1).upper() if size_match else ""

    stock_match = re.search(r'(?:stock|склад|кол-во|количество)\s*[:=]?\s*(\d+)', msg)
    if stock_match:
        stock = int(stock_match.group(1))

    cat_words = [
        "куртк", "плать", "джинс", "футбол", "рубаш", "штан", "шорт",
        "обув", "кроссов", "сапог", "туфл", "сумк", "шапк", "перчат",
        "блуз", "свитш", "худи", "пиджак", "жилет", "пухов", "пальто",
        "ветровк", "жакет", "юбк", "брюк",
    ]
    cat_name_map = {
        "сумк": "Аксессуары", "шапк": "Аксессуары", "перчат": "Аксессуары",
        "куртк": "Мужская одежда", "рубаш": "Мужская одежда",
        "плать": "Женская одежда", "блуз": "Женская одежда", "юбк": "Женская одежда",
        "кроссов": "Обувь", "сапог": "Обувь", "туфл": "Обувь", "обув": "Обувь",
        "футбол": "Мужская одежда", "джинс": "Мужская одежда",
        "штан": "Мужская одежда", "худи": "Спортивная одежда",
    }
    for cw in cat_words:
        if cw in msg:
            category_name = cat_name_map.get(cw, cw)
            break

    if not name or price <= 0:
        return None

    case_fixes = {
        "куртку": "куртка", "куртки": "куртка", "курткам": "куртка",
        "футболку": "футболка", "футболки": "футболка",
        "штаны": "штаны", "джинсы": "джинсы",
        "пуховик": "пуховик", "пальто": "пальто",
        "ветровку": "ветровка", "ветровки": "ветровка",
        "свитшот": "свитшот", "худи": "худи",
        "платье": "платье", "платья": "платье",
        "шапку": "шапка", "шапки": "шапка",
    }
    name_lower = name.lower()
    for wrong, correct in case_fixes.items():
        if name_lower.startswith(wrong):
            name = correct.title() + name[len(wrong):]
            break

    logger.info(f"Auto-create: name={name}, price={price}, color={color}, size={size}, stock={stock}, category={category_name}")
    try:
        result = await mcp_manager.call_tool("product_create", {
            "name": name,
            "price": price,
            "category_id": 0,
            "category_name": category_name,
            "description": description,
            "stock": stock,
            "images": "",
            "user_id": user_id,
            "user_role": user_role,
        })
        return result
    except Exception as e:
        logger.error(f"Auto-create failed: {e}")
        return None


UPDATE_KEYWORDS = [
    "измени", "обнови", "поменяй", "установи", "поставь", "сделай",
    "замени", "обновить", "изменить", "поменять", "установить",
    "update", "change", "set", "modify", "edit", "replace",
]


def _is_update_command(msg: str) -> bool:
    return any(kw in msg for kw in UPDATE_KEYWORDS)


def _extract_product_name_for_search(msg: str) -> str:
    """Extract a product name from user message for searching when no ID is given."""
    patterns = [
        r'(?:товар|продукт|product)\s+["\']?(.+?)["\']?\s+(?:и|и\s+измени|и\s+поменяй|и\s+установи)',
        r'(?:товар|продукт|product)\s+["\']?(.+?)["\']?\s*$',
        r'["\'](.+?)["\']',
        r'(?:цвет|цена|размер|stock)\s+(?:товара|продукта|product)\s+["\']?(.+?)["\']?\s+(?:на|до)',
        r'(?:товар|продукт|product)\s+["\']?(.+?)["\']?\s+(?:на|до)',
    ]
    for pattern in patterns:
        m = re.search(pattern, msg, re.IGNORECASE)
        if m:
            name = m.group(1).strip()
            stop = {"измени", "обнови", "поменяй", "установи", "поставь", "сделай",
                    "цена", "цену", "стоимость", "price", "цвет", "color", "размер", "size",
                    "stock", "склад", "кол-во", "количество", "остаток", "на", "до", "за",
                    "товар", "продукт", "product"}
            words = [w for w in name.split() if w.lower() not in stop]
            if words:
                return " ".join(words)

    keywords_to_remove = [
        "измени", "обнови", "поменяй", "установи", "поставь", "сделай",
        "замени", "обновить", "изменить", "поменять", "установить",
        "update", "change", "set", "modify", "edit", "replace",
        "цена", "цену", "стоимость", "price", "стоит", "цвет", "color",
        "размер", "size", "stock", "склад", "кол-во", "количество", "остаток",
        "товар", "продукт", "product",
        "на", "до", "за", "и", "для",
    ]
    words = msg.split()
    meaningful = [w for w in words if w.lower() not in keywords_to_remove and len(w) > 2 and not re.match(r'^\d+$', w)]
    if meaningful:
        return " ".join(meaningful[:4])
    return ""


async def _auto_update(user_message: str, user_id: int, user_role: str) -> dict | None:
    """If admin asks to update a product and Groq is down, parse and update directly."""
    if user_role != "admin":
        return None

    msg = user_message.lower()
    if not _is_update_command(msg):
        return None

    product_id = None
    id_match = re.search(r'(?:товар|продукт|product|#)\s*(\d+)', msg)
    if id_match:
        product_id = int(id_match.group(1))
    else:
        id_match2 = re.search(r'\b(\d{1,5})\b', msg)
        if id_match2:
            product_id = int(id_match2.group(1))

    if not product_id:
        update_fields = {}
        price_match = re.search(r'(?:цена|цену|стоимость|price|стоит|за|по)\s*(?:на|:|=|до)?\s*\$?\s*(\d+[\.,]?\d*)', msg)
        if price_match:
            update_fields["price"] = float(price_match.group(1).replace(",", "."))
        stock_match = re.search(r'(?:stock|склад|кол-во|количество|остаток)\s*[:=]?\s*(\d+)', msg)
        if stock_match:
            update_fields["stock"] = int(stock_match.group(1))
        color_map_simple = {
            "черн": "чёрный", "чёрн": "чёрный", "бел": "белый", "син": "синий",
            "красн": "красный", "зелен": "зелёный", "зелён": "зелёный",
            "жёлт": "жёлтый", "желт": "жёлтый", "сер": "серый",
            "голуб": "голубой", "оранж": "оранжевый", "розов": "розовый",
            "коричн": "коричневый", "бежев": "бежевый", "фиолет": "фиолетовый",
            "black": "Black", "white": "White", "blue": "Blue", "red": "Red",
            "green": "Green", "yellow": "Yellow", "grey": "Grey", "gray": "Grey",
            "pink": "Pink", "orange": "Orange", "purple": "Purple", "brown": "Brown",
            "beige": "Beige", "navy": "Navy", "silver": "Silver", "gold": "Gold",
        }
        for key, val in color_map_simple.items():
            if key in msg:
                update_fields["color"] = val
                break
        size_match = re.search(r'\b(размер|size)\s*[:=]?\s*(xs|s|m|l|xl|xxl|xxxl|xxs)\b', msg, re.IGNORECASE)
        if size_match:
            update_fields["size"] = size_match.group(2).upper()

        if not update_fields:
            return None

        search_query = _extract_product_name_for_search(msg)
        if search_query:
            try:
                search_result = await mcp_manager.call_tool("search_products", {
                    "keyword": search_query, "category": "", "color": "",
                    "size": "", "min_price": 0, "max_price": 0, "sort": "",
                })
                products = search_result if isinstance(search_result, list) else json.loads(search_result) if isinstance(search_result, str) else []
                if products:
                    product_id = products[0]["id"]
                else:
                    return None
            except Exception:
                return None
        else:
            return None

    update_fields = {}

    price_match = re.search(r'(?:цена|цену|стоимость|price|стоит|за|по)\s*(?:на|:|=|до)?\s*\$?\s*(\d+[\.,]?\d*)', msg)
    if price_match:
        update_fields["price"] = float(price_match.group(1).replace(",", "."))

    stock_match = re.search(r'(?:stock|склад|кол-во|количество|остаток)\s*[:=]?\s*(\d+)', msg)
    if stock_match:
        update_fields["stock"] = int(stock_match.group(1))

    color_map = {
        "черн": "чёрный", "чёрн": "чёрный", "бел": "белый", "син": "синий",
        "красн": "красный", "зелен": "зелёный", "зелён": "зелёный",
        "жёлт": "жёлтый", "желт": "жёлтый", "сер": "серый",
        "голуб": "голубой", "оранж": "оранжевый", "розов": "розовый",
        "коричн": "коричневый", "бежев": "бежевый", "фиолет": "фиолетовый",
        "black": "Black", "white": "White", "blue": "Blue", "red": "Red",
        "green": "Green", "yellow": "Yellow", "grey": "Grey", "gray": "Grey",
        "pink": "Pink", "orange": "Orange", "purple": "Purple", "brown": "Brown",
        "beige": "Beige", "navy": "Navy", "silver": "Silver", "gold": "Gold",
    }
    for key, val in color_map.items():
        if key in msg:
            update_fields["color"] = val
            break

    size_match = re.search(r'\b(размер|size)\s*[:=]?\s*(xs|s|m|l|xl|xxl|xxxl|xxs)\b', msg, re.IGNORECASE)
    if size_match:
        update_fields["size"] = size_match.group(2).upper()

    name_match = re.search(r'(?:название|имя|name)\s*[:=]\s*["\']?(.+?)["\']?\s*$', msg)
    if name_match:
        update_fields["name"] = name_match.group(1).strip()

    if not update_fields:
        return None

    logger.info(f"Auto-update: product_id={product_id}, fields={update_fields}")
    try:
        result = await mcp_manager.call_tool("product_update", {
            "product_id": product_id,
            "fields": json.dumps(update_fields),
            "user_id": user_id,
            "user_role": user_role,
        })
        return result
    except Exception as e:
        logger.error(f"Auto-update failed: {e}")
        return None


SYSTEM_PROMPT = """You are an AI Admin Assistant for an online clothing store. You manage the entire store through natural language conversation.

USER ID: {user_id}
ROLE: {user_role}

ROLE-BASED PERMISSIONS:
- If ROLE is "admin": You manage the store. Use admin tools freely.
- If ROLE is "user": You are a Customer Assistant. Only help with search, cart, orders, favorites.
  - If user requests admin action, reply: "Sorry, this action is available only for administrators."
  - Do NOT call: product_create, product_update, product_delete.

HOW YOU WORK:
- The admin speaks to you naturally, like talking to a coworker.
- You extract the intent, target entity, fields to change, and new values from their message.
- You call the correct MCP tool automatically.
- Never ask for structured input, JSON, IDs, or technical syntax.
- Never ask "which product?" if there's enough context to identify it.
- If ambiguous, search first to find the product, then act on it.

AVAILABLE TOOLS (admin only):
- search_products(keyword, category, color, size, min_price, max_price, sort) — find products
- product_list() — list all products
- product_create(name, description, price, category_id, category_name, stock, images, user_id, user_role)
- product_update(product_id, fields, user_id, user_role) — fields is a JSON string like '{{"price":140,"color":"Blue"}}'
- product_delete(product_id, confirm, user_id, user_role) — confirm=True to delete
- get_all_categories() — list categories

WHAT YOU CAN DO — EXAMPLES:

Products:
- "Create a leather jacket for $299 in Men's Clothing" → product_create(name="Leather Jacket", price=299, category_name="Мужская одежда", user_id=..., user_role="admin")
- "Change the price of product 5 to 140" → product_update(product_id=5, fields='{{"price":140}}', user_id=..., user_role="admin")
- "Set the color of product 5 to blue" → product_update(product_id=5, fields='{{"color":"Blue"}}', user_id=..., user_role="admin")
- "Change color to red and price to 200 for product 5" → product_update(product_id=5, fields='{{"color":"Red","price":200}}', user_id=..., user_role="admin")
- "Update stock of leather jacket to 50" → search for leather jacket first, then product_update(product_id=found_id, fields='{{"stock":50}}', ...)
- "Delete product 3" → product_delete(product_id=3, confirm=False, ...) → ask confirmation → if yes → product_delete(product_id=3, confirm=True, ...)
- "How many products do we have?" → product_list()
- "Show me all shoes" → search_products(keyword="", category="shoes")
- "Archive product 7" → product_update(product_id=7, fields='{{"is_active":false}}', ...)
- "Restore product 7" → product_update(product_id=7, fields='{{"is_active":true}}', ...)

Categories:
- "List all categories" → get_all_categories()

IDENTIFYING PRODUCTS:
- If admin says "product 5" or "#5" → use product_id=5 directly
- If admin says "the leather jacket" → search_products(keyword="leather jacket") first, then use the found ID
- If admin says "the blue dress" → search_products(keyword="dress", color="Blue") first

DESTRUCTIVE ACTIONS — ALWAYS CONFIRM FIRST:
- Delete product → ask "Are you sure you want to delete [product name]?"
- Delete category → ask confirmation
- Bulk operations → ask confirmation

MULTI-FIELD UPDATES:
- Combine multiple fields in one JSON: '{{"color":"Blue","price":140,"stock":50}}'
- Always pass user_id and user_role with admin tools

IMPORTANT RULES:
1. ONE tool call per message. NEVER call multiple tools at once.
2. Always respond in the same language as the user.
3. Be concise. Show results, then wait for next instruction.
4. After creating/updating/deleting, confirm what was done.
5. If a product is not found, say so and suggest alternatives.
6. Never make up product IDs or data. Always use tool results.
7. When updating, only include fields the admin wants to change.
8. If the admin says "change X to Y", do NOT also change other fields."""


async def chat_with_ai(messages: list[dict], user_id: int, db: AsyncSession) -> dict:
    try:
        await mcp_manager.connect()
    except Exception as e:
        return {"reply": "Connection error. Please try again.", "tool_called": None, "tool_result": None, "error": str(e)}

    from sqlalchemy import select
    from app.models.models import User

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    user_preferences = user.preferences if user and user.preferences else None
    user_role = user.role if user else "user"

    system_msg = SYSTEM_PROMPT.format(user_id=user_id, user_role=user_role)
    if user_preferences:
        system_msg += f"\nПредпочтения: {user_preferences}"

    full_messages = [{"role": "system", "content": system_msg}] + messages
    openai_tools = _sanitize_tools_for_groq(mcp_manager.get_tools_for_openai())

    try:
        data = await _groq_chat(full_messages, openai_tools)
    except ValueError as e:
        err = str(e)
        logger.warning(f"Groq error: {err}")
        update_result = await _auto_update(messages[-1]["content"], user_id, user_role)
        if update_result and update_result.get("success"):
            return {
                "reply": f"Product #{update_result.get('id', '?')} updated!\n{update_result.get('name', '')} — ${update_result.get('price', 0):.2f}",
                "tool_called": "product_update",
                "tool_result": update_result,
                "all_tool_calls": [{"tool": "product_update", "result": update_result}],
            }
        create_result = await _auto_create(messages[-1]["content"], user_id, user_role)
        if create_result and create_result.get("success"):
            return {
                "reply": f"Product '{create_result['name']}' created!\nID: {create_result['id']}\nPrice: ${create_result['price']:.2f}\nStock: {create_result.get('stock', 0)} units",
                "tool_called": "product_create",
                "tool_result": create_result,
                "all_tool_calls": [{"tool": "product_create", "result": create_result}],
            }
        search_results = await _auto_search(messages[-1]["content"], user_id)
        if search_results:
            return {
                "reply": _format_products(search_results),
                "tool_called": "search_products",
                "tool_result": search_results,
                "all_tool_calls": [{"tool": "search_products", "result": search_results}],
            }
        if "Rate limit" in err:
            reply = "Too many requests. Please try again in a few seconds."
        elif "API key" in err:
            reply = "API key error."
        else:
            reply = "Could not get a response. Please try rephrasing your request."
        return {"reply": reply, "tool_called": None, "tool_result": None, "error": err}
    except httpx.ConnectError:
        update_result = await _auto_update(messages[-1]["content"], user_id, user_role)
        if update_result and update_result.get("success"):
            return {
                "reply": f"Product #{update_result.get('id', '?')} updated!\n{update_result.get('name', '')} — ${update_result.get('price', 0):.2f}",
                "tool_called": "product_update",
                "tool_result": update_result,
                "all_tool_calls": [{"tool": "product_update", "result": update_result}],
            }
        create_result = await _auto_create(messages[-1]["content"], user_id, user_role)
        if create_result and create_result.get("success"):
            return {
                "reply": f"Product '{create_result['name']}' created!\nID: {create_result['id']}\nPrice: ${create_result['price']:.2f}\nStock: {create_result.get('stock', 0)} units",
                "tool_called": "product_create",
                "tool_result": create_result,
                "all_tool_calls": [{"tool": "product_create", "result": create_result}],
            }
        search_results = await _auto_search(messages[-1]["content"], user_id)
        if search_results:
            return {
                "reply": _format_products(search_results),
                "tool_called": "search_products",
                "tool_result": search_results,
                "all_tool_calls": [{"tool": "search_products", "result": search_results}],
            }
        return {"reply": "No connection to AI. Please try again.", "tool_called": None, "tool_result": None, "error": "Connection error"}
    except Exception as e:
        update_result = await _auto_update(messages[-1]["content"], user_id, user_role)
        if update_result and update_result.get("success"):
            return {
                "reply": f"Product #{update_result.get('id', '?')} updated!\n{update_result.get('name', '')} — ${update_result.get('price', 0):.2f}",
                "tool_called": "product_update",
                "tool_result": update_result,
                "all_tool_calls": [{"tool": "product_update", "result": update_result}],
            }
        search_results = await _auto_search(messages[-1]["content"], user_id)
        if search_results:
            return {
                "reply": _format_products(search_results),
                "tool_called": "search_products",
                "tool_result": search_results,
                "all_tool_calls": [{"tool": "search_products", "result": search_results}],
            }
        create_result = await _auto_create(messages[-1]["content"], user_id, user_role)
        if create_result and create_result.get("success"):
            return {
                "reply": f"Product '{create_result['name']}' created!\nID: {create_result['id']}\nPrice: ${create_result['price']:.2f}\nStock: {create_result.get('stock', 0)} units",
                "tool_called": "product_create",
                "tool_result": create_result,
                "all_tool_calls": [{"tool": "product_create", "result": create_result}],
            }
        return {"reply": "Could not get a response. Please try rephrasing your request.", "tool_called": None, "tool_result": None, "error": str(e)}

    choice = data["choices"][0]
    message = choice["message"]
    assistant_text = message.get("content") or ""
    tool_calls_raw = message.get("tool_calls")

    if not tool_calls_raw:
        text_calls = _parse_text_tool_calls(assistant_text)
        if text_calls:
            tool_calls_raw = [
                {"type": "function", "id": f"text_{i}", "function": {"name": tc["name"], "arguments": json.dumps(tc["arguments"])}}
                for i, tc in enumerate(text_calls)
            ]

    if not tool_calls_raw:
        update_result = await _auto_update(messages[-1]["content"], user_id, user_role)
        if update_result and update_result.get("success"):
            return {
                "reply": f"Product #{update_result.get('id', '?')} updated!\n{update_result.get('name', '')} — ${update_result.get('price', 0):.2f}",
                "tool_called": "product_update",
                "tool_result": update_result,
                "all_tool_calls": [{"tool": "product_update", "result": update_result}],
            }
        search_results = await _auto_search(messages[-1]["content"], user_id)
        if search_results:
            return {
                "reply": _format_products(search_results),
                "tool_called": "search_products",
                "tool_result": search_results,
                "all_tool_calls": [{"tool": "search_products", "result": search_results}],
            }
        if not assistant_text or assistant_text.strip() in ("", "What are you looking for?"):
            assistant_text = "What are you looking for? For example: \"I need a black jacket under $100\""
        return {"reply": assistant_text, "tool_called": None, "tool_result": None, "all_tool_calls": []}

    all_tool_calls = []
    search_results = None
    cart_total_data = None
    update_succeeded = False
    conversation = list(full_messages)
    conversation.append({"role": "assistant", "content": assistant_text, "tool_calls": tool_calls_raw})

    for round_idx in range(MAX_TOOL_ROUNDS):
        if not tool_calls_raw:
            break

        for tc in tool_calls_raw:
            fn = tc["function"]
            tool_name = fn["name"]
            try:
                tool_args = json.loads(fn["arguments"])
            except json.JSONDecodeError:
                tool_args = {}

            if tool_name in ADMIN_TOOLS:
                if user_role != "admin":
                    result = {"error": "Access denied", "message": ADMIN_ONLY_MESSAGE, "status": 403}
                    all_tool_calls.append({"tool": tool_name, "result": result})
                    conversation.append({
                        "role": "tool",
                        "tool_call_id": tc["id"],
                        "content": json.dumps(result, ensure_ascii=False),
                    })
                    assistant_text = ADMIN_ONLY_MESSAGE
                    break

                if "user_id" not in tool_args:
                    tool_args["user_id"] = user_id
                if "user_role" not in tool_args:
                    tool_args["user_role"] = user_role

            if tool_name in TOOLS_NEEDING_USER_ID and "user_id" not in tool_args:
                tool_args["user_id"] = user_id

            try:
                result = await mcp_manager.call_tool(tool_name, tool_args)
            except Exception as e:
                result = {"error": str(e)}

            all_tool_calls.append({"tool": tool_name, "result": result})

            if tool_name == "search_products" and isinstance(result, list):
                search_results = result
            elif tool_name == "recommend_products" and isinstance(result, list):
                search_results = result
            elif tool_name == "get_cart_total" and isinstance(result, dict):
                cart_total_data = result
            elif tool_name in ("product_update", "product_create", "product_delete"):
                if isinstance(result, dict) and result.get("success"):
                    update_succeeded = True

            conversation.append({
                "role": "tool",
                "tool_call_id": tc["id"],
                "content": json.dumps(result, ensure_ascii=False),
            })

        try:
            followup = await _groq_chat(conversation, None, recover=False)
            message = followup["choices"][0]["message"]
            assistant_text = message.get("content") or ""
            tool_calls_raw = message.get("tool_calls")
            conversation.append({"role": "assistant", "content": assistant_text, "tool_calls": tool_calls_raw or []})
        except Exception:
            break

    if update_succeeded:
        pass
    elif search_results is not None and len(search_results) > 0:
        assistant_text = _format_products(search_results)
    elif search_results is not None and len(search_results) == 0:
        try:
            rec_result = await mcp_manager.call_tool("recommend_products", {"user_id": user_id})
            if isinstance(rec_result, list) and len(rec_result) > 0:
                assistant_text = "I couldn't find the exact item. Here are similar products:\n\n" + _format_products(rec_result)
                all_tool_calls.append({"tool": "recommend_products", "result": rec_result})
            else:
                assistant_text = "I'm sorry, I couldn't find any matching products. Please try a different search."
        except Exception:
            assistant_text = "I'm sorry, I couldn't find any matching products. Please try a different search."
    elif cart_total_data:
        assistant_text = _format_cart_total(cart_total_data)
    elif not assistant_text or assistant_text.strip() in ("", "Чем могу помочь?"):
        update_result = await _auto_update(messages[-1]["content"], user_id, user_role)
        if update_result and update_result.get("success"):
            assistant_text = f"Product #{update_result.get('id', '?')} updated!\n{update_result.get('name', '')} — ${update_result.get('price', 0):.2f}"
            all_tool_calls.append({"tool": "product_update", "result": update_result})
        else:
            search_results = await _auto_search(messages[-1]["content"], user_id)
            if search_results:
                assistant_text = _format_products(search_results)
                all_tool_calls.append({"tool": "search_products", "result": search_results})
            else:
                assistant_text = "What are you looking for? For example: \"I need a black jacket under $100\""

    last_tool = all_tool_calls[-1] if all_tool_calls else None
    return {
        "reply": assistant_text,
        "tool_called": last_tool["tool"] if last_tool else None,
        "tool_result": last_tool["result"] if last_tool else None,
        "all_tool_calls": all_tool_calls,
    }
