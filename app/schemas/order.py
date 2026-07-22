from pydantic import BaseModel
from datetime import datetime


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str | None = None
    quantity: int
    price: float

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: int
    user_id: int
    status: str
    total_price: float
    created_at: datetime | None = None
    items: list[OrderItemResponse] = []

    model_config = {"from_attributes": True}


class OrderUpdateStatus(BaseModel):
    status: str
