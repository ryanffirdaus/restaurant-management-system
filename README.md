# Restaurant Management System (RMS)

A full-stack restaurant management system built with React, Express.js, and Supabase. Designed to streamline restaurant operations including orders, inventory, staff, and customer management.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Supabase JS |
| Backend | Node.js 20, Express.js, Supabase JS |
| Database | PostgreSQL 16 via Supabase (cloud-hosted) |
| Cache | Redis 7 |
| Proxy | Nginx |
| Containers | Docker, Docker Compose |

---

## Architecture

```
         Browser
            │
     ┌──────▼──────┐
     │    Nginx    │  :80 / :443
     │  (Reverse   │
     │   Proxy)    │
     └──┬──────┬───┘
        │      │
 ┌──────▼──┐ ┌─▼────────┐
 │Frontend │ │ Backend  │
 │ React + │ │ Express  │  :4000
 │  Vite   │ │    +     │
 │  :3000  │ │ Supabase │
 └─────────┘ └────┬─────┘
                  │
       ┌──────────┴──────────┐
       │                     │
 ┌─────▼──────┐      ┌───────▼─────┐
 │ Supabase   │      │    Redis    │
 │ PostgreSQL │      │   (Cache)   │
 │  (Cloud)   │      │    :6379    │
 └────────────┘      └─────────────┘
```

---

## Features (Planned)

- **Order Management** — Track orders from placement to delivery in real-time
- **Inventory Management** — Monitor stock levels, receive low-stock alerts
- **Staff Management** — Manage employee schedules and roles
- **Customer Profiles** — Store order history and customer preferences
- **Analytics & Reports** — Sales reports, inventory summaries, performance insights
- **Authentication** — JWT-based login with role-based access control

---

## Project Structure

```
restaurant-management-system/
├── apps/
│   ├── backend/                   # Express.js API server
│   │   ├── src/
│   │   │   ├── index.js          # Server entry point
│   │   │   └── lib/
│   │   │       └── supabase.ts   # Supabase client
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── .env                  # Local config (gitignored)
│   │   └── .env.example          # Config template
│   │
│   └── frontend/                  # React + Vite app
│       ├── src/
│       │   └── lib/
│       │       └── supabase.ts   # Supabase client
│       ├── vite.config.js
│       ├── Dockerfile
│       ├── package.json
│       ├── .env                  # Local config (gitignored)
│       └── .env.example          # Config template
│
├── docker/
│   └── nginx/
│       └── default.conf          # Nginx reverse proxy config
│
├── docker-compose.yml             # Local config (gitignored)
├── docker-compose.example.yml     # Template for docker-compose
├── .env                           # Backend env (gitignored)
├── .env.example                   # Backend env template
├── README.md
└── SETUP.md
```

---

## Docker Services

| Service | Container | Image | Internal Port |
|---------|-----------|-------|---------------|
| frontend | frontend | node:20-alpine → nginx | 80 |
| backend | backend | node:20-alpine | 4000 |
| postgres | postgres | postgres:16 | 5432 |
| redis | redis | redis:7-alpine | 6379 |
| nginx | nginx | nginx:stable-alpine | 80 / 443 |

Port mappings (host:container) are defined in your local `docker-compose.yml`. See `docker-compose.example.yml` for reference.

---

## Environment Variables

### Backend (`.env`)

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

LOG_LEVEL=debug
```

### Frontend (`apps/frontend/.env`)

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

VITE_BACKEND_URL=http://localhost:4000
VITE_API_URL=http://localhost:4000/api
```

---

## API Endpoints

### `GET /api/health`

```bash
curl http://localhost:4000/api/health
```

```json
{
  "status": "Backend API is running",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

### `GET /`

```bash
curl http://localhost:4000/
```

```json
{
  "message": "Restaurant Management System Backend",
  "version": "1.0.0"
}
```

---

## Useful Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
docker-compose logs -f backend

# Stop all services
docker-compose down

# Rebuild images
docker-compose build --no-cache

# Run backend locally (without Docker)
cd apps/backend && npm run dev

# Run frontend locally (without Docker)
cd apps/frontend && npm run dev
```

---

## Security

- `.env` files are gitignored — never committed
- `docker-compose.yml` is gitignored (contains real ports)
- Use `.env.example` and `docker-compose.example.yml` as templates
- Rotate `JWT_SECRET` in production
- Use Supabase Row Level Security (RLS) for database policies
- Use different Supabase keys for development and production

---

## Setup

See [SETUP.md](SETUP.md) for complete installation and deployment instructions.
