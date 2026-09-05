"""
Category routes: create and list income/expense categories.

Every category belongs to exactly one user (enforced below), so one
user's categories are never visible to another.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Category, User
from app.schemas import CategoryCreate, CategoryOut

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=list[CategoryOut])
def list_categories(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Return every category belonging to the logged-in user."""
    return db.query(Category).filter(Category.user_id == current_user.id).all()


@router.post("/", response_model=CategoryOut, status_code=201)
def create_category(
    category_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new custom category for the logged-in user."""
    category = Category(**category_in.model_dump(), user_id=current_user.id)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=204)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a category — only if it belongs to the requesting user."""
    category = (
        db.query(Category)
        .filter(Category.id == category_id, Category.user_id == current_user.id)
        .first()
    )
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    db.delete(category)
    db.commit()
