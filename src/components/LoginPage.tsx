import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

const errorMessages: Record<string, string> = {
  invalid_credentials: 'Fel e-post eller lösenord.',
  email_not_confirmed: 'Bekräfta din e-post först. Kolla inkorgen.',
  user_already_exists: 'Det finns redan ett konto med den e-posten.',
  weak_password: 'Lösenordet är för svagt. Använd minst 6 tecken.',
  over_request_rate_limit: 'För många försök. Vänta en stund och prova igen.',
  over_email_send_rate_limit: 'För många mejl har skickats. Vänta en stund och prova igen.',
}

type Mode = 'login' | 'signup' | 'reset'

const titles: Record<Mode, string> = {
  login: 'Logga in',
  signup: 'Skapa konto',
  reset: 'Glömt lösenordet',
}

export function LoginPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
    setInfo('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    if (mode === 'reset') {
      // The link in the email leads back to this app, where you pick a new password
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
      setLoading(false)
      if (error) setError(errorMessages[error.code ?? ''] ?? 'Något gick fel. Försök igen.')
      else setInfo('Om det finns ett konto med den e-posten har vi skickat ett mejl med en länk. Kolla även skräpposten.')
      return
    }

    const { data, error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setLoading(false)
    if (error) {
      setError(errorMessages[error.code ?? ''] ?? 'Något gick fel. Försök igen.')
    } else if (mode === 'signup' && !data.session) {
      setInfo('Kontot är skapat. Klicka på länken i mejlet för att bekräfta.')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-surface p-8 shadow-sm">
        <h1 className="font-display text-3xl font-semibold text-ink">Matappen</h1>
        <p className="text-muted">{titles[mode]}</p>

        <label className="block">
          <span className="text-sm text-muted">E-post</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-line px-3 py-2 focus:border-accent focus:outline-none"
          />
        </label>

        {mode !== 'reset' && (
          <label className="block">
            <span className="flex justify-between text-sm text-muted">
              Lösenord
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="text-faint hover:text-ink"
                >
                  Glömt lösenordet?
                </button>
              )}
            </span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-line px-3 py-2 focus:border-accent focus:outline-none"
            />
          </label>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}
        {info && <p className="text-sm text-accent-strong">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-accent py-2 font-medium text-on-accent hover:bg-accent-strong disabled:opacity-50"
        >
          {loading ? 'Vänta…' : mode === 'reset' ? 'Skicka länk' : titles[mode]}
        </button>

        <button
          type="button"
          onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
          className="w-full text-sm text-muted hover:text-ink"
        >
          {mode === 'login' ? 'Inget konto? Skapa ett' : 'Tillbaka till inloggningen'}
        </button>
      </form>
    </main>
  )
}
