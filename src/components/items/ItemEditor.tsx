import { useState } from 'react'
import { Trash2, X } from 'lucide-react'
import { CATEGORIES, UNITS, unitLabel, type Unit } from '../../lib/constants'
import { groupOf, planItemEdit, recipesUsing, type Group, type ItemEdit } from '../../lib/itemChanges'
import { formatAmount, recipeUnitsFor } from '../../lib/recipeUnits'
import type { Item, Recipe } from '../../types'
import { Choice } from '../pantry/AddItemSearch'

const GROUPS = [...CATEGORIES, { value: 'staple', label: 'Basvara' }] as const

type Props = {
  item: Item
  items: Item[]
  recipes: Recipe[]
  onSave: (edit: ItemEdit) => void
  onDelete: () => void
  onClose: () => void
  openRecipe: (id: string) => void
}

export function ItemEditor({ item, items, recipes, onSave, onDelete, onClose, openRecipe }: Props) {
  const [name, setName] = useState(item.name)
  const [group, setGroup] = useState<Group>(groupOf(item))
  const [unit, setUnit] = useState<Unit>(item.unit ?? 'g')

  const used = recipesUsing(item.id, recipes)
  const edit: ItemEdit = { name, group, unit }
  const plan = planItemEdit(item, edit, recipes)
  const trimmed = name.trim()
  const duplicate = items.some((i) => i.id !== item.id && i.name.toLowerCase() === trimmed.toLowerCase())
  const changed = trimmed !== item.name || group !== groupOf(item) || (group !== 'staple' && unit !== item.unit)

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">{item.name}</h2>
          <p className="text-xs text-faint">{item.is_default ? 'Fanns från början i appen' : 'Tillagd av dig'}</p>
        </div>
        <button onClick={onClose} className="hidden rounded-full p-1.5 text-faint hover:bg-surface-2 hover:text-ink lg:block" title="Stäng">
          <X size={18} />
        </button>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-xl bg-surface-2 p-4 text-sm">
        <dt className="text-muted">Hemma</dt>
        <dd className="text-ink">
          {item.is_staple
            ? 'Alltid hemma (basvara)'
            : item.quantity === null
              ? 'Ingen mängd ifylld'
              : item.quantity === 0
                ? 'Slut'
                : `${formatAmount(item.quantity)} ${unitLabel(item.unit, item.name)}`}
        </dd>
        <dt className="text-muted">Enheter i recept</dt>
        <dd className="text-ink">
          {recipeUnitsFor(item.is_staple ? null : item.unit)
            .map((u) => u.label)
            .join(', ')}
        </dd>
        <dt className="text-muted">Används i</dt>
        <dd>
          {used.length === 0 ? (
            <span className="text-faint">Inga recept</span>
          ) : (
            used.map((r, i) => (
              <span key={r.id}>
                {i > 0 && ', '}
                <button onClick={() => openRecipe(r.id)} className="font-semibold text-accent-strong hover:underline">
                  {r.name}
                </button>
              </span>
            ))
          )}
        </dd>
      </dl>

      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-muted">Namn</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
        </label>
        {duplicate && <p className="text-sm text-danger">Det finns redan en vara som heter så.</p>}

        <div>
          <span className="mb-1.5 block text-sm font-semibold text-muted">Grupp</span>
          <Choice options={GROUPS} value={group} onChange={setGroup} />
        </div>

        {group !== 'staple' && (
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-muted">Enhet i lagret</span>
            <Choice options={UNITS} value={unit} onChange={setUnit} />
          </div>
        )}

        {changed && (plan.amountLost || plan.changedRecipes.length > 0) && (
          <div className="rounded-xl bg-warn-soft p-3 text-sm text-warn">
            {plan.amountLost && <p>Mängden hemma går inte att räkna om och töms.</p>}
            {plan.changedRecipes.length > 0 && (
              <p>
                Mängden töms i {plan.changedRecipes.map((r) => r.name).join(', ')}. Fyll i den igen under Recept.
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onSave(edit)}
            disabled={!changed || !trimmed || duplicate}
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-on-accent hover:bg-accent-strong disabled:opacity-40"
          >
            Spara
          </button>
          <button
            onClick={onDelete}
            className="ml-auto flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger-soft"
            title={used.length ? 'Tas också bort från recepten' : undefined}
          >
            <Trash2 size={15} />
            Ta bort vara{used.length > 0 && ` (och från ${used.length} recept)`}
          </button>
        </div>
      </div>
    </div>
  )
}
