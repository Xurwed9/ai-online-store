from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.database import get_db
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse
from app.core.dependencies import get_current_admin, get_current_user
from app.models.models import User
from app.services.product import (
    get_all_products,
    get_product_by_id,
    get_products_by_category,
    search_products,
    create_new_product,
    update_product,
    delete_product,
)

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("/", response_model=list[ProductResponse])
async def get_products(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await get_all_products(db)


@router.get("/search", response_model=list[ProductResponse])
async def search(
    q: str = Query(..., min_length=1),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await search_products(q, db)


@router.get("/category/{category_id}", response_model=list[ProductResponse])
async def get_by_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await get_products_by_category(category_id, db)


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await get_product_by_id(product_id, db)


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return await create_new_product(data, db)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_prod(
    product_id: int,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return await update_product(product_id, data, db)


@router.delete("/{product_id}")
async def delete_prod(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return await delete_product(product_id, db)
