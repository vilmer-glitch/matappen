import type { ReactNode } from 'react'
import { Pantry } from './pantry/Pantry'

type Props = {
  showUndo: (message: string, undo: () => void) => void
}

export function Overview({ showUndo }: Props) {
  return (
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
  )
}

function Column({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-h-96 rounded-xl bg-white p-4 shadow">
      <h2 className="mb-3 text-lg font-semibold text-stone-800">{title}</h2>
      {children}
    </section>
  )
}
