"""
Pydantic schemas — define the shape of API request/response bodies.

Kept separate from models.py (the DB tables) on purpose: it lets us
control exactly what a client can send in (e.g. never a user_id — that
comes from the authenticated token) and exactly what we send back (e.g.
never hashed_password).
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

from app.models import TransactionType


# ---------- Auth ----------


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True  # allows building this from an ORM object


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Categories ----------


class CategoryCreate(BaseModel):
    name: str
    type: TransactionType
    icon: str = "💰"


class CategoryOut(CategoryCreate):
    id: int
    is_default: bool

    class Config:
        from_attributes = True


# ---------- Transactions ----------


class TransactionCreate(BaseModel):
    category_id: int
    amount: float
    type: TransactionType
    note: Optional[str] = None
    date: Optional[datetime] = None


class TransactionOut(BaseModel):
    id: int
    category_id: int
    amount: float
    type: TransactionType
    note: Optional[str]
    date: datetime

    class Config:
        from_attributes = True


# ---------- Budgets ----------


class BudgetCreate(BaseModel):
    category_id: int
    monthly_limit: float


class BudgetOut(BudgetCreate):
    id: int

    class Config:
        from_attributes = True


class BudgetStatus(BudgetOut):
    """A budget plus how much of it has been spent this month."""

    spent: float
    remaining: float
    percent_used: float
