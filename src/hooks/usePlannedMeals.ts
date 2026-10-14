import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { PlannedMeal } from '../types'

const COLUMNS = 'id, recipe_id, servings, cooked_at'

// The dishes picked for the coming period.
export function usePlannedMeals() {
  const [meals, setMeals] = useState<PlannedMeal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('planned_meals')
      .select(COLUMNS)
      .order('created_at')
      .then(({ data, error }) => {
        if (error) setError('Kunde inte hämta veckans rätter.')
        else setMeals(data as PlannedMeal[])
        setLoading(false)
      })
  }, [])

  const addMeal = useCallback(async (recipeId: string, servings: number) => {
    const { data, error } = await supabase
      .from('planned_meals')
      .insert({ recipe_id: recipeId, servings })
      .select(COLUMNS)
      .single()
    if (error) {
      setError('Kunde inte lägga till rätten.')
      return null
    }
    setMeals((prev) => [...prev, data as PlannedMeal])
    return data as PlannedMeal
  }, [])

  const updateMeal = useCallback(async (id: string, changes: Partial<PlannedMeal>) => {
    setMeals((prev) => prev.map((m) => (m.id === id ? { ...m, ...changes } : m)))
    const { error } = await supabase.from('planned_meals').update(changes).eq('id', id)
    if (error) setError('Kunde inte spara ändringen.')
  }, [])

  const removeMeals = useCallback(async (ids: string[]) => {
    setMeals((prev) => prev.filter((m) => !ids.includes(m.id)))
    const { error } = await supabase.from('planned_meals').delete().in('id', ids)
    if (error) setError('Kunde inte ta bort rätten.')
  }, [])

  // Puts removed meals back with the same ids
  const restoreMeals = useCallback(async (removed: PlannedMeal[]) => {
    setMeals((prev) => [...prev, ...removed])
    const { error } = await supabase.from('planned_meals').insert(removed)
    if (error) setError('Kunde inte ångra.')
  }, [])

  return { meals, loading, error, clearError: () => setError(''), addMeal, updateMeal, removeMeals, restoreMeals }
}

export type PlannedMealsStore = ReturnType<typeof usePlannedMeals>
