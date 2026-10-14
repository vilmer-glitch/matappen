import type { Unit } from './constants'

// Units a recipe can use. `base` is the pantry unit it converts to, `factor` how many base units one of these is.
export const RECIPE_UNITS = [
  { value: 'g', label: 'g', base: 'g', factor: 1 },
  { value: 'kg', label: 'kg', base: 'g', factor: 1000 },
  { value: 'ml', label: 'ml', base: 'ml', factor: 1 },
  { value: 'dl', label: 'dl', base: 'ml', factor: 100 },
  { value: 'l', label: 'l', base: 'ml', factor: 1000 },
  { value: 'tbsp', label: 'msk', base: 'ml', factor: 15 },
  { value: 'tsp', label: 'tsk', base: 'ml', factor: 5 },
  { value: 'pinch', label: 'krm', base: 'ml', factor: 1 },
  { value: 'pcs', label: 'st', base: 'pcs', factor: 1 },
] as const

export type RecipeUnit = (typeof RECIPE_UNITS)[number]['value']

// Pantry units ml, dl and l are all volumes, stored with ml as the base
function baseOf(unit: Unit | RecipeUnit): string {
  return RECIPE_UNITS.find((u) => u.value === unit)?.base ?? unit
}

// Which recipe units fit a pantry item. Staples (no unit) can use any.
export function recipeUnitsFor(itemUnit: Unit | null) {
  if (!itemUnit) return RECIPE_UNITS
  return RECIPE_UNITS.filter((u) => u.base === baseOf(itemUnit))
}

// Converts an amount between two units of the same kind, e.g. 2 dl → 0.2 l
export function convert(quantity: number, from: RecipeUnit, to: Unit | RecipeUnit) {
  const fromUnit = RECIPE_UNITS.find((u) => u.value === from)
  const toUnit = RECIPE_UNITS.find((u) => u.value === to)
  if (!fromUnit || !toUnit || fromUnit.base !== toUnit.base) return null
  return (quantity * fromUnit.factor) / toUnit.factor
}

export function recipeUnitLabel(unit: RecipeUnit | null) {
  return RECIPE_UNITS.find((u) => u.value === unit)?.label ?? ''
}

// Rounds scaled amounts so they are easy to read: 1.25 kg, 333 g, 1.5 dl
export function formatAmount(quantity: number) {
  const rounded = quantity >= 100 ? Math.round(quantity) : Math.round(quantity * 100) / 100
  return rounded.toLocaleString('sv-SE')
}
