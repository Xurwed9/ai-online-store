from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.order import Order, OrderItem
from app.models.cart import Cart
from app.models.product import Product


async def create_order(user_id: int, db: AsyncSession) -> dict:
    """Оформить заказ из корзины пользователя."""
    if db is None:
        return {"success": False, "error": "Нет подключения к БД"}

    result = await db.execute(
        select(Cart).where(Cart.user_id == user_id)
    )
    cart_items = result.scalars().all()

    if not cart_items:
        return {"success": False, "error": "Корзина пуста"}

    order = Order(user_id=user_id, status="pending", total_price=0)
    db.add(order)
    await db.flush()

    total = 0
    order_items_data = []
    for ci in cart_items:
        prod_result = await db.execute(
            select(Product).where(Product.id == ci.product_id)
        )
        product = prod_result.scalar_one_or_none()
        if not product or product.stock < ci.quantity:
            continue

        item_price = float(product.price) * ci.quantity
        total += item_price

        order_item = OrderItem(
            order_id=order.id,
            product_id=ci.product_id,
            quantity=ci.quantity,
            price=float(product.price),
        )
        db.add(order_item)
        product.stock -= ci.quantity

        order_items_data.append({
            "product_name": product.name,
            "quantity": ci.quantity,
            "price": float(product.price),
        })
        await db.delete(ci)

    order.total_price = total
    await db.commit()
    await db.refresh(order)

    return {
        "success": True,
        "message": "Заказ успешно оформлен!",
        "order_id": order.id,
        "total_price": total,
        "status": order.status,
        "items": order_items_data,
    }


async def get_order_status(order_id: int, user_id: int, db: AsyncSession) -> dict:
    """Получить статус заказа."""
    if db is None:
        return {"error": "Нет подключения к БД"}

    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.user_id == user_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        return {"error": "Заказ не найден"}

    items_result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order.id)
    )
    items = items_result.scalars().all()

    items_data = []
    for item in items:
        prod_result = await db.execute(
            select(Product).where(Product.id == item.product_id)
        )
        product = prod_result.scalar_one_or_none()
        items_data.append({
            "product_name": product.name if product else "Неизвестный товар",
            "quantity": item.quantity,
            "price": float(item.price),
        })

    return {
        "order_id": order.id,
        "status": order.status,
        "total_price": float(order.total_price),
        "created_at": str(order.created_at),
        "items": items_data,
    }


async def get_user_orders(user_id: int, db: AsyncSession) -> list[dict]:
    """Получить все заказы пользователя."""
    if db is None:
        return []

    result = await db.execute(
        select(Order).where(Order.user_id == user_id).order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()

    orders_data = []
    for order in orders:
        orders_data.append({
            "order_id": order.id,
            "status": order.status,
            "total_price": float(order.total_price),
            "created_at": str(order.created_at),
        })

    return orders_data
