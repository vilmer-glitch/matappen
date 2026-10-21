import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

type Props = {
  title: string
  onClose: () => void
  children: ReactNode
  // The main button at the bottom; left out when the sheet has no action yet (e.g. while picking)
  confirmLabel?: string
  onConfirm?: () => void
  confirmDisabled?: boolean
}

// A panel over the page: slides up from the bottom on phones, centered on computers
export function Sheet({ title, onClose, children, confirmLabel, onConfirm, confirmDisabled }: Props) {
  // Escape closes it
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 lg:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-3xl bg-surface shadow-xl lg:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-2 border-b border-line px-5 py-4">
          <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
          <button onClick={onClose} title="Stäng" className="rounded-full p-1.5 text-faint hover:bg-surface-2 hover:text-ink">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {confirmLabel && (
          <div className="flex gap-2 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              onClick={onConfirm}
              disabled={confirmDisabled}
              className="flex-1 rounded-full bg-accent py-3 text-sm font-semibold text-on-accent hover:bg-accent-strong disabled:opacity-40"
            >
              {confirmLabel}
            </button>
            <button onClick={onClose} className="rounded-full px-5 py-3 text-sm font-semibold text-muted hover:bg-surface-2">
              Avbryt
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
