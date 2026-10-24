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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 gap-8">
      <div className="w-full max-w-sm rounded-3xl bg-surface border border-line p-6">
        <div className="mb-8 space-y-6">
          <div className="flex items-center justify-between">
            <img src="/logo-wordmark.svg" alt="Servio" className="h-8 w-auto" />
            <span className="text-xs text-ink-3 flex items-center gap-2">
              <span className="status-pulse text-ready" /> Restaurant management
            </span>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-text-main">Sign in</h1>
            <p className="text-sm text-text-muted">Masuk untuk mulai shift kamu.</p>
          </div>
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

          <Button type="submit" variant="primary" disabled={submitting} size="lg" className="w-full justify-center">
            {submitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
      <p className="text-xs text-ink-3">Servio · RMS</p>
    </div>
  )
}
