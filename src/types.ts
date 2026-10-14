import type { Category, Status, Unit } from './lib/constants'
import type { RecipeUnit } from './lib/recipeUnits'

export type Item = {
  id: string
  name: string
  category: Category
  unit: Unit | null
  quantity: number | null
  status: Status
  is_staple: boolean
}

export type RecipeIngredient = {
  item_id: string
  quantity: number | null
  unit: RecipeUnit | null
}

export type Recipe = {
  id: string
  name: string
  servings: number
  instructions: string | null
  link: string | null
  note: string | null
  ingredients: RecipeIngredient[]
}

export type PlannedMeal = {
  id: string
  recipe_id: string
  servings: number
  cooked_at: string | null
}

export type ShoppingRow = {
  id: string
  item_id: string
  quantity: number | null
  is_manual: boolean
  checked: boolean
}
