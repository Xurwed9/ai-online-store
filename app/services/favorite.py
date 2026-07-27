from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.favorite import Favorite
from app.models.product import Product


async def get_user_favorites(user_id: int, db: AsyncSession):
    result = await db.execute(
        select(Favorite).where(Favorite.user_id == user_id).order_by(Favorite.created_at.desc())
    )
    items = result.scalars().all()
    enriched = []
    for item in items:
        prod_result = await db.execute(
            select(Product).where(Product.id == item.product_id)
        )
        product = prod_result.scalar_one_or_none()
        enriched.append({
            "id": item.id,
            "user_id": item.user_id,
            "product_id": item.product_id,
            "product_name": product.name if product else None,
            "product_price": float(product.price) if product else None,
            "product_image": product.image_url if product else None,
            "product_description": product.description if product else None,
            "product_color": product.color if product else None,
            "product_size": product.size if product else None,
            "product_stock": product.stock if product else None,
        })
    return enriched


async def add_to_favorites(user_id: int, product_id: int, db: AsyncSession):
    prod_result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = prod_result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Товар не найден"
        )

    existing = await db.execute(
        select(Favorite).where(
            Favorite.user_id == user_id,
            Favorite.product_id == product_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Товар уже в избранном"
        )

    fav = Favorite(user_id=user_id, product_id=product_id)
    db.add(fav)
    await db.commit()
    await db.refresh(fav)
    return {"message": "Товар добавлен в избранное", "id": fav.id}


async def remove_from_favorites(user_id: int, product_id: int, db: AsyncSession):
    result = await db.execute(
        select(Favorite).where(
            Favorite.user_id == user_id,
            Favorite.product_id == product_id
        )
    )
    fav = result.scalar_one_or_none()
    if not fav:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Товар не в избранном"
        )

    await db.delete(fav)
    await db.commit()
    return {"message": "Товар удалён из избранного"}


async def check_is_favorite(user_id: int, product_id: int, db: AsyncSession):
    result = await db.execute(
        select(Favorite).where(
            Favorite.user_id == user_id,
            Favorite.product_id == product_id
        )
    )
    fav = result.scalar_one_or_none()
    return {"is_favorite": fav is not None}
