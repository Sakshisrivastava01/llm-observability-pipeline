# Setup & Installation Guide

This guide details how to configure settings, initialize migrations, seed synthetic telemetry logs, and launch the platform locally or inside Docker container clusters.

---

## 🛠️ Prerequisites

Ensure you have the following packages installed:
- **Python**: version `3.11`
- **Docker / Docker Compose**: (If running PostgreSQL or the API in container clusters)
- **PostgreSQL**: (Optional, if running database locally instead of Docker/SQLite)

---

## ⚙️ Settings Configurations (`.env`)

Clone the template from root directory to initialize the settings file:
```bash
cp .env.example .env
```

| Parameter | Purpose | Defaults |
|---|---|---|
| `ENVIRONMENT` | Running environment type | `production` |
| `DATABASE_URL` | Async db connection URI | `postgresql+asyncpg://postgres:postgres@localhost:5432/observability` |
| `OPENAI_API_KEY` | OpenAI authentication key | `your-openai-api-key` |
| `OPENAI_API_BASE` | Alternative completions routing URL | `https://api.openai.com/v1` |
| `OLLAMA_API_BASE` | Local Ollama host routing URL | `http://localhost:11434` |

---

## 🐳 Docker Compose Deployment (Recommended)

To spin up a PostgreSQL 16 database container and the FastAPI ingestion service instantly:
```bash
docker-compose up --build
```
The server will boot and be accessible at: `http://localhost:8000/health`.

---

## 💻 Local Manual Setup

### 1. Initialize and Activate Virtual Environment
Initialize a venv and activate:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
```

### 2. Install Packages
Install dependencies from the backend directory:
```bash
pip install -r backend/requirements.txt
```

### 3. Generate Table Schemas & Run Migrations
Run Alembic upgrades to set up schemas:
```bash
cd backend
alembic upgrade head
cd ..
```

### 4. Seed Database
Seed synthetic telemetry traces, spans, evaluations, and price indices:
```bash
python backend/seed.py
```

### 5. Launch FastAPI Ingest Server
```bash
uvicorn backend.app.main:app --reload --port 8000
```

---

## 📈 Running the Observability Dashboard

Ensure your virtual environment is active, then execute Streamlit:
```bash
streamlit run dashboard/app.py
```
The glassmorphism dashboard will launch and open in your default browser at: `http://localhost:8501`.
