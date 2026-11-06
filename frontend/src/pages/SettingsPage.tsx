import { useThemeStore } from '@/stores/themeStore'
import { useSidebarStore } from '@/stores/sidebarStore'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Sun, Moon, Layout, Menu, Database, Languages } from 'lucide-react'
import { clsx } from 'clsx'
import { useI18n } from '@/i18n/useI18n'
import type { Locale } from '@/stores/localeStore'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

export function SettingsPage() {
  const { theme, setTheme } = useThemeStore()
  const { isCollapsed, setCollapsed } = useSidebarStore()
  const { locale, setLocale, t } = useI18n()
  const themes = {
    light: { label: t.settings.light, hint: t.settings.lightHint },
    dark: { label: t.settings.dark, hint: t.settings.darkHint },
    system: { label: t.settings.system, hint: t.settings.systemHint },
  } as const
  const languages: { code: Locale; label: string }[] = [
    { code: 'fr', label: t.language.french },
    { code: 'en', label: t.language.english },
  ]

  return (
    <div className="space-y-6 animate-in max-w-4xl">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.settings.title}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t.settings.subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <Languages className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.language.title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.language.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {languages.map((language) => (
              <button
                key={language.code}
                type="button"
                aria-pressed={locale === language.code}
                onClick={() => setLocale(language.code)}
                className={clsx(
                  'p-4 rounded-xl border-2 transition-all text-left',
                  locale === language.code
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <p className="font-medium text-gray-900 dark:text-white">{language.label}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{language.code.toUpperCase()}</p>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg">
              <Sun className="h-5 w-5 text-secondary-600 dark:text-secondary-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.settings.appearance}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.settings.appearanceHint}</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['light', 'dark', 'system'] as const).map((themeName) => (
              <button
                key={themeName}
                onClick={() => setTheme(themeName as 'light' | 'dark')}
                className={clsx(
                  'p-4 rounded-xl border-2 transition-all text-left',
                  theme === themeName
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={clsx('p-2 rounded-lg', theme === themeName ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-gray-100 dark:bg-gray-800')}>
                    {themeName === 'light' && <Sun className="h-5 w-5 text-yellow-600" />}
                    {themeName === 'dark' && <Moon className="h-5 w-5 text-blue-600" />}
                    {themeName === 'system' && <Layout className="h-5 w-5 text-gray-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{themes[themeName].label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{themes[themeName].hint}</p>
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.settings.interface}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.settings.interfaceHint}</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{t.settings.collapsed}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t.settings.collapsedHint}</p>
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.settings.systemInfo}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t.settings.systemInfoHint}</p>
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">{t.settings.version}</dt>
              <dd className="font-medium text-gray-900 dark:text-white font-mono">0.1.0</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">{t.settings.mode}</dt>
              <dd className="font-medium text-gray-900 dark:text-white font-mono">{import.meta.env.MODE}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">{t.settings.api}</dt>
              <dd className="font-medium text-gray-900 dark:text-white font-mono break-all">{apiBaseUrl}</dd>
            </div>
          </dl>
        </CardBody>
      </Card>
    </div>
  )
}