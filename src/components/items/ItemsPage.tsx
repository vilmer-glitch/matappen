import { useState } from 'react'
import { useItems } from '../../hooks/useItems'
import { useRecipes } from '../../hooks/useRecipes'
import { CATEGORIES, unitLabel } from '../../lib/constants'
import { groupOf, planItemEdit, recipesUsing, type ItemEdit } from '../../lib/itemChanges'
import { formatAmount, recipeUnitsFor } from '../../lib/recipeUnits'
import type { Item, Recipe } from '../../types'
import { ItemEditor } from './ItemEditor'

type Props = {
  showUndo: (message: string, undo: () => void) => void
  itemId: string | null
  onSelect: (id: string | null) => void
  openRecipe: (id: string) => void
}

const groupFilters = [
  { value: 'all', label: 'Alla' },
  { value: 'fridge', label: 'Kyl' },
  { value: 'pantry', label: 'Skafferi' },
  { value: 'staple', label: 'Basvaror' },
] as const

const originFilters = [
  { value: 'all', label: 'Alla' },
  { value: 'own', label: 'Egna' },
  { value: 'default', label: 'Från början' },
] as const

const groupLabels: Record<string, string> = {
  ...Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label])),
  staple: 'Basvara',
}

// All items in the system, with information about each one and a way to edit or remove it
export function ItemsPage({ showUndo, itemId, onSelect, openRecipe }: Props) {
  const store = useItems()
  const { recipes, saveRecipe, error: recipeError } = useRecipes()
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState<(typeof groupFilters)[number]['value']>('all')
  const [originFilter, setOriginFilter] = useState<(typeof originFilters)[number]['value']>('all')

  const selected = store.items.find((i) => i.id === itemId)
  const shown = store.items
    .filter((item) => groupFilter === 'all' || groupOf(item) === groupFilter)
    .filter((item) => originFilter === 'all' || (originFilter === 'default') === item.is_default)
    .filter((item) => item.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, 'sv'))

  // Saves recipes again without their id field
  function saveRecipes(list: Recipe[]) {
    return Promise.all(list.map(({ id, ...draft }) => saveRecipe(draft, id)))
  }

  async function save(item: Item, edit: ItemEdit) {
    const { itemChanges, changedRecipes } = planItemEdit(item, edit, recipes)
    const before = recipes.filter((r) => changedRecipes.some((c) => c.id === r.id))
    store.updateItem(item.id, itemChanges)
    await saveRecipes(changedRecipes)
    showUndo(`${item.name} ändrades`, async () => {
      const { id, ...old } = item
      store.updateItem(id, old)
      await saveRecipes(before)
    })
  }

  // Removes the item from every recipe first, then from the pantry. Ångra puts everything back.
  async function remove(item: Item) {
    const used = recipesUsing(item.id, recipes)
    const without = used.map((r) => ({ ...r, ingredients: r.ingredients.filter((ing) => ing.item_id !== item.id) }))
    onSelect(null)
    await saveRecipes(without)
    if (!(await store.removeItem(item))) {
      await saveRecipes(used)
      return
    }
    showUndo(`${item.name} togs bort${used.length ? ` (och från ${used.length} recept)` : ''}`, async () => {
      await store.restoreItem(item)
      await saveRecipes(used)
    })
  }

  const errorText = store.error || recipeError

  return (
    <main className="grid grid-cols-1 gap-4 p-6 lg:grid-cols-[1fr_24rem]">
      <section className="rounded-xl bg-white p-4 shadow">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-stone-800">Varor ({store.items.length})</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök vara…"
            className="min-w-48 flex-1 rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none"
          />
        </div>
        <div className="mb-3 flex flex-wrap gap-4 text-xs">
          <Chips options={groupFilters} value={groupFilter} onChange={setGroupFilter} />
          <Chips options={originFilters} value={originFilter} onChange={setOriginFilter} />
        </div>

        {errorText && <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorText}</p>}

        {store.loading ? (
          <p className="text-sm text-stone-400">Hämtar varor…</p>
        ) : shown.length === 0 ? (
          <p className="text-sm text-stone-400">Ingen vara matchar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-stone-400">
                <tr>
                  <th className="py-2 pr-3 font-semibold">Vara</th>
                  <th className="py-2 pr-3 font-semibold">Grupp</th>
                  <th className="py-2 pr-3 font-semibold">Enhet</th>
                  <th className="py-2 pr-3 font-semibold">I recept</th>
                  <th className="py-2 pr-3 font-semibold">Hemma</th>
                  <th className="py-2 pr-3 font-semibold">Används i</th>
                  <th className="py-2 font-semibold">Ursprung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {shown.map((item) => {
                  const used = recipesUsing(item.id, recipes).length
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onSelect(item.id)}
                      className={`cursor-pointer ${item.id === itemId ? 'bg-emerald-50' : 'hover:bg-stone-50'}`}
                    >
                      <td className="py-2 pr-3 font-medium text-stone-800">{item.name}</td>
                      <td className="py-2 pr-3 text-stone-600">{groupLabels[groupOf(item)]}</td>
                      <td className="py-2 pr-3 text-stone-600">{item.is_staple ? '–' : unitLabel(item.unit)}</td>
                      <td className="py-2 pr-3 text-stone-500">
                        {item.is_staple
                          ? 'alla'
                          : recipeUnitsFor(item.unit)
                              .map((u) => u.label)
                              .join(', ')}
                      </td>
                      <td className="py-2 pr-3 text-stone-600">
                        {item.is_staple
                          ? 'alltid'
                          : item.quantity === null
                            ? '?'
                            : item.quantity === 0
                              ? 'slut'
                              : `${formatAmount(item.quantity)} ${unitLabel(item.unit)}`}
                      </td>
                      <td className="py-2 pr-3 text-stone-600">{used ? `${used} recept` : '–'}</td>
                      <td className="py-2 text-stone-400">{item.is_default ? 'Från början' : 'Egen'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <aside className="rounded-xl bg-white p-5 shadow lg:sticky lg:top-4 lg:self-start">
        {selected ? (
          <ItemEditor
            key={selected.id + selected.unit + selected.is_staple + selected.name}
            item={selected}
            items={store.items}
            recipes={recipes}
            onSave={(edit) => save(selected, edit)}
            onDelete={() => remove(selected)}
            onClose={() => onSelect(null)}
            openRecipe={openRecipe}
          />
        ) : (
          <p className="text-sm text-stone-400">Klicka på en vara för att se mer, ändra den eller ta bort den.</p>
        )}
      </aside>
    </main>
  )
}

function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="flex gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-2.5 py-1 ${
            value === o.value ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
