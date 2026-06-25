import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Icon from './Icon'

const navGroups = [
  {
    label: 'Main',
    items: [
      { label: 'Overview', icon: 'grid_view', to: '/' },
      { label: 'Menu', icon: 'restaurant_menu', to: '/menu' },
      { label: 'Orders', icon: 'receipt_long', to: '/orders' },
      { label: 'Tables', icon: 'table_bar', to: '/tables' },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Employees', icon: 'group', to: '/employees' },
      { label: 'Payments', icon: 'payments', to: '/payments' },
      { label: 'Analytics', icon: 'monitoring', to: '/analytics' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'UI Components', icon: 'widgets', to: '/ui-components' },
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
          bg-background flex flex-col z-50
          transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-outline shrink-0">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-on-primary font-bold text-sm shrink-0">
            S
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-text-main leading-tight">Servio</h1>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none">
              Admin Terminal
            </p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-1">
              <p className="px-3 text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 mt-5 first:mt-1">
                {group.label}
              </p>
              {group.items.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={isMobile ? onClose : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-text-muted hover:text-text-main hover:bg-surface-variant'
                    }`
                  }
                >
                  <Icon name={item.icon} className="text-xl shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-outline px-3 py-3 shrink-0 space-y-0.5">
          {/* User info */}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-variant/50">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-sm font-bold shrink-0">
              {userInitial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-main truncate leading-tight">{userName}</p>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-tight">
                {userRole}
              </p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-text-main hover:bg-surface-variant transition-colors"
          >
            <Icon name={isDark ? 'light_mode' : 'dark_mode'} className="text-xl shrink-0" />
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
          >
            <Icon name="logout" className="text-xl shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </>
  )
}

export default Sidebar
