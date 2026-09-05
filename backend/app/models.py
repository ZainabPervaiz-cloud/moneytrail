"""
SQLAlchemy ORM models — the database schema.

Four tables:
  users        one row per registered account
  categories   income/expense categories, either default or user-created
  transactions the actual income/expense entries
  budgets      a monthly spending limit per user+category
"""

import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from app.database import Base


class TransactionType(str, enum.Enum):
    """A transaction (and a category) is either money coming in or going out."""

    income = "income"
    expense = "expense"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    # Display name — shown in the dashboard greeting ("Hi, Zainab 👋")
    # instead of the app only ever knowing the user by their email.
    name = Column(String, nullable=False)
    # Never store raw passwords — only the bcrypt hash (see app/auth.py).
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # One user has many categories/transactions/budgets. `cascade` means
    # deleting a user also deletes their data instead of leaving orphans.
    categories = relationship(
        "Category", back_populates="owner", cascade="all, delete-orphan"
    )
    transactions = relationship(
        "Transaction", back_populates="owner", cascade="all, delete-orphan"
    )
    budgets = relationship(
        "Budget", back_populates="owner", cascade="all, delete-orphan"
    )


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    icon = Column(String, default="💰")
    # System-provided defaults (Food, Rent, Salary, ...) vs a category the
    # user created themselves — lets the UI seed sensible defaults per user
    # while still allowing custom ones.
    is_default = Column(Boolean, default=False)

    owner = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category")
    budgets = relationship("Budget", back_populates="category")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(Enum(TransactionType), nullable=False)
    note = Column(String, nullable=True)
    date = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    # Spending limit for this category, per calendar month.
    monthly_limit = Column(Float, nullable=False)

    owner = relationship("User", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")
