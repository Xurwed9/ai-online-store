from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.database import get_db
from app.models.models import User
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.core.dependencies import get_current_admin,get_current_user
from app.services.category import (
    get_all_categories, 
    get_category_by_id, 
    create_new_category, 
    update_category, 
    delete_category
)

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("/", response_model=list[CategoryResponse])
async def get_categories(db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    return await get_all_categories(db)

@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: int, db: AsyncSession = Depends(get_db),user: User = Depends(get_current_user)):
    return await get_category_by_id(category_id, db)

@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    data: CategoryCreate, 
    db: AsyncSession = Depends(get_db), 
    admin: User = Depends(get_current_admin)
):
    return await create_new_category(data, db)

@router.put("/{category_id}", response_model=CategoryResponse)
async def update_cat(
    category_id: int, 
    data: CategoryUpdate, 
    db: AsyncSession = Depends(get_db), 
    admin: User = Depends(get_current_admin)
):
    return await update_category(category_id, data, db)

@router.delete("/{category_id}")
async def delete_cat(
    category_id: int, 
    db: AsyncSession = Depends(get_db), 
    admin: User = Depends(get_current_admin)
):
    return await delete_category(category_id, db)