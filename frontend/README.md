# LLM Observability Dashboard — React + Vite

Production-grade React frontend for the LLM Observability & Cost-Performance Pipeline.

## Stack

- **React 18** + **Vite 5** (HMR, code splitting, lazy loading)
- **Tailwind CSS 3** — custom dark-theme token system
- **Zustand** — global state (auth, filters, UI)
- **Recharts** — all charts (Area, Bar, Histogram, Donut)
- **React Router v6** — lazy-loaded page routing
- **Axios** — centralised API layer with interceptors

## Folder Structure

```
src/
├── api/
│   ├── client.js          # Axios instance + interceptors
│   ├── analyticsService.js
│   ├── tracesService.js
│   └── services.js        # alerts, evaluations, models, auth
├── components/
│   ├── layout/
│   │   ├── Layout.jsx     # Root shell: sidebar + header + main
│   │   ├── Sidebar.jsx    # Collapsible nav
│   │   └── Header.jsx     # Page header + filter bar
│   └── shared/
│       ├── ui.jsx         # Card, KpiCard, Badge, Spinner, Empty, Error
│       ├── charts.jsx     # TrendChart, BarChart, Histogram, Donut, Sparkline
│       ├── DataTable.jsx  # Sortable, paginated table
│       └── FilterBar.jsx  # Model chips + date range
├── hooks/
│   └── useApi.js          # useApi + usePaginatedApi
├── pages/
│   ├── Overview.jsx       # Page 1 — KPIs + trends + alerts
│   ├── Analytics.jsx      # Deep-dive cost + latency + tokens
│   ├── TraceExplorer.jsx  # Page 2 — filterable trace table
│   ├── Evaluation.jsx     # Page 3 — hallucination scoring
│   ├── Alerts.jsx         # Page 4 — regression alerts
│   ├── ModelComparison.jsx
│   ├── Settings.jsx
│   └── Login.jsx
├── store/
│   └── index.js           # useFilterStore, useAuthStore, useUIStore
├── App.jsx                # Router + lazy loading + auth guard
├── main.jsx
└── index.css              # Tailwind + design tokens
```

## Quick Start

```bash
cp .env.example .env
# Set VITE_API_BASE_URL to your FastAPI backend

npm install
npm run dev        # → http://localhost:5173
```

## API Endpoints Expected

| Method | Path | Used by |
|--------|------|---------|
| GET | `/api/v1/analytics/kpis` | Overview KPI cards |
| GET | `/api/v1/analytics/trends` | Trend sparklines |
| GET | `/api/v1/analytics/model-comparison` | Model table + charts |
| GET | `/api/v1/analytics/latency-distribution` | Histogram |
| GET | `/api/v1/analytics/advanced` | Recent alerts |
| GET | `/api/v1/traces` | Trace explorer table |
| POST | `/api/v1/traces` | Instrumentation write |
| GET | `/api/v1/traces/export` | CSV download (blob) |
| GET | `/api/v1/alerts` | Regression alerts |
| PATCH | `/api/v1/alerts/:id/resolve` | Resolve button |
| GET | `/api/v1/evaluations` | Eval run history |
| GET | `/api/v1/evaluations/hallucination-scores` | Score distribution |
| GET | `/api/v1/evaluations/hallucination-trend` | Score trend |
| GET | `/api/v1/evaluations/worst-responses` | Worst 10 table |
| GET | `/api/v1/models` | Model list for filter chips |
| POST | `/api/v1/auth/login` | Login form |
| POST | `/api/v1/auth/logout` | Sign out |
| GET | `/api/v1/auth/me` | Auth bootstrap |

## Deploy on Vercel

```bash
# Set env var in Vercel dashboard:
# VITE_API_BASE_URL = https://your-fastapi-backend.railway.app/api/v1

vercel --prod
```

The `vercel.json` handles SPA routing rewrites automatically.

## Design System

All colors, shadows, and typography live in `tailwind.config.js` as semantic tokens:
- **Surfaces**: `surface-900` → `surface-300` (dark layering)
- **Brand**: `brand-300` → `brand-700`
- **Accents**: `cyan`, `emerald`, `amber`, `rose`, `violet`
- **Utility classes**: `.card`, `.kpi-card`, `.nav-item`, `.badge-*`, `.data-table`, `.form-input`, `.btn-*`
