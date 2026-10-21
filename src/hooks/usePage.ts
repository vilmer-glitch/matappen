import { useEffect, useState } from 'react'

// pantry, week and list are the three columns of the overview. On a computer they are shown side by side;
// on a phone one at a time, picked with the tabs at the bottom.
export type Page = 'pantry' | 'week' | 'list' | 'recipes' | 'items'

export const OVERVIEW_PAGES: Page[] = ['pantry', 'week', 'list']

type Location = { page: Page; id: string | null }

// The page is kept in the address (#veckan, #recept/<id> …), so a reload stays on the same page.
const hashNames: Record<Page, string> = { pantry: '', week: 'veckan', list: 'lista', recipes: 'recept', items: 'varor' }

function fromHash(): Location {
  for (const [page, name] of Object.entries(hashNames)) {
    if (!name) continue
    const match = window.location.hash.match(new RegExp(`^#${name}(?:/(.+))?$`))
    if (match) return { page: page as Page, id: match[1] ?? null }
  }
  return { page: 'pantry', id: null }
}

export function usePage() {
  const [location, setLocation] = useState<Location>(fromHash)

  useEffect(() => {
    const onChange = () => setLocation(fromHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  function goTo(page: Page, id: string | null = null) {
    const name = hashNames[page]
    window.location.hash = name ? `#${name}${id ? `/${id}` : ''}` : ''
    setLocation({ page, id })
    window.scrollTo({ top: 0 })
  }

  return { ...location, goTo }
}
