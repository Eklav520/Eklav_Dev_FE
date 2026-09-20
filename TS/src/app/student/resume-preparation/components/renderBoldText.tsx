import React from 'react'

// The 🌐 globe used for the Portfolio/Website contact line is a full-color emoji with
// very different glyph metrics than the plain text symbols (✉ ☏ 📍) used next to it,
// so it sits off the text baseline. This normalizes it into a fixed-size, centered box
// so it lines up with its neighbors regardless of font/glyph differences.
export function ContactIcon({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <span style={{ display: 'inline-block', width: 13, textAlign: 'center', verticalAlign: 'middle', fontSize: '0.9em', lineHeight: 1 }}>
      {children}
    </span>
  )
}

// Parses **bold** markdown-style markers (inserted via the "Bold" shortcut button in
// the resume-builder text fields) and returns React nodes with the marked portions
// wrapped in <strong>. Plain <textarea> fields can't show real bold while typing, so
// this is what actually turns "**REST API**" into bold text in the generated resume.
export function renderBoldText(text: string): React.ReactNode {
  if (!text || !text.includes('**')) return text
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4
      ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part
  )
}

// Renders one project/experience/etc. entry that may contain "• " sub-points added via
// the "Add bullet point" shortcut. A plain <span> with the raw text just showed the "•"
// character sitting inline in the paragraph flow with no marker of its own — this splits
// any leading non-bulleted line out as a heading, then gives each "• " line its own small
// indented marker, consistent regardless of which template's own outer entry-marker style
// (dot/arrow/diamond/bar) wraps around this component.
export function BulletLines({ text, fontSize = 11, textColor = '#374151', lineHeight = 1.7 }: {
  text: string
  fontSize?: number
  textColor?: string
  lineHeight?: number
}): React.ReactNode {
  const rawLines = (text || '').split('\n').map((l) => l.trim()).filter(Boolean)
  const heading: string[] = []
  const subBullets: string[] = []
  let inBullets = false
  for (const line of rawLines) {
    if (line.startsWith('•')) {
      inBullets = true
      subBullets.push(line.replace(/^•\s*/, ''))
    } else if (!inBullets) {
      heading.push(line)
    } else if (subBullets.length) {
      // Wrapped continuation of the previous bullet (no leading "•" of its own).
      subBullets[subBullets.length - 1] += ' ' + line
    } else {
      heading.push(line)
    }
  }
  // No heading line (student started straight with a bullet) — promote the first
  // bullet to the heading position so the entry isn't just a blank leading line.
  // Joined with '\n' (not a space) so line breaks the student typed before their first
  // bullet — e.g. a title line and a separate "Project: X" line — are preserved instead
  // of being flattened into one run-on sentence that then wraps awkwardly mid-phrase.
  const headingText = heading.length ? heading.join('\n') : subBullets.shift() || ''

  return (
    <>
      <span style={{ fontSize, color: textColor, lineHeight, whiteSpace: 'pre-wrap' }}>{renderBoldText(headingText)}</span>
      {subBullets.map((b, i) => (
        <div key={i} style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'flex-start' }}>
          <span style={{ color: '#9ca3af', fontSize: fontSize - 1, flexShrink: 0, lineHeight }}>–</span>
          <span style={{ fontSize, color: textColor, lineHeight }}>{renderBoldText(b)}</span>
        </div>
      ))}
    </>
  )
}
