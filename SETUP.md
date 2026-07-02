# Setup Guide — Restaurant Management System

Step-by-step guide to install and run the project locally using Docker.

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js 20+](https://nodejs.org/) and npm
- A [Supabase](https://supabase.com) account and project
- Git

---

## Step 1 — Clone the Repository

```bash
git clone <repository-url>
cd restaurant-management-system
```

---

## Step 2 — Configure Environment Variables

### 2.1 Backend environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your actual values:

```bash
# Required — from your Supabase project dashboard
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:your_password@db.your-project.supabase.co:5432/postgres

# Required — generate a secure random string (min 32 chars)
JWT_SECRET=your_secret_key_here

# Optional — enables online payments (Cash still works without these)
# From dashboard.midtrans.com > Settings > Access Keys (sandbox)
MIDTRANS_MERCHANT_ID=your_merchant_id
MIDTRANS_CLIENT_KEY=your_client_key
MIDTRANS_SERVER_KEY=your_server_key
```

Generate a secure JWT secret:
```bash
openssl rand -base64 32
```

### 2.2 Frontend environment

```bash
cp apps/frontend/.env.example apps/frontend/.env
```

Edit `apps/frontend/.env`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Match the backend port from docker-compose.yml
VITE_BACKEND_URL=http://localhost:4000
VITE_API_URL=http://localhost:4000/api
```

### 2.3 Docker Compose

```bash
cp docker-compose.example.yml docker-compose.yml
```

Edit `docker-compose.yml` and adjust port mappings if needed (e.g. to avoid conflicts with existing services).

### 2.4 Database Migrations

There is no automatic migration runner yet. Open the Supabase Dashboard → SQL Editor and run every file in `apps/backend/supabase/migrations/` **in filename order** (`00000_...` through the latest).

---

## Step 3 — Install Dependencies

### Backend

```bash
cd apps/backend
npm install
cd ../..
```

### Frontend

```bash
cd apps/frontend
npm install
cd ../..
```

---

## Step 4 — Build & Start Docker Services

```bash
docker-compose build
docker-compose up -d
```

Verify all containers are running:

```bash
docker-compose ps
```

Expected output:
```
NAME        STATUS
backend     Up
frontend    Up
postgres    Up
redis       Up
nginx       Up
```

---

## Step 5 — Verify Services

### Backend health check

```bash
curl http://localhost:4000/api/health
```

Expected response:
```json
{
  "status": "Backend API is running",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

### Frontend

Open your browser and navigate to:
```
http://localhost:3000
```

Or via Nginx proxy:
```
http://localhost:80
```

---

## Development (without Docker)

### Run backend locally

```bash
cd apps/backend
npm run dev
```

Backend runs on `http://localhost:4000`

### Run frontend locally

```bash
cd apps/frontend
npm run dev
```

Frontend runs on `http://localhost:5173` (Vite default)

---

## Docker Commands Reference

```bash
# Start services
docker-compose up -d

# Stop services (keep data)
docker-compose down

# Stop and delete all data (volumes)
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# View all logs
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a service
docker-compose restart backend

# Open a shell inside a container
docker exec -it backend sh
docker exec -it frontend sh
```

---

## Troubleshooting

### Containers not starting

```bash
# Check container logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Port conflicts

Edit `docker-compose.yml` and change the host port (left side of `:`):

```yaml
ports:
  - "4001:4000"   # change 4001 to any free port
```

### Backend can't connect to Redis or Postgres

Make sure the service is healthy:

```bash
docker-compose ps
docker-compose logs redis
docker-compose logs postgres
```

If containers are not healthy, remove volumes and restart:

```bash
docker-compose down -v
docker-compose up -d
```

### .env not being read

- Make sure the file is named exactly `.env` (not `.env.txt`)
- Check for extra spaces or quotes around values
- Restart containers after editing: `docker-compose restart backend`

---

## Security Checklist

Before deploying to production:

- [ ] `JWT_SECRET` is a random string of at least 32 characters
- [ ] Supabase service role key is not exposed to the frontend
- [ ] `.env` files are NOT committed to git (check `.gitignore`)
- [ ] `docker-compose.yml` is NOT committed to git (contains real ports)
- [ ] `CORS_ORIGIN` is set to your production frontend URL
- [ ] `NODE_ENV=production` is set in production
- [ ] Supabase Row Level Security (RLS) is enabled on your tables
