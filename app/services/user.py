from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import User
from app.schemas.user import UserCreate
from app.core.security import hash_password


async def create_user(data: UserCreate, db: AsyncSession):
    password = hash_password(data.password)
    new_user = User(username=data.username, email=data.email, password=password, phone_number=data.phone_number, role=data.role)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


async def get_user_by_email(email: str, db: AsyncSession):
    user = await db.execute(select(User).where(User.email == email))
    return user.scalar_one_or_none()


async def get_user_by_username(username: str, db: AsyncSession):
    user = await db.execute(select(User).where(User.username == username))
    return user.scalar_one_or_none()


async def get_user_phone_number(phone_number: str, db: AsyncSession):
    user = await db.execute(select(User).where(User.phone_number == phone_number))
    return user.scalar_one_or_none()


async def update_preferences_from_history(user_id: int, db: AsyncSession) -> str | None:
    """Автоматически построить профиль предпочтений на основе истории покупок.

    Анализирует категории, цвета, размеры и ценовой диапазон покупок.
    """
    from app.models.purchase_history import PurchaseHistory
    from app.models.product import Product
    from app.models.categories import Category
    from collections import Counter

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    if not user:
        return None

    history_result = await db.execute(
        select(PurchaseHistory).where(PurchaseHistory.user_id == user_id)
    )
    history = history_result.scalars().all()
    if not history:
        return None

    category_counter = Counter()
    color_counter = Counter()
    size_counter = Counter()
    prices = []

    for h in history:
        prod_result = await db.execute(
            select(Product).where(Product.id == h.product_id)
        )
        prod = prod_result.scalar_one_or_none()
        if prod:
            prices.append(float(prod.price))
            if prod.color:
                color_counter[prod.color.lower()] += h.quantity
            if prod.size:
                size_counter[prod.size.upper()] += h.quantity
            cat_result = await db.execute(
                select(Category).where(Category.id == prod.category_id)
            )
            cat = cat_result.scalar_one_or_none()
            if cat:
                category_counter[cat.name] += h.quantity

    parts = []
    if category_counter:
        top_cats = [name for name, _ in category_counter.most_common(3)]
        parts.append(f"Любимые категории: {', '.join(top_cats)}")
    if color_counter:
        top_colors = [name for name, _ in color_counter.most_common(3)]
        parts.append(f"Предпочитаемые цвета: {', '.join(top_colors)}")
    if size_counter:
        top_sizes = [name for name, _ in size_counter.most_common(2)]
        parts.append(f"Размеры: {', '.join(top_sizes)}")
    if prices:
        avg = sum(prices) / len(prices)
        parts.append(f"Средний чек: ${avg:.0f}")

    preferences = "; ".join(parts) if parts else None

    if preferences:
        user.preferences = preferences
        await db.commit()

    return preferences