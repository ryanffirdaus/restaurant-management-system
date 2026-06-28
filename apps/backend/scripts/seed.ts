import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import ws from 'ws'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  realtime: { transport: ws as never },
})

const accounts = [
  { email: 'admin@omni.com', password: 'admin123', name: 'Admin', salary: 5000, role: 'admin' as const },
  { email: 'chef@omni.com', password: 'chef123', name: 'Head Chef', salary: 4000, role: 'kitchen' as const },
  { email: 'cashier@omni.com', password: 'cashier123', name: 'Cashier', salary: 3000, role: 'cashier' as const },
  { email: 'waiter@omni.com', password: 'waiter123', name: 'Waiter', salary: 2500, role: 'waiter' as const },
]

const menuItems = [
  // Appetizers
  {
    name: 'Calamari Fritti',
    description: 'Crispy fried calamari served with marinara sauce',
    price: 12.99,
    category: 'Appetizers',
    available: true,
  },
  {
    name: 'Bruschetta al Pomodoro',
    description: 'Toasted bread with fresh tomatoes, garlic, and basil',
    price: 8.99,
    category: 'Appetizers',
    available: true,
  },
  {
    name: 'Mozzarella Sticks',
    description: 'Breaded and fried mozzarella with marinara sauce',
    price: 9.99,
    category: 'Appetizers',
    available: true,
  },

  // Main Courses
  {
    name: 'Spaghetti Carbonara',
    description: 'Classic Italian pasta with guanciale, egg, and Pecorino',
    price: 18.99,
    category: 'Main Courses',
    available: true,
  },
  {
    name: 'Risotto ai Funghi',
    description: 'Creamy risotto with mixed mushrooms and truffle oil',
    price: 20.99,
    category: 'Main Courses',
    available: true,
  },
  {
    name: 'Osso Buco alla Milanese',
    description: 'Braised veal shank served with saffron risotto',
    price: 28.99,
    category: 'Main Courses',
    available: true,
  },
  {
    name: 'Grilled Salmon',
    description: 'Atlantic salmon fillet with lemon butter and seasonal vegetables',
    price: 24.99,
    category: 'Main Courses',
    available: true,
  },

  // Pizza
  {
    name: 'Margherita',
    description: 'Tomato, mozzarella, basil, and olive oil',
    price: 14.99,
    category: 'Pizza',
    available: true,
  },
  {
    name: 'Quattro Formaggi',
    description: 'Four cheese pizza with mozzarella, gorgonzola, fontina, and parmesan',
    price: 16.99,
    category: 'Pizza',
    available: true,
  },
  {
    name: 'Pepperoni',
    description: 'Classic pizza with tomato, mozzarella, and pepperoni',
    price: 15.99,
    category: 'Pizza',
    available: true,
  },

  // Desserts
  {
    name: 'Tiramisu',
    description: 'Traditional Italian dessert with mascarpone and espresso',
    price: 9.99,
    category: 'Desserts',
    available: true,
  },
  {
    name: 'Panna Cotta',
    description: 'Creamy vanilla panna cotta with berry compote',
    price: 8.99,
    category: 'Desserts',
    available: true,
  },
  {
    name: 'Gelato Assortito',
    description: 'Three scoops of assorted Italian gelato flavors',
    price: 7.99,
    category: 'Desserts',
    available: true,
  },

  // Beverages
  {
    name: 'Espresso',
    description: 'Strong Italian espresso',
    price: 3.99,
    category: 'Beverages',
    available: true,
  },
  {
    name: 'Cappuccino',
    description: 'Espresso with steamed milk and foam',
    price: 4.99,
    category: 'Beverages',
    available: true,
  },
  {
    name: 'Iced Tea',
    description: 'Refreshing iced tea with lemon',
    price: 3.49,
    category: 'Beverages',
    available: true,
  },
]

const additionalEmployees = [
  { name: 'Maria Garcia', role: 'kitchen' as const, salary: 3500, hire_date: '2024-01-15' },
  { name: 'John Smith', role: 'waiter' as const, salary: 1800, hire_date: '2024-02-20' },
  { name: 'Sarah Johnson', role: 'waiter' as const, salary: 1800, hire_date: '2024-03-10' },
  { name: 'Michael Brown', role: 'cashier' as const, salary: 2000, hire_date: '2024-01-05' },
]

async function seedMenuItems(adminUserId: string) {
  console.log('\n📋 Seeding menu items...')

  for (const item of menuItems) {
    const { data: existing } = await supabase
      .from('menu_items')
      .select('id')
      .eq('name', item.name)
      .single()

    if (!existing) {
      const { error } = await supabase.from('menu_items').insert({
        ...item,
        created_by: adminUserId,
        updated_by: adminUserId,
      })

      if (error) {
        console.error(`  ✗  ${item.name} — ${error.message}`)
      } else {
        console.log(`  ✓  ${item.name} — created`)
      }
    } else {
      console.log(`  ⏭  ${item.name} — already exists`)
    }
  }
}

async function seedAdditionalEmployees(adminUserId: string, existingUserIds: string[]) {
  console.log('\n👥 Seeding additional employees...')

  for (const emp of additionalEmployees) {
    const { data: existing } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', existingUserIds[0])
      .single()

    // For additional employees without user accounts, we would need to create auth users first
    // For now, we'll create employee records
    const { error } = await supabase.from('employees').insert({
      user_id: existingUserIds[Math.floor(Math.random() * existingUserIds.length)],
      role: emp.role,
      salary: emp.salary,
      hire_date: emp.hire_date,
      active: true,
      created_by: adminUserId,
      updated_by: adminUserId,
    })

    if (error && !error.message.includes('duplicate')) {
      console.error(`  ✗  ${emp.name} — ${error.message}`)
    } else if (!error) {
      console.log(`  ✓  ${emp.name} — created`)
    } else {
      console.log(`  ⏭  ${emp.name} — already exists`)
    }
  }
}

async function ensureUser(acct: typeof accounts[number]) {
  // Check if user already exists
  const { data: existing } = await supabase.auth.admin.listUsers()
  const user = existing.users.find((u) => u.email === acct.email)

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: acct.email,
      password: acct.password,
      email_confirm: true,
      user_metadata: { name: acct.name, role: acct.role },
    })
    if (error || !data.user) {
      console.error(`  ✗  ${acct.email} — ${error?.message ?? 'no user returned'}`)
      return
    }
    console.log(`  ✓  ${acct.email} — user created`)
    await createProfileAndEmployee(data.user.id, acct)
  } else {
    console.log(`  ⏭  ${acct.email} — already exists`)
    await createProfileAndEmployee(user.id, acct)
  }
}

async function createProfileAndEmployee(userId: string, acct: typeof accounts[number]) {
  // Create/update profile
  const { error: profError } = await supabase
    .from('profiles')
    .upsert({ id: userId, name: acct.name }, { onConflict: 'id' })
  if (profError) {
    console.error(`  ✗  ${acct.email} — profile failed: ${profError.message}`)
  } else {
    console.log(`  ✓  ${acct.email} — profile: ${acct.name}`)
  }

  // Create/update employee + sync role
  const { error: empError } = await supabase
    .from('employees')
    .upsert(
      { user_id: userId, role: acct.role, active: true },
      { onConflict: 'user_id' }
    )

  if (empError && empError.message.includes('permission denied')) {
    // Fallback: update auth.users metadata directly if trigger can't
    console.log(`  ⚠  ${acct.email} — trigger sync failed, updating metadata directly...`)
    const { error: metaError } = await supabase.auth.admin.updateUserById(
      userId,
      { user_metadata: { name: acct.name, role: acct.role } }
    )
    if (metaError) {
      console.error(`  ✗  ${acct.email} — metadata update failed: ${metaError.message}`)
    } else {
      console.log(`  ✓  ${acct.email} — employee role: ${acct.role} (metadata updated)`)
    }
  } else if (empError) {
    console.error(`  ✗  ${acct.email} — employee failed: ${empError.message}`)
  } else {
    console.log(`  ✓  ${acct.email} — employee role: ${acct.role}`)
  }
}

const tables = [
  { table_number: 1, capacity: 2, status: 'available', notes: 'Window seat' },
  { table_number: 2, capacity: 4, status: 'occupied', notes: null },
  { table_number: 3, capacity: 4, status: 'available', notes: null },
  { table_number: 4, capacity: 6, status: 'reserved', notes: 'Birthday party 19:30' },
  { table_number: 5, capacity: 2, status: 'occupied', notes: 'Near entrance' },
  { table_number: 6, capacity: 4, status: 'available', notes: null },
  { table_number: 7, capacity: 4, status: 'available', notes: null },
  { table_number: 8, capacity: 8, status: 'occupied', notes: 'Private dining area' },
  { table_number: 9, capacity: 2, status: 'cleaning', notes: null },
  { table_number: 10, capacity: 4, status: 'available', notes: null },
  { table_number: 11, capacity: 4, status: 'occupied', notes: null },
  { table_number: 12, capacity: 6, status: 'available', notes: 'Patio' },
  { table_number: 13, capacity: 2, status: 'reserved', notes: 'Anniversary dinner 20:00' },
  { table_number: 14, capacity: 4, status: 'occupied', notes: null },
  { table_number: 15, capacity: 4, status: 'available', notes: null },
  { table_number: 16, capacity: 6, status: 'available', notes: 'Bar adjacent' },
  { table_number: 17, capacity: 2, status: 'occupied', notes: null },
  { table_number: 18, capacity: 4, status: 'available', notes: null },
  { table_number: 19, capacity: 4, status: 'cleaning', notes: null },
  { table_number: 20, capacity: 10, status: 'available', notes: 'Event room' },
]

async function seedTables(adminUserId: string) {
  console.log('\n🪑 Seeding tables...')
  for (const t of tables) {
    const { data: existing } = await supabase
      .from('restaurant_tables')
      .select('id')
      .eq('table_number', t.table_number)
      .is('deleted_at', null)
      .single()

    if (!existing) {
      const { error } = await supabase.from('restaurant_tables').insert({
        ...t,
        created_by: adminUserId,
        updated_by: adminUserId,
      })
      if (error) {
        console.error(`  ✗  Table ${t.table_number} — ${error.message}`)
      } else {
        console.log(`  ✓  Table ${t.table_number} — created (${t.status}, ${t.capacity} seats)`)
      }
    } else {
      console.log(`  ⏭  Table ${t.table_number} — already exists`)
    }
  }
}

async function seedOrders(adminUserId: string) {
  console.log('\n🧾 Seeding orders...')

  // Fetch created tables and menu items
  const { data: tableRows } = await supabase
    .from('restaurant_tables')
    .select('id, table_number')
    .is('deleted_at', null)
    .order('table_number')

  const { data: menuRows } = await supabase
    .from('menu_items')
    .select('id, name, price')
    .eq('available', true)
    .is('deleted_at', null)

  if (!tableRows || tableRows.length === 0 || !menuRows || menuRows.length === 0) {
    console.log('  ⚠  No tables or menu items found — skipping orders')
    return
  }

  // Check if orders already exist
  const { data: existingOrders } = await supabase
    .from('orders')
    .select('id')
    .is('deleted_at', null)
    .limit(1)

  if (existingOrders && existingOrders.length > 0) {
    console.log('  ⏭  Orders already exist — skipping')
    return
  }

  function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
  function pickN<T>(arr: T[], n: number): T[] {
    const shuffled = [...arr].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, n)
  }

  const orderTemplates = [
    { status: 'completed', customerName: 'Dine-in', hoursAgo: 3 },
    { status: 'completed', customerName: 'Dine-in', hoursAgo: 2.5 },
    { status: 'completed', customerName: 'Takeaway', hoursAgo: 2 },
    { status: 'completed', customerName: 'Dine-in', hoursAgo: 1.5 },
    { status: 'completed', customerName: 'Dine-in', hoursAgo: 1 },
    { status: 'preparing', customerName: 'Dine-in', hoursAgo: 0.3 },
    { status: 'preparing', customerName: 'Dine-in', hoursAgo: 0.2 },
    { status: 'pending', customerName: 'Dine-in', hoursAgo: 0.05 },
    { status: 'pending', customerName: 'Takeaway', hoursAgo: 0.03 },
    { status: 'ready', customerName: 'Dine-in', hoursAgo: 0.1 },
    { status: 'cancelled', customerName: 'Dine-in', hoursAgo: 1.8 },
    { status: 'completed', customerName: 'Dine-in', hoursAgo: 4 },
  ]

  for (const tmpl of orderTemplates) {
    const tableRow = tmpl.customerName === 'Takeaway' ? null : pick(tableRows)
    const selectedItems = pickN(menuRows, Math.floor(Math.random() * 3) + 1)
    const quantities = selectedItems.map(() => Math.floor(Math.random() * 2) + 1)
    const totalPrice = selectedItems.reduce((sum, item, i) => sum + item.price * quantities[i], 0)
    const createdAt = new Date(Date.now() - tmpl.hoursAgo * 3600 * 1000).toISOString()

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: adminUserId,
        customer_name: tmpl.customerName,
        status: tmpl.status,
        total_price: parseFloat(totalPrice.toFixed(2)),
        table_id: tableRow?.id ?? null,
        created_by: adminUserId,
        updated_by: adminUserId,
        created_at: createdAt,
        updated_at: createdAt,
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error(`  ✗  Order — ${orderError?.message}`)
      continue
    }

    const orderItems = selectedItems.map((item, i) => ({
      order_id: order.id,
      menu_item_id: item.id,
      quantity: quantities[i],
      price_at_purchase: item.price,
      created_by: adminUserId,
      updated_by: adminUserId,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
    if (itemsError) {
      console.error(`  ✗  Order items — ${itemsError.message}`)
    } else {
      const itemNames = selectedItems.map((it, i) => `${quantities[i]}x ${it.name}`).join(', ')
      const table = tableRow ? `Table ${tableRow.table_number}` : 'Takeaway'
      console.log(`  ✓  [${tmpl.status}] ${table} — ${itemNames} ($${totalPrice.toFixed(2)})`)
    }
  }
}

async function seed() {
  if (!supabaseServiceKey || supabaseServiceKey === 'your_service_role_key_here') {
    console.error('ERROR: Set SUPABASE_SERVICE_ROLE_KEY in .env first!')
    process.exit(1)
  }

  console.log('🚀 Starting database seeding...\n')
  console.log('👤 Seeding users and employees...')

  let adminUserId = ''
  const userIds: string[] = []

  // Get existing admin user for auditing
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const adminUser = existingUsers.users.find((u) => u.user_metadata?.role === 'admin')
  if (adminUser) {
    adminUserId = adminUser.id
  }

  for (const acct of accounts) {
    const { data: existing } = await supabase.auth.admin.listUsers()
    const user = existing.users.find((u) => u.email === acct.email)
    if (user && adminUserId === '') {
      adminUserId = user.id
    }
    if (user) {
      userIds.push(user.id)
    }
    await ensureUser(acct)
  }

  // Resolve admin user ID after ensureUser calls
  if (!adminUserId) {
    const { data: refreshed } = await supabase.auth.admin.listUsers()
    const found = refreshed.users.find((u) => u.email === accounts[0].email)
    if (found) adminUserId = found.id
  }

  if (adminUserId) {
    await seedMenuItems(adminUserId)
    await seedAdditionalEmployees(adminUserId, userIds)
    await seedTables(adminUserId)
    await seedOrders(adminUserId)
  }

  console.log('\n✅ Database seeding completed!')
}

seed().catch(console.error)
