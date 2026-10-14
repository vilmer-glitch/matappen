import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useUndo } from '../hooks/useUndo'
import { Pantry } from './pantry/Pantry'
import { UndoBar } from './UndoBar'

export function Overview({ session }: { session: Session }) {
  const { toast, showUndo, dismiss } = useUndo()

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

      <main className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-3">
        <Column title="Lager">
          <Pantry showUndo={showUndo} />
        </Column>
        <Column title="Veckans rätter">
          <p className="text-sm text-stone-400">Kommer snart.</p>
        </Column>
        <Column title="Inköpslista">
          <p className="text-sm text-stone-400">Kommer snart.</p>
        </Column>
      </main>

      <UndoBar toast={toast} onDismiss={dismiss} />
    </div>
  )
}

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-h-96 rounded-xl bg-white p-4 shadow">
      <h2 className="mb-3 text-lg font-semibold text-stone-800">{title}</h2>
      {children}
    </section>
  )
}
