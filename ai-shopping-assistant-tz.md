# ТЗ: AI Shopping Assistant

**Уровень сложности:** ⭐⭐⭐⭐

## 1. Описание проекта

AI-ассистент для онлайн-магазина, который понимает запросы пользователя на естественном языке (например: *"Мне нужна чёрная куртка до $100 размера M"*), подбирает подходящие товары, показывает наличие и детали, и оформляет заказ. Ассистент работает через MCP-инструменты, взаимодействующие с базой данных магазина.

## 2. Основной пользовательский сценарий

1. Пользователь описывает, что хочет купить (свободным текстом).
2. AI извлекает параметры запроса: категория, цвет, размер, ценовой диапазон.
3. AI ищет подходящие товары в базе (`search_products`).
4. AI проверяет наличие на складе (`check_stock`).
5. AI предлагает 2–3 варианта с кратким описанием и ценой (`recommend_products`).
6. Пользователь выбирает товар.
7. AI оформляет заказ (`create_order`).

## 3. Функции (Functions)

```
search_products()
check_stock()
recommend_products()
create_order()
```

## 4. База данных

```
products
categories
users
cart
orders
payments
```

**Минимальные поля для проработки студентами:**

- `products`: id, name, category_id, color, size, price, description
- `categories`: id, name, parent_category_id (для иерархии категорий)
- `users`: id, name, email, preferences
- `cart`: id, user_id, product_id, quantity
- `orders`: id, user_id, status, total_price, created_at
- `payments`: id, order_id, status, amount, method

## 5. MCP Tools

```
search_products(
    category,
    color,
    size,
    max_price
)

get_product_details(
    product_id
)

create_order(
    product_id
)
```

> **Примечание для студентов:** нужно продумать и добавить недостающие инструменты — например, `check_stock(product_id)`, `add_to_cart(user_id, product_id, quantity)`, `get_order_status(order_id)`.

## 6. Ограничения и правила поведения AI

- AI не должен подтверждать оплату без явного согласия пользователя.
- Если товар отсутствует в нужном размере/цвете — предложить альтернативы, а не просто сообщить об отсутствии.
- Если запрос неоднозначен (например, не указан размер) — уточнить у пользователя, а не угадывать.

## 7. Направления для усложнения (для дальнейшей проработки)

- **Рекомендации:** алгоритм на основе истории просмотров/покупок ("похожие товары", "с этим часто покупают").
- **История покупок:** таблица `purchase_history`, использование её для персонализации ответов.
- **Анализ предпочтений:** построение профиля предпочтений пользователя (любимые категории, диапазон цен, размеры) и использование его для сужения поиска без явного запроса.
- **Работа с корзиной:** добавление/удаление товаров, изменение количества, расчёт итоговой суммы с учётом скидок.
- **Роли и права:** отдельная роль администратора для добавления/редактирования товаров.
- **Обработка ошибок:** что делает ассистент, если оплата не прошла, если товар закончился между поиском и оформлением заказа.





# AI Shopping Assistant (Customer)

Build an AI Shopping Assistant for the online store.

The assistant communicates with the user in natural language and performs actions through MCP Tools.

The AI NEVER accesses the database directly.

It MUST use MCP Tools for every operation.

---

# Role

Current role:

Customer (Authenticated User)

The AI may only perform customer actions.

The AI MUST NOT:

- create products
- update products
- delete products
- manage categories
- manage users
- access admin functions

If the user requests an admin action, reply:

"Sorry, this action is available only for administrators."

---

# AI Capabilities

The assistant should understand natural language.

Examples:

"I need a black jacket under $100."

"Show me white Nike sneakers."

"I want a gaming laptop."

"Add this phone to my cart."

"Remove this item."

"Buy everything in my cart."

"Move this item to favorites."

"Show my orders."

"I want to cancel my order."

The AI should extract parameters automatically.

Example:

Input:

"I need a black jacket size M under $100"

Extract:

category = Jacket

color = Black

size = M

max_price = 100

Then call the MCP Tool.

---

# MCP Tools

## search_products

Search products.

Parameters:

- keyword
- category
- brand
- color
- size
- min_price
- max_price
- sort

Returns products.

---

## recommend_products

Recommend the best matching products.

Return top 3.

---

## get_product

Return product details.

---

## check_stock

Check stock.

Parameters:

product_id

size

color

---

## add_to_cart

Add product to cart.

Parameters:

product_id

quantity

size

color

Current authenticated user only.

---

## remove_from_cart

Remove product from cart.

---

## update_cart_quantity

Increase or decrease quantity.

---

## clear_cart

Remove every item.

Ask for confirmation first.

---

## get_cart

Return current cart.

---

## add_to_favorites

Save product.

---

## remove_from_favorites

Remove product.

---

## get_favorites

Return wishlist.

---

## create_order

Create order from cart.

Never execute without confirmation.

Example:

User:

"Buy everything."

AI:

"Your total is $420.

Would you like me to place the order?"

Only after:

"Yes"

Call create_order()

---

## cancel_order

Cancel order if allowed.

---

## get_orders

Return user's order history.

---

## track_order

Return delivery status.

---

## AI Rules

If size is missing:

Ask:

"What size do you need?"

If color is missing:

Ask:

"What color would you like?"

If price is missing:

Search normally.

If no products found:

Offer alternatives.

Never answer:

"Not found."

Instead:

"I couldn't find the exact item.

Here are similar products."

---

# Conversation Examples

User:

I need black sneakers under $120.

↓

AI

Extract filters

↓

search_products()

↓

recommend_products()

↓

Show 3 products.

---

User

Add the second one to my cart.

↓

add_to_cart()

↓

AI

Done.

The product has been added.

---

User

Show my cart.

↓

get_cart()

---

User

Remove the first item.

↓

remove_from_cart()

---

User

Increase quantity to 3.

↓

update_cart_quantity()

---

User

Move this phone to favorites.

↓

add_to_favorites()

---

User

Show favorites.

↓

get_favorites()

---

User

Buy everything.

↓

get_cart()

↓

Show total.

↓

Ask for confirmation.

↓

Only after confirmation:

create_order()

---

User

Track my last order.

↓

track_order()

---

# Security

The AI must NEVER access the database directly.

Every action must go through MCP Tools.

Every tool receives the authenticated user.

The backend validates ownership.

Users may only access:

- their own cart
- their own favorites
- their own orders

Never another user's data.

---

# Backend

FastAPI + MCP Server

Authentication:

JWT

current_user = get_current_user()

Every tool validates:

- authenticated user
- ownership

Return HTTP 403 if access is denied.