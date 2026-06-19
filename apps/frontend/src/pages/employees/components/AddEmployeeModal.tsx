import { Button, TextInput, Select, ValidationMessage } from '../../../components/ui'
import type { FormData } from '../types'
import { roleOptions } from '../constants'

interface AddEmployeeModalProps {
  form: FormData
  submitting: boolean
  error: string | null
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  onChange: (form: FormData) => void
}

export default function AddEmployeeModal({
  form,
  submitting,
  error,
  onClose,
  onSubmit,
  onChange,
}: AddEmployeeModalProps) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative card-bg rounded-2xl border border-outline shadow-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-bold text-text-main mb-4">Add Employee</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <TextInput
            label="Name"
            required
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
          />
          <TextInput
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => onChange({ ...form, email: e.target.value })}
          />
          <TextInput
            label="Password"
            type="password"
            required
            value={form.password}
            onChange={(e) => onChange({ ...form, password: e.target.value })}
          />
          <Select
            label="Role"
            options={roleOptions}
            value={form.role}
            onChange={(v) => onChange({ ...form, role: v })}
          />
          <TextInput
            label="Salary (monthly)"
            type="number"
            value={form.salary}
            onChange={(e) => onChange({ ...form, salary: e.target.value })}
            placeholder="Optional"
          />

          {error && <ValidationMessage state="error" message={error} />}

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Employee'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
