"""
Default categories every user should start with, so the transaction and
budget forms never show an empty category dropdown on a fresh account.

Marked `is_default=True` on the Category row so the frontend (or a
future "reset categories" feature) can tell these apart from ones the
user created themselves.
"""

from app.models import TransactionType

DEFAULT_CATEGORIES = [
    {"name": "Food", "type": TransactionType.expense, "icon": "🍔"},
    {"name": "Transport", "type": TransactionType.expense, "icon": "🚗"},
    {"name": "Rent", "type": TransactionType.expense, "icon": "🏠"},
    {"name": "Shopping", "type": TransactionType.expense, "icon": "🛍️"},
    {"name": "Entertainment", "type": TransactionType.expense, "icon": "🎬"},
    {"name": "Health", "type": TransactionType.expense, "icon": "💊"},
    # Catch-all categories for anything that doesn't fit the presets above
    # (e.g. "Umrah", a one-off gift, a repair bill) — the frontend prompts
    # for a short note when one of these is selected, so the specific
    # thing still shows up in the transaction list even though it's
    # grouped under "Other" for budgeting/analytics purposes.
    {"name": "Other", "type": TransactionType.expense, "icon": "🔖"},
    {"name": "Salary", "type": TransactionType.income, "icon": "💼"},
    {"name": "Other Income", "type": TransactionType.income, "icon": "💰"},
]
