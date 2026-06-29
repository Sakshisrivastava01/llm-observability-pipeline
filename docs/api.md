# API Reference

REST endpoints are exposed under `/api/v1`.

## Authentication

### `POST /auth/login`
Authenticates credentials.
- **Request:**
  ```json
  {
    "email": "admin@company.com",
    "password": "password"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "user": {
      "name": "Admin",
      "email": "admin@company.com"
    },
    "access_token": "mock-token-string"
  }
  ```

### `POST /auth/logout`
Terminates active session.
- **Response (200 OK):**
  ```json
  {
    "status": "success"
  }
  ```

### `GET /auth/me`
Queries active session profile.
- **Response (200 OK):**
  ```json
  {
    "name": "Admin User",
    "email": "you@company.com"
  }
  ```

---

## Telemetry Traces

### `POST /traces`
Ingests a trace payload with nested spans.
- **Request:**
  ```json
  {
    "trace_id": "tr-uuid",
    "name": "inference_pipeline",
    "start_time": "2026-06-29T10:00:00Z",
    "end_time": "2026-06-29T10:00:02Z",
    "input_data": {"prompt": "test prompt"},
    "output_data": {"response": "test response"},
    "spans": [
      {
        "span_id": "sp-uuid",
        "name": "completion_step",
        "span_type": "llm",
        "start_time": "2026-06-29T10:00:00Z",
        "end_time": "2026-06-29T10:00:02Z",
        "model_name": "gpt-4o",
        "prompt_tokens": 10,
        "completion_tokens": 8,
        "total_tokens": 18,
        "cost": 0.0001
      }
    ]
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "status": "success",
    "trace_id": "tr-uuid"
  }
  ```

### `GET /traces`
Queries filtered trace records.
- **Query Parameters:**
  - `page` (int, default: 1)
  - `page_size` (int, default: 25)
  - `start_date` (string, `YYYY-MM-DD`)
  - `end_date` (string, `YYYY-MM-DD`)
  - `search` (string, filters by Run ID)
  - `model` (array of strings, e.g. `gpt-4o`)
  - `min_latency_ms` (float)
  - `max_latency_ms` (float)
  - `min_hall_score` (float)
  - `max_hall_score` (float)
- **Response (200 OK):**
  ```json
  {
    "items": [
      {
        "run_id": "tr-uuid",
        "model": "gpt-4o",
        "latency_ms": 2000.0,
        "total_tokens": 18,
        "cost_usd": 0.0001,
        "hall_score": 1.25,
        "finish_reason": "stop",
        "created_at": "2026-06-29T10:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 25,
    "pages": 1
  }
  ```

### `GET /traces/{trace_id}`
Retrieves a detailed trace context with nested spans and evaluations.
- **Response (200 OK):**
  ```json
  {
    "trace_id": "tr-uuid",
    "name": "inference_pipeline",
    "start_time": "2026-06-29T10:00:00Z",
    "end_time": "2026-06-29T10:00:02Z",
    "input_data": {"prompt": "test prompt"},
    "output_data": {"response": "test response"},
    "custom_metadata": {},
    "spans": [...],
    "evaluations": [...]
  }
  ```

### `GET /traces/export`
Exports traces as a CSV file download.
- **Response (200 OK):** File stream download `traces.csv`.

---

## Alerts

### `GET /alerts`
Queries active alerts grouped with severity count indicators.
- **Response (200 OK):**
  ```json
  {
    "items": [
      {
        "id": "alert-uuid",
        "severity": "CRITICAL",
        "model": "gpt-4o",
        "metric": "latency",
        "baseline_value": 1500.0,
        "current_value": 3200.0,
        "pct_change": 113.3,
        "p_value": 0.0123,
        "created_at": "2026-06-29T10:00:00Z",
        "resolved": false
      }
    ],
    "total": 1,
    "severity_counts": {
      "CRITICAL": 1,
      "HIGH": 0,
      "MEDIUM": 0,
      "LOW": 0
    }
  }
  ```

### `PATCH /alerts/{alert_id}/resolve`
Sets an active alert status to `"resolved"`.
- **Response (200 OK):**
  ```json
  {
    "status": "success",
    "alert_id": "alert-uuid"
  }
  ```

---

## Analytics

### `GET /analytics/kpis`
Retrieves system-wide KPI metrics (calls, latency, cost, evaluations).
- **Response (200 OK):**
  ```json
  {
    "total_calls": 8.0,
    "total_calls_change_pct": 8.4,
    "avg_latency_ms": 1541.74,
    "avg_latency_change_pct": -4.2,
    "total_cost_usd": 0.02811,
    "total_cost_change_pct": 14.7,
    "avg_hall_score": 0.8175,
    "avg_hall_score_change": -0.8
  }
  ```

### `GET /analytics/trends`
Queries call and cost aggregates over the selected days range.
- **Response (200 OK):**
  ```json
  [
    {
      "date": "2026-06-29",
      "calls": 2,
      "avg_latency_ms": 0.123,
      "cost_usd": 0.000062,
      "avg_hall_score": 0.0,
      "prompt_tokens": 20,
      "completion_tokens": 16
    }
  ]
  ```

### `GET /analytics/model-comparison`
Queries performance summaries grouped by model.
- **Response (200 OK):**
  ```json
  [
    {
      "model": "gpt-4o",
      "calls": 3,
      "avg_latency_ms": 3866.66,
      "p50_latency_ms": 3000.0,
      "p95_latency_ms": 6200.0,
      "p99_latency_ms": 6200.0,
      "cost_usd": 0.02775,
      "error_rate": 0.0,
      "avg_hall_score": 0.685,
      "cost_per_1k": 0.01047,
      "avg_tokens": 883.33
    }
  ]
  ```

---

## Evaluations

### `GET /evaluations`
Retrieves SQuAD evaluation runs history.
- **Response (200 OK):**
  ```json
  [
    {
      "dataset": "SQuAD v2.0 (Val)",
      "judge_model": "mistral:latest",
      "f1_score": 0.785,
      "precision": 0.812,
      "recall": 0.760,
      "threshold": 0.50,
      "run_date": "2026-06-29T10:00:00Z"
    }
  ]
  ```

### `GET /evaluations/worst-responses`
Queries top worst-scoring trace responses.
- **Response (200 OK):**
  ```json
  [
    {
      "run_id": "tr-uuid",
      "model": "gpt-4o",
      "score": 0.95,
      "reasoning": "Claim verification passed.",
      "judge_model": "mistral",
      "created_at": "2026-06-28T20:50:11.533Z"
    }
  ]
  ```
