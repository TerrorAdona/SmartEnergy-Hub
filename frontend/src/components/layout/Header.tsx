import { Menu, Bell, Sun, Moon, User, LogOut, Settings } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { clsx } from 'clsx'
import { useThemeStore } from '@/stores/themeStore'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { SimulationControl } from '@/components/simulation/SimulationControl'
import { useI18n } from '@/i18n/useI18n'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const { theme, toggleTheme } = useThemeStore()
  const { t } = useI18n()

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left side - Mobile menu button */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={t.nav.openMenu}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          <SimulationControl />
          <LanguageSwitcher />
          <button
            onClick={toggleTheme}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={theme === 'dark' ? t.header.light : t.header.dark}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
              aria-label={t.header.notifications}
              aria-expanded={showNotifications}
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-white text-xs">
                3
              </span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg py-2 animate-in">
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t.header.notifications}</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {t.header.items.map((notif, index) => (
                    <div
                      key={notif.title}
                      className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 last:border-0"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={clsx(
                            'flex h-2 w-2 mt-1.5 rounded-full flex-shrink-0',
                            index === 1 && 'bg-danger-500',
                            index === 0 && 'bg-warning-500',
                            index === 2 && 'bg-secondary-500'
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{notif.message}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{notif.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                  <button className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 w-full text-left">
                    {t.header.viewAll}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label={t.header.userMenu}
              aria-expanded={showUserMenu}
            >
              <User className="h-5 w-5" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg py-2 animate-in">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Admin User</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">admin@smartenergy.local</p>
                </div>
                <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <User className="h-4 w-4" />
                  {t.header.profile}
                </button>
                <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <Settings className="h-4 w-4" />
                  {t.header.settings}
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
                <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-danger-600 dark:text-danger-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <LogOut className="h-4 w-4" />
                  {t.header.signOut}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}