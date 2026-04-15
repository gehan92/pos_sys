import { AppProvider, useApp } from './context/AppContext'
import Login from './pages/Login'
import Layout from './pages/Layout'

function AppInner() {
  const { user } = useApp()
  return user ? <Layout /> : <Login />
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  )
}
