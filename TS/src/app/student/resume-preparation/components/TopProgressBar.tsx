import React from 'react'
import { FileText, PenLine, Eye, Check } from 'lucide-react'

const ORANGE = '#f97316'
const BORDER = '#e5e7eb'
const GRAY = '#6b7280'

export type ProgressStage = 0 | 1 | 2

const STEPS = [
  { label: 'Choose Template',    sub: 'Select a resume template', icon: <FileText size={14} /> },
  { label: 'Fill Your Details',  sub: 'Add your information',     icon: <PenLine size={14} /> },
  { label: 'Preview & Download', sub: 'Review and download',      icon: <Eye size={14} /> },
]

interface TopProgressBarProps {
  stage: ProgressStage
  templateLabel?: string
}

const TopProgressBar: React.FC<TopProgressBarProps> = ({ stage, templateLabel }) => {
  return (
    <div style={{ background: '#fff', borderBottom: `1px solid ${BORDER}`, padding: '0 32px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', alignItems: 'center', padding: '16px 0' }}>
        {STEPS.map((s, i) => {
          const isDone   = i < stage
          const isActive = i === stage
          const labelColor = isActive ? ORANGE : isDone ? '#374151' : '#9ca3af'
          const subColor   = isActive ? ORANGE : '#b0b8c4'
          const sub = i === 0 && templateLabel ? templateLabel : s.sub

          return (
            <React.Fragment key={i}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                {/* Circle */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: (isDone || isActive) ? ORANGE : '#fff',
                  border: (isDone || isActive) ? 'none' : '2px solid #d1d5db',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: (isDone || isActive) ? '#fff' : '#9ca3af',
                  fontSize: 13, fontWeight: 800, boxSizing: 'border-box',
                  boxShadow: (isDone || isActive) ? '0 2px 8px rgba(249,115,22,0.3)' : 'none',
                }}>
                  {isDone ? <Check size={14} /> : i + 1}
                </div>

                {/* Labels */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: labelColor, lineHeight: 1.3 }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: subColor, marginTop: 2, lineHeight: 1.3 }}>{sub}</div>
                </div>
              </div>

              {/* Arrow connector */}
              {i < STEPS.length - 1 && (
                <div style={{ flexShrink: 0, margin: '0 8px', color: i < stage ? ORANGE : '#d1d5db', fontSize: 18, lineHeight: 1 }}>→</div>
              )}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}

export default TopProgressBar
