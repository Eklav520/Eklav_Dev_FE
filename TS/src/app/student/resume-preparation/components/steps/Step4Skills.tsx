import React from 'react'
import { StepProps } from '../ResumeBuilder'
import { Plus, X, ArrowRight } from 'lucide-react'

const ORANGE = '#f97316'
const BORDER = '#e5e7eb'
// Reads the same --dash-* CSS vars StudentLayout sets for dark mode.
// Input fields stay intentionally fixed white/light (always legible);
// only heading/label text sitting directly on the theme-following card needs to adapt.
const GRAY = 'var(--dash-gray, #6b7280)'
const TEXT = 'var(--dash-text, #111827)'
const CARD_BG = 'var(--dash-card-bg, #ffffff)'

const Step4Skills: React.FC<StepProps> = ({ data, setData, goNext, goBack }) => {
  const items = data.skills

  const update = (i: number, v: string) => {
    const next = [...items]; next[i] = v
    setData({ ...data, skills: next })
  }
  const add = () => setData({ ...data, skills: [...items, ''] })
  const remove = (i: number) => setData({ ...data, skills: items.filter((_, idx) => idx !== i) })

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, margin: 0 }}>Skills</h2>
        <p style={{ fontSize: 13, color: GRAY, margin: '4px 0 0' }}>Add your technical and soft skills</p>
      </div>

      {/* Skill chips grid */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {items.map((skill, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff7ed', border: `1px solid ${ORANGE}40`, borderRadius: 20, padding: '4px 10px 4px 12px' }}>
            <input
              value={skill}
              onChange={(e) => update(i, e.target.value)}
              placeholder="e.g. React"
              style={{ border: 'none', background: 'transparent', fontSize: 13, color: '#1f2937', outline: 'none', width: Math.max(60, skill.length * 8 + 20), fontFamily: 'inherit' }}
            />
            <button type="button" onClick={() => remove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}>
              <X size={12} color={ORANGE} />
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={add} style={{ fontSize: 13, fontWeight: 600, color: ORANGE, background: '#fff7ed', border: `1.5px dashed ${ORANGE}60`, borderRadius: 8, padding: '9px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28 }}>
        <Plus size={15} /> Add Skill
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
        <button type="button" onClick={goBack} style={{ fontSize: 13, fontWeight: 600, color: '#374151', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '9px 20px', cursor: 'pointer' }}>
          Save & Exit
        </button>
        <button type="button" onClick={goNext} style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: ORANGE, border: 'none', borderRadius: 8, padding: '9px 22px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(249,115,22,0.35)' }}>
          Save & Continue <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}

export default Step4Skills
