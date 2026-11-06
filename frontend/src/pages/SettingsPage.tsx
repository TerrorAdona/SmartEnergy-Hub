import { useThemeStore } from '@/stores/themeStore'
import { useSidebarStore } from '@/stores/sidebarStore'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Sun, Moon, Layout, Menu, Bell, Database } from 'lucide-react'
import { clsx } from 'clsx'

export function SettingsPage() {
  const { theme, setTheme } = useThemeStore()
  const { isCollapsed, setCollapsed } = useSidebarStore()

  return (
    <div className="space-y-6 animate-in max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your preferences and system configuration</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg">
              <Sun className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Customize how SmartEnergy looks</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['light', 'dark', 'system'].map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t as 'light' | 'dark')}
                className={clsx(
                  'p-4 rounded-xl border-2 transition-all text-left',
                  theme === t
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={clsx('p-2 rounded-lg', theme === t ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-gray-100 dark:bg-gray-800')}>
                    {t === 'light' && <Sun className="h-5 w-5 text-yellow-600" />}
                    {t === 'dark' && <Moon className="h-5 w-5 text-blue-600" />}
                    {t === 'system' && <Layout className="h-5 w-5 text-gray-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white capitalize">{t}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t === 'light' && 'Always use light mode'}
                      {t === 'dark' && 'Always use dark mode'}
                      {t === 'system' && 'Match system preference'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* UI Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Menu className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">UI Preferences</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Interface behavior</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Collapsed Sidebar</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Keep sidebar collapsed by default</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCollapsed}
                  onChange={(e) => setCollapsed(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Compact Tables</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Reduce row padding in data tables</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning-100 dark:bg-warning-900/30 rounded-lg">
              <Bell className="h-5 w-5 text-warning-600 dark:text-warning-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Configure alert notifications</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {['Email', 'Browser Push', 'Webhook', 'Slack'].map((channel) => (
              <div key={channel} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{channel}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive alerts via {channel.toLowerCase()}</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={channel !== 'Slack'} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <Database className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">System Information</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Version and environment details</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Version</dt>
              <dd className="font-medium text-gray-900 dark:text-white font-mono">0.1.0-dev</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Environment</dt>
              <dd className="font-medium text-gray-900 dark:text-white">Development</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">API Base URL</dt>
              <dd className="font-medium text-gray-900 dark:text-white font-mono">http://localhost:8080/api/v1</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Node.js</dt>
              <dd className="font-medium text-gray-900 dark:text-white font-mono">26.13.0</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">React</dt>
              <dd className="font-medium text-gray-900 dark:text-white font-mono">18.3.1</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Build Tool</dt>
              <dd className="font-medium text-gray-900 dark:text-white font-mono">Vite 5.3.5</dd>
            </div>
          </dl>
        </CardBody>
      </Card>
    </div>
  )
}