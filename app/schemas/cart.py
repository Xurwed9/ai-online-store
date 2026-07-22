from pydantic import BaseModel


class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = 1


class CartItemResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    quantity: int
    product_name: str | None = None
    product_price: float | None = None
    product_image: str | None = None

    model_config = {"from_attributes": True}


class CartItemUpdate(BaseModel):
    quantity: int
