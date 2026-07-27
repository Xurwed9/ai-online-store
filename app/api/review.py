from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.database import get_db
from app.schemas.review import ReviewCreate, ReviewUpdate, ReviewResponse
from app.core.dependencies import get_current_user
from app.models.models import User
from app.services.review import (
    get_reviews_by_product,
    create_review,
    update_review,
    delete_review,
    get_product_rating,
)

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.get("/product/{product_id}")
async def get_reviews(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await get_reviews_by_product(product_id, db)


@router.get("/product/{product_id}/rating")
async def get_rating(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await get_product_rating(product_id, db)


@router.post("/product/{product_id}", status_code=status.HTTP_201_CREATED)
async def create_new_review(
    product_id: int,
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    review = await create_review(product_id, user.id, data, db)
    return {
        "id": review.id,
        "user_id": review.user_id,
        "product_id": review.product_id,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at,
    }


@router.put("/{review_id}")
async def update_existing_review(
    review_id: int,
    data: ReviewUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await update_review(review_id, user.id, data, db)


@router.delete("/{review_id}")
async def delete_existing_review(
    review_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await delete_review(review_id, user.id, db)
