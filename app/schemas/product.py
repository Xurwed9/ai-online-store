from pydantic import BaseModel
from decimal import Decimal


class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    price: Decimal
    stock: int = 0
    image_url: str | None = None
    is_active: bool = True
    category_id: int


class ProductResponse(BaseModel):
    id: int
    name: str
    description: str | None
    price: Decimal
    stock: int
    image_url: str | None
    is_active: bool
    category_id: int

    model_config = {"from_attributes": True}


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: Decimal | None = None
    stock: int | None = None
    image_url: str | None = None
    is_active: bool | None = None
    category_id: int | None = None
