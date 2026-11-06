import { useState } from 'react'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Modal } from '@/components/ui/Modal'

const equipmentTypes = ['METER', 'INVERTER', 'BATTERY', 'PV_PANEL', 'WIND_TURBINE', 'GRID_CONNECTION', 'LOAD', 'SENSOR_GATEWAY']
const statuses = ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DECOMMISSIONED']

const mockEquipment = [
  { equipmentId: 'EQ-001', name: 'Main Building Meter', type: 'METER', location: 'Main / Ground / Electrical Room', status: 'ACTIVE', metadata: { manufacturer: 'Schneider Electric', model: 'PM5560' } },
  { equipmentId: 'EQ-002', name: 'Solar Inverter 1', type: 'INVERTER', location: 'Rooftop / Roof', status: 'ACTIVE', metadata: { manufacturer: 'Fronius', model: 'Symo 10.0-3-M' } },
  { equipmentId: 'EQ-003', name: 'Battery Storage', type: 'BATTERY', location: 'Main / Basement / Battery Room', status: 'ACTIVE', metadata: { manufacturer: 'Tesla', model: 'Powerwall 2' } },
  { equipmentId: 'EQ-004', name: 'PV Panel Array A', type: 'PV_PANEL', location: 'Rooftop / Section A', status: 'ACTIVE', metadata: { manufacturer: 'SunPower', model: 'Maxeon 3' } },
  { equipmentId: 'EQ-005', name: 'Grid Connection', type: 'GRID_CONNECTION', location: 'Main / Ground / Transformer Room', status: 'MAINTENANCE', metadata: { manufacturer: 'ABB', model: 'TXpert' } },
]

export function EquipmentPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<typeof mockEquipment[0] | null>(null)

  const filteredEquipment = mockEquipment.filter((eq) => {
    const matchesSearch = eq.name.toLowerCase().includes(search.toLowerCase()) ||
      eq.equipmentId.toLowerCase().includes(search.toLowerCase())
    const matchesType = !typeFilter || eq.type === typeFilter
    const matchesStatus = !statusFilter || eq.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: 'success' as const,
      INACTIVE: 'gray' as const,
      MAINTENANCE: 'warning' as const,
      DECOMMISSIONED: 'danger' as const,
    }
    return variants[status as keyof typeof variants] || 'gray'
  }

  const handleEdit = (eq: typeof mockEquipment[0]) => {
    setEditingEquipment(eq)
    setShowModal(true)
  }

  const handleDelete = (id: string) => {
    if (confirm(`Delete equipment ${id}?`)) {
      console.log('Delete:', id)
    }
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Equipment Registry</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage energy equipment and sensors</p>
        </div>
        <Button onClick={() => { setEditingEquipment(null); setShowModal(true); }}>
          <Plus className="h-4 w-4" />
          Add Equipment
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search equipment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input w-[180px]"
              >
                <option value="">All Types</option>
                {equipmentTypes.map((type) => (
                  <option key={type} value={type}>{type.replace('_', ' ')}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-[180px]"
              >
                <option value="">All Statuses</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Equipment Table */}
      <Card>
        <CardBody className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipment.map((eq) => (
                <TableRow key={eq.equipmentId}>
                  <TableCell className="font-mono text-sm">{eq.equipmentId}</TableCell>
                  <TableCell className="font-medium">{eq.name}</TableCell>
                  <TableCell>
                    <Badge variant="info">{eq.type.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400 text-sm">{eq.location}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(eq.status)}>{eq.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(eq)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(eq.equipmentId)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEquipment.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No equipment found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingEquipment(null); }}
        title={editingEquipment ? 'Edit Equipment' : 'Add Equipment'}
        size="lg"
      >
        <EquipmentForm
          initialData={editingEquipment}
          onSubmit={(data) => {
            console.log('Submit:', data)
            setShowModal(false)
            setEditingEquipment(null)
          }}
          onCancel={() => { setShowModal(false); setEditingEquipment(null); }}
        />
      </Modal>
    </div>
  )
}

interface EquipmentFormProps {
  initialData: typeof mockEquipment[0] | null
  onSubmit: (data: any) => void
  onCancel: () => void
}

function EquipmentForm({ initialData, onSubmit, onCancel }: EquipmentFormProps) {
  const [formData, setFormData] = useState({
    equipmentId: initialData?.equipmentId || '',
    name: initialData?.name || '',
    type: initialData?.type || 'METER',
    location: initialData?.location || '',
    status: initialData?.status || 'ACTIVE',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {!initialData && (
          <Input
            label="Equipment ID"
            value={formData.equipmentId}
            onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
            placeholder="EQ-006"
            required
          />
        )}
        <Input
          label="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Equipment name"
          required
        />
        <div className="sm:col-span-2">
          <label className="label">Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="input"
          >
            {equipmentTypes.map((type) => (
              <option key={type} value={type}>{type.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <Input
          label="Location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Site / Building / Floor / Room"
        />
        <div className="sm:col-span-2">
          <label className="label">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="input"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">{initialData ? 'Update' : 'Create'}</Button>
      </div>
    </form>
  )
}