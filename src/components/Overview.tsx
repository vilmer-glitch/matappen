import type { ReactNode } from 'react'
import { useItems } from '../hooks/useItems'
import { usePlannedMeals } from '../hooks/usePlannedMeals'
import { useRecipes } from '../hooks/useRecipes'
import { useShoppingList } from '../hooks/useShoppingList'
import { CanCook } from './CanCook'
import { Pantry } from './pantry/Pantry'
import { ShoppingList } from './ShoppingList'
import { WeeklyMeals } from './WeeklyMeals'

type Props = {
  showUndo: (message: string, undo: () => void) => void
  openRecipe: (id: string) => void
  openItem: (id: string) => void
}

export function Overview({ showUndo, openRecipe, openItem }: Props) {
  // Shared by all three columns, so a change in one shows up in the others at once
  const store = useItems()
  const { recipes, loading } = useRecipes()
  const planned = usePlannedMeals()
  const list = useShoppingList()

  const plannedIds = new Set(planned.meals.filter((m) => !m.cooked_at).map((m) => m.recipe_id))

  async function plan(recipeId: string) {
    const recipe = recipes.find((r) => r.id === recipeId)
    if (!recipe) return
    const meal = await planned.addMeal(recipe.id, recipe.servings)
    if (meal) showUndo(`${recipe.name} lades till`, () => planned.removeMeals([meal.id]))
  }

  return (
    <main className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-3">
      <Column title="Lager">
        <Pantry store={store} showUndo={showUndo} openItem={openItem} />
      </Column>
      <Column title="Veckans rätter">
        <WeeklyMeals recipes={recipes} store={store} planned={planned} showUndo={showUndo} openRecipe={openRecipe} />
        <h3 className="mb-3 mt-8 border-t border-stone-200 pt-4 font-semibold text-stone-800">Vad kan jag laga?</h3>
        <CanCook
          recipes={recipes}
          items={store.items}
          loading={loading || store.loading}
          openRecipe={openRecipe}
          plannedIds={plannedIds}
          onPlan={plan}
        />
      </Column>
      <Column title="Inköpslista">
        <ShoppingList recipes={recipes} store={store} planned={planned} list={list} showUndo={showUndo} />
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
