from pydantic import BaseModel
from datetime import datetime


class PaymentCreate(BaseModel):
    order_id: int
    method: str | None = None


class PaymentResponse(BaseModel):
    id: int
    order_id: int
    status: str
    amount: float
    method: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class PaymentUpdateStatus(BaseModel):
    status: str
