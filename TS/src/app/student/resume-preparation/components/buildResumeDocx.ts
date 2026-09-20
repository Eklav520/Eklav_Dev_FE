import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } from 'docx'
import { ResumeData } from './ResumeData'

const ACCENT = '2563eb'
const MUTED = '6b7280'

// Same **bold** convention the resume templates parse at render time (see
// renderBoldText.tsx) — split on the markers and mark the matched runs bold.
function boldRuns(text: string): TextRun[] {
  if (!text) return [new TextRun('')]
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((p) => p !== '')
  return parts.map((part) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4
      ? new TextRun({ text: part.slice(2, -2), bold: true })
      : new TextRun({ text: part })
  )
}

// Same heading/"• " sub-bullet split used by BulletLines (renderBoldText.tsx), but
// producing Word paragraphs instead of React nodes — a leading non-bulleted line (or
// lines) becomes a plain paragraph, and each "• " line becomes its own bulleted
// paragraph so it renders as a real Word bullet list, not literal "•" characters.
function entryParagraphs(text: string): Paragraph[] {
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
  const paragraphs: Paragraph[] = []
  headingText.split('\n').filter(Boolean).forEach((line) => {
    paragraphs.push(new Paragraph({ children: boldRuns(line), spacing: { after: 40 } }))
  })
  subBullets.forEach((b) => {
    paragraphs.push(new Paragraph({ children: boldRuns(b), bullet: { level: 0 }, spacing: { after: 40 } }))
  })
  return paragraphs
}

function sectionHeading(title: string): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text: title.toUpperCase(), bold: true, color: ACCENT, size: 22 })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 4 } },
  })
}

function listSection(title: string, entries?: string[]): Paragraph[] {
  if (!entries?.length) return []
  return [sectionHeading(title), ...entries.flatMap(entryParagraphs)]
}

export async function buildResumeDocxBlob(data: ResumeData): Promise<Blob> {
  const name = [data.fullName, data.surname].filter(Boolean).join(' ')
  const location = [data.city, data.country].filter(Boolean).join(', ')
  const contactLine = [data.email, data.phone, data.linkedin, data.portfolio, location].filter(Boolean).join('   |   ')

  const children: Paragraph[] = [
    new Paragraph({ children: [new TextRun({ text: name || 'Resume', bold: true, size: 40 })], spacing: { after: 40 } }),
  ]

  if (data.role) {
    children.push(new Paragraph({ children: [new TextRun({ text: data.role, bold: true, color: ACCENT, size: 22 })], spacing: { after: 80 } }))
  }
  if (contactLine) {
    children.push(new Paragraph({ children: [new TextRun({ text: contactLine, color: MUTED, size: 18 })], spacing: { after: 160 } }))
  }

  if (data.summary) {
    children.push(sectionHeading('Professional Summary'))
    children.push(new Paragraph({ children: boldRuns(data.summary), spacing: { after: 80 } }))
  }

  children.push(...listSection('Work Experience', data.experience))
  children.push(...listSection('Education', data.education))
  children.push(...listSection('Projects', data.projects))
  children.push(...listSection('Certifications', data.certifications))
  children.push(...listSection('Key Achievements', data.achievements))

  if (data.skills?.length) {
    children.push(sectionHeading('Skills'))
    children.push(new Paragraph({ children: [new TextRun({ text: data.skills.join('  •  ') })], spacing: { after: 80 } }))
  }
  if (data.languages?.length) {
    children.push(sectionHeading('Languages'))
    children.push(new Paragraph({ children: [new TextRun({ text: data.languages.join('  •  ') })], spacing: { after: 80 } }))
  }
  if (data.hobbies?.length) {
    children.push(sectionHeading('Interests'))
    children.push(new Paragraph({ children: [new TextRun({ text: data.hobbies.join('  •  ') })], spacing: { after: 80 } }))
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  })

  return Packer.toBlob(doc)
}
