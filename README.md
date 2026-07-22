<p align="center">
  <h1 align="center">Cost-Performance Observability & Monitoring Pipeline</h1>
  <p align="center">A high-performance metrics collection, latency analysis, and operational health platform for distributed services.</p>
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
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite 5" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python 3.11" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL 16" />
  <img src="https://img.shields.io/badge/Tailwind--CSS-3.0-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 3.0" />
  <img src="https://img.shields.io/badge/Docker-Supported-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
</p>

---

## Project Overview

This platform solves the critical challenge of tracking cost-to-performance efficiency for active HTTP and token-based application endpoints. In production systems, tracking granular request timing and resource costs across thousands of transactions is highly bottlenecked by database locks and ingestion overhead. This pipeline introduces an async metrics collection SDK, a high-throughput FastAPI REST API using direct PostgreSQL binary copy protocols (sub-5ms write overhead), and an interactive React dashboard. The scalable dashboard enables developers to identify latency bottlenecks, review execution costs, isolate errors, and query performance metrics within a securely authenticated (JWT and RLS protected) console.

---

## Features

| Feature | Details |
| :--- | :--- |
| **Secure Authentication** | OAuth2-compatible password hashing via `bcrypt` and JWT session tokens. |
| **Real-time Dashboard** | Visual metrics reporting with `Recharts` and lightweight `Zustand` store management. |
| **Request Monitoring** | Automatic trace tracking across execution stacks with step-by-step latency mapping. |
| **Observability SDK** | Intercepts function execution blocks to automatically capture metadata, parameters, and timings. |
| **Operational Analytics** | Calculation of latency percentiles (P50, P90, P95, P99) and cost aggregation models. |
| **FastAPI REST API** | Clean, modular endpoints validated through strict `Pydantic` schemas. |
| **Database Security** | PostgreSQL 16 on Supabase with enabled Row-Level Security (RLS) policies. |
| **High-Throughput Ingestion** | Optimized db execution using high-performance asyncpg copy protocol. |

---

## System Architecture

```mermaid
flowchart LR
    Browser[Browser Client] -->|HTTP Requests| Gateway[FastAPI Ingestion]
    Gateway -->|Auth Check| JWT[JWT Validator]
    JWT -->|Validate Profile| Security[Security Service]
    Gateway -->|Transactional Metrics| Analytics[Analytics Service]
    Analytics -->|Async Bulk Write| DB[(Supabase PostgreSQL)]
```

---

## Data Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User
    User->>Browser: Interacts with Dashboard
    Browser->>Frontend: Triggers Metrics Fetch
    Frontend->>REST API: GET /api/v1/analytics/kpis (JWT Bearer)
    REST API->>Services: Executes Analytics Query
    Services->>Database: Selects Aggregated Metrics
    Database-->>Services: Returns Records
    Services-->>REST API: Formats JSON Response
    REST API-->>Frontend: Resolves API Payload
    Frontend-->>Browser: Renders Interactive Recharts
```

---

## Tech Stack

### Frontend
<p align="left">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Vite-B7178C?style=for-the-badge&logo=vite&logoColor=FFD62C" alt="Vite" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
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

### Database & Deployment
<p align="left">
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white" alt="Render" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
</p>

### Version Control
<p align="left">
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

- [ ] Multi-tenant isolation models
- [ ] WebSocket connection for live telemetry feeds
- [ ] Automated Slack/Email notifications on performance degradation
- [ ] Advanced custom metric reporting templates
- [ ] Kubernetes manifest configurations for container orchestration
- [ ] Autoscaling database replicas for horizontal scaling
- [ ] Dashboard PDF/CSV report exports
- [ ] Enhanced user setting panels with dark/light themes

---

### License
Distributed under the MIT License. See [LICENSE](file:///c:/Users/saksh/OneDrive/Desktop/LLMProject/LICENSE) for more details.

### Author
Designed and developed by [Sakshi Srivastava](https://www.linkedin.com/in/sakshi-srivastava-/).

### Contributing
Contributions are welcome. Please check git issues or open a pull request.
