import { useEffect, useState } from 'react'

export type Page = 'overview' | 'recipes' | 'items'

type Location = { page: Page; id: string | null }

// The page is kept in the address (#recept/<id>, #varor/<id>), so a reload stays on the same page.
const hashNames: Record<Exclude<Page, 'overview'>, string> = { recipes: 'recept', items: 'varor' }

function fromHash(): Location {
  for (const [page, name] of Object.entries(hashNames)) {
    const match = window.location.hash.match(new RegExp(`^#${name}(?:/(.+))?$`))
    if (match) return { page: page as Page, id: match[1] ?? null }
  }
  return { page: 'overview', id: null }
}

export function usePage() {
  const [location, setLocation] = useState<Location>(fromHash)

  useEffect(() => {
    const onChange = () => setLocation(fromHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  function goTo(page: Page, id: string | null = null) {
    window.location.hash = page === 'overview' ? '' : `#${hashNames[page]}${id ? `/${id}` : ''}`
    setLocation({ page, id })
  }

  return { ...location, goTo }
}
