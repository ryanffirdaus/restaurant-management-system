import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { label: 'Dashboard', icon: '⊞', to: '/' },
  { label: 'POS', icon: '☰', to: '/pos' },
  { label: 'Orders', icon: '☷', to: '/orders' },
  { label: 'Menu', icon: '⊟', to: '/menu' },
  { label: 'Tables', icon: '⊞', to: '/tables' },
  { label: 'Employees', icon: '☰', to: '/employees' },
  { label: 'Payments', icon: '⊕', to: '/payments' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
  isMobile: boolean
  userName: string
  userRole: string
  userInitial: string
}

function Sidebar({ open, onClose, isMobile, userName, userRole, userInitial }: SidebarProps) {
  const { logout } = useAuth()

  return (
    <>
      {isMobile && open && (
        <div className="fixed inset-0 bg-black/40 z-[199]" onClick={onClose} />
      )}
      <aside
        className={`
          fixed top-0 left-0 w-sidebar h-screen bg-[#0f172a] z-[200]
          flex flex-col overflow-y-auto
          transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-6 border-b border-white/[0.06]">
          <button
            className="md:hidden w-8 h-8 rounded text-[#94a3b8] hover:bg-[#1e293b] hover:text-white flex items-center justify-center shrink-0"
            onClick={onClose}
          >
            ✕
          </button>
          <span className="text-[22px] text-[#10b981]">◈</span>
          <span className="text-base font-bold text-white tracking-tight">OmniTable</span>
        </div>

        <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === '/'}
              onClick={isMobile ? onClose : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm font-medium min-h-[44px] transition-colors duration-150 ${
                  isActive
                    ? 'bg-[#10b981]/10 text-white shadow-[inset_0_2px_0_0_#10b981]'
                    : 'text-[#94a3b8] hover:bg-[#1e293b] hover:text-white'
                }`
              }
            >
              <span className="text-lg w-6 text-center shrink-0">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/[0.06] flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded bg-[#10b981] text-white flex items-center justify-center text-sm font-semibold shrink-0">
              {userInitial}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-white truncate">{userName}</span>
              <span className="text-xs text-[#94a3b8] capitalize">{userRole}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3.5 py-2 rounded-md text-xs font-medium text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#ef4444] transition-colors"
          >
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
