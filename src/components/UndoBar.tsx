import type { UndoToast } from '../hooks/useUndo'

export function UndoBar({ toast, onDismiss }: { toast: UndoToast | null; onDismiss: () => void }) {
  if (!toast) return null

  return (
    <div className="fixed bottom-24 left-1/2 z-30 flex w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-4 rounded-full bg-ink px-5 py-3 text-sm text-bg shadow-lg lg:bottom-6">
      <span>{toast.message}</span>
      <button
        onClick={() => {
          toast.undo()
          onDismiss()
        }}
        className="font-bold text-accent hover:underline"
      >
        Ångra
      </button>
    </div>
  )
}
