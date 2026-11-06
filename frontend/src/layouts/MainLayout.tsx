import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { useSidebarStore } from '@/stores/sidebarStore'

export function MainLayout() {
  const { isCollapsed, toggleSidebar } = useSidebarStore()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar isCollapsed={isCollapsed} />
      <div
        className={`transition-all duration-300 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}
      >
        <Header onMenuClick={toggleSidebar} />
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}