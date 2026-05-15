import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  Col,
  Form,
  InputGroup,
  Modal,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap'
import {
  FaBan,
  FaCheckCircle,
  FaDownload,
  FaEnvelope,
  FaFileAlt,
  FaFilter,
  FaList,
  FaPencilAlt,
  FaSearch,
  FaTh,
  FaTimesCircle,
  FaTrophy,
  FaUpload,
  FaUserCheck,
  FaUsers,
  FaUserTimes,
} from 'react-icons/fa'
import axios from 'axios'
import { useAuthContext } from '@/context/useAuthContext'
import type { PlacementDrive } from './PlacementDriveManagement'
import SendMessageModal from './SendMessageModal'

interface RoundResult {
  roundName: string
  order: number
  status: 'pending' | 'qualified' | 'not_qualified'
  updatedAt: string | null
}

interface DriveStudent {
  _id: string
  studentName: string
  studentEmail: string
  phoneNumber: string
  department: string
  batch: string
  academicScore: number
  hasBacklogs: boolean
  isEligible: boolean
  totalScore: number
  currentRound: number
  overallStatus: 'in_progress' | 'placed' | 'eliminated'
  roundResults: RoundResult[]
}

interface Props {
  show: boolean
  drive: PlacementDrive
  onHide: () => void
  onUpdated: () => void
}

type TabKey = 'all' | 'eligible' | 'not_eligible' | 'placed' | 'eliminated'

const OVERALL_BADGE: Record<string, { bg: string; label: string }> = {
  in_progress: { bg: 'warning', label: 'In Progress' },
  placed:      { bg: 'success', label: 'Placed' },
  eliminated:  { bg: 'danger',  label: 'Eliminated' },
}

const AVATAR_COLORS = [
  '#ff7a00', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b',
]

const TAB_CONFIG: { key: TabKey; label: string; color: string }[] = [
  { key: 'all',          label: 'All',          color: '#6b7280' },
  { key: 'eligible',     label: 'Eligible',     color: '#22c55e' },
  { key: 'not_eligible', label: 'Not Eligible', color: '#ef4444' },
  { key: 'placed',       label: 'Placed',       color: '#f59e0b' },
  { key: 'eliminated',   label: 'Eliminated',   color: '#9ca3af' },
]

const DriveStudentsModal = ({ show, drive, onHide, onUpdated }: Props) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [students, setStudents]           = useState<DriveStudent[]>([])
  const [loading, setLoading]             = useState(false)
  const [updating, setUpdating]           = useState<string | null>(null)
  const [editingRound, setEditingRound]   = useState<string | null>(null)
  const [activeTab, setActiveTab]         = useState<TabKey>('all')
  const [reportLoading, setReportLoading] = useState(false)
  const [viewMode, setViewMode]           = useState<'table' | 'grid'>('table')

  const [search, setSearch]                 = useState('')
  const [filterDept, setFilterDept]         = useState('')
  const [filterBatch, setFilterBatch]       = useState('')
  const [filterBacklogs, setFilterBacklogs] = useState('')
  const [filterEligibility, setFilterEligibility] = useState('')
  const [filterRounds, setFilterRounds]           = useState<Record<number, string>>({})
  const [filterStatus, setFilterStatus]           = useState('')

  // Email compose state
  const [selectedIds, setSelectedIds]         = useState<Set<string>>(new Set())
  const [showSendMsg, setShowSendMsg]         = useState(false)
  const [msgStudents, setMsgStudents]         = useState<DriveStudent[]>([])

  // Column filter popup state
  const [openFilterCol, setOpenFilterCol]               = useState<string | null>(null)
  const [filterPopupPos, setFilterPopupPos]             = useState({ top: 0, left: 0 })
  const filterPopupRef                                  = useRef<HTMLDivElement>(null)

  // Bulk round update state
  const roundsFileRef                                   = useRef<HTMLInputElement>(null)
  const [roundsUploading, setRoundsUploading]           = useState(false)
  const [roundsResult, setRoundsResult]                 = useState<{ updated: number; skipped: number; errors: number } | null>(null)

  const authHeader = { Authorization: `Bearer ${user?.token}` }

  const openFilter = (col: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (openFilterCol === col) { setOpenFilterCol(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    setFilterPopupPos({ top: rect.bottom + 6, left: rect.left })
    setOpenFilterCol(col)
  }

  useEffect(() => {
    if (!openFilterCol) return
    const handler = (ev: MouseEvent) => {
      if (filterPopupRef.current && !filterPopupRef.current.contains(ev.target as Node)) {
        setOpenFilterCol(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openFilterCol])

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get(
        `${baseURL}/api/placement-drives/${drive._id}/students`,
        { headers: authHeader }
      )
      setStudents(res.data.students)
    } catch (err) {
      console.error('Fetch students error:', err)
    } finally {
      setLoading(false)
    }
  }, [drive._id, baseURL, user?.token])

  useEffect(() => {
    if (show) {
      fetchStudents()
      setSearch('')
      setFilterDept('')
      setFilterBatch('')
      setFilterBacklogs('')
      setFilterEligibility('')
      setFilterRounds({})
      setFilterStatus('')
      setActiveTab('all')
      setSelectedIds(new Set())
    }
  }, [show, fetchStudents])

  const updateRound = async (
    studentId: string,
    roundOrder: number,
    result: 'qualified' | 'not_qualified'
  ) => {
    setUpdating(studentId + '-' + roundOrder)
    try {
      await axios.patch(
        `${baseURL}/api/placement-drives/${drive._id}/students/${studentId}/round`,
        { roundOrder, result },
        { headers: authHeader }
      )
      await fetchStudents()
      onUpdated()
    } catch (err) {
      console.error('Update round error:', err)
    } finally {
      setUpdating(null)
      setEditingRound(null)
    }
  }

  const deptOptions = useMemo(
    () => [...new Set(students.map((s) => s.department).filter(Boolean))].sort(),
    [students]
  )
  const batchOptions = useMemo(
    () => [...new Set(students.map((s) => s.batch).filter(Boolean))].sort(),
    [students]
  )

  const counts = {
    all:          students.length,
    eligible:     students.filter((s) => s.isEligible && s.overallStatus === 'in_progress').length,
    not_eligible: students.filter((s) => !s.isEligible).length,
    placed:       students.filter((s) => s.overallStatus === 'placed').length,
    eliminated:   students.filter((s) => s.overallStatus === 'eliminated').length,
  }

  const tabFiltered = students.filter((s) => {
    if (activeTab === 'eligible')     return s.isEligible && s.overallStatus === 'in_progress'
    if (activeTab === 'not_eligible') return !s.isEligible
    if (activeTab === 'placed')       return s.overallStatus === 'placed'
    if (activeTab === 'eliminated')   return s.overallStatus === 'eliminated'
    return true
  })

  const filtered = tabFiltered.filter((s) => {
    if (search && !s.studentName.toLowerCase().includes(search.toLowerCase()) &&
        !s.studentEmail.toLowerCase().includes(search.toLowerCase())) return false
    if (filterDept     && s.department !== filterDept) return false
    if (filterBatch    && s.batch !== filterBatch)     return false
    if (filterBacklogs === 'yes' && !s.hasBacklogs)    return false
    if (filterBacklogs === 'no'  &&  s.hasBacklogs)    return false
    if (filterEligibility === 'eligible'     && !s.isEligible)  return false
    if (filterEligibility === 'not_eligible' &&  s.isEligible)  return false
    if (filterStatus && s.overallStatus !== filterStatus)        return false
    for (const [order, status] of Object.entries(filterRounds)) {
      if (!status) continue
      const rr = s.roundResults.find((x) => x.order === Number(order))
      if (!rr || rr.status !== status) return false
    }
    return true
  })

  const downloadReport = async () => {
    setReportLoading(true)
    try {
      const res = await axios.get(
        `${baseURL}/api/placement-drives/${drive._id}/report`,
        { headers: authHeader }
      )
      const { report, drive: driveData } = res.data
      const rows = [
        ['Placement Drive Report'],
        [`Company: ${driveData.companyName}`],
        [`Role: ${driveData.role || '—'}`],
        [`Drive Date: ${driveData.driveDate ? new Date(driveData.driveDate).toDateString() : '—'}`],
        [],
        ['Summary'],
        [`Total Students: ${students.length}`],
        [`Eligible: ${counts.eligible}`],
        [`Not Eligible: ${counts.not_eligible}`],
        [`Placed: ${report.placed}`],
        [`Eliminated: ${report.eliminated}`],
        [],
        ['Student Name', 'Email', 'Phone', 'Department', 'Batch', 'CGPA', 'Backlogs', 'Eligible', 'Status',
          ...drive.rounds.map((r) => r.name)],
        ...students.map((s) => [
          s.studentName, s.studentEmail, s.phoneNumber || '',
          s.department || '', s.batch || '', s.academicScore,
          s.hasBacklogs ? 'Yes' : 'No', s.isEligible ? 'Yes' : 'No', s.overallStatus,
          ...drive.rounds.map((r) => {
            const rr = s.roundResults.find((x) => x.order === r.order)
            return rr ? rr.status : 'pending'
          }),
        ]),
      ]
      const csv  = rows.map((r) => r.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${driveData.companyName}_placement_report.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Report error:', err)
    } finally {
      setReportLoading(false)
    }
  }

  const cutoffDisplay = Number.isInteger(drive.cutoffScore)
    ? String(drive.cutoffScore)
    : drive.cutoffScore.toFixed(1)

  const clearFilters = () => {
    setSearch('')
    setFilterDept('')
    setFilterBatch('')
    setFilterBacklogs('')
    setFilterEligibility('')
    setFilterRounds({})
    setFilterStatus('')
  }
  const hasFilters = search || filterDept || filterBatch || filterBacklogs ||
    filterEligibility || filterStatus || Object.values(filterRounds).some(Boolean)

  const downloadRoundTemplate = () => {
    const headers = ['Student Name', 'Email', ...drive.rounds.map((r) => r.name)]
    const rows = students
      .filter((s) => s.isEligible)
      .map((s) => [
        s.studentName,
        s.studentEmail,
        ...drive.rounds.map((r) => {
          const rr = s.roundResults.find((x) => x.order === r.order)
          if (rr?.status === 'qualified')     return 'Qualified'
          if (rr?.status === 'not_qualified') return 'Not Qualified'
          return ''
        }),
      ])
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${drive.companyName}_round_results_template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleRoundsBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setRoundsResult(null)
    setRoundsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await axios.post(
        `${baseURL}/api/placement-drives/${drive._id}/rounds/bulk-update`,
        formData,
        { headers: { Authorization: `Bearer ${user?.token}`, 'Content-Type': 'multipart/form-data' } }
      )
      setRoundsResult({
        updated: res.data.updated,
        skipped: res.data.skipped,
        errors:  res.data.errors?.length ?? 0,
      })
      await fetchStudents()
      onUpdated()
    } catch (err: any) {
      setRoundsResult({ updated: 0, skipped: 0, errors: -1 })
      console.error('Bulk round update error:', err)
    } finally {
      setRoundsUploading(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map((s) => s._id)))
    }
  }
  const openSendSingle = (student: DriveStudent) => {
    setMsgStudents([student])
    setShowSendMsg(true)
  }
  const openSendBulk = () => {
    setMsgStudents(filtered.filter((s) => selectedIds.has(s._id)))
    setShowSendMsg(true)
  }

  return (
    <Modal show={show} onHide={onHide} fullscreen contentClassName="bg-dark text-white">

      {/* ── HEADER: single row — name + rounds on left, meta chips on right ── */}
      <Modal.Header
        className="border-secondary"
        style={{ alignItems: 'center', gap: 12, flexWrap: 'wrap', paddingTop: 12, paddingBottom: 12 }}
      >
        {/* Company name + role */}
        <div style={{ flexShrink: 0 }}>
          <h5 className="mb-0 fw-bold text-white">{drive.companyName}</h5>
          {drive.role && (
            <div className="text-muted" style={{ fontSize: '0.78rem' }}>{drive.role}</div>
          )}
        </div>

        {/* Rounds as step badges */}
        {drive.rounds.length > 0 && (
          <div className="d-flex align-items-center gap-1 flex-wrap" style={{ fontSize: '0.75rem' }}>
            {drive.rounds.map((r, i) => (
              <span key={r.order} className="d-flex align-items-center gap-1">
                {i > 0 && <span style={{ color: '#ff7a00' }}>→</span>}
                <span
                  style={{
                    background: '#1e1e1e', border: '1px solid #333',
                    borderRadius: 6, padding: '2px 9px', color: '#bbb',
                  }}
                >
                  {r.name}
                </span>
              </span>
            ))}
          </div>
        )}

        {/* Meta chips pushed to the far right */}
        <div className="d-flex gap-2 flex-wrap ms-auto">
          <MetaChip label="Cutoff CGPA" value={cutoffDisplay}                              color="#ff7a00" />
          {drive.driveDate && (
            <MetaChip label="Drive Date" value={new Date(drive.driveDate).toDateString()} color="#e2e8f0" />
          )}
          {drive.package && (
            <MetaChip label="Package"    value={drive.package}                             color="#22c55e" />
          )}
          {drive.location && (
            <MetaChip label="Location"   value={drive.location}                            color="#e2e8f0" />
          )}
        </div>
      </Modal.Header>

      <Modal.Body
        className="p-0"
        style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >

        {/* ── STAT CARDS ── */}
        <div className="px-4 pt-3 pb-2">
          <Row xs={2} sm={3} md={5} className="g-2">
            <Col>
              <StatCard icon={<FaUsers />}     label="Total Students" value={counts.all}          color="#ff7a00" />
            </Col>
            <Col>
              <StatCard icon={<FaUserCheck />} label="Eligible"       value={counts.eligible}     color="#22c55e" />
            </Col>
            <Col>
              <StatCard icon={<FaUserTimes />} label="Not Eligible"   value={counts.not_eligible} color="#ef4444" />
            </Col>
            <Col>
              <StatCard icon={<FaTrophy />}    label="Placed"         value={counts.placed}       color="#f59e0b" />
            </Col>
            <Col>
              <StatCard icon={<FaBan />}       label="Eliminated"     value={counts.eliminated}   color="#6b7280" />
            </Col>
          </Row>
        </div>

        {/* ── TOOLBAR — single row ── */}
        <div className="px-4 pb-3">
          <div
            style={{
              background: '#111', border: '1px solid #1e1e1e', borderRadius: 12,
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', flexWrap: 'wrap',
            }}
          >
            {/* Tab pills */}
            {TAB_CONFIG.map(({ key, label, color }) => {
              const active = activeTab === key
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    background:   active ? '#ff7a00' : 'transparent',
                    color:        active ? '#fff' : '#777',
                    border:       'none',
                    borderRadius: 7,
                    padding:      '4px 11px',
                    fontSize:     '0.79rem',
                    fontWeight:   active ? 700 : 400,
                    cursor:       'pointer',
                    transition:   'all 0.15s',
                    display:      'flex',
                    alignItems:   'center',
                    gap:          5,
                    whiteSpace:   'nowrap',
                  }}
                >
                  {label}
                  <span
                    style={{
                      background:   active ? 'rgba(255,255,255,0.22)' : '#1e1e1e',
                      color:        active ? '#fff' : color,
                      borderRadius: 20,
                      padding:      '1px 6px',
                      fontSize:     '0.67rem',
                      fontWeight:   700,
                    }}
                  >
                    {counts[key]}
                  </span>
                </button>
              )
            })}

            {/* Divider */}
            <div style={{ width: 1, height: 20, background: '#2a2a2a', margin: '0 4px', flexShrink: 0 }} />

            {/* Search only */}
            <InputGroup size="sm" style={{ width: 300, flexShrink: 0 }}>
              <InputGroup.Text className="bg-black border-secondary text-muted" style={{ padding: '3px 8px' }}>
                <FaSearch size={10} />
              </InputGroup.Text>
              <Form.Control
                size="sm"
                className="bg-black text-white border-secondary"
                placeholder="Name / Email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>

            {hasFilters && (
              <button
                onClick={clearFilters}
                style={{ background: 'none', border: 'none', color: '#ff7a00', fontSize: '0.73rem', cursor: 'pointer', padding: '2px 4px', whiteSpace: 'nowrap' }}
              >
                ✕ Clear filters
              </button>
            )}

            {/* Push actions to right */}
            <div className="ms-auto d-flex align-items-center gap-2">

              <ButtonGroup size="sm">
                <Button variant={viewMode === 'table' ? 'warning' : 'outline-secondary'} onClick={() => setViewMode('table')} title="Table View" style={{ padding: '3px 9px' }}>
                  <FaList size={11} />
                </Button>
                <Button variant={viewMode === 'grid' ? 'warning' : 'outline-secondary'} onClick={() => setViewMode('grid')} title="Grid View" style={{ padding: '3px 9px' }}>
                  <FaTh size={11} />
                </Button>
              </ButtonGroup>

              <div style={{ width: 1, height: 16, background: '#2a2a2a', flexShrink: 0 }} />

              <Button size="sm" variant="outline-secondary" onClick={downloadRoundTemplate} title="Download round results template" style={{ fontSize: '0.76rem' }}>
                <FaFileAlt className="me-1" size={11} />Template
              </Button>
              <Button size="sm" variant="outline-secondary" disabled={roundsUploading} onClick={() => roundsFileRef.current?.click()} title="Upload filled round results" style={{ fontSize: '0.76rem' }}>
                {roundsUploading ? <><Spinner size="sm" className="me-1" />Uploading...</> : <><FaUpload className="me-1" size={11} />Upload Rounds</>}
              </Button>
              <input ref={roundsFileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }} onChange={handleRoundsBulkUpload} />

              <div style={{ width: 1, height: 16, background: '#2a2a2a', flexShrink: 0 }} />

              {selectedIds.size > 0 && (
                <Button size="sm" onClick={openSendBulk} style={{ backgroundColor: '#3b82f6', borderColor: '#3b82f6', color: '#fff', fontWeight: 600, fontSize: '0.76rem' }}>
                  <FaEnvelope className="me-1" size={11} />Send Email ({selectedIds.size})
                </Button>
              )}

              <Button size="sm" onClick={downloadReport} disabled={reportLoading} style={{ backgroundColor: '#ff7a00', borderColor: '#ff7a00', color: '#fff', fontWeight: 600, fontSize: '0.76rem' }}>
                <FaDownload className="me-1" size={11} />{reportLoading ? 'Generating...' : 'Download Report'}
              </Button>
            </div>
          </div>
        </div>

        {/* ── ROUNDS UPLOAD RESULT ── */}
        {roundsResult && (
          <div className="px-4 pb-2">
            {roundsResult.errors === -1 ? (
              <div
                style={{
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 8, padding: '8px 14px', fontSize: '0.82rem', color: '#ef4444',
                }}
              >
                ❌ Upload failed — check the file format and try again.
              </div>
            ) : (
              <div
                style={{
                  background: roundsResult.updated > 0 ? 'rgba(34,197,94,0.08)' : 'rgba(107,114,128,0.08)',
                  border: `1px solid ${roundsResult.updated > 0 ? 'rgba(34,197,94,0.25)' : 'rgba(107,114,128,0.2)'}`,
                  borderRadius: 8, padding: '8px 14px', fontSize: '0.82rem',
                  color: roundsResult.updated > 0 ? '#22c55e' : '#9ca3af',
                  display: 'flex', alignItems: 'center', gap: 16,
                }}
              >
                <span>
                  {roundsResult.updated > 0 ? '✅' : 'ℹ️'}{' '}
                  <strong>{roundsResult.updated}</strong> student{roundsResult.updated !== 1 ? 's' : ''} updated
                </span>
                {roundsResult.skipped > 0 && (
                  <span style={{ color: '#6b7280' }}>
                    <strong>{roundsResult.skipped}</strong> skipped (no change / not eligible)
                  </span>
                )}
                {roundsResult.errors > 0 && (
                  <span style={{ color: '#f59e0b' }}>
                    <strong>{roundsResult.errors}</strong> row{roundsResult.errors !== 1 ? 's' : ''} had errors
                  </span>
                )}
                <button
                  onClick={() => setRoundsResult(null)}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── CONTENT ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 16px' }}>
          <div style={{ border: '1px solid #2a2a2a', borderRadius: 10, overflow: 'hidden' }}>
          {loading ? (
            <div className="text-center py-5"><Spinner variant="warning" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-muted py-5">No students match the current filters.</div>
          ) : viewMode === 'table' ? (

            /* TABLE */
            <Table
              responsive
              hover
              variant="dark"
              className="mb-0"
              style={{ fontSize: '0.84rem' }}
            >
              <thead style={{ position: 'sticky', top: 0, background: '#0d0d0d', zIndex: 1 }}>
                <tr style={{ borderBottom: '2px solid #ff7a0044' }}>
                  <th style={{ color: '#ff7a00', fontWeight: 700, paddingLeft: 16, width: 68 }}>
                    <Form.Check
                      checked={filtered.length > 0 && selectedIds.size === filtered.length}
                      onChange={toggleSelectAll}
                      title="Select all"
                    />
                  </th>
                  <th style={{ color: '#ff7a00', fontWeight: 700 }}>Student</th>
                  <th style={{ color: '#ff7a00', fontWeight: 700 }}>Email</th>
                  <th style={{ color: '#ff7a00', fontWeight: 700 }}>
                    <div className="d-flex align-items-center gap-2">
                      Dept / Batch
                      <button
                        onClick={(e) => openFilter('dept', e)}
                        title="Filter by Dept / Batch"
                        style={{
                          background: (filterDept || filterBatch) ? 'rgba(255,122,0,0.15)' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${(filterDept || filterBatch) ? '#ff7a00' : '#333'}`,
                          borderRadius: 5, padding: '2px 5px', cursor: 'pointer',
                          color: (filterDept || filterBatch) ? '#ff7a00' : '#666', lineHeight: 1,
                        }}
                      >
                        <FaFilter size={9} />
                      </button>
                    </div>
                  </th>
                  <th style={{ color: '#ff7a00', fontWeight: 700 }}>CGPA</th>
                  <th style={{ color: '#ff7a00', fontWeight: 700 }}>
                    <div className="d-flex align-items-center gap-2">
                      Backlogs
                      <button
                        onClick={(e) => openFilter('backlogs', e)}
                        title="Filter by Backlogs"
                        style={{
                          background: filterBacklogs ? 'rgba(255,122,0,0.15)' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${filterBacklogs ? '#ff7a00' : '#333'}`,
                          borderRadius: 5, padding: '2px 5px', cursor: 'pointer',
                          color: filterBacklogs ? '#ff7a00' : '#666', lineHeight: 1,
                        }}
                      >
                        <FaFilter size={9} />
                      </button>
                    </div>
                  </th>
                  <th style={{ color: '#ff7a00', fontWeight: 700 }}>
                    <div className="d-flex align-items-center gap-2">
                      Eligibility
                      <button
                        onClick={(e) => openFilter('eligibility', e)}
                        title="Filter by Eligibility"
                        style={{
                          background: filterEligibility ? 'rgba(255,122,0,0.15)' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${filterEligibility ? '#ff7a00' : '#333'}`,
                          borderRadius: 5, padding: '2px 5px', cursor: 'pointer',
                          color: filterEligibility ? '#ff7a00' : '#666', lineHeight: 1,
                        }}
                      >
                        <FaFilter size={9} />
                      </button>
                    </div>
                  </th>
                  {drive.rounds.map((r) => (
                    <th key={r.order} style={{ color: '#ff7a00', fontWeight: 700, textAlign: 'center' }}>
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        {r.name}
                        <button
                          onClick={(e) => openFilter(`round-${r.order}`, e)}
                          title={`Filter by ${r.name}`}
                          style={{
                            background: filterRounds[r.order] ? 'rgba(255,122,0,0.15)' : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${filterRounds[r.order] ? '#ff7a00' : '#333'}`,
                            borderRadius: 5, padding: '2px 5px', cursor: 'pointer',
                            color: filterRounds[r.order] ? '#ff7a00' : '#666', lineHeight: 1,
                          }}
                        >
                          <FaFilter size={9} />
                        </button>
                      </div>
                    </th>
                  ))}
                  <th style={{ color: '#ff7a00', fontWeight: 700 }}>
                    <div className="d-flex align-items-center gap-2">
                      Status
                      <button
                        onClick={(e) => openFilter('status', e)}
                        title="Filter by Status"
                        style={{
                          background: filterStatus ? 'rgba(255,122,0,0.15)' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${filterStatus ? '#ff7a00' : '#333'}`,
                          borderRadius: 5, padding: '2px 5px', cursor: 'pointer',
                          color: filterStatus ? '#ff7a00' : '#666', lineHeight: 1,
                        }}
                      >
                        <FaFilter size={9} />
                      </button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => (
                  <tr key={student._id} style={{ borderColor: '#2a2a2a' }}>
                    {/* Select + mail */}
                    <td style={{ verticalAlign: 'middle', paddingLeft: 16 }}>
                      <div className="d-flex align-items-center gap-2">
                        <Form.Check
                          checked={selectedIds.has(student._id)}
                          onChange={() => toggleSelect(student._id)}
                        />
                        <button
                          title="Send email"
                          onClick={() => openSendSingle(student)}
                          style={{
                            background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
                            borderRadius: 5, color: '#3b82f6', cursor: 'pointer',
                            padding: '3px 6px', lineHeight: 1, flexShrink: 0,
                          }}
                        >
                          <FaEnvelope size={11} />
                        </button>
                      </div>
                    </td>
                    {/* Student */}
                    <td style={{ verticalAlign: 'middle' }}>
                      <div className="d-flex align-items-center gap-2">
                        <StudentAvatar name={student.studentName} />
                        <div>
                          <div className="fw-semibold text-white">{student.studentName}</div>
                          {student.phoneNumber && (
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{student.phoneNumber}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Email */}
                    <td style={{ verticalAlign: 'middle', color: '#aaa', fontSize: '0.8rem' }}>
                      {student.studentEmail}
                    </td>
                    {/* Dept/Batch */}
                    <td style={{ verticalAlign: 'middle' }}>
                      <div>{student.department || '—'}</div>
                      {student.batch && (
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>{student.batch}</div>
                      )}
                    </td>
                    {/* CGPA */}
                    <td style={{ verticalAlign: 'middle' }}>
                      <span
                        style={{
                          color:      student.isEligible ? '#22c55e' : '#ef4444',
                          fontWeight: 700,
                          fontSize:   '0.92rem',
                        }}
                      >
                        {student.academicScore > 0
                          ? (Number.isInteger(student.academicScore)
                              ? student.academicScore
                              : student.academicScore.toFixed(1))
                          : '—'}
                      </span>
                    </td>
                    {/* Backlogs */}
                    <td style={{ verticalAlign: 'middle' }}>
                      {student.hasBacklogs
                        ? <Badge bg="danger">Yes</Badge>
                        : <Badge bg="success">No</Badge>}
                    </td>
                    {/* Eligibility */}
                    <td style={{ verticalAlign: 'middle' }}>
                      {student.isEligible
                        ? <Badge bg="success">Eligible</Badge>
                        : <Badge bg="danger">Not Eligible</Badge>}
                    </td>
                    {/* Rounds */}
                    {drive.rounds.map((round) => {
                      const rr         = student.roundResults.find((x) => x.order === round.order)
                      const key        = student._id + '-' + round.order
                      const isUpdating = updating === key
                      const isEditing  = editingRound === key
                      const isCurrent  =
                        student.isEligible &&
                        student.overallStatus === 'in_progress' &&
                        student.currentRound === round.order
                      const showActions = isCurrent || isEditing

                      return (
                        <td key={round.order} style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                          {(rr?.status === 'qualified' || rr?.status === 'not_qualified') && !isEditing ? (
                            /* Badge + edit pencil */
                            <div className="d-flex align-items-center justify-content-center gap-1">
                              {rr.status === 'qualified' ? (
                                <Badge bg="success"><FaCheckCircle className="me-1" />Qualified</Badge>
                              ) : (
                                <Badge bg="danger"><FaTimesCircle className="me-1" />Not Qual.</Badge>
                              )}
                              {student.isEligible && (
                                <button
                                  title="Edit result"
                                  onClick={() => setEditingRound(key)}
                                  style={{
                                    background: 'rgba(255,122,0,0.1)', border: '1px solid rgba(255,122,0,0.3)',
                                    borderRadius: 5, color: '#ff7a00', cursor: 'pointer',
                                    padding: '2px 5px', lineHeight: 1, flexShrink: 0,
                                  }}
                                >
                                  <FaPencilAlt size={9} />
                                </button>
                              )}
                            </div>
                          ) : showActions ? (
                            /* Qualify / Not-Qualify action buttons */
                            <div>
                              <ButtonGroup size="sm">
                                <Button
                                  variant="outline-success"
                                  disabled={!!isUpdating}
                                  onClick={() => updateRound(student._id, round.order, 'qualified')}
                                  title="Mark Qualified"
                                >
                                  {isUpdating ? <Spinner size="sm" /> : <FaCheckCircle />}
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  disabled={!!isUpdating}
                                  onClick={() => updateRound(student._id, round.order, 'not_qualified')}
                                  title="Mark Not Qualified"
                                >
                                  {isUpdating ? <Spinner size="sm" /> : <FaTimesCircle />}
                                </Button>
                              </ButtonGroup>
                              {isEditing && (
                                <div style={{ marginTop: 4 }}>
                                  <button
                                    onClick={() => setEditingRound(null)}
                                    style={{
                                      background: 'none', border: 'none', color: '#666',
                                      fontSize: '0.68rem', cursor: 'pointer', padding: 0,
                                    }}
                                  >
                                    cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted small">
                              {!student.isEligible ? '—' : 'Pending'}
                            </span>
                          )}
                        </td>
                      )
                    })}
                    {/* Status */}
                    <td style={{ verticalAlign: 'middle' }}>
                      {student.isEligible ? (
                        <Badge bg={OVERALL_BADGE[student.overallStatus]?.bg}>
                          {OVERALL_BADGE[student.overallStatus]?.label}
                        </Badge>
                      ) : (
                        <Badge bg="danger">Not Eligible</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>

          ) : (

            /* GRID */
            <div className="p-3">
              <Row xs={1} sm={2} md={3} lg={4} className="g-3">
                {filtered.map((student) => (
                  <Col key={student._id}>
                    <StudentCard
                      student={student}
                      drive={drive}
                      updating={updating}
                      updateRound={updateRound}
                      editingRound={editingRound}
                      setEditingRound={setEditingRound}
                      onSendEmail={openSendSingle}
                    />
                  </Col>
                ))}
              </Row>
            </div>

          )}
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer className="border-secondary py-2">
        <span className="text-muted small me-auto">
          Showing {filtered.length} of {students.length} students
          {selectedIds.size > 0 && (
            <span className="ms-2" style={{ color: '#3b82f6' }}>
              · {selectedIds.size} selected
            </span>
          )}
        </span>
        <Button variant="secondary" onClick={onHide}>Close</Button>
      </Modal.Footer>

      <SendMessageModal
        show={showSendMsg}
        drive={drive}
        students={msgStudents}
        onHide={() => setShowSendMsg(false)}
      />

      {/* ── COLUMN FILTER POPUP (fixed, never clipped) ── */}
      {openFilterCol && (
        <div
          ref={filterPopupRef}
          style={{
            position: 'fixed',
            top: filterPopupPos.top,
            left: filterPopupPos.left,
            zIndex: 9999,
            background: '#1c1c1c',
            border: '1px solid #333',
            borderRadius: 10,
            padding: '14px 16px',
            minWidth: 190,
            boxShadow: '0 10px 36px rgba(0,0,0,0.75)',
          }}
        >
          {openFilterCol === 'dept' && (
            <>
              <div style={{ fontSize: '0.7rem', color: '#ff7a00', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, fontWeight: 700 }}>
                Filter by Dept / Batch
              </div>
              {deptOptions.length > 0 && (
                <div className="mb-2">
                  <div style={{ fontSize: '0.7rem', color: '#777', marginBottom: 4 }}>Department</div>
                  {['', ...deptOptions].map((d) => (
                    <button
                      key={d}
                      onClick={() => setFilterDept(d)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left', padding: '5px 9px', marginBottom: 2,
                        background: filterDept === d ? 'rgba(255,122,0,0.15)' : 'transparent',
                        border: `1px solid ${filterDept === d ? 'rgba(255,122,0,0.4)' : 'transparent'}`,
                        borderRadius: 6, color: filterDept === d ? '#ff7a00' : '#bbb',
                        fontSize: '0.8rem', cursor: 'pointer',
                      }}
                    >
                      {d || 'All Departments'}
                    </button>
                  ))}
                </div>
              )}
              {batchOptions.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#777', marginBottom: 4 }}>Batch</div>
                  {['', ...batchOptions].map((b) => (
                    <button
                      key={b}
                      onClick={() => setFilterBatch(b)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left', padding: '5px 9px', marginBottom: 2,
                        background: filterBatch === b ? 'rgba(255,122,0,0.15)' : 'transparent',
                        border: `1px solid ${filterBatch === b ? 'rgba(255,122,0,0.4)' : 'transparent'}`,
                        borderRadius: 6, color: filterBatch === b ? '#ff7a00' : '#bbb',
                        fontSize: '0.8rem', cursor: 'pointer',
                      }}
                    >
                      {b || 'All Batches'}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {openFilterCol === 'backlogs' && (
            <>
              <div style={{ fontSize: '0.7rem', color: '#ff7a00', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, fontWeight: 700 }}>
                Filter by Backlogs
              </div>
              {[['', 'All Students'], ['no', 'No Backlogs'], ['yes', 'Has Backlogs']].map(([val, label]) => (
                <button key={val} onClick={() => { setFilterBacklogs(val); setOpenFilterCol(null) }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', marginBottom: 4,
                    background: filterBacklogs === val ? 'rgba(255,122,0,0.15)' : 'transparent',
                    border: `1px solid ${filterBacklogs === val ? 'rgba(255,122,0,0.4)' : '#2a2a2a'}`,
                    borderRadius: 7, color: filterBacklogs === val ? '#ff7a00' : '#bbb', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  {label}
                </button>
              ))}
            </>
          )}

          {openFilterCol === 'eligibility' && (
            <>
              <div style={{ fontSize: '0.7rem', color: '#ff7a00', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, fontWeight: 700 }}>
                Filter by Eligibility
              </div>
              {[['', 'All'], ['eligible', 'Eligible'], ['not_eligible', 'Not Eligible']].map(([val, label]) => (
                <button key={val} onClick={() => { setFilterEligibility(val); setOpenFilterCol(null) }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', marginBottom: 4,
                    background: filterEligibility === val ? 'rgba(255,122,0,0.15)' : 'transparent',
                    border: `1px solid ${filterEligibility === val ? 'rgba(255,122,0,0.4)' : '#2a2a2a'}`,
                    borderRadius: 7, color: filterEligibility === val ? '#ff7a00' : '#bbb', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  {label}
                </button>
              ))}
            </>
          )}

          {openFilterCol?.startsWith('round-') && (() => {
            const order = Number(openFilterCol.replace('round-', ''))
            const round = drive.rounds.find((r) => r.order === order)
            const current = filterRounds[order] || ''
            return (
              <>
                <div style={{ fontSize: '0.7rem', color: '#ff7a00', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, fontWeight: 700 }}>
                  {round?.name}
                </div>
                {[['', 'All'], ['pending', 'Pending'], ['qualified', 'Qualified'], ['not_qualified', 'Not Qualified']].map(([val, label]) => (
                  <button key={val}
                    onClick={() => {
                      setFilterRounds((prev) => ({ ...prev, [order]: val }))
                      setOpenFilterCol(null)
                    }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', marginBottom: 4,
                      background: current === val ? 'rgba(255,122,0,0.15)' : 'transparent',
                      border: `1px solid ${current === val ? 'rgba(255,122,0,0.4)' : '#2a2a2a'}`,
                      borderRadius: 7, color: current === val ? '#ff7a00' : '#bbb', fontSize: '0.82rem', cursor: 'pointer' }}
                  >
                    {label}
                  </button>
                ))}
              </>
            )
          })()}

          {openFilterCol === 'status' && (
            <>
              <div style={{ fontSize: '0.7rem', color: '#ff7a00', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10, fontWeight: 700 }}>
                Filter by Status
              </div>
              {[['', 'All'], ['in_progress', 'In Progress'], ['placed', 'Placed'], ['eliminated', 'Eliminated']].map(([val, label]) => (
                <button key={val} onClick={() => { setFilterStatus(val); setOpenFilterCol(null) }}
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 10px', marginBottom: 4,
                    background: filterStatus === val ? 'rgba(255,122,0,0.15)' : 'transparent',
                    border: `1px solid ${filterStatus === val ? 'rgba(255,122,0,0.4)' : '#2a2a2a'}`,
                    borderRadius: 7, color: filterStatus === val ? '#ff7a00' : '#bbb', fontSize: '0.82rem', cursor: 'pointer' }}
                >
                  {label}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </Modal>
  )
}

/* ── Stat card (top summary row) ── */
const StatCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: string
}) => (
  <div
    style={{
      background: '#1a1a1a', border: '1px solid #2a2a2a',
      borderRadius: 12, padding: '14px 18px',
    }}
  >
    <div className="d-flex align-items-center gap-3">
      <div
        style={{
          width: 46, height: 46, borderRadius: 10, flexShrink: 0,
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <span style={{ color, fontSize: '1.25rem' }}>{icon}</span>
      </div>
      <div>
        <div
          style={{
            fontSize: '0.68rem', color: '#777',
            textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>
          {value}
        </div>
      </div>
    </div>
  </div>
)

/* ── Avatar circle with initials ── */
const StudentAvatar = ({ name }: { name: string }) => {
  const color    = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
  const initials = name.split(' ').slice(0, 2).map((w) => w[0] || '').join('').toUpperCase()
  return (
    <div
      style={{
        width: 36, height: 36, borderRadius: '50%', background: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: '0.85rem', color: '#fff', flexShrink: 0,
      }}
    >
      {initials}
    </div>
  )
}

/* ── Grid card ── */
const StudentCard = ({
  student,
  drive,
  updating,
  updateRound,
  editingRound,
  setEditingRound,
  onSendEmail,
}: {
  student: DriveStudent
  drive: PlacementDrive
  updating: string | null
  updateRound: (id: string, order: number, result: 'qualified' | 'not_qualified') => void
  editingRound: string | null
  setEditingRound: (key: string | null) => void
  onSendEmail: (student: DriveStudent) => void
}) => (
  <Card style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: 12, height: '100%' }}>
    <Card.Body className="p-3">
      <div className="d-flex align-items-start gap-2 mb-3">
        <StudentAvatar name={student.studentName} />
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div className="fw-bold text-white text-truncate" style={{ fontSize: '0.9rem' }}>
            {student.studentName}
          </div>
          <div className="text-muted small text-truncate">{student.studentEmail}</div>
          {student.phoneNumber && <div className="text-muted small">{student.phoneNumber}</div>}
        </div>
        <button
          title="Send email"
          onClick={() => onSendEmail(student)}
          style={{
            background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: 6, color: '#3b82f6', cursor: 'pointer',
            padding: '5px 7px', lineHeight: 1, flexShrink: 0,
          }}
        >
          <FaEnvelope size={12} />
        </button>
      </div>

      <div className="d-flex gap-1 flex-wrap mb-2">
        {student.department && <Badge bg="secondary" style={{ fontSize: '0.7rem' }}>{student.department}</Badge>}
        {student.batch && (
          <Badge style={{ background: '#222', border: '1px solid #444', color: '#aaa', fontSize: '0.7rem' }}>
            {student.batch}
          </Badge>
        )}
        <Badge bg={student.isEligible ? 'success' : 'danger'} style={{ fontSize: '0.7rem' }}>
          {student.academicScore > 0
            ? (Number.isInteger(student.academicScore) ? student.academicScore : student.academicScore.toFixed(1))
            : '—'}{' '}CGPA
        </Badge>
        <Badge bg={student.hasBacklogs ? 'danger' : 'success'} style={{ fontSize: '0.7rem' }}>
          {student.hasBacklogs ? 'Backlogs' : 'Clear'}
        </Badge>
      </div>

      <div className="d-flex gap-2 mb-3">
        <Badge bg={student.isEligible ? 'success' : 'danger'} style={{ fontSize: '0.75rem' }}>
          {student.isEligible ? 'Eligible' : 'Not Eligible'}
        </Badge>
        {student.isEligible && (
          <Badge bg={OVERALL_BADGE[student.overallStatus]?.bg} style={{ fontSize: '0.75rem' }}>
            {OVERALL_BADGE[student.overallStatus]?.label}
          </Badge>
        )}
      </div>

      <div style={{ borderTop: '1px solid #2a2a2a', paddingTop: 10 }}>
        {drive.rounds.map((round) => {
          const rr         = student.roundResults.find((x) => x.order === round.order)
          const key        = student._id + '-' + round.order
          const isUpdating = updating === key
          const isEditing  = editingRound === key
          const isCurrent  =
            student.isEligible &&
            student.overallStatus === 'in_progress' &&
            student.currentRound === round.order
          const showActions = isCurrent || isEditing

          return (
            <div
              key={round.order}
              className="d-flex align-items-center justify-content-between mb-1"
              style={{ fontSize: '0.78rem' }}
            >
              <span className="text-muted">{round.name}</span>

              {(rr?.status === 'qualified' || rr?.status === 'not_qualified') && !isEditing ? (
                /* Badge + edit pencil */
                <div className="d-flex align-items-center gap-1">
                  {rr.status === 'qualified' ? (
                    <Badge bg="success" style={{ fontSize: '0.7rem' }}><FaCheckCircle className="me-1" />Qualified</Badge>
                  ) : (
                    <Badge bg="danger" style={{ fontSize: '0.7rem' }}><FaTimesCircle className="me-1" />Not Qual.</Badge>
                  )}
                  {student.isEligible && (
                    <button
                      title="Edit result"
                      onClick={() => setEditingRound(key)}
                      style={{
                        background: 'rgba(255,122,0,0.1)', border: '1px solid rgba(255,122,0,0.3)',
                        borderRadius: 4, color: '#ff7a00', cursor: 'pointer',
                        padding: '2px 4px', lineHeight: 1,
                      }}
                    >
                      <FaPencilAlt size={8} />
                    </button>
                  )}
                </div>
              ) : showActions ? (
                <div className="d-flex flex-column align-items-end gap-1">
                  <ButtonGroup size="sm">
                    <Button variant="outline-success" disabled={!!isUpdating}
                      onClick={() => updateRound(student._id, round.order, 'qualified')}
                      style={{ padding: '1px 6px' }}>
                      {isUpdating ? <Spinner size="sm" /> : <FaCheckCircle size={10} />}
                    </Button>
                    <Button variant="outline-danger" disabled={!!isUpdating}
                      onClick={() => updateRound(student._id, round.order, 'not_qualified')}
                      style={{ padding: '1px 6px' }}>
                      {isUpdating ? <Spinner size="sm" /> : <FaTimesCircle size={10} />}
                    </Button>
                  </ButtonGroup>
                  {isEditing && (
                    <button
                      onClick={() => setEditingRound(null)}
                      style={{ background: 'none', border: 'none', color: '#555', fontSize: '0.65rem', cursor: 'pointer', padding: 0 }}
                    >
                      cancel
                    </button>
                  )}
                </div>
              ) : (
                <span style={{ color: '#555', fontSize: '0.7rem' }}>
                  {!student.isEligible ? '—' : 'Pending'}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </Card.Body>
  </Card>
)

/* ── Header meta chip ── */
const MetaChip = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div
    style={{
      background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8,
      padding: '4px 12px', display: 'inline-flex', flexDirection: 'column',
    }}
  >
    <span style={{ fontSize: '0.6rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
      {label}
    </span>
    <span style={{ fontSize: '0.85rem', fontWeight: 700, color, lineHeight: 1.3 }}>
      {value}
    </span>
  </div>
)

export default DriveStudentsModal
