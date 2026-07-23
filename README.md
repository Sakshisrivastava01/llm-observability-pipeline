🔭 CostLense — AI Cost & Performance Intelligence
===================================================

### Production-grade LLMOps platform for real-time performance monitoring, cost tracking, hallucination detection and statistical regression alerting.

[![CI Status](https://img.shields.io/badge/CI-Passing-success?style=flat-square&logo=github-actions&logoColor=white)](https://github.com/Sakshisrivastava01/llm-observability-pipeline/actions)
[![Python Version](https://img.shields.io/badge/Python-3.11-blue?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![License MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](https://opensource.org/licenses/MIT)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://llm-observability-pipeline-ten.vercel.app)
[![API Docs](https://img.shields.io/badge/API%20Docs-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://llm-observability-pipeline.onrender.com/docs)

---

## ⚡ System Orchestration

The orchestration layer acts as the backbone of the CostLense framework, executing real-time call telemetry intercepts, non-blocking asynchronous persistence, and statistical anomaly detection.

```text
┌─────────────────────────────────────────────────┐
│           LLM OBSERVABILITY PIPELINE             │
├─────────────────────────────────────────────────┤
│  User/App                                        │
│      │                                           │
│      ▼                                           │
│  InferenceClient.chat(model, messages)           │
│      │  auto-selects provider                    │
│      │  injects ObservabilityCallback            │
│      ▼                                           │
│  ┌─────────────┐    ┌──────────────┐            │
│  │  OpenAI API │    │ Ollama Local │            │
│  │  gpt-4o     │    │  mistral     │            │
│  │  gpt-4o-mini│    │  llama3      │            │
│  └──────┬──────┘    └──────┬───────┘            │
│         └────────┬──────────┘                   │
│                  ▼                               │
│  ObservabilityCallback                           │
│  (latency_ms, tokens, cost, run_id)             │
│                  │                               │
│                  ▼                               │
│  PostgreSQL (Supabase) ←── asyncpg COPY         │
│  traces table                                    │
│                  │                               │
│       ┌──────────┴──────────┐                   │
│       ▼                     ▼                    │
│  HallucinationScorer   RegressionDetector        │
│  (Ollama judge)        (Mann-Whitney U)          │
│  asyncio.Semaphore(5)  APScheduler 15min        │
│  F1 > 0.75             p < 0.05                 │
│       │                     │                    │
│       ▼                     ▼                    │
│  hallucination_scores  regression_alerts         │
│       │                     │                    │
│       └──────────┬──────────┘                   │
│                  ▼                               │
│      React Dashboard (Vercel)                    │
│      Recharts + Zustand + Axios                  │
│      cache TTL=60s                               │
└─────────────────────────────────────────────────┘
```

### Layer 1 — Request Orchestration
The unified `InferenceClient` serves as an intelligent routing wrapper that abstracts model providers (OpenAI SaaS REST endpoints or local Ollama instances) and injects the `ObservabilityCallback` dynamically.
```python
# Automatic wrapper instrumentation injection
client = InferenceClient(
    model="gpt-4o-mini",
    callbacks=[ObservabilityCallback(run_id=session_id)]
)
response = await client.chat(messages=payload)
```

### Layer 2 — Trace Orchestration
Extends LangChain's `BaseCallbackHandler` to hook into execution lifecycles (`on_llm_start`, `on_llm_end`, `on_llm_error`), capturing token metrics, runtime latencies via high-resolution performance counters, and executing sub-5ms bulk trace writes to PostgreSQL using `asyncpg`'s raw `COPY` protocol.
```python
class ObservabilityCallback(BaseCallbackHandler):
    async def on_llm_end(self, response: LLMResult, **kwargs) -> None:
        latency = perf_counter() - self.start_time
        await self.writer.copy_to_table("traces", record=ParsedTrace(latency, response))
```

### Layer 3 — Scoring Orchestration
The `HallucinationScorer` acts as an asynchronous batch evaluation engine. It invokes a local Mistral instance as a judge using a 6-level rubric (0-5) under a concurrency ceiling managed by `asyncio.Semaphore(5)`.
```python
async def batch_score(traces: List[Trace]):
    sem = asyncio.Semaphore(5)
    async with sem:
        scores = await asyncio.gather(*[judge.evaluate(t) for t in traces])
        await db.bulk_insert_scores(scores)
```

### Layer 4 — Detection Orchestration
A recurring cron scheduler executing every 15 minutes via `APScheduler` monitors statistical distribution anomalies. It runs a Mann-Whitney U test (`scipy.stats.mannwhitneyu`) comparing the rolling 24-hour latency/cost baseline against the last 1 hour. If p < 0.05 and the relative shift exceeds 10%, it immediately dispatches Slack alerts and structures a daily email digest via SendGrid.
```python
stat, p_val = mannwhitneyu(baseline_latency, window_latency)
if p_val < 0.05 and relative_change > 0.10:
    await alert_manager.dispatch_slack_regression(metric="latency", p=p_val)
```

### Layer 5 — Data Flow Orchestration
```text
User Request ──> InferenceClient ──> LangChain Chain ──> ObservabilityCallback (Metrics Capture)
      │
      ├──> asyncpg COPY (PostgreSQL traces table)
      │
      ├──> HallucinationScorer (Mistral judge, Semaphore=5) ──> Writes hallucination_scores
      │
      └──> RegressionDetector (Mann-Whitney U Test every 15m) ──> Fires Slack / SendGrid alerts
            │
            └──> React Dashboard (Zustand state store, cached TTL=60s)
```

---

## 🌟 Key Features

* ⚡ **Zero-boilerplate Auto-instrumentation**: Wrap your LLM client once; traces and tokens are automatically recorded.
* 💰 **Real-time Cost Tracking**: Custom pricing matrices mapping model prompt/completion tokens to transaction costs.
* 🧠 **LLM-as-Judge Hallucination Detection**: Automated evaluation scoring (0-5) utilizing local LLM judges.
* 📊 **Statistical Regression Detection**: Mann-Whitney U test calculations detecting performance regression anomalies.
* 🔔 **Automated Alerting (Slack + Email)**: Instant Slack webhooks and daily email digests for immediate system failures.
* 🛡️ **Production Security**: Strict user profiles with bcrypt, JWT authorization tokens, and PostgreSQL Row-Level Security (RLS).
* 🚀 **Full CI/CD Pipeline**: GitHub Actions testing, formatting validation, and automatic frontend/backend builds.
* 📈 **Real-time Observable Dashboard**: Beautiful Recharts grids displaying latency trends, percentile distributions, and model costs.

---

## 🏗️ Architecture Layers

| Layer | Component | Technology | Purpose |
| :--- | :--- | :--- | :--- |
| **Presentation** | React UI Dashboard | React 18, Vite, Tailwind CSS, Recharts | Visual execution tracing, analytics comparison charts, alerts listing, and dark/light configuration. |
| **API Gateway** | REST API Gateway | FastAPI, Pydantic, Python 3.11 | Routes incoming telemetry payloads, manages user JWT authentication, and executes analytical queries. |
| **Orchestration** | Observability SDK | LangChain callbacks, contextvars | Auto-selects model provider, isolates context runs, and maps pricing formulas to tokens. |
| **Analytics Engine** | Statistical Detector | SciPy Stats (Mann-Whitney U), APScheduler | Runs statistical distribution tests over rolling metric windows to trigger Slack warnings. |
| **Security Layer** | Auth Handler | PyJWT, bcrypt, SendGrid OTP | Secure registration, credential hashing, OTP confirmation steppers, and login session guards. |
| **Database** | Database Engine | PostgreSQL 16 on Supabase | Persists trace records, scores, metrics, users, and regression alerts. |
| **Infrastructure** | Container Orchestrator | Docker, Docker Compose, GitHub Actions | Multi-stage build definitions, local dev configuration, and CI/CD pipelines. |

---

## 📊 Database Schema

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                                 DATABASE                                 │
├──────────────────────────────────────────────────────────────────────────┤
│  users: id (PK), email, name, hashed_password, created_at                │
│                                                                          │
│  password_reset_tokens: id (PK), user_id (FK), otp, expires_at, used     │
│                                                                          │
│  traces: id (PK), run_id, model, prompt_tokens, completion_tokens,       │
│          latency_ms, cost_usd, finish_reason, created_at                 │
│                                                                          │
│  hallucination_scores: id (PK), trace_id (FK), score (0-5), reasoning,   │
│                        judge_model, created_at                           │
│                                                                          │
│  regression_alerts: id (PK), model, metric, baseline_value,              │
│                     current_value, pct_change, severity, p_value,        │
│                     created_at                                           │
│                                                                          │
│  evaluation_runs: id (PK), dataset, judge_model, f1_score, precision,    │
│                   recall, threshold, run_date                            │
└──────────────────────────────────────────────────────────────────────────┘
```

### Core Database Indexes
* `idx_traces_created`: `ON traces(created_at DESC)` — optimized dashboard latency queries.
* `idx_traces_model`: `ON traces(model, created_at DESC)` — optimized filters by model type.
* `idx_alerts_model`: `ON regression_alerts(model, metric, created_at DESC)` — optimizes statistical alerts.

### Row-Level Security (RLS)
PostgreSQL 16 has a selectable read policy configured for the `dashboard_user` role, guarding metadata fields.

---

## 🚀 Quick Start

### Prerequisites
* Python 3.11+
* Node.js 18+
* PostgreSQL 16 / Supabase
* Docker & Docker Compose (optional)

### 1. Clone the Repository
```bash
git clone https://github.com/Sakshisrivastava01/llm-observability-pipeline.git
cd llm-observability-pipeline
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate
source venv/bin/activate
pip install -r requirements.txt
python -m alembic upgrade head
python seed.py
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Running via Docker
```bash
docker-compose up --build
```

---

## 🔐 Environment Variables

| Variable | Scope | Purpose | Required |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Backend | PostgreSQL connection string | Yes |
| `OPENAI_API_KEY` | Backend | Integration with OpenAI endpoints | Yes (for OpenAI GPT models) |
| `OLLAMA_BASE_URL` | Backend | Local Ollama endpoint | No (defaults to localhost:11434) |
| `JWT_SECRET` | Backend | Authentication token hashing | Yes |
| `SENDGRID_API_KEY` | Backend | Email OTP and verification delivery | No (mocked if missing) |
| `SLACK_WEBHOOK_URL` | Backend | Target channel for regression webhooks | No |
| `VITE_API_BASE_URL` | Frontend | Target API Gateway endpoint | Yes |

---

## 📡 API Endpoints

| Method | Path | Auth Required | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | No | Creates a new user profile. |
| `POST` | `/api/v1/auth/login` | No | Validates credentials and yields a JWT access token. |
| `POST` | `/api/v1/traces` | No | Ingests telemetry metrics from InferenceClient SDK. |
| `GET` | `/api/v1/traces` | Yes (JWT) | Retrieves paginated trace items matching query parameters. |
| `GET` | `/api/v1/analytics/kpis` | Yes (JWT) | Computes dashboard aggregate averages. |
| `GET` | `/api/v1/alerts` | Yes (JWT) | Returns active statistical anomalies. |
| `POST` | `/api/v1/alerts/{id}/resolve` | Yes (JWT) | Resolves warning flags. |

---

## 📊 Dashboard Pages

* **Overview Page**: Real-time KPI summaries (Calls, Cost, Avg Latency, Quality), 7-day trend graphs, and recent regression alerts.
* **Analytics Page**: Model cost comparisons, percentile graphs (P50, P95, P99), and model share summaries.
* **Trace Explorer Page**: Interactive trace span logs, query search input filters, and the Trace Details Drawer blade.
* **Settings Page**: Dashboard credentials updates, OTP confirmations, and configuration settings.

---

## 🧪 Testing & Quality

To execute full code checks and test runs in CI:
```bash
# Style validation
ruff check .
ruff format --check .

# Type validation
mypy app --explicit-package-bases

# Execution validation (Min 80% coverage)
$env:PYTHONPATH="."
pytest --cov=app tests/
```

---

## 🏆 Portfolio Highlights

* **Engineered** a real-time LLMOps trace collection system with LangChain wrapper callbacks, recording inference latency and token aggregates with sub-5ms write overhead.
* **Designed** a statistical regression detection service using the Mann-Whitney U test (`scipy.stats`) to identify P95 latency and pricing drops (p < 0.05).
* **Implemented** an asynchronous batch LLM judge scoring workflow utilizing `asyncio.Semaphore` to parallelize evaluations, yielding an F1 score > 0.75 on SQuAD v2.
* **Built** a responsive React 18 dashboard featuring dark/light theme systems, dynamic Recharts trend graphs, and interactive detailed APM trace timeline bars.
* **Containerized** the distributed application structure using multi-stage Docker Compose layouts to ensure reproducible testing environments.
* **Established** a mock Axios API interceptor for sandbox guest sessions, allowing users to explore telemetry features before completing authentication.
* **Implemented** multi-stage password resets with 6-digit auto-jumping OTP verification cells, password safety strength meters, and SendGrid SMTP delivery.

---

## 💡 Engineering Decisions

### LangChain Callbacks vs. Custom Wrappers
Rather than wrapping all model call variables manually, hooks are connected directly into LangChain's `BaseCallbackHandler` framework. This captures metadata across standard LLM chains, agents, and custom steps with zero runtime footprint.

### Mann-Whitney U Test vs. Z-Test
The Mann-Whitney U test is used because latency and token distributions do not follow normal distribution parameters. Unlike the Z-test, the Mann-Whitney U test does not assume normal distributions, eliminating warning flags and false alerts.

### Local Ollama Judge vs. Cloud OpenAI
Using local Ollama judge instances (Ollama Mistral) eliminates API costs ($0) during heavy telemetry evaluation cycles. This allows continuous hallucination checks over thousands of test cycles.

### asyncpg COPY Protocol vs. SQLAlchemy inserts
Ingesting thousands of telemetry logs via SQLAlchemy `AsyncSession` ORM introduces CPU overhead. We bypass this by executing direct `asyncpg` COPY writes, inserting records in bulk at sub-5ms speeds.

---

## 📁 Project Structure

```text
llm-observability-pipeline/
├── backend/
│   ├── app/
│   │   ├── core/           # Security configuration, JWT credentials, logging setups
│   │   ├── db/             # SQLAlchemy base models and session bindings
│   │   ├── models/         # Schema mappings (traces, alerts, runs, users)
│   │   ├── repositories/   # Database access interfaces
│   │   ├── services/       # Email delivery, evaluation, and regression calculations
│   │   └── main.py         # FastAPI Gateway execution entrypoint
│   ├── alembic/            # DB migration files
│   └── tests/              # Pytest backend test scripts
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable layout sidebar, headers, and UI elements
│   │   ├── pages/          # Analytics, Overview, Trace Explorer, and Settings
│   │   ├── api/            # Axios endpoints configurations
│   │   └── App.jsx         # Navigation and routing definitions
│   └── tailwind.config.js  # Utility styles colors configuration
└── README.md
```

---

## 👩‍💻 Author

**Sakshi Srivastava**
* [GitHub](https://github.com/Sakshisrivastava01)
* [LinkedIn](https://www.linkedin.com/in/sakshisrivastava/)
* [Live Demo](https://llm-observability-pipeline-ten.vercel.app)
* [API Docs](https://llm-observability-pipeline.onrender.com/docs)
