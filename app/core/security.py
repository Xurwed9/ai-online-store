from jose import jwt 
from passlib.context import CryptContext
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv(
    "SECRET_KEY", "fallback_secret_key_if_not_provided_in_env"
)

ALGORITHM = 'HS256'

ACCESS_TOKEN_EXPIRE_MINUTE = 30

pwd_context = CryptContext(schemes=['argon2'])

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(password: str, hash_password: str):
    return pwd_context.verify(password, hash_password)

def create_access_token(data: dict):
    payload = data.copy()
    payload['exp'] = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTE)
    return jwt.encode(payload, SECRET_KEY, ALGORITHM)