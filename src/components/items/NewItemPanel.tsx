import { useState } from 'react'
import { PackagePlus, Sparkles, TriangleAlert } from 'lucide-react'
import { stepFor } from '../../data/catalog'
import { CATEGORIES, statusFor, UNITS, type Category, type Unit } from '../../lib/constants'
import { normalize, suggest } from '../../lib/search'
import type { Item } from '../../types'
import { AmountStepper } from '../AmountStepper'
import { Choice } from '../pantry/AddItemSearch'

export type NewItemOrigin = 'pantry' | 'list' | 'recipe' | 'items'

type Props = {
  initialName: string
  from: NewItemOrigin
  items: Item[]
  onCreate: (item: Omit<Item, 'id' | 'is_default'>) => void
  // Opens an item that already exists (yours by id, or one of the app's as "catalog:<name>")
  onOpenExisting: (id: string) => void
  onCancel: () => void
}

const GROUPS = [...CATEGORIES, { value: 'staple', label: 'Basvara' }] as const

const origins: Record<NewItemOrigin, string> = {
  pantry: 'Du kom hit från Lager. Varan läggs i lagret och du kommer tillbaka när den är skapad.',
  list: 'Du kom hit från inköpslistan. Varan läggs på listan och du kommer tillbaka när den är skapad.',
  recipe: 'Du kom hit från ett recept. Skapa varan här och gå sedan tillbaka till fliken med receptet och sök efter den.',
  items: '',
}

// The only place where a new item can be made. Warns clearly and shows similar items first,
// so the same thing doesn't end up twice under different names.
export function NewItemPanel({ initialName, from, items, onCreate, onOpenExisting, onCancel }: Props) {
  const [name, setName] = useState(initialName)
  const [group, setGroup] = useState<Category | 'staple'>('pantry')
  const [unit, setUnit] = useState<Unit>('g')
  const [quantity, setQuantity] = useState<number | null>(null)

  const trimmed = name.trim()
  const similar = trimmed ? suggest(trimmed, items, 5) : []
  const sameName = similar.find((s) => s.score === 0)
  const isStaple = group === 'staple'

  function create() {
    if (!trimmed || sameName) return
    onCreate({
      name: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
      category: isStaple ? 'pantry' : (group as Category),
      unit: isStaple ? null : unit,
      quantity: isStaple ? null : quantity,
      status: isStaple ? 'in_stock' : statusFor(quantity),
      is_staple: isStaple,
    })
  }

  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl font-semibold text-ink">Ny egen vara</h2>

      <div className="flex gap-3 rounded-xl border border-warn/40 bg-warn-soft p-4 text-sm text-ink">
        <TriangleAlert size={20} className="mt-0.5 shrink-0 text-warn" />
        <div className="space-y-1">
          <p className="font-semibold">Kolla först att varan inte redan finns.</p>
          <p className="text-muted">
            Appen har över 200 varor med rätt grupp och enhet. En egen vara finns bara hos dig, och appens recept känner inte igen
            den. Två namn för samma sak gör att lager, recept och inköpslista inte hittar varandra.
          </p>
        </div>
      </div>

      {origins[from] && <p className="text-sm text-muted">{origins[from]}</p>}

      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-muted">Namn</span>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-line px-3.5 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
      </label>

      {similar.length > 0 && (
        <section>
          <h3 className="mb-1.5 text-sm font-semibold text-ink">
            {sameName ? 'Den här varan finns redan:' : 'Menade du någon av dessa?'}
          </h3>
          <ul className="divide-y divide-line rounded-xl border border-line">
            {similar.map((s) => {
              const label = s.kind === 'own' ? s.item.name : s.entry.name
              const id = s.kind === 'own' ? s.item.id : `catalog:${s.entry.name}`
              return (
                <li key={id}>
                  <button
                    onClick={() => onOpenExisting(id)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-surface-2"
                  >
                    <span className="flex items-center gap-2 font-semibold text-ink">
                      {s.kind === 'catalog' && <Sparkles size={13} className="text-accent" />}
                      {label}
                    </span>
                    <span className="text-xs text-faint">{s.kind === 'own' ? 'i ditt lager' : 'i appen'} · välj den</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {!sameName && (
        <>
          <div>
            <span className="mb-1.5 block text-sm font-semibold text-muted">Grupp</span>
            <Choice options={GROUPS} value={group} onChange={setGroup} />
          </div>
          {!isStaple && (
            <>
              <div>
                <span className="mb-1.5 block text-sm font-semibold text-muted">Enhet (kan inte ändras utan att mängder töms)</span>
                <Choice options={UNITS} value={unit} onChange={setUnit} />
              </div>
              {from !== 'list' && from !== 'recipe' && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-muted">Hemma</span>
                  <AmountStepper
                    value={quantity}
                    unit={unit}
                    step={stepFor(undefined, unit)}
                    onChange={setQuantity}
                    label={trimmed || 'ny vara'}
                    live
                  />
                </div>
              )}
            </>
          )}
        </>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={create}
          disabled={!trimmed || Boolean(sameName)}
          className={`flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-40 ${
            similar.length && !sameName
              ? 'border border-line text-ink hover:bg-surface-2'
              : 'bg-accent text-on-accent hover:bg-accent-strong'
          }`}
        >
          <PackagePlus size={16} />
          {similar.length && !sameName ? `Ingen av dem – skapa ”${trimmed}” ändå` : 'Skapa egen vara'}
        </button>
        <button onClick={onCancel} className="rounded-full px-5 py-2.5 text-sm font-semibold text-muted hover:bg-surface-2">
          Avbryt
        </button>
      </div>
      {sameName && normalize(trimmed) && <p className="text-xs text-faint">Välj den ovan i stället.</p>}
    </div>
  )
}
