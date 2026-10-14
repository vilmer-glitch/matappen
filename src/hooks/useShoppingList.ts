import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ShoppingRow } from '../types'

const COLUMNS = 'id, item_id, quantity, is_manual, checked'

// Stored shopping list rows: items added by hand, and checked/changed amounts for automatic items.
export function useShoppingList() {
  const [rows, setRows] = useState<ShoppingRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('shopping_list_items')
      .select(COLUMNS)
      .then(({ data, error }) => {
        if (error) setError('Kunde inte hämta inköpslistan.')
        else setRows(data as ShoppingRow[])
        setLoading(false)
      })
  }, [])

  // Creates or changes the row for an item
  const saveRow = useCallback(async (itemId: string, changes: Partial<Omit<ShoppingRow, 'id' | 'item_id'>>) => {
    setRows((prev) => {
      const existing = prev.find((r) => r.item_id === itemId)
      if (existing) return prev.map((r) => (r.item_id === itemId ? { ...r, ...changes } : r))
      const draft: ShoppingRow = { id: `new-${itemId}`, item_id: itemId, quantity: null, is_manual: false, checked: false }
      return [...prev, { ...draft, ...changes }]
    })
    const { data, error } = await supabase
      .from('shopping_list_items')
      .upsert({ item_id: itemId, ...changes }, { onConflict: 'user_id,item_id' })
      .select(COLUMNS)
      .single()
    if (error) setError('Kunde inte spara inköpslistan.')
    else setRows((prev) => prev.map((r) => (r.item_id === itemId ? (data as ShoppingRow) : r)))
  }, [])

  const removeRows = useCallback(async (itemIds: string[]) => {
    if (itemIds.length === 0) return
    setRows((prev) => prev.filter((r) => !itemIds.includes(r.item_id)))
    const { error } = await supabase.from('shopping_list_items').delete().in('item_id', itemIds)
    if (error) setError('Kunde inte ta bort från inköpslistan.')
  }, [])

  // Puts removed rows back
  const restoreRows = useCallback(async (removed: ShoppingRow[]) => {
    if (removed.length === 0) return
    setRows((prev) => [...prev, ...removed])
    const { error } = await supabase.from('shopping_list_items').insert(removed)
    if (error) setError('Kunde inte ångra.')
  }, [])

  return { rows, loading, error, clearError: () => setError(''), saveRow, removeRows, restoreRows }
}

export type ShoppingListStore = ReturnType<typeof useShoppingList>
