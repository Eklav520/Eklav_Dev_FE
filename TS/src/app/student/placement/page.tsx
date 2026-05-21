import React, { useEffect, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import {
  FaBriefcase, FaTrophy, FaBuilding, FaUsers,
  FaSearch, FaTimes, FaCalendarAlt, FaMapMarkerAlt,
  FaThLarge, FaList,
} from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

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


const COMPANY_COLORS = ['#ff7a00','#22c55e','#3b82f6','#a855f7','#ec4899','#14b8a6','#f59e0b']
const getColor = (name: string) => COMPANY_COLORS[name.charCodeAt(0) % COMPANY_COLORS.length]

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
    setFilterBatch(batch)
    setFilterDept(dept)
    setFilterDrive(driveId)
    fetchBoard(batch, dept, driveId)
  }

  const clearFilters = () => handleFilter('', '', '')

  const filtered = students.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      s.studentName.toLowerCase().includes(q) ||
      s.department?.toLowerCase().includes(q) ||
      s.drive?.companyName?.toLowerCase().includes(q) ||
      s.drive?.role?.toLowerCase().includes(q)
    )
  })

  const hasFilters = filterBatch || filterDept || filterDrive || search

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '24px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div>
          <h4 className="text-white fw-bold mb-1">Placement Board</h4>
          <p className="text-muted mb-0" style={{ fontSize: '0.85rem' }}>
            Track placement drives and selected students from your college
          </p>
        </div>

        {/* Tabs — right side of header */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { key: 'board', label: 'Selected Students' },
            { key: 'mine',  label: 'My Status' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as 'board' | 'mine')}
              style={{
                padding: '8px 20px', borderRadius: 20, fontWeight: 600, fontSize: '0.82rem',
                border: '1px solid',
                background: tab === t.key ? '#ff7a00' : 'transparent',
                borderColor: tab === t.key ? '#ff7a00' : '#2a2a2a',
                color: tab === t.key ? '#fff' : '#888',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      {stats && (
        <div className="d-flex gap-3 mb-4 flex-wrap">
          {[
            { label: 'Total Drives',    value: stats.totalDrives,   color: '#ff7a00', icon: <FaBriefcase /> },
            { label: 'Active Drives',   value: stats.activeDrives,  color: '#22c55e', icon: <FaBuilding />  },
            { label: 'Students Placed', value: stats.totalPlaced,   color: '#a855f7', icon: <FaTrophy />    },
            { label: 'Total Enrolled',  value: stats.totalStudents, color: '#60a5fa', icon: <FaUsers />     },
          ].map(({ label, value, color, icon }) => (
            <div key={label} style={{
              flex: '1 1 160px', background: '#111', border: '1px solid #1f1f1f',
              borderRadius: 12, padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                background: `${color}18`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color, fontSize: '1.1rem',
              }}>{icon}</div>
              <div>
                <div style={{ fontSize: '0.63rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', lineHeight: 1 }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* ══════════════════════════════
          TAB: SELECTED STUDENTS (BOARD)
         ══════════════════════════════ */}
      {tab === 'board' && (
        <>
          {/* Filter bar */}
          <div style={{
            background: '#111', border: '1px solid #1f1f1f', borderRadius: 12,
            padding: '14px 18px', marginBottom: 16,
            display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
          }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 200px' }}>
              <FaSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: '0.75rem' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search name, company, department…"
                style={{
                  width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a',
                  color: '#e2e8f0', borderRadius: 8, padding: '7px 10px 7px 28px',
                  fontSize: '0.8rem', outline: 'none',
                }}
              />
            </div>

            <FilterSelect
              value={filterDrive}
              onChange={v => handleFilter(filterBatch, filterDept, v)}
              placeholder="All Drives"
              options={drives.map(d => ({ value: d._id, label: d.companyName + (d.role ? ` — ${d.role}` : '') }))}
            />
            <FilterSelect
              value={filterDept}
              onChange={v => handleFilter(filterBatch, v, filterDrive)}
              placeholder="All Departments"
              options={departments.map(d => ({ value: d, label: d }))}
            />
            <FilterSelect
              value={filterBatch}
              onChange={v => handleFilter(v, filterDept, filterDrive)}
              placeholder="All Batches"
              options={batches.map(b => ({ value: b, label: b }))}
            />

            {hasFilters && (
              <button
                onClick={clearFilters}
                style={{
                  background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#ef4444', borderRadius: 8, padding: '7px 12px',
                  fontSize: '0.78rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <FaTimes size={11} /> Clear
              </button>
            )}

            <span style={{ fontSize: '0.72rem', color: '#666', marginLeft: 'auto' }}>
              <span style={{ color: '#22c55e', fontWeight: 700 }}>{filtered.length}</span> student{filtered.length !== 1 ? 's' : ''}
            </span>

            {/* View toggle */}
            <div style={{ display: 'flex', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, overflow: 'hidden' }}>
              {([['list', <FaList size={13} />], ['grid', <FaThLarge size={13} />]] as const).map(([mode, icon]) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  title={mode === 'list' ? 'List view' : 'Grid view'}
                  style={{
                    padding: '6px 11px', border: 'none', cursor: 'pointer',
                    background: viewMode === mode ? '#ff7a00' : 'transparent',
                    color: viewMode === mode ? '#fff' : '#555',
                    transition: 'all 0.15s',
                  }}
                >{icon}</button>
              ))}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-5"><Spinner variant="warning" /></div>
          ) : filtered.length === 0 ? (
            <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
              <FaTrophy size={32} className="mb-3 opacity-25 text-muted" />
              <p className="text-muted mb-0">No selected students{hasFilters ? ' match the filters' : ' yet'}.</p>
            </div>
          ) : viewMode === 'list' ? (
            <ListView students={filtered} />
          ) : (
            <GridView students={filtered} />
          )}
        </>
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
    </div>
  )
}

/* ── Human silhouette avatar ── */
const HumanAvatar = ({ color, size = 40 }: { color: string; size?: number }) => (
  <div style={{
    width: size, height: size, borderRadius: '50%', flexShrink: 0,
    background: `${color}20`, border: `2px solid ${color}55`,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    overflow: 'hidden', position: 'relative',
  }}>
    {/* Head */}
    <div style={{
      position: 'absolute',
      top: size * 0.16,
      left: '50%',
      transform: 'translateX(-50%)',
      width: size * 0.36,
      height: size * 0.36,
      borderRadius: '50%',
      background: color,
      opacity: 0.85,
    }} />
    {/* Shoulders / body */}
    <div style={{
      width: size * 0.78,
      height: size * 0.42,
      borderRadius: `${size * 0.42}px ${size * 0.42}px 0 0`,
      background: color,
      opacity: 0.7,
      marginBottom: 0,
      flexShrink: 0,
    }} />
  </div>
)

/* ── List View ── */
const ListView = ({ students }: { students: PlacedStudent[] }) => (
  <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, overflow: 'hidden' }}>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
        <thead>
          <tr style={{ background: '#0d0d0d', borderBottom: '1px solid #222' }}>
            {['#', 'Student', 'Roll No / Email', 'Department', 'Batch', 'Company', 'Role', 'Package'].map(h => (
              <th key={h} style={{ padding: '11px 14px', color: '#ff7a00', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.4px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map((s, idx) => {
            const color = s.drive ? getColor(s.drive.companyName) : '#888'
            return (
              <tr key={s._id} style={{ borderBottom: '1px solid #181818', transition: 'background 0.12s' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#161616')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '11px 14px', color: '#555', fontSize: '0.72rem' }}>{idx + 1}</td>

                {/* Student name + avatar */}
                <td style={{ padding: '11px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <HumanAvatar color={color} size={38} />
                    <span style={{ color: '#fff', fontWeight: 600 }}>{s.studentName}</span>
                  </div>
                </td>

                {/* Roll No + Email */}
                <td style={{ padding: '11px 14px' }}>
                  {s.rollNumber && (
                    <div style={{ color: '#ff7a00', fontWeight: 700, fontSize: '0.78rem' }}>{s.rollNumber}</div>
                  )}
                  {s.studentEmail && (
                    <div style={{ color: '#6b7280', fontSize: '0.72rem', marginTop: 2 }}>{s.studentEmail}</div>
                  )}
                  {!s.rollNumber && !s.studentEmail && <span style={{ color: '#333' }}>—</span>}
                </td>

                <td style={{ padding: '11px 14px', color: '#aaa' }}>{s.department || '—'}</td>
                <td style={{ padding: '11px 14px' }}>
                  {s.batch ? (
                    <span style={{ background: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 20, padding: '2px 9px', fontSize: '0.7rem', fontWeight: 700 }}>
                      {s.batch}
                    </span>
                  ) : '—'}
                </td>
                <td style={{ padding: '11px 14px' }}>
                  {s.drive ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: `${getColor(s.drive.companyName)}22`, border: `1px solid ${getColor(s.drive.companyName)}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: getColor(s.drive.companyName), fontWeight: 700, fontSize: '0.65rem', flexShrink: 0 }}>
                        {s.drive.companyName.slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ color: '#fff', fontWeight: 600 }}>{s.drive.companyName}</span>
                    </div>
                  ) : '—'}
                </td>
                <td style={{ padding: '11px 14px', color: '#aaa' }}>{s.drive?.role || '—'}</td>
                <td style={{ padding: '11px 14px' }}>
                  {s.drive?.package ? (
                    <span style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
                      {s.drive.package}
                    </span>
                  ) : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  </div>
)

/* ── My Status Tab ── */
const CONFETTI = ['🌸','🎊','⭐','🌺','🎉','✨','💐','🎈','🌟','🎀']
const DELAYS   = [0, 0.3, 0.6, 0.9, 1.2, 1.5, 0.15, 0.45, 0.75, 1.05]

const MyStatusTab = ({
  myRecords, myLoading, studentName,
}: {
  myRecords: MyRecord[]
  myLoading: boolean
  studentName: string
}) => {
  const isPlaced = myRecords.some(r => r.overallStatus === 'placed')

  if (myLoading) return <div className="text-center py-5"><Spinner variant="warning" /></div>

  if (myRecords.length === 0) return (
    <div style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: 12, padding: '48px 24px', textAlign: 'center' }}>
      <FaBriefcase size={36} className="mb-3 opacity-25 text-muted" />
      <p className="text-muted mb-0">You haven't been enrolled in any placement drive yet.</p>
    </div>
  )

  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg) scale(1);   opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(180px) rotate(480deg) scale(0.6); opacity: 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 24px rgba(34,197,94,0.25), 0 0 60px rgba(34,197,94,0.08); }
          50%       { box-shadow: 0 0 40px rgba(34,197,94,0.45), 0 0 80px rgba(34,197,94,0.18); }
        }
        @keyframes slideUp {
          from { transform: translateY(24px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes shimmerText {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes starPop {
          0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
          60%  { transform: scale(1.2) rotate(5deg);  opacity: 1; }
          100% { transform: scale(1)   rotate(0deg);  opacity: 1; }
        }
        @keyframes badgeBounce {
          0%, 100% { transform: translateY(0); }
          40%       { transform: translateY(-6px); }
          70%       { transform: translateY(-3px); }
        }
        .my-status-card { animation: slideUp 0.45s ease both; }
      `}</style>

      {/* ── Celebration banner (placed only) ── */}
      {isPlaced && (
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(135deg, #0a1f0a 0%, #0d1f0d 50%, #061406 100%)',
          border: '1px solid rgba(34,197,94,0.3)', borderRadius: 18,
          padding: '40px 24px 32px', textAlign: 'center', marginBottom: 20,
          animation: 'pulseGlow 3s ease-in-out infinite',
        }}>
          {/* Floating confetti */}
          {CONFETTI.map((emoji, i) => (
            <span key={i} style={{
              position: 'absolute',
              left: `${8 + i * 9}%`,
              top: '-10px',
              fontSize: i % 3 === 0 ? '1.4rem' : i % 3 === 1 ? '1rem' : '1.2rem',
              animation: `confettiFall 2.8s ease-in ${DELAYS[i]}s infinite`,
              pointerEvents: 'none',
              userSelect: 'none',
            }}>{emoji}</span>
          ))}

          {/* Trophy */}
          <div style={{
            fontSize: '3.5rem', marginBottom: 12,
            animation: 'starPop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.2s both',
            display: 'inline-block',
          }}>🏆</div>

          {/* Congratulations text */}
          <div style={{
            fontSize: '0.75rem', letterSpacing: '3px', textTransform: 'uppercase',
            color: '#22c55e', fontWeight: 700, marginBottom: 8,
            animation: 'slideUp 0.4s ease 0.3s both',
          }}>Congratulations</div>

          <div style={{ animation: 'slideUp 0.4s ease 0.4s both', marginBottom: 6 }}>
            <span style={{
              fontSize: '1.9rem', fontWeight: 800,
              background: 'linear-gradient(90deg, #ff7a00, #ffb347, #ff7a00)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'shimmerText 2.5s linear infinite',
              display: 'inline',
            }}>{studentName}</span>
            <span style={{ fontSize: '1.9rem' }}> 🎉</span>
          </div>

          <div style={{
            color: '#86efac', fontSize: '0.95rem', fontWeight: 500,
            animation: 'slideUp 0.4s ease 0.5s both',
          }}>
            You have been <strong style={{ color: '#22c55e' }}>selected</strong> in a placement drive.
            <br />
            <span style={{ color: '#4ade80', fontSize: '0.82rem' }}>Your hard work has paid off — keep shining! ✨</span>
          </div>
        </div>
      )}

      {/* ── Drive cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {myRecords.map((r, idx) => {
          const drive  = r.drive
          if (!drive) return null
          const color  = getColor(drive.companyName)
          const status = r.overallStatus
          const placed = status === 'placed'
          const eliminated = status === 'eliminated'

          return (
            <div key={r._id} className="my-status-card" style={{
              animationDelay: `${idx * 0.1}s`,
              background: placed
                ? 'linear-gradient(135deg, #0c1f0c, #0f2a0f)'
                : eliminated
                ? 'linear-gradient(135deg, #1a0a0a, #1f0d0d)'
                : '#111',
              border: `1px solid ${placed ? 'rgba(34,197,94,0.3)' : eliminated ? 'rgba(239,68,68,0.2)' : '#1f1f1f'}`,
              borderRadius: 16, overflow: 'hidden',
            }}>
              {/* Card top stripe */}
              <div style={{ height: 3, background: placed ? 'linear-gradient(90deg,#22c55e,#4ade80,#22c55e)' : eliminated ? '#ef4444' : color, backgroundSize: '200% auto', animation: placed ? 'shimmerText 2s linear infinite' : 'none' }} />

              <div style={{ padding: '20px 22px' }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {/* Company logo */}
                    <div style={{
                      width: 52, height: 52, borderRadius: 13,
                      background: `${color}22`, border: `2px solid ${color}55`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color, fontWeight: 800, fontSize: '1rem', flexShrink: 0,
                      ...(placed ? { animation: 'badgeBounce 2s ease-in-out infinite' } : {}),
                    }}>
                      {drive.companyName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.05rem' }}>{drive.companyName}</div>
                      <div style={{ color: '#666', fontSize: '0.75rem', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {drive.role && <span>{drive.role}</span>}
                        {drive.location && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                            <FaMapMarkerAlt size={9} />{drive.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {drive.package && (
                      <span style={{
                        background: 'rgba(34,197,94,0.12)', color: '#22c55e',
                        border: '1px solid rgba(34,197,94,0.3)', borderRadius: 20,
                        padding: '4px 14px', fontSize: '0.8rem', fontWeight: 700,
                      }}>
                        💰 {drive.package}
                      </span>
                    )}
                    <span style={{
                      background: placed ? 'rgba(34,197,94,0.15)' : eliminated ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                      color: STATUS_COLOR[status],
                      border: `1px solid ${STATUS_COLOR[status]}40`,
                      borderRadius: 20, padding: '4px 14px', fontSize: '0.8rem', fontWeight: 700,
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      {placed ? '🎖️' : eliminated ? '❌' : '⏳'} {STATUS_LABEL[status]}
                    </span>
                  </div>
                </div>

                {/* Round results — timeline */}
                {r.roundResults.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.65rem', color: '#ff7a00', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 12, fontWeight: 700 }}>Round Results</div>
                    <div style={{ display: 'flex', gap: 0, alignItems: 'stretch', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {r.roundResults.sort((a, b) => a.order - b.order).map((rr, ri, arr) => {
                        const isLast = ri === arr.length - 1
                        const passed = rr.status === 'qualified'
                        const failed = rr.status === 'not_qualified'
                        return (
                          <div key={rr.order} style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{
                              background: 'rgba(255,122,0,0.08)',
                              border: `1px solid ${passed ? 'rgba(34,197,94,0.4)' : failed ? 'rgba(239,68,68,0.35)' : 'rgba(255,122,0,0.3)'}`,
                              borderRadius: 12, padding: '10px 16px',
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                              minWidth: 88,
                            }}>
                              <span style={{ color: '#ff7a00', fontWeight: 700, fontSize: '0.62rem', letterSpacing: '0.3px' }}>Round {rr.order}</span>
                              {rr.roundName && (
                                <span style={{ color: '#ddd', fontWeight: 600, fontSize: '0.72rem', textAlign: 'center' }}>{rr.roundName}</span>
                              )}
                              <span style={{
                                color: passed ? '#22c55e' : failed ? '#ef4444' : '#f59e0b',
                                fontWeight: 700, fontSize: '0.7rem',
                              }}>
                                {failed ? '✗ Eliminated' : passed ? '✓ Passed' : '· Pending'}
                              </span>
                            </div>
                            {!isLast && (
                              <div style={{ width: 18, height: 2, background: 'rgba(255,122,0,0.25)', flexShrink: 0 }} />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {drive.driveDate && (
                  <div style={{ marginTop: 14, fontSize: '0.72rem', color: '#444', display: 'flex', alignItems: 'center', gap: 5 }}>
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

/* ── Detail Row helper ── */
const DetailRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
    <span style={{ fontSize: '0.68rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.4px', flexShrink: 0 }}>{label}</span>
    <div style={{ textAlign: 'right' }}>{children}</div>
  </div>
)

/* ── Grid View ── */
const GridView = ({ students }: { students: PlacedStudent[] }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 14,
  }}>
    {students.map(s => {
      const color = s.drive ? getColor(s.drive.companyName) : '#888'
      return (
        <div key={s._id} style={{
          background: '#111', border: '1px solid #1f1f1f', borderRadius: 14,
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = `${color}55`
            e.currentTarget.style.boxShadow = `0 4px 20px ${color}14`
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#1f1f1f'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          {/* ── Top: avatar + name + roll + email ── */}
          <div style={{
            padding: '20px 18px 16px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            borderBottom: '1px solid #1a1a1a',
          }}>
            <HumanAvatar color={color} size={62} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>
                {s.studentName}
              </div>
              {s.rollNumber && (
                <div style={{ color: '#ff7a00', fontWeight: 700, fontSize: '0.72rem', marginTop: 3 }}>
                  {s.rollNumber}
                </div>
              )}
              {s.studentEmail && (
                <div style={{ color: '#6b7280', fontSize: '0.68rem', marginTop: 2, wordBreak: 'break-all' }}>
                  {s.studentEmail}
                </div>
              )}
            </div>
          </div>

          {/* ── Details section ── */}
          <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>

            {/* Company */}
            <DetailRow label="Company">
              {s.drive ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                    background: `${color}22`, border: `1px solid ${color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color, fontWeight: 700, fontSize: '0.55rem',
                  }}>
                    {s.drive.companyName.slice(0, 2).toUpperCase()}
                  </div>
                  <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.8rem' }}>{s.drive.companyName}</span>
                </div>
              ) : <span style={{ color: '#444' }}>—</span>}
            </DetailRow>

            {/* Role */}
            <DetailRow label="Role">
              <span style={{ color: '#ccc', fontSize: '0.8rem' }}>{s.drive?.role || '—'}</span>
            </DetailRow>

            {/* Package */}
            <DetailRow label="Package">
              {s.drive?.package ? (
                <span style={{
                  background: 'rgba(34,197,94,0.1)', color: '#22c55e',
                  border: '1px solid rgba(34,197,94,0.25)', borderRadius: 20,
                  padding: '1px 9px', fontSize: '0.72rem', fontWeight: 700,
                }}>
                  {s.drive.package}
                </span>
              ) : <span style={{ color: '#444' }}>—</span>}
            </DetailRow>

            {/* Batch */}
            <DetailRow label="Batch">
              {s.batch ? (
                <span style={{
                  background: 'rgba(96,165,250,0.12)', color: '#60a5fa',
                  border: '1px solid rgba(96,165,250,0.25)', borderRadius: 20,
                  padding: '1px 9px', fontSize: '0.72rem', fontWeight: 700,
                }}>
                  {s.batch}
                </span>
              ) : <span style={{ color: '#444' }}>—</span>}
            </DetailRow>

            {/* Department */}
            <DetailRow label="Dept">
              <span style={{ color: '#ccc', fontSize: '0.8rem' }}>{s.department || '—'}</span>
            </DetailRow>

          </div>

          {/* ── Footer: Selected badge ── */}
          <div style={{
            margin: '0 18px 14px',
            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 8, padding: '6px 10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e' }} />
            <span style={{ color: '#22c55e', fontSize: '0.72rem', fontWeight: 700 }}>Selected</span>
          </div>
        </div>
      )
    })}
  </div>
)

/* ── Reusable filter select ── */
const FilterSelect = ({ value, onChange, placeholder, options }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: { value: string; label: string }[]
}) => (
  <select
    value={value}
    onChange={e => onChange(e.target.value)}
    style={{
      background: '#1a1a1a', border: '1px solid #2a2a2a', color: value ? '#e2e8f0' : '#666',
      borderRadius: 8, padding: '7px 10px', fontSize: '0.8rem', cursor: 'pointer',
      outline: 'none', minWidth: 150,
    }}
  >
    <option value="">{placeholder}</option>
    {options.map(o => <option key={o.value} value={o.value} style={{ background: '#1a1a1a' }}>{o.label}</option>)}
  </select>
)

export default StudentPlacementPage
