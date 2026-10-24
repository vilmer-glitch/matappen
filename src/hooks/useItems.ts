import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Item } from '../types'

const COLUMNS = 'id, name, category, unit, quantity, status, is_staple, is_default'

// Loads the user's items and keeps them in sync with the database.
// Changes are shown immediately and saved in the background.
export function useItems() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = () =>
      supabase
        .from('items')
        .select(COLUMNS)
        .order('name')
        .then(({ data, error }) => {
          if (error) setError('Kunde inte hämta lagret.')
          else setItems(data as Item[])
          setLoading(false)
        })
    load()
    // Coming back to the tab (e.g. after making a new item under Varor in another tab) loads the items again
    const onVisible = () => document.visibilityState === 'visible' && load()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const addItem = useCallback(async (newItem: Omit<Item, 'id' | 'is_default'>) => {
    const { data, error } = await supabase.from('items').insert(newItem).select(COLUMNS).single()
    if (error) {
      setError(error.code === '23505' ? `"${newItem.name}" finns redan.` : 'Kunde inte spara varan.')
      return null
    }
    setItems((prev) => [...prev, data as Item])
    return data as Item
  }, [])

  // Saves several new items in one go (used by "Kom igång")
  const addItems = useCallback(async (newItems: Omit<Item, 'id' | 'is_default'>[]) => {
    if (newItems.length === 0) return []
    const { data, error } = await supabase.from('items').insert(newItems).select(COLUMNS)
    if (error) {
      setError('Kunde inte spara varorna.')
      return null
    }
    setItems((prev) => [...prev, ...(data as Item[])])
    return data as Item[]
  }, [])

  const updateItem = useCallback(async (id: string, changes: Partial<Item>) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...changes } : item)))
    const { error } = await supabase.from('items').update(changes).eq('id', id)
    if (error) setError(error.code === '23505' ? 'Det finns redan en vara med det namnet.' : 'Kunde inte spara ändringen.')
  }, [])

  // Returns false if the item couldn't be removed (e.g. it is used in a recipe)
  const removeItem = useCallback(async (item: Item) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id))
    const { error } = await supabase.from('items').delete().eq('id', item.id)
    if (!error) return true
    setItems((prev) => [...prev, item])
    setError(
      error.code === '23503'
        ? `${item.name} används i ett recept och kan inte tas bort. Sätt mängden till 0 i stället.`
        : 'Kunde inte ta bort varan.',
    )
    return false
  }, [])

  // Puts a removed item back with the same id
  const restoreItem = useCallback(async (item: Item) => {
    setItems((prev) => [...prev, item])
    const { error } = await supabase.from('items').insert(item)
    if (error) setError('Kunde inte ångra.')
  }, [])

  return { items, loading, error, clearError: () => setError(''), addItem, addItems, updateItem, removeItem, restoreItem }
}

export type ItemsStore = ReturnType<typeof useItems>
