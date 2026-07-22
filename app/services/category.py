from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.models.categories import Category
from app.schemas.category import CategoryCreate,CategoryUpdate

async def get_all_categories(db: AsyncSession):
    result = await db.execute(select(Category))
    return result.scalars().all()

async def get_category_by_id(category_id: int, db: AsyncSession):
    result = await db.execute(select(Category).where(Category.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    return category

async def create_new_category(data: CategoryCreate, db: AsyncSession):
    existing = await db.execute(select(Category).where(Category.name == data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Категория с таким названием уже существует"
        )
    
    new_category = Category(
        name=data.name,
        description=data.description,
        is_active=data.is_active
    )
    db.add(new_category)
    await db.commit()
    await db.refresh(new_category)
    return new_category



async def update_category(category_id: int, data: CategoryUpdate, db: AsyncSession):
    category = await get_category_by_id(category_id, db)
    
    if data.name is not None:
        category.name = data.name
    if data.description is not None:
        category.description = data.description
    if data.is_active is not None:
        category.is_active = data.is_active

    await db.commit()
    await db.refresh(category)
    return category


async def delete_category(category_id: int, db: AsyncSession):
    category = await get_category_by_id(category_id, db)
    await db.delete(category)
    await db.commit()
    return {"message": "Категория успешно удалена"}