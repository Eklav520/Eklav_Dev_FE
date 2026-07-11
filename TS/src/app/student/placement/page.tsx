import React, { useEffect, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import {
  FaBriefcase, FaTrophy, FaBuilding, FaUsers,
  FaSearch, FaTimes, FaCalendarAlt, FaMapMarkerAlt,
  FaThLarge, FaList, FaFilter, FaEllipsisV, FaChevronLeft, FaChevronRight,
  FaMedal,
} from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'
import placementImg from '@/assets/images/Placement.png'
import boyImg from '@/assets/images/Boy.png'

interface Drive {
  _id: string
  companyName: string
  role: string
  package: string
  location: string
  driveDate: string | null
  status: 'upcoming' | 'ongoing' | 'completed'
}

interface PlacedStudent {
  _id: string
  studentName: string
  rollNumber: string
  studentEmail: string
  department: string
  batch: string
  overallStatus: string
  drive: Drive | null
}

interface Stats {
  totalDrives: number
  activeDrives: number
  totalPlaced: number
  totalStudents: number
}

interface MyRecord {
  _id: string
  driveId: string
  studentName: string
  overallStatus: 'in_progress' | 'placed' | 'eliminated'
  isEligible: boolean
  currentRound: number
  roundResults: { order: number; status: string; roundName?: string }[]
  drive: Drive | null
}

const STATUS_COLOR: Record<string, string> = {
  placed:      '#22c55e',
  in_progress: '#f59e0b',
  eliminated:  '#ef4444',
}
const STATUS_LABEL: Record<string, string> = {
  placed:      'Selected',
  in_progress: 'In Progress',
  eliminated:  'Eliminated',
}

const COMPANY_COLORS = ['#ff7a00', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#14b8a6', '#f59e0b']
const getColor = (name: string) => COMPANY_COLORS[name.charCodeAt(0) % COMPANY_COLORS.length]

const ROWS_OPTIONS = [10, 25, 50]

const StudentPlacementPage = () => {
  const { user } = useAuthContext()
  const baseURL  = import.meta.env.VITE_API_BASE_URL
  const headers  = { Authorization: `Bearer ${user?.token}` }

  const [tab, setTab]                 = useState<'board' | 'mine'>('board')
  const [viewMode, setViewMode]       = useState<'list' | 'grid'>('list')
  const [students, setStudents]       = useState<PlacedStudent[]>([])
  const [drives, setDrives]           = useState<Drive[]>([])
  const [myRecords, setMyRecords]     = useState<MyRecord[]>([])
  const [stats, setStats]             = useState<Stats | null>(null)
  const [batches, setBatches]         = useState<string[]>([])
  const [departments, setDepartments] = useState<string[]>([])
  const [loading, setLoading]         = useState(true)
  const [myLoading, setMyLoading]     = useState(false)

  const [search, setSearch]         = useState('')
  const [filterBatch, setFilterBatch]   = useState('')
  const [filterDept, setFilterDept]     = useState('')
  const [filterDrive, setFilterDrive]   = useState('')

  const [page, setPage]         = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [goToPage, setGoToPage] = useState('')

  const fetchBoard = async (batch = '', dept = '', driveId = '') => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (batch)   params.set('batch', batch)
      if (dept)    params.set('department', dept)
      if (driveId) params.set('driveId', driveId)
      const res  = await fetch(`${baseURL}/api/placement-drives/student/board?${params}`, { headers })
      const data = await res.json()
      if (data.success) {
        setStudents(data.students || [])
        setDrives(data.drives || [])
        setStats(data.stats)
        setBatches(data.filters?.batches || [])
        setDepartments(data.filters?.departments || [])
      }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const fetchMine = async () => {
    const email = user?.email
    if (!email) return
    setMyLoading(true)
    try {
      const res  = await fetch(`${baseURL}/api/placement-drives/student/my-status?email=${encodeURIComponent(email)}`, { headers })
      const data = await res.json()
      if (data.success) setMyRecords(data.records || [])
    } catch (e) { console.error(e) }
    finally { setMyLoading(false) }
  }

  useEffect(() => { fetchBoard() }, [])
  useEffect(() => { if (tab === 'mine') fetchMine() }, [tab])

  const handleFilter = (batch: string, dept: string, driveId: string) => {
    setFilterBatch(batch); setFilterDept(dept); setFilterDrive(driveId)
    setPage(1)
    fetchBoard(batch, dept, driveId)
  }
  const clearFilters = () => { setSearch(''); handleFilter('', '', '') }

  const filtered = students.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.studentName.toLowerCase().includes(q) ||
      s.studentEmail?.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q) ||
      s.drive?.companyName?.toLowerCase().includes(q) ||
      s.drive?.role?.toLowerCase().includes(q)
    )
  })

  const totalPages  = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const paginated   = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage)
  const hasFilters  = filterBatch || filterDept || filterDrive || search

  const handleGoToPage = () => {
    const p = parseInt(goToPage)
    if (!isNaN(p) && p >= 1 && p <= totalPages) setPage(p)
    setGoToPage('')
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>

      {/* ── Hero Banner ── */}
      <div style={{
        background: 'linear-gradient(120deg, #fff5ee 0%, #fde8d0 55%, #fbd4b0 100%)',
        borderBottom: '1px solid #fcd9b8',
        minHeight: 148,
        display: 'flex',
        alignItems: 'stretch',
        position: 'relative',
        overflow: 'hidden',
        paddingLeft: 28,
        paddingRight: 0,
      }}>
        {/* Decorative dot grid */}
        <div style={{ position: 'absolute', left: '38%', right: 0, top: 0, bottom: 0, opacity: 0.18, backgroundImage: 'radial-gradient(circle, #cc5500 1.5px, transparent 1.5px)', backgroundSize: '18px 18px', pointerEvents: 'none', zIndex: 0 }} />

        {/* Left: icon + title + subtitle — vertically centered */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, zIndex: 2, flexShrink: 0, alignSelf: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: '#fff', boxShadow: '0 4px 18px rgba(255,107,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FaMedal style={{ color: '#ff6b00', fontSize: 28 }} />
          </div>
          <div>
            <h4 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: 1.1 }}>Placement Board</h4>
            <p style={{ fontSize: 13, color: '#92400e', margin: '6px 0 0', opacity: 0.8 }}>
              Track placement drives and placed students from your college
            </p>
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Right column: buttons on top, illustration below */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', zIndex: 2, paddingTop: 14 }}>
          {/* Buttons — top right */}
          <div style={{ display: 'flex', gap: 10, paddingRight: 18 }}>
            <button
              onClick={() => setTab('board')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13,
                background: tab === 'board' ? '#ff6b00' : '#fff',
                color: tab === 'board' ? '#fff' : '#374151',
                border: tab === 'board' ? 'none' : '1.5px solid #e2e8f0',
                cursor: 'pointer',
                boxShadow: tab === 'board' ? '0 4px 16px rgba(255,107,0,0.38)' : '0 2px 8px rgba(0,0,0,0.1)',
                whiteSpace: 'nowrap',
              }}
            >
              <FaUsers style={{ fontSize: 14 }} /> Placed Students
            </button>
            <button
              onClick={() => setTab('mine')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 20px', borderRadius: 10, fontWeight: 700, fontSize: 13,
                background: tab === 'mine' ? '#ff6b00' : '#fff',
                color: tab === 'mine' ? '#fff' : '#374151',
                border: tab === 'mine' ? 'none' : '1.5px solid #e2e8f0',
                cursor: 'pointer',
                boxShadow: tab === 'mine' ? '0 4px 16px rgba(255,107,0,0.38)' : '0 2px 8px rgba(0,0,0,0.1)',
                whiteSpace: 'nowrap',
              }}
            >
              <FaTrophy style={{ fontSize: 13 }} /> My Status
            </button>
          </div>

          {/* Mockup card + illustration combined — overlapping */}
          <div style={{ position: 'relative', width: 380, height: 160, transform: 'translateX(-140px)', flexShrink: 0 }}>

            {/* CSS UI Mockup Card — behind, left side */}
            <div style={{
              position: 'absolute', left: 0, bottom: 8, zIndex: 1,
              width: 120, background: 'rgba(255,255,255,0.88)',
              borderRadius: 14, padding: '10px 12px',
              boxShadow: '0 8px 28px rgba(255,107,0,0.12)',
            }}>
              {/* Top: avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 9 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#ff6b00', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FaUsers style={{ color: '#fff', fontSize: 10 }} />
                </div>
                <div>
                  <div style={{ width: 48, height: 4, background: '#1e293b', borderRadius: 4, marginBottom: 3 }} />
                  <div style={{ width: 32, height: 3, background: '#cbd5e1', borderRadius: 4 }} />
                </div>
              </div>
              {/* Mini chart */}
              <div style={{ marginBottom: 9, background: '#fff7f0', borderRadius: 8, padding: '5px 7px' }}>
                <svg width="96" height="32" viewBox="0 0 96 32">
                  <polyline points="0,28 16,20 32,24 48,10 64,16 80,6 96,2" fill="none" stroke="#ff6b00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="0,28 16,20 32,24 48,10 64,16 80,6 96,2 96,32 0,32" fill="rgba(255,107,0,0.08)" />
                  <circle cx="96" cy="2" r="3" fill="#ff6b00" />
                </svg>
              </div>
              {/* List items */}
              {[65, 50, 78].map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: i < 2 ? 5 : 0 }}>
                  <div style={{ width: 11, height: 11, borderRadius: 3, background: i === 0 ? '#ff6b00' : '#f1f5f9', border: i === 0 ? 'none' : '1.5px solid #e2e8f0', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {i === 0 && <div style={{ width: 4, height: 3, borderLeft: '1.5px solid #fff', borderBottom: '1.5px solid #fff', transform: 'rotate(-45deg) translateY(-1px)' }} />}
                  </div>
                  <div style={{ height: 3.5, background: '#e2e8f0', borderRadius: 4, width: w }} />
                </div>
              ))}
            </div>

            {/* Illustration — swaps based on active tab */}
            <img
              src={tab === 'mine' ? boyImg : placementImg}
              alt="Placement illustration"
              style={{
                position: 'absolute', right: 0, bottom: 0, zIndex: 2,
                height: 160, width: 340,
                objectFit: 'contain',
                objectPosition: 'left bottom',
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Page content padding ── */}
      <div style={{ padding: '24px' }}>

      {/* ── KPI Cards ── */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'TOTAL DRIVES',    sub: 'All Time',  value: stats.totalDrives,   color: '#ff6b00', bg: '#fff7f0', icon: <FaBriefcase /> },
            { label: 'ACTIVE DRIVES',   sub: 'Ongoing',   value: stats.activeDrives,  color: '#22c55e', bg: '#f0fdf4', icon: <FaBuilding />  },
            { label: 'STUDENTS PLACED', sub: 'All Time',  value: stats.totalPlaced,   color: '#a855f7', bg: '#faf5ff', icon: <FaTrophy />    },
            { label: 'TOTAL ENROLLED',  sub: 'Students',  value: stats.totalStudents, color: '#3b82f6', bg: '#eff6ff', icon: <FaUsers />     },
          ].map(({ label, sub, value, color, bg, icon }) => (
            <div key={label} style={{
              background: '#fff', border: '1px solid #f1f5f9', borderRadius: 14,
              padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: 20, flexShrink: 0 }}>
                {icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, letterSpacing: '0.5px', marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>
              </div>
              <FaEllipsisV style={{ color: '#cbd5e1', fontSize: 14, flexShrink: 0 }} />
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════
          TAB: PLACED STUDENTS (BOARD)
         ══════════════════════════════ */}
      {tab === 'board' && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

          {/* Filter bar */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 0 }}>
              <FaSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13 }} />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search by name, email, company or skills..."
                style={{
                  width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0',
                  color: '#374151', borderRadius: 10, padding: '9px 12px 9px 34px',
                  fontSize: 13, outline: 'none',
                }}
              />
            </div>

            <LightSelect value={filterDrive} onChange={v => handleFilter(filterBatch, filterDept, v)} placeholder="All Drives"
              options={drives.map(d => ({ value: d._id, label: d.companyName + (d.role ? ` — ${d.role}` : '') }))} />
            <LightSelect value={filterDept} onChange={v => handleFilter(filterBatch, v, filterDrive)} placeholder="All Departments"
              options={departments.map(d => ({ value: d, label: d }))} />
            <LightSelect value={filterBatch} onChange={v => handleFilter(v, filterDept, filterDrive)} placeholder="All Batches"
              options={batches.map(b => ({ value: b, label: b }))} />

            <button
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', color: '#374151', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              <FaFilter style={{ fontSize: 12, color: '#64748b' }} /> Filter
            </button>

            {hasFilters && (
              <button onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', borderRadius: 8, padding: '8px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>
                <FaTimes size={10} /> Clear
              </button>
            )}

            {/* Count + view toggle */}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                {filtered.length > 0
                  ? `${(page - 1) * rowsPerPage + 1}–${Math.min(page * rowsPerPage, filtered.length)} of ${filtered.length} students`
                  : '0 students'}
              </span>
              <div style={{ display: 'flex', gap: 2 }}>
                {([['list', <FaList size={13} />], ['grid', <FaThLarge size={13} />]] as const).map(([mode, icon]) => (
                  <button key={mode} onClick={() => setViewMode(mode)} style={{ padding: '7px 9px', border: '1px solid #e2e8f0', borderRadius: 8, background: viewMode === mode ? '#ff6b00' : '#fff', color: viewMode === mode ? '#fff' : '#94a3b8', cursor: 'pointer' }}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}><Spinner variant="warning" /></div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px', color: '#94a3b8' }}>
              <FaTrophy style={{ fontSize: 36, color: '#e2e8f0', marginBottom: 12 }} />
              <div style={{ fontWeight: 600, fontSize: 15 }}>No placed students{hasFilters ? ' match the filters' : ' yet'}</div>
            </div>
          ) : viewMode === 'list' ? (
            <LightListView students={paginated} startIdx={(page - 1) * rowsPerPage} />
          ) : (
            <div style={{ padding: 20 }}>
              <LightGridView students={paginated} />
            </div>
          )}

          {/* Pagination */}
          {filtered.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid #f1f5f9', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1) }}
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 8px', fontSize: 12, color: '#374151', outline: 'none' }}
                >
                  {ROWS_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <PageBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}><FaChevronLeft size={10} /></PageBtn>
                {getPaginationRange(page, totalPages).map((p, i) =>
                  p === '...'
                    ? <span key={`dots-${i}`} style={{ padding: '0 6px', color: '#94a3b8', fontSize: 13 }}>...</span>
                    : <PageBtn key={p} onClick={() => setPage(Number(p))} active={page === Number(p)}>{p}</PageBtn>
                )}
                <PageBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}><FaChevronRight size={10} /></PageBtn>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#94a3b8' }}>Go to page:</span>
                <input
                  value={goToPage}
                  onChange={e => setGoToPage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGoToPage()}
                  style={{ width: 50, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 8px', fontSize: 12, color: '#374151', outline: 'none', textAlign: 'center' }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════
          TAB: MY STATUS
         ══════════════════════════════ */}
      {tab === 'mine' && (
        <MyStatusTab
          myRecords={myRecords}
          myLoading={myLoading}
          studentName={
            myRecords.find(r => r.studentName)?.studentName ||
            user?.fullName || user?.firstName || user?.username || 'Student'
          }
        />
      )}
      </div>{/* end padding div */}
    </div>
  )
}

/* ── Pagination helpers ── */
const getPaginationRange = (current: number, total: number): (number | '...')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 3) return [1, 2, 3, '...', total]
  if (current >= total - 2) return [1, '...', total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

const PageBtn = ({ children, onClick, disabled, active }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      minWidth: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0',
      background: active ? '#ff6b00' : '#fff',
      color: active ? '#fff' : disabled ? '#cbd5e1' : '#374151',
      fontSize: 12, fontWeight: active ? 700 : 500,
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px',
    }}
  >{children}</button>
)

/* ── Avatar ── */
const Avatar = ({ name, color, size = 40 }: { name: string; color: string; size?: number }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    background: `${color}18`, border: `2px solid ${color}40`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color, fontWeight: 800, fontSize: size * 0.35,
  }}>
    {name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
  </div>
)

/* ── Light List View ── */
const LightListView = ({ students, startIdx }: { students: PlacedStudent[]; startIdx: number }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
      <thead>
        <tr style={{ background: '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
          {['#', 'STUDENT', 'ROLL NO / EMAIL', 'DEPARTMENT', 'BATCH', 'COMPANY', 'ROLE', 'PACKAGE', ''].map((h, i) => (
            <th key={i} style={{ padding: '11px 16px', color: '#94a3b8', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left', whiteSpace: 'nowrap' }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {students.map((s, idx) => {
          const color = s.drive ? getColor(s.drive.companyName) : '#888'
          return (
            <tr key={s._id}
              style={{ borderBottom: '1px solid #f8fafc', transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <td style={{ padding: '13px 16px', color: '#94a3b8', fontSize: 12 }}>{startIdx + idx + 1}</td>

              <td style={{ padding: '13px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={s.studentName} color={color} size={38} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>{s.studentName}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', background: '#f0fdf4', borderRadius: 6, padding: '1px 8px', display: 'inline-block', marginTop: 3 }}>
                      Placed
                    </span>
                  </div>
                </div>
              </td>

              <td style={{ padding: '13px 16px' }}>
                {s.rollNumber && <div style={{ color: '#374151', fontWeight: 700, fontSize: 13 }}>{s.rollNumber}</div>}
                {s.studentEmail && <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 2 }}>{s.studentEmail}</div>}
                {!s.rollNumber && !s.studentEmail && <span style={{ color: '#cbd5e1' }}>—</span>}
              </td>

              <td style={{ padding: '13px 16px', color: '#374151', fontSize: 13 }}>{s.department || '—'}</td>

              <td style={{ padding: '13px 16px' }}>
                {s.batch ? (
                  <span style={{ background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                    {s.batch}
                  </span>
                ) : '—'}
              </td>

              <td style={{ padding: '13px 16px' }}>
                {s.drive ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${getColor(s.drive.companyName)}15`, border: `1.5px solid ${getColor(s.drive.companyName)}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: getColor(s.drive.companyName), fontWeight: 800, fontSize: 9, flexShrink: 0 }}>
                      {s.drive.companyName.slice(0, 3).toUpperCase()}
                    </div>
                    <span style={{ color: '#0f172a', fontWeight: 600 }}>{s.drive.companyName}</span>
                  </div>
                ) : '—'}
              </td>

              <td style={{ padding: '13px 16px', color: '#374151' }}>{s.drive?.role || '—'}</td>

              <td style={{ padding: '13px 16px' }}>
                {s.drive?.package ? (
                  <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>
                    {s.drive.package}
                  </span>
                ) : '—'}
              </td>

              <td style={{ padding: '13px 16px' }}>
                <FaEllipsisV style={{ color: '#cbd5e1', fontSize: 13, cursor: 'pointer' }} />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
)

/* ── Light Grid View ── */
const LightGridView = ({ students }: { students: PlacedStudent[] }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
    {students.map(s => {
      const color = s.drive ? getColor(s.drive.companyName) : '#888'
      return (
        <div key={s._id} style={{
          background: '#fff', border: '1px solid #f1f5f9', borderRadius: 14,
          overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          transition: 'box-shadow 0.15s, transform 0.15s',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.1)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 6px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)' }}
        >
          <div style={{ padding: '20px 16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, borderBottom: '1px solid #f8fafc' }}>
            <Avatar name={s.studentName} color={color} size={56} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>{s.studentName}</div>
              {s.rollNumber && <div style={{ color: '#ff6b00', fontWeight: 700, fontSize: 12, marginTop: 2 }}>{s.rollNumber}</div>}
              {s.studentEmail && <div style={{ color: '#94a3b8', fontSize: 11, marginTop: 1, wordBreak: 'break-all' }}>{s.studentEmail}</div>}
            </div>
          </div>
          <div style={{ padding: '12px 16px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {[
              { label: 'Company', value: s.drive?.companyName },
              { label: 'Role',    value: s.drive?.role },
              { label: 'Dept',    value: s.department },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>{value || '—'}</span>
              </div>
            ))}
            {s.batch && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Batch</span>
                <span style={{ background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: 20, padding: '1px 9px', fontSize: 11, fontWeight: 700 }}>{s.batch}</span>
              </div>
            )}
            {s.drive?.package && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Package</span>
                <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 20, padding: '1px 9px', fontSize: 11, fontWeight: 700 }}>{s.drive.package}</span>
              </div>
            )}
          </div>
          <div style={{ margin: '0 14px 14px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
            <span style={{ color: '#16a34a', fontSize: 12, fontWeight: 700 }}>✓ Placed</span>
          </div>
        </div>
      )
    })}
  </div>
)

/* ── My Status Tab ── */
const CONFETTI = ['🌸', '🎊', '⭐', '🌺', '🎉', '✨', '💐', '🎈', '🌟', '🎀']
const DELAYS   = [0, 0.3, 0.6, 0.9, 1.2, 1.5, 0.15, 0.45, 0.75, 1.05]

const MyStatusTab = ({ myRecords, myLoading, studentName }: { myRecords: MyRecord[]; myLoading: boolean; studentName: string }) => {
  const isPlaced = myRecords.some(r => r.overallStatus === 'placed')
  if (myLoading) return <div style={{ textAlign: 'center', padding: '60px 0' }}><Spinner variant="warning" /></div>
  if (myRecords.length === 0) return (
    <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 16, padding: '60px 24px', textAlign: 'center', color: '#94a3b8' }}>
      <FaBriefcase style={{ fontSize: 36, color: '#e2e8f0', marginBottom: 12 }} />
      <div style={{ fontWeight: 600 }}>You haven't been enrolled in any placement drive yet.</div>
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes confettiFall { 0% { transform:translateY(-20px) rotate(0deg) scale(1); opacity:1; } 80% { opacity:1; } 100% { transform:translateY(180px) rotate(480deg) scale(0.6); opacity:0; } }
        @keyframes pulseGlowGreen { 0%,100% { box-shadow:0 0 24px rgba(34,197,94,0.18); } 50% { box-shadow:0 0 40px rgba(34,197,94,0.35); } }
        @keyframes slideUp { from { transform:translateY(20px); opacity:0; } to { transform:translateY(0); opacity:1; } }
        @keyframes shimmerText { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
        @keyframes starPop { 0% { transform:scale(0) rotate(-20deg); opacity:0; } 60% { transform:scale(1.2) rotate(5deg); opacity:1; } 100% { transform:scale(1) rotate(0deg); opacity:1; } }
        .my-status-card { animation:slideUp 0.4s ease both; }
      `}</style>

      {isPlaced && (
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 60%,#bbf7d0 100%)',
          border: '1px solid #86efac', borderRadius: 18,
          padding: '40px 24px 32px', textAlign: 'center', marginBottom: 20,
          animation: 'pulseGlowGreen 3s ease-in-out infinite',
        }}>
          {CONFETTI.map((emoji, i) => (
            <span key={i} style={{ position: 'absolute', left: `${8 + i * 9}%`, top: '-10px', fontSize: i % 3 === 0 ? '1.4rem' : '1rem', animation: `confettiFall 2.8s ease-in ${DELAYS[i]}s infinite`, pointerEvents: 'none', userSelect: 'none' }}>{emoji}</span>
          ))}
          <div style={{ fontSize: '3.5rem', marginBottom: 12, animation: 'starPop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.2s both', display: 'inline-block' }}>🏆</div>
          <div style={{ fontSize: 11, letterSpacing: '3px', textTransform: 'uppercase', color: '#16a34a', fontWeight: 700, marginBottom: 8, animation: 'slideUp 0.4s ease 0.3s both' }}>Congratulations</div>
          <div style={{ animation: 'slideUp 0.4s ease 0.4s both', marginBottom: 6 }}>
            <span style={{ fontSize: '1.9rem', fontWeight: 800, background: 'linear-gradient(90deg,#ff6b00,#ffb347,#ff6b00)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'shimmerText 2.5s linear infinite', display: 'inline' }}>{studentName}</span>
            <span style={{ fontSize: '1.9rem' }}> 🎉</span>
          </div>
          <div style={{ color: '#166534', fontSize: '0.9rem', fontWeight: 500, animation: 'slideUp 0.4s ease 0.5s both' }}>
            You have been <strong style={{ color: '#16a34a' }}>selected</strong> in a placement drive.<br />
            <span style={{ color: '#15803d', fontSize: '0.8rem' }}>Your hard work has paid off — keep shining! ✨</span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {myRecords.map((r, idx) => {
          const drive = r.drive
          if (!drive) return null
          const color    = getColor(drive.companyName)
          const status   = r.overallStatus
          const placed   = status === 'placed'
          const eliminated = status === 'eliminated'
          return (
            <div key={r._id} className="my-status-card" style={{
              animationDelay: `${idx * 0.1}s`,
              background: '#fff',
              border: `1px solid ${placed ? '#bbf7d0' : eliminated ? '#fecaca' : '#f1f5f9'}`,
              borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            }}>
              <div style={{ height: 3, background: placed ? 'linear-gradient(90deg,#22c55e,#4ade80)' : eliminated ? '#ef4444' : color }} />
              <div style={{ padding: '20px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: `${color}15`, border: `2px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                      {drive.companyName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>{drive.companyName}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {drive.role && <span>{drive.role}</span>}
                        {drive.location && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><FaMapMarkerAlt size={9} />{drive.location}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {drive.package && (
                      <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 700 }}>
                        {drive.package}
                      </span>
                    )}
                    <span style={{ background: placed ? '#f0fdf4' : eliminated ? '#fef2f2' : '#fffbeb', color: STATUS_COLOR[status], border: `1px solid ${STATUS_COLOR[status]}40`, borderRadius: 20, padding: '5px 14px', fontSize: 13, fontWeight: 700 }}>
                      {STATUS_LABEL[status]}
                    </span>
                  </div>
                </div>
                {r.roundResults.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: '#ff6b00', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10, fontWeight: 700 }}>Round Results</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {r.roundResults.sort((a, b) => a.order - b.order).map((rr, ri, arr) => {
                        const passed = rr.status === 'qualified'
                        const failed = rr.status === 'not_qualified'
                        return (
                          <div key={rr.order} style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ background: '#f8fafc', border: `1px solid ${passed ? '#bbf7d0' : failed ? '#fecaca' : '#e2e8f0'}`, borderRadius: 10, padding: '8px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, minWidth: 80 }}>
                              <span style={{ color: '#ff6b00', fontWeight: 700, fontSize: 10 }}>Round {rr.order}</span>
                              {rr.roundName && <span style={{ color: '#374151', fontWeight: 600, fontSize: 11, textAlign: 'center' }}>{rr.roundName}</span>}
                              <span style={{ color: passed ? '#16a34a' : failed ? '#ef4444' : '#f59e0b', fontWeight: 700, fontSize: 11 }}>
                                {failed ? '✗ Out' : passed ? '✓ Passed' : '· Pending'}
                              </span>
                            </div>
                            {ri < arr.length - 1 && <div style={{ width: 14, height: 2, background: '#e2e8f0', flexShrink: 0 }} />}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                {drive.driveDate && (
                  <div style={{ marginTop: 14, fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <FaCalendarAlt size={10} />
                    {new Date(drive.driveDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

/* ── Light filter select ── */
const LightSelect = ({ value, onChange, placeholder, options }: { value: string; onChange: (v: string) => void; placeholder: string; options: { value: string; label: string }[] }) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: value ? '#374151' : '#94a3b8', borderRadius: 10, padding: '9px 12px', fontSize: 13, cursor: 'pointer', outline: 'none' }}
  >
    <option value="">{placeholder}</option>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
)

export default StudentPlacementPage
