# Setup & Deployment Guide — Restaurant Management System

Covers running the project locally (with or without Docker) and deploying it to a VPS behind a Cloudflare subdomain.

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js 20+](https://nodejs.org/) and npm
- A [Supabase](https://supabase.com) account and project
- A [Midtrans](https://midtrans.com) account (sandbox keys are free) — optional, only needed for online payments in the cashier app
- Git

---

## Step 1 — Clone the Repository

```bash
git clone <repository-url>
cd restaurant-management-system
```

---

## Step 2 — Configure Environment Variables

This project uses two backend env files: root `.env` (read by Docker Compose) and `apps/backend/.env` (read when running the backend directly with `npm run dev`). Fill in one and copy it to the other so they stay in sync.

### 2.1 Backend environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your actual values:

```bash
NODE_ENV=development
PORT=4000

# Required — from your Supabase project dashboard
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://postgres:your_password@db.your-project.supabase.co:5432/postgres

# Required — generate a secure random string (min 32 chars)
JWT_SECRET=your_secret_key_here
JWT_EXPIRATION=24h

CORS_ORIGIN=http://localhost:3000
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=debug

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

Then copy it for local (non-Docker) backend runs:
```bash
cp .env apps/backend/.env
```

### 2.2 Frontend environment

```bash
cp apps/frontend/.env.example apps/frontend/.env
```

Edit `apps/frontend/.env`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

VITE_BACKEND_URL=http://localhost:4000
VITE_API_URL=http://localhost:4000/api
```

**Important:** Vite bakes these values into the built JS bundle at *build* time, not runtime. If you change this file, you must rebuild (`npm run build` or `docker compose build frontend`) for the change to take effect.

### 2.3 Docker Compose

```bash
cp docker-compose.example.yml docker-compose.yml
```

### 2.4 Database Migrations

There is no automatic migration runner. Open the Supabase Dashboard → **SQL Editor** and run every file in `apps/backend/supabase/migrations/` **in filename order** (`00000_...` through the latest).

---

## Step 3 — Run It

### Option A — Docker (recommended, matches production)

```bash
docker compose build
docker compose up -d
docker compose ps
```

Expected output:
```
NAME        STATUS
backend     Up
frontend    Up
nginx       Up
```

Verify:
```bash
curl http://localhost/api/health
```

Then open `http://localhost` in your browser.

### Option B — Without Docker

```bash
# Terminal 1
cd apps/backend && npm install && npm run dev    # http://localhost:4000

# Terminal 2
cd apps/frontend && npm install && npm run dev   # http://localhost:5173
```

---

## Docker Commands Reference

```bash
docker compose up -d              # start
docker compose down               # stop
docker compose build --no-cache   # rebuild images
docker compose logs -f            # all logs
docker compose logs -f backend    # one service
docker compose restart backend    # restart one service
docker exec -it backend sh        # shell into a container
```

---

## Troubleshooting

**Containers not starting**
```bash
docker compose logs backend
docker compose down
docker compose build --no-cache
docker compose up -d
```

**Port conflict** — edit `docker-compose.yml`, change the host side of the port mapping (e.g. `nginx` service `"80:80"` → `"8080:80"`).

**`.env` not being read** — confirm the file is named exactly `.env` (not `.env.txt`), no stray quotes around values, and restart the container after editing (`docker compose restart backend`).

---

## Deploying to a VPS

The Docker setup above is production-ready as-is — the same `Dockerfile`s and `docker-compose.yml` are what you run on the VPS. This section covers the VPS-specific and Cloudflare-specific parts.

### 1. Point a subdomain at your VPS (Cloudflare)

1. Cloudflare dashboard → your domain → **DNS** → **Add record**
2. Type: `A`, Name: `app` (or any subdomain, e.g. `app.yourdomain.com`), IPv4 address: your VPS's public IP, Proxy status: **Proxied** (orange cloud)
3. Save

**SSL/TLS mode** — Cloudflare dashboard → **SSL/TLS** → **Overview**:

- **Flexible** (fastest): browser↔Cloudflare is HTTPS, Cloudflare↔VPS is plain HTTP. No certificate needed on the VPS — matches `docker-compose.yml` as-is (Nginx only listens on port 80). Good for getting started.
- **Full (strict)** (recommended once live): also encrypts Cloudflare↔VPS, using a free 15-year Cloudflare **Origin Certificate** (no Let's Encrypt renewal needed).
  1. Cloudflare → **SSL/TLS** → **Origin Server** → **Create Certificate** → copy the certificate and key
  2. On the VPS: `mkdir -p docker/nginx/certs` and save them as `cert.pem` / `key.pem` there
  3. Replace `docker/nginx/default.conf` with:
     ```nginx
     server {
         listen 80;
         return 301 https://$host$request_uri;
     }
     server {
         listen 443 ssl;
         ssl_certificate     /etc/nginx/certs/cert.pem;
         ssl_certificate_key /etc/nginx/certs/key.pem;
         client_max_body_size 50M;

         location / {
             proxy_pass http://frontend:80;
             proxy_set_header Host $host;
             proxy_set_header X-Real-IP $remote_addr;
             proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
         }
         location /api {
             proxy_pass http://backend:4000;
             proxy_set_header Host $host;
             proxy_set_header X-Real-IP $remote_addr;
             proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
         }
     }
     ```
  4. In `docker-compose.yml`, add `"443:443"` and mount `./docker/nginx/certs:/etc/nginx/certs:ro` on the `nginx` service, then `docker compose up -d --build nginx`
  5. Set Cloudflare SSL/TLS mode to **Full (strict)**

### 2. Prepare the VPS

```bash
ssh youruser@your-vps-ip

curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 3. Clone and configure

Follow **Step 1 and Step 2** above on the VPS. For production, use these values in `.env`:

```bash
NODE_ENV=production
JWT_SECRET=<generate a NEW one — do not reuse a dev value>
CORS_ORIGIN=https://app.yourdomain.com
FRONTEND_URL=https://app.yourdomain.com
LOG_LEVEL=info
```

And in `apps/frontend/.env`, point at your real domain instead of `localhost`:
```bash
VITE_BACKEND_URL=https://app.yourdomain.com
VITE_API_URL=https://app.yourdomain.com/api
```

Run the migrations (Step 2.4) if this Supabase project hasn't had them applied yet.

### 4. Build and start

```bash
docker compose up -d --build
docker compose ps
curl http://localhost/api/health
```

Visit `https://app.yourdomain.com` — you should see the login page.

### 5. Point Midtrans at your production webhook

Midtrans Dashboard → **Settings** → **Configuration** → **Payment Notification URL**:
```
https://app.yourdomain.com/api/midtrans/webhook
```
This lets online payments (QRIS, Virtual Account, etc.) auto-confirm instead of relying on the manual "Confirm Manually" fallback in the cashier screen.

### 6. Redeploying after code changes

```bash
git pull
docker compose up -d --build
```

If you changed `apps/frontend/.env`, you must rebuild the `frontend` service specifically since those values are compiled into the bundle, not read at runtime.

---

## Notes / known limitations

- CORS is currently wide open (`cors()` with no origin restriction) since frontend and backend share the same origin behind Nginx — the `CORS_ORIGIN` env var is not currently read by the code.
- `REDIS_URL` and `DATABASE_URL` are present for compatibility/manual `psql` access but nothing in the current backend code connects to them directly — all data access goes through the Supabase client. There's no Redis or Postgres container in `docker-compose.yml`.
- Rotate `JWT_SECRET` and switch to Midtrans **production** keys (separate dashboard toggle + new key pair) before accepting real money from real customers.

---

## Security Checklist

Before going live:

- [ ] `JWT_SECRET` is a random string of at least 32 characters, different from any dev value
- [ ] Supabase service role key is only in backend env, never exposed to the frontend
- [ ] `.env` and `docker-compose.yml` are NOT committed to git (check `.gitignore`)
- [ ] `NODE_ENV=production` is set
- [ ] Supabase Row Level Security (RLS) is enabled on your tables
- [ ] Midtrans production keys are in place (not sandbox) if accepting real payments
