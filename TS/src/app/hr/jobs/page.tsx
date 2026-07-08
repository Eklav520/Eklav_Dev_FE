import { useState } from 'react'
import { FiSearch, FiBell, FiPlus, FiCalendar, FiFilter, FiChevronDown, FiEye, FiMoreVertical, FiChevronRight, FiChevronsRight, FiChevronLeft, FiChevronsLeft } from 'react-icons/fi'
import { BsBriefcase } from 'react-icons/bs'
import { MdOutlinePause, MdOutlineCheckCircle } from 'react-icons/md'
import { AiOutlineClockCircle } from 'react-icons/ai'

// ─── Palette ────────────────────────────────────────────────────────────────
const BLUE   = '#2563eb'
const GREEN  = '#10b981'
const ORANGE = '#f59e0b'
const RED    = '#ef4444'
const PURPLE = '#8b5cf6'
const GRAY   = '#64748b'
const BORDER = '#e2e8f0'

// ─── Data ────────────────────────────────────────────────────────────────────
const JOBS = [
  { id: 'JD-1001', title: 'Frontend Developer',   dept: 'Engineering', location: 'Bangalore', apps: 245, status: 'Active',  created: '20 May 2024' },
  { id: 'JD-1002', title: 'Backend Developer',     dept: 'Engineering', location: 'Bangalore', apps: 198, status: 'Active',  created: '19 May 2024' },
  { id: 'JD-1003', title: 'Full Stack Developer',  dept: 'Engineering', location: 'Hyderabad', apps: 142, status: 'Active',  created: '18 May 2024' },
  { id: 'JD-1004', title: 'Data Analyst',          dept: 'Analytics',   location: 'Pune',      apps: 126, status: 'Active',  created: '15 May 2024' },
  { id: 'JD-1005', title: 'UI/UX Designer',        dept: 'Design',      location: 'Bangalore', apps: 78,  status: 'On Hold', created: '12 May 2024' },
  { id: 'JD-1006', title: 'DevOps Engineer',       dept: 'Engineering', location: 'Hyderabad', apps: 73,  status: 'Draft',   created: '05 May 2024' },
  { id: 'JD-1007', title: 'QA Engineer',           dept: 'Engineering', location: 'Chennai',   apps: 59,  status: 'Active',  created: '02 May 2024' },
  { id: 'JD-1008', title: 'Business Analyst',      dept: 'Analytics',   location: 'Bangalore', apps: 48,  status: 'Closed',  created: '28 Apr 2024' },
]

const DEPARTMENTS = [
  { label: 'Engineering', count: 14, color: PURPLE },
  { label: 'Analytics',   count: 4,  color: BLUE   },
  { label: 'Design',      count: 3,  color: ORANGE },
  { label: 'Others',      count: 3,  color: RED    },
]

const RECENT_ACTIVITY = [
  { label: 'Frontend Developer', sub: 'Published',       date: '20 May 2024', time: '10:30 AM', color: GREEN  },
  { label: 'DevOps Engineer',    sub: 'Created as Draft', date: '05 May 2024', time: '02:15 PM', color: BLUE   },
  { label: 'UI/UX Designer',     sub: 'On Hold',          date: '12 May 2024', time: '11:45 AM', color: ORANGE },
  { label: 'Business Analyst',   sub: 'Closed',           date: '28 Apr 2024', time: '09:20 AM', color: RED    },
]

const OVERVIEW = [
  { label: 'Active',  value: 18, pct: '75%',    color: GREEN  },
  { label: 'Draft',   value: 4,  pct: '16.6%',  color: BLUE   },
  { label: 'On Hold', value: 2,  pct: '8.3%',   color: ORANGE },
  { label: 'Closed',  value: 12, pct: '50%',    color: RED    },
]

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Active:  { bg: '#ecfdf5', color: '#059669' },
  Draft:   { bg: '#eff6ff', color: '#2563eb' },
  'On Hold': { bg: '#fff7ed', color: '#d97706' },
  Closed:  { bg: '#fef2f2', color: '#dc2626' },
}

const TABS = ['All Jobs (24)', 'Active (18)', 'Draft (4)', 'On Hold (2)', 'Closed (12)']

// ─── Donut Chart ─────────────────────────────────────────────────────────────
const DonutChart = () => {
  const size = 118, cx = 59, cy = 59, r = 40, stroke = 16
  const circum = 2 * Math.PI * r
  const total = OVERVIEW.reduce((s, o) => s + o.value, 0)
  let offset = 0
  const segs = OVERVIEW.map(o => {
    const dash = (o.value / total) * circum
    const gap  = circum - dash
    const seg  = { ...o, dash, gap, offset: circum * 0.25 - offset }
    offset += dash
    return seg
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width={size} height={size}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={BORDER} strokeWidth={stroke}/>
          {segs.map((s, i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={s.color} strokeWidth={stroke}
              strokeDasharray={`${s.dash} ${s.gap}`}
              strokeDashoffset={s.offset}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>24</span>
          <span style={{ fontSize: '0.56rem', color: GRAY, lineHeight: 1.5, textAlign: 'center' }}>Total<br/>Jobs</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {OVERVIEW.map(o => (
          <div key={o.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: o.color, flexShrink: 0 }}/>
            <span style={{ fontSize: '0.76rem', color: GRAY, width: 48 }}>{o.label}</span>
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a' }}>{o.value} ({o.pct})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
const HRJobsPage = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [search, setSearch] = useState('')

  const filteredJobs = JOBS.filter(j => {
    if (search) return j.title.toLowerCase().includes(search.toLowerCase())
    const tabLabel = TABS[activeTab]
    if (tabLabel.startsWith('All')) return true
    const status = tabLabel.split(' ')[0]
    return j.status === status
  })

  return (
    <div style={{ minHeight: '100%' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f172a' }}>Jobs</h1>
          <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: GRAY }}>Manage and track all your job postings.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <FiSearch size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search jobs by title, department..."
              style={{
                paddingLeft: 32, paddingRight: 12, height: 36, width: 260,
                border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: '0.8rem',
                color: '#334155', background: '#fff', outline: 'none',
              }}
            />
          </div>
          {/* Calendar */}
          <button style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
            <FiCalendar size={15}/>
          </button>
          {/* Bell */}
          <div style={{ position: 'relative' }}>
            <button style={{ width: 36, height: 36, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#475569' }}>
              <FiBell size={15}/>
            </button>
            <div style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, background: RED, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', color: '#fff', fontWeight: 700 }}>8</div>
          </div>
          {/* Create Job */}
          <button style={{ display: 'flex', alignItems: 'center', gap: 7, background: BLUE, color: '#fff', border: 'none', borderRadius: 8, padding: '0 16px', height: 36, fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
            <FiPlus size={15}/> Create Job
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total Jobs',   value: 24, sub: 'All time',       icon: <BsBriefcase size={20}/>,         ic: BLUE,   bg: '#eff6ff' },
          { label: 'Active Jobs',  value: 18, sub: '75% of total',   icon: <MdOutlineCheckCircle size={20}/>, ic: GREEN,  bg: '#ecfdf5', subColor: GREEN  },
          { label: 'Draft Jobs',   value: 4,  sub: '16.6% of total', icon: <AiOutlineClockCircle size={20}/>, ic: ORANGE, bg: '#fff7ed', subColor: ORANGE },
          { label: 'On Hold',      value: 2,  sub: '8.3% of total',  icon: <MdOutlinePause size={20}/>,       ic: RED,    bg: '#fef2f2', subColor: RED    },
          { label: 'Closed Jobs',  value: 12, sub: '50% of total',   icon: <MdOutlineCheckCircle size={20}/>, ic: BLUE,   bg: '#eff6ff', subColor: BLUE   },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.ic, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: GRAY, marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: (s as any).subColor || GRAY, fontWeight: 500, marginTop: 2 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main content: table + sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'stretch' }}>

        {/* Left: tabs + table — flex column so table grows and pagination stays at bottom */}
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Tabs row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 0 }}>
              {TABS.map((tab, i) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(i)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '14px 16px', fontSize: '0.82rem', fontWeight: activeTab === i ? 600 : 400,
                    color: activeTab === i ? BLUE : GRAY,
                    borderBottom: activeTab === i ? `2px solid ${BLUE}` : '2px solid transparent',
                    marginBottom: -1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: `1px solid ${BORDER}`, borderRadius: 7, padding: '6px 12px', fontSize: '0.78rem', color: '#334155', cursor: 'pointer', fontWeight: 500 }}>
                <FiFilter size={13}/> Filters
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: `1px solid ${BORDER}`, borderRadius: 7, padding: '6px 12px', fontSize: '0.78rem', color: '#334155', cursor: 'pointer', fontWeight: 500 }}>
                Sort by: Created On <FiChevronDown size={12}/>
              </button>
            </div>
          </div>

          {/* Table — flex:1 so it fills remaining space pushing pagination down */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Job Title', 'Job ID', 'Department', 'Location', 'Applications', 'Status', 'Created On', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', fontSize: '0.74rem', fontWeight: 600, color: GRAY, textAlign: 'left', borderBottom: `1px solid ${BORDER}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => {
                  const st = STATUS_STYLE[job.status]
                  return (
                    <tr key={job.id} style={{ borderBottom: `1px solid #f1f5f9` }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fafbfc'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <td style={{ padding: '16px 16px', fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{job.title}</td>
                      <td style={{ padding: '16px 16px', fontSize: '0.8rem', color: GRAY }}>{job.id}</td>
                      <td style={{ padding: '16px 16px', fontSize: '0.8rem', color: '#334155' }}>{job.dept}</td>
                      <td style={{ padding: '16px 16px', fontSize: '0.8rem', color: '#334155' }}>{job.location}</td>
                      <td style={{ padding: '16px 16px', fontSize: '0.82rem', fontWeight: 500, color: '#0f172a' }}>{job.apps}</td>
                      <td style={{ padding: '16px 16px' }}>
                        <span style={{ background: st.bg, color: st.color, fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>{job.status}</span>
                      </td>
                      <td style={{ padding: '16px 16px', fontSize: '0.78rem', color: GRAY }}>{job.created}</td>
                      <td style={{ padding: '16px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 3, display: 'flex', alignItems: 'center' }} title="View">
                            <FiEye size={15}/>
                          </button>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 3, display: 'flex', alignItems: 'center' }} title="More">
                            <FiMoreVertical size={15}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination — always at bottom */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
            <span style={{ fontSize: '0.78rem', color: GRAY }}>Showing 1 to 8 of 24 jobs</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {([<FiChevronsLeft size={13}/>, <FiChevronLeft size={13}/>, '1', '2', '3', <FiChevronRight size={13}/>, <FiChevronsRight size={13}/>] as const).map((item, i) => {
                const isActive = item === '1'
                return (
                  <button key={i} style={{
                    width: 30, height: 30, border: isActive ? 'none' : `1px solid ${BORDER}`,
                    borderRadius: 6, background: isActive ? BLUE : '#fff',
                    color: isActive ? '#fff' : GRAY,
                    fontSize: '0.78rem', fontWeight: isActive ? 700 : 400,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {item}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: sidebar — height matches table via grid stretch */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>

          {/* Job Overview */}
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Job Overview</span>
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f8fafc', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '4px 10px', fontSize: '0.74rem', color: '#334155', cursor: 'pointer' }}>
                This Month <FiChevronDown size={11}/>
              </button>
            </div>
            <DonutChart/>
          </div>

          {/* Top Departments */}
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 18 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: 14 }}>Top Departments</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {DEPARTMENTS.map(d => (
                <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.76rem', color: '#334155', width: 76, flexShrink: 0 }}>{d.label}</span>
                  <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 4 }}>
                    <div style={{ height: '100%', width: `${(d.count / 14) * 100}%`, background: d.color, borderRadius: 4 }}/>
                  </div>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a', width: 18, textAlign: 'right', flexShrink: 0 }}>{d.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Job Activity */}
          <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${BORDER}`, padding: 18, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Recent Job Activity</span>
              <span style={{ fontSize: '0.75rem', color: BLUE, fontWeight: 600, cursor: 'pointer' }}>View all</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {RECENT_ACTIVITY.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color, marginTop: 4, flexShrink: 0 }}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a' }}>{a.label}</div>
                    <div style={{ fontSize: '0.7rem', color: GRAY }}>{a.sub}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.68rem', color: '#334155', fontWeight: 500 }}>{a.date}</div>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HRJobsPage
