import json
import os
import sys
import asyncio
import logging
import concurrent.futures
from dotenv import load_dotenv

_PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _PROJECT_ROOT not in sys.path:
    sys.path.insert(0, _PROJECT_ROOT)

load_dotenv(override=True)

logging.basicConfig(level=logging.WARNING)
logging.getLogger("mcp").setLevel(logging.WARNING)
logging.getLogger("httpx").setLevel(logging.WARNING)

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("Shopping Assistant Server")


def _run_async(coro):
    """Run an async coroutine from a sync context (inside already running event loop)."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = None

    if loop and loop.is_running():
        with concurrent.futures.ThreadPoolExecutor() as pool:
            future = pool.submit(asyncio.run, coro)
            return future.result()
    else:
        return asyncio.run(coro)


def _get_db():
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
    import app.models.models
    import app.models.categories
    import app.models.product
    import app.models.cart
    import app.models.order
    import app.models.payment
    import app.models.purchase_history
    import app.models.favorite

    engine = create_async_engine(os.getenv("DATABASE_URL", ""), echo=False)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    return session_factory()


# ============================================================
# Product Tools
# ============================================================


@mcp.tool()
def search_products(
    keyword: str = "",
    category: str = "",
    color: str = "",
    size: str = "",
    min_price: float = 0,
    max_price: float = 0,
    sort: str = "",
) -> str:
    """
    Search products by keyword, category, color, size and price range.
    Returns list of matching products with id, name, price, color, size, stock.
    Sort options: price_asc, price_desc, newest.
    """
    return _run_async(_search_products(keyword, category, color, size, min_price, max_price, sort))


async def _search_products(keyword, category, color, size, min_price, max_price, sort):
    from sqlalchemy import select, and_, or_
    from app.models.product import Product
    from app.models.categories import Category

    db = _get_db()
    async with db:
        filters = [Product.is_active == True]

        if keyword:
            keyword_filter = or_(
                Product.name.ilike(f"%{keyword}%"),
                Product.description.ilike(f"%{keyword}%"),
            )
            filters.append(keyword_filter)

        if category:
            cat_result = await db.execute(
                select(Category).where(Category.name.ilike(f"%{category}%"))
            )
            cats = cat_result.scalars().all()
            if cats:
                filters.append(Product.category_id.in_([c.id for c in cats]))

        if color:
            filters.append(Product.color.ilike(f"%{color}%"))

        if size:
            filters.append(Product.size.ilike(f"%{size}%"))

        if min_price > 0:
            filters.append(Product.price >= min_price)

        if max_price > 0:
            filters.append(Product.price <= max_price)

        query = select(Product).where(and_(*filters))

        if sort == "price_asc":
            query = query.order_by(Product.price.asc())
        elif sort == "price_desc":
            query = query.order_by(Product.price.desc())
        elif sort == "newest":
            query = query.order_by(Product.id.desc())
        else:
            query = query.order_by(Product.id.desc())

        result = await db.execute(query.limit(10))
        products = result.scalars().all()

        return json.dumps([
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "price": float(p.price),
                "color": p.color,
                "size": p.size,
                "stock": p.stock,
                "image_url": p.image_url,
            }
            for p in products
        ], ensure_ascii=False)


@mcp.tool()
def get_product_details(product_id: int) -> str:
    """Get detailed information about a product by its ID."""
    return _run_async(_get_product_details(product_id))


async def _get_product_details(product_id):
    from sqlalchemy import select
    from app.models.product import Product
    from app.models.categories import Category

    db = _get_db()
    async with db:
        result = await db.execute(select(Product).where(Product.id == product_id))
        product = result.scalar_one_or_none()
        if not product:
            return json.dumps({"error": "Product not found"})

        cat_result = await db.execute(
            select(Category).where(Category.id == product.category_id)
        )
        category = cat_result.scalar_one_or_none()

        return json.dumps({
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": float(product.price),
            "color": product.color,
            "size": product.size,
            "stock": product.stock,
            "image_url": product.image_url,
            "category": category.name if category else None,
        }, ensure_ascii=False)


@mcp.tool()
def check_stock(product_id: int, size: str = "", color: str = "") -> str:
    """Check product stock availability, optionally filtered by size and/or color."""
    return _run_async(_check_stock(product_id, size, color))


async def _check_stock(product_id, size, color):
    from sqlalchemy import select
    from app.models.product import Product

    db = _get_db()
    async with db:
        result = await db.execute(select(Product).where(Product.id == product_id))
        product = result.scalar_one_or_none()
        if not product:
            return json.dumps({"available": False, "error": "Product not found"})

        available = product.stock > 0
        if size and product.size:
            available = available and product.size.upper() == size.upper()
        if color and product.color:
            available = available and product.color.lower() == color.lower()

        return json.dumps({
            "available": available,
            "product_id": product.id,
            "product_name": product.name,
            "stock": product.stock,
            "color": product.color,
            "size": product.size,
        }, ensure_ascii=False)


@mcp.tool()
def get_all_categories() -> str:
    """Get list of all product categories."""
    return _run_async(_get_all_categories())


async def _get_all_categories():
    from sqlalchemy import select
    from app.models.categories import Category

    db = _get_db()
    async with db:
        result = await db.execute(select(Category))
        categories = result.scalars().all()
        return json.dumps([{"id": c.id, "name": c.name} for c in categories], ensure_ascii=False)


@mcp.tool()
def create_product(
    name: str,
    price: float,
    category_id: int = 0,
    category_name: str = "",
    description: str = "",
    color: str = "",
    size: str = "",
    stock: int = 0,
    image_url: str = "",
) -> str:
    """
    Create a new product in the store. Admin only.
    Provide category_id OR category_name to assign a category.
    """
    return _run_async(_create_product(name, price, category_id, category_name, description, color, size, stock, image_url))


async def _create_product(name, price, category_id, category_name, description, color, size, stock, image_url):
    from sqlalchemy import select
    from app.models.product import Product
    from app.models.categories import Category

    db = _get_db()
    async with db:
        if not category_id and category_name:
            cat_result = await db.execute(
                select(Category).where(Category.name.ilike(f"%{category_name}%"))
            )
            cat = cat_result.scalar_one_or_none()
            if cat:
                category_id = cat.id

        if not category_id:
            return json.dumps({"success": False, "error": "Category not found. Provide category_id or category_name."})

        product = Product(
            name=name,
            description=description or None,
            price=price,
            color=color or None,
            size=size or None,
            stock=stock,
            image_url=image_url or None,
            category_id=category_id,
            is_active=True,
        )
        db.add(product)
        await db.commit()
        await db.refresh(product)

        return json.dumps({
            "success": True,
            "message": f"Product '{product.name}' created successfully",
            "id": product.id,
            "name": product.name,
            "price": float(product.price),
            "color": product.color,
            "size": product.size,
            "stock": product.stock,
            "category_id": product.category_id,
        }, ensure_ascii=False)


# ============================================================
# Admin Product Management Tools
# ============================================================


def _validate_admin(user_role: str) -> dict | None:
    """Validate admin role. Returns error dict if not admin, None if valid."""
    if user_role != "admin":
        return {"error": "Access denied", "message": "Only admin can execute this tool", "status": 403}
    return None


@mcp.tool()
def product_create(
    name: str,
    description: str = "",
    price: float = 0,
    category_id: int = 0,
    category_name: str = "",
    stock: int = 0,
    images: str = "",
    user_id: int = 0,
    user_role: str = "",
) -> str:
    """
    Create a new product. Admin only.
    Parameters: name, description, price, category_id OR category_name, stock, images, user_id, user_role.
    """
    auth_error = _validate_admin(user_role)
    if auth_error:
        return json.dumps(auth_error, ensure_ascii=False)
    return _run_async(_product_create(name, description, price, category_id, category_name, stock, images))


async def _product_create(name, description, price, category_id, category_name, stock, images):
    from sqlalchemy import select
    from app.models.product import Product
    from app.models.categories import Category

    db = _get_db()
    async with db:
        if not category_id and category_name:
            cat_result = await db.execute(
                select(Category).where(Category.name.ilike(f"%{category_name}%"))
            )
            cat = cat_result.scalar_one_or_none()
            if cat:
                category_id = cat.id

        if not category_id:
            return json.dumps({"success": False, "error": "Category not found. Provide category_id or category_name."}, ensure_ascii=False)

        cat_result = await db.execute(select(Category).where(Category.id == category_id))
        if not cat_result.scalar_one_or_none():
            return json.dumps({"success": False, "error": "Category not found"}, ensure_ascii=False)

        product = Product(
            name=name,
            description=description or None,
            price=price,
            stock=stock,
            image_url=images or None,
            category_id=category_id,
            is_active=True,
        )
        db.add(product)
        await db.commit()
        await db.refresh(product)

        return json.dumps({
            "success": True,
            "message": f"Product '{product.name}' created successfully",
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": float(product.price),
            "stock": product.stock,
            "category_id": product.category_id,
        }, ensure_ascii=False)


@mcp.tool()
def product_update(
    product_id: int,
    fields: str = "{}",
    user_id: int = 0,
    user_role: str = "",
) -> str:
    """
    Update any product field. Admin only.
    Parameters: product_id, fields (JSON string with fields to update), user_id, user_role.
    """
    auth_error = _validate_admin(user_role)
    if auth_error:
        return json.dumps(auth_error, ensure_ascii=False)
    return _run_async(_product_update(product_id, fields))


async def _product_update(product_id, fields_str):
    from sqlalchemy import select
    from app.models.product import Product
    from app.models.categories import Category

    try:
        fields = json.loads(fields_str) if isinstance(fields_str, str) else fields_str
    except json.JSONDecodeError:
        return json.dumps({"success": False, "error": "Invalid JSON in fields parameter"}, ensure_ascii=False)

    db = _get_db()
    async with db:
        result = await db.execute(select(Product).where(Product.id == product_id))
        product = result.scalar_one_or_none()
        if not product:
            return json.dumps({"success": False, "error": "Product not found"}, ensure_ascii=False)

        if "category_id" in fields and fields["category_id"]:
            cat_result = await db.execute(
                select(Category).where(Category.id == fields["category_id"])
            )
            if not cat_result.scalar_one_or_none():
                return json.dumps({"success": False, "error": "Category not found"}, ensure_ascii=False)

        updatable_fields = ["name", "description", "price", "color", "size", "stock", "image_url", "is_active", "category_id"]
        updated = []
        for field in updatable_fields:
            if field in fields:
                setattr(product, field, fields[field])
                updated.append(field)

        if not updated:
            return json.dumps({"success": False, "error": "No valid fields to update"}, ensure_ascii=False)

        await db.commit()
        await db.refresh(product)

        return json.dumps({
            "success": True,
            "message": f"Product #{product.id} updated: {', '.join(updated)}",
            "id": product.id,
            "name": product.name,
            "price": float(product.price),
            "stock": product.stock,
            "updated_fields": updated,
        }, ensure_ascii=False)


@mcp.tool()
def product_delete(
    product_id: int,
    confirm: bool = False,
    user_id: int = 0,
    user_role: str = "",
) -> str:
    """
    Delete a product. Admin only. Requires confirmation.
    Parameters: product_id, confirm (must be True), user_id, user_role.
    """
    auth_error = _validate_admin(user_role)
    if auth_error:
        return json.dumps(auth_error, ensure_ascii=False)
    return _run_async(_product_delete(product_id, confirm))


async def _product_delete(product_id, confirm):
    from sqlalchemy import select
    from app.models.product import Product

    db = _get_db()
    async with db:
        result = await db.execute(select(Product).where(Product.id == product_id))
        product = result.scalar_one_or_none()
        if not product:
            return json.dumps({"success": False, "error": "Product not found"}, ensure_ascii=False)

        if not confirm:
            return json.dumps({
                "success": False,
                "confirm_required": True,
                "product_id": product.id,
                "product_name": product.name,
                "message": f"Are you sure you want to delete Product #{product.id} '{product.name}'?",
            }, ensure_ascii=False)

        product_name = product.name
        await db.delete(product)
        await db.commit()

        return json.dumps({
            "success": True,
            "message": f"Product #{product_id} '{product_name}' deleted successfully",
        }, ensure_ascii=False)


@mcp.tool()
def product_list() -> str:
    """
    Return all products. Everyone can use this tool.
    No authentication required.
    """
    return _run_async(_product_list())


async def _product_list():
    from sqlalchemy import select
    from app.models.product import Product
    from app.models.categories import Category

    db = _get_db()
    async with db:
        result = await db.execute(select(Product).where(Product.is_active == True).limit(50))
        products = result.scalars().all()

        items = []
        for p in products:
            cat_result = await db.execute(select(Category).where(Category.id == p.category_id))
            category = cat_result.scalar_one_or_none()
            items.append({
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "price": float(p.price),
                "color": p.color,
                "size": p.size,
                "stock": p.stock,
                "image_url": p.image_url,
                "category": category.name if category else None,
            })

        return json.dumps(items, ensure_ascii=False)


@mcp.tool()
def product_search(
    query: str = "",
    category: str = "",
    min_price: float = 0,
    max_price: float = 0,
) -> str:
    """
    Search products. Everyone can use this tool.
    Parameters: query (name search), category, min_price, max_price.
    """
    return _run_async(_product_search(query, category, min_price, max_price))


async def _product_search(query, category, min_price, max_price):
    from sqlalchemy import select, and_, or_
    from app.models.product import Product
    from app.models.categories import Category

    db = _get_db()
    async with db:
        filters = [Product.is_active == True]

        if query:
            filters.append(Product.name.ilike(f"%{query}%"))

        if category:
            cat_result = await db.execute(
                select(Category).where(Category.name.ilike(f"%{category}%"))
            )
            cats = cat_result.scalars().all()
            if cats:
                filters.append(Product.category_id.in_([c.id for c in cats]))

        if min_price > 0:
            filters.append(Product.price >= min_price)

        if max_price > 0:
            filters.append(Product.price <= max_price)

        result = await db.execute(
            select(Product).where(and_(*filters)).limit(20)
        )
        products = result.scalars().all()

        items = []
        for p in products:
            cat_result = await db.execute(select(Category).where(Category.id == p.category_id))
            category_obj = cat_result.scalar_one_or_none()
            items.append({
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "price": float(p.price),
                "color": p.color,
                "size": p.size,
                "stock": p.stock,
                "image_url": p.image_url,
                "category": category_obj.name if category_obj else None,
            })

        return json.dumps(items, ensure_ascii=False)


# ============================================================
# Cart Tools
# ============================================================


@mcp.tool()
def add_to_cart(user_id: int, product_id: int, quantity: int = 1) -> str:
    """Add a product to the user's cart."""
    return _run_async(_add_to_cart(user_id, product_id, quantity))


async def _add_to_cart(user_id, product_id, quantity):
    from sqlalchemy import select
    from app.models.cart import Cart
    from app.models.product import Product

    db = _get_db()
    async with db:
        result = await db.execute(
            select(Product).where(Product.id == product_id, Product.is_active == True)
        )
        product = result.scalar_one_or_none()
        if not product:
            return json.dumps({"success": False, "error": "Product not found"})

        if product.stock < quantity:
            return json.dumps({"success": False, "error": f"Not enough stock. Available: {product.stock}"})

        existing = await db.execute(
            select(Cart).where(Cart.user_id == user_id, Cart.product_id == product_id)
        )
        cart_item = existing.scalar_one_or_none()

        if cart_item:
            new_qty = cart_item.quantity + quantity
            if new_qty > product.stock:
                return json.dumps({"success": False, "error": f"Cannot add {quantity}. Stock: {product.stock}, already in cart: {cart_item.quantity}"})
            cart_item.quantity = new_qty
        else:
            cart_item = Cart(user_id=user_id, product_id=product_id, quantity=quantity)
            db.add(cart_item)

        await db.commit()
        await db.refresh(cart_item)

        return json.dumps({
            "success": True,
            "message": f"Added '{product.name}' to cart (x{cart_item.quantity})",
            "cart_item_id": cart_item.id,
            "product_name": product.name,
            "quantity": cart_item.quantity,
            "price": float(product.price),
        }, ensure_ascii=False)


@mcp.tool()
def get_cart(user_id: int) -> str:
    """Get contents of the user's cart."""
    return _run_async(_get_cart(user_id))


async def _get_cart(user_id):
    from sqlalchemy import select
    from app.models.cart import Cart
    from app.models.product import Product

    db = _get_db()
    async with db:
        result = await db.execute(select(Cart).where(Cart.user_id == user_id))
        items = result.scalars().all()

        cart = []
        for item in items:
            prod_result = await db.execute(select(Product).where(Product.id == item.product_id))
            product = prod_result.scalar_one_or_none()
            if product:
                cart.append({
                    "cart_item_id": item.id,
                    "product_id": product.id,
                    "product_name": product.name,
                    "quantity": item.quantity,
                    "price": float(product.price),
                    "subtotal": float(product.price) * item.quantity,
                })

        return json.dumps(cart, ensure_ascii=False)


@mcp.tool()
def get_cart_total(user_id: int) -> str:
    """Get cart total with discounts. 5+ items=5%%, 10+ items=10%%, total>500=7%%."""
    return _run_async(_get_cart_total(user_id))


async def _get_cart_total(user_id):
    from sqlalchemy import select
    from app.models.cart import Cart
    from app.models.product import Product

    db = _get_db()
    async with db:
        result = await db.execute(select(Cart).where(Cart.user_id == user_id))
        items = result.scalars().all()

        if not items:
            return json.dumps({"success": True, "items_count": 0, "subtotal": 0, "discount_percent": 0, "discount_amount": 0, "total": 0})

        total_items = 0
        subtotal = 0
        for item in items:
            prod_result = await db.execute(select(Product).where(Product.id == item.product_id))
            product = prod_result.scalar_one_or_none()
            if product:
                total_items += item.quantity
                subtotal += float(product.price) * item.quantity

        discount_percent = 0
        if total_items >= 10:
            discount_percent = 10
        elif total_items >= 5:
            discount_percent = 5
        if subtotal > 500:
            discount_percent = max(discount_percent, 7)

        discount_amount = round(subtotal * discount_percent / 100, 2)
        total = round(subtotal - discount_amount, 2)

        return json.dumps({
            "success": True,
            "items_count": len(items),
            "total_units": total_items,
            "subtotal": subtotal,
            "discount_percent": discount_percent,
            "discount_amount": discount_amount,
            "total": total,
        }, ensure_ascii=False)


@mcp.tool()
def remove_from_cart(user_id: int, product_id: int) -> str:
    """Remove a product from the user's cart."""
    return _run_async(_remove_from_cart(user_id, product_id))


async def _remove_from_cart(user_id, product_id):
    from sqlalchemy import select
    from app.models.cart import Cart
    from app.models.product import Product

    db = _get_db()
    async with db:
        existing = await db.execute(
            select(Cart).where(Cart.user_id == user_id, Cart.product_id == product_id)
        )
        cart_item = existing.scalar_one_or_none()
        if not cart_item:
            return json.dumps({"success": False, "error": "Item not found in cart"})

        prod_result = await db.execute(select(Product).where(Product.id == product_id))
        product = prod_result.scalar_one_or_none()
        product_name = product.name if product else "Product"

        await db.delete(cart_item)
        await db.commit()

        return json.dumps({"success": True, "message": f"'{product_name}' removed from cart"}, ensure_ascii=False)


@mcp.tool()
def update_cart_quantity(user_id: int, product_id: int, quantity: int) -> str:
    """Update the quantity of a product in the user's cart. Set quantity to 0 to remove."""
    return _run_async(_update_cart_quantity(user_id, product_id, quantity))


async def _update_cart_quantity(user_id, product_id, quantity):
    from sqlalchemy import select
    from app.models.cart import Cart
    from app.models.product import Product

    db = _get_db()
    async with db:
        result = await db.execute(
            select(Cart).where(Cart.user_id == user_id, Cart.product_id == product_id)
        )
        cart_item = result.scalar_one_or_none()
        if not cart_item:
            return json.dumps({"success": False, "error": "Item not found in cart"})

        if quantity <= 0:
            await db.delete(cart_item)
            await db.commit()
            return json.dumps({"success": True, "message": "Item removed from cart"})

        prod_result = await db.execute(select(Product).where(Product.id == product_id))
        product = prod_result.scalar_one_or_none()
        if product and quantity > product.stock:
            return json.dumps({"success": False, "error": f"Not enough stock. Available: {product.stock}"})

        cart_item.quantity = quantity
        await db.commit()
        await db.refresh(cart_item)

        product_name = product.name if product else "Product"
        return json.dumps({
            "success": True,
            "message": f"Updated '{product_name}' quantity to {quantity}",
            "product_name": product_name,
            "quantity": quantity,
        }, ensure_ascii=False)


@mcp.tool()
def clear_cart(user_id: int, confirm: bool = False) -> str:
    """Clear all items from the user's cart. Requires confirmation (confirm=True)."""
    return _run_async(_clear_cart(user_id, confirm))


async def _clear_cart(user_id, confirm):
    from sqlalchemy import select
    from app.models.cart import Cart

    db = _get_db()
    async with db:
        result = await db.execute(select(Cart).where(Cart.user_id == user_id))
        items = result.scalars().all()

        if not items:
            return json.dumps({"success": True, "message": "Cart is already empty"})

        if not confirm:
            return json.dumps({
                "success": False,
                "confirm_required": True,
                "items_count": len(items),
                "message": f"Are you sure you want to clear your cart ({len(items)} items)?",
            }, ensure_ascii=False)

        for item in items:
            await db.delete(item)
        await db.commit()

        return json.dumps({
            "success": True,
            "message": f"Cart cleared ({len(items)} items removed)",
        }, ensure_ascii=False)


# ============================================================
# Order Tools
# ============================================================


@mcp.tool()
def create_order(user_id: int) -> str:
    """Create an order from the user's cart."""
    return _run_async(_create_order(user_id))


async def _create_order(user_id):
    from sqlalchemy import select
    from app.models.order import Order, OrderItem
    from app.models.cart import Cart
    from app.models.product import Product
    from app.models.purchase_history import PurchaseHistory

    db = _get_db()
    async with db:
        result = await db.execute(select(Cart).where(Cart.user_id == user_id))
        cart_items = result.scalars().all()

        if not cart_items:
            return json.dumps({"success": False, "error": "Cart is empty"})

        order = Order(user_id=user_id, status="pending", total_price=0)
        db.add(order)
        await db.flush()

        total = 0
        order_items_data = []
        for ci in cart_items:
            prod_result = await db.execute(select(Product).where(Product.id == ci.product_id))
            product = prod_result.scalar_one_or_none()
            if not product or product.stock < ci.quantity:
                continue

            item_price = float(product.price) * ci.quantity
            total += item_price

            order_item = OrderItem(
                order_id=order.id, product_id=ci.product_id,
                quantity=ci.quantity, price=float(product.price),
            )
            db.add(order_item)
            product.stock -= ci.quantity

            purchase_record = PurchaseHistory(
                user_id=user_id, product_id=ci.product_id,
                order_id=order.id, quantity=ci.quantity,
                price=float(product.price),
            )
            db.add(purchase_record)

            order_items_data.append({
                "product_name": product.name,
                "quantity": ci.quantity,
                "price": float(product.price),
            })
            await db.delete(ci)

        order.total_price = total
        await db.commit()
        await db.refresh(order)

        from app.services.user import update_preferences_from_history
        await update_preferences_from_history(user_id, db)

        return json.dumps({
            "success": True,
            "message": "Order created successfully!",
            "order_id": order.id,
            "total_price": total,
            "status": order.status,
            "items": order_items_data,
        }, ensure_ascii=False)


@mcp.tool()
def get_order_status(order_id: int, user_id: int) -> str:
    """Get the status of a specific order."""
    return _run_async(_get_order_status(order_id, user_id))


async def _get_order_status(order_id, user_id):
    from sqlalchemy import select
    from app.models.order import Order, OrderItem
    from app.models.product import Product

    db = _get_db()
    async with db:
        result = await db.execute(
            select(Order).where(Order.id == order_id, Order.user_id == user_id)
        )
        order = result.scalar_one_or_none()
        if not order:
            return json.dumps({"error": "Order not found"})

        items_result = await db.execute(
            select(OrderItem).where(OrderItem.order_id == order.id)
        )
        items = items_result.scalars().all()

        items_data = []
        for item in items:
            prod_result = await db.execute(select(Product).where(Product.id == item.product_id))
            product = prod_result.scalar_one_or_none()
            items_data.append({
                "product_name": product.name if product else "Unknown",
                "quantity": item.quantity,
                "price": float(item.price),
            })

        return json.dumps({
            "order_id": order.id,
            "status": order.status,
            "total_price": float(order.total_price),
            "created_at": str(order.created_at),
            "items": items_data,
        }, ensure_ascii=False)


@mcp.tool()
def get_user_orders(user_id: int) -> str:
    """Get all orders for the user."""
    return _run_async(_get_user_orders(user_id))


async def _get_user_orders(user_id):
    from sqlalchemy import select
    from app.models.order import Order

    db = _get_db()
    async with db:
        result = await db.execute(
            select(Order).where(Order.user_id == user_id).order_by(Order.created_at.desc())
        )
        orders = result.scalars().all()

        return json.dumps([{
            "order_id": o.id,
            "status": o.status,
            "total_price": float(o.total_price),
            "created_at": str(o.created_at),
        } for o in orders], ensure_ascii=False)


@mcp.tool()
def cancel_order(user_id: int, order_id: int, confirm: bool = False) -> str:
    """Cancel an order if it is still pending or confirmed. Requires confirmation (confirm=True)."""
    return _run_async(_cancel_order(user_id, order_id, confirm))


async def _cancel_order(user_id, order_id, confirm):
    from sqlalchemy import select
    from app.models.order import Order

    db = _get_db()
    async with db:
        result = await db.execute(
            select(Order).where(Order.id == order_id, Order.user_id == user_id)
        )
        order = result.scalar_one_or_none()
        if not order:
            return json.dumps({"success": False, "error": "Order not found"})

        if order.status in ("shipped", "delivered", "cancelled"):
            return json.dumps({
                "success": False,
                "error": f"Cannot cancel order with status '{order.status}'",
            }, ensure_ascii=False)

        if not confirm:
            return json.dumps({
                "success": False,
                "confirm_required": True,
                "order_id": order.id,
                "status": order.status,
                "total_price": float(order.total_price),
                "message": f"Are you sure you want to cancel Order #{order.id} (status: {order.status}, total: ${float(order.total_price):.2f})?",
            }, ensure_ascii=False)

        order.status = "cancelled"
        await db.commit()
        await db.refresh(order)

        return json.dumps({
            "success": True,
            "message": f"Order #{order.id} has been cancelled",
            "order_id": order.id,
            "status": order.status,
        }, ensure_ascii=False)


@mcp.tool()
def track_order(user_id: int, order_id: int) -> str:
    """Track the delivery status of an order."""
    return _run_async(_track_order(user_id, order_id))


async def _track_order(user_id, order_id):
    from sqlalchemy import select
    from app.models.order import Order, OrderItem
    from app.models.product import Product

    db = _get_db()
    async with db:
        result = await db.execute(
            select(Order).where(Order.id == order_id, Order.user_id == user_id)
        )
        order = result.scalar_one_or_none()
        if not order:
            return json.dumps({"success": False, "error": "Order not found"})

        items_result = await db.execute(
            select(OrderItem).where(OrderItem.order_id == order.id)
        )
        items = items_result.scalars().all()

        items_data = []
        for item in items:
            prod_result = await db.execute(select(Product).where(Product.id == item.product_id))
            product = prod_result.scalar_one_or_none()
            items_data.append({
                "product_name": product.name if product else "Unknown",
                "quantity": item.quantity,
                "price": float(item.price),
            })

        status_messages = {
            "pending": "Your order is pending and will be processed soon.",
            "confirmed": "Your order has been confirmed and is being prepared.",
            "shipped": "Your order has been shipped and is on its way!",
            "delivered": "Your order has been delivered.",
            "cancelled": "Your order has been cancelled.",
        }

        return json.dumps({
            "success": True,
            "order_id": order.id,
            "status": order.status,
            "tracking_message": status_messages.get(order.status, "Unknown status"),
            "total_price": float(order.total_price),
            "created_at": str(order.created_at),
            "items": items_data,
        }, ensure_ascii=False)


# ============================================================
# Recommendation Tools
# ============================================================


@mcp.tool()
def recommend_products(user_id: int) -> str:
    """Recommend products based on user's purchase history."""
    return _run_async(_recommend_products(user_id))


async def _recommend_products(user_id):
    from sqlalchemy import select, func as sql_func, or_
    from app.models.purchase_history import PurchaseHistory
    from app.models.product import Product
    from app.models.categories import Category

    db = _get_db()
    async with db:
        history_result = await db.execute(
            select(PurchaseHistory).where(PurchaseHistory.user_id == user_id)
        )
        history = history_result.scalars().all()

        if not history:
            popular_result = await db.execute(
                select(Product).where(Product.is_active == True, Product.stock > 0)
                .order_by(Product.id.desc()).limit(3)
            )
            products = popular_result.scalars().all()
            return json.dumps([{
                "id": p.id, "name": p.name, "price": float(p.price),
                "color": p.color, "size": p.size, "reason": "Popular product",
            } for p in products], ensure_ascii=False)

        purchased_ids = set()
        category_ids = set()
        colors = set()
        for h in history:
            purchased_ids.add(h.product_id)
            prod = (await db.execute(select(Product).where(Product.id == h.product_id))).scalar_one_or_none()
            if prod:
                category_ids.add(prod.category_id)
                if prod.color:
                    colors.add(prod.color.lower())

        filters = [
            Product.is_active == True, Product.stock > 0,
            Product.id.notin_(purchased_ids) if purchased_ids else True,
        ]
        if category_ids:
            filters.append(or_(
                Product.category_id.in_(category_ids),
                Product.color.ilike(list(colors)[0]) if colors else False,
            ))

        recs = (await db.execute(select(Product).where(*filters).limit(3))).scalars().all()
        if not recs:
            recs = (await db.execute(
                select(Product).where(Product.is_active == True, Product.stock > 0)
                .order_by(Product.id.desc()).limit(3)
            )).scalars().all()

        results = []
        for p in recs:
            reason = "Similar to what you bought"
            if p.category_id in category_ids:
                cat = (await db.execute(select(Category).where(Category.id == p.category_id))).scalar_one_or_none()
                if cat:
                    reason = f"From category '{cat.name}' you bought"
            elif p.color and p.color.lower() in colors:
                reason = f"Color '{p.color}' you like"

            results.append({
                "id": p.id, "name": p.name, "price": float(p.price),
                "color": p.color, "size": p.size, "reason": reason,
            })

        return json.dumps(results, ensure_ascii=False)


@mcp.tool()
def get_similar_products(product_id: int) -> str:
    """Find similar products from the same category."""
    return _run_async(_get_similar_products(product_id))


async def _get_similar_products(product_id):
    from sqlalchemy import select
    from app.models.product import Product

    db = _get_db()
    async with db:
        product = (await db.execute(select(Product).where(Product.id == product_id))).scalar_one_or_none()
        if not product:
            return json.dumps([])

        similar = (await db.execute(
            select(Product).where(
                Product.is_active == True, Product.stock > 0,
                Product.id != product_id,
                Product.category_id == product.category_id,
            ).limit(5)
        )).scalars().all()

        return json.dumps([{
            "id": p.id, "name": p.name, "price": float(p.price),
            "color": p.color, "size": p.size,
            "reason": "Similar product from same category",
        } for p in similar], ensure_ascii=False)


@mcp.tool()
def get_frequently_bought_together(product_id: int) -> str:
    """Find products that are frequently bought together with the given product."""
    return _run_async(_get_frequently_bought_together(product_id))


async def _get_frequently_bought_together(product_id):
    from sqlalchemy import select, func as sql_func
    from app.models.purchase_history import PurchaseHistory
    from app.models.product import Product

    db = _get_db()
    async with db:
        product = (await db.execute(select(Product).where(Product.id == product_id))).scalar_one_or_none()
        if not product:
            return json.dumps([])

        orders_with_product = await db.execute(
            select(PurchaseHistory.order_id)
            .where(PurchaseHistory.product_id == product_id, PurchaseHistory.order_id.isnot(None))
            .distinct()
        )
        order_ids = [row[0] for row in orders_with_product.fetchall()]

        if not order_ids:
            return json.dumps([])

        other_purchases = await db.execute(
            select(PurchaseHistory.product_id, sql_func.sum(PurchaseHistory.quantity).label("total_qty"))
            .where(PurchaseHistory.order_id.in_(order_ids), PurchaseHistory.product_id != product_id)
            .group_by(PurchaseHistory.product_id)
            .order_by(sql_func.sum(PurchaseHistory.quantity).desc())
            .limit(5)
        )
        frequent = other_purchases.fetchall()

        results = []
        for pid, total_qty in frequent:
            p = (await db.execute(select(Product).where(Product.id == pid, Product.is_active == True))).scalar_one_or_none()
            if p and p.stock > 0:
                results.append({
                    "id": p.id, "name": p.name, "price": float(p.price),
                    "color": p.color, "size": p.size,
                    "times_bought_together": int(total_qty),
                    "reason": f"Frequently bought together with '{product.name}'",
                })

        return json.dumps(results, ensure_ascii=False)


# ============================================================
# Favorites Tools
# ============================================================


@mcp.tool()
def add_to_favorites(user_id: int, product_id: int) -> str:
    """Add a product to the user's favorites/wishlist."""
    return _run_async(_add_to_favorites(user_id, product_id))


async def _add_to_favorites(user_id, product_id):
    from sqlalchemy import select
    from app.models.favorite import Favorite
    from app.models.product import Product

    db = _get_db()
    async with db:
        product = (await db.execute(select(Product).where(Product.id == product_id, Product.is_active == True))).scalar_one_or_none()
        if not product:
            return json.dumps({"success": False, "error": "Product not found"})

        existing = (await db.execute(
            select(Favorite).where(Favorite.user_id == user_id, Favorite.product_id == product_id)
        )).scalar_one_or_none()

        if existing:
            return json.dumps({"success": False, "error": "Already in favorites"})

        fav = Favorite(user_id=user_id, product_id=product_id)
        db.add(fav)
        await db.commit()

        return json.dumps({
            "success": True,
            "message": f"'{product.name}' added to favorites",
            "product_name": product.name,
        }, ensure_ascii=False)


@mcp.tool()
def remove_from_favorites(user_id: int, product_id: int) -> str:
    """Remove a product from the user's favorites/wishlist."""
    return _run_async(_remove_from_favorites(user_id, product_id))


async def _remove_from_favorites(user_id, product_id):
    from sqlalchemy import select
    from app.models.favorite import Favorite
    from app.models.product import Product

    db = _get_db()
    async with db:
        existing = (await db.execute(
            select(Favorite).where(Favorite.user_id == user_id, Favorite.product_id == product_id)
        )).scalar_one_or_none()

        if not existing:
            return json.dumps({"success": False, "error": "Not in favorites"})

        product = (await db.execute(select(Product).where(Product.id == product_id))).scalar_one_or_none()
        product_name = product.name if product else "Product"

        await db.delete(existing)
        await db.commit()

        return json.dumps({"success": True, "message": f"'{product_name}' removed from favorites"}, ensure_ascii=False)


@mcp.tool()
def get_favorites(user_id: int) -> str:
    """Get all products in the user's favorites/wishlist."""
    return _run_async(_get_favorites(user_id))


async def _get_favorites(user_id):
    from sqlalchemy import select
    from app.models.favorite import Favorite
    from app.models.product import Product

    db = _get_db()
    async with db:
        result = await db.execute(
            select(Favorite).where(Favorite.user_id == user_id).order_by(Favorite.created_at.desc())
        )
        favs = result.scalars().all()

        results = []
        for fav in favs:
            product = (await db.execute(select(Product).where(Product.id == fav.product_id))).scalar_one_or_none()
            if product:
                results.append({
                    "id": product.id,
                    "name": product.name,
                    "price": float(product.price),
                    "color": product.color,
                    "size": product.size,
                    "stock": product.stock,
                })

        return json.dumps(results, ensure_ascii=False)


@mcp.tool()
def check_is_favorite(user_id: int, product_id: int) -> str:
    """Check if a product is in the user's favorites."""
    return _run_async(_check_is_favorite(user_id, product_id))


async def _check_is_favorite(user_id, product_id):
    from sqlalchemy import select
    from app.models.favorite import Favorite

    db = _get_db()
    async with db:
        existing = (await db.execute(
            select(Favorite).where(Favorite.user_id == user_id, Favorite.product_id == product_id)
        )).scalar_one_or_none()

        return json.dumps({"is_favorite": existing is not None})


# ============================================================
# Run as stdio server
# ============================================================

if __name__ == "__main__":
    mcp.run()
