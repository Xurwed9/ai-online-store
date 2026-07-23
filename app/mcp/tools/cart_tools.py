from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.cart import Cart
from app.models.product import Product


async def add_to_cart(
    user_id: int,
    product_id: int,
    quantity: int = 1,
    db: AsyncSession = None,
) -> dict:
    """Добавить товар в корзину."""
    if db is None:
        return {"success": False, "error": "Нет подключения к БД"}

    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.is_active == True)
    )
    product = result.scalar_one_or_none()
    if not product:
        return {"success": False, "error": "Товар не найден"}

    if product.stock < quantity:
        return {
            "success": False,
            "error": f"Недостаточно товара на складе. Доступно: {product.stock}",
        }

    existing = await db.execute(
        select(Cart).where(Cart.user_id == user_id, Cart.product_id == product_id)
    )
    cart_item = existing.scalar_one_or_none()

    if cart_item:
        new_qty = cart_item.quantity + quantity
        if new_qty > product.stock:
            return {
                "success": False,
                "error": f"Нельзя добавить {quantity} шт. На складе только {product.stock}, а в корзине уже {cart_item.quantity}",
            }
        cart_item.quantity = new_qty
    else:
        cart_item = Cart(user_id=user_id, product_id=product_id, quantity=quantity)
        db.add(cart_item)

    await db.commit()
    await db.refresh(cart_item)

    return {
        "success": True,
        "message": f"Товар '{product.name}' добавлен в корзину (x{cart_item.quantity})",
        "cart_item_id": cart_item.id,
        "product_name": product.name,
        "quantity": cart_item.quantity,
        "price": float(product.price),
    }


async def update_cart_quantity(
    user_id: int,
    product_id: int,
    quantity: int,
    db: AsyncSession = None,
) -> dict:
    """Изменить количество товара в корзине."""
    if db is None:
        return {"success": False, "error": "Нет подключения к БД"}

    if quantity < 0:
        return {"success": False, "error": "Количество не может быть отрицательным"}

    if quantity == 0:
        return await remove_from_cart(user_id, product_id, db)

    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.is_active == True)
    )
    product = result.scalar_one_or_none()
    if not product:
        return {"success": False, "error": "Товар не найден"}

    if quantity > product.stock:
        return {
            "success": False,
            "error": f"На складе только {product.stock} шт.",
        }

    existing = await db.execute(
        select(Cart).where(Cart.user_id == user_id, Cart.product_id == product_id)
    )
    cart_item = existing.scalar_one_or_none()

    if not cart_item:
        return {"success": False, "error": "Товар не найден в корзине"}

    cart_item.quantity = quantity
    await db.commit()
    await db.refresh(cart_item)

    return {
        "success": True,
        "message": f"Количество '{product.name}' изменено на {quantity} шт.",
        "cart_item_id": cart_item.id,
        "product_name": product.name,
        "quantity": cart_item.quantity,
        "price": float(product.price),
        "subtotal": float(product.price) * cart_item.quantity,
    }


async def remove_from_cart(
    user_id: int,
    product_id: int,
    db: AsyncSession = None,
) -> dict:
    """Удалить товар из корзины."""
    if db is None:
        return {"success": False, "error": "Нет подключения к БД"}

    existing = await db.execute(
        select(Cart).where(Cart.user_id == user_id, Cart.product_id == product_id)
    )
    cart_item = existing.scalar_one_or_none()

    if not cart_item:
        return {"success": False, "error": "Товар не найден в корзине"}

    prod_result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = prod_result.scalar_one_or_none()
    product_name = product.name if product else "Товар"

    await db.delete(cart_item)
    await db.commit()

    return {
        "success": True,
        "message": f"'{product_name}' удалён из корзины",
    }


async def get_cart(user_id: int, db: AsyncSession) -> list[dict]:
    """Получить содержимое корзины пользователя."""
    if db is None:
        return []

    result = await db.execute(
        select(Cart).where(Cart.user_id == user_id)
    )
    items = result.scalars().all()

    cart = []
    for item in items:
        prod_result = await db.execute(
            select(Product).where(Product.id == item.product_id)
        )
        product = prod_result.scalar_one_or_none()
        if product:
            cart.append({
                "cart_item_id": item.id,
                "product_id": product.id,
                "product_name": product.name,
                "quantity": item.quantity,
                "price": float(product.price),
                "subtotal": float(product.price) * item.quantity,
            })

    return cart


async def get_cart_total(user_id: int, db: AsyncSession) -> dict:
    """Получить итого корзины со скидками.

    Скидки:
    - 5+ товаров в корзине → 5% скидка
    - 10+ товаров → 10% скидка
    - Общая сумма > $500 → 7% скидка
    """
    if db is None:
        return {"success": False, "error": "Нет подключения к БД"}

    result = await db.execute(
        select(Cart).where(Cart.user_id == user_id)
    )
    items = result.scalars().all()

    if not items:
        return {
            "success": True,
            "items_count": 0,
            "subtotal": 0,
            "discount_percent": 0,
            "discount_amount": 0,
            "total": 0,
        }

    total_items = 0
    subtotal = 0
    for item in items:
        prod_result = await db.execute(
            select(Product).where(Product.id == item.product_id)
        )
        product = prod_result.scalar_one_or_none()
        if product:
            total_items += item.quantity
            subtotal += float(product.price) * item.quantity

    discount_percent = 0
    if total_items >= 10:
        discount_percent = 10
    elif total_items >= 5:
        discount_percent = 5

    if subtotal > 500:
        discount_percent = max(discount_percent, 7)

    discount_amount = round(subtotal * discount_percent / 100, 2)
    total = round(subtotal - discount_amount, 2)

    return {
        "success": True,
        "items_count": len(items),
        "total_units": total_items,
        "subtotal": subtotal,
        "discount_percent": discount_percent,
        "discount_amount": discount_amount,
        "total": total,
    }
