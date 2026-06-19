import { useState, type FormEvent } from "react"
import { Button, TextInput, ValidationMessage } from "../../../components/ui"

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<string | null>
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const err = await onLogin(email, password)
    setSubmitting(false)
    if (err) setError(err)
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm card-bg rounded-2xl border border-outline shadow-sm p-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-on-primary font-bold text-xl">S</span>
          </div>
          <h1 className="text-xl font-bold text-text-main tracking-tight">Servio</h1>
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">
            Admin Terminal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextInput
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@omni.com"
          />

          <TextInput
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {error && <ValidationMessage state="error" message={error} />}

          <Button type="submit" variant="primary" disabled={submitting} className="w-full justify-center">
            {submitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  )
}
