from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.database import get_db
from app.schemas.favorite import FavoriteCreate
from app.core.dependencies import get_current_user
from app.models.models import User
from app.services.favorite import (
    get_user_favorites,
    add_to_favorites,
    remove_from_favorites,
    check_is_favorite,
)

router = APIRouter(prefix="/favorites", tags=["Favorites"])


@router.get("/")
async def get_favorites(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await get_user_favorites(user.id, db)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def add_favorite(
    data: FavoriteCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await add_to_favorites(user.id, data.product_id, db)


@router.delete("/{product_id}")
async def remove_favorite(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await remove_from_favorites(user.id, product_id, db)


@router.get("/check/{product_id}")
async def check_favorite(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await check_is_favorite(user.id, product_id, db)
