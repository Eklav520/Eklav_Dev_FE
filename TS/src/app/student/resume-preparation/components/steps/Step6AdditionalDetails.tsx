import React from 'react'
import { StepProps } from '../ResumeBuilder'
import { Plus, Trash2, ArrowRight } from 'lucide-react'

export type AdditionalMode = 'projects' | 'certifications' | 'languages'

interface Props extends StepProps {
  mode?: AdditionalMode
}

const ORANGE = '#f97316'
const BORDER = '#e5e7eb'
const GRAY = '#6b7280'

const inp: React.CSSProperties = {
  flex: 1, padding: '9px 12px', border: `1px solid ${BORDER}`,
  borderRadius: 8, fontSize: 13, outline: 'none', color: '#1f2937',
  background: '#fff', fontFamily: 'inherit',
}

const removeBtn: React.CSSProperties = {
  flexShrink: 0, background: '#fef2f2', border: '1px solid #fecaca',
  borderRadius: 7, padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center',
}

const addBtn = (label: string, onClick: () => void) => (
  <button
    type="button"
    onClick={onClick}
    style={{ fontSize: 13, fontWeight: 600, color: ORANGE, background: '#fff7ed', border: `1.5px dashed ${ORANGE}60`, borderRadius: 8, padding: '7px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, marginBottom: 4 }}
  >
    <Plus size={14} /> {label}
  </button>
)

const SECTION_META: Record<AdditionalMode, { title: string; sub: string }> = {
  projects:       { title: 'Projects',        sub: 'Add your personal or academic projects' },
  certifications: { title: 'Certifications',  sub: 'Add your professional certifications' },
  languages:      { title: 'Additional Information', sub: 'Add languages and other details' },
}

const Step6AdditionalDetails: React.FC<Props> = ({ data, setData, goNext, goBack, mode = 'projects' }) => {
  const projects       = data.projects
  const certifications = data.certifications ?? []
  const languages      = data.languages ?? []

  const updateArr = (field: keyof typeof data, i: number, v: string) => {
    const arr = [...(data[field] as string[])]; arr[i] = v
    setData({ ...data, [field]: arr })
  }
  const addArr    = (field: keyof typeof data) => setData({ ...data, [field]: [...(data[field] as string[]), ''] })
  const removeArr = (field: keyof typeof data, i: number) => setData({ ...data, [field]: (data[field] as string[]).filter((_, idx) => idx !== i) })

  const meta = SECTION_META[mode]

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>{meta.title}</h2>
        <p style={{ fontSize: 13, color: GRAY, margin: '4px 0 0' }}>{meta.sub}</p>
      </div>

      {/* ── Projects ── */}
      {mode === 'projects' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
            {projects.map((proj, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <textarea
                  value={proj}
                  onChange={(e) => updateArr('projects', i, e.target.value)}
                  placeholder={`Project ${i + 1}: Name | Tech Stack | Description`}
                  rows={2}
                  style={{ ...inp, resize: 'vertical', lineHeight: 1.5 }}
                />
                <button type="button" onClick={() => removeArr('projects', i)} style={removeBtn}>
                  <Trash2 size={14} color="#ef4444" />
                </button>
              </div>
            ))}
          </div>
          {addBtn('Add Project', () => addArr('projects'))}
        </>
      )}

      {/* ── Certifications ── */}
      {mode === 'certifications' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
            {certifications.map((cert, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  style={inp}
                  value={cert}
                  onChange={(e) => updateArr('certifications', i, e.target.value)}
                  placeholder="e.g. AWS Certified Developer — 2023"
                />
                <button type="button" onClick={() => removeArr('certifications', i)} style={removeBtn}>
                  <Trash2 size={14} color="#ef4444" />
                </button>
              </div>
            ))}
          </div>
          {addBtn('Add Certification', () => addArr('certifications'))}
        </>
      )}

      {/* ── Languages (Additional) ── */}
      {mode === 'languages' && (
        <>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Languages</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
            {languages.map((lang, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  style={inp}
                  value={lang}
                  onChange={(e) => updateArr('languages', i, e.target.value)}
                  placeholder="e.g. English — Fluent"
                />
                <button type="button" onClick={() => removeArr('languages', i)} style={removeBtn}>
                  <Trash2 size={14} color="#ef4444" />
                </button>
              </div>
            ))}
          </div>
          {addBtn('Add Language', () => addArr('languages'))}
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 20, marginTop: 16, borderTop: `1px solid ${BORDER}` }}>
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

export default Step6AdditionalDetails
