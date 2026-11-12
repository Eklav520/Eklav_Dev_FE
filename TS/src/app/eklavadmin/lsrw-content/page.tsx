import { useEffect, useState } from 'react'
import { Modal } from 'react-bootstrap'
import { FaHeadphones, FaBook, FaTrash, FaUpload, FaLayerGroup, FaCog, FaSave, FaMicrophone, FaFont, FaPlus, FaRandom, FaImage, FaFileExcel, FaCheckCircle, FaSpinner, FaExclamationTriangle, FaSearch, FaFileAudio } from 'react-icons/fa'
import type { IconType } from 'react-icons'
import * as XLSX from 'xlsx'
import PageMetaData from '@/components/PageMetaData'
import { useAuthContext } from '@/context/useAuthContext'
import { AdminPage, PageHeader, Tabs, SearchInput, AdminSelect, EmptyState } from '@/components/admin-ui'

const PAGE_BG     = '#111315'
const CARD_BG     = '#17191c'
const PAGE_BORDER = '#2c3034'
const PAGE_TEXT   = '#eceef0'
const PAGE_GRAY   = '#9da2a8'
const ORANGE = '#ff7a00'
const BLUE   = '#60a5fa'
const PURPLE = '#a78bfa'
const GREEN  = '#45dd75'
const CYAN   = '#22d3ee'
const PINK   = '#f472b6'
const TEAL   = '#2dd4bf'

type Tab = 'reading' | 'listening' | 'speaking' | 'grammar' | 'jumbled' | 'storytelling' | 'passages'

type PassageQuestion = { question: string; options: string[]; correctAnswer: string; marks: number; timeLimit: number }

type Item = {
  _id: string
  type?: 'reading' | 'listening' | 'mcq' | 'fill'
  sentence?: string  // Reading / Listening
  topic?: string     // Speaking
  audioUrl?: string
  marks: number
  timeLimit: number
  isActive: boolean
  createdAt: string
  // Grammar fields
  category?: string
  question?: string
  options?: string[]
  correctAnswer?: string
  // Jumbled Sentences fields
  parts?: string[]
  // Story Telling fields
  promptType?: 'image' | 'text'
  imageUrl?: string
  promptText?: string
  points?: string[]
  // Passages fields — audioUrl above doubles as the passage audio
  questions?: PassageQuestion[]
}

type GrammarType = 'mcq' | 'fill'
type GrammarDraft = { type: GrammarType; category: string; question: string; options: string[]; correctAnswer: string }
type GrammarExcelItem = GrammarDraft & { marks?: number; timeLimit?: number }

type Section = { key: Tab; label: string; icon: IconType; color: string; hint: string }
const SECTIONS: Section[] = [
  { key: 'reading',      label: 'Reading',       icon: FaBook,       color: ORANGE, hint: 'Sentences for the reading round' },
  { key: 'listening',    label: 'Listening',     icon: FaHeadphones, color: BLUE,   hint: 'Audio clips, each paired with its transcript' },
  { key: 'speaking',     label: 'Speaking',      icon: FaMicrophone, color: PURPLE, hint: 'Topics students speak about' },
  { key: 'grammar',      label: 'Grammar',       icon: FaFont,       color: GREEN,  hint: 'MCQ and fill-in-the-blank questions' },
  { key: 'jumbled',      label: 'Jumbled',       icon: FaRandom,     color: CYAN,   hint: 'Sentences split into parts to put back in order' },
  { key: 'storytelling', label: 'Story Telling', icon: FaImage,      color: PINK,   hint: 'Image or text prompts with points to cover' },
  { key: 'passages',     label: 'Passages',      icon: FaFileAudio,  color: TEAL,   hint: 'One audio passage with its own MCQ questions' },
]

const TIME_LIMIT_OPTIONS = [15, 30, 45, 60, 90]
const SPEAKING_TIME_OPTIONS = [30, 45, 60, 90, 120, 180]
const GRAMMAR_CATEGORIES = ['Verbs/Tenses', 'Articles', 'Prepositions', 'Active/Passive Voice', 'Direct/Indirect Speech', 'Sentence Correction', 'Other']

const LSRWContentAdmin = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const authHeader = { Authorization: `Bearer ${user?.token}` }

  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('reading')

  // ── Round settings — how many random items a student gets per attempt ──
  const [readingCount, setReadingCount] = useState(5)
  const [listeningCount, setListeningCount] = useState(5)
  const [speakingCount, setSpeakingCount] = useState(5)
  const [grammarCount, setGrammarCount] = useState(10)
  const [jumbledCount, setJumbledCount] = useState(5)
  const [storyCount, setStoryCount] = useState(5)
  const [passageCount, setPassageCount] = useState(2)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsSaved, setSettingsSaved] = useState(false)

  // ── Reading form — Single Upload (one item) vs Bulk Upload (paste or Excel) ──
  const [readingSubTab, setReadingSubTab] = useState<'single' | 'bulk'>('single')
  const [singleSentence, setSingleSentence] = useState('')
  const [singleMarks, setSingleMarks] = useState(5)
  const [singleTimeLimit, setSingleTimeLimit] = useState(30)
  const [bulkSentences, setBulkSentences] = useState('')
  const [excelLoadMsg, setExcelLoadMsg] = useState<string | null>(null)
  const [excelParsedItems, setExcelParsedItems] = useState<{ sentence: string; marks?: number; timeLimit?: number }[] | null>(null)

  // ── Bulk Listening form (each audio file paired with its own transcript) ──
  const [audioFiles, setAudioFiles] = useState<File[]>([])
  const [transcripts, setTranscripts] = useState<string[]>([])
  const [listeningMarks, setListeningMarks] = useState(5)
  const [listeningTimeLimit, setListeningTimeLimit] = useState(30)

  // ── Speaking form — Single Upload (one topic) vs Bulk Upload (Excel only) ──
  const [speakingSubTab, setSpeakingSubTab] = useState<'single' | 'bulk'>('single')
  const [singleTopic, setSingleTopic] = useState('')
  const [singleTopicMarks, setSingleTopicMarks] = useState(5)
  const [singleTopicTimeLimit, setSingleTopicTimeLimit] = useState(90)
  const [excelSpeakingItems, setExcelSpeakingItems] = useState<{ topic: string; marks?: number; timeLimit?: number }[] | null>(null)
  const [excelSpeakingMsg, setExcelSpeakingMsg] = useState<string | null>(null)

  // ── Bulk Grammar form — MCQ needs options + correct option, Fill just
  // needs the expected answer text; built up as a batch before submitting. ──
  const [grammarBatch, setGrammarBatch] = useState<GrammarDraft[]>([])
  const [draftType, setDraftType] = useState<GrammarType>('mcq')
  const [draftCategory, setDraftCategory] = useState(GRAMMAR_CATEGORIES[0])
  const [draftQuestion, setDraftQuestion] = useState('')
  const [draftOptions, setDraftOptions] = useState(['', '', '', ''])
  const [draftCorrectIdx, setDraftCorrectIdx] = useState<number | null>(null)
  const [draftFillAnswer, setDraftFillAnswer] = useState('')
  const [grammarMarks, setGrammarMarks] = useState(1)
  const [grammarTimeLimit, setGrammarTimeLimit] = useState(30)
  const [grammarSubTab, setGrammarSubTab] = useState<'manual' | 'bulk'>('manual')
  const [excelGrammarItems, setExcelGrammarItems] = useState<GrammarExcelItem[] | null>(null)
  const [excelGrammarMsg, setExcelGrammarMsg] = useState<string | null>(null)

  // ── Story Telling form — added one at a time since each prompt can carry
  // a real uploaded image; admin picks image OR text prompt, plus points. ──
  const [storyPromptType, setStoryPromptType] = useState<'image' | 'text'>('image')
  const [storyImageFile, setStoryImageFile] = useState<File | null>(null)
  const [storyImagePreview, setStoryImagePreview] = useState<string | null>(null)
  const [storyPromptText, setStoryPromptText] = useState('')
  const [storyPoints, setStoryPoints] = useState('')
  const [storyMarks, setStoryMarks] = useState(10)
  const [storyTimeLimit, setStoryTimeLimit] = useState(120)
  const [storySubTab, setStorySubTab] = useState<'single' | 'bulk'>('single')
  const [excelStoryItems, setExcelStoryItems] = useState<{ promptText: string; points: string[]; marks?: number; timeLimit?: number }[] | null>(null)
  const [excelStoryMsg, setExcelStoryMsg] = useState<string | null>(null)

  // ── Passages form — one audio clip + a batch of MCQ questions (each with
  // its own time limit), saved together as one passage. ──
  const [passageAudioFile, setPassageAudioFile] = useState<File | null>(null)
  const [passageAudioPreview, setPassageAudioPreview] = useState<string | null>(null)
  const [passageBatch, setPassageBatch] = useState<PassageQuestion[]>([])
  const [pDraftQuestion, setPDraftQuestion] = useState('')
  const [pDraftOptions, setPDraftOptions] = useState(['', '', '', ''])
  const [pDraftCorrectIdx, setPDraftCorrectIdx] = useState<number | null>(null)
  const [pDraftMarks, setPDraftMarks] = useState(1)
  const [pDraftTimeLimit, setPDraftTimeLimit] = useState(30)
  const [passageQSubTab, setPassageQSubTab] = useState<'manual' | 'bulk'>('manual')

  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'active' | 'inactive'>('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const endpointBase = tab === 'speaking' ? 'lsrw-speaking-content'
    : tab === 'grammar' ? 'lsrw-grammar-content'
    : tab === 'jumbled' ? 'lsrw-jumbled-content'
    : tab === 'storytelling' ? 'lsrw-storytelling-content'
    : tab === 'passages' ? 'lsrw-passage-content'
    : 'lsrw-content'

  const fetchItems = async () => {
    if (!user?.token) return
    setLoading(true)
    try {
      const url = tab === 'speaking' || tab === 'grammar' || tab === 'jumbled' || tab === 'storytelling' || tab === 'passages'
        ? `${baseURL}/api/eklavadmin/${endpointBase}`
        : `${baseURL}/api/eklavadmin/lsrw-content?type=${tab}`
      const res = await fetch(url, { headers: authHeader })
      const data = await res.json()
      if (data.success) setItems(data.items)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fetchSettings = async () => {
    if (!user?.token) return
    try {
      const res = await fetch(`${baseURL}/api/eklavadmin/lsrw-round-settings`, { headers: authHeader })
      const data = await res.json()
      if (data.success) {
        setReadingCount(data.settings.readingCount)
        setListeningCount(data.settings.listeningCount)
        setSpeakingCount(data.settings.speakingCount ?? 5)
        setGrammarCount(data.settings.grammarCount ?? 10)
        setJumbledCount(data.settings.jumbledCount ?? 5)
        setStoryCount(data.settings.storyCount ?? 5)
        setPassageCount(data.settings.passageCount ?? 2)
      }
    } catch (err) { console.error(err) }
  }

  useEffect(() => { fetchItems() }, [tab, user?.token]) // eslint-disable-line
  useEffect(() => { fetchSettings() }, [user?.token]) // eslint-disable-line

  const saveSettings = async () => {
    if (!user?.token) return
    setSavingSettings(true)
    setSettingsSaved(false)
    try {
      const res = await fetch(`${baseURL}/api/eklavadmin/lsrw-round-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ readingCount, listeningCount, speakingCount, grammarCount, jumbledCount, storyCount, passageCount }),
      })
      const data = await res.json()
      if (data.success) {
        setReadingCount(data.settings.readingCount)
        setListeningCount(data.settings.listeningCount)
        setSpeakingCount(data.settings.speakingCount)
        setGrammarCount(data.settings.grammarCount)
        setJumbledCount(data.settings.jumbledCount)
        setStoryCount(data.settings.storyCount)
        setPassageCount(data.settings.passageCount)
        setSettingsSaved(true)
        setTimeout(() => setSettingsSaved(false), 2000)
      }
    } catch (err) { console.error(err) }
    finally { setSavingSettings(false) }
  }

  const resetGrammarDraft = () => {
    setDraftQuestion('')
    setDraftOptions(['', '', '', ''])
    setDraftCorrectIdx(null)
    setDraftFillAnswer('')
  }

  const addToGrammarBatch = () => {
    setError(null)
    if (!draftQuestion.trim()) { setError('Enter the question text.'); return }
    if (draftType === 'mcq') {
      const filled = draftOptions.map((o) => o.trim())
      if (filled.filter(Boolean).length < 2) { setError('Add at least 2 options.'); return }
      if (draftCorrectIdx === null || !filled[draftCorrectIdx]) { setError('Select which option is correct.'); return }
      setGrammarBatch((prev) => [...prev, {
        type: 'mcq', category: draftCategory, question: draftQuestion.trim(),
        options: filled.filter(Boolean), correctAnswer: filled[draftCorrectIdx],
      }])
    } else {
      if (!draftFillAnswer.trim()) { setError('Enter the correct answer.'); return }
      setGrammarBatch((prev) => [...prev, {
        type: 'fill', category: draftCategory, question: draftQuestion.trim(),
        options: [], correctAnswer: draftFillAnswer.trim(),
      }])
    }
    resetGrammarDraft()
  }

  const removeFromGrammarBatch = (idx: number) => setGrammarBatch((prev) => prev.filter((_, i) => i !== idx))

  const downloadGrammarTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['Type (mcq/fill)', 'Category', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Marks', 'Time Limit'],
      ['mcq', 'Verbs/Tenses', 'The doctor and the lawyer are ________.', 'Siblings, plays', 'Siblings, play', 'Sibling, plays', 'Sibling, play', 'Siblings, play', 1, 30],
      ['fill', 'Prepositions', 'She is good ___ mathematics.', '', '', '', '', 'at', 1, 30],
    ])
    worksheet['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 40 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 8 }, { wch: 10 }]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Grammar')
    XLSX.writeFile(workbook, 'lsrw-grammar-template.xlsx')
  }

  const handleGrammarExcelUpload = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setError(null)
    setExcelGrammarMsg(null)
    setExcelGrammarItems(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<(string | number)[]>(firstSheet, { header: 1 })

        const items: GrammarExcelItem[] = rows
          .filter((row, i) => !(i === 0 && String(row?.[0] ?? '').trim().toLowerCase().startsWith('type')))
          .map((row) => {
            const type: GrammarType = String(row?.[0] ?? '').trim().toLowerCase() === 'fill' ? 'fill' : 'mcq'
            const options = [row?.[3], row?.[4], row?.[5], row?.[6]].map((o) => String(o ?? '').trim()).filter(Boolean)
            return {
              type,
              category: String(row?.[1] ?? '').trim() || 'Other',
              question: String(row?.[2] ?? '').trim(),
              options: type === 'mcq' ? options : [],
              correctAnswer: String(row?.[7] ?? '').trim(),
              marks: row?.[8] !== undefined && row?.[8] !== '' ? Number(row[8]) : undefined,
              timeLimit: row?.[9] !== undefined && row?.[9] !== '' ? Number(row[9]) : undefined,
            }
          })
          .filter((it) => it.question && it.correctAnswer && (it.type === 'fill' || (it.options.length >= 2 && it.options.includes(it.correctAnswer))))

        if (items.length === 0) {
          setError('No valid questions found. MCQ rows need at least 2 options and a Correct Answer that exactly matches one of them.')
          return
        }
        setExcelGrammarItems(items)
        setExcelGrammarMsg(`Loaded ${items.length} question${items.length === 1 ? '' : 's'} from Excel — review below, then click Add.`)
      } catch (err) {
        console.error(err)
        setError('Could not read that file — make sure it\'s a valid .xlsx/.xls/.csv file.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  // ── Jumbled Sentences form — Single Upload vs Bulk Upload (Excel only) ──
  const [jumbledSubTab, setJumbledSubTab] = useState<'single' | 'bulk'>('single')
  const [singleJumbled, setSingleJumbled] = useState('')
  const [singleJumbledMarks, setSingleJumbledMarks] = useState(5)
  const [singleJumbledTimeLimit, setSingleJumbledTimeLimit] = useState(60)
  const [excelJumbledItems, setExcelJumbledItems] = useState<{ parts: string[]; marks?: number; timeLimit?: number }[] | null>(null)
  const [excelJumbledMsg, setExcelJumbledMsg] = useState<string | null>(null)

  const handleAudioFilesChange = (files: FileList | null) => {
    const arr = files ? Array.from(files) : []
    setAudioFiles(arr)
    setTranscripts(arr.map(() => ''))
  }

  // Reading bulk-upload via Excel — takes the first column of every row
  // (skipping an optional "Sentence" header) and drops it into the same
  // textarea used for pasted text, so the admin can review/edit before
  // hitting Add — nothing is submitted straight from the file.
  // Reads columns A/B/C = Sentence / Marks / Time Limit. Marks and Time Limit
  // are optional per row — a blank cell falls back to the form's uniform
  // Marks/Time Limit fields at submit time.
  const handleReadingExcelUpload = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setError(null)
    setExcelLoadMsg(null)
    setExcelParsedItems(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<(string | number)[]>(firstSheet, { header: 1 })

        const isHeaderRow = (row: (string | number)[]) => String(row?.[0] ?? '').trim().toLowerCase() === 'sentence'

        const items = rows
          .filter((row, i) => !(i === 0 && isHeaderRow(row)))
          .map((row) => ({
            sentence: String(row?.[0] ?? '').trim(),
            marks: row?.[1] !== undefined && row?.[1] !== '' ? Number(row[1]) : undefined,
            timeLimit: row?.[2] !== undefined && row?.[2] !== '' ? Number(row[2]) : undefined,
          }))
          .filter((it) => it.sentence)

        if (items.length === 0) {
          setError('No sentences found in that file — put one sentence per row in column A (Marks and Time Limit are optional, columns B and C).')
          return
        }
        setBulkSentences(items.map((it) => it.sentence).join('\n'))
        setExcelParsedItems(items)
        setExcelLoadMsg(`Loaded ${items.length} sentence${items.length === 1 ? '' : 's'} from Excel — review below, then click Add.`)
      } catch (err) {
        console.error(err)
        setError('Could not read that file — make sure it\'s a valid .xlsx/.xls/.csv file.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const downloadReadingTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['Sentence', 'Marks', 'Time Limit'],
      ['The quick brown fox jumps over the lazy dog.', 5, 30],
    ])
    worksheet['!cols'] = [{ wch: 55 }, { wch: 10 }, { wch: 12 }]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reading')
    XLSX.writeFile(workbook, 'lsrw-reading-template.xlsx')
  }

  const handleAddSingleReading = async () => {
    if (!user?.token) return
    setError(null)
    if (!singleSentence.trim()) { setError('Enter the sentence.'); return }

    setSubmitting(true)
    try {
      const form = new FormData()
      form.append('type', 'reading')
      form.append('sentence', singleSentence.trim())
      form.append('marks', String(singleMarks))
      form.append('timeLimit', String(singleTimeLimit))

      const res = await fetch(`${baseURL}/api/eklavadmin/lsrw-content`, {
        method: 'POST',
        headers: authHeader,
        body: form,
      })
      const data = await res.json()
      if (!data.success) { setError(data.message || 'Failed to save sentence.'); return }
      setSingleSentence('')
      fetchItems()
    } catch (err) {
      console.error(err)
      setError('Something went wrong while saving.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddSingleSpeaking = async () => {
    if (!user?.token) return
    setError(null)
    if (!singleTopic.trim()) { setError('Enter the topic.'); return }

    setSubmitting(true)
    try {
      const res = await fetch(`${baseURL}/api/eklavadmin/lsrw-speaking-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ topic: singleTopic.trim(), marks: singleTopicMarks, timeLimit: singleTopicTimeLimit }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.message || 'Failed to save topic.'); return }
      setSingleTopic('')
      fetchItems()
    } catch (err) {
      console.error(err)
      setError('Something went wrong while saving.')
    } finally {
      setSubmitting(false)
    }
  }

  const downloadSpeakingTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['Topic', 'Marks', 'Time Limit'],
      ['Do you think social media has more advantages or disadvantages for students?', 5, 90],
    ])
    worksheet['!cols'] = [{ wch: 60 }, { wch: 10 }, { wch: 12 }]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Speaking')
    XLSX.writeFile(workbook, 'lsrw-speaking-template.xlsx')
  }

  const handleSpeakingExcelUpload = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setError(null)
    setExcelSpeakingMsg(null)
    setExcelSpeakingItems(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<(string | number)[]>(firstSheet, { header: 1 })

        const items = rows
          .filter((row, i) => !(i === 0 && String(row?.[0] ?? '').trim().toLowerCase() === 'topic'))
          .map((row) => ({
            topic: String(row?.[0] ?? '').trim(),
            marks: row?.[1] !== undefined && row?.[1] !== '' ? Number(row[1]) : undefined,
            timeLimit: row?.[2] !== undefined && row?.[2] !== '' ? Number(row[2]) : undefined,
          }))
          .filter((it) => it.topic)

        if (items.length === 0) {
          setError('No topics found in that file — put one topic per row in column A.')
          return
        }
        setExcelSpeakingItems(items)
        setExcelSpeakingMsg(`Loaded ${items.length} topic${items.length === 1 ? '' : 's'} from Excel — review below, then click Add.`)
      } catch (err) {
        console.error(err)
        setError('Could not read that file — make sure it\'s a valid .xlsx/.xls/.csv file.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleAddSingleJumbled = async () => {
    if (!user?.token) return
    setError(null)
    const parts = singleJumbled.split('/').map((p) => p.trim()).filter(Boolean)
    if (parts.length < 2) { setError('Enter at least 2 fragments separated by " / ".'); return }

    setSubmitting(true)
    try {
      const res = await fetch(`${baseURL}/api/eklavadmin/lsrw-jumbled-content/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ items: [{ parts, marks: singleJumbledMarks, timeLimit: singleJumbledTimeLimit }] }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.message || 'Failed to save sentence.'); return }
      setSingleJumbled('')
      fetchItems()
    } catch (err) {
      console.error(err)
      setError('Something went wrong while saving.')
    } finally {
      setSubmitting(false)
    }
  }

  const downloadJumbledTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['Sentence (fragments separated by /)', 'Marks', 'Time Limit'],
      ['The / children / went / to the park / yesterday', 5, 60],
    ])
    worksheet['!cols'] = [{ wch: 55 }, { wch: 10 }, { wch: 12 }]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Jumbled')
    XLSX.writeFile(workbook, 'lsrw-jumbled-template.xlsx')
  }

  const handleJumbledExcelUpload = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setError(null)
    setExcelJumbledMsg(null)
    setExcelJumbledItems(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<(string | number)[]>(firstSheet, { header: 1 })

        const items = rows
          .filter((row, i) => !(i === 0 && String(row?.[0] ?? '').trim().toLowerCase().startsWith('sentence')))
          .map((row) => ({
            parts: String(row?.[0] ?? '').split('/').map((p) => p.trim()).filter(Boolean),
            marks: row?.[1] !== undefined && row?.[1] !== '' ? Number(row[1]) : undefined,
            timeLimit: row?.[2] !== undefined && row?.[2] !== '' ? Number(row[2]) : undefined,
          }))
          .filter((it) => it.parts.length >= 2)

        if (items.length === 0) {
          setError('No valid sentences found — each row needs at least 2 fragments separated by " / " in column A.')
          return
        }
        setExcelJumbledItems(items)
        setExcelJumbledMsg(`Loaded ${items.length} sentence${items.length === 1 ? '' : 's'} from Excel — review below, then click Add.`)
      } catch (err) {
        console.error(err)
        setError('Could not read that file — make sure it\'s a valid .xlsx/.xls/.csv file.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleStoryImageChange = (files: FileList | null) => {
    const file = files?.[0] ?? null
    setStoryImageFile(file)
    setStoryImagePreview(file ? URL.createObjectURL(file) : null)
  }

  const resetStoryForm = () => {
    setStoryImageFile(null)
    setStoryImagePreview(null)
    setStoryPromptText('')
    setStoryPoints('')
  }

  const handleAddStory = async () => {
    if (!user?.token) return
    setError(null)

    const points = storyPoints.split('\n').map((p) => p.trim()).filter(Boolean)
    if (points.length === 0) { setError('Add at least one point to include.'); return }
    if (storyPromptType === 'image' && !storyImageFile) { setError('Choose a prompt image.'); return }
    if (storyPromptType === 'text' && !storyPromptText.trim()) { setError('Enter the prompt text.'); return }

    setSubmitting(true)
    try {
      const form = new FormData()
      form.append('promptType', storyPromptType)
      form.append('points', JSON.stringify(points))
      form.append('marks', String(storyMarks))
      form.append('timeLimit', String(storyTimeLimit))
      if (storyPromptType === 'image' && storyImageFile) form.append('image', storyImageFile)
      if (storyPromptType === 'text') form.append('promptText', storyPromptText.trim())

      const res = await fetch(`${baseURL}/api/eklavadmin/lsrw-storytelling-content`, {
        method: 'POST',
        headers: authHeader,
        body: form,
      })
      const data = await res.json()
      if (!data.success) { setError(data.message || 'Failed to save prompt.'); return }
      resetStoryForm()
      fetchItems()
    } catch (err) {
      console.error(err)
      setError('Something went wrong while saving.')
    } finally {
      setSubmitting(false)
    }
  }

  const downloadStoryTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['Prompt Text', 'Points (separated by /)', 'Marks', 'Time Limit'],
      ['You found a lost wallet on your way to college.', 'You picked it up / You checked for ID / You decided what to do / What happened next? / Moral of the story.', 10, 120],
    ])
    worksheet['!cols'] = [{ wch: 45 }, { wch: 70 }, { wch: 8 }, { wch: 10 }]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Story Telling')
    XLSX.writeFile(workbook, 'lsrw-storytelling-template.xlsx')
  }

  // Text prompts only — an image can't come from an Excel cell, so
  // image-based prompts still need Single Upload.
  const handleStoryExcelUpload = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setError(null)
    setExcelStoryMsg(null)
    setExcelStoryItems(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<(string | number)[]>(firstSheet, { header: 1 })

        const items = rows
          .filter((row, i) => !(i === 0 && String(row?.[0] ?? '').trim().toLowerCase().startsWith('prompt')))
          .map((row) => ({
            promptText: String(row?.[0] ?? '').trim(),
            points: String(row?.[1] ?? '').split('/').map((p) => p.trim()).filter(Boolean),
            marks: row?.[2] !== undefined && row?.[2] !== '' ? Number(row[2]) : undefined,
            timeLimit: row?.[3] !== undefined && row?.[3] !== '' ? Number(row[3]) : undefined,
          }))
          .filter((it) => it.promptText && it.points.length > 0)

        if (items.length === 0) {
          setError('No valid prompts found — each row needs Prompt Text in column A and at least one point (separated by " / ") in column B.')
          return
        }
        setExcelStoryItems(items)
        setExcelStoryMsg(`Loaded ${items.length} prompt${items.length === 1 ? '' : 's'} from Excel — review below, then click Add.`)
      } catch (err) {
        console.error(err)
        setError('Could not read that file — make sure it\'s a valid .xlsx/.xls/.csv file.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleAddStoryBulk = async () => {
    if (!user?.token) return
    setError(null)
    if (!excelStoryItems || excelStoryItems.length === 0) { setError('Upload an Excel file first.'); return }

    setSubmitting(true)
    try {
      const res = await fetch(`${baseURL}/api/eklavadmin/lsrw-storytelling-content/bulk-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ items: excelStoryItems }),
      })
      const data = await res.json()
      if (!data.success) { setError(data.message || 'Failed to save prompts.'); return }
      setExcelStoryItems(null)
      setExcelStoryMsg(null)
      fetchItems()
    } catch (err) {
      console.error(err)
      setError('Something went wrong while saving.')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePassageAudioChange = (files: FileList | null) => {
    const file = files?.[0] ?? null
    setPassageAudioFile(file)
    setPassageAudioPreview(file ? URL.createObjectURL(file) : null)
  }

  const resetPassageQuestionDraft = () => {
    setPDraftQuestion('')
    setPDraftOptions(['', '', '', ''])
    setPDraftCorrectIdx(null)
  }

  const addToPassageBatch = () => {
    setError(null)
    if (!pDraftQuestion.trim()) { setError('Enter the question text.'); return }
    const filled = pDraftOptions.map((o) => o.trim())
    if (filled.filter(Boolean).length < 2) { setError('Add at least 2 options.'); return }
    if (pDraftCorrectIdx === null || !filled[pDraftCorrectIdx]) { setError('Select which option is correct.'); return }
    setPassageBatch((prev) => [...prev, {
      question: pDraftQuestion.trim(), options: filled.filter(Boolean), correctAnswer: filled[pDraftCorrectIdx],
      marks: pDraftMarks, timeLimit: pDraftTimeLimit,
    }])
    resetPassageQuestionDraft()
  }

  const removeFromPassageBatch = (idx: number) => setPassageBatch((prev) => prev.filter((_, i) => i !== idx))

  const downloadPassageQuestionsTemplate = () => {
    const worksheet = XLSX.utils.aoa_to_sheet([
      ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Marks', 'Time Limit'],
      ['What does the person usually do in the mornings on weekends?', 'Go to the park', 'Sleep longer and have breakfast with family', 'Watch movies with friends', 'Visit restaurants', 'Sleep longer and have breakfast with family', 1, 30],
    ])
    worksheet['!cols'] = [{ wch: 45 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 8 }, { wch: 10 }]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Passage Questions')
    XLSX.writeFile(workbook, 'lsrw-passage-questions-template.xlsx')
  }

  // Imports questions straight into the same batch the manual "Add Question
  // to Passage" builder fills — the passage still needs exactly one audio
  // file, chosen separately above, since audio can't come from Excel.
  const handlePassageQuestionsExcelUpload = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setError(null)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json<(string | number)[]>(firstSheet, { header: 1 })

        const items: PassageQuestion[] = rows
          .filter((row, i) => !(i === 0 && String(row?.[0] ?? '').trim().toLowerCase().startsWith('question')))
          .map((row) => {
            const options = [row?.[1], row?.[2], row?.[3], row?.[4]].map((o) => String(o ?? '').trim()).filter(Boolean)
            return {
              question: String(row?.[0] ?? '').trim(),
              options,
              correctAnswer: String(row?.[5] ?? '').trim(),
              marks: row?.[6] !== undefined && row?.[6] !== '' ? Number(row[6]) : 1,
              timeLimit: row?.[7] !== undefined && row?.[7] !== '' ? Number(row[7]) : 30,
            }
          })
          .filter((it) => it.question && it.correctAnswer && it.options.length >= 2 && it.options.includes(it.correctAnswer))

        if (items.length === 0) {
          setError('No valid questions found. Every row needs at least 2 options and a Correct Answer that exactly matches one of them.')
          return
        }
        setPassageBatch((prev) => [...prev, ...items])
      } catch (err) {
        console.error(err)
        setError('Could not read that file — make sure it\'s a valid .xlsx/.xls/.csv file.')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleAddPassage = async () => {
    if (!user?.token) return
    setError(null)
    if (!passageAudioFile) { setError('Choose the passage audio file.'); return }
    if (passageBatch.length === 0) { setError('Add at least one question for this passage.'); return }

    setSubmitting(true)
    try {
      const form = new FormData()
      form.append('audio', passageAudioFile)
      form.append('questions', JSON.stringify(passageBatch))

      const res = await fetch(`${baseURL}/api/eklavadmin/lsrw-passage-content`, {
        method: 'POST',
        headers: authHeader,
        body: form,
      })
      const data = await res.json()
      if (!data.success) { setError(data.message || 'Failed to save passage.'); return }
      setPassageAudioFile(null)
      setPassageAudioPreview(null)
      setPassageBatch([])
      fetchItems()
    } catch (err) {
      console.error(err)
      setError('Something went wrong while saving.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBulkAdd = async () => {
    if (!user?.token) return
    setError(null)

    if (tab === 'reading') {
      if (!excelParsedItems || excelParsedItems.length === 0) { setError('Upload an Excel file first.'); return }

      setSubmitting(true)
      try {
        const res = await fetch(`${baseURL}/api/eklavadmin/lsrw-content/bulk-reading`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ items: excelParsedItems }),
        })
        const data = await res.json()
        if (!data.success) { setError(data.message || 'Failed to save items.'); return }
        setBulkSentences('')
        setExcelLoadMsg(null)
        setExcelParsedItems(null)
        fetchItems()
      } catch (err) {
        console.error(err)
        setError('Something went wrong while saving.')
      } finally {
        setSubmitting(false)
      }
      return
    }

    if (tab === 'speaking') {
      if (!excelSpeakingItems || excelSpeakingItems.length === 0) { setError('Upload an Excel file first.'); return }

      setSubmitting(true)
      try {
        const res = await fetch(`${baseURL}/api/eklavadmin/lsrw-speaking-content/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ items: excelSpeakingItems }),
        })
        const data = await res.json()
        if (!data.success) { setError(data.message || 'Failed to save topics.'); return }
        setExcelSpeakingItems(null)
        setExcelSpeakingMsg(null)
        fetchItems()
      } catch (err) {
        console.error(err)
        setError('Something went wrong while saving.')
      } finally {
        setSubmitting(false)
      }
      return
    }

    if (tab === 'grammar') {
      const usingExcel = grammarSubTab === 'bulk'
      const batch = usingExcel ? excelGrammarItems : grammarBatch
      if (!batch || batch.length === 0) {
        setError(usingExcel ? 'Upload an Excel file first.' : 'Add at least one question to the batch.')
        return
      }

      setSubmitting(true)
      try {
        const res = await fetch(`${baseURL}/api/eklavadmin/lsrw-grammar-content/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({
            items: usingExcel ? batch : batch.map((d) => ({ ...d, marks: grammarMarks, timeLimit: grammarTimeLimit })),
          }),
        })
        const data = await res.json()
        if (!data.success) { setError(data.message || 'Failed to save questions.'); return }
        setGrammarBatch([])
        setExcelGrammarItems(null)
        setExcelGrammarMsg(null)
        fetchItems()
      } catch (err) {
        console.error(err)
        setError('Something went wrong while saving.')
      } finally {
        setSubmitting(false)
      }
      return
    }

    if (tab === 'jumbled') {
      if (!excelJumbledItems || excelJumbledItems.length === 0) { setError('Upload an Excel file first.'); return }

      setSubmitting(true)
      try {
        const res = await fetch(`${baseURL}/api/eklavadmin/lsrw-jumbled-content/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeader },
          body: JSON.stringify({ items: excelJumbledItems }),
        })
        const data = await res.json()
        if (!data.success) { setError(data.message || 'Failed to save sentences.'); return }
        setExcelJumbledItems(null)
        setExcelJumbledMsg(null)
        fetchItems()
      } catch (err) {
        console.error(err)
        setError('Something went wrong while saving.')
      } finally {
        setSubmitting(false)
      }
      return
    }

    // Listening
    if (audioFiles.length === 0) { setError('Choose one or more audio files.'); return }
    if (transcripts.some((t) => !t.trim())) { setError('Every audio file needs its transcript filled in.'); return }

    setSubmitting(true)
    try {
      const form = new FormData()
      audioFiles.forEach((f) => form.append('audio', f))
      form.append('sentences', JSON.stringify(transcripts.map((t) => t.trim())))
      form.append('marks', String(listeningMarks))
      form.append('timeLimit', String(listeningTimeLimit))

      const res = await fetch(`${baseURL}/api/eklavadmin/lsrw-content/bulk-listening`, {
        method: 'POST',
        headers: authHeader,
        body: form,
      })
      const data = await res.json()
      if (!data.success) { setError(data.message || 'Failed to save items.'); return }
      setAudioFiles([])
      setTranscripts([])
      fetchItems()
    } catch (err) {
      console.error(err)
      setError('Something went wrong while saving.')
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!user?.token || !deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`${baseURL}/api/eklavadmin/${endpointBase}/${deleteId}`, { method: 'DELETE', headers: authHeader })
      const data = await res.json()
      if (data.success) setItems((prev) => prev.filter((i) => i._id !== deleteId))
    } catch (err) { console.error(err) }
    finally { setDeleting(false); setDeleteId(null) }
  }

  const toggleActive = async (item: Item) => {
    if (!user?.token) return
    try {
      const res = await fetch(`${baseURL}/api/eklavadmin/${endpointBase}/${item._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ isActive: !item.isActive }),
      })
      const data = await res.json()
      if (data.success) setItems((prev) => prev.map((i) => (i._id === item._id ? data.item : i)))
    } catch (err) { console.error(err) }
  }

  const settingsFields: { tab: Tab; value: number; set: (n: number) => void; unit: string }[] = [
    { tab: 'reading', value: readingCount, set: setReadingCount, unit: 'sentences' },
    { tab: 'listening', value: listeningCount, set: setListeningCount, unit: 'clips' },
    { tab: 'speaking', value: speakingCount, set: setSpeakingCount, unit: 'topics' },
    { tab: 'grammar', value: grammarCount, set: setGrammarCount, unit: 'questions' },
    { tab: 'jumbled', value: jumbledCount, set: setJumbledCount, unit: 'sentences' },
    { tab: 'storytelling', value: storyCount, set: setStoryCount, unit: 'prompts' },
    { tab: 'passages', value: passageCount, set: setPassageCount, unit: 'passages' },
  ]

  const accent = tab === 'reading' ? ORANGE : tab === 'listening' ? BLUE : tab === 'speaking' ? PURPLE : tab === 'grammar' ? GREEN : tab === 'jumbled' ? CYAN : tab === 'storytelling' ? PINK : TEAL

  const meta = SECTIONS.find((s) => s.key === tab)!
  const q = search.trim().toLowerCase()
  const visibleItems = items.filter((item) => {
    if (statusFilter === 'active' && !item.isActive) return false
    if (statusFilter === 'inactive' && item.isActive) return false
    if (!q) return true
    const haystack = [item.sentence, item.topic, item.question, item.promptText, item.category, ...(item.parts || []), ...(item.points || []), ...(item.questions || []).map((x) => x.question)]
    return haystack.some((v) => v && v.toLowerCase().includes(q))
  })
  const activeCount = items.filter((i) => i.isActive).length
  const shownPerAttempt = settingsFields.find((f) => f.tab === tab)?.value ?? 0

  return (
    <AdminPage className="lsrw-page">
      <PageMetaData title="LSRW Content Bank" />

      <PageHeader
        icon={FaLayerGroup}
        title="LSRW Content Bank"
        subtitle="Build a large pool for each skill; every student attempt gets a random set from it"
      />

      {/* Round settings */}
      <div className="aui-card lsrw-settings">
        <div className="aui-toolbar">
          <div className="aui-toolbar-title">
            <h3><FaCog size={13} style={{ marginRight: 8, color: '#ff9a3c', verticalAlign: '-1px' }} />Questions per attempt</h3>
            <p>How many items each student gets from every bank, picked at random each attempt</p>
          </div>
          <div className="aui-toolbar-filters">
            {settingsSaved && <span className="aui-badge aui-badge-green"><FaCheckCircle size={10} /> Saved</span>}
            <button type="button" className="aui-btn aui-btn-primary" onClick={saveSettings} disabled={savingSettings}>
              {savingSettings ? <FaSpinner className="aui-spin" style={{ color: '#fff' }} /> : <FaSave size={11} />} {savingSettings ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </div>
        <div className="lsrw-counts">
          {settingsFields.map((f) => {
            const s = SECTIONS.find((x) => x.key === f.tab)!
            return (
              <label key={f.tab} className={`lsrw-count${tab === f.tab ? ' is-current' : ''}`} style={{ ['--acc' as any]: s.color }}>
                <span className="lsrw-count-head"><s.icon size={11} /> {s.label}</span>
                <span className="lsrw-count-input">
                  <input type="number" min={0} value={f.value} onChange={(e) => f.set(Math.max(0, Number(e.target.value)))} aria-label={`${s.label} items per attempt`} />
                  <small>{f.unit}</small>
                </span>
              </label>
            )
          })}
        </div>
      </div>

      <div className="lsrw-tabs">
        <Tabs<Tab>
          value={tab}
          onChange={(t) => { setTab(t); setSearch(''); setStatusFilter('') }}
          label="Content type"
          items={SECTIONS.map((s) => ({ value: s.key, label: s.label, icon: s.icon }))}
        />
      </div>

      <div className="lsrw-grid" style={{ ['--acc' as any]: accent }}>
        {/* Add form */}
        <div className="aui-card lsrw-form-card">
          <div className="aui-toolbar">
            <div className="lsrw-title">
              <span className="lsrw-title-icon"><meta.icon /></span>
              <div className="aui-toolbar-title">
                <h3>{tab === 'storytelling' ? 'Add story prompts' : tab === 'passages' ? 'Add a passage' : `Add ${meta.label.toLowerCase()} items`}</h3>
                <p>{meta.hint}</p>
              </div>
            </div>
          </div>
          <div className="lsrw-form">

          {tab === 'passages' ? (
            <>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 6 }}>Passage Audio</label>
              <input
                type="file" accept="audio/*"
                onChange={(e) => handlePassageAudioChange(e.target.files)}
                style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '8px 10px', fontSize: 12.5, color: PAGE_TEXT, background: CARD_BG, marginBottom: 12 }}
              />
              {passageAudioPreview && (
                <audio controls src={passageAudioPreview} style={{ width: '100%', marginBottom: 14 }} />
              )}

              <div style={{ borderTop: `1px solid ${PAGE_BORDER}`, paddingTop: 14, marginBottom: 12 }}>
                <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 8 }}>Questions</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  {(['manual', 'bulk'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setPassageQSubTab(t)}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                        border: `1.5px solid ${passageQSubTab === t ? TEAL : PAGE_BORDER}`,
                        background: passageQSubTab === t ? 'rgba(45,212,191,0.1)' : CARD_BG,
                        color: passageQSubTab === t ? TEAL : PAGE_TEXT,
                      }}
                    >
                      {t === 'manual' ? 'Manual Entry' : 'Bulk Upload'}
                    </button>
                  ))}
                </div>

                {passageQSubTab === 'bulk' ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY }}>Upload from Excel</label>
                      <button onClick={downloadPassageQuestionsTemplate} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', color: TEAL, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                        <FaFileExcel size={11} /> Download Template
                      </button>
                    </div>
                    <label style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
                      border: `1.5px dashed ${TEAL}66`, borderRadius: 10, padding: '12px', marginBottom: 4, background: 'rgba(45,212,191,0.1)',
                    }}>
                      <FaFileExcel size={14} color={TEAL} />
                      <span style={{ fontSize: 12.5, color: TEAL, fontWeight: 600 }}>Choose .xlsx / .xls / .csv — Question, Options, Answer columns</span>
                      <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handlePassageQuestionsExcelUpload(e.target.files)} style={{ display: 'none' }} />
                    </label>
                    <span style={{ fontSize: 10.5, color: PAGE_GRAY, display: 'block', marginBottom: 12 }}>Uploaded questions are added to the list below — you can upload more than one file.</span>
                  </>
                ) : (
                  <>
                    <textarea
                      value={pDraftQuestion}
                      onChange={(e) => setPDraftQuestion(e.target.value)}
                      rows={2}
                      placeholder="What does the person usually do in the mornings on weekends?"
                      style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '8px 12px', fontSize: 13, color: PAGE_TEXT, background: CARD_BG, fontFamily: 'inherit', outline: 'none', marginBottom: 12, resize: 'vertical' as const }}
                    />

                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 12 }}>
                      {pDraftOptions.map((opt, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <input
                            type="radio" checked={pDraftCorrectIdx === i} onChange={() => setPDraftCorrectIdx(i)}
                            title="Mark as correct answer"
                          />
                          <input
                            value={opt}
                            onChange={(e) => setPDraftOptions((prev) => prev.map((o, idx) => (idx === i ? e.target.value : o)))}
                            placeholder={`Option ${String.fromCharCode(65 + i)}`}
                            style={{ flex: 1, border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, padding: '7px 10px', fontSize: 12.5, color: PAGE_TEXT, background: CARD_BG }}
                          />
                        </div>
                      ))}
                      <span style={{ fontSize: 11, color: PAGE_GRAY }}>Select the radio button next to the correct option.</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                      <div>
                        <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 6 }}>Marks</label>
                        <input type="number" min={1} value={pDraftMarks} onChange={(e) => setPDraftMarks(Number(e.target.value))}
                          style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '8px 12px', fontSize: 13.5, color: PAGE_TEXT, background: CARD_BG }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 6 }}>Time Limit</label>
                        <select value={pDraftTimeLimit} onChange={(e) => setPDraftTimeLimit(Number(e.target.value))}
                          style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '8px 12px', fontSize: 13.5, color: PAGE_TEXT, background: CARD_BG }}>
                          {TIME_LIMIT_OPTIONS.map((t) => <option key={t} value={t}>{t} sec</option>)}
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={addToPassageBatch}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: CARD_BG, border: `1.5px solid ${TEAL}`, color: TEAL, borderRadius: 10, padding: '8px 0', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
                    >
                      <FaPlus size={11} /> Add Question to Passage
                    </button>
                  </>
                )}
              </div>

              {passageBatch.length > 0 && (
                <div style={{ maxHeight: 200, overflowY: 'auto' as const, marginBottom: 14, display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                  {passageBatch.map((q, i) => (
                    <div key={i} style={{ border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, padding: '7px 10px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 12, color: PAGE_TEXT }}>{q.question}</span>
                        <div style={{ fontSize: 10.5, color: PAGE_GRAY, marginTop: 2 }}>Answer: {q.correctAnswer} · {q.marks} marks · {q.timeLimit}s</div>
                      </div>
                      <button onClick={() => removeFromPassageBatch(i)} style={{ border: 'none', background: 'none', color: '#fb737a', cursor: 'pointer', flexShrink: 0 }}>
                        <FaTrash size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : tab === 'storytelling' ? (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {(['single', 'bulk'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setStorySubTab(t)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                      border: `1.5px solid ${storySubTab === t ? PINK : PAGE_BORDER}`,
                      background: storySubTab === t ? 'rgba(244,114,182,0.1)' : CARD_BG,
                      color: storySubTab === t ? PINK : PAGE_TEXT,
                    }}
                  >
                    {t === 'single' ? 'Single Upload' : 'Bulk Upload'}
                  </button>
                ))}
              </div>

              {storySubTab === 'single' ? (
              <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {(['image', 'text'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setStoryPromptType(t); resetStoryForm() }}
                    style={{
                      flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                      border: `1.5px solid ${storyPromptType === t ? PINK : PAGE_BORDER}`,
                      background: storyPromptType === t ? 'rgba(244,114,182,0.1)' : CARD_BG,
                      color: storyPromptType === t ? PINK : PAGE_TEXT,
                    }}
                  >
                    {t === 'image' ? 'Image Prompt' : 'Text Prompt'}
                  </button>
                ))}
              </div>

              {storyPromptType === 'image' ? (
                <>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 6 }}>Prompt Image</label>
                  <input
                    type="file" accept="image/*"
                    onChange={(e) => handleStoryImageChange(e.target.files)}
                    style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '8px 10px', fontSize: 12.5, color: PAGE_TEXT, background: CARD_BG, marginBottom: 6 }}
                  />
                  <div style={{ fontSize: 11, color: PAGE_GRAY, marginBottom: 12, lineHeight: 1.5 }}>
                    Recommended: landscape, ~800×450px (16:9), JPG/PNG under 2MB. The student view fits it into a
                    260px-tall box without cropping, so a landscape image looks best — tall/portrait images will
                    appear smaller with empty space on the sides.
                  </div>
                  {storyImagePreview && (
                    <div style={{ width: '100%', borderRadius: 10, marginBottom: 12, overflow: 'hidden', lineHeight: 0 }}>
                      <img src={storyImagePreview} alt="" style={{ display: 'block', width: '100%', maxHeight: 160, objectFit: 'contain' }} />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 6 }}>Prompt Text</label>
                  <textarea
                    value={storyPromptText}
                    onChange={(e) => setStoryPromptText(e.target.value)}
                    rows={3}
                    placeholder="You found a lost wallet on your way to college."
                    style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '10px 12px', fontSize: 13, color: PAGE_TEXT, background: CARD_BG, fontFamily: 'inherit', outline: 'none', marginBottom: 12, resize: 'vertical' as const }}
                  />
                </>
              )}

              <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 6 }}>Points to Include — one per line</label>
              <textarea
                value={storyPoints}
                onChange={(e) => setStoryPoints(e.target.value)}
                rows={5}
                placeholder={'A boy was returning home in the rain.\nHe saw a puppy shivering on the road.\nHe decided to help the puppy.\nWhat happened next?\nMoral of the story.'}
                style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '10px 12px', fontSize: 13, color: PAGE_TEXT, background: CARD_BG, fontFamily: 'inherit', outline: 'none', marginBottom: 12, resize: 'vertical' as const }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 6 }}>Marks</label>
                  <input type="number" min={1} value={storyMarks} onChange={(e) => setStoryMarks(Number(e.target.value))}
                    style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '8px 12px', fontSize: 13.5, color: PAGE_TEXT, background: CARD_BG }} />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 6 }}>Time Limit (sec)</label>
                  <input type="number" min={30} step={15} value={storyTimeLimit} onChange={(e) => setStoryTimeLimit(Number(e.target.value))}
                    style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '8px 12px', fontSize: 13.5, color: PAGE_TEXT, background: CARD_BG }} />
                </div>
              </div>
              </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY }}>Upload from Excel (Text prompts only)</label>
                    <button onClick={downloadStoryTemplate} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', color: PINK, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                      <FaFileExcel size={11} /> Download Template
                    </button>
                  </div>
                  <span style={{ fontSize: 10.5, color: PAGE_GRAY, display: 'block', marginBottom: 8 }}>
                    Image prompts can't come from Excel — use Single Upload for those.
                  </span>
                  <label style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
                    border: `1.5px dashed ${PINK}66`, borderRadius: 10, padding: '12px', marginBottom: 10, background: 'rgba(244,114,182,0.1)',
                  }}>
                    <FaFileExcel size={14} color={PINK} />
                    <span style={{ fontSize: 12.5, color: PINK, fontWeight: 600 }}>Choose .xlsx / .xls / .csv — Prompt Text, Points, Marks columns</span>
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleStoryExcelUpload(e.target.files)} style={{ display: 'none' }} />
                  </label>
                  {excelStoryMsg && <div style={{ fontSize: 11.5, color: '#45dd75', marginBottom: 10 }}>{excelStoryMsg}</div>}

                  {excelStoryItems ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY }}>{excelStoryItems.length} prompt{excelStoryItems.length === 1 ? '' : 's'} from file</label>
                        <button onClick={() => { setExcelStoryItems(null); setExcelStoryMsg(null) }} style={{ border: 'none', background: 'none', color: PAGE_GRAY, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', padding: 0 }}>Clear</button>
                      </div>
                      <div style={{ maxHeight: 320, overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                        {excelStoryItems.map((it, i) => (
                          <div key={i} style={{ border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, padding: '7px 10px' }}>
                            <div style={{ fontSize: 12, color: PAGE_TEXT }}>{it.promptText}</div>
                            <div style={{ fontSize: 10.5, color: PAGE_GRAY, marginTop: 2 }}>{it.points.length} points · {it.marks ?? 10} marks · {it.timeLimit ?? 120}s</div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ border: `1px dashed ${PAGE_BORDER}`, borderRadius: 10, padding: '24px 16px', textAlign: 'center' as const, color: PAGE_GRAY, fontSize: 12.5 }}>
                      Upload a file above to see a preview here.
                    </div>
                  )}
                </>
              )}
            </>
          ) : tab === 'jumbled' ? (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {(['single', 'bulk'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setJumbledSubTab(t)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                      border: `1.5px solid ${jumbledSubTab === t ? CYAN : PAGE_BORDER}`,
                      background: jumbledSubTab === t ? 'rgba(34,211,238,0.1)' : CARD_BG,
                      color: jumbledSubTab === t ? CYAN : PAGE_TEXT,
                    }}
                  >
                    {t === 'single' ? 'Single Upload' : 'Bulk Upload'}
                  </button>
                ))}
              </div>

              {jumbledSubTab === 'single' ? (
                <>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 6 }}>
                    Sentence — fragments separated by " / " in the CORRECT order
                  </label>
                  <textarea
                    value={singleJumbled}
                    onChange={(e) => setSingleJumbled(e.target.value)}
                    rows={3}
                    placeholder="The / children / went / to the park / yesterday"
                    style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '10px 12px', fontSize: 13, color: PAGE_TEXT, background: CARD_BG, fontFamily: 'inherit', outline: 'none', marginBottom: 14, resize: 'vertical' as const }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 6 }}>Marks</label>
                      <input type="number" min={1} value={singleJumbledMarks} onChange={(e) => setSingleJumbledMarks(Number(e.target.value))}
                        style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '8px 12px', fontSize: 13.5, color: PAGE_TEXT, background: CARD_BG }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 6 }}>Time Limit</label>
                      <select value={singleJumbledTimeLimit} onChange={(e) => setSingleJumbledTimeLimit(Number(e.target.value))}
                        style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '8px 12px', fontSize: 13.5, color: PAGE_TEXT, background: CARD_BG }}>
                        {TIME_LIMIT_OPTIONS.map((t) => <option key={t} value={t}>{t} sec</option>)}
                      </select>
                    </div>
                  </div>
                  {error && <div style={{ fontSize: 12.5, color: '#fb737a', marginBottom: 12 }}>{error}</div>}
                  <button
                    onClick={handleAddSingleJumbled}
                    disabled={submitting}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: ORANGE, border: 'none', color: '#fff', borderRadius: 10, padding: '10px 0', fontSize: 13.5, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}
                  >
                    <FaPlus size={12} /> {submitting ? 'Saving…' : 'Add Sentence'}
                  </button>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY }}>Upload from Excel</label>
                    <button onClick={downloadJumbledTemplate} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', color: CYAN, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                      <FaFileExcel size={11} /> Download Template
                    </button>
                  </div>
                  <label style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
                    border: `1.5px dashed ${CYAN}66`, borderRadius: 10, padding: '12px', marginBottom: 10, background: 'rgba(34,211,238,0.1)',
                  }}>
                    <FaFileExcel size={14} color={CYAN} />
                    <span style={{ fontSize: 12.5, color: CYAN, fontWeight: 600 }}>Choose .xlsx / .xls / .csv — Sentence, Marks, Time Limit columns</span>
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleJumbledExcelUpload(e.target.files)} style={{ display: 'none' }} />
                  </label>
                  {excelJumbledMsg && <div style={{ fontSize: 11.5, color: '#45dd75', marginBottom: 10 }}>{excelJumbledMsg}</div>}

                  {excelJumbledItems ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY }}>{excelJumbledItems.length} sentence{excelJumbledItems.length === 1 ? '' : 's'} from file</label>
                        <button onClick={() => { setExcelJumbledItems(null); setExcelJumbledMsg(null) }} style={{ border: 'none', background: 'none', color: PAGE_GRAY, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', padding: 0 }}>Clear</button>
                      </div>
                      <div style={{ maxHeight: 320, overflowY: 'auto' as const, border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, marginBottom: 14 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                          <thead>
                            <tr style={{ background: PAGE_BG }}>
                              {['Sentence', 'Marks', 'Time Limit'].map((h) => <th key={h} style={{ textAlign: 'left' as const, fontSize: 10.5, color: PAGE_GRAY, textTransform: 'uppercase' as const, padding: '7px 10px', fontWeight: 700 }}>{h}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {excelJumbledItems.map((it, i) => (
                              <tr key={i} style={{ borderTop: `1px solid ${PAGE_BORDER}` }}>
                                <td style={{ fontSize: 12, color: PAGE_TEXT, padding: '6px 10px' }}>{it.parts.join(' / ')}</td>
                                <td style={{ fontSize: 12, color: PAGE_GRAY, padding: '6px 10px' }}>{it.marks ?? 5}</td>
                                <td style={{ fontSize: 12, color: PAGE_GRAY, padding: '6px 10px' }}>{it.timeLimit ?? 60}s</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div style={{ border: `1px dashed ${PAGE_BORDER}`, borderRadius: 10, padding: '24px 16px', textAlign: 'center' as const, color: PAGE_GRAY, fontSize: 12.5 }}>
                      Upload a file above to see a preview here.
                    </div>
                  )}
                </>
              )}
            </>
          ) : tab === 'grammar' ? (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {(['manual', 'bulk'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setGrammarSubTab(t)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                      border: `1.5px solid ${grammarSubTab === t ? GREEN : PAGE_BORDER}`,
                      background: grammarSubTab === t ? 'rgba(69,221,117,0.1)' : CARD_BG,
                      color: grammarSubTab === t ? GREEN : PAGE_TEXT,
                    }}
                  >
                    {t === 'manual' ? 'Manual Entry' : 'Bulk Upload'}
                  </button>
                ))}
              </div>

              {grammarSubTab === 'bulk' ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY }}>Upload from Excel</label>
                    <button onClick={downloadGrammarTemplate} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', color: GREEN, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                      <FaFileExcel size={11} /> Download Template
                    </button>
                  </div>
                  <label style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
                    border: `1.5px dashed ${GREEN}66`, borderRadius: 10, padding: '12px', marginBottom: 10, background: 'rgba(69,221,117,0.1)',
                  }}>
                    <FaFileExcel size={14} color={GREEN} />
                    <span style={{ fontSize: 12.5, color: GREEN, fontWeight: 600 }}>Choose .xlsx / .xls / .csv — Type, Category, Question, Options, Answer columns</span>
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleGrammarExcelUpload(e.target.files)} style={{ display: 'none' }} />
                  </label>
                  {excelGrammarMsg && <div style={{ fontSize: 11.5, color: '#45dd75', marginBottom: 10 }}>{excelGrammarMsg}</div>}

                  {excelGrammarItems ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY }}>{excelGrammarItems.length} question{excelGrammarItems.length === 1 ? '' : 's'} from file</label>
                        <button onClick={() => { setExcelGrammarItems(null); setExcelGrammarMsg(null) }} style={{ border: 'none', background: 'none', color: PAGE_GRAY, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', padding: 0 }}>Clear</button>
                      </div>
                      <div style={{ maxHeight: 320, overflowY: 'auto' as const, display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                        {excelGrammarItems.map((d, i) => (
                          <div key={i} style={{ border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, padding: '7px 10px' }}>
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: GREEN, marginRight: 6 }}>{d.type === 'mcq' ? 'MCQ' : 'FILL'}</span>
                            <span style={{ fontSize: 12, color: PAGE_TEXT }}>{d.question}</span>
                            <div style={{ fontSize: 10.5, color: PAGE_GRAY, marginTop: 2 }}>Answer: {d.correctAnswer} · {d.marks ?? 1} marks · {d.timeLimit ?? 30}s</div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ border: `1px dashed ${PAGE_BORDER}`, borderRadius: 10, padding: '24px 16px', textAlign: 'center' as const, color: PAGE_GRAY, fontSize: 12.5 }}>
                      Upload a file above to see a preview here.
                    </div>
                  )}
                </>
              ) : (
              <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {(['mcq', 'fill'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setDraftType(t); resetGrammarDraft() }}
                    style={{
                      flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                      border: `1.5px solid ${draftType === t ? GREEN : PAGE_BORDER}`,
                      background: draftType === t ? 'rgba(69,221,117,0.1)' : CARD_BG,
                      color: draftType === t ? GREEN : PAGE_TEXT,
                    }}
                  >
                    {t === 'mcq' ? 'Multiple Choice' : 'Fill in the Blank'}
                  </button>
                ))}
              </div>

              <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 6 }}>Category</label>
              <select value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)}
                style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '8px 12px', fontSize: 13, color: PAGE_TEXT, background: CARD_BG, marginBottom: 12 }}>
                {GRAMMAR_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>

              <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 6 }}>
                {draftType === 'mcq' ? 'Question' : 'Sentence (use ___ for the blank)'}
              </label>
              <textarea
                value={draftQuestion}
                onChange={(e) => setDraftQuestion(e.target.value)}
                rows={2}
                placeholder={draftType === 'mcq' ? 'The doctor and the lawyer are ________.' : 'She ___ to school every day.'}
                style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '8px 12px', fontSize: 13, color: PAGE_TEXT, background: CARD_BG, fontFamily: 'inherit', outline: 'none', marginBottom: 12, resize: 'vertical' as const }}
              />

              {draftType === 'mcq' ? (
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8, marginBottom: 12 }}>
                  {draftOptions.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="radio" checked={draftCorrectIdx === i} onChange={() => setDraftCorrectIdx(i)}
                        title="Mark as correct answer"
                      />
                      <input
                        value={opt}
                        onChange={(e) => setDraftOptions((prev) => prev.map((o, idx) => (idx === i ? e.target.value : o)))}
                        placeholder={`Option ${String.fromCharCode(65 + i)}`}
                        style={{ flex: 1, border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, padding: '7px 10px', fontSize: 12.5, color: PAGE_TEXT, background: CARD_BG }}
                      />
                    </div>
                  ))}
                  <span style={{ fontSize: 11, color: PAGE_GRAY }}>Select the radio button next to the correct option.</span>
                </div>
              ) : (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 6 }}>Correct Answer</label>
                  <input
                    value={draftFillAnswer}
                    onChange={(e) => setDraftFillAnswer(e.target.value)}
                    placeholder="goes"
                    style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '8px 12px', fontSize: 13, color: PAGE_TEXT, background: CARD_BG }}
                  />
                </div>
              )}

              <button
                onClick={addToGrammarBatch}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: CARD_BG, border: `1.5px solid ${GREEN}`, color: GREEN, borderRadius: 10, padding: '8px 0', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', marginBottom: 14 }}
              >
                <FaPlus size={11} /> Add to Batch
              </button>

              {grammarBatch.length > 0 && (
                <div style={{ maxHeight: 200, overflowY: 'auto' as const, marginBottom: 14, display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                  {grammarBatch.map((d, i) => (
                    <div key={i} style={{ border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, padding: '7px 10px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: GREEN, marginRight: 6 }}>{d.type === 'mcq' ? 'MCQ' : 'FILL'}</span>
                        <span style={{ fontSize: 12, color: PAGE_TEXT }}>{d.question}</span>
                        <div style={{ fontSize: 10.5, color: PAGE_GRAY, marginTop: 2 }}>Answer: {d.correctAnswer}</div>
                      </div>
                      <button onClick={() => removeFromGrammarBatch(i)} style={{ border: 'none', background: 'none', color: '#fb737a', cursor: 'pointer', flexShrink: 0 }}>
                        <FaTrash size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 6 }}>Marks (each, applied to whole batch)</label>
                  <input type="number" min={1} value={grammarMarks} onChange={(e) => setGrammarMarks(Number(e.target.value))}
                    style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '8px 12px', fontSize: 13.5, color: PAGE_TEXT, background: CARD_BG }} />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 6 }}>Time Limit (each)</label>
                  <select value={grammarTimeLimit} onChange={(e) => setGrammarTimeLimit(Number(e.target.value))}
                    style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '8px 12px', fontSize: 13.5, color: PAGE_TEXT, background: CARD_BG }}>
                    {TIME_LIMIT_OPTIONS.map((t) => <option key={t} value={t}>{t} sec</option>)}
                  </select>
                </div>
              </div>
              </>
              )}
            </>
          ) : tab === 'speaking' ? (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {(['single', 'bulk'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setSpeakingSubTab(t)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                      border: `1.5px solid ${speakingSubTab === t ? PURPLE : PAGE_BORDER}`,
                      background: speakingSubTab === t ? 'rgba(167,139,250,0.1)' : CARD_BG,
                      color: speakingSubTab === t ? PURPLE : PAGE_TEXT,
                    }}
                  >
                    {t === 'single' ? 'Single Upload' : 'Bulk Upload'}
                  </button>
                ))}
              </div>

              {speakingSubTab === 'single' ? (
                <>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 6 }}>Topic</label>
                  <textarea
                    value={singleTopic}
                    onChange={(e) => setSingleTopic(e.target.value)}
                    rows={3}
                    placeholder="Do you think social media has more advantages or disadvantages for students?"
                    style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '10px 12px', fontSize: 13, color: PAGE_TEXT, background: CARD_BG, fontFamily: 'inherit', outline: 'none', marginBottom: 14, resize: 'vertical' as const }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 6 }}>Marks</label>
                      <input type="number" min={1} value={singleTopicMarks} onChange={(e) => setSingleTopicMarks(Number(e.target.value))}
                        style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '8px 12px', fontSize: 13.5, color: PAGE_TEXT, background: CARD_BG }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 6 }}>Time Limit</label>
                      <select value={singleTopicTimeLimit} onChange={(e) => setSingleTopicTimeLimit(Number(e.target.value))}
                        style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '8px 12px', fontSize: 13.5, color: PAGE_TEXT, background: CARD_BG }}>
                        {SPEAKING_TIME_OPTIONS.map((t) => <option key={t} value={t}>{t} sec</option>)}
                      </select>
                    </div>
                  </div>
                  {error && <div style={{ fontSize: 12.5, color: '#fb737a', marginBottom: 12 }}>{error}</div>}
                  <button
                    onClick={handleAddSingleSpeaking}
                    disabled={submitting}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: ORANGE, border: 'none', color: '#fff', borderRadius: 10, padding: '10px 0', fontSize: 13.5, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}
                  >
                    <FaPlus size={12} /> {submitting ? 'Saving…' : 'Add Topic'}
                  </button>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY }}>Upload from Excel</label>
                    <button onClick={downloadSpeakingTemplate} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', color: PURPLE, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
                      <FaFileExcel size={11} /> Download Template
                    </button>
                  </div>
                  <label style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
                    border: `1.5px dashed ${PURPLE}66`, borderRadius: 10, padding: '12px', marginBottom: 10, background: 'rgba(167,139,250,0.1)',
                  }}>
                    <FaFileExcel size={14} color={PURPLE} />
                    <span style={{ fontSize: 12.5, color: PURPLE, fontWeight: 600 }}>Choose .xlsx / .xls / .csv — Topic, Marks, Time Limit columns</span>
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleSpeakingExcelUpload(e.target.files)} style={{ display: 'none' }} />
                  </label>
                  {excelSpeakingMsg && <div style={{ fontSize: 11.5, color: '#45dd75', marginBottom: 10 }}>{excelSpeakingMsg}</div>}

                  {excelSpeakingItems ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY }}>{excelSpeakingItems.length} topic{excelSpeakingItems.length === 1 ? '' : 's'} from file</label>
                        <button onClick={() => { setExcelSpeakingItems(null); setExcelSpeakingMsg(null) }} style={{ border: 'none', background: 'none', color: PAGE_GRAY, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', padding: 0 }}>Clear</button>
                      </div>
                      <div style={{ maxHeight: 320, overflowY: 'auto' as const, border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, marginBottom: 14 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                          <thead>
                            <tr style={{ background: PAGE_BG }}>
                              {['Topic', 'Marks', 'Time Limit'].map((h) => <th key={h} style={{ textAlign: 'left' as const, fontSize: 10.5, color: PAGE_GRAY, textTransform: 'uppercase' as const, padding: '7px 10px', fontWeight: 700 }}>{h}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {excelSpeakingItems.map((it, i) => (
                              <tr key={i} style={{ borderTop: `1px solid ${PAGE_BORDER}` }}>
                                <td style={{ fontSize: 12, color: PAGE_TEXT, padding: '6px 10px' }}>{it.topic}</td>
                                <td style={{ fontSize: 12, color: PAGE_GRAY, padding: '6px 10px' }}>{it.marks ?? 5}</td>
                                <td style={{ fontSize: 12, color: PAGE_GRAY, padding: '6px 10px' }}>{it.timeLimit ?? 90}s</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div style={{ border: `1px dashed ${PAGE_BORDER}`, borderRadius: 10, padding: '24px 16px', textAlign: 'center' as const, color: PAGE_GRAY, fontSize: 12.5 }}>
                      Upload a file above to see a preview here.
                    </div>
                  )}
                </>
              )}
            </>
          ) : tab === 'reading' ? (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {(['single', 'bulk'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setReadingSubTab(t)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                      border: `1.5px solid ${readingSubTab === t ? ORANGE : PAGE_BORDER}`,
                      background: readingSubTab === t ? 'rgba(255,122,0,0.1)' : CARD_BG,
                      color: readingSubTab === t ? ORANGE : PAGE_TEXT,
                    }}
                  >
                    {t === 'single' ? 'Single Upload' : 'Bulk Upload'}
                  </button>
                ))}
              </div>

              {readingSubTab === 'single' ? (
                <>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 6 }}>Sentence</label>
                  <textarea
                    value={singleSentence}
                    onChange={(e) => setSingleSentence(e.target.value)}
                    rows={3}
                    placeholder="The quick brown fox jumps over the lazy dog."
                    style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '10px 12px', fontSize: 13, color: PAGE_TEXT, background: CARD_BG, fontFamily: 'inherit', outline: 'none', marginBottom: 14, resize: 'vertical' as const }}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 6 }}>Marks</label>
                      <input type="number" min={1} value={singleMarks} onChange={(e) => setSingleMarks(Number(e.target.value))}
                        style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '8px 12px', fontSize: 13.5, color: PAGE_TEXT, background: CARD_BG }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 6 }}>Time Limit</label>
                      <select value={singleTimeLimit} onChange={(e) => setSingleTimeLimit(Number(e.target.value))}
                        style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '8px 12px', fontSize: 13.5, color: PAGE_TEXT, background: CARD_BG }}>
                        {TIME_LIMIT_OPTIONS.map((t) => <option key={t} value={t}>{t} sec</option>)}
                      </select>
                    </div>
                  </div>

                  {error && <div style={{ fontSize: 12.5, color: '#fb737a', marginBottom: 12 }}>{error}</div>}

                  <button
                    onClick={handleAddSingleReading}
                    disabled={submitting}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      background: ORANGE, border: 'none', color: '#fff', borderRadius: 10, padding: '10px 0',
                      fontSize: 13.5, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1,
                    }}
                  >
                    <FaPlus size={12} /> {submitting ? 'Saving…' : 'Add Sentence'}
                  </button>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY }}>Upload from Excel (optional)</label>
                    <button
                      onClick={downloadReadingTemplate}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', color: ORANGE, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                    >
                      <FaFileExcel size={11} /> Download Template
                    </button>
                  </div>
                  <label style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer',
                    border: `1.5px dashed ${ORANGE}66`, borderRadius: 10, padding: '12px', marginBottom: 10, background: 'rgba(255,122,0,0.1)',
                  }}>
                    <FaFileExcel size={14} color={ORANGE} />
                    <span style={{ fontSize: 12.5, color: ORANGE, fontWeight: 600 }}>Choose .xlsx / .xls / .csv — Sentence, Marks, Time Limit columns</span>
                    <input
                      type="file" accept=".xlsx,.xls,.csv"
                      onChange={(e) => handleReadingExcelUpload(e.target.files)}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {excelLoadMsg && <div style={{ fontSize: 11.5, color: '#45dd75', marginBottom: 10 }}>{excelLoadMsg}</div>}

                  {excelParsedItems ? (
                    // File loaded — its own Sentence/Marks/Time Limit columns
                    // are used directly, so there's nothing left to type.
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY }}>
                          {excelParsedItems.length} sentence{excelParsedItems.length === 1 ? '' : 's'} from file
                        </label>
                        <button
                          onClick={() => { setBulkSentences(''); setExcelParsedItems(null); setExcelLoadMsg(null) }}
                          style={{ border: 'none', background: 'none', color: PAGE_GRAY, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                        >
                          Clear
                        </button>
                      </div>
                      <div style={{ maxHeight: 320, overflowY: 'auto' as const, border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, marginBottom: 14 }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
                          <thead>
                            <tr style={{ background: PAGE_BG, position: 'sticky' as const, top: 0 }}>
                              {['Sentence', 'Marks', 'Time Limit'].map((h) => (
                                <th key={h} style={{ textAlign: 'left' as const, fontSize: 10.5, color: PAGE_GRAY, textTransform: 'uppercase' as const, padding: '7px 10px', fontWeight: 700 }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {excelParsedItems.map((it, i) => (
                              <tr key={i} style={{ borderTop: `1px solid ${PAGE_BORDER}` }}>
                                <td style={{ fontSize: 12, color: PAGE_TEXT, padding: '6px 10px' }}>{it.sentence}</td>
                                <td style={{ fontSize: 12, color: PAGE_GRAY, padding: '6px 10px' }}>{it.marks ?? 5}</td>
                                <td style={{ fontSize: 12, color: PAGE_GRAY, padding: '6px 10px' }}>{it.timeLimit ?? 30}s</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div style={{ border: `1px dashed ${PAGE_BORDER}`, borderRadius: 10, padding: '24px 16px', textAlign: 'center' as const, color: PAGE_GRAY, fontSize: 12.5 }}>
                      Upload a file above to see a preview here.
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 6 }}>Audio files (select multiple)</label>
              <input
                type="file" accept="audio/*" multiple
                onChange={(e) => handleAudioFilesChange(e.target.files)}
                style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '8px 10px', fontSize: 12.5, color: PAGE_TEXT, background: CARD_BG, marginBottom: 12 }}
              />

              {audioFiles.length > 0 && (
                <div style={{ maxHeight: 260, overflowY: 'auto' as const, marginBottom: 14, display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                  {audioFiles.map((f, i) => (
                    <div key={i} style={{ border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, padding: 8 }}>
                      <div style={{ fontSize: 11.5, color: PAGE_GRAY, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{f.name}</div>
                      <input
                        value={transcripts[i] ?? ''}
                        onChange={(e) => setTranscripts((prev) => prev.map((t, idx) => (idx === i ? e.target.value : t)))}
                        placeholder="Exact transcript for this clip…"
                        style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 6, padding: '6px 8px', fontSize: 12.5, color: PAGE_TEXT, background: PAGE_BG }}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 6 }}>Marks (each)</label>
                  <input type="number" min={1} value={listeningMarks} onChange={(e) => setListeningMarks(Number(e.target.value))}
                    style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '8px 12px', fontSize: 13.5, color: PAGE_TEXT, background: CARD_BG }} />
                </div>
                <div>
                  <label style={{ fontSize: 12.5, fontWeight: 600, color: PAGE_GRAY, display: 'block', marginBottom: 6 }}>Time Limit (each)</label>
                  <select value={listeningTimeLimit} onChange={(e) => setListeningTimeLimit(Number(e.target.value))}
                    style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '8px 12px', fontSize: 13.5, color: PAGE_TEXT, background: CARD_BG }}>
                    {TIME_LIMIT_OPTIONS.map((t) => <option key={t} value={t}>{t} sec</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {(() => {
            const hasOwnSubmit =
              (tab === 'reading' && readingSubTab === 'single') ||
              (tab === 'speaking' && speakingSubTab === 'single') ||
              (tab === 'jumbled' && jumbledSubTab === 'single')
            if (hasOwnSubmit) return null

            const label = tab === 'reading'
              ? `Add ${excelParsedItems?.length || ''} Sentence${excelParsedItems?.length === 1 ? '' : 's'}`
              : tab === 'speaking'
                ? `Add ${excelSpeakingItems?.length || ''} Topic${excelSpeakingItems?.length === 1 ? '' : 's'}`
                : tab === 'grammar'
                  ? grammarSubTab === 'bulk'
                    ? `Add ${excelGrammarItems?.length || ''} Question${excelGrammarItems?.length === 1 ? '' : 's'}`
                    : `Add ${grammarBatch.length || ''} Question${grammarBatch.length === 1 ? '' : 's'}`
                  : tab === 'jumbled'
                    ? `Add ${excelJumbledItems?.length || ''} Sentence${excelJumbledItems?.length === 1 ? '' : 's'}`
                    : tab === 'storytelling'
                      ? storySubTab === 'bulk'
                        ? `Add ${excelStoryItems?.length || ''} Prompt${excelStoryItems?.length === 1 ? '' : 's'}`
                        : 'Add Story Prompt'
                      : tab === 'passages'
                        ? `Save Passage (${passageBatch.length} Question${passageBatch.length === 1 ? '' : 's'})`
                        : `Add ${audioFiles.length || ''} Clip${audioFiles.length === 1 ? '' : 's'}`

            const onClick = tab === 'storytelling'
              ? (storySubTab === 'bulk' ? handleAddStoryBulk : handleAddStory)
              : tab === 'passages' ? handleAddPassage
              : handleBulkAdd

            return (
              <>
                {error && <div style={{ fontSize: 12.5, color: '#fb737a', marginBottom: 12 }}>{error}</div>}
                <button
                  onClick={onClick}
                  disabled={submitting}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: ORANGE, border: 'none', color: '#fff', borderRadius: 10, padding: '10px 0',
                    fontSize: 13.5, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1,
                  }}
                >
                  <FaUpload size={12} />
                  {submitting ? 'Saving…' : label}
                </button>
              </>
            )
          })()}
          </div>
        </div>

        {/* Bank */}
        <div className="aui-card">
          <div className="aui-toolbar">
            <div className="aui-toolbar-title">
              <h3>{meta.label} bank</h3>
              <p>
                {loading ? 'Loading…' : <><b>{items.length}</b> item{items.length === 1 ? '' : 's'} · <b>{activeCount}</b> active · students get <b>{shownPerAttempt}</b> per attempt</>}
              </p>
            </div>
            <div className="aui-toolbar-filters">
              <SearchInput value={search} onChange={setSearch} placeholder={`Search ${meta.label.toLowerCase()}…`} />
              <AdminSelect
                label="Status"
                value={statusFilter}
                onChange={(v) => setStatusFilter(v as '' | 'active' | 'inactive')}
                options={[{ value: '', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
              />
            </div>
          </div>

          {!loading && items.length > 0 && activeCount < shownPerAttempt && (
            <div className="aui-alert lsrw-warn">
              <FaExclamationTriangle />
              <span>Only <b>{activeCount}</b> active item{activeCount === 1 ? '' : 's'}, but students are set to get <b>{shownPerAttempt}</b> per attempt.</span>
            </div>
          )}

          {loading ? (
            <div className="aui-empty"><FaSpinner className="aui-spin" /><p>Loading {meta.label.toLowerCase()} items…</p></div>
          ) : items.length === 0 ? (
            <EmptyState icon={meta.icon} title="Nothing in this bank yet" text="Add items with the form on the left." />
          ) : visibleItems.length === 0 ? (
            <EmptyState icon={FaSearch} title="No items match" text="Try a different search or status." action={<button type="button" className="aui-btn" onClick={() => { setSearch(''); setStatusFilter('') }}>Clear filters</button>} />
          ) : (
            <div className="lsrw-list">
              {visibleItems.map((item, idx) => (
                <div key={item._id} className={`lsrw-row${item.isActive ? '' : ' is-off'}`}>
                  <span className="lsrw-num">{idx + 1}</span>
                  {tab === 'storytelling' && item.promptType === 'image' && item.imageUrl && (
                    <img src={item.imageUrl} alt="" className="lsrw-thumb" />
                  )}
                  <div className="lsrw-body">
                    {tab === 'grammar' ? (
                      <>
                        <div className="lsrw-tags">
                          <span className="aui-badge aui-badge-green">{item.type === 'mcq' ? 'MCQ' : 'Fill in the blank'}</span>
                          {item.category && <span className="aui-badge aui-badge-muted">{item.category}</span>}
                        </div>
                        <p className="lsrw-text">{item.question}</p>
                        {item.type === 'mcq'
                          ? <div className="lsrw-opts">{item.options?.map((opt, i) => <span key={i} className={opt === item.correctAnswer ? 'is-correct' : ''}>{opt}</span>)}</div>
                          : <div className="lsrw-answer">Answer: {item.correctAnswer}</div>}
                      </>
                    ) : tab === 'jumbled' ? (
                      <div className="lsrw-parts">{item.parts?.map((p, i) => <span key={i}>{p}</span>)}</div>
                    ) : tab === 'storytelling' ? (
                      <>
                        <div className="lsrw-tags"><span className="aui-badge aui-badge-purple">{item.promptType === 'image' ? 'Image prompt' : 'Text prompt'}</span></div>
                        {item.promptType === 'text' && <p className="lsrw-text">{item.promptText}</p>}
                        {!!item.points?.length && <ol className="lsrw-points">{item.points.map((p, i) => <li key={i}>{p}</li>)}</ol>}
                      </>
                    ) : tab === 'passages' ? (
                      <>
                        {item.audioUrl && <audio controls src={item.audioUrl} className="lsrw-audio" />}
                        <div className="lsrw-pq">
                          {item.questions?.map((pq, qi) => (
                            <div key={qi}>
                              <p className="lsrw-text">{qi + 1}. {pq.question}</p>
                              <div className="lsrw-opts">{pq.options.map((opt, oi) => <span key={oi} className={opt === pq.correctAnswer ? 'is-correct' : ''}>{opt}</span>)}</div>
                              <small className="lsrw-meta">{pq.marks} mark{pq.marks === 1 ? '' : 's'} · {pq.timeLimit}s</small>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="lsrw-text">{item.sentence ?? item.topic}</p>
                        {item.audioUrl && <audio controls src={item.audioUrl} className="lsrw-audio lsrw-audio-sm" />}
                      </>
                    )}
                    <small className="lsrw-meta">
                      {tab === 'passages'
                        ? `${item.questions?.length ?? 0} question${item.questions?.length === 1 ? '' : 's'}`
                        : `${item.marks} mark${item.marks === 1 ? '' : 's'} · ${item.timeLimit ?? (tab === 'storytelling' ? 120 : tab === 'jumbled' ? 60 : 30)}s`}
                      {' · added '}{new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </small>
                  </div>
                  <div className="lsrw-actions">
                    <label className="lsrw-switch" title={item.isActive ? 'Active: students can get this item' : 'Inactive: hidden from students'}>
                      <input type="checkbox" checked={item.isActive} onChange={() => toggleActive(item)} />
                      <span className="aui-toggle-track" />
                      <span>{item.isActive ? 'Active' : 'Off'}</span>
                    </label>
                    <button type="button" className="aui-icon-btn lsrw-del" title="Delete" aria-label="Delete" onClick={() => setDeleteId(item._id)}><FaTrash size={11} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal show={deleteId !== null} onHide={() => !deleting && setDeleteId(null)} centered contentClassName="aui-modal" backdropClassName="aui-backdrop">
        <div className="aui-modal-head">
          <span className="lsrw-del-icon"><FaTrash /></span>
          <div>
            <h3>Delete this item?</h3>
            <p>{meta.label} bank</p>
          </div>
        </div>
        <div className="aui-modal-body"><p className="lsrw-modal-text">It is removed from the bank for good. To hide it from students but keep it, switch it off instead.</p></div>
        <div className="aui-modal-foot">
          <button type="button" className="aui-btn" onClick={() => setDeleteId(null)} disabled={deleting}>Cancel</button>
          <button type="button" className="aui-btn aui-btn-danger" onClick={confirmDelete} disabled={deleting}>
            {deleting ? <FaSpinner className="aui-spin" /> : <FaTrash size={11} />} Delete
          </button>
        </div>
      </Modal>

      <style>{LSRW_CSS}</style>
    </AdminPage>
  )
}

const LSRW_CSS = `
  .lsrw-settings { margin-bottom: 1rem; }
  .lsrw-counts { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 10px; padding: 1rem 1.1rem 1.1rem; }
  .lsrw-count { display: flex; flex-direction: column; gap: 8px; margin: 0; padding: 0.7rem 0.8rem; border: 1px solid #25282b; border-radius: 10px; background: #111315; cursor: text; transition: border-color 0.15s; }
  .lsrw-count:hover { border-color: #3a3f45; }
  .lsrw-count.is-current { border-color: color-mix(in srgb, var(--acc) 55%, transparent); background: color-mix(in srgb, var(--acc) 7%, #111315); }
  .lsrw-count-head { display: flex; align-items: center; gap: 6px; color: #c3c7ca; font-size: 0.74rem; font-weight: 650; }
  .lsrw-count-head svg { color: var(--acc); }
  .lsrw-count-input { display: flex; align-items: baseline; gap: 6px; }
  .lsrw-count-input input { width: 100%; min-width: 0; padding: 0; border: 0; outline: none; background: none; color: #fff; font-size: 1.35rem; font-weight: 800; line-height: 1.1; color-scheme: dark; }
  .lsrw-count-input small { color: #6b7280; font-size: 0.68rem; }

  .lsrw-tabs { margin-bottom: 1rem; overflow-x: auto; }
  .lsrw-tabs .aui-tabs { min-width: 100%; }
  .lsrw-tabs .aui-tabs button { flex: 1 0 auto; justify-content: center; }

  .lsrw-grid { display: grid; grid-template-columns: minmax(360px, 430px) minmax(0, 1fr); gap: 1rem; align-items: start; }
  .lsrw-title { display: flex; align-items: center; gap: 12px; }
  .lsrw-title-icon { display: grid; place-items: center; width: 36px; height: 36px; flex: 0 0 36px; border: 1px solid color-mix(in srgb, var(--acc) 35%, transparent); border-radius: 10px; background: color-mix(in srgb, var(--acc) 12%, transparent); color: var(--acc); font-size: 0.95rem; }

  /* Add form: the original inline-styled fields, recoloured for the dark kit */
  .lsrw-form { padding: 1.1rem 1.2rem 1.2rem; color: #eceef0; }
  .lsrw-form label { color: #c3c7ca !important; }
  .lsrw-form input:not([type=radio]):not([type=checkbox]), .lsrw-form textarea, .lsrw-form select {
    border: 1px solid #34383d !important; border-radius: 8px !important; background: #17191c !important; color: #f1f5f9 !important; color-scheme: dark; outline: none; transition: border-color 0.15s, box-shadow 0.15s;
  }
  .lsrw-form input:not([type=radio]):not([type=checkbox]):focus, .lsrw-form textarea:focus, .lsrw-form select:focus { border-color: rgba(255,122,0,0.75) !important; box-shadow: 0 0 0 3px rgba(255,122,0,0.12); }
  .lsrw-form input::placeholder, .lsrw-form textarea::placeholder { color: #5b616a; }
  .lsrw-form input[type=file] { padding: 6px 8px !important; color: #9da2a8 !important; cursor: pointer; }
  .lsrw-form input[type=file]::file-selector-button { margin-right: 10px; padding: 5px 12px; border: 1px solid #34383d; border-radius: 6px; background: #202327; color: #e0e3e5; font-weight: 600; cursor: pointer; }
  .lsrw-form input[type=radio], .lsrw-form input[type=checkbox] { accent-color: #ff7a00; }
  .lsrw-form select option { background: #17191c; color: #f1f5f9; }
  .lsrw-form audio { color-scheme: dark; }
  .lsrw-form button:disabled { cursor: not-allowed; }

  .lsrw-warn { margin: 0.85rem 1rem 0 !important; border-color: rgba(244,180,63,0.3) !important; background: rgba(244,180,63,0.07) !important; color: #f4c46b !important; }
  .lsrw-warn svg { color: #f4b43f; }
  .lsrw-list { max-height: 72vh; overflow-y: auto; }
  .lsrw-row { display: flex; align-items: flex-start; gap: 12px; padding: 0.85rem 1rem; border-bottom: 1px solid #202326; transition: background 0.15s; }
  .lsrw-row:last-child { border-bottom: 0; }
  .lsrw-row:hover { background: #0f1113; }
  .lsrw-row.is-off .lsrw-body { opacity: 0.55; }
  .lsrw-num { display: grid; place-items: center; min-width: 26px; height: 26px; padding: 0 4px; border-radius: 7px; background: #17191c; color: #6b7280; font-size: 0.7rem; font-weight: 700; }
  .lsrw-thumb { width: 72px; height: 54px; flex: 0 0 72px; border: 1px solid #25282b; border-radius: 8px; object-fit: cover; }
  .lsrw-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
  .lsrw-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .lsrw-text { margin: 0; color: #eceef0; font-size: 0.85rem; line-height: 1.55; }
  .lsrw-meta { color: #6b7280; font-size: 0.72rem; }
  .lsrw-opts, .lsrw-parts { display: flex; flex-wrap: wrap; gap: 5px; }
  .lsrw-opts span { padding: 2px 9px; border: 1px solid #2c3034; border-radius: 6px; background: #141618; color: #9da2a8; font-size: 0.74rem; }
  .lsrw-opts span.is-correct { border-color: rgba(69,221,117,0.45); background: rgba(69,221,117,0.1); color: #45dd75; font-weight: 700; }
  .lsrw-parts span { padding: 3px 10px; border: 1px solid rgba(34,211,238,0.3); border-radius: 6px; background: rgba(34,211,238,0.08); color: #67e8f9; font-size: 0.78rem; font-weight: 600; }
  .lsrw-answer { color: #45dd75; font-size: 0.76rem; font-weight: 700; }
  .lsrw-points { margin: 0; padding-left: 1.1rem; color: #a6abb0; font-size: 0.78rem; line-height: 1.6; }
  .lsrw-audio { width: 100%; max-width: 420px; height: 36px; color-scheme: dark; }
  .lsrw-audio-sm { max-width: 320px; height: 32px; }
  .lsrw-pq { display: flex; flex-direction: column; gap: 8px; }
  .lsrw-pq > div { display: flex; flex-direction: column; gap: 5px; padding: 0.6rem 0.75rem; border: 1px solid #25282b; border-radius: 8px; background: #111315; }
  .lsrw-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .lsrw-switch { position: relative; display: inline-flex; align-items: center; gap: 7px; margin: 0; color: #9da2a8; font-size: 0.72rem; font-weight: 650; cursor: pointer; }
  .lsrw-switch input { position: absolute; opacity: 0; pointer-events: none; }
  .lsrw-switch .aui-toggle-track { margin-top: 0; }
  .lsrw-switch input:checked + .aui-toggle-track { background: #31c45e; }
  .lsrw-switch input:checked + .aui-toggle-track::after { background: #fff; transform: translateX(16px); }
  .lsrw-switch input:checked ~ span:last-child { color: #45dd75; }
  .lsrw-switch span:last-child { min-width: 36px; }
  .lsrw-del:hover { border-color: rgba(251,95,103,0.55) !important; color: #fb737a !important; }
  .lsrw-del-icon { display: grid; place-items: center; width: 36px; height: 36px; flex: 0 0 36px; border: 1px solid rgba(251,95,103,0.3); border-radius: 10px; background: rgba(251,95,103,0.1); color: #fb737a; }
  .lsrw-modal-text { margin: 0; color: #a6abb0; font-size: 0.84rem; line-height: 1.6; }

  @media (max-width: 1399.98px) { .lsrw-counts { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
  @media (max-width: 1199.98px) { .lsrw-grid { grid-template-columns: 1fr; } }
  @media (max-width: 767.98px) {
    .lsrw-counts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .lsrw-row { flex-wrap: wrap; }
    .lsrw-actions { width: 100%; justify-content: flex-end; }
  }
`

export default LSRWContentAdmin
