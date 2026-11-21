import type { ReactNode } from 'react'
import type { IconType } from 'react-icons'
import { FaArrowRight, FaChevronLeft, FaChevronRight, FaInbox } from 'react-icons/fa'
import './moduleOverview.css'

/* Shared building blocks for the dashboard module tabs (Daily Engagement, Course Progress, AI Interview,
   English Practice, Assessments, Code Challenge), so every tab reads the same way:
   header (what + period + full report) → KPI tiles → ranked lists / meters. */

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const fmtMinutes = (mins: number) => {
  if (!mins) return '0m'
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60 ? `${mins % 60}m` : ''}`.trim()
}

export const initials = (name: string) =>
  (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()

/* ── Shell: the tab's frame ─────────────────────────────────── */

export const ModuleShell = ({ icon: Icon, color, title, subtitle, controls, onFullDetails, fullLabel = 'Full report', children }: {
  icon: IconType; color: string; title: string; subtitle?: ReactNode; controls?: ReactNode
  onFullDetails?: () => void; fullLabel?: string; children: ReactNode
}) => (
  <section className="mo-shell" style={{ ['--mo-accent' as string]: color }}>
    {/* a div, not <header>: the theme styles every <header> as a page header */}
    <div className="mo-head">
      <span className="mo-head-icon"><Icon /></span>
      <div className="mo-head-text">
        <h3>{title}</h3>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="mo-head-controls">
        {controls}
        {onFullDetails && (
          <button type="button" className="mo-btn is-primary" onClick={onFullDetails}>
            {fullLabel} <FaArrowRight />
          </button>
        )}
      </div>
    </div>
    <div className="mo-body">{children}</div>
  </section>
)

/* ── Period controls ────────────────────────────────────────── */

const shiftDay = (iso: string, by: number) => {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + by)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
export const todayISO = () => shiftDay(new Date().toISOString().slice(0, 10), 0)

export const DayPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const today = todayISO()
  const label = value === today ? 'Today' : value === shiftDay(today, -1) ? 'Yesterday'
    : new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  return (
    <div className="mo-period">
      <button type="button" onClick={() => onChange(shiftDay(value, -1))} aria-label="Previous day"><FaChevronLeft /></button>
      <label>
        <span>{label}</span>
        <input type="date" value={value} max={today} onChange={(e) => e.target.value && onChange(e.target.value)} />
      </label>
      <button type="button" onClick={() => onChange(shiftDay(value, 1))} disabled={value >= today} aria-label="Next day"><FaChevronRight /></button>
    </div>
  )
}

export const MonthPicker = ({ month, year, onChange }: { month: number; year: number; onChange: (month: number, year: number) => void }) => {
  const now = new Date()
  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1
  const step = (by: number) => {
    const d = new Date(year, month - 1 + by, 1)
    onChange(d.getMonth() + 1, d.getFullYear())
  }
  return (
    <div className="mo-period">
      <button type="button" onClick={() => step(-1)} aria-label="Previous month"><FaChevronLeft /></button>
      <label className="is-static"><span>{isCurrent ? 'This month' : `${MONTHS[month - 1]} ${year}`}</span></label>
      <button type="button" onClick={() => step(1)} disabled={isCurrent} aria-label="Next month"><FaChevronRight /></button>
    </div>
  )
}

/* ── KPI tiles ──────────────────────────────────────────────── */

export type Tone = 'accent' | 'good' | 'mid' | 'low' | 'plain'

export const KpiRow = ({ children }: { children: ReactNode }) => <div className="mo-kpis">{children}</div>

export const Kpi = ({ label, value, hint, tone = 'plain', icon: Icon }: { label: string; value: ReactNode; hint?: ReactNode; tone?: Tone; icon?: IconType }) => (
  <div className={`mo-kpi is-${tone}`}>
    <div className="mo-kpi-label">{Icon && <Icon />}{label}</div>
    <div className="mo-kpi-value">{value}</div>
    {hint && <div className="mo-kpi-hint">{hint}</div>}
  </div>
)

/* ── Panels and ranked lists ────────────────────────────────── */

export const Panel = ({ title, icon: Icon, tone = 'plain', aside, children, className = '' }: {
  title: string; icon?: IconType; tone?: Tone; aside?: ReactNode; children: ReactNode; className?: string
}) => (
  <div className={`mo-panel is-${tone} ${className}`}>
    <div className="mo-panel-head">
      {Icon && <Icon />}<span>{title}</span>
      {aside && <em>{aside}</em>}
    </div>
    <div className="mo-panel-body">{children}</div>
  </div>
)

export type RankItem = { key: string; name: string; sub?: string; value: ReactNode; ratio?: number; image?: string | null; badge?: ReactNode }

export const RankList = ({ items, tone = 'good', medals = true, empty = 'Nothing to show yet', avatar = 'initials' }: {
  items: RankItem[]; tone?: Tone; medals?: boolean; empty?: string; avatar?: 'initials' | 'image' | 'none'
}) => {
  if (!items.length) return <EmptyState text={empty} compact />
  return (
    <ol className={`mo-rank is-${tone}`}>
      {items.map((it, i) => (
        <li key={it.key}>
          <span className={`mo-rank-no${medals && i < 3 ? ` m${i + 1}` : ''}`}>{i + 1}</span>
          {avatar === 'initials' && <span className="mo-avatar">{initials(it.name)}</span>}
          {avatar === 'image' && (it.image ? <img className="mo-avatar is-img" src={it.image} alt="" /> : <span className="mo-avatar">{initials(it.name)}</span>)}
          <div className="mo-rank-main">
            <div className="mo-rank-line">
              <b title={it.name}>{it.name}</b>
              {it.badge}
              <span className="mo-rank-value">{it.value}</span>
            </div>
            {it.sub && <small title={it.sub}>{it.sub}</small>}
            {it.ratio !== undefined && <div className="mo-bar"><i style={{ width: `${Math.max(it.ratio > 0 ? 3 : 0, Math.min(100, it.ratio * 100))}%` }} /></div>}
          </div>
        </li>
      ))}
    </ol>
  )
}

/* ── Meters ─────────────────────────────────────────────────── */

export const Meter = ({ icon: Icon, label, color, pct, value, detail, highlight }: {
  icon?: IconType; label: string; color: string; pct: number; value: ReactNode; detail?: ReactNode; highlight?: boolean
}) => (
  <div className={`mo-meter${highlight ? ' is-top' : ''}`} style={{ ['--mo-c' as string]: color }}>
    <div className="mo-meter-line">
      {Icon && <span className="mo-meter-icon"><Icon /></span>}
      <b>{label}</b>
      {highlight && <span className="mo-chip">Most used</span>}
      <span className="mo-meter-value">{value}</span>
    </div>
    <div className="mo-bar is-lg"><i style={{ width: `${Math.max(pct > 0 ? 2 : 0, Math.min(100, pct))}%` }} /></div>
    {detail && <div className="mo-meter-detail">{detail}</div>}
  </div>
)

/* ── States ─────────────────────────────────────────────────── */

export const EmptyState = ({ text, hint, compact }: { text: string; hint?: string; compact?: boolean }) => (
  <div className={`mo-empty${compact ? ' is-compact' : ''}`}>
    <FaInbox />
    <b>{text}</b>
    {hint && <span>{hint}</span>}
  </div>
)

export const Loading = () => (
  <div className="mo-loading">
    <div className="mo-kpis">{[0, 1, 2, 3].map((i) => <div key={i} className="mo-skel is-kpi" />)}</div>
    <div className="mo-grid-2"><div className="mo-skel is-panel" /><div className="mo-skel is-panel" /></div>
  </div>
)
