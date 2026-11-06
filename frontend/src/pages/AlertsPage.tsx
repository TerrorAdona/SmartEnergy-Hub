import { useState } from 'react'
import { Bell, CheckCircle, XCircle, Search } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'

const severities = ['CRITICAL', 'WARNING', 'INFO']
const statuses = ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED']

const mockAlerts = [
  { id: 'ALT-001', severity: 'CRITICAL', sensorId: 'SENSOR-001', equipment: 'Main Building Meter', message: 'Power exceeded 100kW critical threshold', value: 102.5, threshold: 100, unit: 'kW', status: 'ACTIVE', triggeredAt: '2026-11-05T10:15:00Z', acknowledgedAt: null, acknowledgedBy: null },
  { id: 'ALT-002', severity: 'WARNING', sensorId: 'SENSOR-002', equipment: 'Main Building Meter', message: 'Voltage below 210V warning threshold', value: 208.3, threshold: 210, unit: 'V', status: 'ACTIVE', triggeredAt: '2026-11-05T09:45:00Z', acknowledgedAt: null, acknowledgedBy: null },
  { id: 'ALT-003', severity: 'WARNING', sensorId: 'SENSOR-007', equipment: 'Battery Storage', message: 'Battery SOC below 20%', value: 18, threshold: 20, unit: '%', status: 'ACKNOWLEDGED', triggeredAt: '2026-11-05T08:30:00Z', acknowledgedAt: '2026-11-05T08:35:00Z', acknowledgedBy: 'operator1' },
  { id: 'ALT-004', severity: 'INFO', sensorId: 'SENSOR-005', equipment: 'Solar Inverter 1', message: 'Daily energy yield recorded', value: 45.2, threshold: 0, unit: 'kWh', status: 'RESOLVED', triggeredAt: '2026-11-04T23:59:00Z', acknowledgedAt: '2026-11-05T00:05:00Z', acknowledgedBy: 'system' },
  { id: 'ALT-005', severity: 'CRITICAL', sensorId: 'SENSOR-004', equipment: 'Solar Inverter 1', message: 'Power output dropped to 0', value: 0, threshold: 1000, unit: 'W', status: 'ACTIVE', triggeredAt: '2026-11-05T10:25:00Z', acknowledgedAt: null, acknowledgedBy: null },
]

export function AlertsPage() {
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAckModal, setShowAckModal] = useState(false)
  const [acknowledgingAlert, setAcknowledgingAlert] = useState<typeof mockAlerts[0] | null>(null)

  const filteredAlerts = mockAlerts.filter((alert) => {
    const matchesSearch = alert.id.toLowerCase().includes(search.toLowerCase()) ||
      alert.equipment.toLowerCase().includes(search.toLowerCase()) ||
      alert.message.toLowerCase().includes(search.toLowerCase())
    const matchesSeverity = !severityFilter || alert.severity === severityFilter
    const matchesStatus = !statusFilter || alert.status === statusFilter
    return matchesSearch && matchesSeverity && matchesStatus
  })

  const getSeverityBadge = (severity: string) => {
    const variants = { CRITICAL: 'danger' as const, WARNING: 'warning' as const, INFO: 'info' as const }
    return variants[severity as keyof typeof variants] || 'gray'
  }

  const getStatusBadge = (status: string) => {
    const variants = { ACTIVE: 'danger' as const, ACKNOWLEDGED: 'warning' as const, RESOLVED: 'success' as const }
    return variants[status as keyof typeof variants] || 'gray'
  }

  const handleAcknowledge = (alert: typeof mockAlerts[0]) => {
    setAcknowledgingAlert(alert)
    setShowAckModal(true)
  }

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const activeCount = mockAlerts.filter(a => a.status === 'ACTIVE').length
  const criticalCount = mockAlerts.filter(a => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length

  return (
    <div className="space-y-6 animate-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alerts</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Monitor and manage system alerts</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="danger" className="text-sm px-3 py-1">
            <Bell className="h-3 w-3 mr-1" />
            {activeCount} Active
          </Badge>
          <Badge variant={criticalCount > 0 ? 'danger' : 'success'} className="text-sm px-3 py-1">
            {criticalCount} Critical
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search alerts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="input w-[140px]">
                <option value="">All Severities</option>
                {severities.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-[160px]">
                <option value="">All Statuses</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Alerts Table */}
      <Card>
        <CardBody className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Equipment / Sensor</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Value / Threshold</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Triggered</TableHead>
                <TableHead>Acknowledged</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.map((alert) => (
                <TableRow key={alert.id} className={alert.severity === 'CRITICAL' && alert.status === 'ACTIVE' ? 'bg-danger-50/50 dark:bg-danger-900/10' : ''}>
                  <TableCell className="font-mono text-sm font-medium">{alert.id}</TableCell>
                  <TableCell><Badge variant={getSeverityBadge(alert.severity)}>{alert.severity}</Badge></TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{alert.equipment}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{alert.sensorId}</p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={alert.message}>{alert.message}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {alert.value} {alert.unit} / {alert.threshold} {alert.unit}
                  </TableCell>
                  <TableCell><Badge variant={getStatusBadge(alert.status)}>{alert.status}</Badge></TableCell>
                  <TableCell className="text-sm">{formatTimestamp(alert.triggeredAt)}</TableCell>
                  <TableCell className="text-sm text-gray-500 dark:text-gray-400">
                    {alert.acknowledgedAt ? formatTimestamp(alert.acknowledgedAt) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {alert.status === 'ACTIVE' && (
                        <Button variant="outline" size="sm" onClick={() => handleAcknowledge(alert)}>
                          <CheckCircle className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {alert.status !== 'RESOLVED' && (
                        <Button variant="ghost" size="sm" color="danger">
                          <XCircle className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAlerts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No alerts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Acknowledge Modal */}
      <Modal
        isOpen={showAckModal}
        onClose={() => { setShowAckModal(false); setAcknowledgingAlert(null); }}
        title="Acknowledge Alert"
        description={`Alert ${acknowledgingAlert?.id}`}
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to acknowledge this alert? This will change its status to ACKNOWLEDGED.
          </p>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm">
            <p className="font-medium">{acknowledgingAlert?.message}</p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Value: {acknowledgingAlert?.value} {acknowledgingAlert?.unit} | Threshold: {acknowledgingAlert?.threshold} {acknowledgingAlert?.unit}
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button variant="outline" onClick={() => { setShowAckModal(false); setAcknowledgingAlert(null); }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowAckModal(false)
                setAcknowledgingAlert(null)
              }}
            >
              <CheckCircle className="h-4 w-4" />
              Acknowledge
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}