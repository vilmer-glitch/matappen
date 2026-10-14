import type { ReactNode } from 'react'
import { useItems } from '../hooks/useItems'
import { useRecipes } from '../hooks/useRecipes'
import { CanCook } from './CanCook'
import { Pantry } from './pantry/Pantry'

type Props = {
  showUndo: (message: string, undo: () => void) => void
  openRecipe: (id: string) => void
}

export function Overview({ showUndo, openRecipe }: Props) {
  // Shared by the pantry and "Vad kan jag laga?", so both update at once
  const store = useItems()
  const { recipes, loading } = useRecipes()

  return (
    <main className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-3">
      <Column title="Lager">
        <Pantry store={store} showUndo={showUndo} />
      </Column>
      <Column title="Vad kan jag laga?">
        <CanCook recipes={recipes} items={store.items} loading={loading || store.loading} openRecipe={openRecipe} />
        <h2 className="mb-3 mt-8 text-lg font-semibold text-stone-800">Veckans rätter</h2>
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
