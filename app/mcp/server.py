from app.mcp.tools.product_tools import search_products, get_product_details, check_stock, get_all_categories
from app.mcp.tools.cart_tools import add_to_cart, get_cart
from app.mcp.tools.order_tools import create_order, get_order_status, get_user_orders


MCP_TOOLS = {
    "search_products": {
        "function": search_products,
        "description": "Поиск товаров по категории, цвету, размеру и цене",
        "parameters": {
            "category": "Название категории (например: 'Куртки', 'Обувь')",
            "color": "Цвет товара (например: 'чёрный', 'красный')",
            "size": "Размер (например: 'M', 'L', '42')",
            "max_price": "Максимальная цена (число)",
        },
    },
    "get_product_details": {
        "function": get_product_details,
        "description": "Получить подробную информацию о товаре по ID",
        "parameters": {
            "product_id": "ID товара (число)",
        },
    },
    "check_stock": {
        "function": check_stock,
        "description": "Проверить наличие товара на складе",
        "parameters": {
            "product_id": "ID товара (число)",
        },
    },
    "get_all_categories": {
        "function": get_all_categories,
        "description": "Получить список всех категорий товаров",
        "parameters": {},
    },
    "add_to_cart": {
        "function": add_to_cart,
        "description": "Добавить товар в корзину пользователя",
        "parameters": {
            "user_id": "ID пользователя (число)",
            "product_id": "ID товара (число)",
            "quantity": "Количество (число, по умолчанию 1)",
        },
    },
    "get_cart": {
        "function": get_cart,
        "description": "Получить содержимое корзины пользователя",
        "parameters": {
            "user_id": "ID пользователя (число)",
        },
    },
    "create_order": {
        "function": create_order,
        "description": "Оформить заказ из корзины",
        "parameters": {
            "user_id": "ID пользователя (число)",
        },
    },
    "get_order_status": {
        "function": get_order_status,
        "description": "Получить статус конкретного заказа",
        "parameters": {
            "order_id": "ID заказа (число)",
            "user_id": "ID пользователя (число)",
        },
    },
    "get_user_orders": {
        "function": get_user_orders,
        "description": "Получить все заказы пользователя",
        "parameters": {
            "user_id": "ID пользователя (число)",
        },
    },
}


def get_tools_description() -> str:
    """Возвращает описание всех MCP-инструментов для промпта AI."""
    lines = []
    for name, tool in MCP_TOOLS.items():
        params = ", ".join(tool["parameters"].keys()) if tool["parameters"] else "без параметров"
        lines.append(f"- {name}({params}): {tool['description']}")
    return "\n".join(lines)


def get_tool_function(name: str):
    """Получить функцию инструмента по имени."""
    tool = MCP_TOOLS.get(name)
    if tool:
        return tool["function"]
    return None
