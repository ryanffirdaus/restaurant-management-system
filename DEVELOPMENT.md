# Development Guide

Learn how to extend the Restaurant Management System with new features.

---

## Table of Contents

1. [Project Setup](#project-setup)
2. [Typical Development Workflow](#typical-development-workflow)
3. [Adding a Database Table](#adding-a-database-table)
4. [Adding a Backend API Route](#adding-a-backend-api-route)
5. [Adding a Frontend Component](#adding-a-frontend-component)
6. [Building a Complete Feature](#building-a-complete-feature)
7. [Testing](#testing)
8. [Git Workflow](#git-workflow)
9. [Common Patterns](#common-patterns)

---

## Project Setup

### Prerequisites

- Node.js 20+ and npm
- Docker and Docker Compose
- Git
- A Supabase account
- Code editor (VS Code recommended)

### Initial Setup

```bash
# 1. Clone repository
git clone https://github.com/ryanffirdaus/restaurant-management-system.git
cd restaurant-management-system

# 2. Create local environment files
cp .env.example .env
cp apps/frontend/.env.example apps/frontend/.env

# 3. Edit .env files with your Supabase credentials
# Edit .env (backend)
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# Edit apps/frontend/.env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY

# 4. Create docker-compose.yml for local ports
cp docker-compose.example.yml docker-compose.yml
# Optional: Edit port mappings if needed

# 5. Start Docker containers
docker-compose up -d

# 6. Verify services
curl http://localhost:4000/api/health
# Should return: {"status": "Backend API is running", ...}
```

---

## Typical Development Workflow

### Daily Development

```bash
# 1. Morning: Start fresh
docker-compose up -d

# 2. Check logs for any errors
docker-compose logs -f

# 3. Watch backend for changes
docker-compose logs -f backend

# 4. Watch frontend for changes
docker-compose logs -f frontend

# 5. Code your changes

# 6. Test in browser
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000/api/health

# 7. Stop when done
docker-compose down
```

### Local Development (Without Docker)

If you prefer to run services locally:

```bash
# Terminal 1: Backend
cd apps/backend
npm install
npm run dev
# Runs on http://localhost:4000

# Terminal 2: Frontend
cd apps/frontend
npm install
npm run dev
# Runs on http://localhost:5173

# Terminal 3: Use Nginx locally (optional)
# For testing Nginx routing, use docker:
docker-compose up nginx
```

---

## Adding a Database Table

### Step 1: Create Table in Supabase

Go to https://app.supabase.com:

1. Open SQL Editor
2. Create new query:

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  restaurant_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  total_price DECIMAL(10, 2),
  items JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES auth.users(id),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  menu_item_id UUID NOT NULL,
  quantity INT DEFAULT 1,
  price_at_purchase DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
);
```

### Step 2: Enable Row Level Security

In Supabase → Authentication → Policies:

```sql
-- Users can view their own orders
CREATE POLICY "Users can view their own orders"
ON orders
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own orders
CREATE POLICY "Users can insert their own orders"
ON orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
ON orders
FOR SELECT
USING (auth.jwt() ->> 'role' = 'admin');
```

### Step 3: Query from Backend

**File: `apps/backend/src/lib/database.js`**

```javascript
import { supabase } from './supabase.js'

// Fetch all orders
export async function getOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')  // Include related items
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

// Fetch single order
export async function getOrderById(id) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

// Create order
export async function createOrder(userId, restaurantId, items) {
  const { data, error } = await supabase
    .from('orders')
    .insert([{
      user_id: userId,
      restaurant_id: restaurantId,
      items: items
    }])
    .select()
  
  if (error) throw error
  return data[0]
}

// Update order status
export async function updateOrderStatus(orderId, status) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date() })
    .eq('id', orderId)
    .select()
  
  if (error) throw error
  return data[0]
}
```

---

## Adding a Backend API Route

### Create New Route File

**File: `apps/backend/src/routes/orders.js`**

```javascript
import express from 'express'
import {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus
} from '../lib/database.js'

const router = express.Router()

// GET /api/orders
router.get('/', async (req, res) => {
  try {
    const orders = await getOrders()
    res.json(orders)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await getOrderById(req.params.id)
    res.json(order)
  } catch (error) {
    res.status(404).json({ error: 'Order not found' })
  }
})

// POST /api/orders
router.post('/', async (req, res) => {
  try {
    const { userId, restaurantId, items } = req.body
    
    // Validation
    if (!userId || !restaurantId || !items) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    
    const order = await createOrder(userId, restaurantId, items)
    res.status(201).json(order)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PATCH /api/orders/:id/status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' })
    }
    
    const order = await updateOrderStatus(req.params.id, status)
    res.json(order)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
```

### Register Route in Main App

**File: `apps/backend/src/index.js`**

```javascript
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import orderRoutes from './routes/orders.js'  // Add import

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

// Routes
app.use('/api/orders', orderRoutes)  // Register route

app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend API is running', timestamp: new Date() })
})

app.listen(PORT, () => {
  console.log(`✅ Backend server running on port ${PORT}`)
})
```

### Test the Route

```bash
# Get all orders
curl http://localhost:4000/api/orders

# Create order
curl -X POST http://localhost:4000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid-123",
    "restaurantId": "restaurant-uuid-456",
    "items": [
      {"menuItemId": "item-1", "quantity": 2},
      {"menuItemId": "item-2", "quantity": 1}
    ]
  }'

# Update order status
curl -X PATCH http://localhost:4000/api/orders/order-uuid/status \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

---

## Adding a Frontend Component

### Create Component

**File: `apps/frontend/src/components/OrderList.jsx`**

```javascript
import { useState, useEffect } from 'react'

export default function OrderList() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/orders')
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }
      
      const data = await response.json()
      setOrders(data)
      setError(null)
    } catch (err) {
      setError(err.message)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (!response.ok) throw new Error('Failed to update status')
      
      // Refresh orders
      await fetchOrders()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  if (loading) return <p>Loading orders...</p>
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>

  return (
    <div>
      <h1>Orders</h1>
      <button onClick={fetchOrders}>Refresh</button>
      
      {orders.length === 0 ? (
        <p>No orders found</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Status</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>{order.id.slice(0, 8)}...</td>
                <td>{order.status}</td>
                <td>${order.total_price}</td>
                <td>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  >
                    <option>pending</option>
                    <option>preparing</option>
                    <option>ready</option>
                    <option>completed</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

### Use Component in Main App

**File: `apps/frontend/src/App.jsx`** (create if doesn't exist)

```javascript
import OrderList from './components/OrderList'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <header>
        <h1>Restaurant Management System</h1>
      </header>
      <main>
        <OrderList />
      </main>
    </div>
  )
}
```

### Create Main.jsx if Needed

**File: `apps/frontend/src/main.jsx`**

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### Create HTML Template

**File: `apps/frontend/index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Restaurant Management System</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

## Building a Complete Feature

Example: Add a **Menu Items** management feature

### 1. Database Table

```sql
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT,
  available BOOLEAN DEFAULT true,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
);
```

### 2. Backend Functions

**File: `apps/backend/src/lib/database.js`**

```javascript
export async function getMenuItems(restaurantId) {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('restaurant_id', restaurantId)
    .eq('available', true)
  
  if (error) throw error
  return data
}

export async function getMenuItem(id) {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

export async function createMenuItem(restaurantId, item) {
  const { data, error } = await supabase
    .from('menu_items')
    .insert([{ restaurant_id: restaurantId, ...item }])
    .select()
  
  if (error) throw error
  return data[0]
}

export async function updateMenuItem(id, updates) {
  const { data, error } = await supabase
    .from('menu_items')
    .update(updates)
    .eq('id', id)
    .select()
  
  if (error) throw error
  return data[0]
}

export async function deleteMenuItem(id) {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}
```

### 3. Backend Routes

**File: `apps/backend/src/routes/menu.js`**

```javascript
import express from 'express'
import {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} from '../lib/database.js'

const router = express.Router()

// GET /api/menu/:restaurantId
router.get('/:restaurantId', async (req, res) => {
  try {
    const items = await getMenuItems(req.params.restaurantId)
    res.json(items)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// POST /api/menu/:restaurantId
router.post('/:restaurantId', async (req, res) => {
  try {
    const item = await createMenuItem(req.params.restaurantId, req.body)
    res.status(201).json(item)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// PUT /api/menu/:id
router.put('/:id', async (req, res) => {
  try {
    const item = await updateMenuItem(req.params.id, req.body)
    res.json(item)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// DELETE /api/menu/:id
router.delete('/:id', async (req, res) => {
  try {
    await deleteMenuItem(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
```

### 4. Register in Main App

**File: `apps/backend/src/index.js`**

```javascript
import menuRoutes from './routes/menu.js'

app.use('/api/menu', menuRoutes)
```

### 5. Frontend Component

**File: `apps/frontend/src/components/MenuManager.jsx`**

```javascript
import { useState, useEffect } from 'react'

export default function MenuManager({ restaurantId }) {
  const [items, setItems] = useState([])
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    category: '',
    description: ''
  })

  useEffect(() => {
    fetchMenuItems()
  }, [restaurantId])

  const fetchMenuItems = async () => {
    try {
      const response = await fetch(`/api/menu/${restaurantId}`)
      const data = await response.json()
      setItems(data)
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/menu/${restaurantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      })
      const createdItem = await response.json()
      setItems([...items, createdItem])
      setNewItem({ name: '', price: '', category: '', description: '' })
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleDeleteItem = async (id) => {
    if (!confirm('Delete this item?')) return
    try {
      await fetch(`/api/menu/${id}`, { method: 'DELETE' })
      setItems(items.filter(item => item.id !== id))
    } catch (error) {
      alert(`Error: ${error.message}`)
    }
  }

  return (
    <div>
      <h2>Menu Items</h2>
      
      <form onSubmit={handleAddItem}>
        <input
          type="text"
          placeholder="Item name"
          value={newItem.name}
          onChange={(e) => setNewItem({...newItem, name: e.target.value})}
          required
        />
        <input
          type="number"
          placeholder="Price"
          value={newItem.price}
          onChange={(e) => setNewItem({...newItem, price: e.target.value})}
          required
        />
        <input
          type="text"
          placeholder="Category"
          value={newItem.category}
          onChange={(e) => setNewItem({...newItem, category: e.target.value})}
        />
        <textarea
          placeholder="Description"
          value={newItem.description}
          onChange={(e) => setNewItem({...newItem, description: e.target.value})}
        />
        <button type="submit">Add Item</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.category}</td>
              <td>${item.price}</td>
              <td>
                <button onClick={() => handleDeleteItem(item.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

---

## Testing

### API Testing with cURL

```bash
# Test backend is running
curl http://localhost:4000/api/health

# Get menu items
curl http://localhost:4000/api/menu/restaurant-uuid

# Create menu item
curl -X POST http://localhost:4000/api/menu/restaurant-uuid \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Burger",
    "price": 12.99,
    "category": "Main Courses",
    "description": "Delicious burger"
  }'

# Update item
curl -X PUT http://localhost:4000/api/menu/item-uuid \
  -H "Content-Type: application/json" \
  -d '{"price": 13.99}'

# Delete item
curl -X DELETE http://localhost:4000/api/menu/item-uuid
```

### Frontend Testing

```bash
# Visit frontend
http://localhost:3000

# Check browser console for errors
F12 → Console tab

# Check network requests
F12 → Network tab → Make request → Check response
```

---

## Git Workflow

### Making Changes

```bash
# Create feature branch
git checkout -b feature/menu-management

# Make changes and commits
# ... edit files ...
git add .
git commit -m "feat: add menu management

- Create menu_items table in Supabase
- Add CRUD endpoints for menu items
- Create MenuManager React component"

# Push changes
git push origin feature/menu-management

# Create Pull Request on GitHub for review
```

### Commit Message Format

Follow conventional commits:

```
feat:     New feature
fix:      Bug fix
docs:     Documentation
style:    Code style (no logic change)
refactor: Refactor code
test:     Add tests
chore:    Dependencies, config
```

Example:
```
feat: add order status updates
fix: correct Supabase table schema
docs: update ARCHITECTURE.md
```

---

## Common Patterns

### Authentication Check

```javascript
// Backend
app.get('/api/user/profile', (req, res) => {
  const token = req.headers.authorization?.split('Bearer ')[1]
  if (!token) {
    return res.status(401).json({ error: 'No token' })
  }
  // Verify token and get user
})

// Frontend
const response = await fetch('/api/user/profile', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

### Error Handling

```javascript
// Backend
router.get('/:id', async (req, res) => {
  try {
    const data = await getItem(req.params.id)
    if (!data) {
      return res.status(404).json({ error: 'Not found' })
    }
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Frontend
try {
  const response = await fetch('/api/items/123')
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const data = await response.json()
} catch (error) {
  console.error('Fetch error:', error)
  setError(error.message)
}
```

### Pagination

```javascript
// Backend
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 10
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, count, error } = await supabase
    .from('items')
    .select('*', { count: 'exact' })
    .range(from, to)
  
  res.json({
    data,
    pagination: { page, limit, total: count }
  })
})
```

---

## Next Steps

1. Create database tables in Supabase
2. Write backend routes for your features
3. Build React components to display data
4. Test everything with manual requests
5. Commit your changes with clear messages
6. Deploy when ready

Happy coding! 🚀
