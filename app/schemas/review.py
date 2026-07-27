from pydantic import BaseModel, Field
from datetime import datetime


class ReviewCreate(BaseModel):
    rating: int | None = Field(None, ge=1, le=5)
    comment: str | None = None


class ReviewUpdate(BaseModel):
    rating: int | None = Field(None, ge=1, le=5)
    comment: str | None = None


class ReviewResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    rating: int | None
    comment: str | None
    created_at: datetime
    username: str | None = None

    model_config = {"from_attributes": True}
