import { useEffect, useMemo, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import {
  FiAlertTriangle, FiArrowLeft, FiCheckCircle, FiChevronDown, FiChevronLeft, FiChevronRight, FiChevronUp, FiClock, FiCode, FiFlag, FiPlay, FiTerminal,
  FiSend, FiX, FiLoader, FiList, FiEdit3, FiInfo, FiWifi, FiMonitor, FiRefreshCw, FiAward, FiShield, FiLayers, FiMaximize,
} from 'react-icons/fi'
import { LANGUAGES, LANG_LABEL, LEVEL_COLOR, MONACO_LANG, STARTER, TYPE_LABEL, type Answer, type Api, type StartPayload, type StudentExam } from './api'

/* Full-screen exam: instructions → questions by section (MCQ / fill / coding) with timer,
   autosave and auto-submit when time runs out. */

type RunOut = { results?: { passed: boolean; stdout: string; stderr: string; input: string; expected: string }[]; custom?: { stdout: string; stderr: string }; error?: string }

const ExamRunner = ({ api, exam, companyName, companyLogo, onExit, onFinished }: {
  api: Api
  exam: StudentExam
  companyName: string
  companyLogo?: string
  onExit: () => void
  onFinished: (attemptId: string) => void
}) => {
  const [phase, setPhase] = useState<'intro' | 'test'>('intro')
  const [data, setData] = useState<StartPayload | null>(null)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [marked, setMarked] = useState<Record<string, boolean>>({})
  const [idx, setIdx] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [confirm, setConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [runOut, setRunOut] = useState<Record<string, RunOut>>({})
  const [running, setRunning] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [outOpen, setOutOpen] = useState(true)
  // proctoring: full screen + tab-switch detection (browsers can't block switching, only detect it)
  const [warn, setWarn] = useState<null | 'tab' | 'fullscreen'>(null)
  const [violations, setViolations] = useState(0)
  const violationsRef = useRef(0)
  const [clipNote, setClipNote] = useState(false)
  const clipTimer = useRef<number | undefined>(undefined)
  const offsetRef = useRef(0)
  const answersRef = useRef(answers)
  answersRef.current = answers
  const submittedRef = useRef(false)

  const questions = data?.questions || []
  const q = questions[idx]

  /* ── full screen helpers ── */
  const enterFullscreen = () => {
    const el = document.documentElement as any
    if (document.fullscreenElement) return
    try { (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el)?.catch?.(() => {}) } catch { /* not supported */ }
  }
  const exitFullscreen = () => {
    const d = document as any
    if (!document.fullscreenElement) return
    try { (d.exitFullscreen || d.webkitExitFullscreen)?.call(d)?.catch?.(() => {}) } catch { /* ignore */ }
  }

  /* ── start / resume ── */
  const begin = async () => {
    enterFullscreen()   // must run inside the click, before any await
    setStarting(true); setError('')
    try {
      const d = await api.start(exam._id)
      offsetRef.current = new Date(d.attempt.serverNow).getTime() - Date.now()
      setData(d)
      setAnswers(d.attempt.draft || {})
      setIdx(0)
      setPhase('test')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setStarting(false)
    }
  }

  /* ── timer ── */
  useEffect(() => {
    if (phase !== 'test' || !data) return
    const end = new Date(data.attempt.endsAt).getTime()
    const tick = () => {
      const left = Math.max(0, Math.round((end - (Date.now() + offsetRef.current)) / 1000))
      setRemaining(left)
      if (left <= 0 && !submittedRef.current) submit(true)
    }
    tick()
    const t = window.setInterval(tick, 1000)
    return () => window.clearInterval(t)
  }, [phase, data]) // eslint-disable-line

  /* ── autosave (debounced) ── */
  useEffect(() => {
    if (phase !== 'test' || !data || submittedRef.current) return
    setSaveState('saving')
    const t = window.setTimeout(() => {
      api.saveDraft(data.attempt._id, answersRef.current).then(() => setSaveState('saved')).catch(() => setSaveState('idle'))
    }, 1500)
    return () => window.clearTimeout(t)
  }, [answers]) // eslint-disable-line

  /* ── leaving warning ── */
  useEffect(() => {
    if (phase !== 'test') return
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [phase])

  /* ── tab switch / leaving full screen ── */
  useEffect(() => {
    if (phase !== 'test') return
    const flag = (kind: 'tab' | 'fullscreen') => {
      if (submittedRef.current) return
      if (kind === 'tab') { violationsRef.current += 1; setViolations(violationsRef.current) }
      setWarn(w => w || kind)
    }
    const onVisibility = () => { if (document.hidden) flag('tab') }
    const onBlur = () => { window.setTimeout(() => { if (!document.hasFocus() && !document.hidden) flag('tab') }, 300) }
    const onFullscreen = () => { if (!document.fullscreenElement) flag('fullscreen') }
    const blockKeys = (e: KeyboardEvent) => {
      // common shortcuts for switching or opening tabs
      if ((e.ctrlKey || e.metaKey) && ['t', 'n', 'w', 'Tab'].includes(e.key)) e.preventDefault()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)
    document.addEventListener('fullscreenchange', onFullscreen)
    window.addEventListener('keydown', blockKeys)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('fullscreenchange', onFullscreen)
      window.removeEventListener('keydown', blockKeys)
    }
  }, [phase])

  const backToExam = () => { setWarn(null); enterFullscreen() }

  /* ── no copy / cut / paste in the code editor ── */
  const blockClipboard = () => {
    setClipNote(true)
    window.clearTimeout(clipTimer.current)
    clipTimer.current = window.setTimeout(() => setClipNote(false), 2200)
  }
  const onEditorMount = (editor: any, monaco: any) => {
    const noop = () => blockClipboard()
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, noop)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyX, noop)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, noop)
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.Insert, noop)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Insert, noop)
    // safety net: if text still arrives by paste (e.g. browser menu), undo it
    editor.onDidPaste?.(() => { editor.trigger('block-paste', 'undo', null); blockClipboard() })
  }
  const stopClip = (e: React.SyntheticEvent) => { e.preventDefault(); e.stopPropagation(); blockClipboard() }

  const submit = async (auto = false) => {
    if (!data || submittedRef.current) return
    submittedRef.current = true
    setSubmitting(true); setConfirm(false)
    try {
      await api.submit(data.attempt._id, answersRef.current, auto, violationsRef.current)
      exitFullscreen()
      onFinished(data.attempt._id)
    } catch (e: any) {
      submittedRef.current = false
      setError(e.message)
      setSubmitting(false)
    }
  }

  const setAnswer = (qid: string, patch: Answer) => setAnswers(a => ({ ...a, [qid]: { ...a[qid], ...patch } }))
  const isAnswered = (qq: { _id: string; type: string }) => {
    const a = answers[qq._id]
    if (!a) return false
    if (qq.type === 'mcq') return !!a.option
    if (qq.type === 'fill') return !!a.text?.trim()
    return !!a.code?.trim() && a.code.trim() !== (STARTER[a.language || ''] || '').trim()
  }

  const bySection = useMemo(() => {
    const map: { name: string; items: { q: typeof questions[number]; i: number }[] }[] = []
    questions.forEach((qq, i) => {
      let s = map.find(m => m.name === qq.section)
      if (!s) { s = { name: qq.section, items: [] }; map.push(s) }
      s.items.push({ q: qq, i })
    })
    return map
  }, [questions])
  const answeredCount = questions.filter(isAnswered).length
  const markedCount = questions.filter(qq => marked[qq._id]).length

  /* ── coding helpers ── */
  const lang = q?.type === 'coding' ? (answers[q._id]?.language || 'c') : 'c'
  const code = q?.type === 'coding' ? (answers[q._id]?.code ?? STARTER[lang] ?? '') : ''
  const runCode = async () => {
    if (!data || !q) return
    setRunning(true)
    try {
      const out = await api.run(data.attempt._id, { questionId: q._id, code, language: lang, stdin: useCustom ? customInput : undefined })
      setRunOut(r => ({ ...r, [q._id]: out }))
      setOutOpen(true)
    } catch (e: any) {
      setRunOut(r => ({ ...r, [q._id]: { error: e.message } }))
    } finally {
      setRunning(false)
    }
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  const hh = Math.floor(remaining / 3600)
  const timeText = hh ? `${hh}:${String(Math.floor((remaining % 3600) / 60)).padStart(2, '0')}:${ss}` : `${mm}:${ss}`

  /* ───────────────────────── Intro (exam briefing) ───────────────────────── */
  if (phase === 'intro') {
    const types = exam.byType || { mcq: 0, fill: 0, coding: 0 }
    const typeRows = ([['mcq', 'Multiple choice', FiList], ['fill', 'Fill in the blank', FiEdit3], ['coding', 'Coding', FiCode]] as const).filter(([k]) => types[k])
    const rules = [
      ...(exam.instructions ? exam.instructions.split(/\n+/).map(l => l.trim()).filter(Boolean) : []),
      `You have ${exam.durationMins} minutes for all ${exam.questionCount} questions. You can move between sections at any time.`,
      'The timer starts when you press Start exam and keeps running even if you close or refresh the page.',
      'Answers are saved automatically as you go. When the time is up, the exam is submitted for you.',
      'The exam opens in full screen. Switching tabs, windows or apps is not allowed — every switch is recorded.',
      'There is no negative marking — attempt every question.',
      ...(types.coding ? ['Coding questions: use Run to check your code against the sample cases. All test cases, including hidden ones, are checked when you submit, and marks are given for each case passed.'] : []),
      ...(types.fill ? ['Fill in the blank: type only the missing word or value. Spelling counts; capital letters do not.'] : []),
    ]
    return (
      <div className="cpx-root">
        <div className="cpb-top">
          <button type="button" className="cpx-link" onClick={onExit}><FiArrowLeft /> {companyName}</button>
          <span className="cpb-top-sep" />
          <span className="cpx-logo cpx-logo-sm">{companyLogo ? <img src={companyLogo} alt="" /> : <b>{companyName[0]}</b>}</span>
          <div className="cpb-top-title">
            <b>{exam.title}</b>
            <small>{companyName} practice paper</small>
          </div>
          <span className="cpx-level" style={{ ['--lvl' as any]: LEVEL_COLOR[exam.level] }}>{exam.level}</span>
          <span className="cpb-top-time"><FiClock /> {exam.durationMins} min</span>
        </div>

        <div className="cpb-scroll">
        <div className="cpb-wrap">
          <div className="cpb-main">
            <section className="cpb-hero">
              <span className="cpb-eyebrow"><FiShield /> Exam briefing</span>
              <h1>{exam.title}</h1>
              <p>Read the pattern and instructions below before you begin. This paper follows the {companyName} assessment format.</p>
            </section>

            <section className="cpb-card">
              <h3><FiLayers /> Exam pattern</h3>
              <table className="cpb-table">
                <thead><tr><th>#</th><th>Section</th><th>Questions</th><th>Marks</th><th>Question types</th></tr></thead>
                <tbody>
                  {exam.sections.map((sec, i) => (
                    <tr key={sec.name}>
                      <td className="cpb-n">{i + 1}</td>
                      <td><b>{sec.name}</b></td>
                      <td>{sec.count}</td>
                      <td>{sec.marks ?? '—'}</td>
                      <td>
                        <div className="cpb-types">
                          {sec.types?.mcq ? <span>{sec.types.mcq} MCQ</span> : null}
                          {sec.types?.fill ? <span>{sec.types.fill} Fill</span> : null}
                          {sec.types?.coding ? <span className="is-code">{sec.types.coding} Coding</span> : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr><td /><td>Total</td><td>{exam.questionCount}</td><td>{exam.totalMarks}</td><td>{exam.durationMins} minutes</td></tr></tfoot>
              </table>
            </section>

            <section className="cpb-card">
              <h3><FiInfo /> Instructions</h3>
              <ol className="cpb-rules">
                {rules.map((r, i) => <li key={i}><span>{i + 1}</span><p>{r}</p></li>)}
              </ol>
            </section>

            <section className="cpb-card">
              <h3><FiMonitor /> Before you begin</h3>
              <div className="cpb-checks">
                <div><FiWifi /><b>Stable internet</b><small>Answers sync every few seconds</small></div>
                <div><FiMonitor /><b>Laptop or desktop</b><small>Best for coding questions</small></div>
                <div><FiRefreshCw /><b>Don't open other tabs</b><small>Stay focused on the paper</small></div>
              </div>
            </section>
          </div>

          <div className="cpb-side">
            <div className="cpb-summary">
              <h4>Summary</h4>
              <div className="cpb-sum-grid">
                <div><FiClock /><b>{exam.durationMins}</b><span>Minutes</span></div>
                <div><FiList /><b>{exam.questionCount}</b><span>Questions</span></div>
                <div><FiAward /><b>{exam.totalMarks}</b><span>Marks</span></div>
                <div><FiLayers /><b>{exam.sections.length}</b><span>Sections</span></div>
              </div>
              {typeRows.length > 0 && (
                <div className="cpb-typelist">
                  {typeRows.map(([k, label, Icon]) => (
                    <div key={k}><Icon /><span>{label}</span><b>{types[k]}</b></div>
                  ))}
                </div>
              )}
              <div className="cpb-marking">
                <div><span>Correct answer</span><b className="ok">Full marks</b></div>
                <div><span>Wrong / skipped</span><b>0</b></div>
                {types.coding ? <div><span>Coding</span><b>Per test case</b></div> : null}
              </div>
              {exam.attempts > 0 && <p className="cpb-prev">Your best so far: <b>{Math.round(exam.bestPercentage || 0)}%</b> in {exam.attempts} attempt{exam.attempts === 1 ? '' : 's'}</p>}
              {error && <div className="cpx-alert"><FiAlertTriangle /> {error}</div>}
              <label className={`cpb-agree${agreed ? ' is-on' : ''}`}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                <span className="cpb-box" aria-hidden="true">{agreed && <FiCheckCircle />}</span>
                <span>I have read the instructions and I'm ready to start.</span>
              </label>
              <button type="button" className="cpx-btn cpx-btn-primary cpb-start" onClick={begin} disabled={starting || !agreed}>
                {starting ? <FiLoader className="cpx-spin" /> : <FiPlay />} {exam.inProgressAttemptId ? 'Resume exam' : 'Start exam'}
              </button>
              <small className="cpb-note">{exam.inProgressAttemptId ? 'Your earlier attempt is still running — the timer continues from where it is.' : `The ${exam.durationMins}-minute timer starts as soon as you press Start.`}</small>
            </div>
          </div>
        </div>
        </div>
        <ExamStyles />
      </div>
    )
  }

  if (!data || !q) return <div className="cpx-root cpx-center"><FiLoader className="cpx-spin" /> Loading…<ExamStyles /></div>

  /* ───────────────────────── Test ───────────────────────── */
  const out = runOut[q._id]
  return (
    <div className="cpx-root">
      <div className="cpx-head">
        <span className="cpx-logo cpx-logo-sm">{companyLogo ? <img src={companyLogo} alt="" /> : <b>{companyName[0]}</b>}</span>
        <div className="cpx-head-title">
          <b>{data.exam.title}</b>
          <small>{companyName} · <span style={{ color: LEVEL_COLOR[data.exam.level] }}>{data.exam.level}</span></small>
        </div>
        <span className={`cpx-save ${saveState}`}>{saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'All answers saved' : ''}</span>
        <div className={`cpx-timer${remaining <= 300 ? ' is-low' : ''}`}><FiClock /> {timeText}</div>
        <button type="button" className="cpx-btn cpx-btn-primary" onClick={() => setConfirm(true)} disabled={submitting}>
          {submitting ? <FiLoader className="cpx-spin" /> : <FiSend />} Submit
        </button>
      </div>
      <div className="cpx-progress"><span style={{ width: `${(answeredCount / questions.length) * 100}%` }} /></div>

      <div className="cpx-body">
        <div className="cpx-side">
          <div className="cpx-side-sum">
            <div><b>{answeredCount}</b><span>Answered</span></div>
            <div><b>{questions.length - answeredCount}</b><span>Left</span></div>
            <div><b>{markedCount}</b><span>Marked</span></div>
          </div>
          {bySection.map(sec => (
            <div key={sec.name} className="cpx-sec">
              <h5>{sec.name} <span>{sec.items.filter(x => isAnswered(x.q)).length}/{sec.items.length}</span></h5>
              <div className="cpx-grid">
                {sec.items.map(({ q: qq, i }) => (
                  <button key={qq._id} type="button"
                    className={`cpx-num${i === idx ? ' is-current' : ''}${isAnswered(qq) ? ' is-done' : ''}${marked[qq._id] ? ' is-marked' : ''}`}
                    onClick={() => setIdx(i)} title={`${TYPE_LABEL[qq.type]} · ${qq.marks} mark${qq.marks === 1 ? '' : 's'}`}>
                    {i + 1}{qq.type === 'coding' && <FiCode className="cpx-num-ic" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="cpx-legend">
            <span><i className="is-current" /> Current</span><span><i className="is-done" /> Answered</span>
            <span><i className="is-marked" /> Marked</span><span><i /> Not answered</span>
          </div>
        </div>

        <div className={`cpx-main${q.type === 'coding' ? ' is-coding' : ''}`}>
          {error && <div className="cpx-alert"><FiAlertTriangle /> {error}<button type="button" onClick={() => setError('')}><FiX /></button></div>}
          <div className="cpx-q-head">
            <span className="cpx-q-badge">{idx + 1}</span>
            <div className="cpx-q-info">
              <b>Question {idx + 1} <small>of {questions.length}</small></b>
              <span>
                {q.section}
                {q.section.toLowerCase() !== TYPE_LABEL[q.type].toLowerCase() && <> · <i className={`cpx-type t-${q.type}`}>{TYPE_LABEL[q.type]}</i></>}
                <span className="cpx-dot">•</span>{q.marks} mark{q.marks === 1 ? '' : 's'}
              </span>
            </div>
            <button type="button" className={`cpx-mark${marked[q._id] ? ' is-on' : ''}`} onClick={() => setMarked(m => ({ ...m, [q._id]: !m[q._id] }))}>
              <FiFlag /> {marked[q._id] ? 'Marked for review' : 'Mark for review'}
            </button>
          </div>

          {q.type !== 'coding' ? (
            <div className="cpx-q-card">
              <p className="cpx-q-text">{q.question}</p>
              {q.type === 'mcq' && (
                <div className="cpx-opts" role="radiogroup">
                  {(['A', 'B', 'C', 'D'] as const).filter(k => q.options?.[k]).map(k => {
                    const on = answers[q._id]?.option === k
                    return (
                      <button key={k} type="button" role="radio" aria-checked={on} className={`cpx-opt${on ? ' is-on' : ''}`} onClick={() => setAnswer(q._id, { option: on ? undefined : k })}>
                        <span className="cpx-opt-key">{k}</span><span className="cpx-opt-text">{q.options?.[k]}</span><span className="cpx-radio" />
                      </button>
                    )
                  })}
                </div>
              )}
              {q.type === 'fill' && (
                <div className="cpx-fill">
                  <label htmlFor={`fill-${q._id}`}><FiEdit3 /> Your answer</label>
                  <input id={`fill-${q._id}`} value={answers[q._id]?.text || ''} placeholder="Type the missing word or value" onChange={e => setAnswer(q._id, { text: e.target.value })} autoComplete="off" />
                </div>
              )}
            </div>
          ) : (
            <div className="cpx-code">
              <div className="cpx-code-problem">
                <p className="cpx-q-text">{q.question}</p>
                {q.coding?.inputFormat && <><h6>Input format</h6><pre>{q.coding.inputFormat}</pre></>}
                {q.coding?.outputFormat && <><h6>Output format</h6><pre>{q.coding.outputFormat}</pre></>}
                {q.coding?.constraints && <><h6>Constraints</h6><pre>{q.coding.constraints}</pre></>}
                {(q.coding?.samples || []).map((s, i) => (
                  <div key={i} className="cpx-sample">
                    <h6>Example {i + 1}</h6>
                    <div><span>Input</span><pre>{s.input || '(empty)'}</pre></div>
                    <div><span>Output</span><pre>{s.output}</pre></div>
                  </div>
                ))}
                <p className="cpx-hidden-note"><FiInfo /> {q.coding?.totalTests || 0} test cases are checked when you submit; marks are given for each one passed.</p>
              </div>
              <div className="cpx-code-editor">
                <div className="cpx-editor-bar">
                  <select value={lang} onChange={e => {
                    const next = e.target.value
                    const cur = answers[q._id]?.code
                    const pristine = !cur || Object.values(STARTER).some(t => t.trim() === cur.trim()) || (cur.includes('read input, print output') && cur.length < 400)
                    setAnswer(q._id, { language: next, ...(pristine ? { code: STARTER[next] || '' } : {}) })
                  }}>
                    {LANGUAGES.map(l => <option key={l} value={l}>{LANG_LABEL[l]}</option>)}
                  </select>
                  <label className="cpx-custom"><input type="checkbox" checked={useCustom} onChange={e => setUseCustom(e.target.checked)} /> Custom input</label>
                  <button type="button" className="cpx-btn cpx-btn-run" onClick={runCode} disabled={running}>{running ? <FiLoader className="cpx-spin" /> : <FiPlay />} Run</button>
                </div>
                <div className="cpx-editor" onCopyCapture={stopClip} onCutCapture={stopClip} onPasteCapture={stopClip} onDropCapture={stopClip} onContextMenu={e => e.preventDefault()}>
                  {clipNote && <div className="cpx-clip-note"><FiShield /> Copy and paste are disabled in the coding section</div>}
                  <Editor
                    height="100%"
                    language={MONACO_LANG[lang] || 'plaintext'}
                    value={code}
                    theme="vs-dark"
                    onChange={v => setAnswer(q._id, { code: v || '', language: lang })}
                    onMount={onEditorMount}
                    options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, automaticLayout: true, tabSize: 4, contextmenu: false, dragAndDrop: false, dropIntoEditor: { enabled: false } } as any}
                  />
                </div>
                {useCustom && <textarea className="cpx-stdin" rows={3} placeholder="Custom input (stdin)" value={customInput} onChange={e => setCustomInput(e.target.value)} />}
                {out && (
                  <div className="cpx-out-head">
                    <button type="button" className="cpx-out-toggle" onClick={() => setOutOpen(o => !o)}>
                      <FiTerminal /> Output
                      {!out.error && out.results && (
                        <span className={`cpx-out-sum ${out.results.every(r => r.passed) ? 'ok' : 'no'}`}>{out.results.filter(r => r.passed).length}/{out.results.length} passed</span>
                      )}
                      {outOpen ? <FiChevronDown /> : <FiChevronUp />}
                    </button>
                    <button type="button" className="cpx-out-close" onClick={() => setRunOut(r => { const n = { ...r }; delete n[q._id]; return n })} aria-label="Close output"><FiX /></button>
                  </div>
                )}
                {(!out || outOpen) && <div className="cpx-output">
                  {!out ? <span className="cpx-muted">Run your code to see the output here.</span>
                    : out.error ? <span className="cpx-bad">{out.error}</span>
                      : out.custom ? (
                        <>
                          <b>Output</b><pre>{out.custom.stdout || '(no output)'}</pre>
                          {out.custom.stderr && <><b className="cpx-bad">Errors</b><pre className="cpx-bad">{out.custom.stderr}</pre></>}
                        </>
                      ) : (
                        <>
                          <b>{out.results?.filter(r => r.passed).length}/{out.results?.length} sample test{out.results?.length === 1 ? '' : 's'} passed</b>
                          {out.results?.map((r, i) => (
                            <div key={i} className={`cpx-test ${r.passed ? 'is-pass' : 'is-fail'}`}>
                              <span>{r.passed ? <FiCheckCircle /> : <FiX />} Example {i + 1}</span>
                              {!r.passed && <div className="cpx-test-io"><div><small>Expected</small><pre>{r.expected}</pre></div><div><small>Your output</small><pre>{r.stdout || '(no output)'}</pre></div></div>}
                              {r.stderr && <pre className="cpx-bad">{r.stderr}</pre>}
                            </div>
                          ))}
                        </>
                      )}
                </div>}
              </div>
            </div>
          )}

          <div className="cpx-foot">
            <button type="button" className="cpx-btn" onClick={() => setIdx(i => Math.max(0, i - 1))} disabled={idx === 0}><FiChevronLeft /> Previous</button>
            {(answers[q._id]?.option || answers[q._id]?.text) && q.type !== 'coding' && (
              <button type="button" className="cpx-link" onClick={() => setAnswers(a => { const n = { ...a }; delete n[q._id]; return n })}>Clear answer</button>
            )}
            {/* one way to submit: the Submit button in the header */}
            {idx < questions.length - 1
              ? <button type="button" className="cpx-btn cpx-btn-next" onClick={() => setIdx(i => i + 1)}>Next <FiChevronRight /></button>
              : <span />}
          </div>
        </div>
      </div>

      {confirm && (
        <div className="cpx-overlay" onClick={() => setConfirm(false)}>
          <div className="cpx-dialog" onClick={e => e.stopPropagation()}>
            <span className={`cpx-dialog-icon${answeredCount < questions.length ? ' is-warn' : ''}`}>{answeredCount < questions.length ? <FiAlertTriangle /> : <FiCheckCircle />}</span>
            <h3>Submit the exam?</h3>
            <p>{answeredCount < questions.length ? <>You have <b>{questions.length - answeredCount}</b> unanswered question{questions.length - answeredCount === 1 ? '' : 's'}.</> : 'All questions are answered.'}{markedCount ? ` ${markedCount} marked for review.` : ''}</p>
            <div className="cpx-dialog-stats">
              <div><b>{answeredCount}</b><span>Answered</span></div>
              <div><b>{questions.length - answeredCount}</b><span>Not answered</span></div>
              <div><b>{timeText}</b><span>Time left</span></div>
            </div>
            <div className="cpx-dialog-actions">
              <button type="button" className="cpx-btn" onClick={() => setConfirm(false)}>Keep working</button>
              <button type="button" className="cpx-btn cpx-btn-primary" onClick={() => submit(false)}><FiSend /> Submit now</button>
            </div>
          </div>
        </div>
      )}
      {warn && !submitting && (
        <div className="cpx-overlay cpx-overlay-warn">
          <div className="cpx-dialog">
            <span className="cpx-dialog-icon is-danger">{warn === 'tab' ? <FiAlertTriangle /> : <FiMaximize />}</span>
            <h3>{warn === 'tab' ? 'Switching tabs is restricted' : 'Stay in full screen'}</h3>
            <p>{warn === 'tab'
              ? 'You left the exam window. Switching tabs or apps is not allowed during the exam and every switch is recorded.'
              : 'The exam runs in full screen. Return to full screen to continue — the timer is still running.'}</p>
            {violations > 0 && <div className="cpx-violations">Tab switches recorded: <b>{violations}</b></div>}
            <button type="button" className="cpx-btn cpx-btn-primary cpx-return" onClick={backToExam}><FiMaximize /> Return to exam</button>
          </div>
        </div>
      )}
      {submitting && <div className="cpx-overlay"><div className="cpx-dialog"><FiLoader className="cpx-spin cpx-big" /><h3>Submitting…</h3><p>Checking your answers{questions.some(x => x.type === 'coding') ? ' and running the test cases' : ''}.</p></div></div>}
      <ExamStyles />
    </div>
  )
}

export const ExamStyles = () => (
  <style>{`
    .cpx-root { position: fixed; inset: 0; z-index: 1200; display: flex; flex-direction: column; background: var(--dash-page-bg, #f8fafc); color: var(--dash-text, #0f172a); font-size: 14px; }
    .cpx-center { align-items: center; justify-content: center; gap: 10px; flex-direction: row; color: var(--dash-gray, #64748b); }
    .cpx-spin { animation: cpx-rot 0.9s linear infinite; }
    .cpx-big { font-size: 2rem; color: #ff7a00; }
    @keyframes cpx-rot { to { transform: rotate(360deg); } }
    .cpx-muted { color: var(--dash-gray, #64748b); }
    .cpx-bad { color: #dc2626 !important; }
    .cpx-btn { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 16px; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 10px; background: var(--dash-card-bg, #fff); color: var(--dash-text, #0f172a); font-size: 0.85rem; font-weight: 600; cursor: pointer; }
    .cpx-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .cpx-btn-primary { border-color: transparent; background: linear-gradient(135deg, #ff7a00, #ff9a3c); color: #fff; box-shadow: 0 4px 14px rgba(255,122,0,0.25); }
    .cpx-btn-next { border-color: rgba(255,122,0,0.45); color: #ea580c; }
    .cpx-btn-run { height: 32px; border-color: rgba(22,163,74,0.45); color: #16a34a; }
    .cpx-link { display: inline-flex; align-items: center; gap: 6px; padding: 0; border: 0; background: none; color: var(--dash-gray, #64748b); font-size: 0.82rem; font-weight: 600; cursor: pointer; }
    .cpx-link:hover { color: #ea580c; }
    .cpx-alert { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border: 1px solid rgba(220,38,38,0.3); border-radius: 10px; background: rgba(220,38,38,0.06); color: #dc2626; font-size: 0.84rem; }
    .cpx-alert button { margin-left: auto; border: 0; background: none; color: inherit; cursor: pointer; }
    .cpx-logo { display: grid; place-items: center; width: 64px; height: 64px; flex: 0 0 auto; overflow: hidden; border: 2px solid #ff7a00; border-radius: 16px; background: #fff; }
    .cpx-logo img { width: 80%; height: 80%; object-fit: contain; }
    .cpx-logo b { color: #ff7a00; font-size: 1.4rem; }
    .cpx-logo-sm { width: 40px; height: 40px; border-width: 1.5px; border-radius: 10px; }
    .cpx-logo-sm b { font-size: 1rem; }
    .cpx-level { display: inline-block; padding: 2px 10px; border-radius: 99px; background: color-mix(in srgb, var(--lvl) 12%, transparent); color: var(--lvl); font-size: 0.74rem; font-weight: 700; }

    /* intro */
    .cpx-intro { width: 100%; max-width: 760px; margin: 0 auto; padding: 2rem 1rem; overflow-y: auto; }
    .cpx-intro-card { margin-top: 1rem; padding: 1.75rem; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 18px; background: var(--dash-card-bg, #fff); box-shadow: 0 10px 30px rgba(15,23,42,0.06); }
    .cpx-intro-head { display: flex; align-items: center; gap: 16px; }
    .cpx-intro-head small { color: var(--dash-gray, #64748b); font-weight: 600; }
    .cpx-intro-head h2 { margin: 2px 0 6px; font-size: 1.4rem; font-weight: 800; }
    .cpx-intro-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 1.5rem 0; }
    .cpx-intro-stats div { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 0.9rem; border-radius: 12px; background: var(--dash-page-bg, #f8fafc); }
    .cpx-intro-stats svg { color: #ff7a00; }
    .cpx-intro-stats b { font-size: 1.2rem; }
    .cpx-intro-stats span { color: var(--dash-gray, #64748b); font-size: 0.75rem; }
    .cpx-intro-card h4 { margin: 1.25rem 0 0.5rem; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--dash-gray, #64748b); }
    .cpx-intro-sections { margin: 0; padding: 0; list-style: none; }
    .cpx-intro-sections li { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--dash-border, #eef2f6); }
    .cpx-rules { margin: 0; padding-left: 1.1rem; color: var(--dash-text, #334155); line-height: 1.7; }
    .cpx-start { width: 100%; height: 46px; justify-content: center; margin-top: 1.5rem; font-size: 0.95rem; }

    /* test */
    .cpx-head { display: flex; align-items: center; gap: 12px; padding: 0.7rem 1.25rem; border-bottom: 1px solid var(--dash-border, #e2e8f0); background: var(--dash-card-bg, #fff); }
    .cpx-head-title { display: flex; flex-direction: column; min-width: 0; margin-right: auto; }
    .cpx-head-title b { font-size: 0.98rem; }
    .cpx-head-title small { color: var(--dash-gray, #64748b); font-weight: 600; }
    .cpx-save { color: var(--dash-gray, #64748b); font-size: 0.74rem; }
    .cpx-save.saved { color: #16a34a; }
    .cpx-timer { display: inline-flex; align-items: center; gap: 7px; height: 38px; padding: 0 14px; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 10px; font-size: 0.98rem; font-weight: 800; font-variant-numeric: tabular-nums; }
    .cpx-timer svg { color: #ff7a00; }
    .cpx-timer.is-low { border-color: rgba(220,38,38,0.5); background: rgba(220,38,38,0.06); color: #dc2626; animation: cpx-pulse 1.2s infinite; }
    @keyframes cpx-pulse { 50% { opacity: 0.6; } }
    .cpx-progress { height: 3px; background: var(--dash-border, #e2e8f0); }
    .cpx-progress span { display: block; height: 100%; background: linear-gradient(90deg, #ff7a00, #ffb15e); transition: width 0.3s; }
    .cpx-body { display: flex; flex: 1; min-height: 0; }
    .cpx-side { display: flex; flex-direction: column; gap: 1rem; width: 270px; flex-shrink: 0; padding: 1rem; overflow-y: auto; border-right: 1px solid var(--dash-border, #e2e8f0); background: var(--dash-card-bg, #fff); }
    .cpx-side-sum { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
    .cpx-side-sum div { display: flex; flex-direction: column; align-items: center; padding: 8px 4px; border-radius: 10px; background: var(--dash-page-bg, #f8fafc); }
    .cpx-side-sum b { font-size: 1.05rem; }
    .cpx-side-sum span { color: var(--dash-gray, #64748b); font-size: 0.68rem; }
    .cpx-sec h5 { display: flex; justify-content: space-between; margin: 0 0 8px; color: var(--dash-gray, #64748b); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; }
    .cpx-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
    .cpx-num { position: relative; display: grid; place-items: center; aspect-ratio: 1; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 9px; background: var(--dash-card-bg, #fff); color: var(--dash-gray, #64748b); font-size: 0.78rem; font-weight: 700; cursor: pointer; }
    .cpx-num-ic { position: absolute; right: 2px; bottom: 2px; width: 9px; height: 9px; opacity: 0.7; }
    .cpx-num.is-done { border-color: rgba(22,163,74,0.45); background: rgba(22,163,74,0.1); color: #16a34a; }
    .cpx-num.is-marked { border-color: rgba(139,92,246,0.5); background: rgba(139,92,246,0.1); color: #7c3aed; }
    .cpx-num.is-current { border-color: #ff7a00; background: #ff7a00; color: #fff; box-shadow: 0 0 0 3px rgba(255,122,0,0.2); }
    .cpx-legend { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: auto; padding-top: 0.75rem; border-top: 1px solid var(--dash-border, #eef2f6); color: var(--dash-gray, #64748b); font-size: 0.72rem; }
    .cpx-legend span { display: inline-flex; align-items: center; gap: 6px; }
    .cpx-legend i { width: 10px; height: 10px; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 3px; }
    .cpx-legend i.is-current { border-color: #ff7a00; background: #ff7a00; }
    .cpx-legend i.is-done { border-color: #16a34a; background: rgba(22,163,74,0.25); }
    .cpx-legend i.is-marked { border-color: #7c3aed; background: rgba(139,92,246,0.25); }
    .cpx-main { display: flex; flex: 1; flex-direction: column; gap: 1rem; min-width: 0; padding: 1.25rem 1.5rem; overflow-y: auto; }
    .cpx-q-head { display: flex; align-items: center; gap: 12px; }
    .cpx-q-badge { display: grid; place-items: center; width: 40px; height: 40px; flex: 0 0 40px; border-radius: 12px; background: linear-gradient(135deg, #ff7a00, #ff9a3c); color: #fff; font-size: 1rem; font-weight: 800; box-shadow: 0 4px 12px rgba(255,122,0,0.25); }
    .cpx-q-info { display: flex; flex-direction: column; min-width: 0; }
    .cpx-q-info b { color: var(--dash-text, #0f172a); font-size: 0.98rem; font-weight: 800; }
    .cpx-q-info b small { color: var(--dash-gray, #64748b); font-size: 0.85rem; font-weight: 600; }
    .cpx-q-info > span { color: var(--dash-gray, #64748b); font-size: 0.8rem; font-weight: 600; }
    .cpx-dot { margin: 0 8px; opacity: 0.6; }
    .cpx-type { font-style: normal; }
    .cpx-type.t-coding { color: #ea580c; }
    .cpx-type.t-fill { color: #7c3aed; }
    .cpx-type.t-mcq { color: #2563eb; }
    .cpx-out-head { display: flex; align-items: center; justify-content: space-between; padding: 6px 8px 6px 12px; border-top: 1px solid #2d2d2d; background: #202020; }
    .cpx-out-toggle { display: inline-flex; align-items: center; gap: 8px; padding: 4px 6px; border: 0; border-radius: 6px; background: none; color: #e5e7eb; font-size: 0.8rem; font-weight: 700; cursor: pointer; }
    .cpx-out-toggle:hover { background: #2a2a2a; }
    .cpx-out-sum { padding: 1px 8px; border-radius: 99px; font-size: 0.7rem; }
    .cpx-out-sum.ok { background: rgba(74,222,128,0.15); color: #4ade80; }
    .cpx-out-sum.no { background: rgba(248,113,113,0.15); color: #f87171; }
    .cpx-out-close { display: grid; place-items: center; width: 26px; height: 26px; border: 0; border-radius: 6px; background: none; color: #9ca3af; cursor: pointer; }
    .cpx-out-close:hover { background: #2a2a2a; color: #fff; }
    .cpx-q-no { margin-right: 4px; color: #ea580c; font-weight: 800; }
    .cpx-q-no small { color: var(--dash-gray, #64748b); font-weight: 600; }
    .cpx-chip { padding: 3px 10px; border-radius: 99px; background: var(--dash-card-bg, #fff); border: 1px solid var(--dash-border, #e2e8f0); color: var(--dash-gray, #64748b); font-size: 0.74rem; font-weight: 600; }
    .cpx-mark { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; padding: 5px 12px; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 99px; background: none; color: var(--dash-gray, #64748b); font-size: 0.76rem; font-weight: 700; cursor: pointer; }
    .cpx-mark.is-on { border-color: rgba(139,92,246,0.5); background: rgba(139,92,246,0.08); color: #7c3aed; }
    .cpx-q-card { width: 100%; max-width: 900px; padding: 1.5rem; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 16px; background: var(--dash-card-bg, #fff); }
    .cpx-q-text { margin: 0 0 1.25rem; font-size: 1.05rem; font-weight: 600; line-height: 1.6; white-space: pre-wrap; }
    .cpx-opts { display: flex; flex-direction: column; gap: 10px; }
    .cpx-opt { display: flex; align-items: center; gap: 14px; width: 100%; padding: 0.85rem 1rem; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 12px; background: var(--dash-page-bg, #f8fafc); color: inherit; text-align: left; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
    .cpx-opt:hover { border-color: rgba(255,122,0,0.45); }
    .cpx-opt.is-on { border-color: #ff7a00; background: rgba(255,122,0,0.07); }
    .cpx-opt-key { display: grid; place-items: center; width: 30px; height: 30px; flex: 0 0 30px; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 8px; background: var(--dash-card-bg, #fff); font-weight: 800; color: var(--dash-gray, #64748b); }
    .cpx-opt.is-on .cpx-opt-key { border-color: #ff7a00; background: #ff7a00; color: #fff; }
    .cpx-opt-text { flex: 1; font-size: 0.95rem; }
    .cpx-radio { position: relative; width: 18px; height: 18px; border: 2px solid var(--dash-border, #cbd5e1); border-radius: 50%; }
    .cpx-opt.is-on .cpx-radio { border-color: #ff7a00; }
    .cpx-opt.is-on .cpx-radio::after { content: ''; position: absolute; inset: 3px; border-radius: 50%; background: #ff7a00; }
    .cpx-fill label { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; color: var(--dash-gray, #64748b); font-size: 0.8rem; font-weight: 700; }
    .cpx-fill input { width: 100%; max-width: 420px; height: 46px; padding: 0 14px; border: 1.5px solid var(--dash-border, #e2e8f0); border-radius: 12px; background: var(--dash-page-bg, #f8fafc); color: inherit; font-size: 1rem; outline: none; }
    .cpx-fill input:focus { border-color: #ff7a00; box-shadow: 0 0 0 3px rgba(255,122,0,0.15); }
    .cpx-main.is-coding { padding-bottom: 1rem; }
    .cpx-code { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: 1rem; flex: 1; min-height: 380px; }
    .cpx-code-problem { padding: 1.25rem; overflow-y: auto; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 14px; background: var(--dash-card-bg, #fff); }
    .cpx-code-problem h6 { margin: 1rem 0 0.35rem; color: var(--dash-gray, #64748b); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; }
    .cpx-code-problem pre, .cpx-output pre { margin: 0; padding: 8px 10px; border-radius: 8px; background: var(--dash-page-bg, #f1f5f9); color: inherit; font-size: 0.8rem; white-space: pre-wrap; }
    .cpx-sample { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .cpx-sample h6 { grid-column: 1 / -1; }
    .cpx-sample span { display: block; margin-bottom: 3px; color: var(--dash-gray, #64748b); font-size: 0.72rem; font-weight: 700; }
    .cpx-hidden-note { display: flex; align-items: center; gap: 6px; margin: 1rem 0 0; color: var(--dash-gray, #64748b); font-size: 0.76rem; }
    .cpx-code-editor { display: flex; flex-direction: column; min-height: 0; overflow: hidden; border: 1px solid #1e1e1e; border-radius: 14px; background: #1e1e1e; }
    .cpx-editor-bar { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-bottom: 1px solid #2d2d2d; background: #252526; }
    .cpx-editor-bar select { min-width: 170px; height: 32px; padding: 0 10px; border: 1px solid #3c3c3c; border-radius: 8px; background: #1e1e1e; color: #e5e7eb; font-size: 0.82rem; cursor: pointer; }
    .cpx-editor-bar select option { background: #1e1e1e; color: #e5e7eb; }
    .cpx-custom { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; color: #9ca3af; font-size: 0.76rem; }
    .cpx-btn-run { background: #1e1e1e; }
    .cpx-editor { position: relative; flex: 1; min-height: 280px; }
    .cpx-clip-note { position: absolute; top: 10px; left: 50%; z-index: 5; display: inline-flex; align-items: center; gap: 7px; padding: 7px 14px; border: 1px solid rgba(248,113,113,0.4); border-radius: 99px; background: #2a1414; color: #fca5a5; font-size: 0.78rem; font-weight: 700; white-space: nowrap; transform: translateX(-50%); box-shadow: 0 6px 18px rgba(0,0,0,0.4); animation: cpx-fade 0.2s ease-out; }
    @keyframes cpx-fade { from { opacity: 0; transform: translate(-50%, -6px); } }
    .cpx-stdin { margin: 0; padding: 8px 10px; border: 0; border-top: 1px solid #2d2d2d; background: #1a1a1a; color: #e5e7eb; font-family: monospace; font-size: 0.8rem; resize: vertical; outline: none; }
    .cpx-output { max-height: 200px; padding: 10px 12px; overflow-y: auto; border-top: 1px solid #262626; background: #181818; color: #d1d5db; font-size: 0.8rem; }
    .cpx-output b { display: block; margin-bottom: 6px; color: #e5e7eb; }
    .cpx-output pre { background: #111; color: #d1d5db; }
    .cpx-test { padding: 6px 0; border-top: 1px solid #262626; }
    .cpx-test > span { display: inline-flex; align-items: center; gap: 6px; font-weight: 700; }
    .cpx-test.is-pass > span { color: #4ade80; }
    .cpx-test.is-fail > span { color: #f87171; }
    .cpx-test-io { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px; }
    .cpx-test-io small { color: #9ca3af; }
    .cpx-foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; max-width: 900px; margin-top: auto; padding-top: 0.5rem; }
    .cpx-main.is-coding .cpx-foot { max-width: none; }
    .cpx-overlay { position: fixed; inset: 0; z-index: 1300; display: grid; place-items: center; padding: 16px; background: rgba(15,23,42,0.45); backdrop-filter: blur(6px); }
    .cpx-dialog { width: 100%; max-width: 420px; padding: 1.6rem; border-radius: 18px; background: var(--dash-card-bg, #fff); color: var(--dash-text, #0f172a); text-align: center; box-shadow: 0 24px 60px rgba(15,23,42,0.25); }
    .cpx-dialog h3 { margin: 0.6rem 0 0.4rem; font-size: 1.15rem; font-weight: 800; }
    .cpx-dialog p { margin: 0 0 1rem; color: var(--dash-gray, #64748b); }
    .cpx-dialog-icon { display: inline-grid; place-items: center; width: 52px; height: 52px; border-radius: 50%; background: rgba(22,163,74,0.12); color: #16a34a; font-size: 1.4rem; }
    .cpx-dialog-icon.is-warn { background: rgba(217,119,6,0.12); color: #d97706; }
    .cpx-dialog-icon.is-danger { background: rgba(220,38,38,0.12); color: #dc2626; }
    .cpx-overlay-warn { z-index: 1400; background: rgba(15,23,42,0.7); }
    .cpx-violations { margin: -0.25rem 0 1rem; padding: 8px 12px; border-radius: 10px; background: rgba(220,38,38,0.08); color: #dc2626; font-size: 0.84rem; }
    .cpx-return { width: 100%; height: 44px; justify-content: center; }
    .cpx-dialog-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 1.2rem; }
    .cpx-dialog-stats div { display: flex; flex-direction: column; padding: 0.6rem; border-radius: 10px; background: var(--dash-page-bg, #f8fafc); }
    .cpx-dialog-stats span { color: var(--dash-gray, #64748b); font-size: 0.7rem; }
    .cpx-dialog-actions { display: flex; gap: 8px; }
    .cpx-dialog-actions .cpx-btn { flex: 1; justify-content: center; }
    /* briefing */
    .cpb-top { display: flex; align-items: center; gap: 12px; padding: 0.75rem 1.5rem; border-bottom: 1px solid var(--dash-border, #e2e8f0); background: var(--dash-card-bg, #fff); }
    .cpb-top-sep { width: 1px; height: 24px; background: var(--dash-border, #e2e8f0); }
    .cpb-top-title { display: flex; flex-direction: column; min-width: 0; }
    .cpb-top-title b { font-size: 0.95rem; }
    .cpb-top-title small { color: var(--dash-gray, #64748b); font-size: 0.74rem; }
    .cpb-top-time { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; padding: 6px 12px; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 10px; font-weight: 700; font-size: 0.85rem; }
    .cpb-top-time svg { color: #ff7a00; }
    .cpb-scroll { flex: 1; min-height: 0; overflow-y: auto; }
    .cpb-wrap { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 1.5rem; width: 100%; max-width: 1240px; margin: 0 auto; padding: 1.5rem; align-items: start; }
    .cpb-side { position: sticky; top: 1.5rem; }
    /* headings/text set explicitly (the site theme recolours h1–h4) */
    .cpx-root h1, .cpx-root h2, .cpx-root h3, .cpx-root h4, .cpx-root h5, .cpx-root h6 { color: var(--dash-text, #0f172a); }
    .cpx-root .cpb-hero h1 { color: #fff; }
    .cpx-root .cpb-summary h4, .cpx-root .cpx-sec h5, .cpx-root .cpx-code-problem h6 { color: var(--dash-gray, #64748b); }
    .cpb-table td, .cpb-table b { color: var(--dash-text, #0f172a); }
    /* thin, quiet scrollbars */
    .cpx-root ::-webkit-scrollbar { width: 8px; height: 8px; }
    .cpx-root ::-webkit-scrollbar-track { background: transparent; }
    .cpx-root ::-webkit-scrollbar-thumb { border: 2px solid transparent; border-radius: 99px; background: rgba(100,116,139,0.35); background-clip: padding-box; }
    .cpx-root ::-webkit-scrollbar-thumb:hover { background-color: rgba(100,116,139,0.55); }
    .cpx-root * { scrollbar-width: thin; scrollbar-color: rgba(100,116,139,0.4) transparent; }
    .cpb-main { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
    .cpb-hero { padding: 1.5rem 1.6rem; border-radius: 18px; background: linear-gradient(135deg, #1e293b, #0f172a); color: #fff; position: relative; overflow: hidden; }
    .cpb-hero::after { content: ''; position: absolute; right: -60px; top: -60px; width: 220px; height: 220px; border-radius: 50%; background: radial-gradient(circle, rgba(255,122,0,0.35), transparent 70%); }
    .cpb-eyebrow { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 99px; background: rgba(255,122,0,0.18); color: #ffb15e; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; }
    .cpb-hero h1 { margin: 10px 0 6px; font-size: 1.6rem; font-weight: 800; color: #fff; }
    .cpb-hero p { margin: 0; max-width: 560px; color: #cbd5e1; font-size: 0.9rem; }
    .cpb-card { padding: 1.25rem 1.4rem; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 16px; background: var(--dash-card-bg, #fff); }
    .cpb-card h3 { display: flex; align-items: center; gap: 8px; margin: 0 0 1rem; font-size: 1rem; font-weight: 800; }
    .cpb-card h3 svg { color: #ff7a00; }
    .cpb-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    .cpb-table th { padding: 0 10px 10px; color: var(--dash-gray, #64748b); font-size: 0.7rem; font-weight: 800; letter-spacing: 0.05em; text-align: left; text-transform: uppercase; }
    .cpb-table td { padding: 12px 10px; border-top: 1px solid var(--dash-border, #eef2f6); }
    .cpb-table tfoot td { border-top: 2px solid var(--dash-border, #e2e8f0); font-weight: 800; }
    .cpb-n { width: 36px; color: var(--dash-gray, #64748b); font-weight: 700; }
    .cpb-types { display: flex; flex-wrap: wrap; gap: 5px; }
    .cpb-types span { padding: 2px 9px; border-radius: 99px; background: rgba(59,130,246,0.1); color: #2563eb; font-size: 0.72rem; font-weight: 700; }
    .cpb-types span.is-code { background: rgba(255,122,0,0.12); color: #ea580c; }
    .cpb-rules { display: flex; flex-direction: column; gap: 10px; margin: 0; padding: 0; list-style: none; }
    .cpb-rules li { display: flex; gap: 12px; }
    .cpb-rules li span { display: grid; place-items: center; width: 24px; height: 24px; flex: 0 0 24px; border-radius: 50%; background: rgba(255,122,0,0.12); color: #ea580c; font-size: 0.75rem; font-weight: 800; }
    .cpb-rules li p { margin: 2px 0 0; color: var(--dash-text, #334155); line-height: 1.55; }
    .cpb-checks { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
    .cpb-checks div { display: flex; flex-direction: column; gap: 3px; padding: 0.85rem; border-radius: 12px; background: var(--dash-page-bg, #f8fafc); }
    .cpb-checks svg { color: #16a34a; margin-bottom: 4px; }
    .cpb-checks b { font-size: 0.86rem; }
    .cpb-checks small { color: var(--dash-gray, #64748b); font-size: 0.74rem; }
    .cpb-summary { display: flex; flex-direction: column; gap: 1rem; padding: 1.25rem; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 18px; background: var(--dash-card-bg, #fff); box-shadow: 0 12px 32px rgba(15,23,42,0.06); }
    .cpb-summary h4 { margin: 0; font-size: 0.78rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--dash-gray, #64748b); }
    .cpb-sum-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .cpb-sum-grid div { display: flex; flex-direction: column; gap: 2px; padding: 0.8rem; border-radius: 12px; background: var(--dash-page-bg, #f8fafc); }
    .cpb-sum-grid svg { color: #ff7a00; }
    .cpb-sum-grid b { font-size: 1.3rem; font-weight: 800; line-height: 1.1; }
    .cpb-sum-grid span { color: var(--dash-gray, #64748b); font-size: 0.72rem; }
    .cpb-typelist { display: flex; flex-direction: column; gap: 6px; }
    .cpb-typelist div { display: flex; align-items: center; gap: 8px; font-size: 0.86rem; }
    .cpb-typelist svg { color: var(--dash-gray, #64748b); }
    .cpb-typelist b { margin-left: auto; }
    .cpb-marking { display: flex; flex-direction: column; gap: 6px; padding: 0.75rem 0.9rem; border-radius: 12px; border: 1px dashed var(--dash-border, #e2e8f0); }
    .cpb-marking div { display: flex; justify-content: space-between; font-size: 0.82rem; }
    .cpb-marking span { color: var(--dash-gray, #64748b); }
    .cpb-marking .ok { color: #16a34a; }
    .cpb-prev { margin: 0; color: var(--dash-gray, #64748b); font-size: 0.82rem; }
    .cpb-prev b { color: #16a34a; }
    .cpb-agree { position: relative; display: flex; align-items: flex-start; gap: 10px; padding: 0.8rem 0.9rem; border: 1px solid rgba(255,122,0,0.25); border-radius: 12px; background: rgba(255,122,0,0.05); color: var(--dash-text, #0f172a); font-size: 0.85rem; line-height: 1.45; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
    .cpb-agree:hover { border-color: rgba(255,122,0,0.5); }
    .cpb-agree.is-on { border-color: rgba(22,163,74,0.4); background: rgba(22,163,74,0.06); }
    .cpb-agree input { position: absolute; opacity: 0; pointer-events: none; }
    /* custom box: the theme paints native checkboxes dark */
    .cpb-box { display: grid; place-items: center; width: 20px; height: 20px; flex: 0 0 20px; margin-top: 1px; border: 2px solid #cbd5e1; border-radius: 6px; background: #fff; transition: all 0.15s; }
    .cpb-agree.is-on .cpb-box { border-color: #16a34a; background: #16a34a; color: #fff; }
    .cpb-box svg { width: 13px; height: 13px; stroke-width: 3; }
    .cpb-agree input:focus-visible + .cpb-box { box-shadow: 0 0 0 3px rgba(255,122,0,0.25); }
    .cpb-start { width: 100%; height: 48px; justify-content: center; font-size: 0.98rem; }
    .cpb-note { color: var(--dash-gray, #64748b); font-size: 0.74rem; text-align: center; }
    @media (max-width: 991.98px) {
      .cpb-wrap { grid-template-columns: 1fr; }
      .cpb-side { position: static; }
      .cpb-checks { grid-template-columns: 1fr; }
      .cpx-side { width: 210px; }
      .cpx-code { grid-template-columns: 1fr; }
    }
    @media (max-width: 767.98px) {
      .cpx-body { flex-direction: column; }
      .cpx-side { width: 100%; max-height: 200px; border-right: 0; border-bottom: 1px solid var(--dash-border, #e2e8f0); }
      .cpx-legend, .cpx-save { display: none; }
      .cpx-head { flex-wrap: wrap; }
    }
  `}</style>
)

export default ExamRunner
