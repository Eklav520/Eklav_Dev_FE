import { Button, Form } from 'react-bootstrap'
import { useEffect, useMemo } from 'react'

type ProgressAnalyticsFiltersProps = {
  year: number
  month: number
  week: string | null
  yearOptions: number[]
  monthOptions: number[]
  weekOptions: string[]
  onYearChange(year: number): void
  onMonthChange(month: number): void
  onWeekChange(week: string): void
  onDownload?: () => void
  downloadDisabled?: boolean
}

const MONTH_LABELS: Record<number, string> = {
  1: 'January',
  2: 'February',
  3: 'March',
  4: 'April',
  5: 'May',
  6: 'June',
  7: 'July',
  8: 'August',
  9: 'September',
  10: 'October',
  11: 'November',
  12: 'December',
}

/** Convert ISO week (2026-W3) → date of that week’s Monday */
const isoWeekToDate = (year: number, week: number) => {
  const simple = new Date(year, 0, 1 + (week - 1) * 7)
  const dow = simple.getDay()
  const ISOweekStart = simple
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1)
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay())
  }
  return ISOweekStart
}

const ProgressAnalyticsFilters = ({
  year,
  month,
  week,
  yearOptions,
  monthOptions,
  weekOptions,
  onYearChange,
  onMonthChange,
  onWeekChange,
  onDownload,
  downloadDisabled,
}: ProgressAnalyticsFiltersProps) => {
  const isWeekDisabled = year === 0 || month === 0

  // 🔹 Filter by BOTH year + month
  const filteredWeeks = useMemo(() => {
    if (!year || !month) return []

    return weekOptions.filter(w => {
      const [y, wk] = w.split('-W')
      if (Number(y) !== year) return false

      const date = isoWeekToDate(year, Number(wk))
      return date.getMonth() + 1 === month
    })
  }, [weekOptions, year, month])

  // Reset invalid week
  useEffect(() => {
    if (week && !filteredWeeks.includes(week)) {
      onWeekChange('')
    }
  }, [filteredWeeks, week, onWeekChange])

  return (
    <div
      className="p-3 rounded"
      style={{
        background: '#121826',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Year */}
      <Form.Select
        value={year}
        onChange={e => onYearChange(Number(e.target.value))}
        style={{ minWidth: 140 }}
      >
        <option value={0}>Year</option>
        {yearOptions.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </Form.Select>

      {/* Month */}
      <Form.Select
        value={month}
        onChange={e => onMonthChange(Number(e.target.value))}
        style={{ minWidth: 160 }}
      >
        <option value={0}>Month</option>
        {monthOptions.map(m => (
          <option key={m} value={m}>
            {MONTH_LABELS[m]}
          </option>
        ))}
      </Form.Select>

      {/* Week */}
      <Form.Select
        value={week ?? ''}
        onChange={e => onWeekChange(e.target.value)}
        disabled={isWeekDisabled}
        style={{ minWidth: 160 }}
      >
        <option value="">
          {isWeekDisabled
            ? 'Select Year & Month'
            : filteredWeeks.length === 0
            ? 'No weeks available'
            : 'Week'}
        </option>

        {filteredWeeks.map(w => (
          <option key={w} value={w}>
            {w}
          </option>
        ))}
      </Form.Select>

      {onDownload && (
        <div className="ms-auto">
          <Button
            variant="outline-light"
            size="sm"
            onClick={onDownload}
            disabled={downloadDisabled}
          >
            Download Excel
          </Button>
        </div>
      )}
    </div>
  )
}

export default ProgressAnalyticsFilters
