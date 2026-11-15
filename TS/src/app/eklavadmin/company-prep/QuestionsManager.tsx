import { useEffect, useMemo, useRef, useState } from 'react'
import { Modal } from 'react-bootstrap'
import { downloadQuestionTemplate, parseQuestionSheet } from './sheet'
import {
  FaCheckCircle, FaCode, FaDownload, FaEdit, FaExclamationTriangle, FaFileExcel, FaListUl, FaPen, FaPlus,
  FaSpinner, FaTimes, FaTrash, FaUpload,
} from 'react-icons/fa'
import { AdminSelect, EmptyState, SearchInput, Tabs } from '@/components/admin-ui'
import { LEVEL_BADGE, TYPE_BADGE, TYPE_LABEL, type Api, type PrepExam, type PrepQuestion, type QType, type TestCase } from './api'

/* Questions of one exam: section tabs, list, add/edit form and Excel import */

const emptyForm = (section: string) => ({
  _id: '', type: 'mcq' as QType, section, marks: 1, question: '', explanation: '',
  options: { A: '', B: '', C: '', D: '' }, correctOption: 'A' as 'A' | 'B' | 'C' | 'D',
  answers: [''],
  coding: { inputFormat: '', outputFormat: '', constraints: '', testCases: [{ input: '', output: '', hidden: false }] as TestCase[] },
})
type Form = ReturnType<typeof emptyForm>

const toForm = (q: PrepQuestion): Form => ({
  ...emptyForm(q.section),
  _id: q._id, type: q.type, section: q.section, marks: q.marks, question: q.question, explanation: q.explanation || '',
  options: { A: q.options?.A || '', B: q.options?.B || '', C: q.options?.C || '', D: q.options?.D || '' },
  correctOption: (q.correctOption || 'A') as Form['correctOption'],
  answers: q.answers?.length ? [...q.answers] : [''],
  coding: {
    inputFormat: q.coding?.inputFormat || '', outputFormat: q.coding?.outputFormat || '', constraints: q.coding?.constraints || '',
    testCases: q.coding?.testCases?.length ? q.coding.testCases.map(t => ({ ...t })) : [{ input: '', output: '', hidden: false }],
  },
})

const QuestionsManager = ({ api, exam, show, onHide, onChanged }: {
  api: Api
  exam: PrepExam | null
  show: boolean
  onHide: () => void
  onChanged: () => void
}) => {
  const sections = exam?.sections.map(s => s.name) || []
  const [questions, setQuestions] = useState<PrepQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [section, setSection] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<Form | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [importRows, setImportRows] = useState<any[] | null>(null)
  const [importName, setImportName] = useState('')
  const [importReplace, setImportReplace] = useState(false)
  const [importErrors, setImportErrors] = useState<{ row: number; message: string }[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    if (!exam) return
    setLoading(true)
    setError('')
    try {
      const d = await api.questions(exam._id)
      setQuestions(d.questions)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!show || !exam) return
    setSection(exam.sections[0]?.name || '')
    setTypeFilter(''); setSearch(''); setNotice(''); setForm(null); setImportRows(null)
    load()
  }, [show, exam?._id]) // eslint-disable-line

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    questions.forEach(q => { c[q.section] = (c[q.section] || 0) + 1 })
    return c
  }, [questions])
  const totalMarks = questions.reduce((s, q) => s + (q.marks || 0), 0)

  const visible = questions
    .filter(q => q.section === section)
    .filter(q => !typeFilter || q.type === typeFilter)
    .filter(q => !search || q.question.toLowerCase().includes(search.toLowerCase()))

  const flash = (msg: string) => { setNotice(msg); window.setTimeout(() => setNotice(''), 3500) }

  /* ── single question save ── */
  const save = async () => {
    if (!exam || !form) return
    setSaving(true)
    setFormError('')
    const payload: any = { type: form.type, section: form.section, marks: form.marks, question: form.question, explanation: form.explanation }
    if (form.type === 'mcq') { payload.options = form.options; payload.correctOption = form.correctOption }
    if (form.type === 'fill') payload.answers = form.answers
    if (form.type === 'coding') payload.coding = form.coding
    try {
      if (form._id) await api.updateQuestion(form._id, payload)
      else await api.createQuestion(exam._id, payload)
      flash(form._id ? 'Question updated.' : 'Question added.')
      if (form._id) setForm(null)
      else setForm({ ...emptyForm(form.section), type: form.type, marks: form.marks })   // ready for the next one
      setSection(form.section)
      await load()
      onChanged()
    } catch (e: any) {
      setFormError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (q: PrepQuestion) => {
    if (!window.confirm('Delete this question?')) return
    try {
      await api.deleteQuestion(q._id)
      setQuestions(prev => prev.filter(x => x._id !== q._id))
      onChanged()
    } catch (e: any) {
      setError(e.message)
    }
  }

  /* ── Excel import ── */
  const downloadTemplate = () => downloadQuestionTemplate(`${exam?.title || 'exam'} - questions template.xlsx`)

  const onFile = async (file?: File) => {
    if (!file) return
    setImportErrors([])
    setError('')
    try {
      const parsed = await parseQuestionSheet(file)
      const rows = parsed.rows
      if (!rows.length) { setError('No questions found in that file. Use the template columns.'); return }
      if (parsed.problems.length) setImportErrors(parsed.problems)
      setImportRows(rows)
      setImportName(file.name)
      setImportReplace(false)
    } catch {
      setError('Could not read that file. Upload the .xlsx template.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const runImport = async () => {
    if (!exam || !importRows) return
    setSaving(true)
    setImportErrors([])
    try {
      const d = await api.bulkQuestions(exam._id, importRows, importReplace)
      setImportRows(null)
      flash(`${d.imported} question${d.imported === 1 ? '' : 's'} imported.`)
      await load()
      onChanged()
    } catch (e: any) {
      setImportErrors(e.details || [{ row: 0, message: e.message }])
    } finally {
      setSaving(false)
    }
  }

  const importSummary = useMemo(() => {
    if (!importRows) return null
    const byType: Record<string, number> = {}
    const bySection: Record<string, number> = {}
    importRows.forEach(r => { byType[r.type] = (byType[r.type] || 0) + 1; bySection[r.section || '(no title)'] = (bySection[r.section || '(no title)'] || 0) + 1 })
    return { byType, bySection }
  }, [importRows]) // eslint-disable-line

  if (!exam) return null

  return (
    <Modal show={show} onHide={onHide} fullscreen className="cpq-modal-top" contentClassName="aui-modal cpq-modal" backdropClassName="aui-backdrop cpq-backdrop-top">
      <div className="aui-page cpq-root">
        <div className="aui-modal-head cpq-head">
          <span className="aui-heading-icon"><FaListUl /></span>
          <div>
            <h3>{exam.title} <span className={`aui-badge ${LEVEL_BADGE[exam.level]}`}>{exam.level}</span></h3>
            <p>{questions.length} question{questions.length === 1 ? '' : 's'} · {totalMarks} marks · {exam.durationMins} min · {exam.status === 'published' ? 'Published' : 'Draft'}</p>
          </div>
          <div className="cpq-head-actions">
            <button type="button" className="aui-btn" onClick={downloadTemplate}><FaDownload size={11} /> Template</button>
            <button type="button" className="aui-btn" onClick={() => fileRef.current?.click()}><FaFileExcel size={12} /> Import Excel</button>
            <button type="button" className="aui-btn aui-btn-primary" onClick={() => { setFormError(''); setForm(emptyForm(section || sections[0])) }}><FaPlus size={10} /> Add question</button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={e => onFile(e.target.files?.[0])} />
          </div>
          <button type="button" className="aui-icon-btn" onClick={onHide} aria-label="Close"><FaTimes size={12} /></button>
        </div>

        <div className="aui-modal-body cpq-body">
          {error && <div className="aui-alert"><FaExclamationTriangle /> <span>{error}</span><button type="button" className="aui-alert-close" onClick={() => setError('')} aria-label="Dismiss"><FaTimes size={10} /></button></div>}
          {notice && <div className="aui-alert aui-alert-success"><FaCheckCircle /> <span>{notice}</span></div>}

          <div className="aui-toolbar">
            <Tabs
              small
              value={section}
              onChange={setSection}
              label="Sections"
              items={sections.map(s => ({ value: s, label: s, count: counts[s] || 0 }))}
            />
            <div className="aui-toolbar-filters">
              <SearchInput value={search} onChange={setSearch} placeholder="Search questions…" />
              <AdminSelect label="Type" prefix="Type:" value={typeFilter} onChange={setTypeFilter}
                options={[{ value: '', label: 'All' }, { value: 'mcq', label: 'MCQ' }, { value: 'fill', label: 'Fill in the blank' }, { value: 'coding', label: 'Coding' }]} />
            </div>
          </div>

          {loading ? (
            <div className="cpq-loading"><FaSpinner className="aui-spin" /> Loading questions…</div>
          ) : visible.length === 0 ? (
            <EmptyState
              icon={FaPen}
              title={questions.length ? 'No questions match' : `No questions in ${section} yet`}
              text={questions.length ? 'Try another section, type or search.' : 'Add questions one by one, or import them from the Excel template.'}
              action={<div className="cpq-empty-actions">
                <button type="button" className="aui-btn aui-btn-primary" onClick={() => setForm(emptyForm(section))}><FaPlus size={10} /> Add question</button>
                <button type="button" className="aui-btn" onClick={() => fileRef.current?.click()}><FaUpload size={10} /> Import Excel</button>
              </div>}
            />
          ) : (
            <ol className="cpq-list">
              {visible.map((q, i) => (
                <li key={q._id} className="aui-card cpq-q">
                  <div className="cpq-q-head">
                    <span className="cpq-q-no">Q{i + 1}</span>
                    <span className={`aui-badge ${TYPE_BADGE[q.type]}`}>{TYPE_LABEL[q.type]}</span>
                    <span className="aui-badge aui-badge-muted">{q.marks} mark{q.marks === 1 ? '' : 's'}</span>
                    <div className="cpq-q-actions">
                      <button type="button" className="aui-icon-btn" onClick={() => { setFormError(''); setForm(toForm(q)) }} aria-label="Edit question"><FaEdit size={11} /></button>
                      <button type="button" className="aui-icon-btn" onClick={() => remove(q)} aria-label="Delete question"><FaTrash size={11} /></button>
                    </div>
                  </div>
                  <p className="cpq-q-text">{q.question}</p>
                  {q.type === 'mcq' && (
                    <div className="cpq-opts">
                      {(['A', 'B', 'C', 'D'] as const).filter(k => q.options?.[k]).map(k => (
                        <span key={k} className={`cpq-opt${q.correctOption === k ? ' is-correct' : ''}`}><b>{k}</b>{q.options?.[k]}{q.correctOption === k && <FaCheckCircle size={11} />}</span>
                      ))}
                    </div>
                  )}
                  {q.type === 'fill' && (
                    <div className="cpq-answers"><span>Accepted:</span>{(q.answers || []).map(a => <span key={a} className="aui-badge aui-badge-green">{a}</span>)}</div>
                  )}
                  {q.type === 'coding' && (
                    <div className="cpq-answers">
                      <FaCode size={11} />
                      <span>{q.coding?.testCases?.length || 0} test case{q.coding?.testCases?.length === 1 ? '' : 's'}{q.coding?.testCases?.some(t => t.hidden) ? ` · ${q.coding?.testCases?.filter(t => t.hidden).length} hidden` : ''}</span>
                      {q.coding?.languages?.length ? <span>· {q.coding.languages.join(', ')}</span> : null}
                    </div>
                  )}
                  {q.explanation && <p className="cpq-expl"><b>Explanation:</b> {q.explanation}</p>}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      {/* ── Add / edit question ── */}
      <Modal show={!!form} onHide={() => !saving && setForm(null)} centered size="lg" contentClassName="aui-modal" backdropClassName="aui-backdrop cpq-backdrop-2" className="cpq-modal-2">
        {form && (
          <div className="aui-page">
            <div className="aui-modal-head">
              <span className="aui-heading-icon"><FaPen /></span>
              <div><h3>{form._id ? 'Edit question' : 'Add question'}</h3><p>{exam.title}</p></div>
              <button type="button" className="aui-icon-btn" onClick={() => setForm(null)} disabled={saving} aria-label="Close"><FaTimes size={12} /></button>
            </div>
            <div className="aui-modal-body cpq-form">
              {formError && <div className="aui-alert"><FaExclamationTriangle /> <span>{formError}</span></div>}
              <div className="cpq-types">
                {(['mcq', 'fill', 'coding'] as QType[]).map(t => (
                  <button key={t} type="button" className={`cpq-type${form.type === t ? ' is-on' : ''}`} onClick={() => setForm({ ...form, type: t })}>
                    {t === 'mcq' ? <FaListUl /> : t === 'fill' ? <FaPen /> : <FaCode />} {TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
              <div className="aui-field-row">
                <div className="aui-field">
                  <span className="aui-label">Section</span>
                  <AdminSelect label="Section" value={form.section} onChange={v => setForm({ ...form, section: v })} options={sections.map(s => ({ value: s, label: s }))} />
                </div>
                <div className="aui-field">
                  <label className="aui-label" htmlFor="cpq-marks">Marks</label>
                  <input id="cpq-marks" type="number" min={0} className="aui-input" value={form.marks} onChange={e => setForm({ ...form, marks: Number(e.target.value) })} />
                </div>
              </div>
              <div className="aui-field">
                <label className="aui-label" htmlFor="cpq-q">{form.type === 'fill' ? 'Sentence (use ____ for the blank)' : form.type === 'coding' ? 'Problem statement' : 'Question'}</label>
                <textarea id="cpq-q" className="aui-input cpq-textarea" rows={form.type === 'coding' ? 5 : 3} value={form.question} onChange={e => setForm({ ...form, question: e.target.value })}
                  placeholder={form.type === 'fill' ? 'The capital of France is ____.' : ''} />
              </div>

              {form.type === 'mcq' && (
                <div className="aui-field">
                  <span className="aui-label">Options <span className="aui-optional">Select the correct one</span></span>
                  <div className="cpq-opt-inputs">
                    {(['A', 'B', 'C', 'D'] as const).map(k => (
                      <label key={k} className={`cpq-opt-input${form.correctOption === k ? ' is-correct' : ''}`}>
                        <input type="radio" name="cpq-correct" checked={form.correctOption === k} onChange={() => setForm({ ...form, correctOption: k })} />
                        <b>{k}</b>
                        <input className="aui-input" value={form.options[k]} placeholder={`Option ${k}`} onChange={e => setForm({ ...form, options: { ...form.options, [k]: e.target.value } })} />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {form.type === 'fill' && (
                <div className="aui-field">
                  <span className="aui-label">Accepted answers <span className="aui-optional">Not case-sensitive</span></span>
                  <div className="cpq-stack">
                    {form.answers.map((a, i) => (
                      <div key={i} className="cpq-row">
                        <input className="aui-input" value={a} placeholder={i === 0 ? 'Paris' : 'Another accepted answer'} onChange={e => setForm({ ...form, answers: form.answers.map((x, j) => (j === i ? e.target.value : x)) })} />
                        {form.answers.length > 1 && <button type="button" className="aui-icon-btn" onClick={() => setForm({ ...form, answers: form.answers.filter((_, j) => j !== i) })} aria-label="Remove answer"><FaTimes size={10} /></button>}
                      </div>
                    ))}
                    <button type="button" className="aui-btn aui-btn-sm cpq-add" onClick={() => setForm({ ...form, answers: [...form.answers, ''] })}><FaPlus size={9} /> Add another answer</button>
                  </div>
                </div>
              )}

              {form.type === 'coding' && (
                <>
                  <div className="aui-field-row">
                    <div className="aui-field">
                      <label className="aui-label" htmlFor="cpq-in">Input format</label>
                      <textarea id="cpq-in" className="aui-input cpq-textarea" rows={2} value={form.coding.inputFormat} onChange={e => setForm({ ...form, coding: { ...form.coding, inputFormat: e.target.value } })} />
                    </div>
                    <div className="aui-field">
                      <label className="aui-label" htmlFor="cpq-out">Output format</label>
                      <textarea id="cpq-out" className="aui-input cpq-textarea" rows={2} value={form.coding.outputFormat} onChange={e => setForm({ ...form, coding: { ...form.coding, outputFormat: e.target.value } })} />
                    </div>
                  </div>
                  <div className="aui-field">
                    <label className="aui-label" htmlFor="cpq-con">Constraints <span className="aui-optional">Optional</span></label>
                    <input id="cpq-con" className="aui-input" value={form.coding.constraints} onChange={e => setForm({ ...form, coding: { ...form.coding, constraints: e.target.value } })} />
                  </div>
                  <div className="aui-field">
                    <span className="aui-label">Test cases <span className="aui-optional">Hidden ones are used for scoring only</span></span>
                    <div className="cpq-stack">
                      {form.coding.testCases.map((t, i) => {
                        const setT = (patch: Partial<TestCase>) => setForm({ ...form, coding: { ...form.coding, testCases: form.coding.testCases.map((x, j) => (j === i ? { ...x, ...patch } : x)) } })
                        return (
                          <div key={i} className="cpq-test">
                            <span className="cpq-test-no">#{i + 1}</span>
                            <textarea className="aui-input cpq-textarea" rows={2} placeholder="Input" value={t.input} onChange={e => setT({ input: e.target.value })} />
                            <textarea className="aui-input cpq-textarea" rows={2} placeholder="Expected output" value={t.output} onChange={e => setT({ output: e.target.value })} />
                            <label className="cpq-hidden"><input type="checkbox" checked={t.hidden} onChange={e => setT({ hidden: e.target.checked })} /> Hidden</label>
                            {form.coding.testCases.length > 1 && <button type="button" className="aui-icon-btn" onClick={() => setForm({ ...form, coding: { ...form.coding, testCases: form.coding.testCases.filter((_, j) => j !== i) } })} aria-label="Remove test case"><FaTimes size={10} /></button>}
                          </div>
                        )
                      })}
                      {form.coding.testCases.length < 10 && (
                        <button type="button" className="aui-btn aui-btn-sm cpq-add" onClick={() => setForm({ ...form, coding: { ...form.coding, testCases: [...form.coding.testCases, { input: '', output: '', hidden: true }] } })}><FaPlus size={9} /> Add test case</button>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="aui-field" style={{ marginBottom: 0 }}>
                <label className="aui-label" htmlFor="cpq-ex">Explanation <span className="aui-optional">Shown after the exam</span></label>
                <textarea id="cpq-ex" className="aui-input cpq-textarea" rows={2} value={form.explanation} onChange={e => setForm({ ...form, explanation: e.target.value })} />
              </div>
            </div>
            <div className="aui-modal-foot">
              <button type="button" className="aui-btn" onClick={() => setForm(null)} disabled={saving}>Cancel</button>
              <button type="button" className="aui-btn aui-btn-primary" onClick={save} disabled={saving}>
                {saving ? <FaSpinner className="aui-spin" style={{ color: '#fff' }} /> : <FaCheckCircle size={11} />} {form._id ? 'Save changes' : 'Add question'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Import preview ── */}
      <Modal show={!!importRows} onHide={() => !saving && setImportRows(null)} centered contentClassName="aui-modal" backdropClassName="aui-backdrop cpq-backdrop-2" className="cpq-modal-2">
        {importRows && importSummary && (
          <div className="aui-page">
            <div className="aui-modal-head">
              <span className="aui-heading-icon"><FaFileExcel /></span>
              <div><h3>Import questions</h3><p>{importName}</p></div>
              <button type="button" className="aui-icon-btn" onClick={() => setImportRows(null)} disabled={saving} aria-label="Close"><FaTimes size={12} /></button>
            </div>
            <div className="aui-modal-body cpq-form">
              <div className="cpq-import-total"><b>{importRows.length}</b> question{importRows.length === 1 ? '' : 's'} found</div>
              <div className="cpq-import-grid">
                <div><span className="aui-section-label">By type</span>{Object.entries(importSummary.byType).map(([t, n]) => <div key={t} className="cpq-import-row"><span>{TYPE_LABEL[t as QType] || t}</span><b>{n}</b></div>)}</div>
                <div><span className="aui-section-label">By section</span>{Object.entries(importSummary.bySection).map(([s, n]) => <div key={s} className="cpq-import-row"><span>{s}</span><b>{n}</b></div>)}</div>
              </div>
              <label className="aui-toggle">
                <input type="checkbox" checked={importReplace} onChange={e => setImportReplace(e.target.checked)} />
                <span className="aui-toggle-track" />
                <span><strong>Replace existing questions</strong><small>{importReplace ? `All ${questions.length} current questions in this exam will be deleted first.` : 'New questions are added after the existing ones.'}</small></span>
              </label>
              {importErrors.length > 0 && (
                <div className="aui-alert cpq-import-errors">
                  <FaExclamationTriangle />
                  <div>
                    <b>Fix these rows and upload again — nothing was imported:</b>
                    <ul>{importErrors.slice(0, 8).map((e, i) => <li key={i}>{e.row ? `Row ${e.row}: ` : ''}{e.message}</li>)}</ul>
                    {importErrors.length > 8 && <small>…and {importErrors.length - 8} more</small>}
                  </div>
                </div>
              )}
            </div>
            <div className="aui-modal-foot">
              <button type="button" className="aui-btn" onClick={() => setImportRows(null)} disabled={saving}>Cancel</button>
              <button type="button" className="aui-btn aui-btn-primary" onClick={runImport} disabled={saving}>
                {saving ? <FaSpinner className="aui-spin" style={{ color: '#fff' }} /> : <FaUpload size={11} />} Import {importRows.length}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        .cpq-modal { border: 0 !important; border-radius: 0 !important; background: #08090a !important; }
        .cpq-root { display: flex; flex-direction: column; min-height: 100%; }
        .cpq-head { position: sticky; top: 0; z-index: 3; flex-wrap: wrap; padding: 0.85rem 1.5rem !important; }
        .cpq-head h3 { display: flex; align-items: center; gap: 8px; }
        .cpq-head > div:nth-child(2) { flex: 1 1 260px; min-width: 0; }
        .cpq-head-actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .cpq-body { padding: 1.25rem 1.5rem 2rem !important; }
        .cpq-body > * + * { margin-top: 1rem; }
        .cpq-loading { display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 240px; color: #9da2a8; }
        .cpq-empty-actions { display: flex; gap: 8px; justify-content: center; margin-top: 0.5rem; }
        .cpq-list { display: flex; flex-direction: column; gap: 10px; margin: 0; padding: 0; list-style: none; }
        .cpq-q { padding: 0.9rem 1.1rem; }
        .cpq-q-head { display: flex; align-items: center; gap: 8px; }
        .cpq-q-no { color: #ff9a3c; font-size: 0.8rem; font-weight: 800; }
        .cpq-q-actions { display: flex; gap: 6px; margin-left: auto; }
        .cpq-q-text { margin: 0.55rem 0 0.6rem; color: #eceef0; font-size: 0.9rem; line-height: 1.55; white-space: pre-wrap; }
        .cpq-opts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 12px; }
        .cpq-opt { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border: 1px solid #25282b; border-radius: 8px; color: #c4c8ce; font-size: 0.82rem; }
        .cpq-opt b { color: #6b7280; }
        .cpq-opt.is-correct { border-color: rgba(49,216,102,0.45); background: rgba(49,216,102,0.08); color: #e5e7eb; }
        .cpq-opt.is-correct b, .cpq-opt.is-correct svg { color: #45dd75; }
        .cpq-opt svg { margin-left: auto; }
        .cpq-answers { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; color: #9da2a8; font-size: 0.8rem; }
        .cpq-expl { margin: 0.6rem 0 0; color: #858a90; font-size: 0.78rem; }
        .cpq-expl b { color: #9da2a8; }
        .cpq-modal-top { z-index: 1075 !important; }
        .cpq-backdrop-top { z-index: 1072 !important; }
        .cpq-modal-2 { z-index: 1085 !important; }
        .cpq-backdrop-2 { z-index: 1080 !important; }
        .cpq-form { display: flex; flex-direction: column; gap: 0.85rem; max-height: 70vh; overflow-y: auto; }
        .cpq-form .aui-field { margin-bottom: 0; }
        .cpq-textarea { height: auto; padding: 0.55rem 0.75rem; line-height: 1.5; resize: vertical; }
        .cpq-types { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
        .cpq-type { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 0.6rem; border: 1px solid #2c3034; border-radius: 10px; background: #111315; color: #9da2a8; font-size: 0.82rem; font-weight: 700; cursor: pointer; }
        .cpq-type.is-on { border-color: rgba(255,122,0,0.6); background: rgba(255,122,0,0.08); color: #ffb15e; }
        .cpq-opt-inputs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
        .cpq-opt-input { display: flex; align-items: center; gap: 8px; padding: 4px 8px 4px 10px; border: 1px solid #25282b; border-radius: 10px; cursor: pointer; }
        .cpq-opt-input.is-correct { border-color: rgba(49,216,102,0.5); background: rgba(49,216,102,0.06); }
        .cpq-opt-input input[type=radio] { accent-color: #31d866; }
        .cpq-opt-input b { color: #9da2a8; font-size: 0.8rem; }
        .cpq-opt-input .aui-input { border: 0; background: transparent; }
        .cpq-stack { display: flex; flex-direction: column; gap: 8px; }
        .cpq-row { display: flex; align-items: center; gap: 8px; }
        .cpq-add { align-self: flex-start; }
        .cpq-test { display: grid; grid-template-columns: 30px minmax(0, 1fr) minmax(0, 1fr) auto auto; align-items: center; gap: 8px; }
        .cpq-test-no { color: #6b7280; font-size: 0.76rem; font-weight: 700; }
        .cpq-hidden { display: inline-flex; align-items: center; gap: 5px; color: #9da2a8; font-size: 0.76rem; white-space: nowrap; }
        .cpq-hidden input { accent-color: #ff7a00; }
        .cpq-import-total { color: #c4c8ce; font-size: 0.9rem; }
        .cpq-import-total b { color: #fff; font-size: 1.4rem; }
        .cpq-import-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .cpq-import-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #1d2023; color: #c4c8ce; font-size: 0.82rem; }
        .cpq-import-row b { color: #fff; }
        .cpq-import-errors ul { margin: 6px 0 0; padding-left: 1.1rem; font-size: 0.78rem; }
        @media (max-width: 767.98px) {
          .cpq-opts, .cpq-opt-inputs, .cpq-types, .cpq-import-grid { grid-template-columns: 1fr; }
          .cpq-test { grid-template-columns: 1fr; }
        }
      `}</style>
    </Modal>
  )
}

export default QuestionsManager
