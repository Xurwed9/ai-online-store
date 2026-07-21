from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from app.database.database import Base

class User(Base):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    username: Mapped[str] = mapped_column(String(100),unique=True)
    email: Mapped[str] = mapped_column(String(100), unique=True)
    password: Mapped[str] = mapped_column(String)
    phone_number: Mapped[str] = mapped_column(String(20),unique=True)