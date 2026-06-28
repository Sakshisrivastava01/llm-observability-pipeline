# Project Identity

- **Project Name**: Enterprise LLM Observability Platform
- **Purpose**: A production-grade observability platform for high-throughput model inference tracing, token cost analytics, quality evaluation scoring, and performance monitoring.
- **Repository Layout**:
  - `backend/`: Ingest API, Alembic migrations, database models, and seeding scripts
  - `dashboard/`: Presentation-only Streamlit dashboard UI
  - `docs/`: Professional markdown documentation files
  - `tests/`: Integration test suites
  - `brain.md`: Permanent AI memory (this file)
  - `README.md`: User & contributor landing page
  - `docker-compose.yml`: Containerized PostgreSQL & API configurations

---

## Technical Stack

- **Core**: Python 3.11
- **API Engine**: FastAPI (asynchronous endpoints)
- **Database ORM**: SQLAlchemy 2.0 (async session managers) / Alembic
- **Database store**: PostgreSQL 16 (production) / SQLite (local testing)
- **Dashboard Interface**: Streamlit / Plotly Express (visualizations)
- **Quality Checks**: Ruff (linter/formatter) / pytest (testing runner) / MyPy (static analysis)

---

## Coding Standards & Conventions

- **SOLID Principles**: Decoupled database queries (Repositories), transaction orchestration (Services), providers (ProviderFactory), and scorers (ScorerFactory).
- **Asynchronous Correctness**: Asynchronous SQLAlchemy engine operations are strictly isolated inside repositories/services and use `await` patterns.
- **Database Safety**: Database write catch blocks explicitly invoke `await self.db.rollback()` to prevent SQLite transaction pollution.
- **Naming Conventions**:
  - Python files, folders, and variables: `snake_case`.
  - Python classes: `PascalCase`.
  - Configuration constants: `UPPERCASE`.
  - REST API JSON keys and query parameters: `snake_case` (e.g. `trace_id`).

---

# AI Instructions

Every coding session MUST start by reading this file.

Never rewrite existing architecture.

Never remove working functionality.

Maintain SOLID principles.

Keep repository ATS friendly.

Avoid unnecessary dependencies.

Avoid duplicate code.

Maintain modular architecture.

Prefer reusable components.

Keep documentation synchronized.

Always update `brain.md` after major architectural changes.
