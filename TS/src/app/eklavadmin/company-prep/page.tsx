import { useEffect, useMemo, useState } from 'react'
import { Modal } from 'react-bootstrap'
import {
  FaArrowLeft, FaBuilding, FaCheckCircle, FaChevronRight, FaClipboardList, FaDownload, FaEdit, FaExclamationTriangle, FaFileExcel, FaGripLines, FaImage, FaLayerGroup,
  FaListUl, FaPlus, FaQuestionCircle, FaSpinner, FaTimes, FaTrash, FaUniversity,
} from 'react-icons/fa'
import PageMetaData from '@/components/PageMetaData'
import { useAuthContext } from '@/context/useAuthContext'
import { AdminPage, AdminSelect, EmptyState, PageHeader, SearchInput, StatCards, Tabs, initialsOf } from '@/components/admin-ui'
import { DEFAULT_SECTIONS, LEVELS, LEVEL_BADGE, makeApi, type AccessRow, type Level, type PrepCompany, type PrepExam } from './api'
import QuestionsManager from './QuestionsManager'
import { downloadQuestionTemplate, parseQuestionSheet, type ParsedSheet } from './sheet'

/* Admin → Self Preparation → Company Preparation
   Companies (TCS, Infosys…) → practice exams by level, split into sections → questions.
   A company is enabled per institute; its published exams then show up for that institute's students. */

type Tab = 'exams' | 'access'

const fmtDate = (v?: string | null) => (v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

const CompanyLogo = ({ company, size = 40 }: { company: Pick<PrepCompany, 'name' | 'logoUrl'>; size?: number }) => (
  <span className="cp-logo" style={{ width: size, height: size, flexBasis: size }}>
    {company.logoUrl ? <img src={company.logoUrl} alt="" onError={e => ((e.target as HTMLImageElement).style.display = 'none')} /> : null}
    <b>{initialsOf(company.name)}</b>
  </span>
)

const CompanyPrepPage = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const api = useMemo(() => makeApi(baseURL, user?.token), [baseURL, user?.token])

  const [companies, setCompanies] = useState<PrepCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [companySearch, setCompanySearch] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [tab, setTab] = useState<Tab>('exams')

  const [exams, setExams] = useState<PrepExam[]>([])
  const [examsLoading, setExamsLoading] = useState(false)
  const [levelFilter, setLevelFilter] = useState('')
  const [access, setAccess] = useState<AccessRow[]>([])
  const [accessLoading, setAccessLoading] = useState(false)
  const [accessSearch, setAccessSearch] = useState('')
  const [accessBusy, setAccessBusy] = useState('')

  const [companyForm, setCompanyForm] = useState<{ _id: string; name: string; description: string; logoUrl: string } | null>(null)
  const [examForm, setExamForm] = useState<{ _id: string; title: string; level: Level; durationMins: number; instructions: string; sections: string[]; original: string[] } | null>(null)
  const [newSection, setNewSection] = useState('')
  const [sheet, setSheet] = useState<(ParsedSheet & { fileName: string }) | null>(null)
  const [sheetErrors, setSheetErrors] = useState<{ row: number; message: string }[]>([])
  const [publishNow, setPublishNow] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [questionsExam, setQuestionsExam] = useState<PrepExam | null>(null)

  const selected = companies.find(c => c._id === selectedId) || null
  const flash = (msg: string) => { setNotice(msg); window.setTimeout(() => setNotice(''), 3500) }

  const loadCompanies = async (keepSelection = true) => {
    try {
      const d = await api.companies()
      setCompanies(d.companies)
      if (!keepSelection || !d.companies.some(c => c._id === selectedId)) setSelectedId('')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
  const loadExams = async (id = selectedId) => {
    if (!id) { setExams([]); return }
    setExamsLoading(true)
    try { setExams((await api.exams(id)).exams) } catch (e: any) { setError(e.message) } finally { setExamsLoading(false) }
  }
  const loadAccess = async (id = selectedId) => {
    if (!id) { setAccess([]); return }
    setAccessLoading(true)
    try { setAccess((await api.access(id)).institutes) } catch (e: any) { setError(e.message) } finally { setAccessLoading(false) }
  }

  useEffect(() => { if (user?.token) loadCompanies(false) }, [user?.token]) // eslint-disable-line
  useEffect(() => { setLevelFilter(''); setAccessSearch(''); loadExams(); if (tab === 'access') loadAccess() }, [selectedId]) // eslint-disable-line
  useEffect(() => { if (tab === 'access' && selectedId) loadAccess() }, [tab]) // eslint-disable-line

  const totals = companies.reduce((t, c) => ({ exams: t.exams + c.examCount, published: t.published + c.publishedCount, questions: t.questions + c.questionCount, grants: t.grants + c.instituteCount }), { exams: 0, published: 0, questions: 0, grants: 0 })

  /* ── company save/delete ── */
  const saveCompany = async () => {
    if (!companyForm) return
    setSaving(true); setFormError('')
    try {
      const body = { name: companyForm.name, description: companyForm.description, logoUrl: companyForm.logoUrl }
      if (companyForm._id) await api.updateCompany(companyForm._id, body)
      else {
        const d: any = await api.createCompany(body)
        setSelectedId(d.company._id)
      }
      setCompanyForm(null)
      flash(companyForm._id ? 'Company updated.' : `${companyForm.name} added. Now create its exams.`)
      await loadCompanies()
    } catch (e: any) { setFormError(e.message) } finally { setSaving(false) }
  }
  const deleteCompany = async (c: PrepCompany) => {
    if (c.examCount > 0) { setError(`${c.name} has ${c.examCount} exams. Delete its exams first, or use Hide.`); return }
    if (!window.confirm(`Delete ${c.name}?${c.instituteCount ? ` Access for ${c.instituteCount} institute(s) is removed too.` : ''}`)) return
    try { await api.deleteCompany(c._id); flash(`${c.name} deleted.`); await loadCompanies(false) } catch (e: any) { setError(e.message) }
  }
  const toggleActive = async (c: PrepCompany) => {
    try { await api.updateCompany(c._id, { isActive: !c.isActive }); await loadCompanies() } catch (e: any) { setError(e.message) }
  }
  const uploadLogo = async (file?: File) => {
    if (!file || !companyForm) return
    setSaving(true); setFormError('')
    try { const url = await api.uploadLogo(file); setCompanyForm(f => (f ? { ...f, logoUrl: url } : f)) } catch (e: any) { setFormError(e.message) } finally { setSaving(false) }
  }

  /* ── exam save/delete/publish ── */
  const openExam = (e?: PrepExam) => {
    setFormError(''); setNewSection(''); setSheet(null); setSheetErrors([]); setPublishNow(true)
    setExamForm(e
      ? { _id: e._id, title: e.title, level: e.level, durationMins: e.durationMins, instructions: e.instructions || '', sections: e.sections.map(s => s.name), original: e.sections.map(s => s.name) }
      : { _id: '', title: `${selected?.name || ''} Practice Test ${exams.length + 1}`.trim(), level: 'Easy', durationMins: 60, instructions: '', sections: [], original: [] })
  }
  const onSheet = async (file?: File) => {
    if (!file || !examForm) return
    setFormError(''); setSheetErrors([])
    try {
      const parsed = await parseQuestionSheet(file)
      if (!parsed.rows.length) { setFormError('No questions found. Use the template columns: Title, Type, Question, Options, Correct Answer, Marks.'); return }
      setSheet({ ...parsed, fileName: file.name })
    } catch {
      setFormError('Could not read that file. Upload the .xlsx template.')
    }
  }

  const saveExam = async () => {
    if (!examForm || !selected) return
    if (!examForm._id && !sheet) { setFormError('Upload the questions Excel to create the exam.'); return }
    setSaving(true); setFormError(''); setSheetErrors([])
    // a section renamed in place keeps its questions
    const renames = examForm.original.map((from, i) => ({ from, to: examForm.sections[i] })).filter(r => r.to && r.from !== r.to)
    const body = { title: examForm.title, level: examForm.level, durationMins: examForm.durationMins, instructions: examForm.instructions, sections: examForm.sections, renames }
    try {
      let imported = 0
      if (examForm._id) await api.updateExam(examForm._id, body)
      else imported = ((await api.createExam(selected._id, { ...body, sections: undefined, renames: undefined, questions: sheet!.rows, publish: publishNow })) as any).imported || 0
      setExamForm(null)
      flash(examForm._id ? 'Exam updated.' : publishNow ? `Exam published with ${imported} questions — students can see it now.` : `Exam saved as draft with ${imported} questions. Publish it when ready.`)
      await Promise.all([loadExams(), loadCompanies()])
    } catch (e: any) { setFormError(e.message); if (e.details) setSheetErrors(e.details) } finally { setSaving(false) }
  }
  const deleteExam = async (e: PrepExam) => {
    if (!window.confirm(`Delete "${e.title}" and its ${e.questionCount} questions?`)) return
    try { await api.deleteExam(e._id); flash('Exam deleted.'); await Promise.all([loadExams(), loadCompanies()]) } catch (err: any) { setError(err.message) }
  }
  const togglePublish = async (e: PrepExam) => {
    try {
      await api.updateExam(e._id, { status: e.status === 'published' ? 'draft' : 'published' })
      flash(e.status === 'published' ? `"${e.title}" moved to draft.` : `"${e.title}" published.`)
      await Promise.all([loadExams(), loadCompanies()])
    } catch (err: any) { setError(err.message) }
  }

  /* ── access ── */
  const toggleAccess = async (row: AccessRow) => {
    if (!selected) return
    setAccessBusy(row._id)
    try {
      await api.setAccess(selected._id, row._id, !row.enabled)
      setAccess(prev => prev.map(r => (r._id === row._id ? { ...r, enabled: !row.enabled, enabledAt: !row.enabled ? new Date().toISOString() : null } : r)))
      setCompanies(prev => prev.map(c => (c._id === selected._id ? { ...c, instituteCount: c.instituteCount + (row.enabled ? -1 : 1) } : c)))
    } catch (e: any) { setError(e.message) } finally { setAccessBusy('') }
  }

  const visibleCompanies = companies.filter(c => !companySearch || c.name.toLowerCase().includes(companySearch.toLowerCase()))
  const visibleExams = exams.filter(e => !levelFilter || e.level === levelFilter)
  const visibleAccess = access.filter(a => !accessSearch || `${a.name} ${a.domain || ''}`.toLowerCase().includes(accessSearch.toLowerCase()))
  const enabledCount = access.filter(a => a.enabled).length

  return (
    <>
      <PageMetaData title="Company Preparation" />
      <AdminPage>
        <PageHeader
          icon={FaBuilding}
          title="Company Preparation"
          subtitle={companies.length > 0 ? (
            <span className="cp-head-search">
              <SearchInput value={companySearch} onChange={setCompanySearch} placeholder="Search companies…" />
              <span className="cp-muted">{visibleCompanies.length} of {companies.length}</span>
            </span>
          ) : undefined}
          stats={<StatCards inline loading={loading} items={[
            { label: 'Companies', value: companies.length, icon: FaBuilding, tone: 'orange' },
            { label: 'Exams', value: totals.exams, icon: FaClipboardList, tone: 'blue', hint: `${totals.published} published` },
            { label: 'Questions', value: totals.questions, icon: FaQuestionCircle, tone: 'purple' },
            { label: 'Institute access', value: totals.grants, icon: FaUniversity, tone: 'green' },
          ]} />}
        />

        {error && <div className="aui-alert"><FaExclamationTriangle /> <span>{error}</span><button type="button" className="aui-alert-close" onClick={() => setError('')} aria-label="Dismiss"><FaTimes size={10} /></button></div>}
        {notice && <div className="aui-alert aui-alert-success"><FaCheckCircle /> <span>{notice}</span></div>}

        {loading ? (
          <div className="aui-card cp-loading"><FaSpinner className="aui-spin" /> Loading…</div>
        ) : companies.length === 0 ? (
          <div className="aui-card">
            <EmptyState icon={FaBuilding} title="No companies yet" text="Add a company like TCS, then create its practice exams and upload questions."
              action={<button type="button" className="aui-btn aui-btn-primary" onClick={() => setCompanyForm({ _id: '', name: '', description: '', logoUrl: '' })}><FaPlus size={10} /> Add company</button>} />
          </div>
        ) : (
          <>
          {(
            /* ── All companies (grid) ── */
            <div className="cp-grid-wrap">
              <div className="cp-grid">
                {visibleCompanies.map(c => (
                  <button key={c._id} type="button" className={`cp-tile${c.isActive ? '' : ' is-off'}`} onClick={() => { setTab('exams'); setSelectedId(c._id) }}>
                    {!c.isActive && <span className="aui-badge aui-badge-muted cp-tile-flag">Hidden</span>}
                    <span className="cp-tile-logo">
                      {c.logoUrl ? <img src={c.logoUrl} alt="" onError={e => ((e.target as HTMLImageElement).style.display = 'none')} /> : <b>{initialsOf(c.name)}</b>}
                    </span>
                    <strong>{c.name}</strong>
                    <span className="cp-tile-pill">{c.examCount} Paper{c.examCount === 1 ? '' : 's'} <FaChevronRight size={9} /></span>
                    <small>{c.publishedCount} published · {c.instituteCount} institute{c.instituteCount === 1 ? '' : 's'}</small>
                  </button>
                ))}
                {!companySearch && (
                  <button type="button" className="cp-tile cp-tile-add" onClick={() => { setFormError(''); setCompanyForm({ _id: '', name: '', description: '', logoUrl: '' }) }}>
                    <span className="cp-tile-logo"><FaPlus /></span>
                    <strong>Add company</strong>
                    <small>TCS, Infosys, Wipro…</small>
                  </button>
                )}
              </div>
              {!visibleCompanies.length && <EmptyState icon={FaBuilding} title="No company matches" text="Try another name." />}
            </div>
          )}
          </>
        )}
      </AdminPage>

      {/* ── Company (exams + institute access) ── */}
            {/* ── Selected company ── */}
      <Modal show={!!selected} onHide={() => setSelectedId('')} centered size="xl" dialogClassName="cp-detail-dialog" contentClassName="aui-modal cp-detail-modal" backdropClassName="aui-backdrop">
            {selected && (
              <div className="aui-page cp-detail">
                <div className="cp-detail-head">
                  <CompanyLogo company={selected} size={52} />
                  <div className="cp-detail-title">
                    <h3>{selected.name} {selected.isActive ? <span className="aui-badge aui-badge-green">Active</span> : <span className="aui-badge aui-badge-muted">Hidden from students</span>}</h3>
                    <p>{selected.description || `${selected.examCount} exams · ${selected.publishedCount} published · ${selected.questionCount} questions`}</p>
                  </div>
                  <div className="cp-detail-actions">
                    <div className="cp-head-controls">
                      <Tabs small value={tab} onChange={setTab} label="Company sections" items={[
                        { value: 'exams', label: 'Exams', icon: FaClipboardList, count: selected.examCount },
                        { value: 'access', label: 'Institute access', icon: FaUniversity, count: selected.instituteCount },
                      ]} />
                      <div className="aui-toolbar-filters">
                        {tab === 'exams' ? (
                          <>
                            <AdminSelect label="Level" prefix="Level:" value={levelFilter} onChange={setLevelFilter} options={[{ value: '', label: 'All' }, ...LEVELS.map(l => ({ value: l, label: l }))]} />
                            <button type="button" className="aui-btn aui-btn-primary" onClick={() => openExam()}><FaPlus size={10} /> New exam</button>
                          </>
                        ) : (
                          <SearchInput value={accessSearch} onChange={setAccessSearch} placeholder="Search institutes…" />
                        )}
                      </div>
                    </div>
                        <span className="cp-head-sep" />
                    <button type="button" className="aui-btn aui-btn-sm" onClick={() => toggleActive(selected)}>{selected.isActive ? 'Hide' : 'Show'}</button>
                    <button type="button" className="aui-icon-btn" onClick={() => { setFormError(''); setCompanyForm({ _id: selected._id, name: selected.name, description: selected.description || '', logoUrl: selected.logoUrl || '' }) }} aria-label="Edit company"><FaEdit size={11} /></button>
                    {/* Delete only an empty company; with exams, use Hide so nothing is lost by accident */}
                    {selected.examCount === 0 && (
                      <button type="button" className="aui-icon-btn" onClick={() => deleteCompany(selected)} aria-label="Delete company" title="Delete company"><FaTrash size={11} /></button>
                    )}
                    <span className="cp-head-sep" />
                    <button type="button" className="aui-icon-btn" onClick={() => setSelectedId('')} aria-label="Close"><FaTimes size={12} /></button>
                  </div>
                </div>
                <div className="cp-detail-body">

                {tab === 'exams' && exams.some(e => e.status !== 'published') && (
                  <div className="aui-alert aui-alert-info cp-draft-note">
                    <FaExclamationTriangle />
                    <span><b>{exams.filter(e => e.status !== 'published').length} draft exam{exams.filter(e => e.status !== 'published').length === 1 ? '' : 's'}</b> — students can't see drafts. Click <b>Publish</b> on an exam to make it available.</span>
                  </div>
                )}
                {tab === 'exams' ? (
                  examsLoading ? <div className="cp-loading"><FaSpinner className="aui-spin" /> Loading exams…</div>
                    : visibleExams.length === 0 ? (
                      <EmptyState icon={FaClipboardList} title={exams.length ? 'No exams at this level' : 'No exams yet'}
                        text={exams.length ? 'Pick another level.' : `Create ${selected.name}'s first practice exam. Each exam has a level, a time limit and sections.`}
                        action={!exams.length ? <button type="button" className="aui-btn aui-btn-primary" onClick={() => openExam()}><FaPlus size={10} /> New exam</button> : undefined} />
                    ) : (
                      <div className="aui-table-scroll">
                        <table className="aui-table cp-table">
                          <thead><tr><th style={{ width: 44 }}>#</th><th>Exam</th><th>Level</th><th>Sections</th><th>Questions</th><th>Duration</th><th>Status</th><th className="text-end">Actions</th></tr></thead>
                          <tbody>
                            {visibleExams.map((e, i) => (
                              <tr key={e._id}>
                                <td className="cp-muted">{i + 1}</td>
                                <td><b className="cp-exam-title">{e.title}</b><small className="cp-muted">{e.totalMarks} marks</small></td>
                                <td><span className={`aui-badge ${LEVEL_BADGE[e.level]}`}>{e.level}</span></td>
                                <td>
                                  <div className="cp-sections">{e.sections.map(s => <span key={s.name} title={`${e.bySection[s.name] || 0} questions`}>{s.name} <b>{e.bySection[s.name] || 0}</b></span>)}</div>
                                </td>
                                <td>
                                  <b>{e.questionCount}</b>
                                  <small className="cp-muted cp-types">{e.byType.mcq ? `${e.byType.mcq} MCQ` : ''}{e.byType.fill ? ` · ${e.byType.fill} fill` : ''}{e.byType.coding ? ` · ${e.byType.coding} coding` : ''}</small>
                                </td>
                                <td>{e.durationMins} min</td>
                                <td>
                                  {e.status === 'published' ? (
                                    <button type="button" className="cp-status is-live" onClick={() => togglePublish(e)} title="Visible to students — click to move back to draft">
                                      <span className="aui-badge-dot" /> Published
                                    </button>
                                  ) : (
                                    <div className="cp-draft">
                                      <span className="cp-status"><span className="aui-badge-dot" /> Draft</span>
                                      <button type="button" className="aui-btn aui-btn-sm cp-publish" onClick={() => togglePublish(e)} disabled={!e.questionCount} title={e.questionCount ? 'Make this exam visible to students' : 'Add questions first'}>Publish</button>
                                    </div>
                                  )}
                                </td>
                                <td className="text-end">
                                  <div className="cp-actions">
                                    <button type="button" className="aui-btn aui-btn-sm" onClick={() => setQuestionsExam(e)}><FaListUl size={10} /> Questions</button>
                                    <button type="button" className="aui-icon-btn" onClick={() => openExam(e)} aria-label="Edit exam"><FaEdit size={11} /></button>
                                    <button type="button" className="aui-icon-btn" onClick={() => deleteExam(e)} aria-label="Delete exam"><FaTrash size={11} /></button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                ) : accessLoading ? (
                  <div className="cp-loading"><FaSpinner className="aui-spin" /> Loading institutes…</div>
                ) : (
                  <>
                    <p className="cp-access-note">Enabled for <b>{enabledCount}</b> of {access.length} institutes. Students of an enabled institute see all <b>published</b> {selected.name} exams{selected.isActive ? '' : ' once the company is shown'}.</p>
                    {visibleAccess.length === 0 ? <EmptyState icon={FaUniversity} title="No institutes found" /> : (
                      <div className="aui-table-scroll">
                        <table className="aui-table">
                          <thead><tr><th>Institute</th><th>Domain</th><th>Status</th><th>Enabled on</th><th className="text-end">Access</th></tr></thead>
                          <tbody>
                            {visibleAccess.map(a => (
                              <tr key={a._id} className={a.enabled ? 'cp-row-on' : ''}>
                                <td><b>{a.name}</b>{a.email && <small className="cp-muted">{a.email}</small>}</td>
                                <td className="cp-muted">{a.domain || '—'}</td>
                                <td><span className={`aui-badge ${a.status === 'inactive' ? 'aui-badge-muted' : 'aui-badge-green'}`}>{a.status === 'inactive' ? 'Inactive' : 'Active'}</span></td>
                                <td className="cp-muted">{a.enabled ? fmtDate(a.enabledAt) : '—'}</td>
                                <td className="text-end">
                                  <label className="cp-switch" title={a.enabled ? 'Turn off access' : 'Give access'}>
                                    <input type="checkbox" checked={a.enabled} disabled={accessBusy === a._id} onChange={() => toggleAccess(a)} />
                                    <span className="aui-toggle-track" />
                                    <span>{accessBusy === a._id ? <FaSpinner className="aui-spin" /> : a.enabled ? 'Enabled' : 'Off'}</span>
                                  </label>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
                </div>
              </div>
            )}
      </Modal>

      {/* ── Company form ── */}
      <Modal show={!!companyForm} onHide={() => !saving && setCompanyForm(null)} centered className="cp-modal-top" contentClassName="aui-modal" backdropClassName="aui-backdrop cp-backdrop-top">
        {companyForm && (
          <div className="aui-page">
            <div className="aui-modal-head">
              <span className="aui-heading-icon"><FaBuilding /></span>
              <div><h3>{companyForm._id ? 'Edit company' : 'Add company'}</h3><p>Students see the name and logo on their preparation page.</p></div>
              <button type="button" className="aui-icon-btn" onClick={() => setCompanyForm(null)} disabled={saving} aria-label="Close"><FaTimes size={12} /></button>
            </div>
            <div className="aui-modal-body cp-form">
              {formError && <div className="aui-alert"><FaExclamationTriangle /> <span>{formError}</span></div>}
              <div className="cp-logo-row">
                <CompanyLogo company={{ name: companyForm.name || '?', logoUrl: companyForm.logoUrl }} size={56} />
                <label className="aui-btn aui-btn-sm">
                  <FaImage size={11} /> {companyForm.logoUrl ? 'Change logo' : 'Upload logo'}
                  <input type="file" accept="image/*" hidden onChange={e => uploadLogo(e.target.files?.[0])} />
                </label>
                {companyForm.logoUrl && <button type="button" className="aui-btn aui-btn-sm" onClick={() => setCompanyForm({ ...companyForm, logoUrl: '' })}>Remove</button>}
              </div>
              <div className="aui-field">
                <label className="aui-label" htmlFor="cp-name">Company name</label>
                <input id="cp-name" className="aui-input" value={companyForm.name} placeholder="e.g. TCS" autoFocus onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })} />
              </div>
              <div className="aui-field" style={{ marginBottom: 0 }}>
                <label className="aui-label" htmlFor="cp-desc">Description <span className="aui-optional">Optional</span></label>
                <textarea id="cp-desc" className="aui-input cp-textarea" rows={3} value={companyForm.description} placeholder="e.g. TCS NQT pattern — aptitude, reasoning, verbal and coding" onChange={e => setCompanyForm({ ...companyForm, description: e.target.value })} />
              </div>
            </div>
            <div className="aui-modal-foot">
              <button type="button" className="aui-btn" onClick={() => setCompanyForm(null)} disabled={saving}>Cancel</button>
              <button type="button" className="aui-btn aui-btn-primary" onClick={saveCompany} disabled={saving || !companyForm.name.trim()}>
                {saving ? <FaSpinner className="aui-spin" style={{ color: '#fff' }} /> : <FaCheckCircle size={11} />} {companyForm._id ? 'Save' : 'Add company'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Exam form ── */}
      <Modal show={!!examForm} onHide={() => !saving && setExamForm(null)} centered size="lg" className="cp-modal-top" contentClassName="aui-modal" backdropClassName="aui-backdrop cp-backdrop-top">
        {examForm && (
          <div className="aui-page">
            <div className="aui-modal-head">
              <span className="aui-heading-icon"><FaClipboardList /></span>
              <div><h3>{examForm._id ? 'Edit exam' : 'New exam'}</h3><p>{selected?.name}</p></div>
              <button type="button" className="aui-icon-btn" onClick={() => setExamForm(null)} disabled={saving} aria-label="Close"><FaTimes size={12} /></button>
            </div>
            <div className="aui-modal-body cp-form">
              {formError && <div className="aui-alert"><FaExclamationTriangle /> <span>{formError}</span></div>}
              <div className="cp-title-row">
                <div className="aui-field">
                  <label className="aui-label" htmlFor="cp-title">Exam title</label>
                  <input id="cp-title" className="aui-input" value={examForm.title} onChange={e => setExamForm({ ...examForm, title: e.target.value })} />
                </div>
                <div className="aui-field">
                  <label className="aui-label" htmlFor="cp-dur">Time limit (min)</label>
                  <input id="cp-dur" type="number" min={1} className="aui-input" value={examForm.durationMins} onChange={e => setExamForm({ ...examForm, durationMins: Number(e.target.value) })} />
                </div>
                <div className="aui-field">
                  <span className="aui-label">Level</span>
                  <AdminSelect label="Level" value={examForm.level} onChange={v => setExamForm({ ...examForm, level: v as Level })} options={LEVELS.map(l => ({ value: l, label: l }))} />
                </div>
              </div>

              {!examForm._id ? (
                <div className="aui-field">
                  <span className="aui-label">Questions <span className="aui-optional">Excel: Title · Type · Question · Options · Correct Answer · Marks</span></span>
                  {!sheet ? (
                    <label className="cp-drop" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); onSheet(e.dataTransfer.files?.[0]) }}>
                      <input type="file" accept=".xlsx,.xls,.csv" hidden onChange={e => { onSheet(e.target.files?.[0]); e.target.value = '' }} />
                      <span className="cp-drop-icon"><FaFileExcel /></span>
                      <b>Upload the questions Excel</b>
                      <small>Drop the file here or click to choose. Sections come from the Title column.</small>
                      <button type="button" className="aui-btn aui-btn-sm" onClick={e => { e.preventDefault(); downloadQuestionTemplate(`${selected?.name || 'Company'} exam template.xlsx`) }}><FaDownload size={10} /> Download template</button>
                    </label>
                  ) : (
                    <div className="cp-sheet">
                      <div className="cp-sheet-head">
                        <span className="cp-drop-icon"><FaFileExcel /></span>
                        <div><b>{sheet.fileName}</b><small>{sheet.rows.length} question{sheet.rows.length === 1 ? '' : 's'} · {sheet.sections.length} section{sheet.sections.length === 1 ? '' : 's'}</small></div>
                        <label className="aui-btn aui-btn-sm">Change file<input type="file" accept=".xlsx,.xls,.csv" hidden onChange={e => { onSheet(e.target.files?.[0]); e.target.value = '' }} /></label>
                      </div>
                      <div className="cp-sheet-grid">
                        <div>
                          <span className="aui-section-label">Sections</span>
                          {sheet.sections.map(sec => <div key={sec.name} className="cp-sheet-row"><span>{sec.name}</span><b>{sec.count}</b></div>)}
                        </div>
                        <div>
                          <span className="aui-section-label">Types</span>
                          {Object.entries(sheet.byType).map(([t, n]) => <div key={t} className="cp-sheet-row"><span>{t === 'mcq' ? 'MCQ' : t === 'fill' ? 'Fill in the blank' : 'Coding'}</span><b>{n}</b></div>)}
                          <div className="cp-sheet-row"><span>Total marks</span><b>{sheet.rows.reduce((t, r) => t + (Number(r.marks) || 0), 0)}</b></div>
                        </div>
                      </div>
                      {sheet.problems.length > 0 && (
                        <div className="aui-alert cp-sheet-errors"><FaExclamationTriangle /><div><b>Check these rows:</b><ul>{sheet.problems.slice(0, 6).map((p, i) => <li key={i}>Row {p.row}: {p.message}</li>)}</ul></div></div>
                      )}
                    </div>
                  )}
                  {sheetErrors.length > 0 && (
                    <div className="aui-alert cp-sheet-errors"><FaExclamationTriangle /><div><b>Fix these rows and upload again:</b><ul>{sheetErrors.slice(0, 8).map((p, i) => <li key={i}>{p.row ? `Row ${p.row}: ` : ''}{p.message}</li>)}</ul>{sheetErrors.length > 8 && <small>…and {sheetErrors.length - 8} more</small>}</div></div>
                  )}
                </div>
              ) : null}


              {examForm._id && (
                <div className="aui-field">
                  <span className="aui-label"><FaLayerGroup size={10} /> Sections <span className="aui-optional">Rename in place to keep the questions</span></span>
                  <div className="cp-section-list">
                    {examForm.sections.map((sec, i) => (
                      <div key={i} className="cp-section-item">
                        <FaGripLines className="cp-muted" />
                        <input className="aui-input" value={sec} onChange={e => setExamForm({ ...examForm, sections: examForm.sections.map((x, j) => (j === i ? e.target.value : x)) })} />
                        {examForm.sections.length > 1 && (
                          <button type="button" className="aui-icon-btn" onClick={() => setExamForm({ ...examForm, sections: examForm.sections.filter((_, j) => j !== i), original: examForm.original.filter((_, j) => j !== i) })} aria-label="Remove section"><FaTimes size={10} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {!examForm._id && (
                <label className="aui-toggle">
                  <input type="checkbox" checked={publishNow} onChange={e => setPublishNow(e.target.checked)} />
                  <span className="aui-toggle-track" />
                  <span><strong>Publish right away</strong><small>{publishNow ? 'Students of enabled institutes can take it as soon as it is created.' : 'Saved as a draft — students see it only after you publish.'}</small></span>
                </label>
              )}
              <div className="aui-field" style={{ marginBottom: 0 }}>
                <label className="aui-label" htmlFor="cp-ins">Instructions <span className="aui-optional">Shown before the exam starts</span></label>
                <textarea id="cp-ins" className="aui-input cp-textarea" rows={3} value={examForm.instructions} placeholder="e.g. No negative marking. Each section is timed together." onChange={e => setExamForm({ ...examForm, instructions: e.target.value })} />
              </div>
            </div>
            <div className="aui-modal-foot">
              <button type="button" className="aui-btn" onClick={() => setExamForm(null)} disabled={saving}>Cancel</button>
              <button type="button" className="aui-btn aui-btn-primary" onClick={saveExam} disabled={saving || !examForm.title.trim() || (examForm._id ? !examForm.sections.some(x => x.trim()) : !sheet)}>
                {saving ? <FaSpinner className="aui-spin" style={{ color: '#fff' }} /> : <FaCheckCircle size={11} />} {examForm._id ? 'Save exam' : 'Create exam'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <QuestionsManager api={api} exam={questionsExam} show={!!questionsExam} onHide={() => setQuestionsExam(null)} onChanged={() => { loadExams(); loadCompanies() }} />

      <style>{`
        .cp-loading { display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 200px; color: #9da2a8; }
        .cp-grid-wrap { margin-top: 0.75rem; }
        .cp-head-search { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
        .cp-head-search .aui-search { width: 340px; max-width: 100%; }
        .cp-head-search .cp-muted { font-size: 0.76rem; white-space: nowrap; }
        .cp-grid-bar .cp-muted { font-size: 0.78rem; }
        .cp-grid-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 1rem; }
        .cp-grid-bar .aui-search { max-width: 360px; flex: 1; }
        .cp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 14px; }
        .cp-tile { position: relative; display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 1.25rem 1rem 1.1rem; border: 1px solid #25282b; border-radius: 16px; background: #0e1012; color: inherit; cursor: pointer; transition: border-color 0.18s, transform 0.18s, box-shadow 0.18s; }
        .cp-tile:hover { border-color: rgba(255,122,0,0.5); transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,0.35); }
        .cp-tile.is-off { opacity: 0.7; }
        .cp-tile-flag { position: absolute; top: 10px; right: 10px; }
        .cp-tile-logo { display: grid; place-items: center; width: 96px; height: 96px; margin-bottom: 4px; overflow: hidden; border: 2px solid #ff7a00; border-radius: 22px; background: #fff; box-shadow: 0 0 0 5px rgba(255,122,0,0.08), 0 6px 18px rgba(255,122,0,0.15); }
        .cp-tile-logo img { width: 78%; height: 78%; object-fit: contain; }
        .cp-tile-logo b { color: #ff7a00; font-size: 1.5rem; font-weight: 800; }
        .cp-tile strong { color: #fff; font-size: 0.98rem; font-weight: 750; text-align: center; }
        .cp-tile-pill { display: inline-flex; align-items: center; gap: 6px; padding: 3px 12px; border-radius: 99px; background: rgba(255,122,0,0.12); color: #ffa04d; font-size: 0.76rem; font-weight: 700; }
        .cp-tile small { color: #6b7280; font-size: 0.7rem; }
        .cp-tile-add { border-style: dashed; border-color: #34383d; background: transparent; justify-content: center; }
        .cp-tile-add .cp-tile-logo { border: 1.5px dashed #ff7a00; background: rgba(255,122,0,0.06); box-shadow: none; color: #ff9a3c; font-size: 1.6rem; }
        .cp-tile-add strong { color: #ffb15e; }
        /* big, fixed-size popup (~90% of the screen) so it doesn't jump with the content */
        .cp-detail-dialog { width: 92vw; max-width: 1600px; margin-top: 4vh; margin-bottom: 4vh; }
        .cp-detail-modal { overflow: hidden; }
        .cp-detail { display: flex; flex-direction: column; height: 88vh; }
        .cp-detail .cp-detail-head { padding: 1rem 1.25rem; }
        .cp-detail-body { display: flex; flex: 1; flex-direction: column; min-height: 0; padding: 0 1.25rem 1.25rem; overflow-y: auto; }
        .cp-detail-body > .aui-empty { flex: 1; justify-content: center; }
        .cp-head-controls { display: flex; align-items: center; gap: 10px; }
        .cp-head-controls .aui-toolbar-filters { display: flex; align-items: center; gap: 8px; }
        .cp-head-controls .aui-search { width: 260px; }
        .cp-detail .cp-detail-head { flex-wrap: wrap; }
        .cp-detail .cp-detail-body { padding-top: 1rem; }
        .cp-head-sep { width: 1px; height: 22px; margin: 0 4px; background: #25282b; }
        .cp-modal-top { z-index: 1070 !important; }
        .cp-backdrop-top { z-index: 1065 !important; }
        .cp-back { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 0.9rem; padding: 0; border: 0; background: none; color: #9da2a8; font-size: 0.78rem; font-weight: 700; cursor: pointer; }
        .cp-back:hover { color: #ffb15e; }
        .cp-companies { display: flex; flex-direction: column; gap: 10px; padding: 0.9rem; position: sticky; top: 1rem; }
        .cp-companies ul { display: flex; flex-direction: column; gap: 4px; max-height: 70vh; margin: 0; padding: 0; overflow-y: auto; list-style: none; }
        .cp-company { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 10px; border: 1px solid transparent; border-radius: 10px; background: transparent; color: inherit; text-align: left; cursor: pointer; }
        .cp-company:hover { background: #141618; }
        .cp-company.is-active { border-color: rgba(255,122,0,0.45); background: rgba(255,122,0,0.07); }
        .cp-company-text { display: flex; flex-direction: column; flex: 1; min-width: 0; }
        .cp-company-text b { overflow: hidden; color: #e5e7eb; font-size: 0.86rem; text-overflow: ellipsis; white-space: nowrap; }
        .cp-company-text small { color: #6b7280; font-size: 0.72rem; }
        .cp-none { padding: 1rem; color: #6b7280; font-size: 0.8rem; text-align: center; }
        .cp-logo { position: relative; display: grid; place-items: center; flex: 0 0 auto; overflow: hidden; border: 1px solid #25282b; border-radius: 10px; background: #fff; color: #ff7a00; font-size: 0.78rem; }
        .cp-logo img { position: absolute; inset: 0; width: 100%; height: 100%; padding: 4px; object-fit: contain; background: #fff; }
        .cp-logo b { font-weight: 800; }
        .cp-detail { padding: 1.1rem 1.25rem; min-width: 0; }
        .cp-detail-head { display: flex; align-items: center; gap: 14px; padding-bottom: 1rem; border-bottom: 1px solid #1d2023; }
        .cp-detail-title { flex: 1; min-width: 0; }
        .cp-detail-title h3 { display: flex; align-items: center; gap: 8px; margin: 0; color: #fff; font-size: 1.1rem; font-weight: 750; }
        .cp-detail-title p { margin: 3px 0 0; color: #858a90; font-size: 0.8rem; }
        .cp-detail-actions { display: flex; align-items: center; gap: 6px; }
        .cp-toolbar { margin: 1rem 0 0.75rem; padding: 0 !important; border: 0 !important; background: transparent !important; }
        .cp-exam-title { min-width: 150px; }
        .cp-table td { vertical-align: middle; }
        .cp-exam-title { display: block; color: #e5e7eb; }
        .cp-muted { color: #6b7280; }
        td small.cp-muted { display: block; font-size: 0.72rem; }
        .cp-types { white-space: nowrap; }
        .cp-sections { display: flex; flex-wrap: wrap; gap: 4px; max-width: 360px; }
        .cp-sections span { padding: 2px 8px; border: 1px solid #25282b; border-radius: 99px; color: #9da2a8; font-size: 0.68rem; white-space: nowrap; }
        .cp-sections b { color: #e5e7eb; }
        .cp-status { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border: 1px solid #2c3034; border-radius: 99px; background: transparent; color: #9da2a8; font-size: 0.72rem; font-weight: 700; cursor: pointer; }
        .cp-status .aui-badge-dot { width: 7px; height: 7px; border-radius: 50%; background: #6b7280; }
        .cp-status.is-live { border-color: rgba(49,216,102,0.45); background: rgba(49,216,102,0.08); color: #45dd75; }
        .cp-status.is-live .aui-badge-dot { background: #45dd75; }
        .cp-draft { display: inline-flex; align-items: center; gap: 6px; }
        .cp-publish { border-color: rgba(49,216,102,0.45) !important; background: rgba(49,216,102,0.1) !important; color: #45dd75 !important; }
        .cp-draft-note { margin-bottom: 0.75rem; }
        .cp-actions { display: inline-flex; align-items: center; gap: 6px; }
        .cp-access-note { margin: 0 0 0.75rem; color: #9da2a8; font-size: 0.8rem; }
        .cp-access-note b { color: #fff; }
        .cp-row-on td { background: rgba(49,216,102,0.03); }
        .cp-switch { display: inline-flex; align-items: center; gap: 8px; color: #9da2a8; font-size: 0.76rem; font-weight: 700; cursor: pointer; }
        .cp-switch input { position: absolute; opacity: 0; pointer-events: none; }
        .cp-switch input:checked + .aui-toggle-track { background: #31d866; }
        .cp-switch input:checked + .aui-toggle-track::after { background: #fff; transform: translateX(16px); }
        .cp-switch input:checked ~ span:last-child { color: #45dd75; }
        .cp-form { display: flex; flex-direction: column; gap: 0.85rem; max-height: 72vh; overflow-y: auto; }
        .cp-form .aui-field { margin-bottom: 0; }
        .cp-textarea { height: auto; padding: 0.55rem 0.75rem; line-height: 1.5; resize: vertical; }
        .cp-logo-row { display: flex; align-items: center; gap: 10px; }
        .cp-levels { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; }
        .cp-level { height: 40px; border: 1px solid #2c3034; border-radius: 10px; background: #111315; color: #9da2a8; font-size: 0.82rem; font-weight: 700; cursor: pointer; }
        .cp-level.is-on.lvl-easy { border-color: rgba(49,216,102,0.55); background: rgba(49,216,102,0.1); color: #45dd75; }
        .cp-level.is-on.lvl-medium { border-color: rgba(244,180,63,0.55); background: rgba(244,180,63,0.1); color: #f4b43f; }
        .cp-level.is-on.lvl-hard { border-color: rgba(251,95,103,0.55); background: rgba(251,95,103,0.1); color: #fb737a; }
        .cp-title-row { display: grid; grid-template-columns: minmax(0, 1fr) 150px 170px; gap: 0 1rem; }
        .cp-drop { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 1.4rem 1rem; border: 1.5px dashed #34383d; border-radius: 12px; background: #0e1012; text-align: center; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
        .cp-drop:hover { border-color: rgba(49,216,102,0.55); background: rgba(49,216,102,0.04); }
        .cp-drop b { color: #e5e7eb; font-size: 0.9rem; }
        .cp-drop small { color: #6b7280; font-size: 0.76rem; }
        .cp-drop .aui-btn { margin-top: 6px; }
        .cp-drop-icon { display: grid; place-items: center; width: 42px; height: 42px; flex: 0 0 42px; border-radius: 11px; background: rgba(49,216,102,0.12); color: #45dd75; font-size: 1.2rem; }
        .cp-sheet { padding: 0.85rem; border: 1px solid rgba(49,216,102,0.3); border-radius: 12px; background: rgba(49,216,102,0.04); }
        .cp-sheet-head { display: flex; align-items: center; gap: 10px; }
        .cp-sheet-head > div { display: flex; flex-direction: column; flex: 1; min-width: 0; }
        .cp-sheet-head b { overflow: hidden; color: #e5e7eb; font-size: 0.86rem; text-overflow: ellipsis; white-space: nowrap; }
        .cp-sheet-head small { color: #858a90; font-size: 0.74rem; }
        .cp-sheet-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-top: 0.8rem; }
        .cp-sheet-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #1d2023; color: #c4c8ce; font-size: 0.8rem; }
        .cp-sheet-row b { color: #fff; }
        .cp-sheet-errors { margin-top: 0.6rem; }
        .cp-sheet-errors ul { margin: 4px 0 0; padding-left: 1.1rem; font-size: 0.76rem; }
        @media (max-width: 575.98px) { .cp-title-row, .cp-sheet-grid { grid-template-columns: 1fr; } }
        .cp-section-list { display: flex; flex-direction: column; gap: 6px; }
        .cp-section-item { display: flex; align-items: center; gap: 8px; }
        .cp-section-item > svg { flex: 0 0 auto; }
        @media (max-width: 991.98px) {
          .cp-companies { position: static; }
          .cp-companies ul { max-height: 220px; }
        }
      `}</style>
    </>
  )
}

export default CompanyPrepPage
