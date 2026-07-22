from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.payment import Payment
from app.models.order import Order


async def create_payment(user_id: int, order_id: int, method: str, db: AsyncSession):
    order_result = await db.execute(
        select(Order).where(Order.id == order_id, Order.user_id == user_id)
    )
    order = order_result.scalar_one_or_none()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заказ не найден"
        )

    existing = await db.execute(
        select(Payment).where(Payment.order_id == order_id, Payment.status == "completed")
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Оплата за этот заказ уже произведена"
        )

    payment = Payment(
        order_id=order_id,
        status="completed",
        amount=float(order.total_price),
        method=method,
    )
    db.add(payment)
    order.status = "confirmed"
    await db.commit()
    await db.refresh(payment)
    return payment


async def get_user_payments(user_id: int, db: AsyncSession):
    result = await db.execute(
        select(Payment).join(Order).where(Order.user_id == user_id).order_by(Payment.created_at.desc())
    )
    return result.scalars().all()


async def get_payment_by_id(payment_id: int, user_id: int, db: AsyncSession):
    result = await db.execute(
        select(Payment).where(Payment.id == payment_id)
    )
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Платёж не найден"
        )

    order_result = await db.execute(
        select(Order).where(Order.id == payment.order_id, Order.user_id == user_id)
    )
    if not order_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Платёж не найден"
        )

    return payment


async def get_all_payments(db: AsyncSession):
    result = await db.execute(
        select(Payment).order_by(Payment.created_at.desc())
    )
    return result.scalars().all()
