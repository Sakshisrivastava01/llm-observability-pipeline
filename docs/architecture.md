# System Architecture Guide

This document describes the design layers, pipeline flowcharts, database schemas, and modular components of the Enterprise LLM Observability Platform.

---

## Technical Component Flow

```mermaid
graph TD
    Client[LLM Application / Client] -->|Instrumented Queries| SDK[Telemetry SDK context]
    SDK -->|Trace & Span Signals| API[FastAPI Telemetry Ingest]
    API -->|Repositories| Repo[Trace & Span Repositories]
    Repo -->|SQLAlchemy Async Session| DB[(PostgreSQL / SQLite DB)]
    
    Dashboard[Streamlit Observability Dashboard] -->|HTTP Connection client| API
```

---

## Decoupled Architectural Layers

1. **Client / Telemetry SDK**:
   Lightweight, thread-safe Python tracking context managers (`TraceContext` and `SpanContext`) utilizing standard library `contextvars` to isolate trace sessions and prevent crossover risk. Captures exact Monotonic duration offsets and maps execution trees.
   
2. **Ingestion Engine (FastAPI)**:
   High-concurrency async REST controller receiving trace packages, parsing models, validating parameters via Pydantic schemas, and managing database sessions.
   
3. **Persistency Layer (SQLAlchemy 2.0)**:
   Async database connection pooling engine supporting PostgreSQL in production and SQLite in test environments. Repositories manage safe database operations and rollback transactions upon exceptions.
   
4. **Scorers & Evaluators (LLM-in-the-loop)**:
   Decoupled scorer factory registry running hallucination audits, groundedness validation, faithfulness indices, and semantic similarity checks on model generations.
   
5. **Analytics engine**:
   Processes ingested telemetry into timeseries throughput metrics, latency averages, total token costs, and alerts trigger crossings.
   
6. **Observability Dashboard (Streamlit / Plotly)**:
   A dark glassmorphism interface loading live metrics, Gantt timeline sequence charts, evaluation tables, and query testing play pens.

---

## Detailed Data Ingestion Sequence

```mermaid
sequenceDiagram
    autonumber
    actor User as Client Application
    participant SDK as Telemetry SDK
    participant API as Ingestion API
    participant DB as Database Store

    User->>SDK: Open TraceContext("chat_pipeline")
    SDK->>SDK: Initialize thread-safe ContextVars
    User->>SDK: Open SpanContext("openai_chat")
    User->>SDK: Call LLM Provider
    SDK->>SDK: Capture token metadata & calculate pricing
    User->>SDK: Close SpanContext
    SDK->>SDK: Stop duration timer
    User->>SDK: Close TraceContext
    SDK->>API: POST /api/v1/traces (batch trace+spans payload)
    API->>DB: Async transaction persist (Commit)
    DB-->>API: Persisted status
    API-->>SDK: 201 Created Status Response
```

---

## Database Schema (Entity Relationships)

```mermaid
erDiagram
    TRACE ||--o{ SPAN : contains
    TRACE ||--o{ EVALUATION : evaluates
    SPAN ||--o{ EVALUATION : evaluates
    
    TRACE {
        uuid id PK
        string trace_id UK
        string name
        datetime start_time
        datetime end_time
        jsonb input_data
        jsonb output_data
        jsonb custom_metadata
    }

    SPAN {
        uuid id PK
        string span_id UK
        string trace_id FK
        string parent_span_id
        string name
        string span_type
        datetime start_time
        datetime end_time
        jsonb input_data
        jsonb output_data
        string model_name
        integer prompt_tokens
        integer completion_tokens
        integer total_tokens
        numeric cost
        text error
        jsonb custom_metadata
    }

    EVALUATION {
        uuid id PK
        string trace_id FK
        string span_id FK
        string metric_name
        float metric_value
        string status
        text feedback
        jsonb custom_metadata
        datetime timestamp
    }

    MODEL_PRICING {
        integer id PK
        string provider
        string model_name UK
        numeric input_token_price_per_1k
        numeric output_token_price_per_1k
        boolean active
    }

    ALERT {
        uuid id PK
        string metric_name
        float threshold_value
        float actual_value
        string severity
        string status
        text description
        datetime timestamp
    }
```
