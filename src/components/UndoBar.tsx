import type { UndoToast } from '../hooks/useUndo'

export function UndoBar({ toast, onDismiss }: { toast: UndoToast | null; onDismiss: () => void }) {
  if (!toast) return null

  return (
    <div className="fixed bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-lg bg-stone-800 px-4 py-3 text-sm text-white shadow-lg">
      <span>{toast.message}</span>
      <button
        onClick={() => {
          toast.undo()
          onDismiss()
        }}
        className="font-semibold text-emerald-300 hover:text-emerald-200"
      >
        Ångra
      </button>
    </div>
  )
}
