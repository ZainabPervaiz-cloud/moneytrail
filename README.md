# Finance Tracker

A personal finance tracker that lets users log income/expenses, see spending
analytics, set budgets, and get alerts — built as an installable
**Progressive Web App (PWA)** so it can be added to a phone's home screen
like a native app, with no app store required.

## Tech Stack
- **Frontend:** React + Vite + TypeScript + Tailwind CSS, installable as a PWA
- **Backend:** FastAPI (Python)
- **Database:** SQLite for local dev, PostgreSQL in production
- **Auth:** JWT (access + refresh tokens), bcrypt password hashing
- **Charts:** Recharts

## Project Structure
```
finance-tracker/
├── backend/     FastAPI REST API, DB models, auth
├── frontend/    React PWA client
└── README.md
```

## Status
🚧 In active development on the `dev` branch. `main` only receives
confirmed, working merges.

## Getting Started
See `backend/README.md` and `frontend/README.md` for setup instructions
(added as each part is scaffolded).
