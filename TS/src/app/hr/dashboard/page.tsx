import { useState } from 'react'
import {
  FiBriefcase, FiUsers, FiCheckCircle, FiCalendar, FiSearch,
  FiBell, FiMoreVertical, FiEye, FiMail, FiChevronDown,
} from 'react-icons/fi'
import { BsPersonCheck, BsBarChartSteps } from 'react-icons/bs'
import { MdOutlineLocalOffer } from 'react-icons/md'

// ─── Palette ────────────────────────────────────────────────────────────
const BLUE   = '#2563eb'
const GREEN  = '#10b981'
const ORANGE = '#f59e0b'
const PURPLE = '#8b5cf6'
const TEAL   = '#14b8a6'
const RED    = '#ef4444'
const GRAY   = '#64748b'
const BORDER = '#e2e8f0'
const CARD   = '#ffffff'
const PAGE   = '#f1f5f9'

// ─── Data ───────────────────────────────────────────────────────────────
const STATS = [
  { label: 'Total Jobs',    sub: 'Active jobs',     value: 24,   change: null,   icon: <FiBriefcase size={18}/>,    ic: TEAL,   bg: '#f0fdfa' },
  { label: 'Applications',  sub: '+18% this week',  value: 1248, change: true,   icon: <FiUsers size={18}/>,         ic: GREEN,  bg: '#ecfdf5' },
  { label: 'Shortlisted',   sub: '+12% this week',  value: 312,  change: true,   icon: <BsPersonCheck size={18}/>,   ic: ORANGE, bg: '#fffbeb' },
  { label: 'Interviews',    sub: '+8% this week',   value: 78,   change: true,   icon: <FiCalendar size={18}/>,      ic: BLUE,   bg: '#eff6ff' },
  { label: 'Offers',        sub: '+2% this week',   value: 16,   change: true,   icon: <MdOutlineLocalOffer size={18}/>, ic: RED,    bg: '#fef2f2' },
  { label: 'Hired',         sub: '+3% this week',   value: 9,    change: true,   icon: <FiCheckCircle size={18}/>,   ic: TEAL,   bg: '#f0fdfa' },
]

const LINE_POINTS = [
  [1, 180],[5, 210],[7, 195],[9, 230],[12, 210],[13, 265],[15, 245],
  [18, 265],[20, 250],[22, 270],[25, 260],[28, 250],[31, 275],
]

const FUNNEL = [
  { label: 'Applications', value: 1248, color: BLUE   },
  { label: 'Shortlisted',  value: 312,  color: GREEN  },
  { label: 'Interviews',   value: 78,   color: ORANGE },
  { label: 'Offers',       value: 16,   color: RED    },
  { label: 'Hired',        value: 9,    color: PURPLE },
]

const ACTIVITY = [
  { name: 'Priya Singh',  action: 'applied for',       item: 'Frontend Developer',  time: '2 min ago',  color: BLUE  },
  { name: 'Amit Verma',   action: 'scheduled an interview for', item: 'Backend Developer', time: '15 min ago', color: ORANGE },
  { name: 'Rahul Kumar',  action: 'was shortlisted for', item: 'Full Stack Developer', time: '1 hr ago',   color: GREEN },
  { name: 'Sneha Patel',  action: 'accepted the offer for', item: 'UI/UX Designer',    time: '2 hrs ago',  color: TEAL  },
  { name: 'New job posted', action: '', item: 'Data Analyst',              time: '3 hrs ago',  color: PURPLE },
]

const SKILLS = [
  { skill: 'JavaScript', count: 342, color: BLUE   },
  { skill: 'React.js',   count: 287, color: TEAL   },
  { skill: 'Node.js',    count: 198, color: GREEN  },
  { skill: 'Python',     count: 176, color: ORANGE },
  { skill: 'Java',       count: 165, color: PURPLE },
]

const SOURCES = [
  { label: 'College Portal',   pct: 46, color: '#3b82f6' },
  { label: 'Eklav Platform',   pct: 28, color: '#10b981' },
  { label: 'LinkedIn',         pct: 15, color: '#f59e0b' },
  { label: 'Referral',         pct: 7,  color: '#ef4444' },
  { label: 'Others',           pct: 4,  color: '#8b5cf6' },
]

const INTERVIEWS = [
  { name: 'Anjali Mehta',  role: 'Frontend Developer',  date: '22 May, 10:00 AM', round: 'Technical Round', color: BLUE   },
  { name: 'Rohit Yadav',   role: 'Backend Developer',   date: '22 May, 11:30 AM', round: 'HR Round',        color: GREEN  },
  { name: 'Kavya Nair',    role: 'Data Analyst',        date: '22 May, 02:00 PM', round: 'Technical Round', color: ORANGE },
  { name: 'Vikram Joshi',  role: 'Full Stack Developer',date: '23 May, 10:00 AM', round: 'HR Round',        color: PURPLE },
]

type StatusKey = 'Shortlisted' | 'Interview Scheduled' | 'Under Review'
const STATUS_COLOR: Record<StatusKey, { bg: string; color: string }> = {
  'Shortlisted':          { bg: '#ecfdf5', color: '#10b981' },
  'Interview Scheduled':  { bg: '#eff6ff', color: '#2563eb' },
  'Under Review':         { bg: '#fffbeb', color: '#f59e0b' },
}

const CANDIDATES = [
  { name: 'Priya Singh',  email: 'priya@gmail.com',  job: 'Frontend Developer',  skills: ['React','JavaScript','HTML','CSS'],        score: 85, status: 'Shortlisted',         date: '20 May 2024' },
  { name: 'Amit Verma',   email: 'amitv@gmail.com',  job: 'Backend Developer',   skills: ['Node.js','Express','MongoDB'],             score: 80, status: 'Interview Scheduled', date: '19 May 2024' },
  { name: 'Rahul Kumar',  email: 'rahulk@gmail.com', job: 'Full Stack Developer',skills: ['React','Node.js','MongoDB','AWS'],          score: 78, status: 'Under Review',        date: '18 May 2024' },
]

// ─── SVG Line Chart ──────────────────────────────────────────────────────
const LineChart = () => {
  // Extra top padding so the tooltip bubble has room above the first data point
  const W = 420, H = 190, PAD = { t: 48, r: 14, b: 30, l: 42 }
  const IW = W - PAD.l - PAD.r, IH = H - PAD.t - PAD.b
  const maxY = 340, minY = 80
  const toX = (d: number) => PAD.l + ((d - 1) / 30) * IW
  const toY = (v: number) => PAD.t + IH - ((v - minY) / (maxY - minY)) * IH

  const pts = LINE_POINTS.map(([d, v]) => `${toX(d)},${toY(v)}`).join(' ')
  const first = LINE_POINTS[0], last = LINE_POINTS[LINE_POINTS.length - 1]
  const area =
    `M${toX(first[0])},${toY(minY)} ` +
    LINE_POINTS.map(([d, v]) => `L${toX(d)},${toY(v)}`).join(' ') +
    ` L${toX(last[0])},${toY(minY)} Z`

  const yTicks = [100, 200, 300, 400]
  const xLabels = [1, 7, 13, 19, 25, 31]

  // Tooltip anchor: day 13, value 265
  const tipX = toX(13), tipY = toY(265)
  const tipW = 126, tipH = 36, tipR = 6
  // position above the dot; if too close to top edge, nudge down
  const tipTop = tipY - tipH - 10

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id="hrAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={BLUE} stopOpacity={0.18}/>
          <stop offset="100%" stopColor={BLUE} stopOpacity={0}/>
        </linearGradient>
      </defs>

      {/* Horizontal grid lines */}
      {yTicks.map(v => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={toY(v)} y2={toY(v)}
            stroke="#e2e8f0" strokeWidth={1} strokeDasharray="4 3"/>
          <text x={PAD.l - 7} y={toY(v) + 4} textAnchor="end" fontSize={9} fill="#94a3b8">{v}</text>
        </g>
      ))}

      {/* Area */}
      <path d={area} fill="url(#hrAreaGrad)"/>

      {/* Line */}
      <polyline points={pts} fill="none" stroke={BLUE} strokeWidth={2.2}
        strokeLinejoin="round" strokeLinecap="round"/>

      {/* Tooltip */}
      <circle cx={tipX} cy={tipY} r={5} fill={BLUE} stroke="#fff" strokeWidth={2}/>
      {/* Shadow */}
      <rect x={tipX - tipW / 2 + 1} y={tipTop + 2} width={tipW} height={tipH}
        rx={tipR} fill="rgba(0,0,0,0.12)"/>
      {/* Box */}
      <rect x={tipX - tipW / 2} y={tipTop} width={tipW} height={tipH}
        rx={tipR} fill="#1e293b"/>
      {/* Caret */}
      <polygon
        points={`${tipX - 5},${tipTop + tipH} ${tipX + 5},${tipTop + tipH} ${tipX},${tipTop + tipH + 6}`}
        fill="#1e293b"/>
      {/* Text line 1 */}
      <text x={tipX} y={tipTop + 13} textAnchor="middle" fontSize={9}
        fontWeight="600" fill="#94a3b8">18 May</text>
      {/* Text line 2 */}
      <text x={tipX} y={tipTop + 27} textAnchor="middle" fontSize={10}
        fontWeight="700" fill="#fff">Applications: 265</text>

      {/* X axis labels */}
      {xLabels.map(d => (
        <text key={d} x={toX(d)} y={H - 6} textAnchor="middle" fontSize={9} fill="#94a3b8">
          {d} May
        </text>
      ))}
    </svg>
  )
}

// ─── Funnel Chart ─────────────────────────────────────────────────────────
// Uses VISUAL widths (not data ratios) so every stage is clearly visible.
const FunnelChart = () => {
  const W = 210, H = 220, GAP = 2
  const rowH = (H - GAP * (FUNNEL.length - 1)) / FUNNEL.length
  // Visual top-widths for each stage (percentage of W)
  const TOP_RATIOS = [1.00, 0.76, 0.54, 0.36, 0.22]
  const BOT_RATIOS = [0.76, 0.54, 0.36, 0.22, 0.12]

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {FUNNEL.map((f, i) => {
        const topW = TOP_RATIOS[i] * W
        const botW = BOT_RATIOS[i] * W
        const topX = (W - topW) / 2
        const botX = (W - botW) / 2
        const y = i * (rowH + GAP)
        const pts = `${topX},${y} ${topX + topW},${y} ${botX + botW},${y + rowH} ${botX},${y + rowH}`
        const midY = y + rowH / 2
        return (
          <g key={f.label}>
            <polygon points={pts} fill={f.color}/>
            {/* Value inside the band */}
            <text x={W / 2} y={midY + 5} textAnchor="middle"
              fontSize={botW > 28 ? 11 : 9} fontWeight="700" fill="#fff">
              {f.value.toLocaleString()}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Donut Chart ─────────────────────────────────────────────────────────
const DonutChart = () => {
  const size = 150, cx = 75, cy = 75, r = 50, stroke = 22
  const circ = 2 * Math.PI * r
  let offset = 0
  const segs = SOURCES.map(s => {
    const dash = (s.pct / 100) * circ
    const seg = { ...s, dash, dashOffset: circ - offset }
    offset += dash
    return seg
  })
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke}/>
      {segs.map((s, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={s.color} strokeWidth={stroke}
          strokeDasharray={`${s.dash} ${circ - s.dash}`}
          strokeDashoffset={s.dashOffset}
        />
      ))}
    </svg>
  )
}

// ─── Card ────────────────────────────────────────────────────────────────
const Card = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{ background: CARD, borderRadius: 12, border: `1px solid ${BORDER}`, padding: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', ...style }}>
    {children}
  </div>
)

const SectionHeader = ({ title, action }: { title: string; action?: string }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>{title}</span>
    {action && <span style={{ fontSize: '0.75rem', color: BLUE, fontWeight: 600, cursor: 'pointer' }}>{action}</span>}
  </div>
)

// ─── Main ────────────────────────────────────────────────────────────────
const HRDashboard = () => {
  const [search, setSearch] = useState('')

  return (
    <div style={{ background: PAGE, minHeight: '100%' }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>Welcome back, Rajesh! 👋</h1>
          <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: GRAY }}>Here's what's happening with your hiring today.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <FiSearch size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}/>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search candidates, jobs..."
              style={{ paddingLeft: 30, paddingRight: 12, height: 34, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: '0.78rem', color: '#334155', background: CARD, outline: 'none', width: 210 }}
            />
          </div>
          <button style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: GRAY, position: 'relative' }}>
            <FiBell size={16}/>
            <span style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: '50%', background: RED, border: '1.5px solid #fff' }}/>
          </button>
          <button style={{ background: BLUE, border: 'none', color: '#fff', padding: '7px 16px', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
            + Create Job
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 18 }}>
        {STATS.map(s => (
          <Card key={s.label} style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.ic, flexShrink: 0 }}>
                {s.icon}
              </div>
              <span style={{ fontSize: '0.72rem', color: GRAY, fontWeight: 500 }}>{s.label}</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{s.value.toLocaleString()}</div>
            <div style={{ fontSize: '0.68rem', color: s.change ? GREEN : GRAY, marginTop: 4, fontWeight: 500 }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* ── Row 2: Line chart | Funnel | Recent Activity ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 14, marginBottom: 14 }}>

        {/* Applications Overview */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>Applications Overview</span>
            <button style={{ background: '#f8fafc', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '4px 10px', fontSize: '0.72rem', color: GRAY, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              This Month <FiChevronDown size={11}/>
            </button>
          </div>
          <LineChart/>
        </Card>

        {/* Pipeline Overview */}
        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <SectionHeader title="Pipeline Overview"/>
          {/* flex: 1 + justifyContent: center eliminates the empty bottom gap */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
            <div style={{ width: 140, flexShrink: 0 }}>
              <FunnelChart/>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {FUNNEL.map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: f.color, flexShrink: 0 }}/>
                  <span style={{ fontSize: '0.75rem', color: GRAY, flex: 1, whiteSpace: 'nowrap' }}>{f.label}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>{f.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card>
          <SectionHeader title="Recent Activity" action="View all"/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ACTIVITY.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: a.color + '18', color: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.68rem', flexShrink: 0 }}>
                  {a.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#334155', lineHeight: 1.4 }}>
                    <strong>{a.name}</strong>{a.action ? ` ${a.action} ` : ' '}<span style={{ color: BLUE }}>{a.item}</span>
                  </p>
                  <span style={{ fontSize: '0.67rem', color: '#94a3b8' }}>{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Row 3: Skills | Sources | Upcoming Interviews ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 14, marginBottom: 14 }}>

        {/* Top Skills in Demand */}
        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <SectionHeader title="Top Skills in Demand"/>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
            {SKILLS.map(s => {
              const maxCount = SKILLS[0].count
              return (
                <div key={s.skill}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 500 }}>{s.skill}</span>
                    <span style={{ fontSize: '0.76rem', color: GRAY, fontWeight: 600 }}>{s.count}</span>
                  </div>
                  <div style={{ height: 7, background: '#f1f5f9', borderRadius: 4 }}>
                    <div style={{ height: '100%', width: `${(s.count / maxCount) * 100}%`, background: s.color, borderRadius: 4 }}/>
                  </div>
                </div>
              )
            })}
          </div>
          <span style={{ fontSize: '0.73rem', color: BLUE, fontWeight: 600, cursor: 'pointer', marginTop: 14, display: 'inline-block' }}>View full report</span>
        </Card>

        {/* Applications by Source */}
        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <SectionHeader title="Applications by Source"/>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
            {/* Donut */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <DonutChart/>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>100%</span>
              </div>
            </div>
            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SOURCES.map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: s.color, flexShrink: 0 }}/>
                  <span style={{ fontSize: '0.75rem', color: GRAY, flex: 1, whiteSpace: 'nowrap' }}>{s.label}</span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginLeft: 12 }}>{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Upcoming Interviews */}
        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <SectionHeader title="Upcoming Interviews" action="View all"/>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10 }}>
            {INTERVIEWS.map((iv, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, background: '#f8fafc', border: `1px solid ${BORDER}` }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: iv.color + '18', color: iv.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.72rem', flexShrink: 0 }}>
                  {iv.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{iv.name}</div>
                  <div style={{ fontSize: '0.7rem', color: GRAY }}>{iv.role}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.7rem', color: '#334155', fontWeight: 500 }}>{iv.date}</div>
                  <div style={{ fontSize: '0.67rem', color: iv.color, fontWeight: 600 }}>{iv.round}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Recent Candidates Table ── */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>Recent Candidates</span>
          <span style={{ fontSize: '0.75rem', color: BLUE, fontWeight: 600, cursor: 'pointer' }}>View all Candidates</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700, fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                {['Candidate', 'Job Applied', 'Skills', 'Eklav Score', 'Status', 'Applied On', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 600, color: GRAY, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CANDIDATES.map((c, i) => {
                const sc = STATUS_COLOR[c.status as StatusKey] || { bg: '#f1f5f9', color: GRAY }
                return (
                  <tr key={i} style={{ borderBottom: `1px solid #f8fafc` }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {/* Candidate */}
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: BLUE + '22', color: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', flexShrink: 0 }}>
                          {c.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.8rem' }}>{c.name}</div>
                          <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{c.email}</div>
                        </div>
                      </div>
                    </td>
                    {/* Job */}
                    <td style={{ padding: '12px 12px', color: '#334155', whiteSpace: 'nowrap' }}>{c.job}</td>
                    {/* Skills */}
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {c.skills.map(sk => (
                          <span key={sk} style={{ background: '#f1f5f9', color: '#475569', padding: '2px 7px', borderRadius: 4, fontSize: '0.68rem', fontWeight: 500, whiteSpace: 'nowrap' }}>{sk}</span>
                        ))}
                      </div>
                    </td>
                    {/* Score */}
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ height: 5, width: 64, background: '#f1f5f9', borderRadius: 3, flexShrink: 0 }}>
                          <div style={{ height: '100%', width: `${c.score}%`, borderRadius: 3, background: c.score >= 83 ? GREEN : c.score >= 78 ? ORANGE : RED }}/>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.78rem', color: c.score >= 83 ? GREEN : c.score >= 78 ? ORANGE : RED }}>{c.score}%</span>
                      </div>
                    </td>
                    {/* Status */}
                    <td style={{ padding: '12px 12px' }}>
                      <span style={{ background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {c.status}
                      </span>
                    </td>
                    {/* Date */}
                    <td style={{ padding: '12px 12px', color: GRAY, whiteSpace: 'nowrap', fontSize: '0.75rem' }}>{c.date}</td>
                    {/* Actions */}
                    <td style={{ padding: '12px 12px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {[<FiEye size={13}/>, <FiMail size={13}/>, <FiMoreVertical size={13}/>].map((icon, j) => (
                          <button key={j} style={{ background: '#f8fafc', border: `1px solid ${BORDER}`, borderRadius: 6, width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: GRAY }}>
                            {icon}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  )
}

export default HRDashboard
