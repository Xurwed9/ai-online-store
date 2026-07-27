from pydantic import BaseModel


class FavoriteCreate(BaseModel):
    product_id: int


class FavoriteResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    product_name: str | None = None
    product_price: float | None = None
    product_image: str | None = None
    product_description: str | None = None
    product_color: str | None = None
    product_size: str | None = None
    product_stock: int | None = None

    model_config = {"from_attributes": True}
