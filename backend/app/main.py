"""
FastAPI application entrypoint.

Run locally with:  uvicorn app.main:app --reload
Interactive API docs are then available at http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import analytics, auth, budgets, categories, transactions

# Create all tables on startup if they don't already exist. Fine for
# development; in production this is replaced by Alembic migrations so
# schema changes are tracked and reversible.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Finance Tracker API",
    description="REST API for the Finance Tracker PWA — auth, transactions, budgets, analytics.",
    version="0.1.0",
)

# Allows the frontend (running on a different origin, e.g. localhost:5173
# in dev or a different domain in production) to call this API from the
# browser. Restrict `allow_origins` to your real frontend URL in production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Each router owns one resource's routes and is mounted here under /api.
app.include_router(auth.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(budgets.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")


@app.get("/api/health")
def health_check():
    """Simple liveness check used by hosting platforms and uptime monitors."""
    return {"status": "ok"}
