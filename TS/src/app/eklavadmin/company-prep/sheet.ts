import * as XLSX from 'xlsx'
import type { Level, QType } from './api'

/* Excel format for company exam questions (one row per question):
   Title (section) | Type | Question | Options | Correct Answer | Marks | Explanation
   (the exam's level is chosen in the form, not in the file)
   - MCQ:     Options = choices, one per line or separated by |  ·  Correct Answer = A/B/C/D (or the option text)
   - Fill:    Correct Answer = accepted answers separated by |
   - Coding:  Options = test inputs separated by ||  ·  Correct Answer = matching outputs separated by ||
              (the first test case is shown to students, the rest are hidden) */

export const SHEET_HEADERS = ['Title', 'Type', 'Question', 'Options', 'Correct Answer', 'Marks', 'Explanation']

export type SheetRow = {
  __row: number
  section: string; type: string; question: string; marks: number | string; explanation: string
  optionA?: string; optionB?: string; optionC?: string; optionD?: string; correctOption?: string
  answers?: string
  coding?: { testCases: { input: string; output: string; hidden: boolean }[] }
}
export type ParsedSheet = {
  rows: SheetRow[]
  level: Level | null
  sections: { name: string; count: number }[]
  byType: Record<string, number>
  problems: { row: number; message: string }[]
}

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '')
const ALIASES: Record<string, string[]> = {
  level: ['level', 'difficulty'],
  section: ['title', 'section', 'topic', 'category', 'sectiontitle'],
  type: ['type', 'questiontype', 'qtype'],
  question: ['question', 'questiontext', 'problem', 'statement'],
  options: ['options', 'choices', 'option'],
  correct: ['correctanswer', 'answer', 'correct', 'correctoption', 'answers'],
  marks: ['marks', 'mark', 'points', 'score'],
  explanation: ['explanation', 'solution', 'reason'],
  a: ['optiona', 'a'], b: ['optionb', 'b'], c: ['optionc', 'c'], d: ['optiond', 'd'],
}

const toType = (v: string): QType | '' => {
  const t = norm(v)
  if (!t || t === 'mcq' || t.startsWith('multiple') || t === 'choice' || t === 'objective') return 'mcq'
  if (t.startsWith('fill') || t === 'fib' || t.includes('blank')) return 'fill'
  if (t.startsWith('cod') || t.startsWith('program')) return 'coding'
  return ''
}
const toLevel = (v: string): Level | null => {
  const t = norm(v)
  if (t.startsWith('e')) return 'Easy'
  if (t.startsWith('m')) return 'Medium'
  if (t.startsWith('h') || t.startsWith('d')) return 'Hard'
  return null
}
const LETTERS = ['A', 'B', 'C', 'D'] as const

export const parseQuestionSheet = async (file: File): Promise<ParsedSheet> => {
  const wb = XLSX.read(await file.arrayBuffer())
  const raw = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets[wb.SheetNames[0]], { defval: '' })
  const rows: SheetRow[] = []
  const problems: ParsedSheet['problems'] = []
  const levels: Record<string, number> = {}

  raw.forEach((r, i) => {
    // map this row's headers onto our fields
    const cell: Record<string, string> = {}
    Object.entries(r).forEach(([k, v]) => {
      const key = Object.keys(ALIASES).find(f => ALIASES[f].includes(norm(k)))
      if (key && cell[key] === undefined) cell[key] = v == null ? '' : String(v).trim()
    })
    const question = cell.question || ''
    if (!question) return
    const rowNo = i + 2
    const type = toType(cell.type || '')
    if (!type) { problems.push({ row: rowNo, message: `Unknown type "${cell.type}" (use MCQ, Fill or Coding)` }); return }
    const lvl = toLevel(cell.level || '')
    if (lvl) levels[lvl] = (levels[lvl] || 0) + 1

    const out: SheetRow = { __row: rowNo, section: cell.section || '', type, question, marks: cell.marks || 1, explanation: cell.explanation || '' }
    const correct = cell.correct || ''

    if (type === 'mcq') {
      let opts = [cell.a, cell.b, cell.c, cell.d].filter(v => v !== undefined && v !== '') as string[]
      if (!opts.length) opts = (cell.options || '').split(/\r?\n|\|/).map(s => s.replace(/^\s*[A-Da-d][.)]\s*/, '').trim()).filter(Boolean)
      ;[out.optionA, out.optionB, out.optionC, out.optionD] = [opts[0] || '', opts[1] || '', opts[2] || '', opts[3] || '']
      const c = correct.replace(/^option\s*/i, '').trim()
      let letter = ''
      if (/^[A-Da-d]$/.test(c)) letter = c.toUpperCase()
      else if (/^[1-4]$/.test(c)) letter = LETTERS[Number(c) - 1]
      else { const idx = opts.findIndex(o => o.toLowerCase() === c.toLowerCase()); if (idx >= 0 && idx < 4) letter = LETTERS[idx] }
      out.correctOption = letter
      if (opts.length > 4) problems.push({ row: rowNo, message: 'Only the first 4 options are used' })
    } else if (type === 'fill') {
      out.answers = correct
    } else {
      const ins = (cell.options || '').split('||')
      const outs = correct.split('||')
      const n = Math.max(ins.length, outs.length)
      out.coding = {
        testCases: Array.from({ length: n }, (_, k) => ({ input: (ins[k] || '').trim(), output: (outs[k] || '').trim(), hidden: k > 0 }))
          .filter(t => t.input || t.output),
      }
    }
    rows.push(out)
  })

  const sectionMap = new Map<string, number>()
  rows.forEach(r => sectionMap.set(r.section || '(no title)', (sectionMap.get(r.section || '(no title)') || 0) + 1))
  const byType: Record<string, number> = {}
  rows.forEach(r => { byType[r.type] = (byType[r.type] || 0) + 1 })
  const level = (Object.entries(levels).sort((a, b) => b[1] - a[1])[0]?.[0] as Level) || null
  return { rows, level, sections: [...sectionMap].map(([name, count]) => ({ name, count })), byType, problems }
}

export const downloadQuestionTemplate = (fileName = 'Company exam - questions template.xlsx') => {
  const sample = [
    { Title: 'Aptitude', Type: 'MCQ', Question: 'What is 15% of 200?', Options: '20 | 30 | 40 | 15', 'Correct Answer': 'B', Marks: 1, Explanation: '15/100 × 200 = 30' },
    { Title: 'Aptitude', Type: 'MCQ', Question: 'A train covers 120 km in 2 hours. What is its speed?', Options: '50 km/h | 60 km/h | 70 km/h | 80 km/h', 'Correct Answer': '60 km/h', Marks: 1 },
    { Title: 'Verbal', Type: 'Fill', Question: 'The synonym of "rapid" is ____.', 'Correct Answer': 'fast | quick | swift', Marks: 1 },
    { Title: 'Coding', Type: 'Coding', Question: 'Read two integers and print their sum.', Options: '2 3 || -4 10 || 100 200', 'Correct Answer': '5 || 6 || 300', Marks: 10 },
  ]
  const ws = XLSX.utils.json_to_sheet(sample, { header: SHEET_HEADERS })
  ws['!cols'] = [{ wch: 16 }, { wch: 9 }, { wch: 52 }, { wch: 36 }, { wch: 22 }, { wch: 7 }, { wch: 30 }]
  const help = XLSX.utils.aoa_to_sheet([
    ['Column', 'How to fill it'],
    ['Title', 'Section name, e.g. Aptitude, Reasoning, Verbal, Technical, Coding. Questions are grouped by this'],
    ['Type', 'MCQ, Fill or Coding'],
    ['Question', 'For Fill, put ____ where the blank goes'],
    ['Options', 'MCQ: the choices, separated by | or one per line (max 4). Coding: test inputs separated by ||'],
    ['Correct Answer', 'MCQ: A, B, C, D (or the option text). Fill: accepted answers separated by |. Coding: expected outputs separated by ||'],
    ['Marks', 'Optional, default 1'],
    ['Explanation', 'Optional, shown to students after the exam'],
    ['', ''],
    ['Coding note', 'The first test case is shown to students as the example; the others are hidden and used for scoring'],
  ])
  help['!cols'] = [{ wch: 16 }, { wch: 110 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Questions')
  XLSX.utils.book_append_sheet(wb, help, 'How to fill')
  XLSX.writeFile(wb, fileName)
}
