import { Sparkles } from 'lucide-react'

// Marks one of the app's built-in recipes, so it's easy to tell them apart from your own
export function AppBadge({ large = false }: { large?: boolean }) {
  return (
    <span
      title="Ett av appens recept. Ändrar du det blir det ditt eget."
      className={`ml-2 inline-flex items-center gap-1 rounded-full bg-accent-soft align-middle font-semibold text-accent-strong ${
        large ? 'px-2.5 py-1 text-xs' : 'px-1.5 py-0.5 text-[10px]'
      }`}
    >
      <Sparkles size={large ? 12 : 10} />
      Från appen
    </span>
  )
}
