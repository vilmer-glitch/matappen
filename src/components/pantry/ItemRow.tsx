import { X } from 'lucide-react'
import { itemStep } from '../../lib/search'
import type { Item } from '../../types'
import { AmountStepper } from '../AmountStepper'

type Props = {
  item: Item
  focused: boolean
  onFocused: () => void
  onQuantityChange: (quantity: number | null) => void
  onRemove: () => void
  onOpen: () => void
}

export function ItemRow({ item, focused, onFocused, onQuantityChange, onRemove, onOpen }: Props) {
  const isOut = item.quantity === 0

  return (
    <li className="group flex min-h-12 items-center gap-2 py-1">
      <button
        onClick={onOpen}
        title="Visa och ändra varan"
        className={`min-w-0 flex-1 truncate text-left hover:underline ${isOut ? 'text-faint' : 'text-ink'}`}
      >
        {item.name}
      </button>

      {!item.is_staple && (
        <AmountStepper
          value={item.quantity}
          unit={item.unit}
          step={itemStep(item.name, item.unit)}
          onChange={onQuantityChange}
          label={item.name}
          focus={focused}
          onFocused={onFocused}
        />
      )}

      <button
        onClick={onRemove}
        title="Ta bort"
        className="rounded-full p-1.5 text-faint hover:bg-danger-soft hover:text-danger [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
      >
        <X size={16} />
      </button>
    </li>
  )
}
