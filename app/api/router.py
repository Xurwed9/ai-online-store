from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.database import get_db
from app.schemas.user import UserCreate, UserLogin, UserResponse,VerifyEmailSchema
from app.services.auth import register, login
from app.core.dependencies import get_current_user, get_current_admin
from app.models.models import User
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import HTTPException
from sqlalchemy import select

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
async def register_user(data: UserCreate, db: AsyncSession = Depends(get_db)):
    return await register(data, db)

@router.post("/login")
async def login_user(form_data: OAuth2PasswordRequestForm = Depends(),db: AsyncSession = Depends(get_db)):
    return await login(form_data.username, form_data.password, db)

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
    }

@router.post("/logout")
async def logout_user(current_user: User = Depends(get_current_user)):
    return {"message": "Successfully logged out"}

@router.get("/admin-dashboard")
async def admin_dashboard(admin: User = Depends(get_current_admin)):

    return {"message": f"Welcome back, Admin {admin.username}!"}

@router.post("/verify-email")
async def verify_email(data: VerifyEmailSchema, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if user.is_verified:
        return {"message": "Аккаунт уже подтвержден"}

    if user.verification_code != data.code:
        raise HTTPException(status_code=400, detail="Неверный код подтверждения")

    user.is_verified = True
    user.verification_code = None
    db.add(user)
    await db.commit()

    return {"message": "Email успешно подтвержден! Теперь вы можете войти в систему."}