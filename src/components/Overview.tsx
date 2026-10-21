import type { ReactNode } from 'react'
import { CalendarDays, ChefHat, Package, ShoppingBasket, type LucideIcon } from 'lucide-react'
import type { Page } from '../hooks/usePage'
import { useItems } from '../hooks/useItems'
import { usePlannedMeals } from '../hooks/usePlannedMeals'
import { useRecipes } from '../hooks/useRecipes'
import { useShoppingList } from '../hooks/useShoppingList'
import { copyAppRecipe, withAppRecipes } from '../lib/appRecipes'
import { CanCook } from './CanCook'
import { Pantry } from './pantry/Pantry'
import { ShoppingList } from './ShoppingList'
import { WeeklyMeals } from './WeeklyMeals'

type Props = {
  section: Page
  showUndo: (message: string, undo: () => void) => void
  openRecipe: (id: string) => void
  openItem: (id: string) => void
}

export function Overview({ section, showUndo, openRecipe, openItem }: Props) {
  // Shared by all three columns, so a change in one shows up in the others at once
  const store = useItems()
  const { recipes: personal, loading, saveRecipe } = useRecipes()
  const planned = usePlannedMeals()
  const list = useShoppingList()

  // Your own recipes plus the app's, and the items including stand-ins for what you don't have yet
  const { recipes, items: allItems } = withAppRecipes(personal, store.items)
  const plannedIds = new Set(planned.meals.filter((m) => !m.cooked_at).map((m) => m.recipe_id))

  // Planning one of the app's recipes saves a copy among your own first
  async function plan(recipeId: string) {
    const recipe = recipes.find((r) => r.id === recipeId)
    if (!recipe) return
    const own = recipe.isApp ? await copyAppRecipe(recipe, allItems, store.addItem, (d) => saveRecipe(d)) : recipe
    if (!own) return
    const meal = await planned.addMeal(own.id, own.servings)
    const copied = recipe.isApp ? ' och sparades bland dina recept' : ''
    if (meal) showUndo(`${recipe.name} lades till${copied}`, () => planned.removeMeals([meal.id]))
  }

  return (
    <main className="mx-auto grid max-w-2xl grid-cols-1 gap-5 p-4 lg:max-w-[1500px] lg:grid-cols-3 lg:p-6">
      <Column title="Lager" icon={Package} visible={section === 'pantry'}>
        <Pantry store={store} showUndo={showUndo} openItem={openItem} />
      </Column>
      <div className={`space-y-5 ${section === 'week' ? '' : 'hidden lg:block'}`}>
        <Column title="Veckans rätter" icon={CalendarDays} visible>
          <WeeklyMeals recipes={recipes} store={store} planned={planned} showUndo={showUndo} openRecipe={openRecipe} onAdd={plan} />
        </Column>
        <Column title="Vad kan jag laga?" icon={ChefHat} visible>
          <CanCook
            recipes={recipes}
            items={allItems}
            loading={loading || store.loading}
            openRecipe={openRecipe}
            plannedIds={plannedIds}
            onPlan={plan}
          />
        </Column>
      </div>
      <Column title="Inköpslista" icon={ShoppingBasket} visible={section === 'list'}>
        <ShoppingList recipes={personal} store={store} planned={planned} list={list} showUndo={showUndo} />
      </Column>
    </main>
  )
}

// A card with a title. On a phone only the column for the chosen tab is shown; on a computer all of them.
function Column({ title, icon: Icon, visible, children }: { title: string; icon: LucideIcon; visible: boolean; children: ReactNode }) {
  return (
    <section className={`rounded-2xl border border-line bg-surface p-5 shadow-sm lg:self-start ${visible ? '' : 'hidden lg:block'}`}>
      <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-ink">
        <Icon size={20} className="text-accent" />
        {title}
      </h2>
      {children}
    </section>
  )
}
