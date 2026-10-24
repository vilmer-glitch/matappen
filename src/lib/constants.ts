import { pieceName } from '../data/catalog'
import { catalogEntryFor } from './search'
// Values are stored in English in the database; labels are shown in the UI.

export const CATEGORIES = [
  { value: 'pantry', label: 'Skafferi' },
  { value: 'fridge', label: 'Kyl' },
] as const

export const UNITS = [
  { value: 'g', label: 'g' },
  { value: 'ml', label: 'ml' },
  { value: 'dl', label: 'dl' },
  { value: 'l', label: 'l' },
  { value: 'pcs', label: 'st' },
] as const

export type Category = (typeof CATEGORIES)[number]['value']
export type Unit = (typeof UNITS)[number]['value']
export type Status = 'in_stock' | 'low' | 'out'

// The unit as shown. With the item's name, pieces can get a clearer word (Vitlök: "klyftor" instead of "st").
export function unitLabel(unit: Unit | null, name?: string) {
  if (unit === 'pcs' && name) {
    const piece = pieceName(catalogEntryFor(name)?.name)
    if (piece) return piece
  }
  return UNITS.find((u) => u.value === unit)?.label ?? ''
}

// Status is derived from the amount: 0 means out of stock
export function statusFor(quantity: number | null): Status {
  return quantity === 0 ? 'out' : 'in_stock'
}
