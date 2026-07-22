from pydantic import BaseModel

class CategoryCreate(BaseModel):
    name: str
    description: str
    is_active: bool = True

class CategoryResponse(BaseModel):
    id: int
    name: str
    description: str
    is_active: bool

class CategoryUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    is_active: bool | None = None