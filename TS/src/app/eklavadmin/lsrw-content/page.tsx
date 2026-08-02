import { useEffect, useState } from 'react'
import { Spinner } from 'react-bootstrap'
import { FaHeadphones, FaBook, FaTrash, FaUpload, FaLayerGroup, FaCog, FaSave, FaMicrophone, FaFont, FaPlus, FaRandom, FaImage, FaFileExcel } from 'react-icons/fa'
import * as XLSX from 'xlsx'
import PageMetaData from '@/components/PageMetaData'
import { useAuthContext } from '@/context/useAuthContext'

const PAGE_BG     = 'var(--dash-page-bg, #f8fafc)'
const CARD_BG     = 'var(--dash-card-bg, #ffffff)'
const PAGE_BORDER = 'var(--dash-border, #e2e8f0)'
const PAGE_TEXT   = 'var(--dash-text, #0f172a)'
const PAGE_GRAY   = 'var(--dash-gray, #64748b)'
const ORANGE = '#ff7a00'
const BLUE   = '#2563eb'
const PURPLE = '#7c3aed'
const GREEN  = '#16a34a'
const CYAN   = '#0891b2'
const PINK   = '#db2777'
const TEAL   = '#0d9488'

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

  const handleDelete = async (id: string) => {
    if (!user?.token) return
    if (!confirm('Delete this item? This cannot be undone.')) return
    try {
      const res = await fetch(`${baseURL}/api/eklavadmin/${endpointBase}/${id}`, { method: 'DELETE', headers: authHeader })
      const data = await res.json()
      if (data.success) setItems((prev) => prev.filter((i) => i._id !== id))
    } catch (err) { console.error(err) }
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

  const accent = tab === 'reading' ? ORANGE : tab === 'listening' ? BLUE : tab === 'speaking' ? PURPLE : tab === 'grammar' ? GREEN : tab === 'jumbled' ? CYAN : tab === 'storytelling' ? PINK : TEAL

  return (
    <div style={{ background: PAGE_BG, minHeight: '100vh', padding: '24px 28px 40px', fontFamily: '"Segoe UI", system-ui, sans-serif' }}>
      <PageMetaData title="LSRW Content Bank" />

      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: PAGE_TEXT, margin: '0 0 4px' }}>Listening, Reading & Speaking — Content Bank</h2>
        <p style={{ color: PAGE_GRAY, fontSize: 13, margin: 0 }}>Bulk-upload a large pool of sentences/audio/topics, then choose how many each student gets — a random subset every attempt.</p>
      </div>

      {/* Round settings */}
      <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '16px 20px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FaCog size={13} color={PAGE_TEXT} />
            <span style={{ fontWeight: 700, fontSize: 14, color: PAGE_TEXT }}>Round Settings — questions per student attempt</span>
          </div>
          <button
            onClick={saveSettings}
            disabled={savingSettings}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: PAGE_TEXT, border: 'none', color: '#fff', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: savingSettings ? 'not-allowed' : 'pointer', flexShrink: 0 }}
          >
            <FaSave size={11} /> {savingSettings ? 'Saving…' : settingsSaved ? 'Saved ✓' : 'Save Settings'}
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, alignItems: 'flex-end', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: PAGE_GRAY, display: 'block', marginBottom: 4 }}>Reading questions shown</label>
            <input
              type="number" min={0} value={readingCount}
              onChange={(e) => setReadingCount(Number(e.target.value))}
              style={{ width: 120, border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, padding: '7px 10px', fontSize: 13.5, color: PAGE_TEXT, background: CARD_BG }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: PAGE_GRAY, display: 'block', marginBottom: 4 }}>Listening questions shown</label>
            <input
              type="number" min={0} value={listeningCount}
              onChange={(e) => setListeningCount(Number(e.target.value))}
              style={{ width: 120, border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, padding: '7px 10px', fontSize: 13.5, color: PAGE_TEXT, background: CARD_BG }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: PAGE_GRAY, display: 'block', marginBottom: 4 }}>Speaking topics shown</label>
            <input
              type="number" min={0} value={speakingCount}
              onChange={(e) => setSpeakingCount(Number(e.target.value))}
              style={{ width: 120, border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, padding: '7px 10px', fontSize: 13.5, color: PAGE_TEXT, background: CARD_BG }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: PAGE_GRAY, display: 'block', marginBottom: 4 }}>Grammar questions shown</label>
            <input
              type="number" min={0} value={grammarCount}
              onChange={(e) => setGrammarCount(Number(e.target.value))}
              style={{ width: 120, border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, padding: '7px 10px', fontSize: 13.5, color: PAGE_TEXT, background: CARD_BG }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: PAGE_GRAY, display: 'block', marginBottom: 4 }}>Jumbled sentences shown</label>
            <input
              type="number" min={0} value={jumbledCount}
              onChange={(e) => setJumbledCount(Number(e.target.value))}
              style={{ width: 120, border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, padding: '7px 10px', fontSize: 13.5, color: PAGE_TEXT, background: CARD_BG }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: PAGE_GRAY, display: 'block', marginBottom: 4 }}>Story prompts shown</label>
            <input
              type="number" min={0} value={storyCount}
              onChange={(e) => setStoryCount(Number(e.target.value))}
              style={{ width: 120, border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, padding: '7px 10px', fontSize: 13.5, color: PAGE_TEXT, background: CARD_BG }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: PAGE_GRAY, display: 'block', marginBottom: 4 }}>Passages shown</label>
            <input
              type="number" min={0} value={passageCount}
              onChange={(e) => setPassageCount(Number(e.target.value))}
              style={{ width: 120, border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, padding: '7px 10px', fontSize: 13.5, color: PAGE_TEXT, background: CARD_BG }}
            />
          </div>
          <span style={{ fontSize: 11.5, color: PAGE_GRAY, width: '100%' }}>
            Each attempt randomly picks {readingCount} Reading sentences, {listeningCount} Listening clips, {speakingCount} Speaking topics, {grammarCount} Grammar questions, {jumbledCount} Jumbled sentences, {storyCount} Story prompts, and {passageCount} full Passages (each with its own questions).
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', marginBottom: 20, background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 12,
        boxShadow: '0 1px 4px rgba(0,0,0,0.03)', overflowX: 'auto' as const,
      }}>
        {(['reading', 'listening', 'speaking', 'grammar', 'jumbled', 'storytelling', 'passages'] as const).map((t) => {
          const tColor = t === 'reading' ? ORANGE : t === 'listening' ? BLUE : t === 'speaking' ? PURPLE : t === 'grammar' ? GREEN : t === 'jumbled' ? CYAN : t === 'storytelling' ? PINK : TEAL
          const tBg = t === 'reading' ? '#fff7ed' : t === 'listening' ? '#eff6ff' : t === 'speaking' ? '#f5f3ff' : t === 'grammar' ? '#f0fdf4' : t === 'jumbled' ? '#ecfeff' : t === 'storytelling' ? '#fdf2f8' : '#f0fdfa'
          const active = tab === t
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: '1 1 0', minWidth: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '12px 10px', cursor: 'pointer', border: 'none', borderBottom: `2.5px solid ${active ? tColor : 'transparent'}`,
                background: active ? tBg : 'transparent',
                color: active ? tColor : PAGE_GRAY,
                fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap' as const,
              }}
            >
              {t === 'reading' ? <FaBook size={11} /> : t === 'listening' ? <FaHeadphones size={11} /> : t === 'speaking' ? <FaMicrophone size={11} /> : t === 'grammar' ? <FaFont size={11} /> : t === 'jumbled' ? <FaRandom size={11} /> : t === 'storytelling' ? <FaImage size={11} /> : <FaHeadphones size={11} />}
              {t === 'reading' ? 'Reading' : t === 'listening' ? 'Listening' : t === 'speaking' ? 'Speaking' : t === 'grammar' ? 'Grammar' : t === 'jumbled' ? 'Jumbled' : t === 'storytelling' ? 'Story Telling' : 'Passages'}
            </button>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Bulk add form */}
        <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <FaLayerGroup size={12} color={accent} />
            <span style={{ fontWeight: 700, fontSize: 14, color: PAGE_TEXT }}>
              {tab === 'storytelling' ? 'Add Story Prompt' : tab === 'passages' ? 'Add Passage' : `Bulk Add ${tab === 'reading' ? 'Reading' : tab === 'listening' ? 'Listening' : tab === 'speaking' ? 'Speaking' : tab === 'grammar' ? 'Grammar' : 'Jumbled Sentence'} Items`}
            </span>
          </div>

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
                        background: passageQSubTab === t ? '#f0fdfa' : CARD_BG,
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
                      border: `1.5px dashed ${TEAL}66`, borderRadius: 10, padding: '12px', marginBottom: 4, background: '#f0fdfa',
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
                      <button onClick={() => removeFromPassageBatch(i)} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', flexShrink: 0 }}>
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
                      background: storySubTab === t ? '#fdf2f8' : CARD_BG,
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
                      background: storyPromptType === t ? '#fdf2f8' : CARD_BG,
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
                    style={{ width: '100%', border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: '8px 10px', fontSize: 12.5, color: PAGE_TEXT, background: CARD_BG, marginBottom: 12 }}
                  />
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
                    border: `1.5px dashed ${PINK}66`, borderRadius: 10, padding: '12px', marginBottom: 10, background: '#fdf2f8',
                  }}>
                    <FaFileExcel size={14} color={PINK} />
                    <span style={{ fontSize: 12.5, color: PINK, fontWeight: 600 }}>Choose .xlsx / .xls / .csv — Prompt Text, Points, Marks columns</span>
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleStoryExcelUpload(e.target.files)} style={{ display: 'none' }} />
                  </label>
                  {excelStoryMsg && <div style={{ fontSize: 11.5, color: '#16a34a', marginBottom: 10 }}>{excelStoryMsg}</div>}

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
                      background: jumbledSubTab === t ? '#ecfeff' : CARD_BG,
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
                  {error && <div style={{ fontSize: 12.5, color: '#dc2626', marginBottom: 12 }}>{error}</div>}
                  <button
                    onClick={handleAddSingleJumbled}
                    disabled={submitting}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: CYAN, border: 'none', color: '#fff', borderRadius: 10, padding: '10px 0', fontSize: 13.5, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}
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
                    border: `1.5px dashed ${CYAN}66`, borderRadius: 10, padding: '12px', marginBottom: 10, background: '#ecfeff',
                  }}>
                    <FaFileExcel size={14} color={CYAN} />
                    <span style={{ fontSize: 12.5, color: CYAN, fontWeight: 600 }}>Choose .xlsx / .xls / .csv — Sentence, Marks, Time Limit columns</span>
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleJumbledExcelUpload(e.target.files)} style={{ display: 'none' }} />
                  </label>
                  {excelJumbledMsg && <div style={{ fontSize: 11.5, color: '#16a34a', marginBottom: 10 }}>{excelJumbledMsg}</div>}

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
                      background: grammarSubTab === t ? '#f0fdf4' : CARD_BG,
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
                    border: `1.5px dashed ${GREEN}66`, borderRadius: 10, padding: '12px', marginBottom: 10, background: '#f0fdf4',
                  }}>
                    <FaFileExcel size={14} color={GREEN} />
                    <span style={{ fontSize: 12.5, color: GREEN, fontWeight: 600 }}>Choose .xlsx / .xls / .csv — Type, Category, Question, Options, Answer columns</span>
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleGrammarExcelUpload(e.target.files)} style={{ display: 'none' }} />
                  </label>
                  {excelGrammarMsg && <div style={{ fontSize: 11.5, color: '#16a34a', marginBottom: 10 }}>{excelGrammarMsg}</div>}

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
                      background: draftType === t ? '#f0fdf4' : CARD_BG,
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
                      <button onClick={() => removeFromGrammarBatch(i)} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', flexShrink: 0 }}>
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
                      background: speakingSubTab === t ? '#f5f3ff' : CARD_BG,
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
                  {error && <div style={{ fontSize: 12.5, color: '#dc2626', marginBottom: 12 }}>{error}</div>}
                  <button
                    onClick={handleAddSingleSpeaking}
                    disabled={submitting}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: PURPLE, border: 'none', color: '#fff', borderRadius: 10, padding: '10px 0', fontSize: 13.5, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}
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
                    border: `1.5px dashed ${PURPLE}66`, borderRadius: 10, padding: '12px', marginBottom: 10, background: '#f5f3ff',
                  }}>
                    <FaFileExcel size={14} color={PURPLE} />
                    <span style={{ fontSize: 12.5, color: PURPLE, fontWeight: 600 }}>Choose .xlsx / .xls / .csv — Topic, Marks, Time Limit columns</span>
                    <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => handleSpeakingExcelUpload(e.target.files)} style={{ display: 'none' }} />
                  </label>
                  {excelSpeakingMsg && <div style={{ fontSize: 11.5, color: '#16a34a', marginBottom: 10 }}>{excelSpeakingMsg}</div>}

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
                      background: readingSubTab === t ? '#fff7ed' : CARD_BG,
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

                  {error && <div style={{ fontSize: 12.5, color: '#dc2626', marginBottom: 12 }}>{error}</div>}

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
                    border: `1.5px dashed ${ORANGE}66`, borderRadius: 10, padding: '12px', marginBottom: 10, background: '#fff7ed',
                  }}>
                    <FaFileExcel size={14} color={ORANGE} />
                    <span style={{ fontSize: 12.5, color: ORANGE, fontWeight: 600 }}>Choose .xlsx / .xls / .csv — Sentence, Marks, Time Limit columns</span>
                    <input
                      type="file" accept=".xlsx,.xls,.csv"
                      onChange={(e) => handleReadingExcelUpload(e.target.files)}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {excelLoadMsg && <div style={{ fontSize: 11.5, color: '#16a34a', marginBottom: 10 }}>{excelLoadMsg}</div>}

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
                {error && <div style={{ fontSize: 12.5, color: '#dc2626', marginBottom: 12 }}>{error}</div>}
                <button
                  onClick={onClick}
                  disabled={submitting}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    background: accent, border: 'none', color: '#fff', borderRadius: 10, padding: '10px 0',
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

        {/* List */}
        <div style={{ background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${PAGE_BORDER}`, fontWeight: 700, fontSize: 14, color: PAGE_TEXT }}>
            {items.length} {tab === 'reading' ? 'Reading' : tab === 'listening' ? 'Listening' : tab === 'speaking' ? 'Speaking' : tab === 'grammar' ? 'Grammar' : tab === 'jumbled' ? 'Jumbled Sentence' : tab === 'storytelling' ? 'Story' : 'Passage'} item{items.length === 1 ? '' : 's'} in the bank
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' as const }}>
              <Spinner animation="border" style={{ color: accent, width: 22, height: 22 }} />
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' as const, color: PAGE_GRAY, fontSize: 13 }}>No items yet — add some on the left.</div>
          ) : tab === 'grammar' ? (
            <div style={{ maxHeight: '70vh', overflowY: 'auto' as const }}>
              {items.map((item) => (
                <div key={item._id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 20px', borderBottom: `1px solid ${PAGE_BORDER}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: GREEN, background: '#f0fdf4', border: `1px solid ${GREEN}55`, borderRadius: 6, padding: '1px 7px' }}>
                        {item.type === 'mcq' ? 'MCQ' : 'FILL'}
                      </span>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: PAGE_GRAY }}>{item.category}</span>
                    </div>
                    <div style={{ fontSize: 13.5, color: PAGE_TEXT, marginBottom: 6 }}>{item.question}</div>
                    {item.type === 'mcq' ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                        {item.options?.map((opt, i) => (
                          <span key={i} style={{
                            fontSize: 11, borderRadius: 6, padding: '2px 8px',
                            border: `1px solid ${opt === item.correctAnswer ? '#22c55e' : PAGE_BORDER}`,
                            background: opt === item.correctAnswer ? '#f0fdf4' : PAGE_BG,
                            color: opt === item.correctAnswer ? '#16a34a' : PAGE_GRAY,
                            fontWeight: opt === item.correctAnswer ? 700 : 400,
                          }}>{opt}</span>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 11.5, color: '#16a34a', fontWeight: 700 }}>Answer: {item.correctAnswer}</div>
                    )}
                    <div style={{ fontSize: 11.5, color: PAGE_GRAY, marginTop: 6 }}>
                      {item.marks} marks · {item.timeLimit ?? 30} sec time limit · added {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActive(item)}
                    style={{
                      flexShrink: 0, border: `1px solid ${item.isActive ? '#22c55e' : PAGE_BORDER}`,
                      background: item.isActive ? '#f0fdf4' : PAGE_BG, color: item.isActive ? '#16a34a' : PAGE_GRAY,
                      borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {item.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    aria-label="Delete"
                    style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, border: `1px solid ${PAGE_BORDER}`, background: CARD_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <FaTrash size={11} color="#dc2626" />
                  </button>
                </div>
              ))}
            </div>
          ) : tab === 'jumbled' ? (
            <div style={{ maxHeight: '70vh', overflowY: 'auto' as const }}>
              {items.map((item) => (
                <div key={item._id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 20px', borderBottom: `1px solid ${PAGE_BORDER}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 6 }}>
                      {item.parts?.map((p, i) => (
                        <span key={i} style={{ fontSize: 12, borderRadius: 6, padding: '2px 8px', border: `1px solid ${CYAN}55`, background: '#ecfeff', color: CYAN, fontWeight: 600 }}>{p}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: 11.5, color: PAGE_GRAY }}>
                      {item.marks} marks · {item.timeLimit ?? 60} sec time limit · added {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActive(item)}
                    style={{
                      flexShrink: 0, border: `1px solid ${item.isActive ? '#22c55e' : PAGE_BORDER}`,
                      background: item.isActive ? '#f0fdf4' : PAGE_BG, color: item.isActive ? '#16a34a' : PAGE_GRAY,
                      borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {item.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    aria-label="Delete"
                    style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, border: `1px solid ${PAGE_BORDER}`, background: CARD_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <FaTrash size={11} color="#dc2626" />
                  </button>
                </div>
              ))}
            </div>
          ) : tab === 'storytelling' ? (
            <div style={{ maxHeight: '70vh', overflowY: 'auto' as const }}>
              {items.map((item) => (
                <div key={item._id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 20px', borderBottom: `1px solid ${PAGE_BORDER}` }}>
                  {item.promptType === 'image' && item.imageUrl && (
                    <img src={item.imageUrl} alt="" style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: PINK, background: '#fdf2f8', border: `1px solid ${PINK}55`, borderRadius: 6, padding: '1px 7px' }}>
                        {item.promptType === 'image' ? 'IMAGE' : 'TEXT'}
                      </span>
                    </div>
                    {item.promptType === 'text' && (
                      <div style={{ fontSize: 13.5, color: PAGE_TEXT, marginBottom: 6 }}>{item.promptText}</div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 6 }}>
                      {item.points?.map((p, i) => (
                        <span key={i} style={{ fontSize: 11, borderRadius: 6, padding: '2px 8px', border: `1px solid ${PAGE_BORDER}`, background: PAGE_BG, color: PAGE_GRAY }}>{p}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: 11.5, color: PAGE_GRAY }}>
                      {item.marks} marks · {item.timeLimit ?? 120}s · added {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActive(item)}
                    style={{
                      flexShrink: 0, border: `1px solid ${item.isActive ? '#22c55e' : PAGE_BORDER}`,
                      background: item.isActive ? '#f0fdf4' : PAGE_BG, color: item.isActive ? '#16a34a' : PAGE_GRAY,
                      borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {item.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    aria-label="Delete"
                    style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, border: `1px solid ${PAGE_BORDER}`, background: CARD_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <FaTrash size={11} color="#dc2626" />
                  </button>
                </div>
              ))}
            </div>
          ) : tab === 'passages' ? (
            <div style={{ maxHeight: '70vh', overflowY: 'auto' as const }}>
              {items.map((item) => (
                <div key={item._id} style={{ padding: '14px 20px', borderBottom: `1px solid ${PAGE_BORDER}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      {item.audioUrl && <audio controls src={item.audioUrl} style={{ width: '100%', marginBottom: 6 }} />}
                      <div style={{ fontSize: 11.5, color: PAGE_GRAY }}>
                        {item.questions?.length ?? 0} question{item.questions?.length === 1 ? '' : 's'} · added {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleActive(item)}
                      style={{
                        flexShrink: 0, border: `1px solid ${item.isActive ? '#22c55e' : PAGE_BORDER}`,
                        background: item.isActive ? '#f0fdf4' : PAGE_BG, color: item.isActive ? '#16a34a' : PAGE_GRAY,
                        borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      {item.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      aria-label="Delete"
                      style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, border: `1px solid ${PAGE_BORDER}`, background: CARD_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <FaTrash size={11} color="#dc2626" />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                    {item.questions?.map((q, qi) => (
                      <div key={qi} style={{ border: `1px solid ${PAGE_BORDER}`, borderRadius: 8, padding: '8px 12px' }}>
                        <div style={{ fontSize: 12.5, color: PAGE_TEXT, marginBottom: 4 }}>{qi + 1}. {q.question}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                          {q.options.map((opt, oi) => (
                            <span key={oi} style={{
                              fontSize: 10.5, borderRadius: 6, padding: '2px 7px',
                              border: `1px solid ${opt === q.correctAnswer ? '#22c55e' : PAGE_BORDER}`,
                              background: opt === q.correctAnswer ? '#f0fdf4' : PAGE_BG,
                              color: opt === q.correctAnswer ? '#16a34a' : PAGE_GRAY,
                              fontWeight: opt === q.correctAnswer ? 700 : 400,
                            }}>{opt}</span>
                          ))}
                        </div>
                        <div style={{ fontSize: 10.5, color: PAGE_GRAY, marginTop: 4 }}>{q.marks} marks · {q.timeLimit} sec</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ maxHeight: '70vh', overflowY: 'auto' as const }}>
              {items.map((item) => (
                <div key={item._id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 20px', borderBottom: `1px solid ${PAGE_BORDER}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, color: PAGE_TEXT, marginBottom: 6 }}>{item.sentence ?? item.topic}</div>
                    {item.audioUrl && (
                      <audio controls src={item.audioUrl} style={{ height: 32, maxWidth: 320 }} />
                    )}
                    <div style={{ fontSize: 11.5, color: PAGE_GRAY, marginTop: 6 }}>
                      {item.marks} marks · {item.timeLimit ?? 30} sec time limit · added {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActive(item)}
                    style={{
                      flexShrink: 0, border: `1px solid ${item.isActive ? '#22c55e' : PAGE_BORDER}`,
                      background: item.isActive ? '#f0fdf4' : PAGE_BG, color: item.isActive ? '#16a34a' : PAGE_GRAY,
                      borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    }}
                  >
                    {item.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    aria-label="Delete"
                    style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, border: `1px solid ${PAGE_BORDER}`, background: CARD_BG, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <FaTrash size={11} color="#dc2626" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LSRWContentAdmin
