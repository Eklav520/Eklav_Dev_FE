import { useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

const BLUE = '#2563eb'
const GRAY = '#64748b'

const MiniCalendar = ({ interviewDates }: { interviewDates: Set<string> }) => {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const today = new Date()
  const year = cursor.getFullYear(), month = cursor.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>{cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} style={{ width: 22, height: 22, border: 'none', background: '#f1f5f9', borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiChevronLeft size={12} /></button>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} style={{ width: 22, height: 22, border: 'none', background: '#f1f5f9', borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiChevronRight size={12} /></button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <div key={d} style={{ fontSize: '0.6rem', color: GRAY, textAlign: 'center', fontWeight: 600 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />
          const cellDate = new Date(year, month, day)
          const isToday = cellDate.toDateString() === today.toDateString()
          const hasInterview = interviewDates.has(cellDate.toDateString())
          return (
            <div key={i} style={{
              aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6,
              fontSize: '0.68rem', fontWeight: isToday ? 700 : 500,
              background: isToday ? BLUE : hasInterview ? '#eff6ff' : 'transparent',
              color: isToday ? '#fff' : hasInterview ? BLUE : '#334155',
            }}>
              {day}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MiniCalendar
