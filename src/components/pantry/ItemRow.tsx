import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { unitLabel } from '../../lib/constants'
import type { Item } from '../../types'

type Props = {
  item: Item
  focused: boolean
  onFocused: () => void
  onQuantityChange: (quantity: number | null) => void
  onRemove: () => void
  onOpen: () => void
}

export function ItemRow({ item, focused, onFocused, onQuantityChange, onRemove, onOpen }: Props) {
  const [value, setValue] = useState(formatQuantity(item.quantity))
  const input = useRef<HTMLInputElement>(null)

  // Keep the field in sync when the amount changes elsewhere (e.g. Ångra)
  useEffect(() => setValue(formatQuantity(item.quantity)), [item.quantity])

  useEffect(() => {
    if (focused) {
      input.current?.focus()
      input.current?.select()
      onFocused()
    }
  }, [focused, onFocused])

  function save() {
    const text = value.replace(/\s/g, '').replace(',', '.')
    const quantity = text === '' ? null : Number(text)
    if (quantity !== null && (Number.isNaN(quantity) || quantity < 0)) {
      setValue(formatQuantity(item.quantity))
      return
    }
    if (quantity !== item.quantity) onQuantityChange(quantity)
  }

  const isOut = item.quantity === 0

  return (
    <li className="group flex min-h-11 items-center gap-2 py-1">
      <button
        onClick={onOpen}
        title="Visa och ändra varan"
        className={`min-w-0 flex-1 truncate text-left hover:underline ${isOut ? 'text-faint' : 'text-ink'}`}
      >
        {item.name}
      </button>

      {isOut && <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">Slut</span>}

      {!item.is_staple && (
        <label className="flex items-center rounded-full bg-surface-2 pr-3 text-sm text-muted focus-within:ring-2 focus-within:ring-accent">
          <input
            ref={input}
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={save}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') {
                setValue(formatQuantity(item.quantity))
                e.currentTarget.blur()
              }
            }}
            placeholder="?"
            className="w-16 rounded-full bg-transparent py-1 pr-1 text-right font-semibold text-ink focus:outline-none"
          />
          <span className="w-5">{unitLabel(item.unit)}</span>
        </label>
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

function formatQuantity(quantity: number | null) {
  return quantity === null ? '' : quantity.toLocaleString('sv-SE')
}
