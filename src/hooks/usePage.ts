import { useEffect, useState } from 'react'

export type Page = 'overview' | 'recipes'

// The current page is kept in the address (#recept), so a reload stays on the same page.
const hashes: Record<Page, string> = { overview: '', recipes: '#recept' }

function pageFromHash(): Page {
  return window.location.hash === hashes.recipes ? 'recipes' : 'overview'
}

export function usePage() {
  const [page, setPage] = useState<Page>(pageFromHash)

  useEffect(() => {
    const onChange = () => setPage(pageFromHash())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  function goTo(next: Page) {
    window.location.hash = hashes[next]
    setPage(next)
  }

  return { page, goTo }
}
