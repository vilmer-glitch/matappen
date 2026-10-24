import { useState } from 'react'
import { ChevronLeft, ChevronRight, MousePointerClick, Search, Tags } from 'lucide-react'
import { useItems } from '../../hooks/useItems'
import { useRecipes } from '../../hooks/useRecipes'
import { CATEGORIES, unitLabel } from '../../lib/constants'
import { groupOf, planItemEdit, recipesUsing, type ItemEdit } from '../../lib/itemChanges'
import { formatAmount, recipeUnitsFor } from '../../lib/recipeUnits'
import { CATALOG } from '../../data/catalog'
import { catalogEntryFor, normalize } from '../../lib/search'
import { CatalogPanel, itemFromCatalog } from './CatalogPanel'
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
  { value: 'home', label: 'I lagret' },
  { value: 'catalog', label: 'Inte i lagret' },
  { value: 'own', label: 'Egna' },
] as const

// The app's catalog items you don't have get a stand-in row with this id prefix
const CATALOG_PREFIX = 'catalog:'

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

  // Every item: yours, plus the app's catalog items you don't have yet (under any of their names)
  const have = new Set(store.items.map((i) => normalize(i.name)))
  const fromCatalog: Item[] = CATALOG.filter((c) => ![c.name, ...c.aliases].some((n) => have.has(normalize(n)))).map((c) => ({
    id: CATALOG_PREFIX + c.name,
    ...itemFromCatalog(c, null),
    is_default: false,
  }))
  const isCatalog = (item: Item) => item.id.startsWith(CATALOG_PREFIX)
  const isOwn = (item: Item) => !isCatalog(item) && !item.is_default && !catalogEntryFor(item.name)

  const selected = store.items.find((i) => i.id === itemId)
  const selectedEntry = itemId?.startsWith(CATALOG_PREFIX) ? CATALOG.find((c) => CATALOG_PREFIX + c.name === itemId) : undefined
  const q = normalize(search)
  const shown = [...store.items, ...fromCatalog]
    .filter((item) => groupFilter === 'all' || groupOf(item) === groupFilter)
    .filter((item) =>
      originFilter === 'all'
        ? true
        : originFilter === 'home'
          ? !isCatalog(item)
          : originFilter === 'catalog'
            ? isCatalog(item)
            : isOwn(item),
    )
    .filter((item) => {
      if (!q) return true
      const entry = catalogEntryFor(item.name)
      return [item.name, ...(entry ? [entry.name, ...entry.aliases] : [])].some((n) => normalize(n).includes(q))
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'sv'))

  async function addFromCatalog(entryName: string, quantity: number | null) {
    const entry = CATALOG.find((c) => c.name === entryName)
    if (!entry) return
    const created = await store.addItem(itemFromCatalog(entry, quantity))
    if (!created) return
    onSelect(created.id)
    showUndo(`${created.name} lades i lagret`, () => {
      store.removeItem(created)
      onSelect(null)
    })
  }

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

  function homeText(item: Item) {
    if (isCatalog(item)) return 'inte i lagret'
    if (item.is_staple) return 'alltid hemma'
    if (item.quantity === null) return '?'
    if (item.quantity === 0) return 'slut'
    return `${formatAmount(item.quantity)} ${unitLabel(item.unit, item.name)}`
  }

  return (
    <main className="mx-auto grid max-w-2xl grid-cols-1 gap-5 p-4 md:max-w-4xl lg:max-w-[1400px] lg:grid-cols-[1fr_24rem] lg:p-6">
      {/* On a phone the list is hidden while an item is open */}
      <section
        className={`rounded-2xl border border-line bg-surface p-4 shadow-sm lg:block lg:p-5 ${selected || selectedEntry ? 'hidden' : ''}`}
      >
        <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-ink">
          <Tags size={20} className="text-accent" />
          Varor
          <span className="font-sans text-base font-semibold text-faint">{store.items.length + fromCatalog.length}</span>
        </h2>
        <div className="relative mb-3">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sök vara…"
            className="w-full rounded-full border border-line bg-surface-2 py-2.5 pl-10 pr-4 text-sm placeholder:text-faint focus:border-accent focus:bg-surface focus:outline-none"
          />
        </div>
        <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold">
          <Chips options={groupFilters} value={groupFilter} onChange={setGroupFilter} />
          <Chips options={originFilters} value={originFilter} onChange={setOriginFilter} />
        </div>

        {errorText && <p className="mb-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{errorText}</p>}

        {store.loading ? (
          <p className="text-sm text-faint">Hämtar varor…</p>
        ) : shown.length === 0 ? (
          <p className="text-sm text-faint">Ingen vara matchar.</p>
        ) : (
          <>
            {/* Phone: a simple list */}
            <ul className="divide-y divide-line md:hidden">
              {shown.map((item) => {
                const used = isCatalog(item) ? 0 : recipesUsing(item.id, recipes).length
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onSelect(item.id)}
                      className="flex min-h-14 w-full items-center gap-3 py-2 text-left"
                    >
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate font-semibold ${isCatalog(item) ? 'text-muted' : 'text-ink'}`}>{item.name}</span>
                        <span className="block truncate text-xs text-muted">
                          {groupLabels[groupOf(item)]}
                          {!item.is_staple && ` · ${unitLabel(item.unit, item.name)}`}
                          {used > 0 && ` · ${used} recept`}
                          {isCatalog(item) ? ' · i appen' : isOwn(item) ? ' · egen' : ''}
                        </span>
                      </span>
                      <span className="text-sm font-semibold text-muted">{homeText(item)}</span>
                      <ChevronRight size={18} className="text-faint" />
                    </button>
                  </li>
                )
              })}
            </ul>

            {/* Computer: a table with all the details */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-faint">
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
                <tbody className="divide-y divide-line">
                  {shown.map((item) => {
                    const used = isCatalog(item) ? 0 : recipesUsing(item.id, recipes).length
                    return (
                      <tr
                        key={item.id}
                        onClick={() => onSelect(item.id)}
                        className={`cursor-pointer ${item.id === itemId ? 'bg-accent-soft' : 'hover:bg-surface-2'}`}
                      >
                        <td className={`py-2.5 pl-2 pr-3 font-semibold ${isCatalog(item) ? 'text-muted' : 'text-ink'}`}>{item.name}</td>
                        <td className="py-2.5 pr-3 text-muted">{groupLabels[groupOf(item)]}</td>
                        <td className="py-2.5 pr-3 text-muted">{item.is_staple ? '–' : unitLabel(item.unit, item.name)}</td>
                        <td className="py-2.5 pr-3 text-muted">
                          {item.is_staple
                            ? 'alla'
                            : recipeUnitsFor(item.unit)
                                .map((u) => u.label)
                                .join(', ')}
                        </td>
                        <td className="py-2.5 pr-3 text-muted">{homeText(item)}</td>
                        <td className="py-2.5 pr-3 text-muted">{used ? `${used} recept` : '–'}</td>
                        <td className="py-2.5 text-faint">{isCatalog(item) ? 'Inte i lagret' : isOwn(item) ? 'Egen' : 'Från appen'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <aside
        className={`rounded-2xl border border-line bg-surface p-5 shadow-sm lg:sticky lg:top-20 lg:block lg:self-start ${
          selected || selectedEntry ? '' : 'hidden'
        }`}
      >
        {selectedEntry ? (
          <>
            <button
              onClick={() => onSelect(null)}
              className="-ml-1 mb-3 flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold text-muted hover:bg-surface-2 lg:hidden"
            >
              <ChevronLeft size={18} />
              Alla varor
            </button>
            <CatalogPanel
              key={selectedEntry.name}
              entry={selectedEntry}
              onAdd={(quantity) => addFromCatalog(selectedEntry.name, quantity)}
              onClose={() => onSelect(null)}
            />
          </>
        ) : selected ? (
          <>
            <button
              onClick={() => onSelect(null)}
              className="-ml-1 mb-3 flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold text-muted hover:bg-surface-2 lg:hidden"
            >
              <ChevronLeft size={18} />
              Alla varor
            </button>
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
          </>
        ) : (
          <div className="flex flex-col items-center py-10 text-center">
            <MousePointerClick size={28} className="mb-2 text-faint" />
            <p className="text-sm text-muted">Klicka på en vara för att se mer, ändra den eller ta bort den.</p>
          </div>
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
          className={`rounded-full px-3 py-1.5 ${
            value === o.value ? 'bg-ink text-bg' : 'bg-surface-2 text-muted hover:bg-line'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
