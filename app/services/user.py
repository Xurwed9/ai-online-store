from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import User
from app.schemas.user import UserCreate
from app.core.security import hash_password

async def create_user(data: UserCreate, db: AsyncSession):
    password = hash_password(data.password)
    new_user = User(username=data.username, email=data.email, password=password,phone_number=data.phone_number, role=data.role)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

async def get_user_by_email(email: str, db: AsyncSession):
    user = await db.execute(select(User).where(User.email==email))
    return user.scalar_one_or_none()


async def get_user_by_username(username: str, db: AsyncSession):
    user = await db.execute(select(User).where(User.username==username))
    return user.scalar_one_or_none()


async def get_user_phone_number(phone_number: str, db: AsyncSession):
    user = await db.execute(select(User).where(User.phone_number==phone_number))
    return user.scalar_one_or_none()