from sqlalchemy import Integer, ForeignKey, DateTime, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database.database import Base


class PurchaseHistory(Base):
    __tablename__ = "purchase_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    order_id: Mapped[int] = mapped_column(Integer, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    purchased_at = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", backref="purchases")
    product = relationship("Product", backref="purchases")
    order = relationship("Order", backref="purchase_history")
