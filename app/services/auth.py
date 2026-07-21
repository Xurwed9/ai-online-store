from fastapi import HTTPException
from app.services.user import get_user_by_email,get_user_by_username,create_user,get_user_phone_number
from app.database.database import get_db
from app.schemas.user import UserCreate, UserLogin
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import verify_password, create_access_token
from sqlalchemy import select
from app.models.models import User

async def register(data: UserCreate, db: AsyncSession):
    email_exists = await get_user_by_email(data.email, db)
    username_exists = await get_user_by_username(data.username, db)
    phone_number_exists = await get_user_phone_number(data.phone_number, db)

    if email_exists:
        raise HTTPException(status_code=400, detail = 'Email already exists')
    
    if username_exists:
        raise HTTPException(status_code=400, detail='Username already exists')

    if phone_number_exists:
        raise HTTPException(status_code=400, detail='Phone number already exists')
    return await create_user(data, db)

async def login(username: str, password: str, db: AsyncSession):
    user_exists = await get_user_by_username(username, db)
    if not user_exists:
        raise HTTPException(status_code=401, detail='Invalid credential')
    if not verify_password(password, user_exists.password):
        raise HTTPException(status_code=401, detail='Invalid credential')
    
    token = create_access_token(
        {
            'sub': str(user_exists.id)
        }
    )
    return {'access_token': token, 'token_type': 'bearer'}