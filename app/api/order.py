from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.database import get_db
from app.schemas.order import OrderResponse, OrderUpdateStatus
from app.core.dependencies import get_current_user, get_current_admin
from app.models.models import User
from app.services.order import (
    create_order_from_cart,
    get_user_orders,
    get_order_by_id,
    update_order_status,
    cancel_order,
)

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_order(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await create_order_from_cart(user.id, db)


@router.get("/")
async def get_orders(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await get_user_orders(user.id, db)


@router.get("/{order_id}")
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await get_order_by_id(order_id, user.id, db)


@router.put("/{order_id}/status")
async def change_status(
    order_id: int,
    data: OrderUpdateStatus,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return await update_order_status(order_id, data.status, db)


@router.post("/{order_id}/cancel")
async def cancel(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await cancel_order(order_id, user.id, db)
