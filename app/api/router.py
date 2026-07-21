from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.database import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.services.auth import register, login

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(data: UserCreate, db: AsyncSession = Depends(get_db)):
    return await register(data, db)

@router.post("/login")
async def login_user(data: UserLogin, db: AsyncSession = Depends(get_db)):
    return await login(data, db)