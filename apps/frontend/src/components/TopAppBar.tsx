import { useLocation } from 'react-router-dom'
import Icon from './Icon'
import SearchInput from './SearchInput'

const pageTitles: Record<string, string> = {
  '/': 'Overview',
  '/menu': 'Menu',
  '/orders': 'Orders',
  '/employees': 'Employees',
  '/tables': 'Tables',
  '/payments': 'Payments',
  '/analytics': 'Analytics',
  '/ui-components': 'UI Components',
}

interface TopAppBarProps {
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

export default function TopAppBar({ onToggleSidebar, sidebarOpen }: TopAppBarProps) {
  const location = useLocation()
  const title = pageTitles[location.pathname] ?? 'Dashboard'

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-background/80 backdrop-blur border-b border-outline flex items-center px-4 gap-3 z-40 transition-all duration-200 ${
        sidebarOpen
          ? 'left-sidebar max-md:left-0'
          : 'left-0'
      }`}
    >
      <button
        className="w-9 h-9 rounded-xl flex items-center justify-center text-text-muted hover:text-text-main hover:bg-surface-variant transition-colors shrink-0"
        onClick={onToggleSidebar}
        title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <Icon name={sidebarOpen ? 'menu_open' : 'menu'} className="text-xl" />
      </button>

      <span className="text-sm font-semibold text-text-main hidden sm:block shrink-0">
        {title}
      </span>

      <div className="flex-1 max-w-sm">
        <SearchInput value="" onChange={() => {}} placeholder="Search anything..." />
      </div>

      <div className="ml-auto flex items-center gap-1 text-text-muted">
        <button
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:text-text-main hover:bg-surface-variant transition-colors relative"
          title="Notifications"
        >
          <Icon name="notifications" className="text-xl" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
        </button>
      </div>
    </header>
  )
}
