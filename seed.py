import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import text
from app.database.database import Base
from app.models.categories import Category
from app.models.product import Product

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine)

CATEGORIES = [
    {"name": "Мужская одежда", "description": "Стильная мужская одежда на любой вкус"},
    {"name": "Женская одежда", "description": "Элегантная женская коллекция"},
    {"name": "Обувь", "description": "Кроссовки, туфли, ботинки и сапоги"},
    {"name": "Аксессуары", "description": "Сумки, ремни, часы и украшения"},
    {"name": "Спортивная одежда", "description": "Одежда для тренировок и активного отдыха"},
    {"name": "Детская одежда", "description": "Яркая и удобная одежда для детей"},
]

PRODUCTS = [
    # Мужская одежда
    {"name": "Классическая рубашка Oxford", "description": "Белая хлопковая рубашка оверсайз с пуговицами", "price": 89.99, "color": "Белый", "size": "L", "stock": 45, "image_url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&h=600&fit=crop", "category": "Мужская одежда"},
    {"name": "Джинсы Slim Fit", "description": "Тёмно-синие джинсы прямого кроя, 100% хлопок", "price": 69.99, "color": "Синий", "size": "M", "stock": 60, "image_url": "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&h=600&fit=crop", "category": "Мужская одежда"},
    {"name": "Кожаная куртка Biker", "description": "Чёрная кожаная куртка с молниями, стиль байкер", "price": 199.99, "color": "Чёрный", "size": "L", "stock": 20, "image_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=600&fit=crop", "category": "Мужская одежда"},
    {"name": "Шерстяное пальто", "description": "Тёмно-серое пальто прямого кроя, идеально для зимы", "price": 249.99, "color": "Серый", "size": "L", "stock": 15, "image_url": "https://images.unsplash.com/photo-1544923408-75c5cef46f14?w=500&h=600&fit=crop", "category": "Мужская одежда"},
    {"name": "Худи Oversize", "description": "Серое худи оверсайз из плотного хлопка", "price": 59.99, "color": "Серый", "size": "XL", "stock": 80, "image_url": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=600&fit=crop", "category": "Мужская одежда"},

    # Женская одежда
    {"name": "Платье midi с цветочным принтом", "description": "Лёгкое платье длиной ниже колена с ярким принтом", "price": 119.99, "color": "Розовый", "size": "S", "stock": 35, "image_url": "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=500&h=600&fit=crop", "category": "Женская одежда"},
    {"name": "Кашемировый свитер", "description": "Мягкий кашемировый свитер кремового цвета", "price": 149.99, "color": "Бежевый", "size": "M", "stock": 25, "image_url": "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&h=600&fit=crop", "category": "Женская одежда"},
    {"name": "Юбка плиссе", "description": "Элегантная плиссированная юбка чёрного цвета", "price": 79.99, "color": "Чёрный", "size": "S", "stock": 40, "image_url": "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500&h=600&fit=crop", "category": "Женская одежда"},
    {"name": "Блуза с бантом", "description": "Шёлковая блуза с декоративным бантом на шее", "price": 99.99, "color": "Белый", "size": "M", "stock": 30, "image_url": "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=500&h=600&fit=crop", "category": "Женская одежда"},
    {"name": "Джинсовая куртка oversized", "description": "Свободная джинсовая куртка в стиле 90-х", "price": 109.99, "color": "Синий", "size": "M", "stock": 22, "image_url": "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=500&h=600&fit=crop", "category": "Женская одежда"},

    # Обувь
    {"name": "Nike Air Max 90", "description": "Классические кроссовки с воздушной подушкой", "price": 129.99, "color": "Красный", "size": "42", "stock": 50, "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=600&fit=crop", "category": "Обувь"},
    {"name": "Чelsea ботинки", "description": "Кожаные ботинки чelsea тёмно-коричневого цвета", "price": 159.99, "color": "Коричневый", "size": "43", "stock": 30, "image_url": "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=500&h=600&fit=crop", "category": "Обувь"},
    {"name": "Кроссовки New Balance 574", "description": "Винтажные кроссовки в серо-зелёном цвете", "price": 109.99, "color": "Серо-зелёный", "size": "41", "stock": 40, "image_url": "https://images.unsplash.com/photo-1539185441755-769473a23570?w=500&h=600&fit=crop", "category": "Обувь"},
    {"name": "Белые кеды Canvas", "description": "Минималистичные хлопковые кеды на каждый день", "price": 49.99, "color": "Белый", "size": "40", "stock": 70, "image_url": "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&h=600&fit=crop", "category": "Обувь"},
    {"name": "Кожаные лоферы", "description": "Элегантные лоферы из натуральной кожи", "price": 139.99, "color": "Тёмно-коричневый", "size": "42", "stock": 20, "image_url": "https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=500&h=600&fit=crop", "category": "Обувь"},

    # Аксессуары
    {"name": "Кожаный ремень", "description": "Классический ремень из настоящей кожи с пряжкой", "price": 49.99, "color": "Чёрный", "size": "100", "stock": 60, "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=600&fit=crop", "category": "Аксессуары"},
    {"name": "Солнцезащитные очки Aviator", "description": "Металлическая оправа, линзы с UV-защитой", "price": 89.99, "color": "Золотой", "size": "Универсальный", "stock": 35, "image_url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&h=600&fit=crop", "category": "Аксессуары"},
    {"name": "Часы Chronograph", "description": "Стильные часы с металлическим браслетом", "price": 199.99, "color": "Серебристый", "size": "Универсальный", "stock": 15, "image_url": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&h=600&fit=crop", "category": "Аксессуары"},
    {"name": "Шерстяной шарф", "description": "Тёплый шарф из мериносовой шерсти, бежевый", "price": 39.99, "color": "Бежевый", "size": "Универсальный", "stock": 45, "image_url": "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=500&h=600&fit=crop", "category": "Аксессуары"},

    # Спортивная одежда
    {"name": "Компрессионные leggings", "description": "Спортивные леггинсы высокой посадки, чёрные", "price": 59.99, "color": "Чёрный", "size": "S", "stock": 55, "image_url": "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500&h=600&fit=crop", "category": "Спортивная одежда"},
    {"name": "Спортивный костюм Adidas", "description": "Классический тренировочный костюм трёх полос", "price": 129.99, "color": "Чёрный", "size": "L", "stock": 30, "image_url": "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&h=600&fit=crop", "category": "Спортивная одежда"},
    {"name": "Брюки для бега", "description": "Лёгкие дышащие брюки с карманом на молнии", "price": 49.99, "color": "Серый", "size": "M", "stock": 40, "image_url": "https://images.unsplash.com/photo-1594381898411-846e7d193883?w=500&h=600&fit=crop", "category": "Спортивная одежда"},
    {"name": "Спортивный топ", "description": "Топ для тренировок с поддержкой, мятный", "price": 39.99, "color": "Мятный", "size": "XS", "stock": 50, "image_url": "https://images.unsplash.com/photo-1571945153237-499091c827e2?w=500&h=600&fit=crop", "category": "Спортивная одежда"},

    # Детская одежда
    {"name": "Детский комбинезон", "description": "Яркий комбинезон для малышей, 100% хлопок", "price": 34.99, "color": "Жёлтый", "size": "92", "stock": 25, "image_url": "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=500&h=600&fit=crop", "category": "Детская одежда"},
    {"name": "Детские джинсы", "description": "Удобные джинсы для детей с эластичным поясом", "price": 29.99, "color": "Синий", "size": "110", "stock": 35, "image_url": "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=500&h=600&fit=crop", "category": "Детская одежда"},
    {"name": "Детский свитер с оленями", "description": "Тёплый вязаный свитер с зимним принтом", "price": 24.99, "color": "Красный", "size": "104", "stock": 30, "image_url": "https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=500&h=600&fit=crop", "category": "Детская одежда"},
]

async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        result = await session.execute(text("SELECT COUNT(*) FROM categories"))
        count = result.scalar()
        if count > 0:
            print("Database already seeded. Dropping and re-seeding...")
            await session.execute(text("DELETE FROM products"))
            await session.execute(text("DELETE FROM categories"))
            await session.commit()

        cat_map = {}
        for cat_data in CATEGORIES:
            cat = Category(**cat_data)
            session.add(cat)
            await session.flush()
            cat_map[cat.name] = cat.id
            print(f"  + Category: {cat.name} (id={cat.id})")

        for prod_data in PRODUCTS:
            cat_name = prod_data.pop("category")
            prod_data["category_id"] = cat_map[cat_name]
            prod = Product(**prod_data)
            session.add(prod)

        await session.commit()
        print(f"\nSeeded {len(CATEGORIES)} categories and {len(PRODUCTS)} products.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(seed())
