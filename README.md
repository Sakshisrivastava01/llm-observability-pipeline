<p align="center">
  <h1 align="center">LLM Observability & Cost-Performance Pipeline</h1>
  <p align="center">Production-ready observability platform for monitoring LLM applications through latency analysis, token usage tracking, execution tracing, cost analytics, and interactive performance dashboards.</p>
</p>

<p align="center">
  <a href="https://llm-observability-pipeline-ten.vercel.app">
    <img src="https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
  </a>
  <a href="https://llm-observability-pipeline.onrender.com/docs">
    <img src="https://img.shields.io/badge/API%20Docs-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="API Docs" />
  </a>
  <a href="https://github.com/Sakshisrivastava01/llm-observability-pipeline">
    <img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Repository" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python 3.11" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 5" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL 16" />
  <img src="https://img.shields.io/badge/SQLAlchemy-2.0-D71F28?style=flat-square&logo=python&logoColor=white" alt="SQLAlchemy" />
  <img src="https://img.shields.io/badge/JWT-Supported-black?style=flat-square&logo=JSON%20web%20tokens" alt="JWT" />
  <img src="https://img.shields.io/badge/Tailwind--CSS-3.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 3.0" />
  <img src="https://img.shields.io/badge/Docker-Supported-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/OpenAI-Integrations-412991?style=flat-square&logo=openai&logoColor=white" alt="OpenAI" />
  <img src="https://img.shields.io/badge/Ollama-Supported-black?style=flat-square&logo=ollama&logoColor=white" alt="Ollama" />
</p>

---

## Project Overview

LLM Observability & Cost-Performance Pipeline instruments large language model inference requests across multiple providers, supporting both cloud-based OpenAI REST endpoints and local Ollama deployments. By integrating custom context-bound SDK modules, the system automatically captures execution latency, tracks input/output token counts, and estimates runtime transaction pricing without adding query latency. Collected data is persisted to a PostgreSQL database via SQLAlchemy async sessions, enabling developers to monitor performance trends, debug trace spans, and evaluate consistency metrics. It provides an intuitive, React-based dashboard for side-by-side model cost-performance comparisons and securely handles authentication via JWT access controls.

---

## Features

| Feature | Details |
| :--- | :--- |
| **Multi-Provider LLM Support** | Direct execution routing to OpenAI REST endpoints and local Ollama integrations. |
| **Request Tracing** | Hierarchical trace and span context capturing using Python's `contextvars`. |
| **Token Usage Analytics** | Live tracking of prompt and completion token counts per execution request. |
| **Cost Monitoring** | Instant cost estimation mapping input and output tokens to pricing models. |
| **Latency Monitoring** | Granular timing checks logging span-level and overall request processing times. |
| **Performance Dashboard** | Responsive React application mapping KPIs, latency distributions, and throughput trends. |
| **JWT Authentication** | Secure user registration, credential hashing with bcrypt, and session authorization. |
| **REST APIs** | Standardized FastAPI endpoints validated via strict Pydantic schemas. |
| **Historical Metrics** | Database queries isolating percentile trends (P50, P90, P95, P99) and errors. |
| **Interactive Charts** | Visual data plotting using Recharts for dynamic multi-model metrics comparisons. |
| **Secure User Management** | Protected user profiles, access controls, and validation token OTP password resets. |

---

## System Architecture

```mermaid
flowchart TD
    Dashboard[React Dashboard] -->|User Requests & JWT| Gateway[FastAPI REST API]
    Gateway -->|Auth Guard| JWT[JWT Authentication]
    Gateway -->|Telemetry Pipeline| Tracing[Tracing Layer]
    Tracing -->|Telemetry Context| SDK[Observability SDK]
    SDK -->|External Generation Request| Providers[Provider Layer]
    Providers -->|HTTP API POST| OpenAI[OpenAI API]
    Providers -->|HTTP API POST| Ollama[Local Ollama]
    SDK -->|Store Metadata & Spans| DB[(PostgreSQL Database)]
    Gateway -->|Metrics Aggregations| Analytics[Analytics Engine]
    Analytics -->|Read Dashboard Stats| DB
    DB -->|Visual Reports| Dashboard
```

---

## Data Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User
    User->>Dashboard: Interacts with Dashboard UI
    Dashboard->>Gateway: POST /api/v1/auth/login (Credentials)
    Gateway-->>Dashboard: Returns JWT Token
    Dashboard->>Gateway: POST /api/v1/traces (Payload with Telemetry Spans)
    Note over Gateway,SDK: Telemetry Collector intercepting lifecycle
    Gateway->>SDK: Active context managers track timing
    SDK->>Providers: Generate content (OpenAI / Ollama)
    Providers-->>SDK: Return Token counts & Response
    SDK->>DB: Persist Trace & Spans (SQLAlchemy AsyncSession)
    Dashboard->>Gateway: GET /api/v1/analytics/kpis (JWT Bearer)
    Gateway->>DB: Query performance aggregates
    DB-->>Gateway: Return records
    Gateway-->>Dashboard: Return KPIs JSON payload
```

---

## Tech Stack

### Frontend
<p align="left">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-B7178C?style=for-the-badge&logo=vite&logoColor=FFD62C" alt="Vite" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white" alt="Axios" />
  <img src="https://img.shields.io/badge/Recharts-22B573?style=for-the-badge&logo=chart&logoColor=white" alt="Recharts" />
</p>

### Backend
<p align="left">
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/SQLAlchemy-D71F28?style=for-the-badge&logo=python&logoColor=white" alt="SQLAlchemy" />
  <img src="https://img.shields.io/badge/Alembic-000000?style=for-the-badge&logo=alembic&logoColor=white" alt="Alembic" />
  <img src="https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens" alt="JWT" />
  <img src="https://img.shields.io/badge/Pydantic-E92063?style=for-the-badge&logo=pydantic&logoColor=white" alt="Pydantic" />
</p>

### LLM Integrations
<p align="left">
  <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI" />
  <img src="https://img.shields.io/badge/Ollama-black?style=for-the-badge&logo=ollama&logoColor=white" alt="Ollama" />
</p>

### Database
<p align="left">
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
</p>

### Deployment & Version Control
<p align="left">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" alt="Render" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
  <img src="https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white" alt="Git" />
  <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
</p>

---

## Project Structure

```text
llm-observability-pipeline/
├── backend/            # Python FastAPI backend application gateway
├── frontend/           # React dashboard UI compiled with Vite
├── docs/               # Technical deployment and API documentation
└── tests/              # Automated unit and integration test suite
```

---

## API Overview

| Method | Endpoint | Purpose | Authorization |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | User profile initialization | Public |
| `POST` | `/api/v1/auth/login` | Credentials authentication and token yield | Public |
| `GET` | `/api/v1/auth/me` | Active profile details resolution | Yes (JWT) |
| `POST` | `/api/v1/traces` | Telemetry log execution block ingestion | Public |
| `GET` | `/api/v1/traces` | Query historical execution data | Yes (JWT) |
| `GET` | `/api/v1/analytics/kpis` | Aggregated cost and latency stats | Yes (JWT) |
| `GET` | `/api/v1/alerts` | Query active performance anomalies | Yes (JWT) |

---

## Getting Started

### 1. Clone & Environment
```bash
git clone https://github.com/Sakshisrivastava01/llm-observability-pipeline.git
cd llm-observability-pipeline
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
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

### 4. Docker Compose
```bash
docker-compose up --build
```

---

## Future Roadmap

- [ ] Support additional LLM providers (Anthropic Claude, Cohere)
- [ ] Real-time WebSocket connection for live telemetry feeds
- [ ] Distributed tracing supporting multiple microservice environments
- [ ] Role-based access control (RBAC) improvement schemes
- [ ] Automated dashboard analytics PDF/CSV report exports
- [ ] Automated performance degradation alert dispatch channels

---

### License
Distributed under the MIT License. See [LICENSE](file:///c:/Users/saksh/OneDrive/Desktop/LLMProject/LICENSE) for more details.

### Author
Designed and developed by [Sakshi Srivastava](https://www.linkedin.com/in/sakshi-srivastava-/).

### Contributing
Contributions are welcome. Please check git issues or open a pull request.
