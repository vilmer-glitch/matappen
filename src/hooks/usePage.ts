import { useEffect, useState } from 'react'

export type Page = 'overview' | 'recipes'

type Location = { page: Page; recipeId: string | null }

// The current page is kept in the address (#recept or #recept/<id>), so a reload stays on the same page.
function fromHash(): Location {
  const match = window.location.hash.match(/^#recept(?:\/(.+))?$/)
  return match ? { page: 'recipes', recipeId: match[1] ?? null } : { page: 'overview', recipeId: null }
}

export function usePage() {
  const [location, setLocation] = useState<Location>(fromHash)

  useEffect(() => {
    const onChange = () => setLocation(fromHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  function goTo(page: Page, recipeId: string | null = null) {
    window.location.hash = page === 'recipes' ? `#recept${recipeId ? `/${recipeId}` : ''}` : ''
    setLocation({ page, recipeId })
  }

  return { ...location, goTo }
}
