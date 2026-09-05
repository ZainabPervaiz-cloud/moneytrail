"""
Transaction routes: the core CRUD for logging income/expenses.

Every query below filters by `user_id == current_user.id` so a user can
only ever see or modify their own transactions, even if they guess
another user's transaction id.
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Transaction, User
from app.schemas import TransactionCreate, TransactionOut

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("/", response_model=list[TransactionOut])
def list_transactions(
    category_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List the logged-in user's transactions, optionally filtered by
    category and/or date range — powers the history view and its filters.
    """
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)

    if category_id is not None:
        query = query.filter(Transaction.category_id == category_id)
    if start_date is not None:
        query = query.filter(Transaction.date >= start_date)
    if end_date is not None:
        query = query.filter(Transaction.date <= end_date)

    return query.order_by(Transaction.date.desc()).limit(limit).all()


@router.post("/", response_model=TransactionOut, status_code=201)
def create_transaction(
    tx_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Log a new income or expense entry."""
    tx = Transaction(
        **tx_in.model_dump(exclude_unset=True),
        user_id=current_user.id,
    )
    # Default to "now" if the client didn't specify a date.
    if tx.date is None:
        tx.date = datetime.utcnow()

    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx


@router.put("/{tx_id}", response_model=TransactionOut)
def update_transaction(
    tx_id: int,
    tx_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Edit an existing transaction (e.g. fix a typo'd amount or category)."""
    tx = (
        db.query(Transaction)
        .filter(Transaction.id == tx_id, Transaction.user_id == current_user.id)
        .first()
    )
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    for field, value in tx_in.model_dump(exclude_unset=True).items():
        setattr(tx, field, value)

    db.commit()
    db.refresh(tx)
    return tx


@router.delete("/{tx_id}", status_code=204)
def delete_transaction(
    tx_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a transaction permanently."""
    tx = (
        db.query(Transaction)
        .filter(Transaction.id == tx_id, Transaction.user_id == current_user.id)
        .first()
    )
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    db.delete(tx)
    db.commit()
