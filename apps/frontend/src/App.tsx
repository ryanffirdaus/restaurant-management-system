import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './styles/global.css'
import LoginPage from './pages/LoginPage'
import EmployeesPage from './pages/EmployeesPage'
import UIComponentsPage from './pages/UIComponentsPage'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import TopAppBar from './components/TopAppBar'
import Dashboard from './components/Dashboard'
import { useAuth } from './context/AuthContext'

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

export interface LayoutContext {
  sidebarOpen: boolean
  toggleSidebar: () => void
}

function DashboardLayout() {
  const { user, profile, employeeRole } = useAuth()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)

  useEffect(() => {
    setSidebarOpen(!isMobile)
  }, [isMobile])

  const toggleSidebar = () => setSidebarOpen((v) => !v)
  const closeSidebar = () => setSidebarOpen(false)

  const displayName = (profile?.name as string) ?? user?.user_metadata?.name ?? user?.email ?? 'User'
  const initial = displayName.charAt(0).toUpperCase()
  const role = employeeRole ?? user?.user_metadata?.role ?? 'Staff'

  return (
    <>
      <Sidebar
        open={sidebarOpen}
        onClose={closeSidebar}
        isMobile={isMobile}
        userName={displayName}
        userRole={role}
        userInitial={initial}
      />
      <TopAppBar onToggleSidebar={toggleSidebar} />
      <main className="ml-[260px] w-[calc(100%-260px)] max-md:ml-0 max-md:w-full h-screen overflow-y-auto">
        <Outlet context={{ sidebarOpen, toggleSidebar } as LayoutContext} />
      </main>
    </>
  )
}

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-sm text-text-muted">Loading...</span>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<EmployeesPage />} />
        <Route path="ui-components" element={<UIComponentsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
