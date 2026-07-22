from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.database import get_async_session
from app.schemas.payment import PaymentCreate, PaymentResponse, PaymentUpdateStatus
from app.core.dependencies import get_current_user, get_current_admin
from app.services import payment

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/", response_model=PaymentResponse)
async def create_payment(
    data: PaymentCreate,
    db: AsyncSession = Depends(get_async_session),
    user=Depends(get_current_user),
):
    return await payment.create_payment(user.id, data.order_id, data.method, db)


@router.get("/", response_model=list[PaymentResponse])
async def get_my_payments(
    db: AsyncSession = Depends(get_async_session),
    user=Depends(get_current_user),
):
    return await payment.get_user_payments(user.id, db)


@router.get("/all", response_model=list[PaymentResponse])
async def get_all_payments(
    db: AsyncSession = Depends(get_async_session),
    user=Depends(get_current_admin),
):
    return await payment.get_all_payments(db)


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_async_session),
    user=Depends(get_current_user),
):
    return await payment.get_payment_by_id(payment_id, user.id, db)
