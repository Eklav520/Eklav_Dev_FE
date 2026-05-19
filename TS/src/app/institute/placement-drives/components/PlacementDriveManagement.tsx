import { useEffect, useState } from 'react'
import { Alert, Button, Container } from 'react-bootstrap'
import {
  FaBriefcase,
  FaBuilding,
  FaCalendarAlt,
  FaChartBar,
  FaEdit,
  FaFileUpload,
  FaPlus,
  FaTrash,
  FaUsers,
} from 'react-icons/fa'
import axios from 'axios'
import { useAuthContext } from '@/context/useAuthContext'
import CreateDriveModal from './CreateDriveModal'
import DriveStudentsModal from './DriveStudentsModal'
import BulkUploadModal from './BulkUploadModal'
import EditDriveModal from './EditDriveModal'
import DriveChartsModal from './DriveChartsModal'

export interface PlacementRound {
  name: string
  order: number
}

export interface PlacementDriveStats {
  total: number
  placed: number
  eliminated: number
  inProgress: number
}

export interface PlacementDrive {
  _id: string
  companyName: string
  role: string
  package: string
  location: string
  driveDate: string | null
  cutoffScore: number
  backlogPolicy: 'none' | 'limited' | 'any'
  maxBacklogs: number
  rounds: PlacementRound[]
  status: 'upcoming' | 'ongoing' | 'completed'
  stats: PlacementDriveStats
  createdAt: string
}

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  upcoming:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Upcoming'  },
  ongoing:   { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   label: 'Ongoing'   },
  completed: { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', label: 'Completed' },
}

const COMPANY_COLORS = [
  '#ff7a00', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b',
]

const getCompanyColor = (name: string) =>
  COMPANY_COLORS[name.charCodeAt(0) % COMPANY_COLORS.length]

const PlacementDriveManagement = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [drives, setDrives]           = useState<PlacementDrive[]>([])
  const [loading, setLoading]         = useState(false)
  const [showCreate, setShowCreate]   = useState(false)
  const [successMsg, setSuccessMsg]   = useState('')
  const [selectedDrive, setSelectedDrive] = useState<PlacementDrive | null>(null)
  const [showStudents, setShowStudents]   = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [showEdit, setShowEdit]           = useState(false)
  const [showCharts, setShowCharts]       = useState(false)

  const authHeader = { Authorization: `Bearer ${user?.token}` }

  const fetchDrives = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${baseURL}/api/placement-drives`, { headers: authHeader })
      setDrives(res.data.drives)
    } catch (err) {
      console.error('Fetch drives error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDrives() }, [])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this placement drive and all student records?')) return
    try {
      await axios.delete(`${baseURL}/api/placement-drives/${id}`, { headers: authHeader })
      fetchDrives()
    } catch (err) {
      console.error('Delete drive error:', err)
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await axios.patch(
        `${baseURL}/api/placement-drives/${id}/status`,
        { status },
        { headers: authHeader }
      )
      fetchDrives()
    } catch (err) {
      console.error('Status change error:', err)
    }
  }

  // Summary counts
  const summary = {
    total:     drives.length,
    upcoming:  drives.filter((d) => d.status === 'upcoming').length,
    ongoing:   drives.filter((d) => d.status === 'ongoing').length,
    completed: drives.filter((d) => d.status === 'completed').length,
  }

  return (
    <Container fluid className="p-4">

      {successMsg && (
        <Alert variant="success" dismissible onClose={() => setSuccessMsg('')} className="mb-3">
          {successMsg}
        </Alert>
      )}

      {/* ── PAGE HEADER ── */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h4 className="text-white fw-bold mb-1">Placement Drives</h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
            Manage campus placement drives, eligible students, and round progress
          </p>
        </div>
        <Button
          style={{ backgroundColor: '#ff7a00', borderColor: '#ff7a00', color: '#fff', fontWeight: 600 }}
          onClick={() => setShowCreate(true)}
        >
          <FaPlus className="me-2" />
          New Drive
        </Button>
      </div>

      {/* ── STAT CARDS ── */}
      <div className="d-flex gap-3 mb-4 flex-wrap">
        {[
          { label: 'Total Drives', value: summary.total,     color: '#ff7a00', icon: <FaBriefcase /> },
          { label: 'Upcoming',     value: summary.upcoming,  color: '#f59e0b', icon: <FaCalendarAlt /> },
          { label: 'Ongoing',      value: summary.ongoing,   color: '#22c55e', icon: <FaBuilding />    },
          { label: 'Completed',    value: summary.completed, color: '#6b7280', icon: <FaUsers />       },
        ].map(({ label, value, color, icon }) => (
          <div
            key={label}
            style={{
              background: '#1a1a1a', border: '1px solid #2a2a2a',
              borderRadius: 12, padding: '14px 20px',
              display: 'flex', alignItems: 'center', gap: 14, flex: '1 1 160px',
            }}
          >
            <div
              style={{
                width: 44, height: 44, borderRadius: 10, flexShrink: 0,
                background: `${color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color, fontSize: '1.15rem',
              }}
            >
              {icon}
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#777', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {label}
              </div>
              <div style={{ fontSize: '1.7rem', fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>
                {value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── TABLE CARD ── */}
      <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 14, overflow: 'hidden' }}>

        {loading ? (
          <div className="text-center text-muted py-5">Loading drives...</div>
        ) : drives.length === 0 ? (
          <div className="text-center text-muted py-5">
            <FaBuilding size={36} className="mb-3 opacity-50" />
            <p>No placement drives yet. Create one to get started.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.855rem' }}>
              <thead>
                <tr style={{ background: '#0d0d0d', borderBottom: '2px solid #1f1f1f' }}>
                  {['Company', 'Role / Package', 'Drive Date', 'Cutoff', 'Students', 'Status', 'Actions'].map((h) => (
                    <th
                      key={h}
                      style={{
                        color: '#ff7a00', fontWeight: 700, padding: '13px 16px',
                        textAlign: 'left', whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {drives.map((drive, idx) => {
                  const companyColor  = getCompanyColor(drive.companyName)
                  const initials      = drive.companyName.slice(0, 2).toUpperCase()
                  const st            = STATUS_STYLE[drive.status]
                  const cutoff        = Number.isInteger(drive.cutoffScore)
                    ? drive.cutoffScore
                    : drive.cutoffScore.toFixed(1)

                  return (
                    <tr
                      key={drive._id}
                      style={{
                        borderBottom: '1px solid #1a1a1a',
                        background: idx % 2 === 0 ? 'transparent' : '#0c0c0c',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#161616')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : '#0c0c0c')}
                    >
                      {/* Company */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            style={{
                              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                              background: `${companyColor}22`, border: `1px solid ${companyColor}44`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: companyColor, fontWeight: 700, fontSize: '0.78rem',
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div style={{ color: '#fff', fontWeight: 600 }}>{drive.companyName}</div>
                            {drive.location && (
                              <div style={{ color: '#666', fontSize: '0.75rem' }}>{drive.location}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role / Package */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <div style={{ color: '#ddd' }}>{drive.role || <span style={{ color: '#444' }}>—</span>}</div>
                        {drive.package && (
                          <span
                            style={{
                              display: 'inline-block', marginTop: 4,
                              background: 'rgba(34,197,94,0.12)', color: '#22c55e',
                              border: '1px solid rgba(34,197,94,0.25)',
                              borderRadius: 20, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 600,
                            }}
                          >
                            {drive.package}
                          </span>
                        )}
                      </td>

                      {/* Drive Date */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        {drive.driveDate ? (
                          <div>
                            <div style={{ color: '#ddd' }}>
                              {new Date(drive.driveDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                            <div style={{ color: '#555', fontSize: '0.72rem' }}>
                              {new Date(drive.driveDate).toLocaleDateString('en-IN', { weekday: 'short' })}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#444' }}>—</span>
                        )}
                      </td>

                      {/* Cutoff */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            background: 'rgba(255,122,0,0.1)', color: '#ff7a00',
                            border: '1px solid rgba(255,122,0,0.25)',
                            borderRadius: 20, padding: '2px 10px', fontWeight: 700, fontSize: '0.85rem',
                          }}
                        >
                          {cutoff}
                        </span>
                      </td>

                      {/* Students */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <div style={{ color: '#60a5fa', fontWeight: 600 }}>
                          {drive.stats.total} <span style={{ color: '#555', fontWeight: 400, fontSize: '0.75rem' }}>enrolled</span>
                        </div>
                        <div className="d-flex gap-2 mt-1" style={{ fontSize: '0.72rem' }}>
                          {drive.stats.placed > 0 && (
                            <span style={{ color: '#22c55e' }}>✓ {drive.stats.placed} placed</span>
                          )}
                          {drive.stats.inProgress > 0 && (
                            <span style={{ color: '#f59e0b' }}>● {drive.stats.inProgress} active</span>
                          )}
                          {drive.stats.eliminated > 0 && (
                            <span style={{ color: '#6b7280' }}>✕ {drive.stats.eliminated} out</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <select
                          value={drive.status}
                          onChange={(e) => handleStatusChange(drive._id, e.target.value)}
                          style={{
                            background: st.bg,
                            color: st.color,
                            border: `1px solid ${st.color}44`,
                            borderRadius: 20,
                            padding: '4px 10px',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            outline: 'none',
                            appearance: 'auto',
                          }}
                        >
                          <option value="upcoming"  style={{ background: '#1a1a1a', color: '#f59e0b' }}>Upcoming</option>
                          <option value="ongoing"   style={{ background: '#1a1a1a', color: '#22c55e' }}>Ongoing</option>
                          <option value="completed" style={{ background: '#1a1a1a', color: '#6b7280' }}>Completed</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                        <div className="d-flex gap-2">
                          <ActionBtn
                            title="Manage Students"
                            color="#60a5fa"
                            onClick={() => { setSelectedDrive(drive); setShowStudents(true) }}
                          >
                            <FaUsers size={13} />
                          </ActionBtn>
                          <ActionBtn
                            title="View Analytics"
                            color="#a855f7"
                            onClick={() => { setSelectedDrive(drive); setShowCharts(true) }}
                          >
                            <FaChartBar size={13} />
                          </ActionBtn>
                          <ActionBtn
                            title="Bulk Upload Students"
                            color="#ff7a00"
                            onClick={() => { setSelectedDrive(drive); setShowBulkUpload(true) }}
                          >
                            <FaFileUpload size={13} />
                          </ActionBtn>
                          <ActionBtn
                            title="Edit Drive"
                            color="#f59e0b"
                            onClick={() => { setSelectedDrive(drive); setShowEdit(true) }}
                          >
                            <FaEdit size={13} />
                          </ActionBtn>
                          <ActionBtn
                            title="Delete Drive"
                            color="#ef4444"
                            onClick={() => handleDelete(drive._id)}
                          >
                            <FaTrash size={13} />
                          </ActionBtn>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      <CreateDriveModal
        show={showCreate}
        onHide={() => setShowCreate(false)}
        onCreated={(count) => {
          setShowCreate(false)
          setSuccessMsg(`Drive created! ${count} eligible student(s) notified via email.`)
          fetchDrives()
        }}
      />

      {selectedDrive && (
        <DriveStudentsModal
          show={showStudents}
          drive={selectedDrive}
          onHide={() => { setShowStudents(false); setSelectedDrive(null) }}
          onUpdated={fetchDrives}
        />
      )}

      {selectedDrive && (
        <BulkUploadModal
          show={showBulkUpload}
          drive={selectedDrive}
          onHide={() => { setShowBulkUpload(false); setSelectedDrive(null) }}
          onUploaded={() => {
            fetchDrives()
            setSuccessMsg('Students uploaded and enrolled successfully!')
          }}
        />
      )}

      {selectedDrive && (
        <EditDriveModal
          show={showEdit}
          drive={selectedDrive}
          onHide={() => { setShowEdit(false); setSelectedDrive(null) }}
          onSaved={() => {
            fetchDrives()
            setSuccessMsg('Drive updated successfully!')
          }}
        />
      )}

      {selectedDrive && (
        <DriveChartsModal
          show={showCharts}
          drive={selectedDrive}
          onHide={() => { setShowCharts(false); setSelectedDrive(null) }}
        />
      )}
    </Container>
  )
}

/* ── Icon action button ── */
const ActionBtn = ({
  children,
  title,
  color,
  onClick,
}: {
  children: React.ReactNode
  title: string
  color: string
  onClick: () => void
}) => (
  <button
    title={title}
    onClick={onClick}
    style={{
      width: 32, height: 32, borderRadius: 8,
      background: `${color}14`, border: `1px solid ${color}33`,
      color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', transition: 'all 0.15s',
    }}
    onMouseEnter={(e) => {
      const el = e.currentTarget
      el.style.background = `${color}28`
      el.style.borderColor = `${color}66`
    }}
    onMouseLeave={(e) => {
      const el = e.currentTarget
      el.style.background = `${color}14`
      el.style.borderColor = `${color}33`
    }}
  >
    {children}
  </button>
)

export default PlacementDriveManagement
