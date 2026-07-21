from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.database import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse
from app.services.auth import register, login
from app.core.dependencies import get_current_user, get_current_admin
from app.models.models import User
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(data: UserCreate, db: AsyncSession = Depends(get_db)):
    return await register(data, db)

@router.post("/login")
async def login_user(form_data: OAuth2PasswordRequestForm = Depends(),db: AsyncSession = Depends(get_db)):
    return await login(form_data.username, form_data.password, db)

@router.post("/logout")
async def logout_user(current_user: User = Depends(get_current_user)):
    return {"message": "Successfully logged out"}

@router.get("/admin-dashboard")
async def admin_dashboard(admin: User = Depends(get_current_admin)):

    return {"message": f"Welcome back, Admin {admin.username}!"}