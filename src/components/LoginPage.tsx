import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

const errorMessages: Record<string, string> = {
  invalid_credentials: 'Fel e-post eller lösenord.',
  email_not_confirmed: 'Bekräfta din e-post först. Kolla inkorgen.',
  user_already_exists: 'Det finns redan ett konto med den e-posten.',
  weak_password: 'Lösenordet är för svagt. Använd minst 6 tecken.',
  over_request_rate_limit: 'För många försök. Vänta en stund och prova igen.',
}

export function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

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
    <main className="flex min-h-screen items-center justify-center bg-stone-100 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl bg-white p-8 shadow">
        <h1 className="text-2xl font-semibold text-stone-800">Matappen</h1>
        <p className="text-stone-500">{mode === 'login' ? 'Logga in' : 'Skapa konto'}</p>

        <label className="block">
          <span className="text-sm text-stone-600">E-post</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 focus:border-emerald-600 focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-sm text-stone-600">Lösenord</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 focus:border-emerald-600 focus:outline-none"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-emerald-700">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-emerald-600 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? 'Vänta…' : mode === 'login' ? 'Logga in' : 'Skapa konto'}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="w-full text-sm text-stone-500 hover:text-stone-800"
        >
          {mode === 'login' ? 'Inget konto? Skapa ett' : 'Har du redan ett konto? Logga in'}
        </button>
      </form>
    </main>
  )
}
