import { useState, type ReactNode } from 'react'
import { CalendarDays, ChefHat, CookingPot, Package, ShoppingBasket, type LucideIcon } from 'lucide-react'
import type { Page } from '../hooks/usePage'
import { useItems } from '../hooks/useItems'
import { usePlannedMeals } from '../hooks/usePlannedMeals'
import { useRecipes } from '../hooks/useRecipes'
import { useShoppingList } from '../hooks/useShoppingList'
import { copyAppRecipe, withAppRecipes } from '../lib/appRecipes'
import { statusFor } from '../lib/constants'
import { planCooking } from '../lib/cook'
import type { PlannedMeal, Recipe } from '../types'
import { CanCook } from './CanCook'
import { CookSheet, type CookChoice } from './CookSheet'
import { HasCooked } from './HasCooked'
import { PlanSheet } from './PlanSheet'
import { Pantry } from './pantry/Pantry'
import { ShoppingList } from './ShoppingList'
import { WeeklyMeals } from './WeeklyMeals'

type Props = {
  section: Page
  showUndo: (message: string, undo: () => void) => void
  openRecipe: (id: string) => void
  openItem: (id: string) => void
  openNewItem: (name: string, from: 'pantry' | 'list') => void
}

export function Overview({ section, showUndo, openRecipe, openItem, openNewItem }: Props) {
  // Shared by all three columns, so a change in one shows up in the others at once
  const store = useItems()
  const { recipes: personal, loading, saveRecipe } = useRecipes()
  const planned = usePlannedMeals()
  const list = useShoppingList()

  // Your own recipes plus the app's, and the items including stand-ins for what you don't have yet
  const { recipes, items: allItems } = withAppRecipes(personal, store.items)
  const plannedIds = new Set(planned.meals.filter((m) => !m.cooked_at).map((m) => m.recipe_id))
  const recipesById = new Map(recipes.map((r) => [r.id, r]))
  const itemsById = new Map(allItems.map((i) => [i.id, i]))

  // The confirmation sheets: which dish is being planned, and what "Jag har lagat" starts with
  const [planning, setPlanning] = useState<Recipe | null>(null)
  const [cooking, setCooking] = useState<{ start?: { recipeId: string; mealId: string | null; servings: number } } | null>(null)

  // One of the app's recipes is saved among your own first, since plans need your own recipe
  async function ownRecipe(recipe: Recipe) {
    return recipe.isApp ? copyAppRecipe(recipe, allItems, store.addItem, (d) => saveRecipe(d)) : recipe
  }

  async function plan(recipe: Recipe, servings: number) {
    setPlanning(null)
    const own = await ownRecipe(recipe)
    if (!own) return
    const meal = await planned.addMeal(own.id, servings)
    if (meal) showUndo(`${recipe.name} lades till i Att laga`, () => planned.removeMeals([meal.id]))
  }

  // Subtracts what was used from the pantry, and moves the dish to "Senast lagat"
  async function cooked({ recipe, servings, mealId }: CookChoice) {
    setCooking(null)
    const { updates } = planCooking(recipe, servings, itemsById)
    for (const { item, left } of updates) store.updateItem(item.id, { quantity: left, status: statusFor(left) })
    const now = new Date().toISOString()

    let logged: PlannedMeal | null = null
    if (mealId) {
      planned.updateMeal(mealId, { cooked_at: now, servings })
    } else {
      const own = await ownRecipe(recipe)
      if (own) logged = await planned.addMeal(own.id, servings, now)
    }
    const before = mealId ? planned.meals.find((m) => m.id === mealId) : undefined

    showUndo(`${recipe.name} lagad: ${updates.length} varor drogs av`, () => {
      for (const { item } of updates) store.updateItem(item.id, { quantity: item.quantity, status: item.status })
      if (mealId && before) planned.updateMeal(mealId, { cooked_at: null, servings: before.servings })
      if (logged) planned.removeMeals([logged.id])
    })
  }

  function openPlan(recipeId: string) {
    const recipe = recipesById.get(recipeId)
    if (recipe) setPlanning(recipe)
  }

  return (
    <main className="mx-auto grid max-w-2xl grid-cols-1 gap-5 p-4 lg:max-w-[1500px] lg:grid-cols-3 lg:p-6">
      <Column title="Lager" icon={Package} visible={section === 'pantry'}>
        <Pantry store={store} showUndo={showUndo} openItem={openItem} onRequestNew={(name) => openNewItem(name, 'pantry')} />
      </Column>
      <div className={`space-y-5 ${section === 'week' ? '' : 'hidden lg:block'}`}>
        <Column title="Att laga" icon={CalendarDays} visible>
          <WeeklyMeals
            recipes={recipes}
            planned={planned}
            showUndo={showUndo}
            openRecipe={openRecipe}
            onAdd={openPlan}
            onCook={(meal) => setCooking({ start: { recipeId: meal.recipe_id, mealId: meal.id, servings: meal.servings } })}
          />
        </Column>
        <Column title="Kan lagas nu" icon={ChefHat} visible>
          <CanCook
            recipes={recipes}
            items={allItems}
            loading={loading || store.loading}
            openRecipe={openRecipe}
            plannedIds={plannedIds}
            onPlan={openPlan}
          />
        </Column>
        <Column title="Har lagat" icon={CookingPot} visible>
          <HasCooked recipes={recipes} planned={planned} onCook={() => setCooking({})} showUndo={showUndo} />
        </Column>
      </div>
      <Column title="Inköpslista" icon={ShoppingBasket} visible={section === 'list'}>
        <ShoppingList
          recipes={personal}
          store={store}
          planned={planned}
          list={list}
          showUndo={showUndo}
          onRequestNew={(name) => openNewItem(name, 'list')}
        />
      </Column>

      {planning && (
        <PlanSheet
          recipe={planning}
          meals={planned.meals}
          recipesById={recipesById}
          itemsById={itemsById}
          onConfirm={(servings) => plan(planning, servings)}
          onClose={() => setPlanning(null)}
        />
      )}
      {cooking && (
        <CookSheet
          recipes={recipes}
          planned={planned.meals}
          itemsById={itemsById}
          start={cooking.start}
          onConfirm={cooked}
          onClose={() => setCooking(null)}
        />
      )}
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
