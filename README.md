# 🗂️ Inventory & Order Management System (IOMS)

A full-stack web application for managing **products**, **customers**, **orders**, and **inventory tracking** — built with FastAPI, React, and PostgreSQL, containerized with Docker.

---

## 🚀 Live Demo

| Service   | URL |
|-----------|-----|
| Frontend  | [https://ioms.vercel.app](https://ioms.vercel.app) *(update after deploy)* |
| Backend   | [https://ioms-api.onrender.com](https://ioms-api.onrender.com) *(update after deploy)* |
| API Docs  | [https://ioms-api.onrender.com/api/docs](https://ioms-api.onrender.com/api/docs) |

---

## 🐳 Docker Image

```bash
docker pull yourusername/ioms-backend
docker pull yourusername/ioms-frontend
```

---

## ✨ Features

### Business Rules
- ✅ **Unique product SKUs** — enforced at DB + API level, returns 409 on conflict
- ✅ **Unique customer emails** — enforced at DB + API level
- ✅ **Inventory validation** — orders blocked if stock is insufficient
- ✅ **Automatic stock reduction** — atomic DB transaction on order creation
- ✅ **Stock restoration** — when orders are cancelled, stock is restored
- ✅ **Order total calculation** — computed from item quantities × unit prices

### Frontend
- 📊 **Dashboard** with live stats, low stock alerts, recent orders, order status chart
- 📦 **Products** — CRUD with search, category filter, stock indicators
- 👥 **Customers** — CRUD with search, avatar initials
- 🛒 **Orders** — Multi-item order creation with live total preview, status management
- 🌙 **Dark theme** — Professional dark UI with Tailwind CSS

### Backend
- ⚡ **FastAPI** with auto-generated Swagger docs at `/api/docs`
- 🗄️ **PostgreSQL** with SQLAlchemy ORM + Alembic migrations
- 🔒 **Environment-based config** — no hardcoded credentials
- 🧪 **pytest tests** — covering all business rules

---

## 🛠️ Tech Stack

| Layer       | Technology           |
|-------------|----------------------|
| Backend     | Python 3.11, FastAPI |
| ORM         | SQLAlchemy 2.0       |
| Migrations  | Alembic              |
| Database    | PostgreSQL 15        |
| Frontend    | React 18 + Vite      |
| Styling     | Tailwind CSS         |
| State       | React Query + Zustand|
| Charts      | Recharts             |
| Container   | Docker + Compose     |
| Deploy BE   | Render.com           |
| Deploy FE   | Vercel               |
| Deploy DB   | Supabase             |

---

## 📁 Project Structure

```
inventory-order-management/
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── main.py           # App entry point + CORS
│   │   ├── config.py         # Pydantic settings
│   │   ├── database.py       # SQLAlchemy engine
│   │   ├── models/           # DB models
│   │   ├── schemas/          # Pydantic schemas
│   │   ├── routers/          # API route handlers
│   │   └── services/         # Business logic
│   ├── alembic/              # DB migrations
│   ├── tests/                # pytest tests
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                 # React application
│   ├── src/
│   │   ├── api/              # Axios API clients
│   │   ├── components/       # All UI components
│   │   │   ├── layout/       # Sidebar + Layout
│   │   │   ├── common/       # Modal, Badge, StatsCard
│   │   │   ├── dashboard/    # Dashboard with charts
│   │   │   ├── products/     # Products CRUD
│   │   │   ├── customers/    # Customers CRUD
│   │   │   └── orders/       # Orders CRUD
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   └── nginx.conf
│
├── docker-compose.yml
├── docker-compose.prod.yml
└── .env.example
```

---

## 🏃 Running Locally

### Option 1: Docker Compose (recommended)

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/inventory-order-management.git
cd inventory-order-management

# 2. Set up environment
cp .env.example .env
# Edit .env with your values

# 3. Start everything
docker-compose up --build

# App: http://localhost:3000
# API: http://localhost:8000
# Docs: http://localhost:8000/api/docs
```

### Option 2: Manual (Development)

**Backend:**
```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # Set DATABASE_URL
alembic upgrade head             # Run migrations
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
# Create .env.local: VITE_API_URL=http://localhost:8000
npm run dev
```

---

## 🧪 Running Tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

---

## 🌐 Deployment

### Backend → Render.com
1. Push to GitHub
2. New Web Service → connect repo → Root Dir: `backend`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (DATABASE_URL from Supabase, etc.)

### Database → Supabase
1. Create free project at supabase.com
2. Copy the connection string (Transaction pooler)
3. Use as `DATABASE_URL` in Render

### Frontend → Vercel
1. Import GitHub repo → Root Dir: `frontend`
2. Add `VITE_API_URL=https://your-render-service.onrender.com`
3. Deploy

### Docker Hub
```bash
docker build -t yourusername/ioms-backend ./backend
docker build -t yourusername/ioms-frontend ./frontend
docker push yourusername/ioms-backend
docker push yourusername/ioms-frontend
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET/POST | `/api/products/` | List / Create products |
| GET/PUT/DELETE | `/api/products/{id}` | Get / Update / Delete product |
| GET | `/api/products/low-stock` | Products with stock ≤ threshold |
| GET | `/api/products/categories` | All distinct categories |
| GET/POST | `/api/customers/` | List / Create customers |
| GET/PUT/DELETE | `/api/customers/{id}` | Get / Update / Delete customer |
| GET/POST | `/api/orders/` | List / Create orders |
| GET/PUT/DELETE | `/api/orders/{id}` | Get / Update / Delete order |
| GET | `/api/orders/stats/dashboard` | Aggregated dashboard stats |

Full interactive docs: `/api/docs`

---

## 🔑 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `SECRET_KEY` | App secret key | `changeme` |
| `ENVIRONMENT` | `development` / `production` | `development` |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | `*` |
| `VITE_API_URL` | Backend base URL (frontend) | `` (empty = same origin) |
