import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Recipe } from '../types'

const COLUMNS =
  'id, name, servings, instructions, link, note, app_key, ingredients:recipe_ingredients(item_id, quantity, unit, position)'

type Row = Omit<Recipe, 'ingredients'> & { ingredients: (Recipe['ingredients'][number] & { position: number })[] }

function fromRow(row: Row): Recipe {
  const ingredients = [...row.ingredients]
    .sort((a, b) => a.position - b.position)
    .map(({ item_id, quantity, unit }) => ({ item_id, quantity, unit }))
  return { ...row, ingredients }
}

export type RecipeDraft = Omit<Recipe, 'id'>

// Loads the user's recipes with their ingredients.
export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('recipes')
      .select(COLUMNS)
      .then(({ data, error }) => {
        if (error) setError('Kunde inte hämta recepten.')
        else setRecipes((data as Row[]).map(fromRow))
        setLoading(false)
      })
  }, [])

  // Replaces all ingredients of a recipe with the given list
  async function saveIngredients(recipeId: string, ingredients: Recipe['ingredients']) {
    const { error: deleteError } = await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId)
    if (deleteError) return deleteError
    if (ingredients.length === 0) return null
    const rows = ingredients.map((ing, position) => ({ ...ing, recipe_id: recipeId, position }))
    const { error } = await supabase.from('recipe_ingredients').insert(rows)
    return error
  }

  // Creates a new recipe, or updates it when an id is given. Returns the saved recipe.
  const saveRecipe = useCallback(async (draft: RecipeDraft, id?: string) => {
    // Only the columns that exist in the database (not the app-recipe display fields)
    const { ingredients, name, servings, instructions, link, note, app_key } = draft
    const fields = { name, servings, instructions, link, note, ...(app_key !== undefined ? { app_key } : {}) }
    const query = id
      ? supabase.from('recipes').update(fields).eq('id', id)
      : supabase.from('recipes').insert(fields)
    const { data, error } = await query.select('id').single()
    if (error) {
      setError('Kunde inte spara rätten.')
      return null
    }
    const ingredientError = await saveIngredients(data.id, ingredients)
    if (ingredientError) setError('Rätten sparades, men inte alla ingredienser.')

    const saved: Recipe = { ...draft, id: data.id, isApp: false, app_key: app_key ?? null }
    setRecipes((prev) =>
      id ? prev.map((r) => (r.id === id ? { ...saved, app_key: app_key ?? r.app_key } : r)) : [...prev, saved],
    )
    return saved
  }, [])

  const removeRecipe = useCallback(async (id: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id))
    const { error } = await supabase.from('recipes').delete().eq('id', id)
    if (error) setError('Kunde inte ta bort rätten.')
  }, [])

  // Puts a removed recipe back with the same id, including its ingredients
  const restoreRecipe = useCallback(async (recipe: Recipe) => {
    const { ingredients, isApp: _isApp, source: _source, time: _time, ...fields } = recipe
    setRecipes((prev) => [...prev, recipe])
    const { error } = await supabase.from('recipes').insert(fields)
    if (error || (await saveIngredients(recipe.id, ingredients))) setError('Kunde inte ångra.')
  }, [])

  return { recipes, loading, error, clearError: () => setError(''), saveRecipe, removeRecipe, restoreRecipe }
}
