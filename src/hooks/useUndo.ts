import { useCallback, useRef, useState } from 'react'

export type UndoToast = { message: string; undo: () => void }

const UNDO_SECONDS = 6

// Shows a message with an "Ångra" button for a few seconds after a change.
export function useUndo() {
  const [toast, setToast] = useState<UndoToast | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const dismiss = useCallback(() => {
    window.clearTimeout(timer.current)
    setToast(null)
  }, [])

  const showUndo = useCallback((message: string, undo: () => void) => {
    window.clearTimeout(timer.current)
    setToast({ message, undo })
    timer.current = window.setTimeout(() => setToast(null), UNDO_SECONDS * 1000)
  }, [])

  return { toast, showUndo, dismiss }
}
