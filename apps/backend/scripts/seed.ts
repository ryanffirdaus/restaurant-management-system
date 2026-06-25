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
  { email: 'admin@omni.com', password: 'admin123', name: 'Admin', role: 'admin' as const },
  { email: 'manager@omni.com', password: 'manager123', name: 'Manager', role: 'manager' as const },
  { email: 'chef@omni.com', password: 'chef123', name: 'Head Chef', role: 'chef' as const },
  { email: 'cashier@omni.com', password: 'cashier123', name: 'Cashier', role: 'cashier' as const },
  { email: 'waiter@omni.com', password: 'waiter123', name: 'Waiter', role: 'waiter' as const },
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
  { name: 'Maria Garcia', role: 'chef' as const, salary: 3500, hire_date: '2024-01-15' },
  { name: 'John Smith', role: 'waiter' as const, salary: 1800, hire_date: '2024-02-20' },
  { name: 'Sarah Johnson', role: 'waiter' as const, salary: 1800, hire_date: '2024-03-10' },
  { name: 'Michael Brown', role: 'cashier' as const, salary: 2000, hire_date: '2024-01-05' },
  { name: 'Emma Wilson', role: 'manager' as const, salary: 2800, hire_date: '2023-12-01' },
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

  // Seed additional data if we have an admin
  if (adminUserId) {
    await seedMenuItems(adminUserId)
    await seedAdditionalEmployees(adminUserId, userIds)
  }

  console.log('\n✅ Database seeding completed!')
}

seed().catch(console.error)
