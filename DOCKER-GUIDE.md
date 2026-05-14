# Docker & Nginx Guide

Complete guide to understanding Docker, containers, networking, and the Nginx reverse proxy.

---

## Table of Contents

1. [What is Docker?](#what-is-docker)
2. [How Docker Works](#how-docker-works)
3. [Docker Compose](#docker-compose)
4. [Services in This Project](#services-in-this-project)
5. [Networking](#networking)
6. [Nginx Reverse Proxy](#nginx-reverse-proxy)
7. [Common Docker Commands](#common-docker-commands)
8. [Troubleshooting](#troubleshooting)

---

## What is Docker?

Docker is a **containerization platform** that packages applications with all their dependencies into isolated units called **containers**.

### Why Docker?

**Without Docker:**
```
Developer A            Developer B           Production Server
Ubuntu 22.04          macOS 14               CentOS 8
Node 18               Node 20                Node 16
npm v8                npm v9                 npm v7
Result: Works on my machine ❌❌❌ Doesn't work on theirs!
```

**With Docker:**
```
Developer A            Developer B           Production Server
├─ Docker Container   ├─ Docker Container   ├─ Docker Container
│  ├─ Node 20        │  ├─ Node 20        │  ├─ Node 20
│  └─ npm v9         │  └─ npm v9         │  └─ npm v9
Result: Works everywhere ✅✅✅
```

### Key Concepts

| Term | Meaning |
|------|---------|
| **Image** | Blueprint/recipe for a container (like a class in programming) |
| **Container** | Running instance of an image (like an object from a class) |
| **Dockerfile** | File that defines how to build an image |
| **Docker Compose** | Tool to run multiple containers together |

---

## How Docker Works

### Building an Image

A **Dockerfile** is a set of instructions to build an image:

**File: `apps/backend/Dockerfile`**

```dockerfile
FROM node:20-alpine
# Start with a Node.js 20 image (Alpine = small Linux distro)

WORKDIR /app
# Set working directory inside container

COPY package*.json ./
# Copy package.json and package-lock.json to /app

RUN npm install
# Install dependencies

COPY . .
# Copy entire project

EXPOSE 4000
# Document that this container listens on port 4000
# (This doesn't actually expose; just documentation)

CMD ["npm", "run", "dev"]
# Default command to run
```

**Build process:**

```
Dockerfile
    ↓
docker build
    ↓
Image (saved locally or pushed to registry)
    ↓
docker run
    ↓
Container (running process)
```

### Container Filesystem

Each container has its own isolated filesystem:

```
Container 1 (Backend)          Container 2 (Frontend)
├─ /app/                       ├─ /app/
│  ├─ package.json            │  ├─ package.json
│  └─ src/                     │  └─ dist/
├─ /node_modules/             ├─ /usr/share/nginx/html/
└─ ...                         └─ ...

Your Host Machine
├─ apps/backend/              → mounted to Container 1:/app
├─ apps/frontend/             → mounted to Container 2:/app
└─ ...
```

Volumes allow host files to be accessible inside containers. Example:

```yaml
volumes:
  - ./apps/backend:/app
  # Container can read/write to host apps/backend/
```

---

## Docker Compose

Docker Compose lets you define and run multiple containers as a single application.

**File: `docker-compose.yml`**

```yaml
version: '3.9'
# Docker Compose file format version

services:
  frontend:
    build:
      context: ./apps/frontend
      dockerfile: Dockerfile
    # Build an image from apps/frontend/Dockerfile
    
    container_name: rms_frontend
    # Name the running container
    
    ports:
      - "3000:80"
    # Host:Container port mapping
    # Port 3000 on host → Port 80 in container
    # You visit http://localhost:3000
    
    depends_on:
      - backend
    # Wait for backend to start before starting frontend
    
    restart: unless-stopped
    # Restart container if it crashes (unless manually stopped)

  backend:
    build:
      context: ./apps/backend
      dockerfile: Dockerfile
    
    container_name: rms_backend
    ports:
      - "4000:4000"
    
    env_file:
      - .env
    # Load environment variables from .env file
    
    depends_on:
      - postgres
      - redis
    # Wait for database and cache before starting
    
    volumes:
      - ./apps/backend:/app
      - /app/node_modules
    # Mount source code (for live reload during development)
    # Exclude node_modules from mount
    
    restart: unless-stopped

  postgres:
    image: postgres:16
    # Use pre-built PostgreSQL 16 image
    
    container_name: rms_postgres
    ports:
      - "5432:5432"
    
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: restaurant_system
    # Database setup (for local dev only!)
    
    volumes:
      - postgres_data:/var/lib/postgresql/data
    # Store database files in named volume
    
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    # Use pre-built Redis 7 image (Alpine = small)
    
    container_name: rms_redis
    ports:
      - "6379:6379"
    
    restart: unless-stopped

  nginx:
    image: nginx:stable-alpine
    # Pre-built Nginx image
    
    container_name: rms_nginx
    ports:
      - "80:80"
      - "443:443"
    
    volumes:
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf
    # Mount Nginx config file
    
    depends_on:
      - frontend
      - backend
    
    restart: unless-stopped

volumes:
  postgres_data:
    # Named volume for persistent database storage
```

---

## Services in This Project

### Frontend Container

```
Frontend Container (rms_frontend)
├─ Base Image: node:20-alpine (for building)
├─ Build Step: npm run build → dist/
├─ Final Image: nginx:stable-alpine
├─ Serves: /usr/share/nginx/html/dist/
└─ Port: 80 (exposed as 3000 on host)
```

**How the build works:**
1. Node image builds React with Vite
2. Output is `dist/` folder (HTML + CSS + JS)
3. Switch to Nginx image
4. Copy `dist/` to Nginx's web root
5. Nginx serves static files

### Backend Container

```
Backend Container (rms_backend)
├─ Base Image: node:20-alpine
├─ Installs: npm dependencies
├─ Runs: npm run dev (Express server)
└─ Port: 4000
```

### Database Container

```
PostgreSQL Container (rms_postgres)
├─ Base Image: postgres:16
├─ Database: restaurant_system
├─ Stores data in: postgres_data volume
└─ Port: 5432
```

Volumes ensure data persists even if container restarts:

```bash
docker-compose down -v    # Remove volume data
docker-compose up         # Start fresh (empty database)

docker-compose down       # Keep volume data
docker-compose up         # Database data still there!
```

### Redis Container

```
Redis Container (rms_redis)
├─ Base Image: redis:7-alpine
├─ Stores: Cache in memory (fast, temporary)
└─ Port: 6379
```

### Nginx Container

```
Nginx Container (rms_nginx)
├─ Base Image: nginx:stable-alpine
├─ Config: docker/nginx/default.conf
├─ Routes: "/" → frontend, "/api/*" → backend
└─ Port: 80
```

---

## Networking

### How Containers Talk to Each Other

Docker Compose creates a **virtual network** connecting all containers:

```
Host Machine
│
└─ Docker Network
   ├─ frontend    (http://frontend:80)
   ├─ backend     (http://backend:4000)
   ├─ postgres    (tcp://postgres:5432)
   ├─ redis       (tcp://redis:6379)
   └─ nginx       (http://nginx:80)
```

**From inside the backend container:**

```javascript
// Connect to Redis (using container name as hostname)
const redis = new Redis('redis://redis:6379')

// Connect to PostgreSQL (using container name)
const pool = new Pool({
  host: 'postgres',    // Not localhost!
  port: 5432
})
```

**From outside (your browser):**

```
http://localhost:80      → Nginx container
http://localhost:3000    → mapped from 80
http://localhost:4000    → Backend container
http://localhost:5432    → PostgreSQL container
```

### Port Mapping

```
Host Port : Container Port

80:80              → http://localhost:80 → Nginx
3000:80            → http://localhost:3000 → Frontend (redirects to Nginx)
4000:4000          → http://localhost:4000 → Backend
5432:5432          → localhost:5432 → PostgreSQL
6379:6379          → localhost:6379 → Redis
```

Each service on the host has a unique port (to avoid conflicts). Inside Docker network, they use their internal ports.

---

## Nginx Reverse Proxy

### What is a Reverse Proxy?

A reverse proxy is a server that:
1. Receives all user requests
2. Routes them to the correct backend service
3. Returns responses to users

```
User Request → Nginx (Reverse Proxy) → [Frontend / Backend]
```

### File: `docker/nginx/default.conf`

```nginx
server {
    listen 80;
    # Listen on port 80 (HTTP)

    client_max_body_size 50M;
    # Allow file uploads up to 50MB

    location / {
        # Match any URL starting with /
        proxy_pass http://frontend:80;
        # Route to frontend container
    }

    location /api {
        # Match any URL starting with /api
        proxy_pass http://backend:4000;
        # Route to backend container:4000

        # Headers for better proxy behavior
        proxy_set_header Host $host;
        # Pass original host header

        proxy_set_header X-Real-IP $remote_addr;
        # Pass client's real IP address

        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        # Pass all client IPs in chain

        proxy_set_header X-Forwarded-Proto $scheme;
        # Pass http or https
    }

    location /socket.io/ {
        # Match WebSocket connections
        proxy_pass http://backend:4000;
        
        # WebSocket upgrade headers
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        # Required for WebSocket to work
    }
}
```

### How Nginx Routes Requests

**Example 1: User visits frontend**

```
User: http://localhost/
    ↓
Nginx checks: Does "/" match any location?
    ↓
Match: location /
    ↓
Nginx routes to: http://frontend:80/
    ↓
Frontend (React app) responds
    ↓
Nginx returns response to user
```

**Example 2: Frontend calls API**

```
Frontend JavaScript:
fetch('/api/orders')
    ↓
Browser sends: GET /api/orders
    ↓
Nginx checks: Does "/api/orders" match any location?
    ↓
Match: location /api
    ↓
Nginx routes to: http://backend:4000/api/orders
    ↓
Backend (Express) responds with JSON
    ↓
Nginx forwards response to frontend
    ↓
Frontend receives data
```

### Why Use a Reverse Proxy?

1. **Single entry point** — Users only access Nginx on port 80
2. **Routing** — Nginx decides where to send requests
3. **Security** — Hide backend servers from direct access
4. **Load balancing** — Nginx can distribute requests across multiple backends
5. **SSL/TLS** — Can add HTTPS at Nginx layer

---

## Common Docker Commands

### Building

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build backend

# Build without cache (fresh)
docker-compose build --no-cache
```

### Running

```bash
# Start all services in background
docker-compose up -d

# Start and view logs
docker-compose up

# Stop all services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop, remove containers, and delete volumes
docker-compose down -v
```

### Viewing Status

```bash
# List all running containers
docker-compose ps

# View logs
docker-compose logs

# View logs for specific service
docker-compose logs -f backend

# Follow logs in real-time
docker-compose logs -f

# Show last 50 lines
docker-compose logs --tail 50
```

### Executing

```bash
# Run command in container
docker exec rms_backend npm run dev

# Open shell in container
docker exec -it rms_backend sh

# Check if service is running
docker-compose ps backend
```

### Image Management

```bash
# List images
docker images

# Remove image
docker rmi rms_backend:latest

# Remove unused images
docker image prune
```

---

## Troubleshooting

### Container won't start

**Check logs:**
```bash
docker-compose logs backend
# Look for error messages
```

**Rebuild:**
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Port already in use

```bash
# Find what's using port 3000
lsof -i :3000
# Kill the process
kill -9 PID
```

### Can't connect to database

```bash
# Check if postgres is running
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres

# Try connecting manually
docker exec rms_postgres psql -U postgres -d restaurant_system
```

### Frontend can't reach backend API

**Check:**
1. Backend is running: `docker-compose ps backend`
2. Nginx config has `/api` route: `cat docker/nginx/default.conf`
3. Frontend uses `/api/` prefix: `fetch('/api/orders')`
4. CORS is enabled in backend: Check `app.use(cors())`

### Nginx returning 502 Bad Gateway

This means Nginx can't reach the backend service. Check:

```bash
# Check if backend is running
docker-compose ps backend

# Check backend logs
docker-compose logs backend

# Check if backend is actually listening on 4000
docker exec rms_backend netstat -tlnp | grep 4000
```

### Volume mount issues

```bash
# See what's mounted
docker-compose exec backend mount | grep /app

# Check file permissions
ls -la apps/backend/

# Rebuild with fresh volume
docker-compose down -v
docker-compose up -d
```

### Out of disk space

```bash
# Remove unused containers, images, volumes
docker system prune -a

# List sizes
du -sh /var/lib/docker/

# Remove old images
docker image prune -a
```

---

## Advanced: Multi-stage Docker Build

The **frontend Dockerfile** uses multi-stage building:

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY . .
RUN npm run build
# Produces dist/ folder

# Stage 2: Runtime
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Why?**

```
Stage 1 (Builder): node:20-alpine (350MB)
├─ Install Node
├─ Install npm packages
├─ Build React (npm run build)
└─ Output: dist/ folder

Stage 2 (Runtime): nginx:stable-alpine (45MB)
├─ Start fresh
├─ Copy only dist/ folder
└─ Serve with Nginx

Final Image Size: ~100MB (not 350MB+)
```

This keeps the final Docker image small by discarding build tools in the final image.

---

## Docker Compose Network Explained

```
[Host Network]
│
├─ Ports (bridge to container network)
│  ├─ :80    → nginx:80
│  ├─ :3000  → frontend:80
│  ├─ :4000  → backend:4000
│  ├─ :5432  → postgres:5432
│  └─ :6379  → redis:6379
│
└─ Docker Network (internal)
   ├─ nginx:80 → can reach frontend, backend
   ├─ frontend:80 → can reach nginx, backend
   ├─ backend:4000 → can reach postgres, redis, nginx
   ├─ postgres:5432
   └─ redis:6379
```

Services communicate using **service names** as hostnames inside the network.

---

## Summary

| Concept | Purpose |
|---------|---------|
| **Dockerfile** | Recipe to build an image |
| **Image** | Blueprint (executable bundle) |
| **Container** | Running instance |
| **Volume** | Persistent storage |
| **Network** | Communication between containers |
| **Docker Compose** | Orchestrate multiple containers |
| **Nginx** | Reverse proxy & router |

**Key Commands:**
```bash
docker-compose build          # Build images
docker-compose up -d          # Start services
docker-compose logs -f        # View logs
docker-compose ps             # List containers
docker-compose down -v        # Stop and clean
docker exec -it rms_backend sh # Shell access
```

---

Next: Read [DEVELOPMENT.md](DEVELOPMENT.md) to learn how to extend the system.
