import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { apiGet } from '../lib/api'
import Icon from './Icon'

interface NavItem {
  label: string
  icon: string
  to: string
  badge?: 'activeOrders'
}

interface NavGroup {
  label: string
  icon: string
  children: { label: string; to: string }[]
}

type NavEntry = NavItem | NavGroup

const isGroup = (entry: NavEntry): entry is NavGroup => 'children' in entry

const navEntries: NavEntry[] = [
  { label: 'Overview', icon: 'ri-dashboard-line', to: '/' },
  { label: 'Orders', icon: 'ri-bill-line', to: '/orders', badge: 'activeOrders' },
  { label: 'Tables', icon: 'ri-layout-grid-line', to: '/tables' },
  { label: 'Menu', icon: 'ri-restaurant-2-line', to: '/menu' },
  {
    label: 'Management',
    icon: 'ri-briefcase-4-line',
    children: [
      { label: 'Employees', to: '/employees' },
      { label: 'Payments', to: '/payments' },
      { label: 'Analytics', to: '/analytics' },
    ],
  },
  { label: 'UI Components', icon: 'ri-apps-2-line', to: '/ui-components' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
  isMobile: boolean
}

function Sidebar({ open, onClose, isMobile }: SidebarProps) {
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [activeOrders, setActiveOrders] = useState<number | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      navEntries.filter(isGroup).map((g) => [g.label, g.children.some((c) => c.to === location.pathname)]),
    ),
  )

  // Refresh the live order count whenever the admin navigates
  useEffect(() => {
    apiGet<{ status: string }[]>('/orders')
      .then((orders) => setActiveOrders(orders.filter((o) => o.status === 'pending' || o.status === 'preparing').length))
      .catch(() => setActiveOrders(null))
  }, [location.pathname])

  const q = query.trim().toLowerCase()
  const matches = (label: string) => !q || label.toLowerCase().includes(q)
  const visibleEntries = navEntries.filter((e) =>
    isGroup(e) ? matches(e.label) || e.children.some((c) => matches(c.label)) : matches(e.label),
  )

  const linkBase = 'relative flex items-center gap-4 px-6 py-3 text-sm transition-colors'
  const linkState = (isActive: boolean) =>
    isActive
      ? 'bg-sidebar-raised text-sidebar-ink font-medium before:absolute before:left-0 before:inset-y-1 before:w-[3px] before:rounded-r before:bg-sidebar-accent [&>i:first-child]:text-sidebar-accent'
      : 'text-sidebar-ink-2 hover:bg-sidebar-raised hover:text-sidebar-ink'

  return (
    <>
      {isMobile && open && (
        <div className="fixed inset-0 bg-black/40 z-[199]" onClick={onClose} />
      )}
      <nav
        className={`
          fixed h-full w-sidebar left-0 top-0 border-r border-sidebar-line
          bg-sidebar flex flex-col z-[200]
          transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand — aligned with the 64px top bar */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-sidebar-line shrink-0">
          <img src="/logo-wordmark-dark.svg" alt="Servio" className="h-7 w-auto" />
        </div>

        {/* Search */}
        <div className="px-6 pt-5 pb-4 shrink-0">
          <label className="flex items-center border border-sidebar-line bg-sidebar-raised rounded focus-within:border-sidebar-accent transition-colors">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to search..."
              className="flex-1 min-w-0 bg-transparent px-3 h-10 text-sm text-sidebar-ink placeholder:text-sidebar-ink-2 outline-none"
            />
            <Icon name="ri-search-line" className="text-sm text-sidebar-ink-2 px-3" />
          </label>
        </div>

        <p className="px-6 pt-2 pb-2 text-xs font-medium text-sidebar-ink-2 shrink-0">Dash menu</p>

        {/* Nav */}
        <ul className="flex-1 overflow-y-auto custom-scrollbar pb-4">
          {visibleEntries.map((entry) => {
            if (!isGroup(entry)) {
              const count = entry.badge === 'activeOrders' ? activeOrders : null
              return (
                <li key={entry.to} className="mt-0.5">
                  <NavLink
                    to={entry.to}
                    end={entry.to === '/'}
                    onClick={isMobile ? onClose : undefined}
                    className={({ isActive }) => `${linkBase} ${linkState(isActive)}`}
                  >
                    <Icon name={entry.icon} className="text-lg shrink-0" />
                    <span>{entry.label}</span>
                    {count != null && count > 0 && (
                      <span className="ml-auto flex items-center gap-1.5 h-6 px-2 rounded-full bg-sidebar-accent text-sidebar-accent-fg text-xs font-semibold num">
                        <span className="status-pulse is-live" />
                        {count}
                      </span>
                    )}
                  </NavLink>
                </li>
              )
            }

            const childActive = entry.children.some((c) => c.to === location.pathname)
            const isOpen = expanded[entry.label] || !!q
            const children = entry.children.filter((c) => matches(entry.label) || matches(c.label))
            return (
              <li key={entry.label} className="mt-0.5">
                <button
                  type="button"
                  onClick={() => setExpanded((s) => ({ ...s, [entry.label]: !s[entry.label] }))}
                  aria-expanded={isOpen}
                  className={`${linkBase} w-full ${childActive ? 'text-sidebar-ink font-medium hover:bg-sidebar-raised' : linkState(false)}`}
                >
                  <Icon name={entry.icon} className="text-lg shrink-0" />
                  <span>{entry.label}</span>
                  <Icon
                    name="ri-arrow-right-s-line"
                    className={`ml-auto text-base text-sidebar-ink-2 transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`}
                  />
                </button>
                {isOpen && (
                  <ul className="pl-[58px] pt-1 pb-2">
                    {children.map((c) => (
                      <li key={c.to}>
                        <NavLink
                          to={c.to}
                          onClick={isMobile ? onClose : undefined}
                          className={({ isActive }) =>
                            `flex items-center gap-3 py-2 text-[13px] transition-colors ${
                              isActive ? 'text-sidebar-accent font-medium' : 'text-sidebar-ink-2 hover:text-sidebar-ink'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <span className={`w-[2px] h-3 ${isActive ? 'bg-sidebar-accent' : 'bg-sidebar-line'}`} />
                              {c.label}
                            </>
                          )}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            )
          })}
          {visibleEntries.length === 0 && (
            <li className="px-6 py-3 text-xs text-sidebar-ink-2">No menu matches "{query}"</li>
          )}
        </ul>

      </nav>
    </>
  )
}

export default Sidebar
