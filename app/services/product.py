from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.product import Product
from app.models.categories import Category
from app.schemas.product import ProductCreate, ProductUpdate


async def get_all_products(db: AsyncSession):
    result = await db.execute(select(Product))
    return result.scalars().all()


async def get_product_by_id(product_id: int, db: AsyncSession):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Товар не найден"
        )
    return product


async def get_products_by_category(category_id: int, db: AsyncSession):
    cat_result = await db.execute(
        select(Category).where(Category.id == category_id)
    )
    if not cat_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Категория не найдена"
        )
    result = await db.execute(
        select(Product).where(Product.category_id == category_id)
    )
    return result.scalars().all()


async def search_products(query: str, db: AsyncSession):
    result = await db.execute(
        select(Product).where(Product.name.ilike(f"%{query}%"))
    )
    return result.scalars().all()


async def create_new_product(data: ProductCreate, db: AsyncSession):
    cat_result = await db.execute(
        select(Category).where(Category.id == data.category_id)
    )
    if not cat_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Категория не найдена"
        )

    existing = await db.execute(
        select(Product).where(Product.name == data.name)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Товар с таким названием уже существует"
        )

    new_product = Product(
        name=data.name,
        description=data.description,
        price=data.price,
        stock=data.stock,
        image_url=data.image_url,
        is_active=data.is_active,
        category_id=data.category_id,
    )
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    return new_product


async def update_product(product_id: int, data: ProductUpdate, db: AsyncSession):
    product = await get_product_by_id(product_id, db)

    if data.category_id is not None:
        cat_result = await db.execute(
            select(Category).where(Category.id == data.category_id)
        )
        if not cat_result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Категория не найдена"
            )

    if data.name is not None:
        product.name = data.name
    if data.description is not None:
        product.description = data.description
    if data.price is not None:
        product.price = data.price
    if data.stock is not None:
        product.stock = data.stock
    if data.image_url is not None:
        product.image_url = data.image_url
    if data.is_active is not None:
        product.is_active = data.is_active
    if data.category_id is not None:
        product.category_id = data.category_id

    await db.commit()
    await db.refresh(product)
    return product


async def delete_product(product_id: int, db: AsyncSession):
    product = await get_product_by_id(product_id, db)
    await db.delete(product)
    await db.commit()
    return {"message": "Товар успешно удалён"}
