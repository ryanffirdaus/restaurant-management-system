import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Icon from './Icon'

const navGroups = [
  {
    label: 'Dashboards',
    items: [
      { label: 'Overview', icon: 'grid_view', to: '/' },
      { label: 'Menu', icon: 'restaurant_menu', to: '/menu' },
      { label: 'Orders', icon: 'receipt_long', to: '/orders' },
      { label: 'Employees', icon: 'group', to: '/employees' },
      { label: 'Tables', icon: 'table_bar', to: '/tables' },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { label: 'Payments', icon: 'payments', to: '/payments' },
      { label: 'Analytics', icon: 'monitoring', to: '/analytics' },
    ],
  },
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
  const { isDark, toggleTheme } = useTheme()

  return (
    <>
      {isMobile && open && (
        <div className="fixed inset-0 bg-black/40 z-[199]" onClick={onClose} />
      )}
      <nav
        className={`
          fixed h-full w-sidebar left-0 top-0 border-r border-outline
          bg-background flex flex-col py-6 z-50
          transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-on-primary font-bold">
            S
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-main">Servio</h1>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Admin Terminal</p>
          </div>
        </div>

        <div className="px-6 mb-6">
          <button className="w-full bg-primary text-on-primary py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-semibold hover:opacity-90 transition-all shadow-lg shadow-primary/10">
            <Icon name="add" />
            <span>New Order</span>
          </button>
        </div>

        <div className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-4 text-[11px] font-bold text-text-muted uppercase tracking-widest mb-2 mt-6 first:mt-0">
                {group.label}
              </p>
              {group.items.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={isMobile ? onClose : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-surface-variant text-primary font-semibold'
                        : 'text-text-muted hover:text-text-main hover:bg-surface-variant'
                    }`
                  }
                >
                  <Icon name={item.icon} className="text-xl" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        <div className="px-4 mt-auto pt-6 border-t border-outline space-y-1">
          <div className="flex items-center gap-3 px-4 py-2.5">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm font-semibold shrink-0">
              {userInitial}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-text-main truncate">{userName}</span>
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{userRole}</span>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-text-main transition-colors"
          >
            <Icon name={isDark ? 'light_mode' : 'dark_mode'} className="text-xl" />
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-text-main transition-colors">
            <Icon name="settings" className="text-xl" />
            <span>Settings</span>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-text-main transition-colors"
          >
            <Icon name="logout" className="text-xl" />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </>
  )
}

export default Sidebar
