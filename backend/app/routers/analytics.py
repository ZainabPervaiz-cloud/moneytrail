"""
Analytics routes: aggregated numbers that power the dashboard charts,
the auto-generated "insight" sentence, and the yearly trend view.

Every route here defaults to the current month/year when no `year`/
`month` query param is given, but accepts explicit ones so the frontend
can let a user page back to "August" or "2025" instead of only ever
showing "this month."
"""

import calendar
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
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


def _resolve_year_month(year: Optional[int], month: Optional[int]) -> tuple[int, int]:
    """Fall back to the current year/month whenever either is omitted."""
    now = datetime.utcnow()
    return (year or now.year), (month or now.month)


def _totals_for_range(
    db: Session, user_id: int, start: datetime, end: datetime
) -> tuple[float, float]:
    """(income, expense) totals for a user within a date range."""

    def total_for(tx_type: TransactionType) -> float:
        return (
            db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
            .filter(
                Transaction.user_id == user_id,
                Transaction.type == tx_type,
                Transaction.date.between(start, end),
            )
            .scalar()
        )

    return total_for(TransactionType.income), total_for(TransactionType.expense)


@router.get("/summary")
def monthly_summary(
    year: Optional[int] = None,
    month: Optional[int] = Query(default=None, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Total income, total expenses, and net balance for a given month
    (defaults to the current one)."""
    year, month = _resolve_year_month(year, month)
    start, end = _month_bounds(year, month)
    income, expense = _totals_for_range(db, current_user.id, start, end)

    return {
        "year": year,
        "month": month,
        "income": income,
        "expense": expense,
        "balance": income - expense,
    }


@router.get("/by-category")
def spending_by_category(
    year: Optional[int] = None,
    month: Optional[int] = Query(default=None, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Expense total per category for a given month (defaults to the
    current one) — feeds the pie chart on the dashboard.
    """
    year, month = _resolve_year_month(year, month)
    start, end = _month_bounds(year, month)

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
    year: Optional[int] = None,
    month: Optional[int] = Query(default=None, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Compare a given month's spending per category against the previous
    month's and surface the single biggest percentage change as a
    human-readable sentence, e.g. "Your Food spending increased 23% vs
    last month." Defaults to comparing the current month to the one
    before it.
    """
    year, month = _resolve_year_month(year, month)
    this_start, this_end = _month_bounds(year, month)

    prev_month = month - 1 or 12
    prev_year = year if month > 1 else year - 1
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

    this_month_totals = totals_by_category(this_start, this_end)
    last_month_totals = totals_by_category(prev_start, prev_end)

    biggest_change = None
    biggest_percent = 0.0

    for category, this_total in this_month_totals.items():
        prev_total = last_month_totals.get(category, 0.0)
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


@router.get("/yearly")
def yearly_summary(
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Month-by-month income/expense/net for a whole year, plus the annual
    totals — powers the Yearly tab's trend chart and "you saved/lost X
    this year" headline. Defaults to the current year.

    Future months (for the current year) are included as zeros rather
    than omitted, so the chart's x-axis always spans all 12 months.
    """
    now = datetime.utcnow()
    year = year or now.year

    months = []
    total_income = 0.0
    total_expense = 0.0

    for month in range(1, 13):
        start, end = _month_bounds(year, month)
        # Don't bother querying months that haven't happened yet this
        # year — they're guaranteed to be zero and querying them just
        # wastes a round trip.
        if year == now.year and month > now.month:
            income, expense = 0.0, 0.0
        else:
            income, expense = _totals_for_range(db, current_user.id, start, end)

        months.append(
            {
                "month": month,
                "income": income,
                "expense": expense,
                "net": income - expense,
            }
        )
        total_income += income
        total_expense += expense

    return {
        "year": year,
        "months": months,
        "total_income": total_income,
        "total_expense": total_expense,
        "total_net": total_income - total_expense,
    }
