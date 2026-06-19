import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import type { Employee, FormData, SortKey } from '../types'
import { emptyForm } from '../constants'

export function useEmployees() {
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

  const toggleSort = useCallback((key: string) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortDir('asc')
      return key as SortKey
    })
  }, [])

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

  const fetchEmployees = useCallback(async () => {
    const token = (await supabase.auth.getSession()).data.session?.access_token
    const res = await fetch(`${import.meta.env.VITE_API_URL}/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setEmployees(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
  }, [form, fetchEmployees])

  const toggleActive = useCallback(async (emp: Employee) => {
    const token = (await supabase.auth.getSession()).data.session?.access_token
    await fetch(`${import.meta.env.VITE_API_URL}/employees/${emp.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: !emp.active }),
    })
    fetchEmployees()
  }, [fetchEmployees])

  const handleDelete = useCallback(async (emp: Employee) => {
    if (!confirm(`Nonaktifkan ${emp.profile?.name ?? emp.user_id}?`)) return
    const token = (await supabase.auth.getSession()).data.session?.access_token
    await fetch(`${import.meta.env.VITE_API_URL}/employees/${emp.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    fetchEmployees()
  }, [fetchEmployees])

  const openModal = useCallback(() => setModal(true), [])
  const closeModal = useCallback(() => { setModal(false); setError(null) }, [])

  return {
    employees,
    loading,
    modal,
    form,
    submitting,
    error,
    search,
    roleFilter,
    statusFilter,
    sortKey,
    sortDir,
    filtered,
    setForm,
    setSearch,
    setRoleFilter,
    setStatusFilter,
    toggleSort,
    handleSubmit,
    toggleActive,
    handleDelete,
    openModal,
    closeModal,
  }
}
