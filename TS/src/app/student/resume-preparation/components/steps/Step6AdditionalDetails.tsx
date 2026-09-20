import React, { useRef } from 'react'
import { StepProps } from '../ResumeBuilder'
import { Plus, Trash2, ArrowRight, List, Bold } from 'lucide-react'

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

  // Refs to each project textarea, so the bullet-point shortcut can insert "• " right
  // at the cursor (and put the cursor back after) instead of just appending to the end.
  const projectTextareaRefs = useRef<Record<number, HTMLTextAreaElement | null>>({})

  const insertBullet = (i: number) => {
    const el = projectTextareaRefs.current[i]
    const current = projects[i] || ''
    const start = el?.selectionStart ?? current.length
    const end = el?.selectionEnd ?? current.length
    const needsNewline = start > 0 && current[start - 1] !== '\n'
    const insertion = (needsNewline ? '\n' : '') + '• '
    const next = current.slice(0, start) + insertion + current.slice(end)
    updateArr('projects', i, next)
    const cursorPos = start + insertion.length
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(cursorPos, cursorPos)
    })
  }

  // Wraps the selected text in **markdown-bold** — plain <textarea>s can't show real
  // bold while typing, but the resume templates parse ** markers via renderBoldText()
  // and render actual <strong> text in the generated resume. If nothing is selected,
  // inserts empty ** ** markers with the cursor placed between them.
  const wrapBold = (i: number) => {
    const el = projectTextareaRefs.current[i]
    const current = projects[i] || ''
    const start = el?.selectionStart ?? current.length
    const end = el?.selectionEnd ?? current.length
    const selected = current.slice(start, end)
    const wrapped = `**${selected}**`
    const next = current.slice(0, start) + wrapped + current.slice(end)
    updateArr('projects', i, next)
    const cursorPos = selected ? start + wrapped.length : start + 2
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(cursorPos, cursorPos)
    })
  }

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
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                      <button
                        type="button"
                        onClick={() => insertBullet(i)}
                        title="Insert a bullet point"
                        style={{ fontSize: 11.5, fontWeight: 600, color: ORANGE, background: '#fff7ed', border: `1px solid ${ORANGE}40`, borderRadius: 6, padding: '4px 9px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                      >
                        <List size={12} /> Add bullet point
                      </button>
                      <button
                        type="button"
                        onClick={() => wrapBold(i)}
                        title="Bold the selected text (or click then type)"
                        style={{ fontSize: 11.5, fontWeight: 600, color: ORANGE, background: '#fff7ed', border: `1px solid ${ORANGE}40`, borderRadius: 6, padding: '4px 9px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                      >
                        <Bold size={12} /> Bold
                      </button>
                    </div>
                    <textarea
                      ref={(el) => { projectTextareaRefs.current[i] = el }}
                      className="resume-project-textarea"
                      value={proj}
                      onChange={(e) => updateArr('projects', i, e.target.value)}
                      placeholder={`Project ${i + 1}: Name | Tech Stack | Description\n\nUse "Add bullet point" to list what you built, e.g.\n• Built a REST API with Node.js and MongoDB\n• Reduced page load time by 40%`}
                      rows={8}
                      style={{ ...inp, width: '100%', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5, scrollbarWidth: 'thin', scrollbarColor: `${ORANGE} #f3f4f6` }}
                    />
                  </div>
                  <button type="button" onClick={() => removeArr('projects', i)} style={removeBtn}>
                    <Trash2 size={14} color="#ef4444" />
                  </button>
                </div>
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

      {/* Thin, rounded scrollbar for the project textarea (webkit browsers —
          Firefox is handled via the inline scrollbarWidth/scrollbarColor style). */}
      <style>{`
        .resume-project-textarea::-webkit-scrollbar { width: 8px; }
        .resume-project-textarea::-webkit-scrollbar-track { background: #f3f4f6; border-radius: 8px; }
        .resume-project-textarea::-webkit-scrollbar-thumb { background: ${ORANGE}; border-radius: 8px; }
        .resume-project-textarea::-webkit-scrollbar-thumb:hover { background: #ea580c; }
      `}</style>
    </div>
  )
}

export default Step6AdditionalDetails
