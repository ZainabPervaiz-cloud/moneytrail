# Finance Tracker — Backend

FastAPI REST API for the Finance Tracker app.

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # then edit .env if needed
```

## Run

```bash
uvicorn app.main:app --reload
```

- API base URL: http://localhost:8000/api
- Interactive docs (Swagger UI): http://localhost:8000/docs

## Project Layout

```
app/
├── main.py          FastAPI app + router wiring
├── config.py         Settings loaded from .env
├── database.py       SQLAlchemy engine/session setup
├── models.py          DB tables (User, Category, Transaction, Budget)
├── schemas.py         Request/response validation shapes
├── auth.py            Password hashing + JWT issuing/verification
└── routers/
    ├── auth.py         /api/auth/signup, /api/auth/login
    ├── categories.py   /api/categories
    ├── transactions.py /api/transactions
    ├── budgets.py       /api/budgets
    └── analytics.py     /api/analytics (summary, by-category, insight)
```
