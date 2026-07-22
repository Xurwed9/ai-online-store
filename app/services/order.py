from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.order import Order, OrderItem
from app.models.cart import Cart
from app.models.product import Product
from app.models.models import User


async def create_order_from_cart(user_id: int, db: AsyncSession):
    cart_result = await db.execute(
        select(Cart).where(Cart.user_id == user_id)
    )
    cart_items = cart_result.scalars().all()

    if not cart_items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Корзина пуста"
        )

    order = Order(user_id=user_id, status="pending", total_price=0)
    db.add(order)
    await db.flush()

    total = 0
    for ci in cart_items:
        prod_result = await db.execute(
            select(Product).where(Product.id == ci.product_id)
        )
        product = prod_result.scalar_one_or_none()
        if not product:
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
        await db.delete(ci)

    order.total_price = total
    await db.commit()
    await db.refresh(order)
    return order


async def get_user_orders(user_id: int, db: AsyncSession):
    result = await db.execute(
        select(Order).where(Order.user_id == user_id).order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()
    enriched = []
    for order in orders:
        items_result = await db.execute(
            select(OrderItem).where(OrderItem.order_id == order.id)
        )
        items = items_result.scalars().all()
        enriched_items = []
        for item in items:
            prod_result = await db.execute(
                select(Product).where(Product.id == item.product_id)
            )
            product = prod_result.scalar_one_or_none()
            enriched_items.append({
                "id": item.id,
                "product_id": item.product_id,
                "product_name": product.name if product else None,
                "quantity": item.quantity,
                "price": float(item.price),
            })
        enriched.append({
            "id": order.id,
            "user_id": order.user_id,
            "status": order.status,
            "total_price": float(order.total_price),
            "created_at": order.created_at,
            "items": enriched_items,
        })
    return enriched


async def get_order_by_id(order_id: int, user_id: int, db: AsyncSession):
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.user_id == user_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заказ не найден"
        )

    items_result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order.id)
    )
    items = items_result.scalars().all()
    enriched_items = []
    for item in items:
        prod_result = await db.execute(
            select(Product).where(Product.id == item.product_id)
        )
        product = prod_result.scalar_one_or_none()
        enriched_items.append({
            "id": item.id,
            "product_id": item.product_id,
            "product_name": product.name if product else None,
            "quantity": item.quantity,
            "price": float(item.price),
        })
    return {
        "id": order.id,
        "user_id": order.user_id,
        "status": order.status,
        "total_price": float(order.total_price),
        "created_at": order.created_at,
        "items": enriched_items,
    }


async def update_order_status(order_id: int, new_status: str, db: AsyncSession):
    result = await db.execute(
        select(Order).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заказ не найден"
        )

    valid_statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Статус должен быть одним из: {', '.join(valid_statuses)}"
        )

    order.status = new_status
    await db.commit()
    await db.refresh(order)
    return order


async def cancel_order(order_id: int, user_id: int, db: AsyncSession):
    result = await db.execute(
        select(Order).where(Order.id == order_id, Order.user_id == user_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заказ не найден"
        )

    if order.status not in ["pending", "confirmed"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Невозможно отменить заказ в текущем статусе"
        )

    items_result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order.id)
    )
    items = items_result.scalars().all()
    for item in items:
        prod_result = await db.execute(
            select(Product).where(Product.id == item.product_id)
        )
        product = prod_result.scalar_one_or_none()
        if product:
            product.stock += item.quantity

    order.status = "cancelled"
    await db.commit()
    await db.refresh(order)
    return order


async def get_all_orders(db: AsyncSession):
    result = await db.execute(
        select(Order).order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()
    enriched = []
    for order in orders:
        user_result = await db.execute(
            select(User).where(User.id == order.user_id)
        )
        user = user_result.scalar_one_or_none()

        items_result = await db.execute(
            select(OrderItem).where(OrderItem.order_id == order.id)
        )
        items = items_result.scalars().all()
        enriched_items = []
        for item in items:
            prod_result = await db.execute(
                select(Product).where(Product.id == item.product_id)
            )
            product = prod_result.scalar_one_or_none()
            enriched_items.append({
                "id": item.id,
                "product_id": item.product_id,
                "product_name": product.name if product else None,
                "quantity": item.quantity,
                "price": float(item.price),
            })
        enriched.append({
            "id": order.id,
            "user_id": order.user_id,
            "username": user.username if user else None,
            "status": order.status,
            "total_price": float(order.total_price),
            "created_at": order.created_at,
            "items": enriched_items,
        })
    return enriched


async def get_pending_count(db: AsyncSession):
    result = await db.execute(
        select(Order).where(Order.status == "pending")
    )
    return len(result.scalars().all())
