import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { usePage, type Page } from '../hooks/usePage'
import { useUndo } from '../hooks/useUndo'
import { Overview } from './Overview'
import { RecipesPage } from './recipes/RecipesPage'
import { UndoBar } from './UndoBar'

const tabs: { page: Page; label: string }[] = [
  { page: 'overview', label: 'Översikt' },
  { page: 'recipes', label: 'Recept' },
]

export function AppShell({ session }: { session: Session }) {
  const { page, recipeId, goTo } = usePage()
  const { toast, showUndo, dismiss } = useUndo()

  return (
    <div className="min-h-screen bg-stone-100">
      <header className="flex items-center gap-8 bg-white px-6 py-3 shadow-sm">
        <h1 className="text-xl font-semibold text-stone-800">Matappen</h1>
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.page}
              onClick={() => goTo(tab.page)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                page === tab.page ? 'bg-emerald-50 font-medium text-emerald-800' : 'text-stone-500 hover:bg-stone-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-4 text-sm text-stone-500">
          <span>{session.user.email}</span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="rounded-md border border-stone-300 px-3 py-1 hover:bg-stone-100"
          >
            Logga ut
          </button>
        </div>
      </header>

      {page === 'overview' ? (
        <Overview showUndo={showUndo} openRecipe={(id) => goTo('recipes', id)} />
      ) : (
        <RecipesPage showUndo={showUndo} recipeId={recipeId} onSelect={(id) => goTo('recipes', id)} />
      )}

      <UndoBar toast={toast} onDismiss={dismiss} />
    </div>
  )
}
