import { useEffect, useRef, useState } from 'react'
import { Modal } from 'react-bootstrap'
import {
  FaBriefcase,
  FaBuilding,
  FaCalendarAlt,
  FaChartBar,
  FaCheckCircle,
  FaChevronDown,
  FaEdit,
  FaFileUpload,
  FaMapMarkerAlt,
  FaPlayCircle,
  FaPlus,
  FaSearch,
  FaSpinner,
  FaTimes,
  FaTrash,
  FaUserGraduate,
  FaUsers,
} from 'react-icons/fa'
import { AdminPage, PageHeader, StatCards, SearchInput, AdminSelect, EmptyState, initialsOf, type SelectOption } from '@/components/admin-ui'
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
  cutoffType: 'cgpa' | 'percentage'
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

const STATUS_FILTERS: SelectOption[] = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
]

/* "in 3 days" / "Today" / "5 days ago" for the drive date */
const relativeDay = (date: string | null) => {
  if (!date) return { label: '', soon: false }
  const start = new Date(); start.setHours(0, 0, 0, 0)
  const day = new Date(date); day.setHours(0, 0, 0, 0)
  const diff = Math.round((day.getTime() - start.getTime()) / 86400000)
  if (diff === 0) return { label: 'Today', soon: true }
  if (diff === 1) return { label: 'Tomorrow', soon: true }
  if (diff > 1) return { label: `in ${diff} days`, soon: diff <= 3 }
  return { label: diff === -1 ? 'Yesterday' : `${-diff} days ago`, soon: false }
}

const backlogText = (drive: PlacementDrive) =>
  drive.backlogPolicy === 'none' ? 'No backlogs allowed'
    : drive.backlogPolicy === 'limited' ? `Up to ${drive.maxBacklogs} backlog${drive.maxBacklogs === 1 ? '' : 's'}`
    : 'Backlogs allowed'

const COMPANY_COLORS = [
  '#ff7a00', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b',
]

const getCompanyColor = (name: string) =>
  COMPANY_COLORS[(name.charCodeAt(0) || 0) % COMPANY_COLORS.length]

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
  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState('all')
  const [driveToDelete, setDriveToDelete] = useState<PlacementDrive | null>(null)
  const [deleting, setDeleting]           = useState(false)

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

  // Confirmed from the in-app dialog (replaces the browser confirm box)
  const handleDelete = async () => {
    if (!driveToDelete) return
    setDeleting(true)
    try {
      await axios.delete(`${baseURL}/api/placement-drives/${driveToDelete._id}`, { headers: authHeader })
      setSuccessMsg(`"${driveToDelete.companyName}" drive deleted.`)
      setDriveToDelete(null)
      fetchDrives()
    } catch (err) {
      console.error('Delete drive error:', err)
    } finally {
      setDeleting(false)
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
    placed:    drives.reduce((t, d) => t + (d.stats?.placed || 0), 0),
  }

  const visibleDrives = drives.filter((d) => {
    const q = search.trim().toLowerCase()
    const matchesSearch = !q || [d.companyName, d.role, d.location, d.package].some((v) => (v || '').toLowerCase().includes(q))
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <AdminPage>
      <PageHeader
        icon={FaBriefcase}
        title="Placement Drives"
        stats={
          <StatCards
            inline
            loading={loading && drives.length === 0}
            items={[
              { label: 'Total Drives', value: summary.total, icon: FaBriefcase, tone: 'orange' },
              { label: 'Upcoming', value: summary.upcoming, icon: FaCalendarAlt, tone: 'amber' },
              { label: 'Ongoing', value: summary.ongoing, icon: FaPlayCircle, tone: 'green' },
              { label: 'Completed', value: summary.completed, icon: FaCheckCircle, tone: 'blue' },
              { label: 'Students Placed', value: summary.placed, icon: FaUserGraduate, tone: 'purple' },
            ]}
          />
        }
        actions={
          <button type="button" className="aui-btn aui-btn-primary" onClick={() => setShowCreate(true)}>
            <FaPlus size={11} /> New Drive
          </button>
        }
      />

      {successMsg && (
        <div className="aui-alert pdm-alert-success">
          <FaCheckCircle /> <span>{successMsg}</span>
          <button type="button" className="pdm-alert-close" onClick={() => setSuccessMsg('')} aria-label="Dismiss"><FaTimes /></button>
        </div>
      )}

      <div className="aui-card">
        <div className="aui-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by company, role, location or package" />
          <div className="aui-toolbar-filters">
            <AdminSelect label="Filter by status" prefix="Status:" value={statusFilter} options={STATUS_FILTERS} onChange={setStatusFilter} />
            <span className="aui-count">{visibleDrives.length} of {drives.length}</span>
          </div>
        </div>

        {loading && drives.length === 0 ? (
          <div className="aui-empty"><FaSpinner className="aui-spin" /><span>Loading drives…</span></div>
        ) : drives.length === 0 ? (
          <EmptyState
            icon={FaBuilding}
            title="No placement drives yet"
            text="Create a drive — eligible students are notified by email and you can track every round here."
            action={<button type="button" className="aui-btn aui-btn-primary" onClick={() => setShowCreate(true)}><FaPlus size={11} /> New Drive</button>}
          />
        ) : visibleDrives.length === 0 ? (
          <EmptyState icon={FaSearch} title="No drives match these filters" text="Try a different search or status." />
        ) : (
          <div className="aui-table-scroll">
            <table className="aui-table pdm-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Role / Package</th>
                  <th>Drive Date</th>
                  <th>Eligibility</th>
                  <th>Student Pipeline</th>
                  <th className="pdm-center">Rounds</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleDrives.map((drive) => {
                  const companyColor = getCompanyColor(drive.companyName || '?')
                  const cutoff = Number.isInteger(drive.cutoffScore) ? drive.cutoffScore : drive.cutoffScore.toFixed(1)
                  const { total, placed, inProgress, eliminated } = drive.stats || { total: 0, placed: 0, inProgress: 0, eliminated: 0 }
                  const seg = (n: number) => (total ? `${(n / total) * 100}%` : '0%')
                  const when = relativeDay(drive.driveDate)

                  return (
                    <tr key={drive._id}>
                      <td>
                        <div className="aui-person">
                          <span className="pdm-logo" style={{ background: `${companyColor}22`, borderColor: `${companyColor}55`, color: companyColor }}>
                            {initialsOf(drive.companyName || '?')}
                          </span>
                          <div className="aui-stack">
                            <strong>{drive.companyName}</strong>
                            <small>{drive.location ? <><FaMapMarkerAlt size={9} /> {drive.location}</> : 'Location not set'}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="aui-stack">
                          <strong>{drive.role || '—'}</strong>
                          {drive.package ? <span className="aui-badge aui-badge-green pdm-package">{drive.package}</span> : <small>Package not set</small>}
                        </div>
                      </td>

                      <td>
                        {drive.driveDate ? (
                          <div className="aui-stack">
                            <strong>{new Date(drive.driveDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong>
                            <small className={when.soon ? 'pdm-soon' : ''}>{new Date(drive.driveDate).toLocaleDateString('en-IN', { weekday: 'short' })} · {when.label}</small>
                          </div>
                        ) : <span className="aui-num">Not scheduled</span>}
                      </td>

                      <td>
                        <div className="aui-stack">
                          <strong>{cutoff}{drive.cutoffType === 'percentage' ? '%' : ' CGPA'}</strong>
                          <small>{backlogText(drive)}</small>
                        </div>
                      </td>

                      <td>
                        <div className="pdm-pipeline">
                          <div className="pdm-pipeline-top">
                            <strong>{total}</strong><small>enrolled</small>
                          </div>
                          <span className="pdm-stack-bar" title={`${placed} placed · ${inProgress} in progress · ${eliminated} eliminated`}>
                            <i style={{ width: seg(placed), background: '#31d866' }} />
                            <i style={{ width: seg(inProgress), background: '#f6aa24' }} />
                            <i style={{ width: seg(eliminated), background: '#4b5056' }} />
                          </span>
                          <div className="pdm-legend">
                            <span><i style={{ background: '#31d866' }} />{placed} placed</span>
                            <span><i style={{ background: '#f6aa24' }} />{inProgress} active</span>
                            <span><i style={{ background: '#4b5056' }} />{eliminated} out</span>
                          </div>
                        </div>
                      </td>

                      <td className="pdm-center">
                        <span className="pdm-rounds" title={(drive.rounds || []).map((r) => r.name).join(' → ')}>
                          {(drive.rounds || []).length}
                        </span>
                      </td>

                      <td>
                        <StatusPicker value={drive.status} onChange={(status) => handleStatusChange(drive._id, status)} />
                      </td>

                      <td className="text-end">
                        <div className="pdm-actions">
                          <button type="button" className="aui-btn aui-btn-soft aui-btn-sm" onClick={() => { setSelectedDrive(drive); setShowStudents(true) }}>
                            <FaUsers /> Students
                          </button>
                          <button type="button" className="aui-icon-btn" title="View analytics" onClick={() => { setSelectedDrive(drive); setShowCharts(true) }}><FaChartBar size={12} /></button>
                          <button type="button" className="aui-icon-btn" title="Bulk upload students" onClick={() => { setSelectedDrive(drive); setShowBulkUpload(true) }}><FaFileUpload size={12} /></button>
                          <button type="button" className="aui-icon-btn" title="Edit drive" onClick={() => { setSelectedDrive(drive); setShowEdit(true) }}><FaEdit size={12} /></button>
                          <button type="button" className="aui-icon-btn pdm-delete" title="Delete drive" onClick={() => setDriveToDelete(drive)}><FaTrash size={11} /></button>
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

      {/* ── DELETE CONFIRMATION ── */}
      <Modal show={!!driveToDelete} onHide={() => !deleting && setDriveToDelete(null)} centered className="pdm-confirm" backdropClassName="aui-backdrop">
        <Modal.Body>
          <div className="pdm-confirm-icon"><FaTrash /></div>
          <h5>Delete placement drive?</h5>
          <p><b>{driveToDelete?.companyName}</b>{driveToDelete?.role ? ` · ${driveToDelete.role}` : ''} and all of its student records will be permanently removed.</p>
          <div className="pdm-confirm-actions">
            <button type="button" className="aui-btn" onClick={() => setDriveToDelete(null)} disabled={deleting}>Cancel</button>
            <button type="button" className="aui-btn aui-btn-danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? <FaSpinner className="aui-spin" /> : <FaTrash size={11} />} Delete drive
            </button>
          </div>
        </Modal.Body>
      </Modal>

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

      <style>{`
        .pdm-alert-success { margin-top: 1.25rem; border-color: rgba(49,216,102,0.3); background: rgba(49,216,102,0.1); color: #86efac; }
        .pdm-alert-close { margin-left: auto; padding: 2px; border: 0; background: none; color: inherit; opacity: 0.7; cursor: pointer; }
        .pdm-alert-close:hover { opacity: 1; }

        .pdm-table td { vertical-align: middle; }
        .pdm-center { text-align: center !important; }
        .pdm-logo { display: grid; place-items: center; width: 36px; height: 36px; flex: 0 0 36px; border: 1px solid; border-radius: 10px; font-size: 0.72rem; font-weight: 800; }
        .pdm-package { align-self: flex-start; margin-top: 2px; }
        .pdm-soon { color: #f4b43f !important; font-weight: 600; }
        .pdm-pipeline { display: flex; flex-direction: column; gap: 5px; min-width: 170px; }
        .pdm-pipeline-top { display: flex; align-items: baseline; gap: 5px; }
        .pdm-pipeline-top strong { color: #eceef0; font-size: 0.86rem; }
        .pdm-pipeline-top small { color: #858a90; font-size: 0.7rem; }
        .pdm-stack-bar { display: flex; height: 6px; overflow: hidden; border-radius: 99px; background: #2b2e31; }
        .pdm-stack-bar i { display: block; height: 100%; }
        .pdm-legend { display: flex; gap: 10px; color: #858a90; font-size: 0.66rem; white-space: nowrap; }
        .pdm-legend span { display: inline-flex; align-items: center; gap: 4px; }
        .pdm-legend i { width: 6px; height: 6px; border-radius: 50%; }
        .pdm-rounds { display: inline-grid; min-width: 28px; height: 24px; padding: 0 8px; place-items: center; border-radius: 7px; background: #1b1e21; color: #e5e7eb; font-size: 0.74rem; font-weight: 700; cursor: default; }
        .pdm-actions { display: inline-flex; align-items: center; gap: 6px; }
        .pdm-delete:hover { border-color: rgba(251,95,103,0.55) !important; color: #fb737a !important; }

        .pdm-status { position: relative; }
        .pdm-status-trigger { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 0.6rem; border: 1px solid; border-radius: 99px; font-size: 0.72rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
        .pdm-status-trigger i { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
        .pdm-status-trigger svg { font-size: 0.55rem; opacity: 0.8; }
        .pdm-status .aui-dropdown-menu { left: 0; right: auto; min-width: 140px; }

        .pdm-confirm .modal-content { border: 1px solid #25282b; border-radius: 14px; background: #0e1012; color: #eceef0; }
        .pdm-confirm .modal-body { padding: 1.5rem; text-align: center; }
        .pdm-confirm-icon { display: grid; place-items: center; width: 52px; height: 52px; margin: 0 auto 0.75rem; border: 1px solid rgba(251,95,103,0.35); border-radius: 14px; background: rgba(251,95,103,0.12); color: #fb737a; font-size: 1.2rem; }
        .pdm-confirm h5 { margin: 0 0 0.4rem; color: #fff; font-size: 1.05rem; font-weight: 700; }
        .pdm-confirm p { margin: 0 0 1.25rem; color: #9ca3af; font-size: 0.85rem; }
        .pdm-confirm p b { color: #eceef0; }
        .pdm-confirm-actions { display: flex; justify-content: center; gap: 0.6rem; }
      `}</style>
    </AdminPage>
  )
}

/* Colour-coded status dropdown — changes the drive status in place */
const StatusPicker = ({ value, onChange }: { value: PlacementDrive['status']; onChange: (status: string) => void }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [open])
  const st = STATUS_STYLE[value] || STATUS_STYLE.upcoming

  return (
    <div className="pdm-status" ref={ref}>
      <button
        type="button"
        className="pdm-status-trigger"
        style={{ color: st.color, background: st.bg, borderColor: `${st.color}55` }}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <i />{st.label}<FaChevronDown />
      </button>
      {open && (
        <ul className="aui-dropdown-menu" role="listbox">
          {Object.entries(STATUS_STYLE).map(([key, s]) => (
            <li key={key} role="option" aria-selected={key === value}>
              <button type="button" className={key === value ? 'is-active' : ''} onClick={() => { setOpen(false); if (key !== value) onChange(key) }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <i style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, display: 'inline-block' }} />{s.label}
                </span>
                {key === value && <FaCheckCircle />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default PlacementDriveManagement
