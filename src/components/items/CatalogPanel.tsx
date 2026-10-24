import { useState } from 'react'
import { PackagePlus, Sparkles, X } from 'lucide-react'
import { hintFor, stepFor, type CatalogItem } from '../../data/catalog'
import { statusFor, unitLabel, type Category } from '../../lib/constants'
import { recipeUnitsFor } from '../../lib/recipeUnits'
import { AmountStepper } from '../AmountStepper'

type Props = {
  entry: CatalogItem
  onAdd: (quantity: number | null) => void
  onClose: () => void
}

const groupLabels = { fridge: 'Kyl', pantry: 'Skafferi', staple: 'Basvara' }

// One of the app's items that isn't in your pantry yet: information and a button to add it
export function CatalogPanel({ entry, onAdd, onClose }: Props) {
  const [quantity, setQuantity] = useState<number | null>(null)
  const isStaple = entry.group === 'staple'

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">{entry.name}</h2>
          <p className="flex items-center gap-1 text-xs text-faint">
            <Sparkles size={12} className="text-accent" />
            Finns i appens varulista, inte i ditt lager än
          </p>
        </div>
        <button onClick={onClose} className="hidden rounded-full p-1.5 text-faint hover:bg-surface-2 hover:text-ink lg:block" title="Stäng">
          <X size={18} />
        </button>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-xl bg-surface-2 p-4 text-sm">
        <dt className="text-muted">Grupp</dt>
        <dd className="text-ink">{groupLabels[entry.group]}</dd>
        {!isStaple && (
          <>
            <dt className="text-muted">Enhet i lagret</dt>
            <dd className="text-ink">{unitLabel(entry.unit, entry.name)}</dd>
          </>
        )}
        <dt className="text-muted">Enheter i recept</dt>
        <dd className="text-ink">
          {recipeUnitsFor(isStaple ? null : entry.unit)
            .map((u) => u.label)
            .join(', ')}
        </dd>
        {entry.aliases.length > 0 && (
          <>
            <dt className="text-muted">Hittas också som</dt>
            <dd className="text-ink">{entry.aliases.join(', ')}</dd>
          </>
        )}
      </dl>

      {hintFor(entry.name) && <p className="text-sm text-muted">{hintFor(entry.name)}</p>}

      <div className="flex flex-wrap items-center gap-3">
        {!isStaple && (
          <AmountStepper
            value={quantity}
            unit={entry.unit}
            step={stepFor(entry.name, entry.unit)}
            onChange={setQuantity}
            label={entry.name}
            live
          />
        )}
        <button
          onClick={() => onAdd(isStaple ? null : quantity)}
          className="flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-strong"
        >
          <PackagePlus size={16} />
          {isStaple ? 'Lägg till som basvara' : 'Lägg till i lagret'}
        </button>
      </div>
      {!isStaple && <p className="text-xs text-faint">Ingen mängd? Då räknas den som "finns hemma" tills du fyller i.</p>}
    </div>
  )
}

// What a catalog entry becomes when it is added to your pantry
export function itemFromCatalog(entry: CatalogItem, quantity: number | null) {
  const isStaple = entry.group === 'staple'
  return {
    name: entry.name,
    category: (entry.group === 'staple' ? 'pantry' : entry.group) as Category,
    unit: isStaple ? null : entry.unit,
    quantity: isStaple ? null : quantity,
    status: isStaple ? ('in_stock' as const) : statusFor(quantity),
    is_staple: isStaple,
  }
}
