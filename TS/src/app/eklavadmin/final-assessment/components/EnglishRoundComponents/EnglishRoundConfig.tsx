import React, { useState, useEffect, useRef } from 'react'
import { Spinner } from 'react-bootstrap'
import { FaTrash, FaUpload, FaPlus, FaBookOpen, FaSpellCheck, FaExchangeAlt, FaRandom, FaEnvelope, FaPen, FaCheckCircle, FaDownload } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''

// ── CSV Templates per section ─────────────────────────────────────────────────
const CSV_TEMPLATES: Record<string, string> = {
  reading_comprehension: [
    'section,passage,question,optionA,optionB,optionC,optionD,correctOptionKey,explanation,marks',
    '"reading_comprehension","Artificial Intelligence is transforming industries by automating repetitive tasks and improving decision-making. Companies are increasingly adopting AI to enhance productivity and customer satisfaction.","What is the main idea of the passage?","AI is replacing all jobs","AI is transforming industries through automation","AI is only used in tech","AI reduces productivity","B","The passage states AI transforms industries",2',
    '"reading_comprehension","","Why are companies adopting AI?","To reduce salaries","To enhance productivity and satisfaction","To avoid teamwork","To slow down production","B","Paragraph explicitly states companies adopt AI to enhance productivity",2',
    '"reading_comprehension","","What does \'enhance\' mean in the passage?","Reduce","Damage","Improve","Ignore","C","Enhance means to improve or increase quality",1',
  ].join('\n'),

  verbal_ability: [
    'section,passage,question,optionA,optionB,optionC,optionD,correctOptionKey,explanation,marks',
    '"verbal_ability","","Choose the synonym of \'Abundant\'","Scarce","Plenty","Weak","Rare","B","Abundant means plentiful or in large quantity",1',
    '"verbal_ability","","Choose the antonym of \'Expand\'","Grow","Increase","Contract","Improve","C","Contract is the opposite of Expand",1',
    '"verbal_ability","","Fill in the blank: The manager _____ the proposal before approving it.","reviewed","review","reviewing","reviews","A","Past tense is needed here",1',
    '"verbal_ability","","Choose the correctly spelled word:","Accomodation","Accommodation","Acomodation","Acommodation","B","Accommodation has double c and double m",1',
  ].join('\n'),

  sentence_correction: [
    'section,passage,question,optionA,optionB,optionC,optionD,correctOptionKey,explanation,marks',
    '"sentence_correction","","Identify the grammatically correct sentence:","She don\'t like coffee.","She doesn\'t likes coffee.","She doesn\'t like coffee.","She not like coffee.","C","Use \'doesn\'t\' with third person singular + base verb",2',
    '"sentence_correction","","Identify the correct sentence:","He go to school everyday.","He goes to school everyday.","He going to school everyday.","He gone to school everyday.","B","Third person singular takes \'goes\'",2',
    '"sentence_correction","","Choose the correct sentence:","They was playing cricket.","They were playing cricket.","They is playing cricket.","They are plays cricket.","B","\'They\' takes \'were\' in past tense",2',
  ].join('\n'),

  error_detection: [
    'section,passage,question,optionA,optionB,optionC,optionD,correctOptionKey,explanation,marks',
    '"error_detection","","Find the error: Neither the manager nor the employees (A) was (B) present (C) at the meeting (D).","Neither","was","present","No Error","B","\'Neither...nor\' with plural noun takes plural verb \'were\'",2',
    '"error_detection","","Find the error: Each of the students (A) have (B) submitted (C) their assignment (D).","Each of","have","submitted","assignment","B","\'Each\' is singular and takes \'has\'",2',
    '"error_detection","","Find the error: He is one of those students (A) who works (B) very hard (C) every day (D).","students","works","very hard","every day","B","\'Who\' refers to \'students\' (plural) so use \'work\'",2',
  ].join('\n'),

  para_jumbles: [
    'section,passage,question,optionA,optionB,optionC,optionD,correctOptionKey,explanation,marks',
    '"para_jumbles","","Arrange: (P) He entered the room. (Q) Everyone greeted him. (R) The meeting had already started. (S) He apologized for being late.","P-Q-R-S","P-R-S-Q","R-P-S-Q","Q-P-R-S","C","Logical order: meeting started → he entered → apologized → greeted",2',
    '"para_jumbles","","Arrange: (P) She opened the letter. (Q) She was shocked to read it. (R) The postman delivered a letter. (S) It contained bad news.","R-P-Q-S","P-R-Q-S","R-P-S-Q","S-P-R-Q","C","Logical order: postman delivers → she opens → bad news → shocked",2',
  ].join('\n'),
}

// Combined master template (all 5 MCQ sections in one CSV)
const MASTER_TEMPLATE = [
  'section,passage,question,optionA,optionB,optionC,optionD,correctOptionKey,explanation,marks',
  '# ── READING COMPREHENSION (passage on first row only; leave blank for follow-up questions) ──',
  '"reading_comprehension","Artificial Intelligence is transforming industries by automating repetitive tasks and improving decision-making. Companies are increasingly adopting AI to enhance productivity and customer satisfaction.","What is the main idea of the passage?","AI is replacing all jobs","AI is transforming industries through automation","AI is only used in tech","AI reduces productivity","B","The passage states AI transforms industries",2',
  '"reading_comprehension","","Why are companies adopting AI?","To reduce salaries","To enhance productivity and satisfaction","To avoid teamwork","To slow down production","B","Paragraph explicitly states companies adopt AI to enhance productivity",2',
  '"reading_comprehension","","What does \'enhance\' mean in the passage?","Reduce","Damage","Improve","Ignore","C","Enhance means to improve or increase quality",1',
  '# ── VERBAL ABILITY ──',
  '"verbal_ability","","Choose the synonym of \'Abundant\'","Scarce","Plenty","Weak","Rare","B","Abundant means plentiful or in large quantity",1',
  '"verbal_ability","","Choose the antonym of \'Expand\'","Grow","Increase","Contract","Improve","C","Contract is the opposite of Expand",1',
  '"verbal_ability","","Fill in the blank: The manager _____ the proposal before approving it.","reviewed","review","reviewing","reviews","A","Past tense is needed here",1',
  '# ── SENTENCE CORRECTION ──',
  '"sentence_correction","","Identify the grammatically correct sentence:","She don\'t like coffee.","She doesn\'t likes coffee.","She doesn\'t like coffee.","She not like coffee.","C","Use doesn\'t with third person singular + base verb",2',
  '"sentence_correction","","Identify the correct sentence:","He go to school everyday.","He goes to school everyday.","He going to school everyday.","He gone to school everyday.","B","Third person singular takes goes",2',
  '# ── ERROR DETECTION ──',
  '"error_detection","","Find the error: Neither the manager nor the employees (A) was (B) present (C) at the meeting (D).","Neither","was","present","No Error","B","Neither...nor with plural noun takes plural verb were",2',
  '"error_detection","","Find the error: Each of the students (A) have (B) submitted (C) their assignment (D).","Each of","have","submitted","assignment","B","Each is singular and takes has",2',
  '# ── PARA JUMBLES ──',
  '"para_jumbles","","Arrange: (P) He entered the room. (Q) Everyone greeted him. (R) The meeting had already started. (S) He apologized for being late.","P-Q-R-S","P-R-S-Q","R-P-S-Q","Q-P-R-S","C","Logical order: meeting started — he entered — apologized — greeted",2',
  '"para_jumbles","","Arrange: (P) She opened the letter. (Q) She was shocked. (R) The postman delivered a letter. (S) It contained bad news.","R-P-Q-S","P-R-Q-S","R-P-S-Q","S-P-R-Q","C","Logical order: postman delivers — she opens — bad news — shocked",2',
].join('\n')

function downloadCSV(section: string, _label: string) {
  const content = section === 'all' ? MASTER_TEMPLATE : CSV_TEMPLATES[section]
  if (!content) return
  const blob = new Blob([content], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = section === 'all' ? 'english_all_sections_template.csv' : `template_${section}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

type Section =
  | 'reading_comprehension'
  | 'verbal_ability'
  | 'sentence_correction'
  | 'error_detection'
  | 'para_jumbles'
  | 'email_writing'
  | 'essay_writing'

const SECTIONS: { key: Section; label: string; icon: React.ReactNode; color: string; isMCQ: boolean; desc: string }[] = [
  { key: 'reading_comprehension', label: 'Reading Comprehension', icon: <FaBookOpen />, color: '#3b82f6', isMCQ: true,  desc: 'Passage-based MCQ questions' },
  { key: 'verbal_ability',        label: 'Verbal Ability',        icon: <FaSpellCheck />, color: '#8b5cf6', isMCQ: true,  desc: 'Synonyms, Antonyms, Fill-in-the-blank' },
  { key: 'sentence_correction',   label: 'Sentence Correction',   icon: <FaCheckCircle />, color: '#22c55e', isMCQ: true,  desc: 'Identify the grammatically correct sentence' },
  { key: 'error_detection',       label: 'Error Detection',       icon: <FaExchangeAlt />, color: '#f59e0b', isMCQ: true,  desc: 'Find the error in a sentence' },
  { key: 'para_jumbles',          label: 'Para Jumbles',          icon: <FaRandom />, color: '#ef4444', isMCQ: true,  desc: 'Rearrangement / sentence ordering (MCQ)' },
  { key: 'email_writing',         label: 'Email Writing',         icon: <FaEnvelope />, color: '#06b6d4', isMCQ: false, desc: 'Business email scenario prompt' },
  { key: 'essay_writing',         label: 'Essay Writing',         icon: <FaPen />, color: '#ec4899', isMCQ: false, desc: 'Essay topic with AI evaluation' },
]

const EVAL_CRITERIA_OPTIONS = ['Grammar', 'Vocabulary', 'Clarity', 'Structure', 'Professional Tone', 'Relevance', 'Conclusion']

interface EnglishQuestion {
  _id: string
  section: Section
  passage?: string
  question: string
  optionA?: string
  optionB?: string
  optionC?: string
  optionD?: string
  correctOptionKey?: string
  explanation?: string
  prompt?: string
  evaluationCriteria?: string[]
  maxWords?: number
  marks: number
}

interface Props {
  defaultExamId?: string
  readOnly?: boolean
}

export default function EnglishRoundConfig({ defaultExamId, readOnly }: Props) {
  const { user } = useAuthContext()
  const headers = { Authorization: `Bearer ${user?.token}` }

  const [activeSection, setActiveSection] = useState<Section>('reading_comprehension')
  const [questions, setQuestions] = useState<EnglishQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // CSV upload state
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Writing prompt form
  const [promptForm, setPromptForm] = useState({
    question: '', prompt: '', maxWords: 300, marks: 15,
    evaluationCriteria: ['Grammar', 'Vocabulary', 'Clarity'],
  })
  const [savingPrompt, setSavingPrompt] = useState(false)
  const [promptMsg, setPromptMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const examId = defaultExamId
  const sectionInfo = SECTIONS.find(s => s.key === activeSection)!
  const sectionQuestions = questions.filter(q => q.section === activeSection)

  const fetchQuestions = async () => {
    if (!examId) return
    setLoading(true)
    try {
      const res = await fetch(`${baseURL}/api/assessment/admin/exam/${examId}/english-questions`, { headers })
      const data = await res.json()
      if (data.success) setQuestions(data.questions || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchQuestions() }, [examId])

  // ── Shared CSV parser + uploader ───────────────────────────────────────────
  const parseAndUpload = async (text: string, fallbackSection: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    const csvHeaders = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
    const parsed: any[] = []
    const lastPassageBySection: Record<string, string> = {}
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].startsWith('#')) continue
      const vals = lines[i].match(/(".*?"|[^,]+)(?=,|$)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || lines[i].split(',').map(v => v.trim())
      const row: any = {}
      csvHeaders.forEach((h, idx) => { row[h] = vals[idx] || '' })
      if (!row.question) continue
      const rowSection = row.section || fallbackSection
      if (row.passage && row.passage.trim()) lastPassageBySection[rowSection] = row.passage.trim()
      parsed.push({
        section: rowSection,
        passage: lastPassageBySection[rowSection] || '',
        question: row.question,
        optionA: row.optiona || row.optionA || '',
        optionB: row.optionb || row.optionB || '',
        optionC: row.optionc || row.optionC || '',
        optionD: row.optiond || row.optionD || '',
        correctOptionKey: (row.correctoptionkey || row.correctOptionKey || '').toUpperCase(),
        explanation: row.explanation || '',
        marks: Number(row.marks) || 1,
      })
    }
    if (!parsed.length) {
      setUploadMsg({ type: 'error', text: 'No valid questions found in CSV.' })
      return
    }
    const res = await fetch(`${baseURL}/api/assessment/admin/exam/${examId}/english-questions/bulk`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: parsed }),
    })
    const data = await res.json()
    if (data.success) {
      // Count per section
      const counts: Record<string, number> = {}
      parsed.forEach(q => { counts[q.section] = (counts[q.section] || 0) + 1 })
      const summary = Object.entries(counts).map(([s, n]) => `${s.replace(/_/g, ' ')}: ${n}`).join(', ')
      setUploadMsg({ type: 'success', text: `✅ Uploaded ${data.inserted} questions (${summary})` })
      fetchQuestions()
    } else {
      setUploadMsg({ type: 'error', text: data.message || 'Upload failed.' })
    }
  }

  // Master upload (all sections in one CSV)
  const handleMasterUpload = async (file: File) => {
    if (!examId) return
    setUploading(true)
    setUploadMsg(null)
    try {
      await parseAndUpload(await file.text(), activeSection)
    } catch (e: any) {
      setUploadMsg({ type: 'error', text: e.message || 'Upload error.' })
    }
    setUploading(false)
  }

  // ── CSV Upload (section tab) ────────────────────────────────────────────────
  const handleCSVUpload = async () => {
    if (!csvFile || !examId) return
    setUploading(true)
    setUploadMsg(null)
    try {
      await parseAndUpload(await csvFile.text(), activeSection)
      setCsvFile(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (e: any) {
      setUploadMsg({ type: 'error', text: e.message || 'Upload error.' })
    }
    setUploading(false)
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this question?')) return
    setDeletingId(id)
    try {
      await fetch(`${baseURL}/api/assessment/admin/english-questions/${id}`, { method: 'DELETE', headers })
      setQuestions(q => q.filter(x => x._id !== id))
    } catch {}
    setDeletingId(null)
  }

  // ── Save Writing Prompt ─────────────────────────────────────────────────────
  const handleSavePrompt = async () => {
    if (!examId || !promptForm.question.trim()) return
    setSavingPrompt(true)
    setPromptMsg(null)
    try {
      const res = await fetch(`${baseURL}/api/assessment/admin/exam/${examId}/english-questions/prompt`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...promptForm, section: activeSection }),
      })
      const data = await res.json()
      if (data.success) {
        setPromptMsg({ type: 'success', text: '✅ Prompt saved successfully.' })
        setPromptForm({ question: '', prompt: '', maxWords: 300, marks: 15, evaluationCriteria: ['Grammar', 'Vocabulary', 'Clarity'] })
        fetchQuestions()
      } else {
        setPromptMsg({ type: 'error', text: data.message || 'Save failed.' })
      }
    } catch (e: any) {
      setPromptMsg({ type: 'error', text: e.message })
    }
    setSavingPrompt(false)
  }

  const toggleCriteria = (c: string) => {
    setPromptForm(f => ({
      ...f,
      evaluationCriteria: f.evaluationCriteria.includes(c)
        ? f.evaluationCriteria.filter(x => x !== c)
        : [...f.evaluationCriteria, c],
    }))
  }

  const inputStyle: React.CSSProperties = {
    background: '#0d0d0d', border: '1px solid #222', borderRadius: 8,
    color: '#fff', padding: '8px 12px', fontSize: '0.85rem', width: '100%', outline: 'none',
  }

  if (readOnly) {
    return (
      <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid #ef444430', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
        🔒 Exam is in progress — editing is disabled.
      </div>
    )
  }

  return (
    <div style={{ color: '#f0f0f0', fontFamily: 'inherit' }}>

      {/* ── Master Upload Banner ── */}
      <div style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(59,130,246,0.08))', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f0f0f0', marginBottom: 3 }}>
            Upload All Sections at Once
          </div>
          <div style={{ fontSize: '0.76rem', color: '#777', lineHeight: 1.5 }}>
            Use a single CSV with a <code style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '0 4px', borderRadius: 3 }}>section</code> column to upload questions for multiple sections in one go. Reading Comprehension passage only needs to be written once per paragraph.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => downloadCSV('all', 'all')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.35)', color: '#22c55e', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
          >
            <FaDownload style={{ fontSize: '0.75rem' }} /> Download Master Template
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 8, background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.35)', color: '#a855f7', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
            <FaUpload style={{ fontSize: '0.75rem' }} /> Upload Master CSV
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={e => {
              const f = e.target.files?.[0]
              if (f) handleMasterUpload(f)
              e.target.value = ''
            }} />
          </label>
        </div>
      </div>

      {uploadMsg && (
        <div style={{ marginBottom: 14, padding: '8px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, background: uploadMsg.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', color: uploadMsg.type === 'success' ? '#22c55e' : '#ef4444', border: `1px solid ${uploadMsg.type === 'success' ? '#22c55e30' : '#ef444430'}` }}>
          {uploadMsg.text}
        </div>
      )}

      {/* ── Section Nav ── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {SECTIONS.map(s => {
          const count = questions.filter(q => q.section === s.key).length
          const active = activeSection === s.key
          return (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                background: active ? `${s.color}18` : '#0d0d0d',
                border: `1.5px solid ${active ? s.color : '#1f1f1f'}`,
                borderRadius: 20, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
                color: active ? s.color : '#555', transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: '0.75rem' }}>{s.icon}</span>
              {s.label}
              {count > 0 && (
                <span style={{ background: active ? s.color : '#1f1f1f', color: active ? '#fff' : '#555', fontSize: '0.7rem', fontWeight: 800, borderRadius: 10, padding: '1px 7px', minWidth: 20, textAlign: 'center' }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Section header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '12px 16px', background: `${sectionInfo.color}10`, border: `1px solid ${sectionInfo.color}30`, borderRadius: 10 }}>
        <span style={{ color: sectionInfo.color, fontSize: '1rem' }}>{sectionInfo.icon}</span>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f0f0f0' }}>{sectionInfo.label}</div>
          <div style={{ fontSize: '0.75rem', color: '#666', marginTop: 2 }}>{sectionInfo.desc}</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: sectionInfo.color, fontWeight: 700 }}>
          {sectionQuestions.length} question{sectionQuestions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ════ MCQ SECTIONS ════ */}
      {sectionInfo.isMCQ && (
        <>
          {/* CSV Upload box */}
          <div style={{ background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#888' }}>Upload Questions via CSV</div>
              {CSV_TEMPLATES[activeSection] && (
                <button
                  type="button"
                  onClick={() => downloadCSV(activeSection, sectionInfo.label)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', borderRadius: 7,
                    background: 'rgba(34,197,94,0.08)',
                    border: '1px solid rgba(34,197,94,0.3)',
                    color: '#22c55e', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  <FaDownload style={{ fontSize: '0.7rem' }} /> Download Template
                </button>
              )}
            </div>

            {/* Column guide */}
            <div style={{ fontSize: '0.73rem', color: '#444', marginBottom: 12, background: '#0d0d0d', borderRadius: 6, padding: '8px 12px', lineHeight: 2, border: '1px solid #1a1a1a' }}>
              <strong style={{ color: '#555', display: 'block', marginBottom: 4 }}>Required CSV columns:</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 0' }}>
                {(['section', ...(activeSection === 'reading_comprehension' ? ['passage'] : []), 'question', 'optionA', 'optionB', 'optionC', 'optionD', 'correctOptionKey', 'explanation', 'marks']).map((col, i, arr) => (
                  <span key={col}>
                    <code style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.08)', padding: '1px 5px', borderRadius: 4 }}>{col}</code>
                    {i < arr.length - 1 && <span style={{ color: '#333', margin: '0 3px' }}>,</span>}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: 6, color: '#333', fontSize: '0.7rem' }}>
                💡 <strong style={{ color: '#444' }}>correctOptionKey</strong>: A, B, C, or D &nbsp;|&nbsp;
                {activeSection === 'reading_comprehension' && <><strong style={{ color: '#444' }}>passage</strong>: write once on first row, leave blank for following questions of same paragraph &nbsp;|&nbsp;</>}
                <strong style={{ color: '#444' }}>marks</strong>: number (e.g. 1 or 2)
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={e => setCsvFile(e.target.files?.[0] || null)}
                style={{ ...inputStyle, flex: 1, minWidth: 200, padding: '6px 10px', cursor: 'pointer' }}
              />
              <button
                onClick={handleCSVUpload}
                disabled={!csvFile || uploading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px',
                  background: !csvFile || uploading ? '#1a1a1a' : sectionInfo.color,
                  border: 'none', borderRadius: 8, cursor: !csvFile || uploading ? 'not-allowed' : 'pointer',
                  color: !csvFile || uploading ? '#444' : '#fff', fontWeight: 700, fontSize: '0.83rem',
                }}
              >
                {uploading ? <Spinner size="sm" animation="border" /> : <FaUpload />}
                {uploading ? 'Uploading…' : 'Upload CSV'}
              </button>
            </div>

          </div>

          {/* Questions list */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#444' }}><Spinner animation="border" size="sm" /> Loading…</div>
          ) : sectionQuestions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#333', fontSize: '0.85rem' }}>No questions uploaded yet for this section.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sectionQuestions.map((q, i) => (
                <div key={q._id} style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 10, padding: '12px 14px', position: 'relative' }}>
                  {q.passage && (
                    <div style={{ fontSize: '0.75rem', color: '#555', marginBottom: 6, padding: '6px 10px', background: '#111', borderRadius: 6, borderLeft: `3px solid ${sectionInfo.color}` }}>
                      <strong style={{ color: '#666' }}>Passage:</strong> {q.passage.slice(0, 120)}{q.passage.length > 120 ? '…' : ''}
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.82rem', color: '#e0e0e0', marginBottom: 6 }}>
                        <span style={{ color: '#444', marginRight: 6, fontSize: '0.75rem' }}>Q{i + 1}.</span>{q.question}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {(['A', 'B', 'C', 'D'] as const).map(k => {
                          const text = q[`option${k}` as keyof EnglishQuestion] as string
                          if (!text) return null
                          const isCorrect = q.correctOptionKey === k
                          return (
                            <span key={k} style={{ fontSize: '0.74rem', padding: '2px 8px', borderRadius: 5, background: isCorrect ? 'rgba(34,197,94,0.12)' : '#111', color: isCorrect ? '#22c55e' : '#555', border: `1px solid ${isCorrect ? '#22c55e40' : '#1a1a1a'}`, fontWeight: isCorrect ? 700 : 400 }}>
                              {k}. {text}
                            </span>
                          )
                        })}
                        <span style={{ fontSize: '0.72rem', color: '#3b82f6', marginLeft: 'auto' }}>{q.marks} mk</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(q._id)}
                      disabled={deletingId === q._id}
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef444430', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#ef4444', flexShrink: 0 }}
                    >
                      {deletingId === q._id ? <Spinner size="sm" animation="border" /> : <FaTrash style={{ fontSize: '0.7rem' }} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ════ WRITING SECTIONS ════ */}
      {!sectionInfo.isMCQ && (
        <>
          {/* Example prompt card */}
          <div style={{ background: '#0a0a0a', border: `1px solid ${sectionInfo.color}25`, borderRadius: 10, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 }}>Example</div>
            {activeSection === 'email_writing' ? (
              <div style={{ fontSize: '0.8rem', color: '#888', lineHeight: 1.8 }}>
                <div style={{ color: '#bbb', fontWeight: 700, marginBottom: 4 }}>Title:</div>
                <div style={{ marginBottom: 8, color: '#ccc' }}>Write a professional email to HR requesting a reschedule of your interview.</div>
                <div style={{ color: '#bbb', fontWeight: 700, marginBottom: 4 }}>Scenario:</div>
                <div style={{ marginBottom: 8, color: '#888' }}>You had an interview scheduled for Monday but due to a medical emergency you need to reschedule. Write a formal email to hr@company.com explaining the situation politely.</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Grammar', 'Professional Tone', 'Clarity', 'Structure'].map(c => (
                    <span key={c} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 10, background: `${sectionInfo.color}10`, color: sectionInfo.color, border: `1px solid ${sectionInfo.color}30` }}>{c}</span>
                  ))}
                  <span style={{ fontSize: '0.7rem', color: '#555', marginLeft: 'auto' }}>Max 200 words · 15 marks</span>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: '#888', lineHeight: 1.8 }}>
                <div style={{ color: '#bbb', fontWeight: 700, marginBottom: 4 }}>Topic:</div>
                <div style={{ marginBottom: 8, color: '#ccc' }}>Impact of Artificial Intelligence on Future Jobs</div>
                <div style={{ color: '#bbb', fontWeight: 700, marginBottom: 4 }}>Instructions:</div>
                <div style={{ marginBottom: 8, color: '#888' }}>Write a well-structured essay discussing how AI is changing the job market. Include both positive and negative impacts and conclude with your perspective.</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['Grammar', 'Vocabulary', 'Relevance', 'Conclusion'].map(c => (
                    <span key={c} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 10, background: `${sectionInfo.color}10`, color: sectionInfo.color, border: `1px solid ${sectionInfo.color}30` }}>{c}</span>
                  ))}
                  <span style={{ fontSize: '0.7rem', color: '#555', marginLeft: 'auto' }}>Max 400 words · 15 marks</span>
                </div>
              </div>
            )}
          </div>

          {/* Add prompt form */}
          <div style={{ background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#888', marginBottom: 12 }}>
              <FaPlus style={{ marginRight: 6 }} />Add Writing Prompt
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#555', marginBottom: 4, display: 'block' }}>Title / Question *</label>
                <input
                  value={promptForm.question}
                  onChange={e => setPromptForm(f => ({ ...f, question: e.target.value }))}
                  placeholder={activeSection === 'email_writing' ? 'e.g. Write an email to HR requesting interview reschedule' : 'e.g. Impact of Artificial Intelligence on Future Jobs'}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#555', marginBottom: 4, display: 'block' }}>
                  {activeSection === 'email_writing' ? 'Scenario Description' : 'Topic Details / Instructions'}
                </label>
                <textarea
                  value={promptForm.prompt}
                  onChange={e => setPromptForm(f => ({ ...f, prompt: e.target.value }))}
                  rows={3}
                  placeholder="Additional context or instructions for the student..."
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: '#555', marginBottom: 4, display: 'block' }}>Max Words</label>
                  <input
                    type="number" min={50} max={2000}
                    value={promptForm.maxWords}
                    onChange={e => setPromptForm(f => ({ ...f, maxWords: Number(e.target.value) }))}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.75rem', color: '#555', marginBottom: 4, display: 'block' }}>Marks</label>
                  <input
                    type="number" min={1} max={100}
                    value={promptForm.marks}
                    onChange={e => setPromptForm(f => ({ ...f, marks: Number(e.target.value) }))}
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: '#555', marginBottom: 6, display: 'block' }}>Evaluation Criteria</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {EVAL_CRITERIA_OPTIONS.map(c => {
                    const selected = promptForm.evaluationCriteria.includes(c)
                    return (
                      <button
                        key={c} type="button" onClick={() => toggleCriteria(c)}
                        style={{
                          padding: '4px 12px', borderRadius: 16, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                          background: selected ? `${sectionInfo.color}18` : '#111',
                          border: `1.5px solid ${selected ? sectionInfo.color : '#1f1f1f'}`,
                          color: selected ? sectionInfo.color : '#444',
                        }}
                      >
                        {c}
                      </button>
                    )
                  })}
                </div>
              </div>

              <button
                onClick={handleSavePrompt}
                disabled={!promptForm.question.trim() || savingPrompt}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px 20px', background: !promptForm.question.trim() || savingPrompt ? '#1a1a1a' : sectionInfo.color,
                  border: 'none', borderRadius: 8, cursor: !promptForm.question.trim() || savingPrompt ? 'not-allowed' : 'pointer',
                  color: !promptForm.question.trim() || savingPrompt ? '#444' : '#fff', fontWeight: 700, fontSize: '0.85rem',
                }}
              >
                {savingPrompt ? <Spinner size="sm" animation="border" /> : <FaPlus />}
                {savingPrompt ? 'Saving…' : 'Save Prompt'}
              </button>

              {promptMsg && (
                <div style={{ padding: '7px 12px', borderRadius: 7, fontSize: '0.8rem', fontWeight: 600, background: promptMsg.type === 'success' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', color: promptMsg.type === 'success' ? '#22c55e' : '#ef4444', border: `1px solid ${promptMsg.type === 'success' ? '#22c55e30' : '#ef444430'}` }}>
                  {promptMsg.text}
                </div>
              )}
            </div>
          </div>

          {/* Writing prompts list */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#444' }}><Spinner animation="border" size="sm" /> Loading…</div>
          ) : sectionQuestions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#333', fontSize: '0.85rem' }}>No prompts added yet for this section.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sectionQuestions.map((q, i) => (
                <div key={q._id} style={{ background: '#0a0a0a', border: `1px solid ${sectionInfo.color}25`, borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f0f0f0', marginBottom: 4 }}>
                        <span style={{ color: '#444', marginRight: 6, fontSize: '0.75rem' }}>{i + 1}.</span>{q.question}
                      </div>
                      {q.prompt && (
                        <div style={{ fontSize: '0.76rem', color: '#666', marginBottom: 8, lineHeight: 1.6 }}>{q.prompt}</div>
                      )}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        {q.evaluationCriteria?.map(c => (
                          <span key={c} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 10, background: `${sectionInfo.color}10`, color: sectionInfo.color, border: `1px solid ${sectionInfo.color}30` }}>{c}</span>
                        ))}
                        <span style={{ fontSize: '0.72rem', color: '#555', marginLeft: 'auto' }}>Max {q.maxWords} words · {q.marks} marks</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(q._id)}
                      disabled={deletingId === q._id}
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef444430', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: '#ef4444', flexShrink: 0 }}
                    >
                      {deletingId === q._id ? <Spinner size="sm" animation="border" /> : <FaTrash style={{ fontSize: '0.7rem' }} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
