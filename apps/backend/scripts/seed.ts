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
  { email: 'admin@omni.com', password: 'admin123', name: 'Admin Utama', role: 'admin' as const },
  { email: 'manager@omni.com', password: 'manager123', name: 'Manager Resto', role: 'manager' as const },
  { email: 'chef@omni.com', password: 'chef123', name: 'Kepala Dapur', role: 'chef' as const },
  { email: 'cashier@omni.com', password: 'cashier123', name: 'Kasir', role: 'cashier' as const },
  { email: 'waiter@omni.com', password: 'waiter123', name: 'Pelayan', role: 'waiter' as const },
]

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
    console.error('ERROR: Isi SUPABASE_SERVICE_ROLE_KEY di .env dulu!')
    process.exit(1)
  }

  for (const acct of accounts) {
    await ensureUser(acct)
  }
}

seed().catch(console.error)
