import { useState, useEffect, useCallback, useRef } from 'react'
import { Modal } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import Step1 from './components/Step1'
import Step2 from './components/Step2'
import { CompanyLogo, roundTitle } from './components/shared'
import { useAuthContext } from '@/context/useAuthContext'
import { AdminPage, EmptyState, PageHeader, SearchInput, TableFooter } from '@/components/admin-ui'
import { UPLOAD_CSS } from '../aptitudeQuestionsUpload/components/UploadParts'
import {
  FaArrowLeft, FaBuilding, FaCheck, FaCheckCircle, FaChevronLeft, FaChevronRight, FaEdit,
  FaExclamationTriangle, FaGift, FaMapMarkerAlt, FaPlus, FaSpinner, FaSyncAlt, FaTimes, FaTrash,
} from 'react-icons/fa'

const PAGE_SIZE = 10

const emptyForm = {
  companyName: '',
  title: '',
  logoUrl: '',
  role: '',
  package: '',
  location: '',
  description: '',
  rounds: [] as any[],
}

const CompanyInterview = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  // ── View state ──────────────────────────────────────────────
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editId, setEditId] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<any>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null)

  // ── List state ───────────────────────────────────────────────
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [listError, setListError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ── Fetch list ───────────────────────────────────────────────
  const fetchCompanies = useCallback(async (p = 1, q = '') => {
    setLoading(true)
    setListError('')
    try {
      const res = await fetch(
        `${baseURL}/api/company-interview/?page=${p}&limit=${PAGE_SIZE}&search=${encodeURIComponent(q)}`,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      )
      const data = await res.json()
      if (data.success) {
        setCompanies(data.data)
        setPagination(data.pagination)
      } else {
        setListError(data.error || 'Could not load company interviews.')
      }
    } catch (e) {
      console.error(e)
      setListError('Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }, [baseURL, user?.token])

  // Search as you type (debounced); page changes fetch immediately
  const firstSearch = useRef(true)
  useEffect(() => {
    if (view !== 'list') return
    if (firstSearch.current) { firstSearch.current = false; return }
    // On another page, resetting to page 1 triggers the fetch below
    const t = setTimeout(() => { if (page !== 1) setPage(1); else fetchCompanies(1, search) }, 350)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line

  useEffect(() => {
    if (view === 'list') fetchCompanies(page, search)
  }, [view, page]) // eslint-disable-line

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(''), 5000)
    return () => clearTimeout(t)
  }, [notice])

  const backToList = () => {
    setView('list')
    setEditId(null)
    setFormData(emptyForm)
    setFormError('')
    setStep(1)
  }

  // ── Open create form ─────────────────────────────────────────
  const handleCreate = () => {
    setEditId(null)
    setFormData(emptyForm)
    setFormError('')
    setStep(1)
    setView('form')
  }

  // ── Open edit form ───────────────────────────────────────────
  const handleEdit = async (id: string) => {
    setLoadingEditId(id)
    setListError('')
    try {
      const res = await fetch(`${baseURL}/api/company-interview/${id}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      const data = await res.json()
      if (!data.success) { setListError(data.error || 'Failed to load company'); return }

      const c = data.data
      setFormData({
        companyName: c.companyName || '',
        title: c.title || '',
        logoUrl: c.logoUrl || '',
        role: c.role || '',
        package: c.package || '',
        location: c.location || '',
        description: c.description || '',
        rounds: (c.rounds || []).map((r: any) => ({
          roundName: r.roundName,
          roundType: r.roundType,
          duration: r.duration || '',
          questionCount: r.questionCount || '',
          order: r.order,
          questions: r.questions || [],
        })),
      })
      setEditId(id)
      setFormError('')
      setStep(1)
      setView('form')
    } catch (e) {
      setListError('Failed to load company data')
    } finally {
      setLoadingEditId(null)
    }
  }

  // ── Delete ───────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`${baseURL}/api/company-interview/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      const data = await res.json()
      if (data.success) {
        setNotice(`"${deleteTarget.name}" was deleted.`)
        setDeleteTarget(null)
        // Step back a page when the last row on this page was removed
        const nextPage = companies.length === 1 && page > 1 ? page - 1 : page
        if (nextPage !== page) setPage(nextPage)
        else fetchCompanies(page, search)
      } else {
        setListError(data.error || 'Delete failed')
        setDeleteTarget(null)
      }
    } catch (e) {
      setListError('Server error while deleting')
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  // ── Step navigation ──────────────────────────────────────────
  const step1Error = () => {
    if (!formData.companyName?.trim()) return 'Enter the company name.'
    if (!formData.rounds.length) return 'Add at least one hiring round.'
    return ''
  }

  const goToStep = (target: number) => {
    if (target === 2) {
      const err = step1Error()
      if (err) { setFormError(err); return }
    }
    setFormError('')
    setStep(target)
  }

  // ── Submit (create or update) ────────────────────────────────
  const handleSubmit = async () => {
    if (!user?.token) { setFormError('You must be signed in.'); return }

    const missing = formData.rounds.filter((r: any) => !r.questions || r.questions.length === 0)
    if (missing.length) {
      setFormError(`Upload questions for: ${missing.map((r: any) => r.roundName).join(', ')}.`)
      return
    }

    const payload = {
      ...formData,
      rounds: formData.rounds.map((r: any) => ({
        ...r,
        duration: Number(r.duration) || 0,
        questionCount: Number(r.questionCount) || 0,
        questions: r.questions || [],
      })),
    }

    const url = editId
      ? `${baseURL}/api/company-interview/${editId}`
      : `${baseURL}/api/company-interview/create`

    setSaving(true)
    setFormError('')
    try {
      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (data.success) {
        setNotice(editId ? `"${formData.companyName}" was updated.` : `"${formData.companyName}" was created.`)
        // Switching back to the list refetches; show the new/updated paper from page 1
        backToList()
        setPage(1)
        setSearch('')
      } else {
        setFormError(data.error || 'Save failed')
      }
    } catch (e) {
      console.error(e)
      setFormError('Server error while saving')
    } finally {
      setSaving(false)
    }
  }

  // ── Render list ──────────────────────────────────────────────
  if (view === 'list') {
    const total = pagination?.total ?? companies.length

    return (
      <AdminPage>
        <PageMetaData title="Company Interviews" />

        <PageHeader
          icon={FaBuilding}
          title="Company Interviews"
          subtitle="Company-specific interview papers that students practise round by round"
          actions={
            <>
              <button type="button" className="aui-btn" onClick={() => fetchCompanies(page, search)} disabled={loading}>
                <FaSyncAlt size={11} className={loading ? 'aui-spin' : ''} /> Refresh
              </button>
              <button type="button" className="aui-btn aui-btn-primary" onClick={handleCreate}>
                <FaPlus size={11} /> Add Company
              </button>
            </>
          }
        />

        {notice && (
          <div className="aui-alert aui-alert-success"><FaCheckCircle /> <span>{notice}</span>
            <button type="button" className="aui-alert-close" onClick={() => setNotice('')} aria-label="Dismiss"><FaTimes size={11} /></button>
          </div>
        )}
        {listError && (
          <div className="aui-alert"><FaExclamationTriangle /> <span>{listError}</span>
            <button type="button" className="aui-alert-close" onClick={() => setListError('')} aria-label="Dismiss"><FaTimes size={11} /></button>
          </div>
        )}

        <div className="aui-card">
          <div className="aui-toolbar">
            <div className="aui-toolbar-title">
              <h3>All papers</h3>
              <p>The newest paper is the free sample students can try before buying</p>
            </div>
            <div className="aui-toolbar-filters">
              <SearchInput value={search} onChange={setSearch} placeholder="Search company or role…" />
              <span className="aui-count">{total} paper{total === 1 ? '' : 's'}</span>
            </div>
          </div>

          {loading && companies.length === 0 ? (
            <div className="aui-empty"><FaSpinner className="aui-spin" /><p>Loading company interviews…</p></div>
          ) : companies.length === 0 ? (
            <EmptyState
              icon={FaBuilding}
              title={search ? 'No companies match' : 'No company interviews yet'}
              text={search ? 'Try a different company or role.' : 'Add a company, choose its hiring rounds and upload the questions for each round.'}
              action={search
                ? <button type="button" className="aui-btn" onClick={() => setSearch('')}>Clear search</button>
                : <button type="button" className="aui-btn aui-btn-primary" onClick={handleCreate}><FaPlus size={11} /> Add Company</button>}
            />
          ) : (
            <>
              <div className={`aui-table-scroll${loading ? ' ci-refreshing' : ''}`}>
                <table className="aui-table">
                  <thead>
                    <tr>
                      <th style={{ width: 52 }}>#</th>
                      <th>Company</th>
                      <th>Role</th>
                      <th>Package</th>
                      <th>Location</th>
                      <th>Rounds</th>
                      <th className="text-end" style={{ width: 100 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((c, i) => {
                      const rounds: any[] = [...(c.rounds || [])].sort((a, b) => (a.order || 0) - (b.order || 0))
                      const roundCount = c.roundsCount ?? rounds.length
                      return (
                        <tr key={c._id}>
                          <td className="aui-num">{(page - 1) * PAGE_SIZE + i + 1}</td>
                          <td>
                            <div className="aui-person">
                              <CompanyLogo src={c.logoUrl} name={c.companyName} />
                              <div className="aui-stack">
                                <strong>
                                  {c.companyName}
                                  {c.isFreeSample && <span className="aui-badge aui-badge-green ci-free"><FaGift size={9} /> Free sample</span>}
                                </strong>
                                <small className="ci-sub" title={c.title}>{c.title || 'No title'}</small>
                              </div>
                            </div>
                          </td>
                          <td>{c.role || <span className="ci-dash">—</span>}</td>
                          <td>{c.package ? <span className="ci-package">{c.package}</span> : <span className="ci-dash">—</span>}</td>
                          <td>{c.location ? <span className="aui-inline-icon"><FaMapMarkerAlt /> {c.location}</span> : <span className="ci-dash">—</span>}</td>
                          <td>
                            {rounds.length ? (
                              <div className="ci-rounds" title={rounds.map(roundTitle).join(' → ')}>
                                {rounds.slice(0, 3).map((r, idx) => (
                                  <span key={idx} className="aui-badge aui-badge-muted">{roundTitle(r)}</span>
                                ))}
                                {rounds.length > 3 && <span className="aui-badge aui-badge-orange">+{rounds.length - 3}</span>}
                              </div>
                            ) : (
                              <span className="aui-badge aui-badge-muted">{roundCount} round{roundCount === 1 ? '' : 's'}</span>
                            )}
                          </td>
                          <td className="text-end">
                            <div className="ci-actions">
                              <button type="button" className="aui-icon-btn" title="Edit" onClick={() => handleEdit(c._id)} disabled={loadingEditId !== null}>
                                {loadingEditId === c._id ? <FaSpinner className="aui-spin" /> : <FaEdit />}
                              </button>
                              <button type="button" className="aui-icon-btn ci-del" title="Delete" onClick={() => setDeleteTarget({ id: c._id, name: c.companyName })}>
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <TableFooter page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} noun="papers" />
            </>
          )}
        </div>

        <Modal show={deleteTarget !== null} onHide={() => !deleting && setDeleteTarget(null)} centered contentClassName="aui-modal" backdropClassName="aui-backdrop">
          <div className="aui-modal-head">
            <span className="ci-del-icon"><FaTrash /></span>
            <div>
              <h3>Delete company interview?</h3>
              <p>{deleteTarget?.name}</p>
            </div>
          </div>
          <div className="aui-modal-body">
            <p className="ci-modal-text">
              This removes the paper, all its rounds and their questions. Students will no longer see it. This can't be undone.
            </p>
          </div>
          <div className="aui-modal-foot">
            <button type="button" className="aui-btn" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
            <button type="button" className="aui-btn aui-btn-danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? <FaSpinner className="aui-spin" /> : <FaTrash size={11} />} Delete
            </button>
          </div>
        </Modal>

        <style>{CI_CSS}</style>
      </AdminPage>
    )
  }

  // ── Render form ──────────────────────────────────────────────
  const roundsWithQuestions = formData.rounds.filter((r: any) => r.questions?.length > 0).length
  const steps = [
    { n: 1, title: 'Company & rounds', hint: 'Details and hiring process' },
    { n: 2, title: 'Round questions', hint: formData.rounds.length ? `${roundsWithQuestions} of ${formData.rounds.length} rounds ready` : 'Upload a sheet per round' },
  ]

  return (
    <AdminPage>
      <PageMetaData title={editId ? 'Edit Company Interview' : 'Create Company Interview'} />

      <PageHeader
        icon={editId ? FaEdit : FaPlus}
        title={editId ? `Edit ${formData.companyName || 'company interview'}` : 'New Company Interview'}
        subtitle={editId ? 'Update the paper details, rounds or questions' : 'Set up a company paper in two steps'}
        actions={
          <button type="button" className="aui-btn" onClick={backToList} disabled={saving}>
            <FaArrowLeft size={11} /> Back to list
          </button>
        }
      />

      <div className="ci-stepper" role="tablist" aria-label="Steps">
        {steps.map(s => {
          const done = s.n < step
          return (
            <button
              key={s.n}
              type="button"
              role="tab"
              aria-selected={step === s.n}
              className={`ci-step${step === s.n ? ' is-active' : ''}${done ? ' is-done' : ''}`}
              onClick={() => goToStep(s.n)}
            >
              <span className="ci-step-num">{done ? <FaCheck size={11} /> : s.n}</span>
              <span className="aui-stack">
                <strong>{s.title}</strong>
                <small>{s.hint}</small>
              </span>
            </button>
          )
        })}
      </div>

      {step === 1 && <Step1 formData={formData} setFormData={setFormData} />}
      {step === 2 && <Step2 formData={formData} setFormData={setFormData} />}

      <div className="ci-formbar">
        <div className="ci-formbar-msg">
          {formError
            ? <span className="aui-error"><FaExclamationTriangle /> {formError}</span>
            : <span className="aui-hint">Step {step} of 2</span>}
        </div>
        <div className="ci-formbar-actions">
          {step > 1 && (
            <button type="button" className="aui-btn" onClick={() => goToStep(step - 1)} disabled={saving}>
              <FaChevronLeft size={10} /> Previous
            </button>
          )}
          {step < 2 ? (
            <button type="button" className="aui-btn aui-btn-primary" onClick={() => goToStep(step + 1)}>
              Next: questions <FaChevronRight size={10} />
            </button>
          ) : (
            <button type="button" className="aui-btn aui-btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? <FaSpinner className="aui-spin" style={{ color: '#fff' }} /> : <FaCheck size={11} />}
              {editId ? ' Save changes' : ' Create paper'}
            </button>
          )}
        </div>
      </div>

      <style>{CI_CSS + UPLOAD_CSS}</style>
    </AdminPage>
  )
}

const CI_CSS = `
  .ci-logo { display: inline-grid; place-items: center; flex: 0 0 auto; overflow: hidden; border: 1px solid #2c3034; border-radius: 9px; background: #fff; }
  .ci-logo img { width: 100%; height: 100%; padding: 3px; object-fit: contain; }
  .ci-logo-fallback { display: grid; place-items: center; width: 100%; height: 100%; background: rgba(255,122,0,0.12); color: #ff9a3c; font-size: 0.9rem; font-weight: 800; }
  .ci-sub { display: block; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ci-free { margin-left: 8px; vertical-align: 1px; }
  .ci-dash { color: #4b5056; }
  .ci-package { color: #45dd75; font-weight: 650; }
  .ci-rounds { display: flex; flex-wrap: wrap; gap: 4px; max-width: 300px; }
  .ci-actions { display: inline-flex; gap: 6px; }
  .ci-del:hover { border-color: rgba(251,95,103,0.55) !important; color: #fb737a !important; }
  .ci-refreshing { opacity: 0.55; transition: opacity 0.15s; }
  .ci-del-icon { display: grid; place-items: center; width: 36px; height: 36px; flex: 0 0 36px; border: 1px solid rgba(251,95,103,0.3); border-radius: 10px; background: rgba(251,95,103,0.1); color: #fb737a; }
  .ci-modal-text { margin: 0; color: #a6abb0; font-size: 0.84rem; line-height: 1.6; }

  .ci-stepper { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 1rem; }
  .ci-step { display: flex; align-items: center; gap: 12px; padding: 0.75rem 1rem; border: 1px solid #25282b; border-radius: 12px; background: #0e1012; color: inherit; text-align: left; cursor: pointer; transition: border-color 0.15s, background 0.15s; }
  .ci-step:hover { border-color: #3a3f45; }
  .ci-step.is-active { border-color: rgba(255,122,0,0.55); background: rgba(255,122,0,0.06); }
  .ci-step strong { color: #eceef0; font-size: 0.86rem; }
  .ci-step small { color: #858a90; font-size: 0.72rem; }
  .ci-step-num { display: grid; place-items: center; width: 30px; height: 30px; flex: 0 0 30px; border: 1px solid #34383d; border-radius: 50%; background: #17191c; color: #9da2a8; font-size: 0.8rem; font-weight: 800; }
  .ci-step.is-active .ci-step-num { border-color: #ff7a00; background: #ff7a00; color: #fff; }
  .ci-step.is-done .ci-step-num { border-color: rgba(49,216,102,0.45); background: rgba(49,216,102,0.13); color: #45dd75; }

  .ci-formbar { position: sticky; bottom: 0; z-index: 5; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-top: 1rem; padding: 0.75rem 1rem; border: 1px solid #25282b; border-radius: 12px; background: rgba(14,16,18,0.94); backdrop-filter: blur(8px); }
  .ci-formbar-msg .aui-error { display: inline-flex; align-items: center; gap: 6px; font-size: 0.8rem; }
  .ci-formbar-actions { display: flex; gap: 8px; margin-left: auto; }

  @media (max-width: 575.98px) {
    .ci-stepper { grid-template-columns: 1fr; }
  }
`

export default CompanyInterview
