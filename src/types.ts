import type { Category, Status, Unit } from './lib/constants'

export type Item = {
  id: string
  name: string
  category: Category
  unit: Unit | null
  quantity: number | null
  status: Status
  is_staple: boolean
}
