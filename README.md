# LLM Command Center

LLM Command Center is an observability platform for monitoring, tracing, evaluating, and analyzing large language model workloads.

---

## Overview

Large language model pipelines present unique monitoring challenges due to non-deterministic outputs, varied latency behaviors, and complex billing metrics. Traditional APM tools lack abstractions for token usage tracking, prompt-response hierarchies, and automated semantic evaluation.

This platform provides developers with tools to capture execution traces, log detailed token consumption, and execute evaluation scorers. By capturing metadata at each inference boundary, the system identifies performance regressions and computes execution costs across OpenAI and local Ollama model profiles.

Primary use cases include tracing multi-step LLM operations, monitoring latency and error metrics across models, analyzing token cost efficiency, and tracking response quality through semantic scorers.

---

## Key Capabilities

- **Request tracing:** Trace executions and capture nested spans.
- **Workflow orchestration:** Route and process queries through evaluation and logging pipelines.
- **Latency monitoring:** Track latency percentiles (P50, P95, P99) and duration frequency buckets.
- **Token usage analytics:** Log prompt and completion token counts.
- **Cost analysis:** Calculate costs based on model token rates.
- **Provider comparison:** Compare metrics across OpenAI and Ollama integrations.
- **Evaluation workflows:** Run groundedness and similarity scorers.
- **Alert management:** Monitor statistically calculated regression alerts.
- **Dashboard visualization:** Render overview metrics, trace explorer, and comparison tables.
- **REST API:** Endpoints for payload ingestion, analytics, and settings.
- **PostgreSQL persistence:** Persistence of telemetry records using database schemas.
- **Docker deployment:** Local development setup with Docker Compose.

---

## Technology Stack

### Backend
- Python
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- AsyncPG
- Pydantic

### Frontend
- React
- Vite
- Tailwind CSS
- React Router
- Zustand
- Axios
- Recharts

### Database
- PostgreSQL
- Supabase

### Infrastructure
- Docker
- Docker Compose
- Render
- Vercel

### Developer Tooling
- Pytest
- Ruff
- MyPy
- GitHub Actions

---

## Architecture

```text
       Client Applications
                │
                ▼
  React Dashboard <───[REST / CORS]───> FastAPI API
                                             │
                                             ▼
                                     Telemetry Engine
                                             │
                                             ▼
                                      Analytics Engine
                                             │
                                             ▼
                                     Evaluation Engine
                                             │
                                             ▼
                                     Persistence Layer
                                             │
                                             ▼
                                         PostgreSQL
```

---

## Workflow

The lifecycle of a single request proceeds through the following pipeline:

```text
User Request ──► Provider ──► Telemetry ──► Evaluation ──► Analytics ──► Database ──► Dashboard
```

1. **User Request:** Client triggers an inference pipeline execution.
2. **Provider:** Request is routed through the proxy gateway to OpenAI or local Ollama.
3. **Telemetry:** Execution metadata, latency, and tokens are captured.
4. **Evaluation:** Automated scorers execute context checks and semantic similarity calculations.
5. **Analytics:** Performance KPIs and daily rolling averages are computed.
6. **Database:** Operations records are stored in PostgreSQL using async connections.
7. **Dashboard:** Consolidated trends, latency distributions, and active alert warnings render in the UI.

---

## Screenshots

Screenshots of the application dashboard are stored under:

- Dashboard: `docs/screenshots/overview.png`
- Analytics: `docs/screenshots/analytics.png`
- Trace Explorer: `docs/screenshots/traces.png`
- Alerts: `docs/screenshots/alerts.png`
- Model Comparison: `docs/screenshots/model_comparison.png`
- Evaluation Dashboard: `docs/screenshots/evaluations.png`
- Settings: `docs/screenshots/settings.png`
- Login: `docs/screenshots/login.png`

---

## Repository Structure

```text
llm-observability-pipeline/
├── backend/                  # FastAPI Application Root
│   ├── app/                  # Main package code (api, models, services)
│   ├── alembic/              # Database schema migrations
│   └── requirements.txt      # Python backend packages list
├── frontend/                 # React Application Root
│   ├── src/                  # Components, pages, and Zustand hooks
│   └── package.json          # Node packages definitions
├── docs/                     # Platform manuals
│   ├── api.md                # REST API reference manual
│   ├── architecture.md       # Architecture and DB schema design
│   └── deployment.md         # Production deployment instructions
├── tests/                    # Backend Pytest test suites
└── docker-compose.yml        # Multi-container orchestration configurations
```

---

## Installation

### Backend
1. Initialize the virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\Activate.ps1
   ```
2. Install dependencies:
   ```bash
   cd backend
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
3. Initialize the database schema and seed mock values:
   ```bash
   python -m alembic upgrade head
   python seed.py
   ```
4. Run the API:
   ```bash
   python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
   ```

### Frontend
1. Install Node packages:
   ```bash
   cd frontend
   npm install
   ```
2. Build assets:
   ```bash
   npm run build
   ```
3. Start the local preview:
   ```bash
   npm run preview
   ```

### Docker
1. Start local container services:
   ```bash
   docker compose up --build
   ```

### Environment
1. Set up the local environment settings by copying the template file:
   ```bash
   cp .env.example .env
   cp .env.example backend/.env
   ```

---

## Configuration

The application reads configurations from the following environment variables:

| Variable | Description |
|---|---|
| `ENVIRONMENT` | Deployment environment state (`development`, `production`). |
| `DATABASE_URL` | SQLAlchemy async connection URI. |
| `OPENAI_API_KEY` | OpenAI API access token. |
| `OPENAI_API_BASE` | Base endpoint URL override for OpenAI routing. |
| `OLLAMA_API_BASE` | Host endpoint URL for the local Ollama runtime. |
| `VITE_API_BASE_URL` | React client target backend REST URL endpoint. |

---

## API

The backend serves API requests at `/api/v1`. Refer to [api.md](docs/api.md) for full payload reference specifications.

- **Authentication:** `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- **Telemetry Ingestion:** `POST /traces` (saves spans payload)
- **Analytics:** `GET /analytics/kpis`, `GET /analytics/trends`, `GET /analytics/model-comparison`
- **Evaluations:** `GET /evaluations`, `GET /evaluations/worst-responses`
- **Alerts:** `GET /alerts`, `PATCH /alerts/{alert_id}/resolve`
- **Inference Proxy:** `POST /inference`

---

## Database

Persisted schemas are managed in PostgreSQL.
- **SQLAlchemy:** Non-blocking async connections engine mapping Python classes to PostgreSQL.
- **Alembic:** Database schema migrations runner.
- **PostgreSQL:** Persists tables for traces, spans, evaluations, alerts, and model pricing.

---

## Testing

Verify the application codebase using:
- **Pytest:** `python -m pytest tests -v`
- **Ruff:** `python -m ruff check .`
- **MyPy:** `python -m mypy --strict backend/app --explicit-package-bases`
- **Build:** `npm run build` inside `frontend/` directory

---

## Deployment

Refer to [deployment.md](docs/deployment.md) for instructions on provisioning the database (Supabase), backend API web service (Render), and static dashboard UI hosting (Vercel).

---

## Roadmap

- **Role-based access control (RBAC):** Define project access levels.
- **Background workers:** Offload scorers execution to Celery.
- **WebSocket streaming:** Push new traces and alerts dynamically.
- **Prometheus metrics:** Export system KPIs to monitoring networks.
- **Grafana dashboards:** Expose operational dashboards.
- **Distributed tracing improvements:** Add trace context propagation.
- **Multi-project workspaces:** Partition tracing logs across separate workspaces.

---

## License

MIT
