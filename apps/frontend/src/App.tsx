import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import './styles/global.css'
import LoginPage from './pages/LoginPage'
import EmployeesPage from './pages/EmployeesPage'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
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
      <Outlet context={{ sidebarOpen, toggleSidebar } as LayoutContext} />
    </>
  )
}

interface LayoutContext {
  sidebarOpen: boolean
  toggleSidebar: () => void
}

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center">
        <span className="text-sm text-[#64748b]">Loading...</span>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="employees" element={<EmployeesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
