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
        cart_item.quantity += quantity
    else:
        cart_item = Cart(user_id=user_id, product_id=product_id, quantity=quantity)
        db.add(cart_item)

    await db.commit()
    await db.refresh(cart_item)

    return {
        "success": True,
        "message": f"Товар '{product.name}' добавлен в корзину (x{quantity})",
        "cart_item_id": cart_item.id,
        "product_name": product.name,
        "quantity": cart_item.quantity,
        "price": float(product.price),
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
