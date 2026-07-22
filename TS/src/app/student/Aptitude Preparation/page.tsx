import React, { useState, useEffect, useCallback } from 'react'
import PageMetaData from '@/components/PageMetaData'
import { useAuthContext } from '@/context/useAuthContext'
import DailyExam from './components/DailyExam'
import Bookmark from './components/Bookmark'
import { FiBookOpen } from 'react-icons/fi'
import {
  FaCalculator, FaBrain, FaBook, FaChartBar, FaPuzzlePiece,
  FaLightbulb, FaListOl, FaChartLine, FaFire, FaClock, FaClipboardList,
} from 'react-icons/fa'

// ─── Types ────────────────────────────────────────────────────────────────────

type NavTab = 'overview' | 'daily' | 'practice'

type TodayExamData = {
  category: string
  date: string
  totalQuestions: number
  alreadyAttempted: boolean
  attempt: { score: number; total: number; submittedAt: string } | null
  bestScore?: number | null
}

type CalendarDay = {
  date: string
  category: string
  attended: boolean
  score: number | null
  total: number | null
  isFuture: boolean
  isToday: boolean
}

type CalendarStats = { totalAttended: number; streak: number; avgScore: number }

type PracticeTopic = {
  id: string; title: string; icon: React.ReactNode; iconColor: string; iconBg: string
  totalQuestions: number; progress: number; accuracy: number
}

type CategoryProgressEntry = { progress: number; viewed: number; total: number }

// Reads the same --dash-* CSS vars StudentLayout sets for dark mode
// (light-mode values as fallback), so this page re-themes with the portal.
const PAGE_BG     = 'var(--dash-page-bg, #f8fafc)'
const CARD_BG     = 'var(--dash-card-bg, #ffffff)'
const PAGE_BORDER = 'var(--dash-border, #e2e8f0)'
const PAGE_TEXT   = 'var(--dash-text, #0f172a)'
const PAGE_GRAY   = 'var(--dash-gray, #64748b)'

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_TABS: { key: NavTab; label: string }[] = [
  { key: 'overview',  label: 'Overview' },
  { key: 'daily',    label: 'Daily Exam' },
  { key: 'practice', label: 'Practice Quiz' },
]

// Icon palette — cycles through when no keyword matches
const ICON_PALETTE: { icon: React.ReactNode; iconColor: string; iconBg: string }[] = [
  { icon: <FaCalculator />, iconColor: '#6366f1', iconBg: 'rgba(99,102,241,0.1)' },
  { icon: <FaBrain />,      iconColor: '#8b5cf6', iconBg: 'rgba(139,92,246,0.1)' },
  { icon: <FaBook />,       iconColor: '#16a34a', iconBg: 'rgba(34,197,94,0.1)'  },
  { icon: <FaChartBar />,   iconColor: '#f97316', iconBg: 'rgba(249,115,22,0.1)' },
  { icon: <FaPuzzlePiece />,iconColor: '#ec4899', iconBg: 'rgba(236,72,153,0.1)' },
  { icon: <FaLightbulb />,  iconColor: '#d97706', iconBg: 'rgba(234,179,8,0.1)'  },
  { icon: <FaListOl />,     iconColor: '#0ea5e9', iconBg: 'rgba(14,165,233,0.1)' },
  { icon: <FaChartLine />,  iconColor: '#ef4444', iconBg: 'rgba(239,68,68,0.1)'  },
  { icon: <FaClock />,      iconColor: '#14b8a6', iconBg: 'rgba(20,184,166,0.1)' },
]

function getTopicIcon(title: string, idx: number) {
  const t = title.toLowerCase()
  if (t.includes('quant') || t.includes('math'))          return ICON_PALETTE[0]
  if (t.includes('reason') || t.includes('logical'))      return ICON_PALETTE[1]
  if (t.includes('verbal') || t.includes('english'))      return ICON_PALETTE[2]
  if (t.includes('data') || t.includes('interpret'))      return ICON_PALETTE[3]
  if (t.includes('puzzle'))                               return ICON_PALETTE[4]
  if (t.includes('light') || t.includes('knowledge'))     return ICON_PALETTE[5]
  if (t.includes('number') || t.includes('series'))       return ICON_PALETTE[6]
  if (t.includes('profit') || t.includes('loss'))         return ICON_PALETTE[7]
  if (t.includes('time') || t.includes('work') || t.includes('speed')) return ICON_PALETTE[8]
  return ICON_PALETTE[idx % ICON_PALETTE.length]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function monthName(m: number) {
  return new Date(2000, m - 1).toLocaleString('default', { month: 'long' })
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────

const DonutChart = ({ pct, size = 100, sw = 10, color = '#ff7a00', subLabel = '' }: {
  pct: number; size?: number; sw?: number; color?: string; subLabel?: string
}) => {
  const r = (size - sw) / 2
  const circ = 2 * Math.PI * r
  const dash = Math.max(0, Math.min(pct, 100)) / 100 * circ
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ display: 'block' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={PAGE_BORDER} strokeWidth={sw} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dasharray 0.4s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size * 0.19, fontWeight: 900, color: PAGE_TEXT, lineHeight: 1 }}>{pct}%</span>
        {subLabel && <span style={{ fontSize: size * 0.09, color: PAGE_GRAY, marginTop: 2, textAlign: 'center', lineHeight: 1.2 }}>{subLabel}</span>}
      </div>
    </div>
  )
}

// ─── Mini Progress Bar ────────────────────────────────────────────────────────

const MiniBar = ({ pct, color = '#ff7a00' }: { pct: number; color?: string }) => (
  <div style={{ height: 5, background: PAGE_BORDER, borderRadius: 99, overflow: 'hidden', flex: 1 }}>
    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99 }} />
  </div>
)

// ─── Calendar Widget ──────────────────────────────────────────────────────────

const CalendarWidget = ({ days, month, onMonthChange }: {
  days: CalendarDay[]
  month: { year: number; month: number }
  onMonthChange: (d: number) => void
}) => {
  const firstDay = new Date(month.year, month.month - 1, 1).getDay()
  const daysInPrevMonth = new Date(month.year, month.month - 1, 0).getDate()

  // Build cells: prev-month fill + current days + next-month fill
  type Cell = { num: number; day: CalendarDay | null; otherMonth: boolean }
  const cells: Cell[] = []
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ num: daysInPrevMonth - i, day: null, otherMonth: true })
  days.forEach(d => cells.push({ num: parseInt(d.date.split('-')[2]), day: d, otherMonth: false }))
  const nextFill = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7)
  for (let i = 1; i <= nextFill; i++) cells.push({ num: i, day: null, otherMonth: true })

  const weeks: Cell[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  return (
    <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '18px 18px 14px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontWeight: 700, color: PAGE_TEXT, fontSize: '0.92rem' }}>Progress Calendar</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => onMonthChange(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: PAGE_GRAY, fontSize: 18, padding: '0 4px', lineHeight: 1 }}>‹</button>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: PAGE_TEXT, minWidth: 80, textAlign: 'center' }}>
            {monthName(month.month)} {month.year}
          </span>
          <button onClick={() => onMonthChange(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: PAGE_GRAY, fontSize: 18, padding: '0 4px', lineHeight: 1 }}>›</button>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: PAGE_GRAY, paddingBottom: 6 }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {week.map((cell, di) => {
            const { num, day, otherMonth } = cell
            return (
              <div key={di} style={{ height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {otherMonth ? (
                  <span style={{ fontSize: '0.7rem', color: PAGE_BORDER, fontWeight: 400 }}>{num}</span>
                ) : day?.attended ? (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(22,163,74,0.3)' }}>
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5l3.5 3.5L11 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ) : day?.isToday ? (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ff7a00', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(255,122,0,0.35)' }}>
                    <span style={{ color: '#fff', fontSize: '0.72rem', fontWeight: 700 }}>{num}</span>
                  </div>
                ) : day && !day.isFuture ? (
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(239,68,68,0.3)' }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1 1l8 8M9 1L1 9" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.72rem', color: PAGE_GRAY, fontWeight: 400 }}>{num}</span>
                )}
              </div>
            )
          })}
        </div>
      ))}

      {/* Today label */}
      <div style={{ marginTop: 10, paddingTop: 4 }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: PAGE_GRAY, marginBottom: 6 }}>Today</div>
        <div style={{ display: 'flex', gap: 14 }}>
          {[
            { color: '#16a34a', label: 'Attempted', check: true },
            { color: '#ff7a00', label: 'Today', check: false },
            { color: '#ef4444', label: 'Absent', check: false },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {item.check && <svg width="8" height="7" viewBox="0 0 8 7" fill="none"><path d="M1 3.5l2 2L7 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              <span style={{ fontSize: '0.65rem', color: PAGE_GRAY }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Weekly Performance Chart ─────────────────────────────────────────────────

const WeeklyChart = ({ data }: { data: number[] }) => {
  const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const W = 290, H = 110
  const padL = 28, padR = 8, padT = 10, padB = 22
  const iW = W - padL - padR
  const iH = H - padT - padB
  const pts = data.map((v, i) => ({
    x: padL + (i / (data.length - 1)) * iW,
    y: padT + (1 - v / 100) * iH,
  }))
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const area = `${line} L${pts[pts.length - 1].x},${padT + iH} L${pts[0].x},${padT + iH} Z`

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 42 }}>
        <span style={{ fontWeight: 700, color: PAGE_TEXT, fontSize: '0.88rem' }}>Weekly Performance</span>
        <select style={{ border: `1px solid ${PAGE_BORDER}`, borderRadius: 6, padding: '2px 8px', fontSize: '0.68rem', color: PAGE_TEXT, background: CARD_BG, cursor: 'pointer', outline: 'none' }}>
          <option>This Week</option>
        </select>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        {[10, 30, 50, 70, 100].map(v => {
          const y = padT + (1 - v / 100) * iH
          return (
            <g key={v}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke={PAGE_BORDER} strokeWidth={1} />
              <text x={padL - 3} y={y + 3} textAnchor="end" fontSize={7} fill={PAGE_GRAY}>{v}%</text>
            </g>
          )
        })}
        <path d={area} fill="rgba(255,122,0,0.08)" />
        <path d={line} fill="none" stroke="#ff7a00" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="#ff7a00" />)}
        {DAY_LABELS.map((d, i) => (
          <text key={d} x={padL + (i / (DAY_LABELS.length - 1)) * iW} y={H - 3} textAnchor="middle" fontSize={7} fill={PAGE_GRAY}>{d}</text>
        ))}
      </svg>
    </div>
  )
}

// ─── Today's Exam Card (Overview) ────────────────────────────────────────────

const TodayExamCard = ({ data, onStart }: { data: TodayExamData | null; onStart: () => void }) => {
  const attempted = !!(data?.alreadyAttempted && data.attempt)
  const score = data?.attempt?.score ?? 0
  const total = data?.attempt?.total ?? (data?.totalQuestions ?? 20)
  const pct   = attempted ? Math.round((score / total) * 100) : 0
  const qs    = data?.totalQuestions ?? 20
  const r = 44, sw = 9, circ = 2 * Math.PI * r, dash = (pct / 100) * circ

  const CATEGORY_DISPLAY: Record<string, string> = {
    Aptitude:  'General Aptitude',
    Reasoning: 'Reasoning Ability',
    Technical: 'Technical',
    Puzzle:    'Puzzle',
  }
  const examTitle = data?.category ? (CATEGORY_DISPLAY[data.category] ?? data.category) : 'General Aptitude'

  return (
    <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 220 }}>

        {/* ── Left: exam info ── */}
        <div style={{ flex: '0 0 240px', padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Section heading inside the card */}
          <div>
            <div style={{ fontWeight: 800, color: PAGE_TEXT, fontSize: '1rem', lineHeight: 1.2 }}>Daily Exam</div>
            <div style={{ fontSize: '0.7rem', color: PAGE_GRAY, marginTop: 3 }}>Attempt the daily exam and test your skills</div>
          </div>

          <div style={{ height: 1, background: PAGE_BORDER }} />

          {/* Exam info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 9, background: 'rgba(255,122,0,0.1)', border: '1px solid rgba(255,122,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FaClipboardList size={18} color="#ff7a00" />
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: PAGE_GRAY, fontWeight: 600, marginBottom: 1 }}>Today's Exam</div>
              <div style={{ fontWeight: 800, color: PAGE_TEXT, fontSize: '0.9rem', lineHeight: 1.2 }}>{examTitle}</div>
            </div>
          </div>

          <div style={{ fontSize: '0.71rem', color: PAGE_GRAY, display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
            <span>{qs} Questions</span><span>•</span><span>{qs} Marks</span><span>•</span><span>20 Min</span>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button onClick={onStart}
              style={{ background: '#ff7a00', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: '0.82rem', padding: '10px 20px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(255,122,0,0.3)', whiteSpace: 'nowrap' }}>
              Start Exam
            </button>
            <button onClick={onStart}
              style={{ background: CARD_BG, border: `1.5px solid ${PAGE_BORDER}`, borderRadius: 8, color: PAGE_TEXT, fontWeight: 600, fontSize: '0.82rem', padding: '10px 14px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              View Details
            </button>
          </div>
        </div>

        {/* ── Divider ── */}
        <div style={{ width: 1, background: PAGE_BORDER, flexShrink: 0 }} />

        {/* ── Right: Progress (always shown) ── */}
        <div style={{ flex: 1, padding: '18px 28px', display: 'flex', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>

            {/* Header: PROGRESS + Best Score */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: PAGE_GRAY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progress</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ height: 14, width: 1, background: PAGE_BORDER }} />
                <span style={{ fontSize: '0.68rem', color: PAGE_GRAY, fontWeight: 600 }}>Best Score</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ff7a00' }}>
                  {data?.bestScore != null ? `${data.bestScore} / ${data.totalQuestions ?? 20}` : `— / ${data?.totalQuestions ?? 20}`}
                </span>
              </div>
            </div>
            <div style={{ height: 1, background: PAGE_BORDER, marginBottom: 0 }} />

            {/* Donut + Stats — expands to fill remaining height and centers content */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 24 }}>
              {/* Donut ring */}
              <div style={{ position: 'relative', width: 108, height: 108, flexShrink: 0 }}>
                <svg width={108} height={108} style={{ display: 'block' }}>
                  <circle cx={54} cy={54} r={r} fill="none" stroke={PAGE_BORDER} strokeWidth={sw} />
                  <circle cx={54} cy={54} r={r} fill="none" stroke="#ff7a00" strokeWidth={sw}
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                    transform="rotate(-90 54 54)" />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '1.35rem', fontWeight: 900, color: PAGE_TEXT, lineHeight: 1 }}>{pct}%</span>
                  <span style={{ fontSize: '0.54rem', color: PAGE_GRAY, textAlign: 'center', lineHeight: 1.4, marginTop: 3 }}>
                    {attempted ? `${score} / ${total}` : `0 / ${qs}`}<br />Questions<br />Attempted
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Your Score', value: attempted ? `${score} / ${total}` : `— / ${qs}`, color: '#ff7a00' },
                  { label: 'Accuracy',   value: attempted ? `${pct}%` : '—',                     color: '#16a34a' },
                  { label: 'Time Left',  value: attempted ? '00:00' : '20:00',                    color: '#ff7a00' },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: '0.63rem', color: PAGE_GRAY, fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  </div>
                ))}
                {attempted && (
                  <button onClick={onStart} style={{ background: 'none', border: 'none', color: '#ff7a00', fontWeight: 700, fontSize: '0.76rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: 0, marginTop: 2 }}>
                    View Solution
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ff7a00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Practice Topic Card ──────────────────────────────────────────────────────

const TopicCard = ({ topic, liveProgress, onClick }: { topic: PracticeTopic; liveProgress?: CategoryProgressEntry; onClick?: (title: string) => void }) => {
  const progress = liveProgress ? liveProgress.progress : topic.progress
  const totalQ = liveProgress ? liveProgress.total || topic.totalQuestions : topic.totalQuestions
  const viewed = liveProgress ? liveProgress.viewed : 0
  return (
    <div
      onClick={() => onClick?.(topic.title)}
      style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 12, padding: '14px 14px', display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.07)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div style={{ width: 36, height: 36, borderRadius: 9, background: topic.iconBg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: topic.iconColor, fontSize: 16 }}>
        {topic.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, color: PAGE_TEXT, fontSize: '0.8rem', marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{topic.title}</div>
        <div style={{ fontSize: '0.67rem', color: PAGE_GRAY, marginBottom: 7 }}>
          {viewed > 0 ? `${viewed} / ${totalQ} Questions` : `${totalQ} Questions`}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
          <span style={{ fontSize: '0.62rem', color: PAGE_GRAY, width: 48, flexShrink: 0 }}>Progress</span>
          <MiniBar pct={progress} />
          <span style={{ fontSize: '0.62rem', color: '#ff7a00', fontWeight: 700, width: 28, textAlign: 'right' }}>{progress}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: '0.62rem', color: PAGE_GRAY, width: 48, flexShrink: 0 }}>Exam Avg</span>
          <MiniBar pct={topic.accuracy} color="#16a34a" />
          <span style={{ fontSize: '0.62rem', color: '#16a34a', fontWeight: 700, width: 28, textAlign: 'right' }}>{topic.accuracy}%</span>
        </div>
      </div>
      <span style={{ color: PAGE_GRAY, fontSize: '1.1rem', alignSelf: 'center', flexShrink: 0 }}>›</span>
    </div>
  )
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

const TOPICS_PER_PAGE = 9

const OverviewTab = ({
  todayData, calendarDays, stats, calendarMonth, onMonthChange, onStartExam, weeklyData, categoryProgress, dynamicTopics, onTopicClick,
}: {
  todayData: TodayExamData | null
  calendarDays: CalendarDay[]
  stats: CalendarStats | null
  calendarMonth: { year: number; month: number }
  onMonthChange: (d: number) => void
  onStartExam: () => void
  weeklyData: number[]
  categoryProgress: Record<string, CategoryProgressEntry>
  dynamicTopics: PracticeTopic[]
  onTopicClick: (title: string) => void
}) => {
  const [topicPage, setTopicPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(dynamicTopics.length / TOPICS_PER_PAGE))
  const visibleTopics = dynamicTopics.slice(topicPage * TOPICS_PER_PAGE, (topicPage + 1) * TOPICS_PER_PAGE)

  return (
  <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>

    {/* ── Left ── */}
    <div style={{ flex: 1, minWidth: 0 }}>

      {/* Daily Exam section */}
      <div style={{ marginBottom: 26 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <TodayExamCard data={todayData} onStart={onStartExam} />
          </div>
          <div style={{ width: 320, minWidth: 320, flexShrink: 0, background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <WeeklyChart data={weeklyData} />
          </div>
        </div>
      </div>

      {/* Practice Quiz section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <h5 style={{ fontWeight: 800, color: PAGE_TEXT, margin: '0 0 3px', fontSize: '1rem' }}>Practice Quiz</h5>
            <p style={{ color: PAGE_GRAY, fontSize: '0.76rem', margin: 0 }}>Improved by practice. Select a topic and start practicing now!</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => setTopicPage(p => Math.max(0, p - 1))}
              disabled={topicPage === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: CARD_BG, border: `1.5px solid ${PAGE_BORDER}`, borderRadius: 8, color: topicPage === 0 ? PAGE_GRAY : PAGE_TEXT, fontWeight: 600, fontSize: '0.76rem', padding: '6px 12px', cursor: topicPage === 0 ? 'not-allowed' : 'pointer' }}>
              ← Prev
            </button>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.72rem', color: PAGE_GRAY, fontWeight: 600, padding: '0 4px' }}>
              {topicPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setTopicPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={topicPage === totalPages - 1}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: topicPage === totalPages - 1 ? CARD_BG : '#ff7a00', border: `1.5px solid ${topicPage === totalPages - 1 ? PAGE_BORDER : '#ff7a00'}`, borderRadius: 8, color: topicPage === totalPages - 1 ? PAGE_GRAY : '#fff', fontWeight: 600, fontSize: '0.76rem', padding: '6px 12px', cursor: topicPage === totalPages - 1 ? 'not-allowed' : 'pointer' }}>
              Next Topics →
            </button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {visibleTopics.map(t => (
            <TopicCard key={t.id} topic={t} liveProgress={categoryProgress[t.title]} onClick={onTopicClick} />
          ))}
        </div>
      </div>
    </div>

    {/* ── Right sidebar ── */}
    <div style={{ width: 300, minWidth: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* Calendar */}
      <CalendarWidget days={calendarDays} month={calendarMonth} onMonthChange={onMonthChange} />

      {/* Overall Progress */}
      <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '16px 18px' }}>
        <h6 style={{ fontWeight: 700, color: PAGE_TEXT, margin: '0 0 14px', fontSize: '0.88rem' }}>Overall Progress</h6>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
          <DonutChart pct={stats?.avgScore ?? 0} size={86} sw={9} color="#ff7a00" />
          <div>
            <div style={{ fontSize: '0.68rem', color: PAGE_GRAY, fontWeight: 600, marginBottom: 2 }}>Overall Score</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ff7a00', lineHeight: 1 }}>{stats?.avgScore ?? 0}%</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { label: 'Tests Attempted',  value: String(stats?.totalAttended ?? 0), color: '#6366f1', streak: false },
            { label: 'Average Accuracy', value: `${stats?.avgScore ?? 0}%`,        color: '#16a34a', streak: false },
            { label: 'Current Streak',   value: `${stats?.streak ?? 0} Days`,      color: '#ff7a00', streak: true  },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: PAGE_BG, borderRadius: 8 }}>
              <span style={{ fontSize: '0.7rem', color: PAGE_GRAY }}>{item.label}</span>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: item.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                {item.streak && <FaFire size={11} color="#ff7a00" />}
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const AptitudePage = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const token = user?.token

  const [activeTab, setActiveTab] = useState<NavTab>('overview')
  const [pendingTopicTitle, setPendingTopicTitle] = useState<string | null>(null)
  const [todayData, setTodayData] = useState<TodayExamData | null>(null)
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])
  const [calendarStats, setCalendarStats] = useState<CalendarStats | null>(null)
  const [calendarMonth, setCalendarMonth] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 })
  const [practiceTotal, setPracticeTotal] = useState(0)
  const [categoryProgress, setCategoryProgress] = useState<Record<string, CategoryProgressEntry>>({})
  const [dynamicTopics, setDynamicTopics] = useState<PracticeTopic[]>([])

  const handleMonthChange = (delta: number) => {
    setCalendarMonth(p => {
      let m = p.month + delta, y = p.year
      if (m < 1) { m = 12; y-- }
      if (m > 12) { m = 1; y++ }
      return { year: y, month: m }
    })
  }

  const fetchToday = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${baseURL}/api/student/daily-aptitude/today`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.success) setTodayData(data)
    } catch { /* silent */ }
  }, [baseURL, token])

  const fetchCalendar = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${baseURL}/api/student/daily-aptitude/calendar?year=${calendarMonth.year}&month=${calendarMonth.month}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.success) {
        setCalendarDays(data.days || [])
        setCalendarStats(data.stats || null)
      }
    } catch { /* silent */ }
  }, [baseURL, token, calendarMonth])

  useEffect(() => { fetchToday() }, [fetchToday])
  useEffect(() => { fetchCalendar() }, [fetchCalendar])

  // Fetch categories + topic progress and compute per-category aggregate
  useEffect(() => {
    if (!token) return
    const load = async () => {
      try {
        const [catRes, progRes] = await Promise.all([
          fetch(`${baseURL}/apptitudeQuestions`),
          fetch(`${baseURL}/apptitudeQuestions/topics/progress`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        const catData = await catRes.json()
        const progData = await progRes.json()

        const progressById: Record<string, number> = {}
        if (progData.success) {
          for (const r of progData.data ?? []) {
            progressById[String(r.topicId)] = r.questionsViewed ?? 0
          }
        }

        if (catData.success) {
          const result: Record<string, CategoryProgressEntry> = {}
          const topics: PracticeTopic[] = []

          for (const [idx, cat] of (catData.data ?? []).entries()) {
            let viewed = 0, total = 0
            for (const item of cat.items ?? []) {
              const q = item.questions?.length ?? 0
              viewed += progressById[String(item._id)] ?? 0
              total += q
            }
            const pct = total > 0 ? Math.min(100, Math.round((viewed / total) * 100)) : 0
            result[cat.title] = { progress: pct, viewed, total }

            const iconStyle = getTopicIcon(cat.title ?? '', idx)
            topics.push({
              id: String(cat._id),
              title: cat.title ?? `Topic ${idx + 1}`,
              icon: iconStyle.icon,
              iconColor: iconStyle.iconColor,
              iconBg: iconStyle.iconBg,
              totalQuestions: total,
              progress: pct,
              accuracy: 0,
            })
          }

          setCategoryProgress(result)
          setDynamicTopics(topics)
        }
      } catch { /* silent */ }
    }
    load()
  }, [baseURL, token])

  // Last 7 days performance from calendar
  const weeklyData = (() => {
    if (!calendarDays.length) return [0, 0, 0, 0, 0, 0, 0]
    const today = new Date()
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(today.getDate() - 6 + i)
      const iso = d.toISOString().split('T')[0]
      const day = calendarDays.find(cd => cd.date === iso)
      if (!day?.attended || day.score === null || day.total === null || day.total === 0) return 0
      return Math.round((day.score / day.total) * 100)
    })
  })()

  return (
    <>
      <PageMetaData title="Aptitude Preparation" />
      <div style={{ padding: '0 0 32px' }}>

        {/* ── Page Header + Stats (same row) ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 20 }}>
          {/* Title */}
          <div style={{ flexShrink: 0 }}>
            <h4 style={{ fontWeight: 800, color: PAGE_TEXT, margin: '0 0 4px', fontSize: '1.3rem' }}>Aptitude Preparation</h4>
            <p style={{ color: PAGE_GRAY, fontSize: '0.82rem', margin: 0 }}>Practice daily, improve skills and achieve your goals.</p>
          </div>

          {/* Stats — Total Quizzes only */}
          <div style={{
            background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 12,
            padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12,
            flexShrink: 0, minWidth: 160,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: 'rgba(99,102,241,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FiBookOpen size={18} color="#6366f1" />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: PAGE_TEXT, fontSize: '1.05rem', lineHeight: 1.1 }}>
                {practiceTotal > 0 ? practiceTotal.toLocaleString() : '—'}
              </div>
              <div style={{ fontSize: '0.65rem', color: PAGE_GRAY, marginTop: 2 }}>Total Quizzes</div>
            </div>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${PAGE_BORDER}`, marginBottom: 22, gap: 2 }}>
          {NAV_TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{
                background: activeTab === t.key ? 'rgba(255,122,0,0.05)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === t.key ? '2.5px solid #ff7a00' : '2.5px solid transparent',
                borderRadius: '8px 8px 0 0',
                padding: '9px 18px',
                fontWeight: 600,
                fontSize: '0.82rem',
                color: activeTab === t.key ? '#ff7a00' : PAGE_GRAY,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        {activeTab === 'overview' && (
          <OverviewTab
            todayData={todayData}
            calendarDays={calendarDays}
            stats={calendarStats}
            calendarMonth={calendarMonth}
            onMonthChange={handleMonthChange}
            onStartExam={() => setActiveTab('daily')}
            weeklyData={weeklyData}
            categoryProgress={categoryProgress}
            dynamicTopics={dynamicTopics}
            onTopicClick={title => { setPendingTopicTitle(title); setActiveTab('practice') }}
          />
        )}

        {activeTab === 'daily' && <DailyExam />}
        {activeTab === 'practice' && <Bookmark onStatsUpdate={setPracticeTotal} initialCategoryTitle={pendingTopicTitle} />}


      </div>
    </>
  )
}

export default AptitudePage
