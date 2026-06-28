# Deployment Guide

This guide details step-by-step cloud instructions for deploying the **Enterprise LLM Observability Platform** components:
1. **Database**: Supabase (PostgreSQL)
2. **Backend API**: Render (FastAPI Docker Environment)
3. **Observability Console**: Streamlit Community Cloud

---

## 1. Database Setup (Supabase PostgreSQL)

Supabase provides a hosted, high-performance PostgreSQL instance.

1. Sign in to [Supabase](https://supabase.com).
2. Create a new project, setting your project name and database password.
3. Once the project is initialized, navigate to **Project Settings** -> **Database**.
4. Retrieve your **Connection String**. Select the **URI** format under Connection Pooling or Direct Connection.
5. Example connection string:
   `postgresql://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres`
6. Replace the schema prefix from `postgresql://` to `postgresql+asyncpg://` for SQLAlchemy async driver compatibility:
   `postgresql+asyncpg://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres`
7. Save this URI to configure the backend API's `DATABASE_URL` environment variable.

---

## 2. Ingest API Deployment (Render)

Render supports deploying containerized web services directly from Dockerfiles.

1. Sign in to [Render](https://render.com) and link your GitHub repository.
2. Click **New** -> **Web Service**.
3. Select your linked repository and select the **Docker** runtime environment.
4. Set the following details:
   - **Name**: `observability-ingest-api`
   - **Region**: Select region closest to your application clients.
   - **Branch**: `main` (or active release branch)
5. Expand **Advanced Settings** and add the following **Environment Variables**:
   - `ENVIRONMENT`: `production`
   - `DATABASE_URL`: `postgresql+asyncpg://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:5432/postgres` (from Supabase step)
   - `OPENAI_API_KEY`: Your OpenAI API key (for evaluations and playground)
   - `OPENAI_API_BASE`: `https://api.openai.com/v1`
   - `OLLAMA_API_BASE`: Optional, link to accessible public Ollama proxy (or default to empty if not used in cloud)
6. Add a **Release Command** to execute migrations automatically before launching the API container:
   - Command: `alembic upgrade head`
7. Click **Create Web Service**. Render will build and deploy the Docker container.
8. Locate your service URL (e.g. `https://observability-ingest-api.onrender.com`).
9. Verify health check status via ping: `https://observability-ingest-api.onrender.com/health`.

---

## 3. Observability Console (Streamlit Community Cloud)

Streamlit Community Cloud is optimized for hosting interactive Streamlit apps directly from GitHub.

1. Sign in to [Streamlit Share](https://share.streamlit.io).
2. Click **New App**.
3. Select your repository, branch, and set the entrypoint path:
   - **Main file path**: `dashboard/app.py`
4. Expand the **Advanced settings** modal and configure your **Secrets** environment variables:
   ```toml
   BACKEND_API_URL = "https://observability-ingest-api.onrender.com/api/v1"
   ```
5. Click **Deploy!**. Streamlit Cloud will parse dependencies from `dashboard/requirements.txt`, install packages, and deploy the app dashboard interface.

---

## 🐳 Docker Production Deployments

For self-hosted container environments (e.g., AWS EC2, GCP Compute Engine, DigitalOcean Droplets):

1. Clone your repository to the virtual machine server:
   ```bash
   git clone https://github.com/Sakshisrivastava01/llm-observability-pipeline.git
   cd llm-observability-pipeline
   ```
2. Create your production `.env` configuration:
   ```bash
   cp .env.example .env
   # Edit settings parameters inside .env
   ```
3. Spin up the container services in background detached mode:
   ```bash
   docker-compose up -d --build
   ```
4. Configure nginx reverse proxies or security load balancer rules to forward public ports:
   - API Ingest Node: Port `8000`
   - UI Console panel: Port `8501`

---

## 🔍 Health Audits & Checks
* **API Health check**: Target `/health` (returns `{"status": "healthy"}`)
* **Diagnostics details**: Target `/health/diagnostics` (returns connectivity status for PostgreSQL database, OpenAI API, and Ollama instance endpoints)
