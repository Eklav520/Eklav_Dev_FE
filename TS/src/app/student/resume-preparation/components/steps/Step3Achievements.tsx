import React from 'react'
import { ResumeData } from '../ResumeData'
import { Plus, Trash2, ArrowRight } from 'lucide-react'

interface StepProps {
  data: ResumeData
  setData: (data: ResumeData) => void
  goNext: () => void
  goBack: () => void
}

const ORANGE = '#f97316'
const BORDER = '#e5e7eb'
// Reads the same --dash-* CSS vars StudentLayout sets for dark mode.
// Input fields stay intentionally fixed white/light (always legible);
// only heading/label text sitting directly on the theme-following card needs to adapt.
const GRAY = 'var(--dash-gray, #6b7280)'
const TEXT = 'var(--dash-text, #111827)'
const CARD_BG = 'var(--dash-card-bg, #ffffff)'

const inp: React.CSSProperties = {
  flex: 1, padding: '9px 12px', border: `1px solid ${BORDER}`,
  borderRadius: 8, fontSize: 13, outline: 'none', color: '#1f2937',
  background: '#fff', fontFamily: 'inherit',
}

const Step3Achievements: React.FC<StepProps> = ({ data, setData, goNext, goBack }) => {
  const items = data.achievements ?? []

  const update = (i: number, v: string) => {
    const next = [...items]; next[i] = v
    setData({ ...data, achievements: next })
  }
  const add = () => setData({ ...data, achievements: [...items, ''] })
  const remove = (i: number) => setData({ ...data, achievements: items.filter((_, idx) => idx !== i) })

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, margin: 0 }}>Key Achievements</h2>
        <p style={{ fontSize: 13, color: GRAY, margin: '4px 0 0' }}>Highlight your top accomplishments — awards, metrics, milestones or impact statements</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              style={inp}
              value={item}
              onChange={(e) => update(i, e.target.value)}
              placeholder="e.g. Increased sales by 30% in Q2 2023"
            />
            <button type="button" onClick={() => remove(i)} style={{ flexShrink: 0, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Trash2 size={14} color="#ef4444" />
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={add} style={{ fontSize: 13, fontWeight: 600, color: ORANGE, background: '#fff7ed', border: `1.5px dashed ${ORANGE}60`, borderRadius: 8, padding: '9px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28 }}>
        <Plus size={15} /> Add Achievement
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
        <button type="button" onClick={goBack} style={{ fontSize: 13, fontWeight: 600, color: TEXT, background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '9px 20px', cursor: 'pointer' }}>
          Save & Exit
        </button>
        <button type="button" onClick={goNext} style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: ORANGE, border: 'none', borderRadius: 8, padding: '9px 22px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(249,115,22,0.35)' }}>
          Save & Continue <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}

export default Step3Achievements
