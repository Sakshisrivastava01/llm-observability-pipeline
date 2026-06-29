# Deployment Guide

This document outlines the procedure to deploy the database, API backend, and dashboard UI to production.

## 1. Database Setup (Supabase)

1. Provision a PostgreSQL instance in Supabase.
2. Under *Database Settings*, retrieve the Pooler connection string.
3. Configure the string to use Transaction mode (port 5432 or 6543) and ensure it uses the `postgresql+asyncpg://` scheme.
4. Execute the migrations locally:
   ```bash
   cd backend
   export DATABASE_URL="postgresql+asyncpg://..."
   python -m alembic upgrade head
   ```

## 2. Backend Service Deployment (Render)

1. Create a new *Web Service* on Render.
2. Select your repository.
3. Configure the service settings:
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python -m uvicorn app.main:app --host 0.0.0.0 --port 10000`
4. Set the following environment variables:
   - `ENVIRONMENT`: `production`
   - `DATABASE_URL`: `postgresql+asyncpg://...`
   - `OPENAI_API_KEY`: `sk-proj-...`
   - `OPENAI_API_BASE`: `https://api.openai.com/v1`
   - `OLLAMA_API_BASE`: `http://[host]:11434`

## 3. Frontend Deployment (Vercel)

1. Create a new project on Vercel.
2. Import the repository.
3. Configure the build parameters:
   - Root Directory: `frontend`
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Set the environment variables:
   - `VITE_API_BASE_URL`: `https://[backend-host]/api/v1`
   - `VITE_APP_NAME`: `LLM Command Center`
