import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Item } from '../types'

const COLUMNS = 'id, name, category, unit, quantity, status, is_staple'

// Loads the user's items and keeps them in sync with the database.
// Changes are shown immediately and saved in the background.
export function useItems() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('items')
      .select(COLUMNS)
      .order('name')
      .then(({ data, error }) => {
        if (error) setError('Kunde inte hämta lagret.')
        else setItems(data as Item[])
        setLoading(false)
      })
  }, [])

  const addItem = useCallback(async (newItem: Omit<Item, 'id'>) => {
    const { data, error } = await supabase.from('items').insert(newItem).select(COLUMNS).single()
    if (error) {
      setError(error.code === '23505' ? `"${newItem.name}" finns redan.` : 'Kunde inte spara varan.')
      return null
    }
    setItems((prev) => [...prev, data as Item])
    return data as Item
  }, [])

  const updateItem = useCallback(async (id: string, changes: Partial<Item>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...changes } : item)))
    const { error } = await supabase.from('items').update(changes).eq('id', id)
    if (error) setError('Kunde inte spara ändringen.')
  }, [])

  const removeItem = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
    const { error } = await supabase.from('items').delete().eq('id', id)
    if (error) setError('Kunde inte ta bort varan.')
  }, [])

  // Puts a removed item back with the same id
  const restoreItem = useCallback(async (item: Item) => {
    setItems((prev) => [...prev, item])
    const { error } = await supabase.from('items').insert(item)
    if (error) setError('Kunde inte ångra.')
  }, [])

  return { items, loading, error, clearError: () => setError(''), addItem, updateItem, removeItem, restoreItem }
}
