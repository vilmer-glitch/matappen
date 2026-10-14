import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

const columns = ['Lager', 'Veckans rätter', 'Inköpslista']

export function Overview({ session }: { session: Session }) {
  return (
    <div className="min-h-screen bg-stone-100">
      <header className="flex items-center justify-between bg-white px-6 py-3 shadow-sm">
        <h1 className="text-xl font-semibold text-stone-800">Matappen</h1>
        <div className="flex items-center gap-4 text-sm text-stone-500">
          <span>{session.user.email}</span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="rounded-md border border-stone-300 px-3 py-1 hover:bg-stone-100"
          >
            Logga ut
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">
        {columns.map((title) => (
          <section key={title} className="min-h-96 rounded-xl bg-white p-4 shadow">
            <h2 className="mb-2 text-lg font-semibold text-stone-800">{title}</h2>
            <p className="text-sm text-stone-400">Kommer snart.</p>
          </section>
        ))}
      </main>
    </div>
  )
}
