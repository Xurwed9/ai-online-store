from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.review import Review
from app.models.product import Product
from app.models.models import User
from app.schemas.review import ReviewCreate, ReviewUpdate


async def get_reviews_by_product(product_id: int, db: AsyncSession):
    product = await db.execute(select(Product).where(Product.id == product_id))
    if not product.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Товар не найден",
        )

    result = await db.execute(
        select(Review, User.username)
        .join(User, Review.user_id == User.id)
        .where(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
    )
    reviews = []
    for review, username in result.all():
        reviews.append({
            "id": review.id,
            "user_id": review.user_id,
            "product_id": review.product_id,
            "rating": review.rating,
            "comment": review.comment,
            "created_at": review.created_at,
            "username": username,
        })
    return reviews


async def create_review(product_id: int, user_id: int, data: ReviewCreate, db: AsyncSession):
    product = await db.execute(select(Product).where(Product.id == product_id))
    if not product.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Товар не найден",
        )

    if data.rating is None and data.comment is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Укажите оценку и/или комментарий",
        )

    existing = await db.execute(
        select(Review).where(Review.user_id == user_id, Review.product_id == product_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Вы уже оставили отзыв на этот товар",
        )

    review = Review(
        user_id=user_id,
        product_id=product_id,
        rating=data.rating,
        comment=data.comment,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review


async def update_review(review_id: int, user_id: int, data: ReviewUpdate, db: AsyncSession):
    result = await db.execute(
        select(Review).where(Review.id == review_id, Review.user_id == user_id)
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Отзыв не найден",
        )

    if data.rating is not None:
        review.rating = data.rating
    if data.comment is not None:
        review.comment = data.comment

    await db.commit()
    await db.refresh(review)
    return review


async def delete_review(review_id: int, user_id: int, db: AsyncSession):
    result = await db.execute(
        select(Review).where(Review.id == review_id, Review.user_id == user_id)
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Отзыв не найден",
        )

    await db.delete(review)
    await db.commit()
    return {"message": "Отзыв удалён"}


async def get_product_rating(product_id: int, db: AsyncSession):
    result = await db.execute(
        select(Review.rating).where(Review.product_id == product_id, Review.rating.isnot(None))
    )
    ratings = [r[0] for r in result.all()]
    if not ratings:
        return {"average": 0, "count": 0}
    return {
        "average": round(sum(ratings) / len(ratings), 1),
        "count": len(ratings),
    }
