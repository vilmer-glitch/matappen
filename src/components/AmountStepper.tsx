import { useEffect, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { unitLabel, type Unit } from '../lib/constants'
import { formatAmount } from '../lib/recipeUnits'

type Props = {
  value: number | null
  unit: Unit | null
  step: number
  onChange: (value: number | null) => void
  label: string
  // Focus the field (e.g. after picking the item in the search)
  focus?: boolean
  onFocused?: () => void
  // Report every keystroke (in forms that are saved with a button). Otherwise the amount is
  // reported when you leave the field, so typing doesn't save after every letter.
  live?: boolean
}

// An amount with − and + on each side, so it can be changed without the keyboard.
// You can still tap the number and type.
export function AmountStepper({ value, unit, step, onChange, label, focus, onFocused, live = false }: Props) {
  const [text, setText] = useState(format(value))
  const input = useRef<HTMLInputElement>(null)

  // Keep the field in sync when the amount changes elsewhere (e.g. Ångra or the buttons)
  useEffect(() => {
    if (document.activeElement !== input.current) setText(format(value))
  }, [value])

  useEffect(() => {
    if (focus) {
      input.current?.focus()
      input.current?.select()
      onFocused?.()
    }
  }, [focus, onFocused])

  function save() {
    const parsed = parse(text)
    if (parsed === undefined) return setText(format(value))
    if (parsed !== value) onChange(parsed)
  }

  function nudge(direction: 1 | -1) {
    const base = value ?? 0
    const next = Math.max(0, Math.round((base + direction * step) * 100) / 100)
    if (next !== value) onChange(next)
  }

  return (
    <div className="flex items-center rounded-full bg-surface-2 text-sm text-muted focus-within:ring-2 focus-within:ring-accent">
      <button
        type="button"
        onClick={() => nudge(-1)}
        disabled={!value}
        title={`${formatAmount(step)} ${unitLabel(unit, label)} mindre`}
        aria-label={`Minska ${label}`}
        className="rounded-full p-1.5 hover:bg-line disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <Minus size={15} />
      </button>
      <input
        ref={input}
        inputMode="decimal"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          const parsed = parse(e.target.value)
          if (live && parsed !== undefined) onChange(parsed)
        }}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            setText(format(value))
            e.currentTarget.blur()
          }
        }}
        placeholder="?"
        aria-label={`Mängd ${label}`}
        className="w-12 bg-transparent py-1 text-right font-semibold text-ink focus:outline-none"
      />
      <span className="min-w-6 pl-1">{unitLabel(unit, label)}</span>
      <button
        type="button"
        onClick={() => nudge(1)}
        title={`${formatAmount(step)} ${unitLabel(unit, label)} mer`}
        aria-label={`Öka ${label}`}
        className="rounded-full p-1.5 hover:bg-line"
      >
        <Plus size={15} />
      </button>
    </div>
  )
}

function format(value: number | null) {
  return value === null ? '' : formatAmount(value)
}

// "1,5" → 1.5, "" → null, nonsense → undefined
function parse(text: string): number | null | undefined {
  const t = text.replace(/\s/g, '').replace(',', '.')
  if (t === '') return null
  const n = Number(t)
  return Number.isNaN(n) || n < 0 ? undefined : n
}
