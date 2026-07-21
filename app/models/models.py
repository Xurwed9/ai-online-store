from sqlalchemy import Integer, String,Boolean
from sqlalchemy.orm import Mapped, mapped_column
from app.database.database import Base

class User(Base):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(100),unique=True)
    email: Mapped[str] = mapped_column(String(100), unique=True)
    password: Mapped[str] = mapped_column(String)
    phone_number: Mapped[str] = mapped_column(String(20),unique=True)
    role: Mapped[str] = mapped_column(String(50), default='user')
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verification_code: Mapped[str] = mapped_column(String, nullable=True)