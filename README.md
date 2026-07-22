# Cost-Performance Observability and Monitoring Pipeline

A high-performance monitoring and analytics platform for tracking execution metrics, costs, latency distribution, and operational health in distributed environments.

## Overview

The Observability and Monitoring Pipeline is a production-ready telemetry ingestion and analytics platform designed to monitor distributed workloads in real time. Built with a decoupled, high-throughput backend and a modern web dashboard, the system automates metric collection, handles token-based utilization costing, triggers system alerts, and reports database performance statistics. Featuring secure JWT-based authentication, fine-grained access control (RLS), and sub-5ms write operations via direct PostgreSQL COPY protocols, the platform helps engineering teams track latency percentiles, compute aggregate operational costs, analyze execution failures, and maintain stable deployments.

## Features

- **Secure User Authentication**: Complete registration, login, and secure session management.
- **JWT Authorization**: Token-based security mechanism for REST endpoints.
- **Real-Time Dashboard**: Interactive visualization of request volumes, error rates, and system trends.
- **Analytics**: Query interfaces for tracking latency percentiles (P50, P90, P95, P99) and daily request throughput.
- **Request Monitoring**: Granular tracing of execution sequences, timing, and errors.
- **Observability**: Telemetry SDK to automatically intercept execution blocks and log timing information.
- **Performance Metrics**: Direct tracking of operational costs, latency ranges, and success rates.
- **REST APIs**: Well-structured endpoints with standardized JSON request and response models.
- **User Management**: Secured user profiles and password reset procedures with validation tokens.
- **Responsive UI**: Built with dynamic layout modules to optimize desktop and browser views.
- **Production Ready**: Fully dockerized environment configurations matching standard cloud environments.
- **Error Handling**: Standardized HTTP exception handler middleware to prevent data leakages.
- **Logging**: High-efficiency JSON structural logger mappings.
- **Scalable Architecture**: Independent frontend/backend components interacting through REST interfaces.

## Architecture

```text
Frontend (React + Vite)
        │
        ▼
REST API (FastAPI)
        │
        ▼
Business Services
        │
        ▼
Database Layer
        │
        ▼
PostgreSQL
```

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- React Router
- Zustand
- Tailwind CSS
- Axios
- Recharts

### Backend
- FastAPI
- Python
- SQLAlchemy
- Alembic
- PostgreSQL
- Pydantic
- JWT
- Bcrypt

### Deployment
- Vercel
- Render

### Database
- Supabase PostgreSQL

### Version Control
- Git
- GitHub

## Project Structure

```text
llm-observability-pipeline/
├── backend/                    # Backend API root
│   ├── app/                    # Core application files
│   │   ├── api/                # API router entry points
│   │   │   └── v1/             # Versioned API routes
│   │   ├── core/               # Middleware and security config
│   │   ├── db/                 # DB pool engines
│   │   ├── evaluation/         # Consistency assessment methods
│   │   ├── models/             # Database models
│   │   ├── providers/          # Service connectors
│   │   ├── repositories/       # Persistence abstractions
│   │   ├── routers/            # Authentication routers
│   │   ├── schemas/            # Validation schemas
│   │   ├── sdk/                # Tracing SDK context managers
│   │   ├── services/           # Analytics and alerts services
│   │   └── main.py             # Server entry point
│   ├── alembic/                # Database migration scripts
│   ├── tests/                  # Integration test suite
│   ├── Dockerfile              # Backend container build script
│   └── requirements.txt        # Backend dependencies
├── frontend/                   # Frontend React dashboard root
│   ├── src/                    # Frontend source codebase
│   │   ├── api/                # Network service APIs
│   │   ├── components/         # Shared UI controls
│   │   ├── hooks/              # Custom utility hooks
│   │   ├── pages/              # Visual view layouts
│   │   └── store/              # State management store
│   ├── Dockerfile              # Frontend container build script
│   ├── package.json            # Frontend dependencies
│   └── vite.config.js          # Vite config
├── docker-compose.yml          # Container orchestration script
├── render.yaml                 # Deployment blueprint
└── README.md                   # Technical documentation
```

## Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 16+

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # Linux/macOS
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run migrations and seed the database:
   ```bash
   python -m alembic upgrade head
   python seed.py
   ```
5. Start the development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Docker Deployment
To launch the entire platform in a multi-container environment:
```bash
docker-compose up --build
```

## Environment Variables

Configure the following variables in the `.env` files in both the `backend/` and `frontend/` directories:

### Backend Variables
- `ENVIRONMENT`: The runtime stage configuration (e.g., `production`, `development`).
- `DATABASE_URL`: The PostgreSQL connection string using the asyncpg driver.
- `JWT_SECRET_KEY`: A cryptographically secure random string used to sign JWTs.
- `SENDGRID_API_KEY`: API token for transactional email notifications.
- `SENDGRID_FROM_EMAIL`: The verified sender address for outgoing communications.

### Frontend Variables
- `VITE_API_BASE_URL`: The REST API endpoint prefix mapping to the backend application gateway.
- `VITE_APP_NAME`: Visual title header displayed in the browser.

## API Endpoints

### Authentication
| Method | Path | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | No | Creates a new user profile with hashed credentials |
| `POST` | `/api/v1/auth/login` | No | Validates user credentials and returns a JWT access token |
| `POST` | `/api/v1/auth/forgot-password` | No | Sends an OTP code to user's registered email |
| `POST` | `/api/v1/auth/reset-password` | No | Validates email OTP and sets new password |
| `GET` | `/api/v1/auth/me` | Yes | Retrieves profile details of currently authenticated user |

### Telemetry & Dashboard
| Method | Path | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/traces` | No | Ingests execution metadata and timing spans |
| `GET` | `/api/v1/traces` | Yes | Returns paginated list of ingested execution logs |
| `GET` | `/api/v1/analytics/kpis` | Yes | Retrieves aggregated performance indicators |
| `GET` | `/api/v1/alerts` | Yes | Lists active system alerts and warnings |

### Health Check
| Method | Path | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | No | Validates gateway API and database pool availability |

## Deployment

### Frontend
- **Platform**: Vercel
- **Configurations**: Build Command: `npm run build`, Output Directory: `dist`. Add rewrite rules to vercel.json configuration.

### Backend
- **Platform**: Render
- **Configurations**: Set root directory to `backend`. Build Command: `pip install -r requirements.txt`. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

### Database
- **Platform**: Supabase PostgreSQL
- **Configurations**: Enable Row-Level Security (RLS) policies to isolate user transactions and restrict operational query profiles.

## License
MIT
