"""
Budget routes: set a monthly spending limit per category and check
how close the user is to hitting it (used for the "budget alert" UI).
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Budget, Transaction, TransactionType, User
from app.schemas import BudgetCreate, BudgetOut, BudgetStatus

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("/", response_model=list[BudgetOut])
def list_budgets(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """List all budgets the user has configured."""
    return db.query(Budget).filter(Budget.user_id == current_user.id).all()


@router.post("/", response_model=BudgetOut, status_code=201)
def create_budget(
    budget_in: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Set (or overwrite) a monthly limit for one category."""
    budget = Budget(**budget_in.model_dump(), user_id=current_user.id)
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return budget


@router.get("/status", response_model=list[BudgetStatus])
def budget_status(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    For every configured budget, calculate how much has actually been
    spent in the current calendar month vs. the limit — this is what
    drives the progress bars and "you're close to your limit" alerts.
    """
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)

    budgets = db.query(Budget).filter(Budget.user_id == current_user.id).all()
    results = []

    for budget in budgets:
        spent = (
            db.query(func.coalesce(func.sum(Transaction.amount), 0.0))
            .filter(
                Transaction.user_id == current_user.id,
                Transaction.category_id == budget.category_id,
                Transaction.type == TransactionType.expense,
                Transaction.date >= month_start,
            )
            .scalar()
        )
        remaining = budget.monthly_limit - spent
        percent_used = (spent / budget.monthly_limit * 100) if budget.monthly_limit else 0

        results.append(
            BudgetStatus(
                id=budget.id,
                category_id=budget.category_id,
                monthly_limit=budget.monthly_limit,
                spent=spent,
                remaining=remaining,
                percent_used=round(percent_used, 1),
            )
        )

    return results


@router.delete("/{budget_id}", status_code=204)
def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a budget limit."""
    budget = (
        db.query(Budget)
        .filter(Budget.id == budget_id, Budget.user_id == current_user.id)
        .first()
    )
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(budget)
    db.commit()
