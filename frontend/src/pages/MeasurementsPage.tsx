import { useState } from 'react'
import { Calendar, Download, RefreshCw, Search } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { clsx } from 'clsx'

const sensorTypes = ['POWER', 'VOLTAGE', 'CURRENT', 'ENERGY', 'FREQUENCY', 'POWER_FACTOR', 'TEMPERATURE', 'HUMIDITY', 'IRRADIANCE', 'WIND_SPEED']
const qualities = ['GOOD', 'UNCERTAIN', 'BAD']

const mockMeasurements = [
  { id: '1', sensorId: 'SENSOR-001', equipment: 'Main Building Meter', type: 'POWER', value: 85.2, unit: 'kW', quality: 'GOOD', timestamp: '2026-11-05T10:30:00Z' },
  { id: '2', sensorId: 'SENSOR-002', equipment: 'Main Building Meter', type: 'VOLTAGE', value: 232.5, unit: 'V', quality: 'GOOD', timestamp: '2026-11-05T10:30:00Z' },
  { id: '3', sensorId: 'SENSOR-003', equipment: 'Main Building Meter', type: 'CURRENT', value: 124.8, unit: 'A', quality: 'GOOD', timestamp: '2026-11-05T10:30:00Z' },
  { id: '4', sensorId: 'SENSOR-004', equipment: 'Solar Inverter 1', type: 'POWER', value: 45.2, unit: 'kW', quality: 'GOOD', timestamp: '2026-11-05T10:29:45Z' },
  { id: '5', sensorId: 'SENSOR-005', equipment: 'Solar Inverter 1', type: 'ENERGY', value: 1245.7, unit: 'kWh', quality: 'GOOD', timestamp: '2026-11-05T10:29:45Z' },
  { id: '6', sensorId: 'SENSOR-006', equipment: 'Battery Storage', type: 'POWER', value: -5.8, unit: 'kW', quality: 'GOOD', timestamp: '2026-11-05T10:30:00Z' },
  { id: '7', sensorId: 'SENSOR-007', equipment: 'Battery Storage', type: 'ENERGY', value: 78, unit: '%', quality: 'UNCERTAIN', timestamp: '2026-11-05T10:30:00Z' },
  { id: '8', sensorId: 'SENSOR-008', equipment: 'PV Panel Array A', type: 'IRRADIANCE', value: 850, unit: 'W/m²', quality: 'GOOD', timestamp: '2026-11-05T10:29:30Z' },
]

export function MeasurementsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [qualityFilter, setQualityFilter] = useState('')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'timestamp', direction: 'desc' })
  const [isLoading, setIsLoading] = useState(false)

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const sortedMeasurements = [...mockMeasurements].sort((a, b) => {
    const aVal = a[sortConfig.key as keyof typeof a]
    const bVal = b[sortConfig.key as keyof typeof b]
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const filteredMeasurements = sortedMeasurements.filter((m) => {
    const matchesSearch = m.sensorId.toLowerCase().includes(search.toLowerCase()) ||
      m.equipment.toLowerCase().includes(search.toLowerCase())
    const matchesType = !typeFilter || m.type === typeFilter
    const matchesQuality = !qualityFilter || m.quality === qualityFilter
    return matchesSearch && matchesType && matchesQuality
  })

  const getQualityBadge = (quality: string) => {
    const variants = { GOOD: 'success' as const, UNCERTAIN: 'warning' as const, BAD: 'danger' as const }
    return variants[quality as keyof typeof variants] || 'gray'
  }

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const handleExport = () => {
    return
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Measurements</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time and historical sensor data</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsLoading(true)} disabled={isLoading}>
            <RefreshCw className={clsx('h-4 w-4', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search sensor, equipment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input w-[160px]">
                <option value="">All Types</option>
                {sensorTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <select value={qualityFilter} onChange={(e) => setQualityFilter(e.target.value)} className="input w-[140px]">
                <option value="">All Quality</option>
                {qualities.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                  className="w-36"
                  placeholder="From"
                />
                <span className="text-gray-400">to</span>
                <Input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                  className="w-36"
                  placeholder="To"
                />
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Measurements Table */}
      <Card>
        <CardBody className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {[
                  { key: 'timestamp', label: 'Timestamp' },
                  { key: 'sensorId', label: 'Sensor' },
                  { key: 'equipment', label: 'Equipment' },
                  { key: 'type', label: 'Type' },
                  { key: 'value', label: 'Value', align: 'right' },
                  { key: 'unit', label: 'Unit' },
                  { key: 'quality', label: 'Quality' },
                ].map((col) => (
                  <TableHead
                    key={col.key}
                    className={clsx('cursor-pointer select-none', col.align === 'right' && 'text-right')}
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortConfig.key === col.key && (
                        sortConfig.direction === 'asc' ? (
                          <span className="text-primary-600">▲</span>
                        ) : (
                          <span className="text-primary-600">▼</span>
                        )
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMeasurements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-sm">{formatTimestamp(m.timestamp)}</TableCell>
                  <TableCell className="font-mono text-sm">{m.sensorId}</TableCell>
                  <TableCell>{m.equipment}</TableCell>
                  <TableCell><Badge variant="info">{m.type}</Badge></TableCell>
                  <TableCell className="text-right font-mono font-medium">
                    {m.value >= 1000 ? (m.value / 1000).toFixed(2) + 'k' : m.value.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400">{m.unit}</TableCell>
                  <TableCell><Badge variant={getQualityBadge(m.quality)}>{m.quality}</Badge></TableCell>
                </TableRow>
              ))}
              {filteredMeasurements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No measurements found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredMeasurements.length} of {mockMeasurements.length} measurements
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>Previous</Button>
          <Button variant="outline" size="sm" disabled>Next</Button>
        </div>
      </div>
    </div>
  )
}