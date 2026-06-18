import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import Icon from './Icon'
import SearchInput from './SearchInput'

interface TopAppBarProps {
  onToggleSidebar: () => void
}

export default function TopAppBar({ onToggleSidebar }: TopAppBarProps) {
  const { user, profile, employeeRole } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const displayName = (profile?.name as string) ?? user?.user_metadata?.name ?? user?.email ?? 'User'
  const role = employeeRole ?? user?.user_metadata?.role ?? 'Staff'

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-260px)] max-md:w-full h-16 bg-background border-b border-outline flex justify-between items-center px-container-margin z-40">
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:bg-surface-variant transition-colors"
          onClick={onToggleSidebar}
        >
          <Icon name="menu" />
        </button>
        <SearchInput value="" onChange={() => {}} />
      </div>
      <div className="flex items-center gap-5 max-md:hidden">
        <div className="flex items-center gap-4 text-text-muted">
          <button className="hover:text-text-main transition-colors" title="Notifications">
            <Icon name="notifications" />
          </button>
          <button className="hover:text-text-main transition-colors" onClick={toggleTheme} title="Toggle theme">
            <Icon name={isDark ? 'light_mode' : 'dark_mode'} />
          </button>
          <button className="hover:text-text-main transition-colors" title="Language">
            <Icon name="language" />
          </button>
        </div>
        <div className="h-6 w-px bg-outline" />
        <div className="flex items-center gap-3">
          <button className="px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm font-semibold hover:bg-primary/20 transition-all">
            Clock In
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-xs font-bold shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-text-main">{displayName}</span>
            <Icon name="expand_more" className="text-sm text-text-muted" />
          </div>
        </div>
      </div>
    </header>
  )
}
