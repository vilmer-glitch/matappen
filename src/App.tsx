import { useSession } from './hooks/useSession'
import { LoginPage } from './components/LoginPage'
import { Overview } from './components/Overview'

export default function App() {
  const session = useSession()

  if (session === undefined) return null
  return session ? <Overview session={session} /> : <LoginPage />
}
