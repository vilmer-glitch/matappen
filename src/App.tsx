import { useSession } from './hooks/useSession'
import { LoginPage } from './components/LoginPage'
import { AppShell } from './components/AppShell'
import { NewPasswordPage } from './components/NewPasswordPage'

export default function App() {
  const { session, isRecovering, finishRecovery } = useSession()

  if (session === undefined) return null
  if (session && isRecovering) return <NewPasswordPage onDone={finishRecovery} />
  return session ? <AppShell session={session} /> : <LoginPage />
}
