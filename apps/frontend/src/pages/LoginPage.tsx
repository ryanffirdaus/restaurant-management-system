import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const err = await login(email, password);
    setSubmitting(false);
    if (err) setError(err);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm card-bg rounded-2xl border border-outline shadow-sm p-6">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-on-primary font-bold text-xl">S</span>
          </div>
          <h1 className="text-xl font-bold text-text-main tracking-tight">
            Servio
          </h1>
          <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1">
            Admin Terminal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wide block mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline text-sm text-text-main bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              placeholder="admin@omni.com"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wide block mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-outline text-sm text-text-main bg-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs text-danger font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-primary text-on-primary min-h-[44px] hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-primary/10"
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
