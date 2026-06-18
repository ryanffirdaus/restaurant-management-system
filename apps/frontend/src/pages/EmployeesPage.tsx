import { useState, useEffect, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { Column } from '../components/Table'
import Table from '../components/Table'
import Badge from '../components/Badge'
import Card from '../components/Card'
import Icon from '../components/Icon'
import SearchInput from '../components/SearchInput'
import type { LayoutContext } from '../App'

interface Employee {
  id: string
  user_id: string
  role: string
  salary: number | null
  hire_date: string
  active: boolean
  profile?: { name: string; phone: string | null } | null
}

interface FormData {
  email: string
  password: string
  name: string
  role: string
  salary: string
}

const emptyForm: FormData = { email: '', password: '', name: '', role: 'waiter', salary: '' }
const roles = ['admin', 'manager', 'chef', 'cashier', 'waiter']

type SortKey = 'name' | 'role' | 'salary' | 'hire_date' | 'active'

const roleVariant: Record<string, 'primary' | 'warning' | 'danger' | 'info'> = {
  admin: 'danger',
  manager: 'warning',
  chef: 'info',
  cashier: 'primary',
  waiter: 'primary',
}

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-outline text-sm text-text-main bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary'
const selectClass = 'px-3 py-2 rounded-xl border border-outline text-sm text-text-main bg-surface focus:outline-none focus:border-primary'

function EmployeesPage() {
  const { sidebarOpen } = useOutletContext<LayoutContext>()
  const { employeeRole } = useAuth()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key as SortKey)
      setSortDir('asc')
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let list = employees.filter((e) => {
      if (statusFilter === 'active' && !e.active) return false
      if (statusFilter === 'inactive' && e.active) return false
      if (roleFilter !== 'all' && e.role !== roleFilter) return false
      if (q) {
        const name = (e.profile?.name ?? '').toLowerCase()
        const role = e.role.toLowerCase()
        if (!name.includes(q) && !role.includes(q)) return false
      }
      return true
    })

    list.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name':
          cmp = (a.profile?.name ?? '').localeCompare(b.profile?.name ?? '')
          break
        case 'role':
          cmp = a.role.localeCompare(b.role)
          break
        case 'salary':
          cmp = (a.salary ?? 0) - (b.salary ?? 0)
          break
        case 'hire_date':
          cmp = a.hire_date.localeCompare(b.hire_date)
          break
        case 'active':
          cmp = Number(a.active) - Number(b.active)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return list
  }, [employees, search, roleFilter, statusFilter, sortKey, sortDir])

  async function fetchEmployees() {
    const token = (await supabase.auth.getSession()).data.session?.access_token
    const res = await fetch(`${import.meta.env.VITE_API_URL}/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setEmployees(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchEmployees() }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    const token = (await supabase.auth.getSession()).data.session?.access_token
    const res = await fetch(`${import.meta.env.VITE_API_URL}/employees/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        name: form.name,
        role: form.role,
        salary: form.salary ? Number(form.salary) : null,
      }),
    })

    setSubmitting(false)
    if (!res.ok) {
      const err = await res.json()
      setError(err.error)
      return
    }

    setModal(false)
    setForm(emptyForm)
    fetchEmployees()
  }

  async function toggleActive(emp: Employee) {
    const token = (await supabase.auth.getSession()).data.session?.access_token
    await fetch(`${import.meta.env.VITE_API_URL}/employees/${emp.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: !emp.active }),
    })
    fetchEmployees()
  }

  async function handleDelete(emp: Employee) {
    if (!confirm(`Nonaktifkan ${emp.profile?.name ?? emp.user_id}?`)) return
    const token = (await supabase.auth.getSession()).data.session?.access_token
    await fetch(`${import.meta.env.VITE_API_URL}/employees/${emp.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    fetchEmployees()
  }

  const columns: Column<Employee>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (emp) => emp.profile?.name ?? <span className="text-text-muted">—</span>,
      className: 'font-medium whitespace-nowrap text-text-main',
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (emp) => (
        <Badge variant={roleVariant[emp.role] ?? 'primary'}>{emp.role}</Badge>
      ),
    },
    {
      key: 'salary',
      label: 'Salary',
      sortable: true,
      className: 'tabular-nums whitespace-nowrap text-text-main',
      render: (emp) => emp.salary
        ? `Rp ${Number(emp.salary).toLocaleString()}`
        : <span className="text-text-muted">—</span>,
    },
    {
      key: 'active',
      label: 'Status',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (emp) => (
        <button
          onClick={() => toggleActive(emp)}
          className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight border ${
            emp.active
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'bg-surface-variant text-text-muted border-transparent'
          }`}
        >
          {emp.active ? 'Active' : 'Inactive'}
        </button>
      ),
    },
    {
      key: 'hire_date',
      label: 'Hire Date',
      sortable: true,
      className: 'text-text-muted whitespace-nowrap',
      render: (emp) => new Date(emp.hire_date).toLocaleDateString(),
    },
    {
      key: 'actions' as never,
      label: '',
      className: 'whitespace-nowrap',
      render: (emp) => (
        <button onClick={() => handleDelete(emp)} className="text-[11px] font-medium text-danger hover:underline">
          Remove
        </button>
      ),
    },
  ]

  if (employeeRole !== 'admin') {
    return (
      <div className="h-16" />
    )
  }

  return (
    <div>
      <div className="h-16" />
      <div className="p-container-margin space-y-gutter">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-main tracking-tight">Employees</h1>
            <p className="text-sm text-text-muted mt-1">Manage restaurant staff accounts</p>
          </div>
          <button
            onClick={() => setModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-on-primary min-h-[44px] hover:opacity-90 transition-all shadow-lg shadow-primary/10"
          >
            <Icon name="add" />
            Add Employee
          </button>
        </header>

        <div className="flex items-center gap-3 flex-wrap">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name or role..."
            className="flex-1 min-w-[200px] max-w-xs"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={selectClass}
          >
            <option value="all">All Roles</option>
            {roles.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className={selectClass}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <span className="text-xs text-text-muted">{filtered.length} of {employees.length}</span>
        </div>

        <Card padding={false}>
          <Table
            columns={columns}
            data={filtered}
            loading={loading}
            emptyText="No employees match your filters."
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
          />
        </Card>
      </div>

      {modal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
          <div className="fixed inset-0 bg-black/40" onClick={() => { setModal(false); setError(null) }} />
          <div className="relative card-bg rounded-2xl border border-outline shadow-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-bold text-text-main mb-4">Add Employee</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wide block mb-1.5">Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wide block mb-1.5">Email</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wide block mb-1.5">Password</label>
                <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wide block mb-1.5">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClass}>
                  {roles.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wide block mb-1.5">Salary (monthly)</label>
                <input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} placeholder="Optional" className={inputClass} />
              </div>

              {error && <p className="text-xs text-danger font-medium">{error}</p>}

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => { setModal(false); setError(null) }}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:bg-surface-variant transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-on-primary min-h-[44px] hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/10">
                  {submitting ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default EmployeesPage
