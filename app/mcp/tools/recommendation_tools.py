from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sql_func
from app.models.purchase_history import PurchaseHistory
from app.models.product import Product
from app.models.categories import Category


async def recommend_products(user_id: int, db: AsyncSession) -> list[dict]:
    """Рекомендовать товары на основе истории покупок пользователя.

    Находит товары из тех же категорий и цветов, которые пользователь уже покупал.
    """
    if db is None:
        return []

    history_result = await db.execute(
        select(PurchaseHistory).where(PurchaseHistory.user_id == user_id)
    )
    history = history_result.scalars().all()

    if not history:
        popular_result = await db.execute(
            select(Product)
            .where(Product.is_active == True, Product.stock > 0)
            .order_by(Product.id.desc())
            .limit(5)
        )
        products = popular_result.scalars().all()
        return [
            {
                "id": p.id,
                "name": p.name,
                "price": float(p.price),
                "color": p.color,
                "size": p.size,
                "reason": "Популярный товар",
            }
            for p in products
        ]

    purchased_product_ids = set()
    category_ids = set()
    colors = set()
    for h in history:
        purchased_product_ids.add(h.product_id)
        prod_result = await db.execute(
            select(Product).where(Product.id == h.product_id)
        )
        prod = prod_result.scalar_one_or_none()
        if prod:
            category_ids.add(prod.category_id)
            if prod.color:
                colors.add(prod.color.lower())

    filters = [
        Product.is_active == True,
        Product.stock > 0,
        Product.id.notin_(purchased_product_ids) if purchased_product_ids else True,
    ]

    if category_ids:
        from sqlalchemy import or_
        filters.append(
            or_(
                Product.category_id.in_(category_ids),
                Product.color.ilike(list(colors)[0]) if colors else False,
            )
        )

    rec_result = await db.execute(
        select(Product).where(*filters).limit(5)
    )
    recommendations = rec_result.scalars().all()

    if not recommendations:
        fallback_result = await db.execute(
            select(Product)
            .where(Product.is_active == True, Product.stock > 0)
            .order_by(Product.id.desc())
            .limit(5)
        )
        recommendations = fallback_result.scalars().all()

    results = []
    for p in recommendations:
        reason = "Похоже на то, что вы покупали"
        if p.category_id in category_ids:
            cat_result = await db.execute(
                select(Category).where(Category.id == p.category_id)
            )
            cat = cat_result.scalar_one_or_none()
            if cat:
                reason = f"Из категории «{cat.name}», которую вы покупали"
        elif p.color and p.color.lower() in colors:
            reason = f"Цвет «{p.color}», который вам нравится"

        results.append({
            "id": p.id,
            "name": p.name,
            "price": float(p.price),
            "color": p.color,
            "size": p.size,
            "reason": reason,
        })

    return results


async def get_similar_products(product_id: int, db: AsyncSession) -> list[dict]:
    """Найти похожие товары (та же категория + цвет)."""
    if db is None:
        return []

    prod_result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = prod_result.scalar_one_or_none()
    if not product:
        return []

    similar_result = await db.execute(
        select(Product).where(
            Product.is_active == True,
            Product.stock > 0,
            Product.id != product_id,
            Product.category_id == product.category_id,
        ).limit(5)
    )
    similar = similar_result.scalars().all()

    return [
        {
            "id": p.id,
            "name": p.name,
            "price": float(p.price),
            "color": p.color,
            "size": p.size,
            "reason": "Похожий товар из той же категории",
        }
        for p in similar
    ]


async def get_frequently_bought_together(product_id: int, db: AsyncSession) -> list[dict]:
    """Найти товары, которые часто покупают вместе с указанным.

    Анализирует purchase_history: находит другие заказы, в которых
    есть данный товар, и считает какие товары встречаются чаще всего.
    """
    if db is None:
        return []

    prod_result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = prod_result.scalar_one_or_none()
    if not product:
        return []

    orders_with_product = await db.execute(
        select(PurchaseHistory.order_id)
        .where(PurchaseHistory.product_id == product_id, PurchaseHistory.order_id.isnot(None))
        .distinct()
    )
    order_ids = [row[0] for row in orders_with_product.fetchall()]

    if not order_ids:
        return []

    other_purchases = await db.execute(
        select(PurchaseHistory.product_id, sql_func.sum(PurchaseHistory.quantity).label("total_qty"))
        .where(
            PurchaseHistory.order_id.in_(order_ids),
            PurchaseHistory.product_id != product_id,
        )
        .group_by(PurchaseHistory.product_id)
        .order_by(sql_func.sum(PurchaseHistory.quantity).desc())
        .limit(5)
    )
    frequent = other_purchases.fetchall()

    results = []
    for product_id_fbt, total_qty in frequent:
        prod = await db.execute(
            select(Product).where(Product.id == product_id_fbt, Product.is_active == True)
        )
        p = prod.scalar_one_or_none()
        if p and p.stock > 0:
            results.append({
                "id": p.id,
                "name": p.name,
                "price": float(p.price),
                "color": p.color,
                "size": p.size,
                "times_bought_together": int(total_qty),
                "reason": f"Часто покупают вместе с «{product.name}»",
            })

    return results
