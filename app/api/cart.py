from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.database import get_db
from app.schemas.cart import CartItemCreate, CartItemUpdate, CartItemResponse
from app.core.dependencies import get_current_user
from app.models.models import User
from app.services.cart import (
    get_user_cart,
    add_to_cart,
    update_cart_item,
    remove_from_cart,
    clear_cart,
)

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.get("/")
async def get_cart(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await get_user_cart(user.id, db)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def add_item(
    data: CartItemCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await add_to_cart(user.id, data, db)


@router.put("/{item_id}")
async def update_item(
    item_id: int,
    data: CartItemUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await update_cart_item(item_id, user.id, data, db)


@router.delete("/{item_id}")
async def delete_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await remove_from_cart(item_id, user.id, db)


@router.delete("/")
async def clear(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await clear_cart(user.id, db)
