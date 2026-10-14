import { useEffect, useRef, useState } from 'react'
import { unitLabel } from '../../lib/constants'
import type { Item } from '../../types'

type Props = {
  item: Item
  focused: boolean
  onFocused: () => void
  onQuantityChange: (quantity: number | null) => void
  onRemove: () => void
}

export function ItemRow({ item, focused, onFocused, onQuantityChange, onRemove }: Props) {
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
    <li className="group flex items-center gap-2 py-1.5">
      <span className={`min-w-0 flex-1 truncate ${isOut ? 'text-stone-400' : 'text-stone-800'}`}>{item.name}</span>

      {isOut && <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">Slut</span>}

      {!item.is_staple && (
        <label className="flex items-center gap-1 text-sm text-stone-500">
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
            className="w-16 rounded border border-transparent px-1.5 py-0.5 text-right text-stone-800 hover:border-stone-300 focus:border-emerald-600 focus:outline-none"
          />
          <span className="w-5">{unitLabel(item.unit)}</span>
        </label>
      )}

      <button
        onClick={onRemove}
        title="Ta bort"
        className="px-1 text-stone-300 opacity-0 hover:text-red-600 group-hover:opacity-100"
      >
        ×
      </button>
    </li>
  )
}

function formatQuantity(quantity: number | null) {
  return quantity === null ? '' : quantity.toLocaleString('sv-SE')
}
