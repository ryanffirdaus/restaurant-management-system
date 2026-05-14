# Architecture Guide — Restaurant Management System

Comprehensive guide to understand the codebase, how components interact, and why they're structured this way.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Directory Structure](#directory-structure)
3. [Backend Architecture](#backend-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Database & Authentication](#database--authentication)
6. [Data Flow](#data-flow)
7. [Extending the System](#extending-the-system)

---

## Project Overview

This is a **monolithic full-stack application** split into two containers:

- **Backend**: Express.js API server (Node.js)
- **Frontend**: React app compiled to static HTML/CSS/JS served by Nginx
- **Database**: Supabase (cloud-hosted PostgreSQL)
- **Cache**: Redis (local)
- **Reverse Proxy**: Nginx (routes traffic between frontend and backend)

```
User's Browser
      ↓
   Nginx (http://localhost:80)
   ├─ /           → Frontend (React app in /dist)
   └─ /api/*      → Backend (Express server on port 4000)
      ├─ Supabase (cloud PostgreSQL)
      └─ Redis (local cache)
```

---

## Directory Structure

```
restaurant-management-system/
│
├── apps/
│   ├── backend/                    # Express.js API server
│   │   ├── src/
│   │   │   ├── index.js           # Server entry point
│   │   │   └── lib/
│   │   │       └── supabase.ts    # Supabase client initialization
│   │   ├── Dockerfile            # Container image definition
│   │   ├── package.json          # Dependencies
│   │   ├── .env                  # Local config (real credentials)
│   │   └── .env.example          # Config template (generic values)
│   │
│   └── frontend/                  # React + Vite application
│       ├── src/
│       │   └── lib/
│       │       └── supabase.ts   # Supabase client initialization
│       ├── index.html            # HTML entry point (not used after build)
│       ├── vite.config.js        # Vite build tool configuration
│       ├── Dockerfile           # Multi-stage build
│       ├── package.json         # Dependencies
│       ├── .env                 # Local config (real credentials)
│       └── .env.example         # Config template (generic values)
│
├── docker/
│   └── nginx/
│       └── default.conf         # Nginx reverse proxy configuration
│
├── docker-compose.yml            # Docker services orchestration (gitignored)
├── docker-compose.example.yml    # Compose template
├── .env                          # Backend environment (gitignored)
├── .env.example                  # Backend template
│
├── README.md                     # Project overview
├── SETUP.md                      # Installation guide
├── ARCHITECTURE.md               # This file
├── DOCKER-GUIDE.md               # Docker & Nginx explanation
├── DEVELOPMENT.md                # How to extend features
└── .gitignore                    # What NOT to commit

```

### Key Files Explained

| File | Purpose |
|------|---------|
| `apps/backend/src/index.js` | Express server setup, routes, middleware |
| `apps/backend/src/lib/supabase.ts` | Database client setup with admin key |
| `apps/frontend/src/lib/supabase.ts` | Database client setup with public key |
| `docker/nginx/default.conf` | Reverse proxy rules |
| `docker-compose.yml` | Services definition (local, not in git) |
| `.env` | Actual secrets (local only, not in git) |

---

## Backend Architecture

### What is the Backend?

The backend is an **Express.js HTTP API server** that:
- Receives requests from the frontend
- Validates and processes data
- Communicates with Supabase (database)
- Returns JSON responses

### File: `apps/backend/src/index.js`

```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();  // Load environment variables from .env

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware (processes requests before routes)
app.use(cors());              // Allow frontend to call this API
app.use(express.json());      // Parse incoming JSON

// Routes (URL endpoints)
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend API is running', timestamp: new Date() });
});

app.get('/', (req, res) => {
  res.json({ message: 'Restaurant Management System Backend', version: '1.0.0' });
});

// Start listening
app.listen(PORT, () => {
  console.log(`✅ Backend server running on port ${PORT}`);
});
```

**What it does:**
1. `import` — Load required libraries
2. `dotenv.config()` — Read `.env` file into `process.env`
3. `app.use(cors())` — Allow cross-origin requests (frontend can call from different domain/port)
4. `app.use(express.json())` — Auto-parse request body as JSON
5. `app.get(path, handler)` — Define a GET route
6. `app.listen(PORT)` — Start server on port 4000

### File: `apps/backend/src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) throw new Error('Missing environment variable: SUPABASE_URL')
if (!supabaseServiceKey) throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY')

export const supabase = createClient(supabaseUrl, supabaseServiceKey)
```

**What it does:**
1. Import Supabase client library
2. Get URL and key from environment variables
3. Validate they exist (throw error if missing)
4. Create and export a Supabase client instance
5. This client is used to query the database

**Why two keys?**
- **Anon Key** (frontend): Limited permissions, safe to expose
- **Service Role Key** (backend): Full admin permissions, must be secret

### Adding a New API Endpoint

Example: Add `GET /api/orders` to fetch orders from database

**File: `apps/backend/src/index.js`**

```javascript
// Import the Supabase client
import { supabase } from './lib/supabase.js';

// Add this route after other routes
app.get('/api/orders', async (req, res) => {
  try {
    // Query database
    const { data, error } = await supabase
      .from('orders')           // table name
      .select('*');              // all columns

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

**How it works:**
1. Client makes request: `GET /api/orders`
2. Backend receives request
3. Backend queries Supabase: `SELECT * FROM orders`
4. Supabase returns data (or error)
5. Backend sends data to frontend as JSON

---

## Frontend Architecture

### What is the Frontend?

The frontend is a **React application** (bundled into static files) that:
- Shows UI to the user
- Sends requests to the backend API
- Displays data from the backend
- Handles user interactions

### Build Process: Vite

Vite is a **build tool** that converts React code into optimized static files:

```
Source Code (React JSX)
    ↓ (Vite build)
Static Files (HTML + CSS + JS)
    ↓ (Nginx serves)
Browser
```

**File: `apps/frontend/vite.config.js`**

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],          // Enable React support
  server: {
    port: 5173,                // Dev server port
    host: true                 // Listen on all interfaces
  },
  build: {
    outDir: 'dist',            // Output folder
    sourcemap: false           // Don't include source maps (smaller bundle)
  }
})
```

### Development vs Production

**Development Mode** (npm run dev):
- Code runs as-is (slow, but useful for debugging)
- Vite dev server at http://localhost:5173
- Auto-reload on file changes
- React Dev Tools available

**Production Mode** (npm run build):
- Code bundled and minified (fast, small bundle size)
- Output to `dist/` folder
- Nginx serves static files from `dist/`
- No source maps (faster load)

### File: `apps/frontend/src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl) throw new Error('Missing: VITE_SUPABASE_URL')
if (!supabaseAnonKey) throw new Error('Missing: VITE_SUPABASE_ANON_KEY')

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**What's different from backend:**
- Uses `import.meta.env` instead of `process.env` (Vite specific)
- Variables must start with `VITE_` to be accessible to frontend
- Uses **Anon Key** (public), not Service Role Key (secret)

### Creating a React Component

Example: Component that displays orders

**File: `apps/frontend/src/components/OrderList.jsx`**

```javascript
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function OrderList() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch orders when component mounts
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')

      if (error) throw error
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <p>Loading...</p>

  return (
    <div>
      <h1>Orders</h1>
      <ul>
        {orders.map(order => (
          <li key={order.id}>{order.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

**How it works:**
1. Component mounts (appears on screen)
2. `useEffect` runs the function inside
3. `fetchOrders()` calls Supabase API
4. Data is saved to `orders` state
5. Component re-renders with new data
6. User sees the orders list

---

## Database & Authentication

### Supabase Overview

Supabase is a **Backend-as-a-Service (BaaS)** that provides:
- PostgreSQL database (cloud-hosted)
- Authentication (JWT tokens)
- Real-time updates
- File storage

### Two API Keys

| Key | Used By | Permissions | Security |
|-----|---------|-------------|----------|
| **Anon Key** | Frontend | Read/write via RLS policies | Public (safe in code) |
| **Service Role Key** | Backend | Full admin access | Secret (must not expose) |

**How .env protects secrets:**

```bash
# .env (local, NOT in git — gitignored)
SUPABASE_SERVICE_ROLE_KEY=sb_service_role_123...  # Secret!

# .env.example (in git — generic example)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here  # Generic
```

### Row Level Security (RLS)

RLS policies control which user can access which data:

```sql
-- Only users can see their own orders
CREATE POLICY "Users can view their orders"
ON orders
FOR SELECT
USING (user_id = auth.uid());
```

---

## Data Flow

### Complete Request-Response Flow

```
1. User clicks button in React
   ↓
2. Frontend calls API endpoint
   await fetch('/api/orders')
   ↓
3. Nginx receives request at :80
   ↓
4. Nginx routes to Backend at :4000
   (based on /api in URL)
   ↓
5. Express receives request
   app.get('/api/orders')
   ↓
6. Backend queries Supabase database
   supabase.from('orders').select('*')
   ↓
7. Supabase returns data (or error)
   ↓
8. Backend sends JSON response
   res.json(data)
   ↓
9. Nginx forwards response to frontend
   ↓
10. Frontend receives data
    .then(response => response.json())
    ↓
11. Frontend updates React state
    setOrders(data)
    ↓
12. React re-renders with new data
    ↓
13. User sees updated UI
```

### Example Flow: Fetch Orders

**Frontend sends request:**
```javascript
const response = await fetch('/api/orders')
const orders = await response.json()
```

**HTTP request that's actually sent:**
```
GET /api/orders HTTP/1.1
Host: localhost:80
```

**Nginx intercepts and routes:**
```
Request to /api → route to backend:4000
GET http://backend:4000/api/orders
```

**Backend receives and queries:**
```javascript
const { data, error } = await supabase
  .from('orders')
  .select('*')
```

**Supabase returns (example):**
```json
[
  { id: 1, name: "Burger Order", price: 15.99 },
  { id: 2, name: "Pizza Order", price: 22.50 }
]
```

**Backend sends response:**
```json
{
  "status": 200,
  "data": [
    { id: 1, name: "Burger Order", price: 15.99 },
    { id: 2, name: "Pizza Order", price: 22.50 }
  ]
}
```

**Frontend receives and displays:**
```javascript
orders.map(order => <li>{order.name}</li>)
// Result: "Burger Order", "Pizza Order"
```

---

## Extending the System

### Adding a New Database Table

1. **Create table in Supabase:**
   - Go to https://app.supabase.com
   - Navigate to SQL Editor
   - Create table:
   ```sql
   CREATE TABLE customers (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name TEXT NOT NULL,
     email TEXT UNIQUE NOT NULL,
     phone TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Enable RLS:**
   - Go to Authentication → Policies
   - Add policy for each table

### Adding a New API Route

**File: `apps/backend/src/routes/customers.js`**

```javascript
import express from 'express'
import { supabase } from '../lib/supabase.js'

const router = express.Router()

// GET /api/customers
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/customers
router.post('/', async (req, res) => {
  try {
    const { name, email, phone } = req.body
    const { data, error } = await supabase
      .from('customers')
      .insert([{ name, email, phone }])
      .select()
    if (error) throw error
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
```

**File: `apps/backend/src/index.js`** (add import):

```javascript
import customerRoutes from './routes/customers.js'

app.use('/api/customers', customerRoutes)
```

Now you have:
- `GET /api/customers` — List all customers
- `POST /api/customers` — Create new customer

### Adding a New React Page

**File: `apps/frontend/src/pages/Customers.jsx`**

```javascript
import { useEffect, useState } from 'react'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    const response = await fetch('/api/customers')
    const data = await response.json()
    setCustomers(data)
  }

  const handleAddCustomer = async (e) => {
    e.preventDefault()
    const response = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    })
    const newCustomer = await response.json()
    setCustomers([...customers, newCustomer[0]])
    setName('')
    setEmail('')
  }

  return (
    <div>
      <h1>Customers</h1>
      <form onSubmit={handleAddCustomer}>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Name"
        />
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
        />
        <button type="submit">Add Customer</button>
      </form>
      <ul>
        {customers.map(customer => (
          <li key={customer.id}>{customer.name} ({customer.email})</li>
        ))}
      </ul>
    </div>
  )
}
```

---

## Summary

| Component | Purpose | Technology |
|-----------|---------|-----------|
| **Frontend** | User interface | React, Vite, HTML/CSS |
| **Backend** | API server | Express.js, Node.js |
| **Database** | Store data | Supabase (PostgreSQL) |
| **Cache** | Performance | Redis |
| **Proxy** | Route traffic | Nginx |

**Key Points:**
- Frontend and backend communicate via HTTP/JSON
- Nginx routes requests based on URL path
- Supabase handles database and authentication
- Two API keys: public (frontend) and secret (backend)
- Environment variables store sensitive data
- `.gitignore` prevents secrets from being committed

---

Next steps:
- Read [DOCKER-GUIDE.md](DOCKER-GUIDE.md) to understand containerization
- Read [DEVELOPMENT.md](DEVELOPMENT.md) to learn how to extend features
