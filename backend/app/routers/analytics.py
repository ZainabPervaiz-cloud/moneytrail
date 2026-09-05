"""
Analytics routes: aggregated numbers that power the dashboard charts and
the auto-generated "insight" sentence (e.g. "Food spending up 23%").
"""

import calendar
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Category, Transaction, TransactionType, User

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _month_bounds(year: int, month: int) -> tuple[datetime, datetime]:
    """Return the (start, end) datetime bounds for a given calendar month."""
    start = datetime(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    end = datetime(year, month, last_day, 23, 59, 59)
    return start, end


@router.get("/summary")
def monthly_summary(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Total income, total expenses, and net balance for the current month."""
    now = datetime.utcnow()
    start, end = _month_bounds(now.year, now.month)

    def total_for(tx_type: TransactionType) -> float:
        return (
            db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
            .filter(
                Transaction.user_id == current_user.id,
                Transaction.type == tx_type,
                Transaction.date.between(start, end),
            )
            .scalar()
        )

    income = total_for(TransactionType.income)
    expense = total_for(TransactionType.expense)

    return {"income": income, "expense": expense, "balance": income - expense}


@router.get("/by-category")
def spending_by_category(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Expense total per category for the current month — feeds the pie
    chart on the dashboard.
    """
    now = datetime.utcnow()
    start, end = _month_bounds(now.year, now.month)

    rows = (
        db.query(Category.name, Category.icon, func.sum(Transaction.amount).label("total"))
        .join(Transaction, Transaction.category_id == Category.id)
        .filter(
            Transaction.user_id == current_user.id,
            Transaction.type == TransactionType.expense,
            Transaction.date.between(start, end),
        )
        .group_by(Category.id)
        .all()
    )

    return [{"category": name, "icon": icon, "total": total} for name, icon, total in rows]


@router.get("/insight")
def spending_insight(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Compare this month's spending per category against last month's and
    surface the single biggest percentage change as a human-readable
    sentence, e.g. "Your Food spending increased 23% vs last month."
    """
    now = datetime.utcnow()
    this_start, this_end = _month_bounds(now.year, now.month)

    prev_month = now.month - 1 or 12
    prev_year = now.year if now.month > 1 else now.year - 1
    prev_start, prev_end = _month_bounds(prev_year, prev_month)

    def totals_by_category(start: datetime, end: datetime) -> dict[str, float]:
        rows = (
            db.query(Category.name, func.sum(Transaction.amount))
            .join(Transaction, Transaction.category_id == Category.id)
            .filter(
                Transaction.user_id == current_user.id,
                Transaction.type == TransactionType.expense,
                Transaction.date.between(start, end),
            )
            .group_by(Category.id)
            .all()
        )
        return {name: total for name, total in rows}

    this_month = totals_by_category(this_start, this_end)
    last_month = totals_by_category(prev_start, prev_end)

    biggest_change = None
    biggest_percent = 0.0

    for category, this_total in this_month.items():
        prev_total = last_month.get(category, 0.0)
        if prev_total <= 0:
            continue  # avoid divide-by-zero / meaningless "infinite" jumps
        percent_change = ((this_total - prev_total) / prev_total) * 100
        if abs(percent_change) > abs(biggest_percent):
            biggest_percent = percent_change
            biggest_change = category

    if biggest_change is None:
        return {"message": "Not enough data yet to generate an insight."}

    direction = "increased" if biggest_percent > 0 else "decreased"
    return {
        "message": (
            f"Your {biggest_change} spending {direction} "
            f"{abs(round(biggest_percent))}% compared to last month."
        )
    }
