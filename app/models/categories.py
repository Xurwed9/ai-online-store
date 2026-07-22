from sqlalchemy import Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.database import Base


class Category(Base):
    __tablename__ = 'categories'

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    description: Mapped[str] = mapped_column(String, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    parent_category_id: Mapped[int] = mapped_column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)

    products = relationship("Product", back_populates="category", cascade="all, delete-orphan")
    parent = relationship("Category", remote_side="Category.id", backref="subcategories")