import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { FaTimes } from 'react-icons/fa'
import './reportDrawer.css'

/* Detail panel for the module reports ("View" on a table row). By default it slides in from the right like
   the Student Reports detail panel; variant="modal" shows it as a centred pop-up instead (Assessments).
   Header, a row of summary tiles, an optional filter bar, then the module's own content. Esc or a click
   outside closes it. */

export type DrawerStat = { label: string; value: ReactNode; hint?: ReactNode; tone?: 'orange' | 'green' | 'amber' | 'red' | 'purple' | 'blue' | 'plain' }

const initialsOf = (name: string) =>
  (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()

const ReportDrawer = ({ name, email, meta, badge, icon, stats, toolbar, onClose, width = 760, variant = 'drawer', children }: {
  name: string; email?: string; meta?: ReactNode; badge?: ReactNode
  /** Shown instead of the initials avatar (e.g. an exam rather than a student) */
  icon?: ReactNode
  stats?: DrawerStat[]; toolbar?: ReactNode; onClose: () => void; width?: number; variant?: 'drawer' | 'modal'; children: ReactNode
}) => {
  useEffect(() => {
    // Esc closes, unless a dialog opened from inside the drawer is on top
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !document.querySelector('.rd-stacked')) onClose() }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose])

  return createPortal(
    <>
      <div className="rd-backdrop" onClick={onClose} />
      <aside className={`rd-drawer${variant === 'modal' ? ' is-modal' : ''}`} role="dialog" aria-modal="true" aria-label={`${name} details`}
        style={{ width: variant === 'modal' ? `min(${width}px, calc(100vw - 32px))` : `min(${width}px, 100vw)` }}>
        <div className="rd-head">
          <span className="rd-avatar">{icon ?? initialsOf(name)}</span>
          <div className="rd-who">
            <h3>{name || 'Student'} {badge}</h3>
            <p>{[email, meta].filter(Boolean).map((v, i) => <span key={i}>{v}</span>)}</p>
          </div>
          <button type="button" className="rd-close" onClick={onClose} aria-label="Close"><FaTimes /></button>
        </div>

        {stats && stats.length > 0 && (
          <div className="rd-stats">
            {stats.map((s) => (
              <div key={s.label} className={`rd-stat is-${s.tone || 'plain'}`}>
                <small>{s.label}</small>
                <strong>{s.value}</strong>
                {s.hint && <em>{s.hint}</em>}
              </div>
            ))}
          </div>
        )}

        {toolbar && <div className="rd-toolbar">{toolbar}</div>}
        {/* dr-skin: tables and Student Reports controls inside the drawer look the same as in the report */}
        <div className="rd-body student-reports-dashboard dr-skin">{children}</div>
      </aside>
    </>,
    document.body,
  )
}

export default ReportDrawer
