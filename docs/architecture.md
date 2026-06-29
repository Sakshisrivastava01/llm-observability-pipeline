# Architecture Design

This document describes the system design, data flow, telemetry ingestion system, and database schema for the observability platform.

## System Topology

The application is structured into three layers: a React single-page frontend, a FastAPI ASGI backend, and a PostgreSQL database.

```text
Client SDKs / SDK Ingestion Calls
              │
              ▼
       React Dashboard <───[REST / CORS]───> FastAPI API
                                                  │
                                                  ▼
                                            Telemetry Engine
                                                  │
                                                  ▼
                                            Evaluation Engine
                                                  │
                                                  ▼
                                            Analytics Engine
                                                  │
                                                  ▼
                                             PostgreSQL
                                                  │
                                     ┌────────────┴────────────┐
                                     ▼                         ▼
                                 OpenAI API               Ollama Local
```

---

## Component Roles

### 1. React Frontend
- Handles state using Zustand stores.
- Communicates with the FastAPI server using Axios clients configured with a base API route.
- Displays metrics, trends, and comparison tables.

### 2. FastAPI Backend
- Serves HTTP requests asynchronously.
- Validates request payloads and maps response data structures using Pydantic schemas.
- Proxies model prompts to endpoints and records execution parameters.

### 3. Database Layer
- Persists metrics in a PostgreSQL database instance.
- Tracks database transactions using SQLAlchemy Async connections.
- Updates database schemas using Alembic migration files.

---

## Telemetry Engine

The telemetry engine organizes execution operations using traces and spans:
- **Trace:** A collection of nested actions belonging to a single pipeline context.
- **Span:** A specific execution step within a trace, storing token usage, latency, and costs.

### Relational Schema

```text
  ┌─────────────────┐             ┌─────────────────┐
  │      trace      │             │      span       │
  ├─────────────────┤             ├─────────────────┤
  │ id (PK)         │             │ id (PK)         │
  │ trace_id (UK)   │────────────►│ trace_id (FK)   │
  │ name            │             │ parent_span_id  │
  │ start_time      │             │ name            │
  │ end_time        │             │ span_type       │
  │ input_data      │             │ start_time      │
  │ output_data     │             │ end_time        │
  │ custom_metadata │             │ prompt_tokens   │
  └─────────────────┘             │ complet_tokens  │
                                  │ total_tokens    │
                                  │ cost            │
                                  │ error           │
                                  └─────────────────┘
```

---

## Evaluation Engine

Evaluations assess response quality upon span completion:
- **Similarity Scorer:** Calculates cosine-similarity of response text against references.
- **Hallucination Scorer:** Leverages a validation model to evaluate claims against context.
- **Validation Gates:** Compares outputs against standard test runs (e.g. SQuAD benchmarks) to monitor performance.
