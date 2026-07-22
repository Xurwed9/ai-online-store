from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.cart import Cart
from app.models.product import Product
from app.schemas.cart import CartItemCreate, CartItemUpdate


async def get_user_cart(user_id: int, db: AsyncSession):
    result = await db.execute(
        select(Cart).where(Cart.user_id == user_id)
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
            "quantity": item.quantity,
            "product_name": product.name if product else None,
            "product_price": float(product.price) if product else None,
            "product_image": product.image_url if product else None,
        })
    return enriched


async def add_to_cart(user_id: int, data: CartItemCreate, db: AsyncSession):
    prod_result = await db.execute(
        select(Product).where(Product.id == data.product_id)
    )
    product = prod_result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Товар не найден"
        )

    if product.stock < data.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Недостаточно товара на складе"
        )

    existing = await db.execute(
        select(Cart).where(
            Cart.user_id == user_id,
            Cart.product_id == data.product_id
        )
    )
    item = existing.scalar_one_or_none()

    if item:
        item.quantity += data.quantity
    else:
        item = Cart(
            user_id=user_id,
            product_id=data.product_id,
            quantity=data.quantity
        )
        db.add(item)

    product.stock -= data.quantity

    await db.commit()
    await db.refresh(item)
    return item


async def update_cart_item(item_id: int, user_id: int, data: CartItemUpdate, db: AsyncSession):
    result = await db.execute(
        select(Cart).where(Cart.id == item_id, Cart.user_id == user_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Элемент корзины не найден"
        )

    prod_result = await db.execute(
        select(Product).where(Product.id == item.product_id)
    )
    product = prod_result.scalar_one_or_none()

    diff = data.quantity - item.quantity
    if diff > 0 and product.stock < diff:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Недостаточно товара на складе"
        )

    item.quantity = data.quantity
    product.stock -= diff

    await db.commit()
    await db.refresh(item)
    return item


async def remove_from_cart(item_id: int, user_id: int, db: AsyncSession):
    result = await db.execute(
        select(Cart).where(Cart.id == item_id, Cart.user_id == user_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Элемент корзины не найден"
        )

    prod_result = await db.execute(
        select(Product).where(Product.id == item.product_id)
    )
    product = prod_result.scalar_one_or_none()
    if product:
        product.stock += item.quantity

    await db.delete(item)
    await db.commit()
    return {"message": "Товар удалён из корзины"}


async def clear_cart(user_id: int, db: AsyncSession):
    result = await db.execute(
        select(Cart).where(Cart.user_id == user_id)
    )
    items = result.scalars().all()
    for item in items:
        prod_result = await db.execute(
            select(Product).where(Product.id == item.product_id)
        )
        product = prod_result.scalar_one_or_none()
        if product:
            product.stock += item.quantity
        await db.delete(item)
    await db.commit()
    return {"message": "Корзина очищена"}
