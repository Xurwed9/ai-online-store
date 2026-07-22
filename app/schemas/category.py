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
