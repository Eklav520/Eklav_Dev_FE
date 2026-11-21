import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { FaCalendarAlt, FaCheckCircle, FaChevronDown } from 'react-icons/fa'

/* Date range shared by every module report tab (all tabs except Student Reports). ModuleReport owns it;
   the default is "Till now" (everything so far). Changing it reloads the report, and each report reads
   the resolved from / to dates through useReportRange(). */

export type RangePreset = 'all' | 'today' | '7d' | '31d' | 'custom'

/** Start date used for "Till now": earlier than any data on the platform */
export const ALL_TIME_FROM = '2020-01-01'

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const todayIso = () => iso(new Date())
const daysBack = (n: number) => { const d = new Date(); d.setDate(d.getDate() - (n - 1)); return iso(d) }
const fmt = (v: string) => new Date(`${v}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

export type ReportRange = {
  preset: RangePreset
  /** Resolved start (YYYY-MM-DD); ALL_TIME_FROM for "Till now" */
  from: string
  /** Resolved end (YYYY-MM-DD), today unless a custom range ends earlier */
  to: string
  isAll: boolean
  label: string
}

export const resolveRange = (preset: RangePreset, customFrom: string, customTo: string): ReportRange => {
  const to = todayIso()
  switch (preset) {
    case 'today': return { preset, from: to, to, isAll: false, label: 'Today' }
    case '7d': return { preset, from: daysBack(7), to, isAll: false, label: 'Last 7 days' }
    case '31d': return { preset, from: daysBack(31), to, isAll: false, label: 'Last 31 days' }
    case 'custom': return { preset, from: customFrom, to: customTo, isAll: false, label: `${fmt(customFrom)} – ${fmt(customTo)}` }
    default: return { preset: 'all', from: ALL_TIME_FROM, to, isAll: true, label: 'Till Now' }
  }
}

type RangeState = ReportRange & { setRange: (preset: RangePreset, from?: string, to?: string) => void }
export const RangeContext = createContext<RangeState | null>(null)

/** The selected range; outside a ModuleReport it falls back to "Till now" */
export const useReportRange = (): ReportRange => useContext(RangeContext) ?? resolveRange('all', '', '')

const OPTIONS: { value: RangePreset; label: string }[] = [
  { value: 'all', label: 'Till Now' },
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 days' },
  { value: '31d', label: 'Last 31 days' },
  { value: 'custom', label: 'Custom range…' },
]

/** The Date dropdown (Student Reports dropdown look) with a from / to picker for a custom range */
export const ReportRangeSelect = () => {
  const ctx = useContext(RangeContext)
  const [open, setOpen] = useState(false)
  const [picking, setPicking] = useState(false)
  const [from, setFrom] = useState(ctx?.preset === 'custom' ? ctx.from : daysBack(31))
  const [to, setTo] = useState(ctx?.preset === 'custom' ? ctx.to : todayIso())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open && !picking) return
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setPicking(false) } }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, picking])

  if (!ctx) return null
  const choose = (p: RangePreset) => {
    setOpen(false)
    if (p === 'custom') { setPicking(true); return }
    ctx.setRange(p)
  }

  return (
    <div className="sr-dropdown dr-range" ref={ref}>
      <button type="button" className={`sr-dropdown-trigger sr-select-trigger${open || picking ? ' is-open' : ''}`} aria-label="Date range" aria-haspopup="listbox" aria-expanded={open} onClick={() => { setOpen((v) => !v); setPicking(false) }}>
        <FaCalendarAlt className="dr-range-icon" aria-hidden="true" />
        <span className="sr-select-prefix">Date:</span>
        <span>{ctx.label}</span>
        <FaChevronDown className="sr-dropdown-caret" aria-hidden="true" />
      </button>
      {open && (
        <ul className="sr-dropdown-menu sr-select-menu" role="listbox" aria-label="Date range">
          {OPTIONS.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === ctx.preset}>
              <button type="button" className={o.value === ctx.preset ? 'is-active' : ''} onClick={() => choose(o.value)}>
                {o.label}
                {o.value === ctx.preset && <FaCheckCircle aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
      {picking && (
        <div className="dr-range-pop">
          <span>Custom range</span>
          <div>
            <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} aria-label="From" />
            <em>–</em>
            <input type="date" value={to} min={from} max={todayIso()} onChange={(e) => setTo(e.target.value)} aria-label="To" />
          </div>
          <div>
            <button type="button" className="sr-view-button" onClick={() => setPicking(false)}>Cancel</button>
            <button type="button" className="sr-export-button" disabled={!from || !to || from > to} onClick={() => { setPicking(false); ctx.setRange('custom', from, to) }}>Apply</button>
          </div>
        </div>
      )}
    </div>
  )
}
