from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    username: str = Field(min_length=5, max_length=30)
    email: EmailStr
    password: str = Field(min_length=6)
    phone_number: str
    role: str = "user"


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    phone_number: str
    role: str
    preferences: str | None = None

    model_config = {"from_attributes": True}


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class VerifyEmailSchema(BaseModel):
    email: EmailStr
    code: str


class UserPreferencesUpdate(BaseModel):
    preferences: str


class UserProfileUpdate(BaseModel):
    username: str | None = None
    email: str | None = None
    phone_number: str | None = None
    date_of_birth: str | None = None
    gender: str | None = None
    country: str | None = None
    city: str | None = None
    address: str | None = None
    language: str | None = None
    dark_mode: bool | None = None