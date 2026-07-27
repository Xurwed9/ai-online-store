from fastapi import APIRouter, Depends, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.database import get_db
import json
import os
import uuid
from app.schemas.user import UserCreate, UserLogin, UserResponse, VerifyEmailSchema, UserPreferencesUpdate, UserProfileUpdate
from app.services.auth import register, login
from app.core.dependencies import get_current_user, get_current_admin
from app.models.models import User
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import HTTPException
from sqlalchemy import select

AVATARS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "avatars")
os.makedirs(AVATARS_DIR, exist_ok=True)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register")
async def register_user(data: UserCreate, db: AsyncSession = Depends(get_db)):
    return await register(data, db)


@router.post("/login")
async def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    return await login(form_data.username, form_data.password, db)


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    prefs = {}
    if current_user.preferences:
        try:
            prefs = json.loads(current_user.preferences)
        except (json.JSONDecodeError, TypeError):
            prefs = {}
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "phone_number": current_user.phone_number,
        "role": current_user.role,
        "preferences": current_user.preferences,
        "avatar": prefs.get("avatar", ""),
        "date_of_birth": prefs.get("date_of_birth", ""),
        "gender": prefs.get("gender", ""),
        "country": prefs.get("country", ""),
        "city": prefs.get("city", ""),
        "address": prefs.get("address", ""),
        "language": prefs.get("language", ""),
        "dark_mode": prefs.get("dark_mode", True),
    }


@router.put("/preferences")
async def update_preferences(
    data: UserPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_user.preferences = data.preferences
    await db.commit()
    await db.refresh(current_user)
    return {"message": "Предпочтения обновлены", "preferences": current_user.preferences}


@router.put("/profile")
async def update_profile(
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if data.username is not None:
        existing = await db.execute(select(User).where(User.username == data.username, User.id != current_user.id))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Имя пользователя уже занято")
        current_user.username = data.username

    if data.email is not None:
        existing = await db.execute(select(User).where(User.email == data.email, User.id != current_user.id))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=400, detail="Эта почта уже используется")
        current_user.email = data.email

    if data.phone_number is not None:
        current_user.phone_number = data.phone_number

    prefs = {}
    if current_user.preferences:
        try:
            prefs = json.loads(current_user.preferences)
        except (json.JSONDecodeError, TypeError):
            prefs = {}

    profile_fields = ["date_of_birth", "gender", "country", "city", "address", "language"]
    for field in profile_fields:
        val = getattr(data, field, None)
        if val is not None:
            prefs[field] = val

    if data.dark_mode is not None:
        prefs["dark_mode"] = data.dark_mode

    current_user.preferences = json.dumps(prefs)
    await db.commit()
    await db.refresh(current_user)

    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "phone_number": current_user.phone_number,
        "role": current_user.role,
        "preferences": current_user.preferences,
        "avatar": prefs.get("avatar", ""),
        "date_of_birth": prefs.get("date_of_birth", ""),
        "gender": prefs.get("gender", ""),
        "country": prefs.get("country", ""),
        "city": prefs.get("city", ""),
        "address": prefs.get("address", ""),
        "language": prefs.get("language", ""),
        "dark_mode": prefs.get("dark_mode", True),
    }


@router.put("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Файл должен быть изображением")

    ext = file.filename.split(".")[-1] if "." in (file.filename or "") else "jpg"
    filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(AVATARS_DIR, filename)

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Файл слишком большой (макс. 5MB)")

    with open(filepath, "wb") as f:
        f.write(content)

    prefs = {}
    if current_user.preferences:
        try:
            prefs = json.loads(current_user.preferences)
        except (json.JSONDecodeError, TypeError):
            prefs = {}

    old_avatar = prefs.get("avatar", "")
    if old_avatar:
        old_path = old_avatar.lstrip("/")
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except OSError:
                pass

    avatar_url = f"/uploads/avatars/{filename}"
    prefs["avatar"] = avatar_url
    current_user.preferences = json.dumps(prefs)
    await db.commit()

    return {"avatar": avatar_url}


@router.delete("/avatar")
async def delete_avatar(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    prefs = {}
    if current_user.preferences:
        try:
            prefs = json.loads(current_user.preferences)
        except (json.JSONDecodeError, TypeError):
            prefs = {}

    old_avatar = prefs.get("avatar", "")
    if old_avatar:
        old_path = old_avatar.lstrip("/")
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except OSError:
                pass

    prefs.pop("avatar", None)
    current_user.preferences = json.dumps(prefs)
    await db.commit()

    return {"avatar": ""}


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