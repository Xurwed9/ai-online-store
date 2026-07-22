from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    description: str
    is_active: bool = True
    parent_category_id: int | None = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    description: str
    is_active: bool
    parent_category_id: int | None = None

    model_config = {"from_attributes": True}


class CategoryUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_active: bool | None = None
    parent_category_id: int | None = None