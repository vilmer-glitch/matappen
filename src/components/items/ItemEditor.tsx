import { useState } from 'react'
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
          <h2 className="text-xl font-semibold text-stone-800">{item.name}</h2>
          <p className="text-xs text-stone-400">{item.is_default ? 'Fanns från början i appen' : 'Tillagd av dig'}</p>
        </div>
        <button onClick={onClose} className="px-1 text-xl text-stone-400 hover:text-stone-700" title="Stäng">
          ×
        </button>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        <dt className="text-stone-500">Hemma</dt>
        <dd className="text-stone-800">
          {item.is_staple
            ? 'Alltid hemma (basvara)'
            : item.quantity === null
              ? 'Ingen mängd ifylld'
              : item.quantity === 0
                ? 'Slut'
                : `${formatAmount(item.quantity)} ${unitLabel(item.unit)}`}
        </dd>
        <dt className="text-stone-500">Enheter i recept</dt>
        <dd className="text-stone-800">
          {recipeUnitsFor(item.is_staple ? null : item.unit)
            .map((u) => u.label)
            .join(', ')}
        </dd>
        <dt className="text-stone-500">Används i</dt>
        <dd>
          {used.length === 0 ? (
            <span className="text-stone-400">Inga recept</span>
          ) : (
            used.map((r, i) => (
              <span key={r.id}>
                {i > 0 && ', '}
                <button onClick={() => openRecipe(r.id)} className="text-emerald-700 hover:underline">
                  {r.name}
                </button>
              </span>
            ))
          )}
        </dd>
      </dl>

      <div className="space-y-3 border-t border-stone-200 pt-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-stone-600">Namn</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          />
        </label>
        {duplicate && <p className="text-sm text-red-600">Det finns redan en vara som heter så.</p>}

        <div>
          <span className="mb-1 block text-sm font-medium text-stone-600">Grupp</span>
          <Choice options={GROUPS} value={group} onChange={setGroup} />
        </div>

        {group !== 'staple' && (
          <div>
            <span className="mb-1 block text-sm font-medium text-stone-600">Enhet i lagret</span>
            <Choice options={UNITS} value={unit} onChange={setUnit} />
          </div>
        )}

        {changed && (plan.amountLost || plan.changedRecipes.length > 0) && (
          <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
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
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-40"
          >
            Spara
          </button>
          <button
            onClick={onDelete}
            className="ml-auto rounded-md px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            title={used.length ? 'Tas också bort från recepten' : undefined}
          >
            Ta bort vara{used.length > 0 && ` (och från ${used.length} recept)`}
          </button>
        </div>
      </div>
    </div>
  )
}
