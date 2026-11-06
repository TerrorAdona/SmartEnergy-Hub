import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Zap,
  BarChart3,
  AlertTriangle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bolt,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useSidebarStore } from '@/stores/sidebarStore'
import { useI18n } from '@/i18n/useI18n'

const navigation = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'equipment', href: '/equipment', icon: Zap },
  { key: 'measurements', href: '/measurements', icon: BarChart3 },
  { key: 'alerts', href: '/alerts', icon: AlertTriangle },
  { key: 'settings', href: '/settings', icon: Settings },
] as const

export function Sidebar({ isCollapsed }: { isCollapsed: boolean }) {
  const { toggleSidebar } = useSidebarStore()
  const { t } = useI18n()

  return (
    <aside
      className={clsx(
        'fixed top-0 left-0 z-40 h-screen bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-700 transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div
          className={clsx(
            'flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700',
            isCollapsed && 'justify-center px-0'
          )}
        >
          {!isCollapsed && (
            <NavLink to="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
                <Bolt className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-lg text-gray-900 dark:text-white">
                SmartEnergy
              </span>
            </NavLink>
          )}
          {isCollapsed && (
            <NavLink to="/dashboard" className="flex h-8 w-8 items-center justify-center mx-auto">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
                <Bolt className="h-5 w-5 text-white" />
              </div>
            </NavLink>
          )}
          <button
            onClick={toggleSidebar}
            className={clsx(
              'flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
              isCollapsed && 'mx-auto'
            )}
            aria-label={isCollapsed ? t.nav.expand : t.nav.collapse}
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto" aria-label={t.nav.main}>
          {!isCollapsed ? (
            navigation.map((item) => (
              <NavLink
                key={item.key}
                to={item.href}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                  )
                }
              >
                <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                <span>{t.nav[item.key]}</span>
              </NavLink>
            ))
          ) : (
            navigation.map((item) => (
              <NavLink
                key={item.key}
                to={item.href}
                className={({ isActive }) =>
                  clsx(
                    'flex h-10 w-10 items-center justify-center mx-auto rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'text-gray-500 hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-gray-800'
                  )
                }
                title={t.nav[item.key]}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </NavLink>
            ))
          )}
        </nav>

        {/* Footer */}
        <div
          className={clsx(
            'p-3 border-t border-gray-200 dark:border-gray-700',
            isCollapsed && 'hidden'
          )}
        >
          <div className="flex items-center gap-3 px-3 py-2 text-xs text-gray-500">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              <Bolt className="h-3.5 w-3.5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">SmartEnergy Hub</p>
              <p className="truncate">v0.1.0-dev</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}