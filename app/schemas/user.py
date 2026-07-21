from pydantic import BaseModel,EmailStr,Field

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

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str