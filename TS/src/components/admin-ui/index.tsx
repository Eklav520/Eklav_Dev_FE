/* Admin UI kit — shared building blocks so every institute admin section uses one template.
   Styles live in ./adminUi.css (aui-* classes); wrap a page in <AdminPage>. */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { IconType } from 'react-icons'
import { FaAngleDoubleLeft, FaAngleDoubleRight, FaCheckCircle, FaChevronDown, FaChevronLeft, FaChevronRight, FaSearch, FaTimes } from 'react-icons/fa'
import './adminUi.css'

export type Tone = 'orange' | 'green' | 'amber' | 'red' | 'blue' | 'purple'

export const AdminPage = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`aui-page ${className}`.trim()}>{children}</div>
)

export const PageHeader = ({ icon: Icon, title, subtitle, badge, stats, actions }: {
  icon: IconType
  title: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
  /* Usually <StatCards inline … /> — shown beside the title */
  stats?: ReactNode
  actions?: ReactNode
}) => (
  <div className="aui-header">
    <div className="aui-heading">
      <span className="aui-heading-icon"><Icon /></span>
      <div>
        <h2>{title}{badge}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
    {stats}
    {actions && <div className="aui-header-actions">{actions}</div>}
  </div>
)

export type StatItem = { label: string; value: ReactNode; icon: IconType; tone: Tone; hint?: ReactNode }

export const StatCards = ({ items, loading, inline }: { items: StatItem[]; loading?: boolean; inline?: boolean }) => (
  <div className={inline ? 'aui-stats aui-stats-inline' : 'aui-stats'}>
    {items.map(({ label, value, icon: Icon, tone, hint }) => (
      <div key={label} className={`aui-stat aui-tone-${tone}`}>
        <span className="aui-stat-icon"><Icon /></span>
        <div>
          <strong>{loading ? '—' : value}</strong>
          <span className="aui-stat-label">{label}</span>
          {hint && <span className="aui-stat-hint">{hint}</span>}
        </div>
      </div>
    ))}
  </div>
)

export const SearchInput = ({ value, onChange, placeholder = 'Search…' }: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) => (
  <label className="aui-search">
    <FaSearch aria-hidden="true" />
    <input type="search" value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
    {value && (
      <button type="button" className="aui-search-clear" onClick={() => onChange('')} aria-label="Clear search">
        <FaTimes size={11} />
      </button>
    )}
  </label>
)

/* Close a popover on outside click or Escape */
const useDismiss = (open: boolean, close: () => void) => {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) close() }
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close() }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onPointer); document.removeEventListener('keydown', onKey) }
  }, [open]) // eslint-disable-line
  return ref
}

export type SelectOption = { value: string; label: string }

/* Dark dropdown used for every filter (the native <select> list opens white on Windows) */
export const AdminSelect = ({ label, prefix, value, options, onChange, openUp }: {
  label: string
  prefix?: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  openUp?: boolean
}) => {
  const [open, setOpen] = useState(false)
  const ref = useDismiss(open, () => setOpen(false))
  const current = options.find(option => option.value === value) ?? options[0]

  return (
    <div className="aui-dropdown" ref={ref}>
      <button type="button" className={`aui-dropdown-trigger${open ? ' is-open' : ''}`} aria-label={label} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(v => !v)}>
        {prefix && <span className="aui-dropdown-prefix">{prefix}</span>}
        <span className="aui-dropdown-value">{current?.label}</span>
        <FaChevronDown className="aui-dropdown-caret" aria-hidden="true" />
      </button>
      {open && (
        <ul className={`aui-dropdown-menu${openUp ? ' is-up' : ''}`} role="listbox" aria-label={label}>
          {options.map(option => (
            <li key={option.value || '__all'} role="option" aria-selected={option.value === value}>
              <button type="button" className={option.value === value ? 'is-active' : ''} onClick={() => { onChange(option.value); setOpen(false) }}>
                {option.label}
                {option.value === value && <FaCheckCircle aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* "All" option followed by the given values */
export const toOptions = (allLabel: string, values: string[]): SelectOption[] =>
  [{ value: '', label: allLabel }, ...values.map(value => ({ value, label: value }))]

const pageList = (page: number, total: number): (number | 'gap')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | 'gap')[] = [1]
  if (page > 3) pages.push('gap')
  for (let p = Math.max(2, page - 1); p <= Math.min(total - 1, page + 1); p += 1) pages.push(p)
  if (page < total - 2) pages.push('gap')
  pages.push(total)
  return pages
}

/* Footer: "Showing a–b of n" + optional rows-per-page + page buttons */
export const TableFooter = ({ page, pageSize, total, onPageChange, pageSizeOptions, onPageSizeChange, noun = 'items' }: {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  pageSizeOptions?: number[]
  onPageSizeChange?: (size: number) => void
  noun?: string
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  return (
    <div className="aui-footer">
      <span>Showing <b>{start}</b>–<b>{end}</b> of <b>{total}</b> {noun}</span>
      <div className="aui-footer-right">
        {pageSizeOptions && onPageSizeChange && (
          <AdminSelect
            label="Rows per page"
            prefix="Rows:"
            value={String(pageSize)}
            options={pageSizeOptions.map(size => ({ value: String(size), label: String(size) }))}
            onChange={value => onPageSizeChange(Number(value))}
            openUp
          />
        )}
        {totalPages > 1 && (
          <div className="aui-pages">
            <button type="button" className="aui-page-btn" onClick={() => onPageChange(1)} disabled={page === 1} aria-label="First page"><FaAngleDoubleLeft /></button>
            <button type="button" className="aui-page-btn" onClick={() => onPageChange(page - 1)} disabled={page === 1} aria-label="Previous page"><FaChevronLeft /></button>
            {pageList(page, totalPages).map((p, i) => p === 'gap'
              ? <span key={`gap-${i}`} className="aui-page-gap">…</span>
              : <button type="button" key={p} className={`aui-page-btn${p === page ? ' is-active' : ''}`} onClick={() => onPageChange(p)}>{p}</button>)}
            <button type="button" className="aui-page-btn" onClick={() => onPageChange(page + 1)} disabled={page === totalPages} aria-label="Next page"><FaChevronRight /></button>
            <button type="button" className="aui-page-btn" onClick={() => onPageChange(totalPages)} disabled={page === totalPages} aria-label="Last page"><FaAngleDoubleRight /></button>
          </div>
        )}
      </div>
    </div>
  )
}

export type TabItem<T extends string> = { value: T; label: ReactNode; icon?: IconType; count?: ReactNode }

/* Segmented tab switch — usually passed as PageHeader actions */
export const Tabs = <T extends string>({ items, value, onChange, small, label = 'Sections' }: {
  items: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  small?: boolean
  label?: string
}) => (
  <div className={small ? 'aui-tabs aui-tabs-sm' : 'aui-tabs'} role="tablist" aria-label={label}>
    {items.map(({ value: v, label: text, icon: Icon, count }) => (
      <button key={v} type="button" role="tab" aria-selected={v === value} className={v === value ? 'is-active' : ''} onClick={() => onChange(v)}>
        {Icon && <Icon size={11} />} {text}
        {count != null && <span className="aui-badge aui-badge-muted">{count}</span>}
      </button>
    ))}
  </div>
)

/* Track + fill + value label; tone follows the value unless given */
export const ProgressBar = ({ value, label, tone }: { value: number; label?: ReactNode; tone?: 'green' | 'amber' | 'muted' | 'orange' }) => {
  const pct = Math.max(0, Math.min(100, value || 0))
  const t = tone ?? (pct >= 100 ? 'green' : pct > 0 ? 'amber' : 'muted')
  return (
    <div className="aui-progress">
      <div className="aui-progress-track"><div className={`aui-progress-fill${t === 'orange' ? '' : ` is-${t}`}`} style={{ width: `${pct}%` }} /></div>
      <span>{label ?? `${Math.round(pct)}%`}</span>
    </div>
  )
}

export const EmptyState = ({ icon: Icon, title, text, action }: {
  icon: IconType
  title: ReactNode
  text?: ReactNode
  action?: ReactNode
}) => (
  <div className="aui-empty">
    <span className="aui-empty-icon"><Icon /></span>
    <h4>{title}</h4>
    {text && <p>{text}</p>}
    {action}
  </div>
)

/* Badge colour for a 0–100 score: green ≥ 80, amber ≥ 50, red below */
export const scoreBadgeClass = (score: number | null | undefined) =>
  score == null ? 'aui-badge-muted' : score >= 80 ? 'aui-badge-green' : score >= 50 ? 'aui-badge-amber' : 'aui-badge-red'

export const initialsOf = (name: string) =>
  (name || '?').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase()
