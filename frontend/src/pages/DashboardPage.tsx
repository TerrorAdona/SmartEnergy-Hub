import { Bolt, TrendingUp, TrendingDown, AlertTriangle, Activity } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { clsx } from 'clsx'

const stats = [
  { name: 'Total Power', value: '124.5 kW', change: '+2.3%', trend: 'up', icon: Bolt, color: 'text-primary-600', bg: 'bg-primary-100 dark:bg-primary-900/30' },
  { name: 'Solar Generation', value: '45.2 kW', change: '+5.1%', trend: 'up', icon: TrendingUp, color: 'text-warning-600', bg: 'bg-warning-100 dark:bg-warning-900/30' },
  { name: 'Battery Level', value: '78%', change: '-1.2%', trend: 'down', icon: Activity, color: 'text-secondary-600', bg: 'bg-secondary-100 dark:bg-secondary-900/30' },
  { name: 'Active Alerts', value: '3', change: '1 critical', trend: 'up', icon: AlertTriangle, color: 'text-danger-600', bg: 'bg-danger-100 dark:bg-danger-900/30' },
]

const recentAlerts = [
  { id: 1, severity: 'CRITICAL', message: 'EQ-001: Power exceeded 100kW threshold', time: '2 min ago', equipment: 'Main Building Meter' },
  { id: 2, severity: 'WARNING', message: 'SENSOR-004: Voltage below 210V', time: '15 min ago', equipment: 'Solar Inverter 1' },
  { id: 3, severity: 'WARNING', message: 'EQ-003: Battery SOC below 20%', time: '1 hour ago', equipment: 'Battery Storage' },
]

const equipmentStatus = [
  { id: 'EQ-001', name: 'Main Building Meter', type: 'METER', status: 'ACTIVE', power: '85.2 kW' },
  { id: 'EQ-002', name: 'Solar Inverter 1', type: 'INVERTER', status: 'ACTIVE', power: '45.2 kW' },
  { id: 'EQ-003', name: 'Battery Storage', type: 'BATTERY', status: 'ACTIVE', power: '-5.8 kW' },
]

export function DashboardPage() {
  return (
    <div className="space-y-6 animate-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time energy monitoring overview</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardBody className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {stat.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={clsx('text-sm font-medium', stat.trend === 'up' ? 'text-green-600' : 'text-red-600')}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={clsx('p-3 rounded-xl', stat.bg)}>
                  <stat.icon className={clsx('h-6 w-6', stat.color)} />
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Power Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Power Consumption (24h)</h2>
              <Badge variant="success">Live</Badge>
            </div>
          </CardHeader>
          <CardBody>
            <div className="h-64 flex items-end justify-around px-2">
              {[45, 52, 48, 65, 78, 92, 88, 95, 102, 98, 87, 75, 68, 72, 85, 92, 88, 76, 65, 58, 52, 48, 45, 42].map((value, index) => (
                <div key={index} className="flex-1 max-w-[40px] flex flex-col items-center">
                  <div
                    className="w-full bg-primary-500 rounded-t transition-all duration-300 hover:bg-primary-400"
                    style={{ height: `${value}%` }}
                    title={`${value} kW`}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{index % 6 === 0 ? `${index}h` : ''}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Energy Mix */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Energy Mix</h2>
          </CardHeader>
          <CardBody>
            <div className="h-64 flex items-center justify-center">
              <div className="relative w-48 h-48">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="16"
                    className="dark:stroke-gray-700"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="16"
                    strokeDasharray="150.8"
                    strokeDashoffset="60.3"
                    strokeLinecap="round"
                    className="text-primary-500"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="16"
                    strokeDasharray="150.8"
                    strokeDashoffset="100.5"
                    strokeLinecap="round"
                    className="text-warning-500"
                    style={{ strokeDasharray: '150.8', strokeDashoffset: '100.5' }}
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="16"
                    strokeDasharray="150.8"
                    strokeDashoffset="130.7"
                    strokeLinecap="round"
                    className="text-secondary-500"
                    style={{ strokeDasharray: '150.8', strokeDashoffset: '130.7' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">131 kW</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
                </div>
              </div>
              <div className="ml-8 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-primary-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Grid (65%)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-warning-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Solar (25%)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-secondary-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Battery (10%)</span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Alerts</h2>
              <a href="/alerts" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400">
                View all
              </a>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="flex items-start gap-3">
                    <Badge variant={alert.severity === 'CRITICAL' ? 'danger' : 'warning'}>
                      {alert.severity}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{alert.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{alert.equipment} • {alert.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Equipment Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Equipment Status</h2>
              <a href="/equipment" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400">
                View all
              </a>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {equipmentStatus.map((eq) => (
                <div key={eq.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-2 w-2 rounded-full bg-green-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{eq.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{eq.type} • {eq.power}</p>
                      </div>
                    </div>
                    <Badge variant="success">{eq.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}