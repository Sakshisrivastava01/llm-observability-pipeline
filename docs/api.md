# REST API Reference Documentation

This document describes the API schemas and JSON endpoints exposed by the platform ingest server.

---

## Connection Specifications

- **Default Local Ingestion Host**: `http://localhost:8000`
- **Default Endpoint Path Prefix**: `/api/v1`
- **Content Type**: `application/json`

---

## 1. Health Diagnostics

### `GET /health`
Verifies connection parameters and returns the system health status.

**Response (200 OK)**:
```json
{
  "status": "healthy"
}
```

---

## 2. Inferences Proxy Pipeline

### `POST /api/v1/inference`
Proxy LLM completions route. Runs provider wrapping, captures telemetry logs under dynamic contexts, triggers automated evaluations, and commits traces in a single step.

**Request Payload**:
```json
{
  "provider": "openai",
  "model": "gpt-4o",
  "prompt": "Explain quantum superposition in one sentence.",
  "system_instruction": "Be concise.",
  "temperature": 0.7,
  "reference_context": "Superposition is when a system is in multiple states.",
  "reference_output": "Quantum superposition is when a system exists in multiple states."
}
```

**Response (200 OK)**:
```json
{
  "trace_id": "tr-2ea5c9cc-f214-49ab-163e-0e41eb9c1aa6",
  "response": "Quantum superposition allows a physical system to exist in multiple states simultaneously.",
  "tokens": {
    "prompt": 18,
    "completion": 14,
    "total": 32
  },
  "cost": 0.00031,
  "evaluations": [
    {
      "metric_name": "hallucination",
      "metric_value": 0.95,
      "status": "success"
    },
    {
      "metric_name": "quality",
      "metric_value": 0.88,
      "status": "success"
    }
  ]
}
```

---

## 3. Telemetry Ingest

### `POST /api/v1/traces`
Allows external applications or SDKs to post trace packages with nested spans.

**Request Payload**:
```json
{
  "trace_id": "tr-custom-123",
  "name": "chat_completion_pipeline",
  "start_time": "2026-06-28T12:00:00Z",
  "end_time": "2026-06-28T12:00:02Z",
  "input_data": { "prompt": "Hello" },
  "output_data": { "response": "Hi" },
  "custom_metadata": { "env": "prod" },
  "spans": [
    {
      "span_id": "sp-custom-123",
      "name": "model_inference",
      "span_type": "llm",
      "start_time": "2026-06-28T12:00:00Z",
      "end_time": "2026-06-28T12:00:02Z",
      "model_name": "gpt-3.5-turbo",
      "prompt_tokens": 10,
      "completion_tokens": 5,
      "total_tokens": 15,
      "cost": 0.000025,
      "error": null,
      "custom_metadata": {}
    }
  ]
}
```

**Response (201 Created)**:
```json
{
  "status": "success",
  "trace_id": "tr-custom-123"
}
```

---

## 4. Query Endpoints

### `GET /api/v1/traces`
Retrieves a paginated list of ingested traces.

- **Query Parameters**:
  - `limit`: results limit (default 100).
  - `offset`: page offset (default 0).

**Response (200 OK)**:
```json
[
  {
    "trace_id": "tr-custom-123",
    "name": "chat_completion_pipeline",
    "start_time": "2026-06-28T12:00:00Z",
    "end_time": "2026-06-28T12:00:02Z",
    "input_data": { "prompt": "Hello" },
    "output_data": { "response": "Hi" },
    "custom_metadata": { "env": "prod" },
    "spans_count": 1
  }
]
```

### `GET /api/v1/traces/{trace_id}`
Retrieves detailed traces, nested spans hierarchy list, and related evaluations.

---

## 5. Evaluation Manager

### `POST /api/v1/evaluations/run`
Manually triggers an evaluation scorer.

---

## 6. Alerts Auditor

### `GET /api/v1/alerts`
Retrieves paginated triggered operational alerts.
