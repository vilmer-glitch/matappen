import { useSession } from './hooks/useSession'
import { LoginPage } from './components/LoginPage'
import { AppShell } from './components/AppShell'

export default function App() {
  const session = useSession()

  if (session === undefined) return null
  return session ? <AppShell session={session} /> : <LoginPage />
}
