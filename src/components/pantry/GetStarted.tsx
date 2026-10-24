import { useState } from 'react'
import { PackagePlus, Refrigerator, Search, Wheat, X, type LucideIcon } from 'lucide-react'
import { CATALOG, hintFor, stepFor, type CatalogItem } from '../../data/catalog'
import type { ItemsStore } from '../../hooks/useItems'
import { statusFor } from '../../lib/constants'
import { normalize } from '../../lib/search'
import { AmountStepper } from '../AmountStepper'

type Props = {
  store: ItemsStore
  showUndo: (message: string, undo: () => void) => void
  onClose?: () => void
}

// "Kom igång": fill the pantry quickly by typing how much you have of common groceries
export function GetStarted({ store, showUndo, onClose }: Props) {
  const [amounts, setAmounts] = useState<Record<string, number | null>>({})
  const [showAll, setShowAll] = useState(false)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  // Leave out what you already have, under its name or another name
  const have = new Set(store.items.map((i) => normalize(i.name)))
  const available = CATALOG.filter(
    (c) => c.group !== 'staple' && ![c.name, ...c.aliases].some((n) => have.has(normalize(n))),
  )
  const q = normalize(search)
  const shown = available.filter((c) =>
    q ? [c.name, ...c.aliases].some((n) => normalize(n).includes(q)) : showAll || c.common,
  )

  const filled = available
    .map((c) => ({ entry: c, amount: amounts[c.name] ?? null }))
    .filter((f): f is { entry: CatalogItem; amount: number } => f.amount !== null)

  async function save() {
    setSaving(true)
    const created = await store.addItems(
      filled.map(({ entry, amount }) => ({
        name: entry.name,
        category: entry.group === 'staple' ? 'pantry' : entry.group,
        unit: entry.unit,
        quantity: amount,
        status: statusFor(amount),
        is_staple: false,
      })),
    )
    setSaving(false)
    if (!created) return
    setAmounts({})
    showUndo(`${created.length} varor lades i lagret`, () => {
      for (const item of created) store.removeItem(item)
    })
    onClose?.()
  }

  return (
    <div className="rounded-2xl border border-accent/30 bg-accent-soft/40 p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">Kom igång: vad har du hemma?</h3>
          <p className="text-sm text-muted">Skriv hur mycket du har. Lämna tomt för det du inte har.</p>
        </div>
        {onClose && (
          <button onClick={onClose} title="Stäng" className="rounded-full p-1.5 text-faint hover:bg-surface hover:text-ink">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="relative mb-3">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Hitta en vara…"
          className="w-full rounded-full border border-line bg-surface py-2 pl-10 pr-4 text-sm placeholder:text-faint focus:border-accent focus:outline-none"
        />
      </div>

      <Section title="Kyl och frys" icon={Refrigerator}>
        {shown.filter((c) => c.group === 'fridge').map((c) => (
          <AmountRow key={c.name} entry={c} value={amounts[c.name] ?? null} onChange={(v) => setAmounts({ ...amounts, [c.name]: v })} />
        ))}
      </Section>
      <Section title="Skafferi" icon={Wheat}>
        {shown.filter((c) => c.group === 'pantry').map((c) => (
          <AmountRow key={c.name} entry={c} value={amounts[c.name] ?? null} onChange={(v) => setAmounts({ ...amounts, [c.name]: v })} />
        ))}
      </Section>

      {!q && (
        <button onClick={() => setShowAll(!showAll)} className="mb-3 text-sm font-semibold text-accent-strong hover:underline">
          {showAll ? 'Visa bara de vanligaste' : `Visa alla ${available.length} varor`}
        </button>
      )}

      <button
        onClick={save}
        disabled={filled.length === 0 || saving}
        className={`flex w-full items-center justify-center gap-2 rounded-full bg-accent py-3 text-sm font-semibold text-on-accent hover:bg-accent-strong disabled:opacity-40 ${
          filled.length ? 'sticky bottom-24 shadow-lg lg:bottom-4' : ''
        }`}
      >
        <PackagePlus size={18} />
        {saving ? 'Sparar…' : filled.length ? `Lägg till ${filled.length} varor` : 'Fyll i det du har hemma'}
      </button>
    </div>
  )
}

function Section({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode[] }) {
  if (children.length === 0) return null
  return (
    <section className="mb-4">
      <h4 className="mb-1 flex items-center gap-2 text-sm font-semibold text-muted">
        <Icon size={16} className="text-accent" />
        {title}
      </h4>
      <ul className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">{children}</ul>
    </section>
  )
}

function AmountRow({ entry, value, onChange }: { entry: CatalogItem; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <li className="flex min-h-12 items-center gap-2 border-b border-line/70 py-1">
      <span className={`min-w-0 flex-1 truncate ${value !== null ? 'font-semibold text-ink' : 'text-muted'}`}>
        {entry.name}
        {hintFor(entry.name) && <span className="block truncate text-xs font-normal text-faint">{hintFor(entry.name)}</span>}
      </span>
      <AmountStepper
        value={value}
        unit={entry.unit}
        step={stepFor(entry.name, entry.unit)}
        onChange={onChange}
        label={entry.name}
        live
      />
    </li>
  )
}
