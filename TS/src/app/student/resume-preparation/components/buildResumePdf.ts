import jsPDF from 'jspdf'
import { ResumeData } from './ResumeData'
import { parseEntry, stripBoldMarkers } from './resumeEntryParser'

// A clean, single-column, real-text PDF — deliberately NOT a copy of the colorful
// multi-column on-screen template. The old "Download PDF" screenshotted the preview
// with html2canvas and embedded that as an image: it looked identical to the
// template, but had zero selectable/parseable text, so it failed real ATS systems
// and any other tool (like the resume-based interview's resume upload) that reads
// resume PDFs as text instead of pixels. jsPDF's own text API produces a real text
// layer instead — this is also the layout real ATS-focused guides recommend anyway,
// since multi-column layouts are notoriously unreliable for automated parsers even
// when they do have real text (column reading order gets scrambled).

const PAGE_WIDTH = 210 // A4 mm
const MARGIN = 16
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const PAGE_HEIGHT = 297

const INK = '#111827'
const MUTED = '#4b5563'
const ACCENT = '#2563eb'

export function buildResumePdf(data: ResumeData): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4')
  let y = MARGIN

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE_HEIGHT - MARGIN) {
      doc.addPage()
      y = MARGIN
    }
  }

  const writeParagraph = (text: string, opts: { size: number; color: string; bold?: boolean; lineHeight?: number }) => {
    const clean = stripBoldMarkers(text)
    if (!clean) return
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
    doc.setFontSize(opts.size)
    doc.setTextColor(opts.color)
    const lineHeight = opts.lineHeight ?? opts.size * 0.42
    const lines = doc.splitTextToSize(clean, CONTENT_WIDTH)
    for (const line of lines) {
      ensureSpace(lineHeight)
      doc.text(line, MARGIN, y)
      y += lineHeight
    }
  }

  const writeBullet = (text: string, indent: number, marker: string, opts: { size: number; color: string; lineHeight?: number }) => {
    const clean = stripBoldMarkers(text)
    if (!clean) return
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(opts.size)
    doc.setTextColor(opts.color)
    const lineHeight = opts.lineHeight ?? opts.size * 0.42
    const width = CONTENT_WIDTH - indent
    const lines = doc.splitTextToSize(clean, width)
    lines.forEach((line: string, i: number) => {
      ensureSpace(lineHeight)
      if (i === 0) doc.text(marker, MARGIN + indent - 4, y)
      doc.text(line, MARGIN + indent, y)
      y += lineHeight
    })
  }

  const sectionHeading = (title: string) => {
    ensureSpace(10)
    y += 3
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11.5)
    doc.setTextColor(ACCENT)
    doc.text(title.toUpperCase(), MARGIN, y)
    y += 1.5
    doc.setDrawColor(ACCENT)
    doc.setLineWidth(0.5)
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
    y += 5
  }

  const writeEntry = (text: string) => {
    const { heading, bullets } = parseEntry(text)
    heading.split('\n').filter(Boolean).forEach((line) => {
      writeBullet(line, 4, '•', { size: 10.5, color: INK })
    })
    bullets.forEach((b) => writeBullet(b, 9, '–', { size: 10, color: MUTED }))
    y += 2
  }

  const listSection = (title: string, entries?: string[]) => {
    if (!entries?.length) return
    sectionHeading(title)
    entries.forEach(writeEntry)
  }

  // ── Header ──
  const name = [data.fullName, data.surname].filter(Boolean).join(' ')
  const location = [data.city, data.country].filter(Boolean).join(', ')
  const contactLine = [data.email, data.phone, data.linkedin, data.portfolio, location].filter(Boolean).join('   |   ')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(INK)
  doc.text(name || 'Resume', MARGIN, y)
  y += 7

  if (data.role) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11.5)
    doc.setTextColor(ACCENT)
    doc.text(data.role, MARGIN, y)
    y += 6
  }
  if (contactLine) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(MUTED)
    const lines = doc.splitTextToSize(contactLine, CONTENT_WIDTH)
    lines.forEach((line: string) => { doc.text(line, MARGIN, y); y += 4.5 })
  }
  y += 2

  if (data.summary) {
    sectionHeading('Professional Summary')
    writeParagraph(data.summary, { size: 10.5, color: MUTED, lineHeight: 4.6 })
    y += 2
  }

  listSection('Work Experience', data.experience)
  listSection('Education', data.education)
  listSection('Projects', data.projects)
  listSection('Certifications', data.certifications)
  listSection('Key Achievements', data.achievements)

  if (data.skills?.length) {
    sectionHeading('Skills')
    writeParagraph(data.skills.join('  •  '), { size: 10.5, color: INK, lineHeight: 4.6 })
    y += 2
  }
  if (data.languages?.length) {
    sectionHeading('Languages')
    writeParagraph(data.languages.join('  •  '), { size: 10.5, color: INK, lineHeight: 4.6 })
    y += 2
  }
  if (data.hobbies?.length) {
    sectionHeading('Interests')
    writeParagraph(data.hobbies.join('  •  '), { size: 10.5, color: INK, lineHeight: 4.6 })
  }

  return doc
}
