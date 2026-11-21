import { createContext, useContext } from 'react'
import { HeaderSelect, toOptions } from '../StudentReports'

/* Branch / Year filter shared by every table in a module report tab. ModuleReport owns the selection,
   publishes it here before rendering the report, and remounts the report when it changes, so each
   table's requests pick it up through withCohort() (the API narrows its students before paginating). */

export type Cohort = { branch: string; joiningYear: string }

let current: Cohort = { branch: '', joiningYear: '' }
export const publishCohort = (c: Cohort) => { current = c }

/** Query string with the current branch / year added */
export const withCohort = (params: URLSearchParams | string | Record<string, string>) => {
  const q = new URLSearchParams(params as any)
  if (current.branch) q.set('branch', current.branch)
  if (current.joiningYear) q.set('joiningYear', current.joiningYear)
  return q.toString()
}

type CohortState = Cohort & {
  branches: string[]
  years: string[]
  setBranch: (v: string) => void
  setYear: (v: string) => void
}
export const CohortContext = createContext<CohortState | null>(null)

/** The Branch: / Year: dropdowns (same control as the Student Reports toolbar) */
export const CohortFilters = () => {
  const c = useContext(CohortContext)
  if (!c) return null
  return (
    <>
      <HeaderSelect label="Filter by branch" prefix="Branch:" value={c.branch} options={toOptions('All', c.branches)} onChange={c.setBranch} />
      <HeaderSelect label="Filter by joining year" prefix="Year:" value={c.joiningYear} options={toOptions('All', c.years)} onChange={c.setYear} />
    </>
  )
}
