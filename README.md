# Servio — Restaurant Management System (RMS)

A full-stack restaurant management system built with React, Express.js, and Supabase — covering the whole order lifecycle from waiter to kitchen to cashier, plus admin tools for menu, tables, employees, and analytics.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS |
| Backend | Node.js 20, Express.js, TypeScript |
| Database & Auth | Supabase (PostgreSQL + Row Level Security) |
| Payments | Midtrans (QRIS, GoPay, Virtual Account, Mandiri Bill) |
| Cache | Redis |
| Proxy | Nginx |
| Containers | Docker, Docker Compose |

---

## Features

Role-based apps, routed automatically after login based on the employee's role:

- **Waiter** — mobile-first UI to open a table, build an order, and track item status as the kitchen cooks; marks orders served once all items are ready
- **Kitchen (KDS)** — kanban board (Queue → Cooking → Ready) with drag-and-drop, per-item status (not per-order, since dishes finish at different times), and live polling
- **Cashier** — settle unpaid orders by Cash or online via Midtrans (QRIS, GoPay, Virtual Account, Mandiri Bill Payment), grouped by method with inline payment codes/QR — no redirect to a hosted page
- **Admin/Manager dashboard** — Menu management, Tables, Orders overview, Payments/revenue, Employees, and Analytics

Backend enforces role-based access via Supabase RLS policies and standardizes every API response as `{ success, message, data }`.

---

## Project Structure

```
restaurant-management-system/
├── apps/
│   ├── backend/                   # Express + TypeScript API
│   │   ├── src/
│   │   │   ├── server.ts          # Entry point
│   │   │   ├── app.ts             # Express app, route mounting
│   │   │   ├── config/            # Supabase, Midtrans clients
│   │   │   ├── middleware/        # auth, error handling
│   │   │   └── modules/           # orders, menus, tables, payments,
│   │   │                          #   employees, profiles, auth, shifts
│   │   ├── supabase/migrations/   # SQL migrations (run manually, see below)
│   │   └── .env                   # Local config (gitignored)
│   │
│   └── frontend/                  # React + Vite app
│       ├── src/
│       │   ├── pages/             # waiter/, kitchen/, cashier/, admin pages
│       │   ├── components/        # shared UI (Sidebar, Table, Modal, ...)
│       │   ├── context/           # AuthContext
│       │   └── lib/api.ts         # fetch wrapper + formatIDR
│       └── .env                   # Local config (gitignored)
│
├── docker/                        # nginx, postgres config
├── docker-compose.yml             # Local orchestration (gitignored)
├── docker-compose.example.yml     # Template
├── .env.example                   # Backend env template
└── SETUP.md                       # Full install/run guide
```

---

## Environment Variables

### Backend (`.env`, see `.env.example`)

```bash
NODE_ENV=development
PORT=4000

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:password@host:5432/postgres

JWT_SECRET=your_secret_min_32_chars
JWT_EXPIRATION=24h

REDIS_URL=redis://redis:6379

CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000

# Optional — enables online payments in the cashier app
MIDTRANS_MERCHANT_ID=your_merchant_id
MIDTRANS_CLIENT_KEY=your_client_key
MIDTRANS_SERVER_KEY=your_server_key
```

### Frontend (`apps/frontend/.env`, see `apps/frontend/.env.example`)

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

VITE_BACKEND_URL=http://localhost:4000
VITE_API_URL=http://localhost:4000/api
```

---

## Database Setup

Migrations live in `apps/backend/supabase/migrations/` and must be run manually in the Supabase SQL Editor (Dashboard → SQL Editor), in filename order (`00000_...` through the latest). There is no automatic migration runner yet.

---

## Quick Start

See **[SETUP.md](SETUP.md)** for the full step-by-step guide (Docker and local-without-Docker). Short version:

```bash
git clone <repository-url>
cd restaurant-management-system

cp .env.example .env                              # fill in Supabase + Midtrans keys
cp apps/frontend/.env.example apps/frontend/.env   # fill in Supabase keys
cp docker-compose.example.yml docker-compose.yml

# run migrations in apps/backend/supabase/migrations/ via Supabase SQL Editor

docker-compose up -d
curl http://localhost:4000/api/health
```

Or run each app locally without Docker:

```bash
cd apps/backend && npm install && npm run dev    # http://localhost:4000
cd apps/frontend && npm install && npm run dev   # http://localhost:5173
```

---

## Payments

Online payments go through **Midtrans** (sandbox by default; set `NODE_ENV=production` with production keys to go live). To receive automatic payment confirmation, point the Midtrans dashboard's notification URL at `https://your-domain/api/midtrans/webhook`. Without a reachable webhook (e.g. local dev), the cashier screen has a manual "Confirm Manually" fallback.

---

## Security

- `.env` and `docker-compose.yml` are gitignored — never commit real credentials
- Use `.env.example` and `docker-compose.example.yml` as templates
- Rotate `JWT_SECRET` and Midtrans keys before production
- Supabase Row Level Security (RLS) enforces role-based access at the database level
- Use separate Supabase/Midtrans credentials for development and production
