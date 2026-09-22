// Shared by buildResumeDocx.ts and buildResumePdf.ts — splits one resume entry
// (a project, job, education line, etc.) into its heading line(s) and its "• "
// sub-bullets, the same convention BulletLines (renderBoldText.tsx) uses for the
// on-screen templates. Kept as plain data here since docx/pdf each render it
// through a different API (Paragraph vs. jsPDF text calls).
export interface ParsedEntry {
  heading: string
  bullets: string[]
}

export function parseEntry(text: string): ParsedEntry {
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
      subBullets[subBullets.length - 1] += ' ' + line
    } else {
      heading.push(line)
    }
  }
  const headingText = heading.length ? heading.join('\n') : subBullets.shift() || ''
  return { heading: headingText, bullets: subBullets }
}

// Strips the **bold** markdown markers down to plain text — used where the
// renderer can't cheaply mix bold/normal runs within a wrapped line (jsPDF).
export function stripBoldMarkers(text: string): string {
  return (text || '').replace(/\*\*([^*]+)\*\*/g, '$1')
}
