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

export function unitLabel(unit: Unit | null) {
  return UNITS.find((u) => u.value === unit)?.label ?? ''
}

// Status is derived from the amount: 0 means out of stock
export function statusFor(quantity: number | null): Status {
  return quantity === 0 ? 'out' : 'in_stock'
}
