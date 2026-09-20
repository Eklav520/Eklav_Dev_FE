import React, { useRef } from 'react'
import { ResumeData } from '../ResumeData'
import { Plus, Trash2, ArrowRight, List, Bold } from 'lucide-react'

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

  // Refs to each achievement textarea, so the bullet-point shortcut can insert "• "
  // right at the cursor (and put the cursor back after) instead of just appending to the end.
  const textareaRefs = useRef<Record<number, HTMLTextAreaElement | null>>({})

  const insertBullet = (i: number) => {
    const el = textareaRefs.current[i]
    const current = items[i] || ''
    const start = el?.selectionStart ?? current.length
    const end = el?.selectionEnd ?? current.length
    const needsNewline = start > 0 && current[start - 1] !== '\n'
    const insertion = (needsNewline ? '\n' : '') + '• '
    const next = current.slice(0, start) + insertion + current.slice(end)
    update(i, next)
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
    const el = textareaRefs.current[i]
    const current = items[i] || ''
    const start = el?.selectionStart ?? current.length
    const end = el?.selectionEnd ?? current.length
    const selected = current.slice(start, end)
    const wrapped = `**${selected}**`
    const next = current.slice(0, start) + wrapped + current.slice(end)
    update(i, next)
    const cursorPos = selected ? start + wrapped.length : start + 2
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(cursorPos, cursorPos)
    })
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, margin: 0 }}>Key Achievements</h2>
        <p style={{ fontSize: 13, color: GRAY, margin: '4px 0 0' }}>Highlight your top accomplishments — awards, metrics, milestones or impact statements</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
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
                ref={(el) => { textareaRefs.current[i] = el }}
                className="resume-achievement-textarea"
                value={item}
                onChange={(e) => update(i, e.target.value)}
                placeholder={`e.g. Increased sales by 30% in Q2 2023\n\nUse "Add bullet point" to list multiple achievements, e.g.\n• Increased sales by 30% in Q2 2023\n• Led a team of 5 engineers to ship the feature 2 weeks early`}
                rows={5}
                style={{ ...inp, width: '100%', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5, scrollbarWidth: 'thin', scrollbarColor: `${ORANGE} #f3f4f6` }}
              />
            </div>
            <button type="button" onClick={() => remove(i)} style={{ flexShrink: 0, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <Trash2 size={14} color="#ef4444" />
            </button>
          </div>
        ))}
      </div>

      <button type="button" onClick={add} style={{ fontSize: 13, fontWeight: 600, color: ORANGE, background: '#fff7ed', border: `1.5px dashed ${ORANGE}60`, borderRadius: 8, padding: '9px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 28 }}>
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

      {/* Thin, rounded scrollbar for the achievement textarea (webkit browsers —
          Firefox is handled via the inline scrollbarWidth/scrollbarColor style). */}
      <style>{`
        .resume-achievement-textarea::-webkit-scrollbar { width: 8px; }
        .resume-achievement-textarea::-webkit-scrollbar-track { background: #f3f4f6; border-radius: 8px; }
        .resume-achievement-textarea::-webkit-scrollbar-thumb { background: ${ORANGE}; border-radius: 8px; }
        .resume-achievement-textarea::-webkit-scrollbar-thumb:hover { background: #ea580c; }
      `}</style>
    </div>
  )
}

export default Step3Achievements
