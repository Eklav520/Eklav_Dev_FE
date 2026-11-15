import { useEffect, useMemo, useState } from 'react'
import { FiArrowLeft, FiArrowRight, FiAward, FiBarChart2, FiBookOpen, FiCheckCircle, FiClock, FiFileText, FiLayers, FiList, FiLoader, FiLock, FiPlay, FiRotateCcw, FiSearch, FiTarget } from 'react-icons/fi'
import { FaBuilding } from 'react-icons/fa'
import PageMetaData from '@/components/PageMetaData'
import { useAuthContext } from '@/context/useAuthContext'
import ExamRunner from './ExamRunner'
import ExamResult from './ExamResult'
import { LEVELS, LEVEL_COLOR, makeApi, type Level, type StudentCompany, type StudentExam } from './api'

/* Student → Self Preparation → Company Preparation
   Companies enabled for the student's institute → practice exams by level → take / review. */

const initials = (n: string) => n.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()

const CompanyPrepStudentPage = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const api = useMemo(() => makeApi(baseURL, user?.token), [baseURL, user?.token])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [available, setAvailable] = useState(true)
  const [institute, setInstitute] = useState('')
  const [companies, setCompanies] = useState<StudentCompany[]>([])
  const [search, setSearch] = useState('')
  const [company, setCompany] = useState<StudentCompany | null>(null)
  const [exams, setExams] = useState<StudentExam[]>([])
  const [examsLoading, setExamsLoading] = useState(false)
  const [level, setLevel] = useState<'' | Level>('')
  const [taking, setTaking] = useState<StudentExam | null>(null)
  const [resultId, setResultId] = useState('')

  const loadCompanies = async () => {
    try {
      const d = await api.companies()
      setAvailable(d.available)
      setInstitute(d.institute?.name || '')
      setCompanies(d.companies)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }
  const loadExams = async (c: StudentCompany) => {
    setExamsLoading(true)
    try { setExams((await api.company(c._id)).exams) } catch (e: any) { setError(e.message) } finally { setExamsLoading(false) }
  }

  useEffect(() => { if (user?.token) loadCompanies() }, [user?.token]) // eslint-disable-line
  const openCompany = (c: StudentCompany) => { setCompany(c); setLevel(''); setExams([]); loadExams(c); window.scrollTo({ top: 0 }) }

  const totals = companies.reduce((t, c) => ({
    papers: t.papers + c.examCount,
    attempted: t.attempted + c.examsAttempted,
    best: c.bestPercentage != null ? Math.max(t.best ?? 0, c.bestPercentage) : t.best,
  }), { papers: 0, attempted: 0, best: null as number | null })
  const visible = companies.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()))
  const levelExams = exams.filter(e => !level || e.level === level)

  return (
    <>
      <PageMetaData title="Company Preparation" />
      <div className="csp-page">
        {!company ? (
          <>
            {/* ── Hero ── */}
            <section className="csp-hero">
              <div className="csp-hero-text">
                <span className="csp-eyebrow"><FaBuilding /> Company Preparation</span>
                <h1>Company-Specific Preparation</h1>
              </div>
              {companies.length > 0 && (
                <div className="csp-hero-stats">
                  <div><FaBuilding /><b>{companies.length}</b><span>Companies</span></div>
                  <div><FiFileText /><b>{totals.papers}</b><span>Papers</span></div>
                  <div><FiCheckCircle /><b>{totals.attempted}</b><span>Attempted</span></div>
                  <div><FiAward /><b>{totals.best != null ? `${Math.round(totals.best)}%` : '—'}</b><span>Best score</span></div>
                </div>
              )}
            </section>

            {error && <div className="csp-alert">{error}</div>}
            {loading ? (
              <div className="csp-empty"><FiLoader className="csp-spin" /> Loading…</div>
            ) : !available || companies.length === 0 ? (
              <div className="csp-empty">
                <span className="csp-empty-icon"><FiLock /></span>
                <h3>Not available yet</h3>
                <p>Company preparation hasn't been enabled for your institute. Ask your placement coordinator to request it.</p>
              </div>
            ) : (
              <>
                <div className="csp-section-head">
                  <h2>Companies</h2>
                  <label className="csp-search"><FiSearch /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies…" /></label>
                </div>
                <div className="csp-grid">
                  {visible.map(c => {
                    const done = c.examCount ? Math.round((c.examsAttempted / c.examCount) * 100) : 0
                    return (
                      <button key={c._id} type="button" className="csp-card" onClick={() => openCompany(c)}>
                        <div className="csp-card-top">
                          <span className="csp-logo">{c.logoUrl ? <img src={c.logoUrl} alt="" /> : <b>{initials(c.name)}</b>}</span>
                          <div className="csp-card-name">
                            <strong>{c.name}</strong>
                            <small>{c.examCount} practice paper{c.examCount === 1 ? '' : 's'}</small>
                          </div>
                          {c.bestPercentage != null && <span className="csp-best"><FiAward /> {Math.round(c.bestPercentage)}%</span>}
                        </div>
                        <div className="csp-lvls">
                          {LEVELS.map(l => (
                            <span key={l} className={c.levels[l] ? '' : 'is-zero'} style={{ ['--lvl' as any]: LEVEL_COLOR[l] }}><i />{l} <b>{c.levels[l]}</b></span>
                          ))}
                        </div>
                        <div className="csp-card-progress">
                          <div className="csp-progress-row"><span>{c.examsAttempted ? `${c.examsAttempted} of ${c.examCount} attempted` : 'Not started yet'}</span><b>{done}%</b></div>
                          <div className="csp-bar"><span style={{ width: `${done}%` }} /></div>
                        </div>
                        <span className="csp-card-cta">View papers <FiArrowRight /></span>
                      </button>
                    )
                  })}
                </div>
                {!visible.length && <div className="csp-empty csp-empty-sm">No company matches “{search}”.</div>}
              </>
            )}
          </>
        ) : (
          <>
            {/* ── Company ── */}
            <section className="csp-hero csp-hero-company">
              <div className="csp-hero-text">
                <button type="button" className="csp-back" onClick={() => { setCompany(null); loadCompanies() }}><FiArrowLeft /> All companies</button>
                <div className="csp-company-id">
                  <span className="csp-logo csp-logo-lg">{company.logoUrl ? <img src={company.logoUrl} alt="" /> : <b>{initials(company.name)}</b>}</span>
                  <div>
                    <h1>{company.name}</h1>
                    <p>{company.description || `${exams.length} practice paper${exams.length === 1 ? '' : 's'} in the ${company.name} pattern`}</p>
                  </div>
                </div>
              </div>
              <div className="csp-hero-stats">
                <div><FiFileText /><b>{exams.length}</b><span>Papers</span></div>
                <div><FiCheckCircle /><b>{exams.filter(e => e.attempts).length}</b><span>Attempted</span></div>
                <div><FiTarget /><b>{exams.reduce((t, e) => t + e.attempts, 0)}</b><span>Total attempts</span></div>
                <div><FiAward /><b>{exams.some(e => e.bestPercentage != null) ? `${Math.round(Math.max(...exams.map(e => e.bestPercentage ?? 0)))}%` : '—'}</b><span>Best score</span></div>
              </div>
            </section>

            <div className="csp-section-head">
              <h2>Practice papers</h2>
              <div className="csp-levels">
                <button type="button" className={!level ? 'is-on' : ''} onClick={() => setLevel('')}>All <span>{exams.length}</span></button>
                {LEVELS.map(l => (
                  <button key={l} type="button" className={level === l ? 'is-on' : ''} style={{ ['--lvl' as any]: LEVEL_COLOR[l] }} onClick={() => setLevel(l)}>
                    <i />{l} <span>{exams.filter(e => e.level === l).length}</span>
                  </button>
                ))}
              </div>
            </div>

            {examsLoading ? (
              <div className="csp-empty"><FiLoader className="csp-spin" /> Loading papers…</div>
            ) : levelExams.length === 0 ? (
              <div className="csp-empty"><span className="csp-empty-icon"><FiBookOpen /></span><h3>No papers here yet</h3><p>{level ? `No ${level} papers for ${company.name} yet.` : `${company.name} papers will appear here once they are published.`}</p></div>
            ) : (
              <div className="csp-list">
                {levelExams.map((e, i) => {
                  const best = e.bestPercentage != null ? Math.round(e.bestPercentage) : null
                  return (
                    <div key={e._id} className="csp-row" style={{ ['--lvl' as any]: LEVEL_COLOR[e.level] }}>
                      <span className="csp-row-no">{String(i + 1).padStart(2, '0')}</span>
                      <div className="csp-row-main">
                        <div className="csp-row-title">
                          <h3>{e.title}</h3>
                          <span className="csp-lvl">{e.level}</span>
                          {e.inProgressAttemptId && <span className="csp-live">● In progress</span>}
                        </div>
                        <div className="csp-row-meta">
                          <span><FiList /> {e.questionCount} questions</span>
                          <span><FiBarChart2 /> {e.totalMarks} marks</span>
                          <span><FiClock /> {e.durationMins} min</span>
                          <span><FiLayers /> {e.sections.map(sec => sec.name).join(' · ')}</span>
                        </div>
                      </div>
                      <div className="csp-row-score">
                        {best != null ? (
                          <>
                            <div className="csp-progress-row"><span>Best score</span><b style={{ color: best >= 75 ? '#16a34a' : best >= 50 ? '#d97706' : '#dc2626' }}>{best}%</b></div>
                            <div className="csp-bar"><span style={{ width: `${best}%`, background: best >= 75 ? '#16a34a' : best >= 50 ? '#d97706' : '#dc2626' }} /></div>
                            <small>{e.attempts} attempt{e.attempts === 1 ? '' : 's'}</small>
                          </>
                        ) : <span className="csp-muted">Not attempted</span>}
                      </div>
                      <div className="csp-row-actions">
                        {e.lastAttempt && <button type="button" className="csp-btn" onClick={() => setResultId(e.lastAttempt!._id)}>Result</button>}
                        <button type="button" className="csp-btn csp-btn-primary" onClick={() => setTaking(e)}>
                          {e.inProgressAttemptId ? <><FiPlay /> Resume</> : e.attempts ? <><FiRotateCcw /> Retake</> : <><FiPlay /> Start</>}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {taking && company && (
        <ExamRunner
          api={api}
          exam={taking}
          companyName={company.name}
          companyLogo={company.logoUrl}
          onExit={() => setTaking(null)}
          onFinished={id => { setTaking(null); setResultId(id); loadExams(company) }}
        />
      )}
      {resultId && (
        <ExamResult
          api={api}
          attemptId={resultId}
          onBack={() => { setResultId(''); if (company) loadExams(company) }}
          onRetake={company ? () => {
            const ex = exams.find(x => x.lastAttempt?._id === resultId) || null
            setResultId('')
            if (ex) setTaking({ ...ex, inProgressAttemptId: null })
          } : undefined}
        />
      )}

      <style>{`
        .csp-page { display: flex; flex-direction: column; gap: 1.25rem; padding: 1.5rem; color: var(--dash-text, #0f172a); }
        .csp-page h1, .csp-page h2, .csp-page h3 { color: var(--dash-text, #0f172a); }
        .csp-spin { animation: csp-rot 0.9s linear infinite; }
        @keyframes csp-rot { to { transform: rotate(360deg); } }
        .csp-muted { color: var(--dash-gray, #64748b); font-size: 0.82rem; }
        .csp-alert { padding: 10px 14px; border: 1px solid rgba(220,38,38,0.3); border-radius: 10px; background: rgba(220,38,38,0.06); color: #dc2626; }

        /* hero */
        .csp-hero { position: relative; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1.5rem; padding: 1.25rem 1.75rem; overflow: hidden; border-radius: 20px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 70%); color: #fff; }
        .csp-hero::before { content: ''; position: absolute; right: -80px; top: -90px; width: 320px; height: 320px; border-radius: 50%; background: radial-gradient(circle, rgba(255,122,0,0.32), transparent 70%); pointer-events: none; }
        .csp-hero-text { position: relative; flex: 1 1 380px; min-width: 0; }
        .csp-eyebrow { display: inline-flex; align-items: center; gap: 7px; padding: 4px 11px; border-radius: 99px; background: rgba(255,122,0,0.18); color: #ffb15e; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase; }
        .csp-page .csp-hero h1 { margin: 10px 0 0; color: #fff; font-size: 1.6rem; font-weight: 800; }
        .csp-hero p { margin: 0; max-width: 560px; color: #cbd5e1; }
        .csp-search { display: flex; align-items: center; gap: 10px; width: 340px; max-width: 100%; height: 42px; padding: 0 14px; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 12px; background: var(--dash-card-bg, #fff); color: var(--dash-gray, #64748b); }
        .csp-search:focus-within { border-color: #ff7a00; box-shadow: 0 0 0 3px rgba(255,122,0,0.12); }
        .csp-search input { flex: 1; border: 0; background: transparent; color: var(--dash-text, #0f172a); font-size: 0.9rem; outline: none; }
        .csp-hero-stats { position: relative; display: grid; grid-template-columns: repeat(4, minmax(96px, 1fr)); gap: 10px; }
        .csp-hero-stats div { display: flex; flex-direction: column; gap: 2px; padding: 0.7rem 1rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; background: rgba(255,255,255,0.06); backdrop-filter: blur(4px); }
        .csp-hero-stats svg { color: #ffb15e; }
        .csp-hero-stats b { color: #fff; font-size: 1.35rem; font-weight: 800; line-height: 1.15; }
        .csp-hero-stats span { color: #94a3b8; font-size: 0.72rem; }
        .csp-back { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 1rem; padding: 0; border: 0; background: none; color: #cbd5e1; font-size: 0.85rem; font-weight: 700; cursor: pointer; }
        .csp-back:hover { color: #ffb15e; }
        .csp-company-id { display: flex; align-items: center; gap: 16px; }
        .csp-page .csp-hero-company h1 { margin: 0 0 4px; }

        /* section heading */
        .csp-section-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-top: 0.25rem; }
        .csp-section-head h2 { margin: 0; font-size: 1.1rem; font-weight: 800; }
        .csp-section-head > span { color: var(--dash-gray, #64748b); font-size: 0.82rem; }

        /* company cards */
        .csp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 16px; }
        .csp-card { display: flex; flex-direction: column; gap: 14px; padding: 1.2rem; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 16px; background: var(--dash-card-bg, #fff); color: inherit; text-align: left; cursor: pointer; transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s; }
        .csp-card:hover { transform: translateY(-3px); border-color: rgba(255,122,0,0.4); box-shadow: 0 14px 30px rgba(15,23,42,0.08); }
        .csp-card-top { display: flex; align-items: center; gap: 12px; }
        .csp-logo { display: grid; place-items: center; width: 56px; height: 56px; flex: 0 0 auto; overflow: hidden; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 14px; background: #fff; box-shadow: 0 2px 8px rgba(15,23,42,0.06); }
        .csp-logo img { width: 82%; height: 82%; object-fit: contain; }
        .csp-logo b { color: #ff7a00; font-size: 1.1rem; font-weight: 800; }
        .csp-logo-lg { width: 76px; height: 76px; border-radius: 18px; border-color: rgba(255,255,255,0.2); }
        .csp-card-name { display: flex; flex-direction: column; flex: 1; min-width: 0; }
        .csp-card-name strong { overflow: hidden; color: var(--dash-text, #0f172a); font-size: 1.05rem; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
        .csp-card-name small { color: var(--dash-gray, #64748b); font-size: 0.78rem; }
        .csp-best { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 99px; background: rgba(22,163,74,0.1); color: #16a34a; font-size: 0.76rem; font-weight: 800; }
        .csp-lvls { display: flex; gap: 6px; }
        .csp-lvls span { display: inline-flex; align-items: center; gap: 6px; flex: 1; justify-content: center; padding: 6px 8px; border-radius: 10px; background: var(--dash-page-bg, #f8fafc); color: var(--dash-gray, #64748b); font-size: 0.76rem; font-weight: 600; }
        .csp-lvls span i, .csp-levels button i { width: 7px; height: 7px; border-radius: 50%; background: var(--lvl); }
        .csp-lvls span b { color: var(--dash-text, #0f172a); }
        .csp-lvls span.is-zero { opacity: 0.5; }
        .csp-card-progress { display: flex; flex-direction: column; gap: 6px; }
        .csp-progress-row { display: flex; justify-content: space-between; color: var(--dash-gray, #64748b); font-size: 0.78rem; }
        .csp-progress-row b { color: var(--dash-text, #0f172a); }
        .csp-bar { height: 6px; overflow: hidden; border-radius: 99px; background: var(--dash-border, #e2e8f0); }
        .csp-bar span { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, #ff7a00, #ffb15e); transition: width 0.6s; }
        .csp-card-cta { display: inline-flex; align-items: center; gap: 6px; padding-top: 12px; border-top: 1px solid var(--dash-border, #eef2f6); color: #ea580c; font-size: 0.84rem; font-weight: 700; }
        .csp-card:hover .csp-card-cta svg { transform: translateX(3px); }
        .csp-card-cta svg { transition: transform 0.18s; }

        /* level filter */
        .csp-levels { display: inline-flex; gap: 4px; padding: 4px; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 12px; background: var(--dash-card-bg, #fff); }
        .csp-levels button { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: 0; border-radius: 9px; background: none; color: var(--dash-gray, #64748b); font-size: 0.84rem; font-weight: 700; cursor: pointer; }
        .csp-levels button span { padding: 0 7px; border-radius: 99px; background: var(--dash-page-bg, #f1f5f9); font-size: 0.72rem; }
        .csp-levels button.is-on { background: color-mix(in srgb, var(--lvl, #ff7a00) 12%, transparent); color: var(--lvl, #ea580c); }

        /* papers list */
        .csp-list { display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 16px; background: var(--dash-card-bg, #fff); }
        .csp-row { display: grid; grid-template-columns: 44px minmax(0, 1fr) 200px 210px; align-items: center; gap: 1.25rem; padding: 1.1rem 1.4rem; border-left: 3px solid var(--lvl); transition: background 0.15s; }
        .csp-row + .csp-row { border-top: 1px solid var(--dash-border, #eef2f6); }
        .csp-row:hover { background: var(--dash-page-bg, #f8fafc); }
        .csp-row-no { color: var(--dash-gray, #94a3b8); font-size: 1.05rem; font-weight: 800; font-variant-numeric: tabular-nums; }
        .csp-row-title { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
        .csp-row-title h3 { margin: 0; font-size: 1rem; font-weight: 800; }
        .csp-lvl { padding: 2px 10px; border-radius: 99px; background: color-mix(in srgb, var(--lvl) 12%, transparent); color: var(--lvl); font-size: 0.72rem; font-weight: 800; }
        .csp-live { color: #ea580c; font-size: 0.74rem; font-weight: 800; }
        .csp-row-meta { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 6px; color: var(--dash-gray, #64748b); font-size: 0.8rem; }
        .csp-row-meta span { display: inline-flex; align-items: center; gap: 5px; }
        /* bright icon tiles: questions · marks · time · sections */
        .csp-row-meta { align-items: center; gap: 8px 18px !important; margin-top: 8px !important; }
        .csp-row-meta span { gap: 7px !important; line-height: 1; color: var(--dash-text, #334155); font-weight: 600; }
        .csp-row-meta span svg { box-sizing: content-box; width: 13px; height: 13px; padding: 5px; flex: 0 0 auto; border-radius: 7px; }
        .csp-row-meta span:nth-child(1) svg { background: rgba(59,130,246,0.14); color: #3b82f6; }
        .csp-row-meta span:nth-child(2) svg { background: rgba(168,85,247,0.14); color: #a855f7; }
        .csp-row-meta span:nth-child(3) svg { background: rgba(249,115,22,0.14); color: #f97316; }
        .csp-row-meta span:nth-child(4) svg { background: rgba(20,184,166,0.14); color: #14b8a6; }
        .csp-row-title { line-height: 1.2; }
        .csp-row-no { align-self: center; }
        .csp-row-score { display: flex; flex-direction: column; gap: 5px; }
        .csp-row-score small { color: var(--dash-gray, #64748b); font-size: 0.72rem; }
        .csp-row-actions { display: flex; gap: 8px; justify-content: flex-end; }
        .csp-btn { display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 16px; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 10px; background: var(--dash-card-bg, #fff); color: var(--dash-text, #0f172a); font-size: 0.84rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
        .csp-btn:hover { border-color: #cbd5e1; }
        .csp-btn-primary { border-color: transparent; background: linear-gradient(135deg, #ff7a00, #ff9a3c); color: #fff; box-shadow: 0 4px 12px rgba(255,122,0,0.22); }
        .csp-btn-primary:hover { border-color: transparent; filter: brightness(1.05); }

        /* empty */
        .csp-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; min-height: 260px; padding: 2rem; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 16px; background: var(--dash-card-bg, #fff); color: var(--dash-gray, #64748b); text-align: center; }
        .csp-empty-sm { min-height: 120px; }
        .csp-empty h3 { margin: 0; font-size: 1.05rem; font-weight: 800; }
        .csp-empty p { max-width: 420px; margin: 0; }
        .csp-empty-icon { display: grid; place-items: center; width: 54px; height: 54px; border-radius: 50%; background: rgba(255,122,0,0.1); color: #ff7a00; font-size: 1.3rem; }

        @media (max-width: 991.98px) {
          .csp-row { grid-template-columns: 36px minmax(0, 1fr); }
          .csp-row-score, .csp-row-actions { grid-column: 2; }
          .csp-row-actions { justify-content: flex-start; }
          .csp-hero-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); width: 100%; }
        }
        @media (max-width: 575.98px) { .csp-page { padding: 1rem; } .csp-hero { padding: 1.25rem; } }
      `}</style>
    </>
  )
}

export default CompanyPrepStudentPage
