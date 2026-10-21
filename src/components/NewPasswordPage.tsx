import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

// Shown after opening the link in a password reset email
export function NewPasswordPage({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== repeat) {
      setError('Lösenorden är inte likadana.')
      return
    }
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(
        error.code === 'weak_password'
          ? 'Lösenordet är för svagt. Använd minst 6 tecken.'
          : error.code === 'same_password'
            ? 'Välj ett annat lösenord än det gamla.'
            : 'Kunde inte spara lösenordet. Länken kan ha gått ut – be om ett nytt mejl.',
      )
      return
    }
    onDone()
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-surface p-8 shadow-sm">
        <h1 className="font-display text-3xl font-semibold text-ink">Nytt lösenord</h1>
        <p className="text-muted">Välj ett nytt lösenord för Matappen.</p>

        <PasswordField label="Nytt lösenord" value={password} onChange={setPassword} autoFocus />
        <PasswordField label="Upprepa lösenordet" value={repeat} onChange={setRepeat} />

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-accent py-2 font-medium text-on-accent hover:bg-accent-strong disabled:opacity-50"
        >
          {loading ? 'Sparar…' : 'Spara lösenord'}
        </button>
      </form>
    </main>
  )
}

function PasswordField(props: { label: string; value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm text-muted">{props.label}</span>
      <input
        type="password"
        required
        minLength={6}
        autoComplete="new-password"
        autoFocus={props.autoFocus}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-line px-3 py-2 focus:border-accent focus:outline-none"
      />
    </label>
  )
}
