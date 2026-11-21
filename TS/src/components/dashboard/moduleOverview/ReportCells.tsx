import type { ReactNode } from 'react'
import { FaChevronLeft, FaChevronRight, FaEye } from 'react-icons/fa'

/** The Student Reports table footer: "Showing a–b of n" and up to five page buttons */
export const ReportPagination = ({ page, pageSize, total, onPage }: {
  page: number; pageSize: number; total: number; onPage: (page: number) => void
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (!total) return null
  const start = Math.min(Math.max(1, page - 2), Math.max(1, totalPages - 4))
  return (
    <div className="sr-pagination">
      <span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</span>
      {totalPages > 1 && (
        <div className="sr-pagination-controls">
          <button type="button" onClick={() => onPage(Math.max(1, page - 1))} disabled={page <= 1} aria-label="Previous page"><FaChevronLeft /></button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, k) => start + k).map((n) => (
            <button type="button" key={n} className={n === page ? 'active' : ''} onClick={() => onPage(n)}>{n}</button>
          ))}
          <button type="button" onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages} aria-label="Next page"><FaChevronRight /></button>
        </div>
      )}
    </div>
  )
}

/* Table cells shared by the module reports, using the Student Reports classes so every table in the
   dashboard has the same student cell, score bars, status pills and View button. */

// Same thresholds as the Student Reports table
const scoreColor = (v: number) => (v >= 75 ? '#22c55e' : v >= 50 ? '#f59e0b' : v > 0 ? '#ef4444' : '#444')

const initialsOf = (name: string) =>
  (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()

export const StudentCell = ({ name, email, minWidth = 170 }: { name: string; email?: string; minWidth?: number }) => (
  <div className="sr-student-cell" style={{ minWidth }}>
    <span className="sr-avatar">{initialsOf(name)}</span>
    <div style={{ minWidth: 0 }}>
      <strong title={name}>{name || 'Student'}</strong>
      {email && <small title={email}>{email}</small>}
    </div>
  </div>
)

/** Percentage with the thin coloured bar from the Student Reports table */
export const ScoreBar = ({ pct, label }: { pct: number; label?: ReactNode }) => {
  const v = Math.max(0, Math.min(100, Math.round(pct || 0)))
  return (
    <div className="sr-score-cell" style={{ minWidth: 90 }}>
      <strong>{label ?? `${v}%`}</strong>
      <span><i style={{ width: `${v}%`, background: scoreColor(v) }} /></span>
    </div>
  )
}

export type PillTone = 'good' | 'mid' | 'low' | 'none' | 'pending'
const PILL_CLASS: Record<PillTone, string> = {
  good: 'sr-status-on-track', mid: 'sr-status-needs-attention', low: 'sr-status-at-risk', none: 'sr-status-not-started', pending: 'sr-status-pending',
}
export const StatusPill = ({ tone, children }: { tone: PillTone; children: ReactNode }) => (
  <span className={`sr-status-pill ${PILL_CLASS[tone]}`}>{children}</span>
)

export const ViewButton = ({ onClick, children = 'View' }: { onClick: () => void; children?: ReactNode }) => (
  <button type="button" className="sr-view-button" onClick={onClick}><FaEye /> {children}</button>
)
