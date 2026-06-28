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

## System Architecture & Folder Layout
- `backend/`: FastAPI endpoints, Alembic migrations, database models, repositories, services, and seeder.
- `dashboard/`: Streamlit dashboard with custom dark CSS, modular components, charts, and query tester page settings.
- `tests/`: 4 integration test cases verifying SDK, repositories, scorers, and proxy routers.

---

## Technical Stack & Schemas
- Python 3.11, FastAPI, SQLAlchemy 2.0 (async session generators), PostgreSQL 16 / SQLite, Alembic, Streamlit.
- Databases: Trace, Span, Evaluation, ModelPricing, Alert. All Numeric models configure `asdecimal=False` on the type constructor level.
- Datetime parsing uses UTC default timestamps with Python timezone-compatibility offsets.

---

## Completed Implementations
- **Core backend foundation**: Declarative async session pooling, connection optimized setups, and Alembic versions migrations.
- **Provider Registry**: OpenAI and Ollama API connectors reusing a shared HTTP client lifespan pool and wrapped in Circuit Breakers.
- **Telemetry SDK**: Asynchronous `TraceContext` and `SpanContext` contexts wrapping token usage, logging outputs, and latency calculations.
- **Evaluations Factory**: Registry mapping 5 modular scorers (hallucination, groundedness, faithfulness, Jaccard overlap similarity, and overall quality index) and exporting report downloads.
- **KPI Analytics & Warnings**: Computes throughput distributions and flags latency regressions.
- **Diagnostics Alert Engine**: Automated checks flagging latency duration limits and cost thresholds, with active/acknowledged workflow support.
- **Advanced Analytics & Predictions**: Computes P50, P90, P95, and P99 latency percentiles, dynamic anomaly logs, and linear trend predictive forecasts.
- **Operational Dashboard**: Modern 7-page dark CSS UI console mapping latency Gantt chart timelines, rolling average curves, providers comparative stats, pricing forms, and settings checks.
- **Database & Environment Integrity**: Rebuilt development environment using official CPython 3.13 configurations, bypassing embedded MySQL Shell runtime conflicts. Corrected lazy-loading relation accesses in the telemetry ingestion layer to prevent async greenlet execution crashes.

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
