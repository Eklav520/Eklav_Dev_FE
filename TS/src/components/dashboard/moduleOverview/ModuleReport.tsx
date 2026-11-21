import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { IconType } from 'react-icons'
import { useAuthContext } from '@/context/useAuthContext'
import { CohortContext, publishCohort } from './cohort'
import { RangeContext, ReportRangeSelect, resolveRange, type RangePreset } from './range'
import '../StudentReports.css'
import './moduleReport.css'

/* Frame for a dashboard module tab (Daily Engagement, Course Progress, AI Interview, English Practice,
   LSRW Practice, Assessments, Code Challenge). It opens straight into that module's full report with the
   Student Reports look. Reports that draw their own heading row (title + export buttons) are passed
   without a title, so the heading appears once. It also owns the filters every report shares: the date
   range (default "Till now") and Branch / Year. */
const ModuleReport = ({ apiBase, icon: Icon, title, subtitle, actions, children }: {
  apiBase: string; icon?: IconType; title?: string; subtitle?: string; actions?: ReactNode; children: ReactNode
}) => {
  const { user } = useAuthContext()
  const [branch, setBranch] = useState('')
  const [joiningYear, setYear] = useState('')
  const [options, setOptions] = useState<{ branches: string[]; years: string[] }>({ branches: [], years: [] })
  const [range, setRangeState] = useState<{ preset: RangePreset; from: string; to: string }>({ preset: 'all', from: '', to: '' })

  useEffect(() => {
    if (!user?.token) return
    fetch(`${import.meta.env.VITE_API_BASE_URL}${apiBase}/student-filters`, { headers: { Authorization: `Bearer ${user.token}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.success) setOptions({ branches: d.branches || [], years: d.years || [] }) })
      .catch(() => {})
  }, [apiBase, user?.token])

  // Published before the report renders, so its requests carry the filter
  publishCohort({ branch, joiningYear })
  const cohort = useMemo(() => ({ branch, joiningYear, ...options, setBranch, setYear }), [branch, joiningYear, options])
  const rangeState = useMemo(() => ({
    ...resolveRange(range.preset, range.from, range.to),
    setRange: (preset: RangePreset, from = '', to = '') => setRangeState({ preset, from, to }),
  }), [range])

  return (
    <RangeContext.Provider value={rangeState}>
      <CohortContext.Provider value={cohort}>
        <div className="student-reports-dashboard dr-skin">
          {title && (
            <div className="sr-header">
              <div className="sr-heading">
                {Icon && <span className="sr-heading-icon"><Icon /></span>}
                <div>
                  <h2>{title}</h2>
                  {subtitle && <p>{subtitle}</p>}
                </div>
              </div>
              <div className="sr-header-controls"><ReportRangeSelect />{actions}</div>
            </div>
          )}
          {/* A new date range or branch / year reloads the report with the filter applied */}
          <div className="dr-body"><Fragment key={`${rangeState.from}|${rangeState.to}|${branch}|${joiningYear}`}>{children}</Fragment></div>
        </div>
      </CohortContext.Provider>
    </RangeContext.Provider>
  )
}

export default ModuleReport
