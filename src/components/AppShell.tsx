import type { Session } from '@supabase/supabase-js'
import { BookOpen, ChefHat, LayoutGrid, LogOut, Package, ShoppingBasket, Tags, type LucideIcon } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { OVERVIEW_PAGES, usePage, type Page } from '../hooks/usePage'
import { useUndo } from '../hooks/useUndo'
import { Overview } from './Overview'
import { ItemsPage } from './items/ItemsPage'
import { RecipesPage } from './recipes/RecipesPage'
import { UndoBar } from './UndoBar'

type Tab = { page: Page; label: string; icon: LucideIcon }

// Computer: the overview is one page with three columns
const desktopTabs: Tab[] = [
  { page: 'pantry', label: 'Översikt', icon: LayoutGrid },
  { page: 'recipes', label: 'Recept', icon: BookOpen },
  { page: 'items', label: 'Varor', icon: Tags },
]

// Phone: each overview column gets its own tab
const mobileTabs: Tab[] = [
  { page: 'pantry', label: 'Lager', icon: Package },
  { page: 'week', label: 'Laga', icon: ChefHat },
  { page: 'list', label: 'Lista', icon: ShoppingBasket },
  { page: 'recipes', label: 'Recept', icon: BookOpen },
  { page: 'items', label: 'Varor', icon: Tags },
]

export function AppShell({ session }: { session: Session }) {
  const { page, id, goTo } = usePage()
  const { toast, showUndo, dismiss } = useUndo()
  const onOverview = OVERVIEW_PAGES.includes(page)

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <header className="sticky top-0 z-20 flex items-center gap-6 border-b border-line bg-surface/90 px-4 py-3 backdrop-blur lg:px-6">
        <button onClick={() => goTo('pantry')} className="flex items-center gap-2">
          <img src="/icon.svg" alt="" className="h-8 w-8 rounded-lg" />
          <span className="font-display text-xl font-semibold text-ink">Matappen</span>
        </button>

        <nav className="hidden gap-1 lg:flex">
          {desktopTabs.map((tab) => {
            const active = tab.page === 'pantry' ? onOverview : page === tab.page
            return (
              <button
                key={tab.page}
                onClick={() => goTo(tab.page)}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${
                  active ? 'bg-accent-soft text-accent-strong' : 'text-muted hover:bg-surface-2 hover:text-ink'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3 text-sm text-muted">
          <span className="hidden sm:inline">{session.user.email}</span>
          <button
            onClick={() => supabase.auth.signOut()}
            title="Logga ut"
            className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 hover:bg-surface-2 hover:text-ink"
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">Logga ut</span>
          </button>
        </div>
      </header>

      {onOverview && (
        <Overview
          section={page}
          showUndo={showUndo}
          openRecipe={(recipeId) => goTo('recipes', recipeId)}
          openItem={(itemId) => goTo('items', itemId)}
        />
      )}
      {page === 'recipes' && (
        <RecipesPage showUndo={showUndo} recipeId={id} onSelect={(recipeId) => goTo('recipes', recipeId)} />
      )}
      {page === 'items' && (
        <ItemsPage
          showUndo={showUndo}
          itemId={id}
          onSelect={(itemId) => goTo('items', itemId)}
          openRecipe={(recipeId) => goTo('recipes', recipeId)}
        />
      )}

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {mobileTabs.map((tab) => {
          const active = page === tab.page
          return (
            <button
              key={tab.page}
              onClick={() => goTo(tab.page)}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${
                active ? 'text-accent-strong' : 'text-muted'
              }`}
            >
              <span className={`rounded-full px-4 py-1 ${active ? 'bg-accent-soft' : ''}`}>
                <tab.icon size={20} />
              </span>
              {tab.label}
            </button>
          )
        })}
      </nav>

      <UndoBar toast={toast} onDismiss={dismiss} />
    </div>
  )
}
