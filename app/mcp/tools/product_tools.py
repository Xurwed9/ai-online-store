from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.models.product import Product
from app.models.categories import Category


async def search_products(
    category: str | None = None,
    color: str | None = None,
    size: str | None = None,
    max_price: float | None = None,
    db: AsyncSession = None,
) -> list[dict]:
    """Поиск товаров по параметрам: категория, цвет, размер, максимальная цена."""
    if db is None:
        return []

    filters = [Product.is_active == True]

    if category:
        cat_result = await db.execute(
            select(Category).where(Category.name.ilike(f"%{category}%"))
        )
    cat = cat_result.scalar_one_or_none()
    if cat:
        filters.append(Product.category_id == cat.id)

    if color:
        filters.append(Product.color.ilike(f"%{color}%"))

    if size:
        filters.append(Product.size.ilike(f"%{size}%"))

    if max_price is not None:
        filters.append(Product.price <= max_price)

    result = await db.execute(
        select(Product).where(and_(*filters)).limit(10)
    )
    products = result.scalars().all()

    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "price": float(p.price),
            "color": p.color,
            "size": p.size,
            "stock": p.stock,
            "image_url": p.image_url,
            "category_id": p.category_id,
        }
        for p in products
    ]


async def get_product_details(product_id: int, db: AsyncSession) -> dict | None:
    """Получить полную информацию о товаре по ID."""
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        return None

    cat_result = await db.execute(
        select(Category).where(Category.id == product.category_id)
    )
    category = cat_result.scalar_one_or_none()

    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": float(product.price),
        "color": product.color,
        "size": product.size,
        "stock": product.stock,
        "image_url": product.image_url,
        "is_active": product.is_active,
        "category": category.name if category else None,
    }


async def check_stock(product_id: int, db: AsyncSession) -> dict:
    """Проверить наличие товара на складе."""
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        return {"available": False, "error": "Товар не найден"}

    return {
        "available": product.stock > 0,
        "product_id": product.id,
        "product_name": product.name,
        "stock": product.stock,
        "color": product.color,
        "size": product.size,
    }


async def get_all_categories(db: AsyncSession) -> list[dict]:
    """Получить список всех категорий."""
    result = await db.execute(select(Category))
    categories = result.scalars().all()
    return [{"id": c.id, "name": c.name} for c in categories]
