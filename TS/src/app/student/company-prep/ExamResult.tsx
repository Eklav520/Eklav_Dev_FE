import { useEffect, useState } from 'react'
import {
  FiAlertTriangle, FiArrowLeft, FiAward, FiCheckCircle, FiClock, FiCode, FiLoader, FiMinusCircle, FiMonitor, FiRotateCcw,
  FiTarget, FiTrendingDown, FiTrendingUp, FiX, FiXCircle, FiZap, FiChevronDown, FiChevronUp,
} from 'react-icons/fi'
import { CountUp } from '@/components/dashboard/CountUp'
import { ExamStyles } from './ExamRunner'
import { LANG_LABEL, LEVEL_COLOR, TYPE_LABEL, fmtDuration, type Api, type ResultPayload, type ReviewItem } from './api'

/* Result of one attempt: summary, section performance and a question-by-question review */

type Status = 'right' | 'wrong' | 'skipped'
const statusOf = (r: ReviewItem): Status => (r.isCorrect ? 'right' : !r.yourAnswer || !String(r.yourAnswer).trim() ? 'skipped' : 'wrong')
const toneOf = (p: number) => (p >= 75 ? '#16a34a' : p >= 50 ? '#d97706' : '#dc2626')

/* Turn stray LaTeX into readable text: \frac{a}{b} → a/b, \times → ×, \div → ÷, drop \( \) */
const cleanMath = (t: string) => String(t || '')
  .replace(/\\\(|\\\)|\\\[|\\\]/g, '')
  .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1)/($2)')
  .replace(/\\times/g, '×').replace(/\\div/g, '÷').replace(/\\cdot/g, '·').replace(/\\%/g, '%')
  .replace(/\\left|\\right/g, '').replace(/\s{2,}/g, ' ').trim()

/* ==key== and **key** become a yellow highlight, `x` becomes inline code */
const inline = (text: string) => cleanMath(text).split(/(==[^=]+==|\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) =>
  (part.startsWith('==') && part.endsWith('==')) || (part.startsWith('**') && part.endsWith('**')) ? <mark key={i} className="cai-hl">{part.slice(2, -2)}</mark>
    : part.startsWith('`') && part.endsWith('`') ? <code key={i}>{part.slice(1, -1)}</code>
      : <span key={i}>{part}</span>)

type McqAi = { answer?: string; concept?: string; steps?: { title: string; detail: string }[]; others?: { option: string; reason: string }[]; mistake?: string; tip?: string }
type CodeAi = { summary?: string; good?: string[]; issues?: string[]; approach?: string[]; solution?: { language?: string; code?: string }; complexity?: { time?: string; space?: string } }

const McqExplanation = ({ d }: { d: McqAi }) => (
  <div className="cai">
    {d.answer && <div className="cai-answer"><FiCheckCircle /><div><small>Correct answer</small><b>{inline(d.answer)}</b></div>{d.concept && <span className="cai-concept">{cleanMath(d.concept)}</span>}</div>}
    {!!d.steps?.length && (
      <div className="cai-block">
        <h6>How to solve it</h6>
        <ol className="cai-steps">
          {d.steps.map((st, i) => (
            <li key={i}><span>{i + 1}</span><div><b>{inline(st.title)}</b><p>{inline(st.detail)}</p></div></li>
          ))}
        </ol>
      </div>
    )}
    {!!d.others?.length && (
      <div className="cai-block">
        <h6>Why not the other options</h6>
        <div className="cai-others">
          {d.others.map((o, i) => <div key={i}><span>{String(o.option).replace(/[^A-D]/gi, '').toUpperCase() || '•'}</span><p>{inline(o.reason)}</p></div>)}
        </div>
      </div>
    )}
    {d.mistake && <div className="cai-block"><h6>Common mistake</h6><p className="cai-plain">{inline(d.mistake)}</p></div>}
    {d.tip && <div className="cai-tip"><FiZap /><div><small>Quick tip</small><p>{inline(d.tip)}</p></div></div>}
  </div>
)

const CodeExplanation = ({ d }: { d: CodeAi }) => (
  <div className="cai">
    {d.summary && <p className="cai-summary">{inline(d.summary)}</p>}
    {(!!d.good?.length || !!d.issues?.length) && (
      <div className="cai-review">
        {!!d.good?.length && <div className="is-good"><h6><FiCheckCircle /> What's right</h6><ul>{d.good.map((g, i) => <li key={i}>{inline(g)}</li>)}</ul></div>}
        {!!d.issues?.length && <div className="is-bad"><h6><FiXCircle /> What to fix</h6><ul>{d.issues.map((g, i) => <li key={i}>{inline(g)}</li>)}</ul></div>}
      </div>
    )}
    {!!d.approach?.length && (
      <div className="cai-block">
        <h6>Approach</h6>
        <ol className="cai-steps">{d.approach.map((st, i) => <li key={i}><span>{i + 1}</span><div><p>{inline(st)}</p></div></li>)}</ol>
      </div>
    )}
    {d.solution?.code && (
      <div className="cai-block">
        <h6>Model solution {d.solution.language ? `· ${d.solution.language}` : ''}</h6>
        <pre className="cai-code">{d.solution.code}</pre>
      </div>
    )}
    {(d.complexity?.time || d.complexity?.space) && (
      <div className="cai-cx">
        {d.complexity?.time && <span><small>Time</small><b>{d.complexity.time}</b></span>}
        {d.complexity?.space && <span><small>Space</small><b>{d.complexity.space}</b></span>}
      </div>
    )}
  </div>
)

const parseAi = (t: string) => { try { const v = JSON.parse(t); return v && typeof v === 'object' ? v : null } catch { return null } }

/* Minimal, safe rendering of the AI text: ``` code blocks, **bold**, `code`, numbered / bullet lines */
const AiText = ({ text }: { text: string }) => (
  <div className="cpr-ai-text">
    {text.split(/```/).map((chunk, i) => i % 2 === 1
      ? <pre key={i}>{chunk.replace(/^[a-zA-Z+#]*\n/, '')}</pre>
      : chunk.split(/\n/).filter(l => l.trim()).map((line, j) => {
        const l = line.trim()
        if (/^#{1,4}\s/.test(l)) return <h6 key={`${i}-${j}`}>{inline(l.replace(/^#{1,4}\s/, ''))}</h6>
        if (/^(\d+[.)]|[-*•])\s/.test(l)) return <p key={`${i}-${j}`} className="li">{inline(l)}</p>
        return <p key={`${i}-${j}`}>{inline(l)}</p>
      }))}
  </div>
)

const AiExplain = ({ api, attemptId, item }: { api: Api; attemptId: string; item: ReviewItem }) => {
  const [text, setText] = useState(item.aiExplanation || '')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const load = async () => {
    setOpen(true)
    if (text) return
    setLoading(true); setError('')
    try { setText((await api.explain(attemptId, item.questionId)).explanation) } catch (e: any) { setError(e.message) } finally { setLoading(false) }
  }
  const label = item.type === 'coding' ? 'AI code review & solution' : 'AI explanation'
  return (
    <div className={`cpr-ai${open ? ' is-open' : ''}`}>
      <button type="button" className="cpr-ai-head" onClick={() => (open ? setOpen(false) : load())}>
        <span className="cpr-ai-icon"><FiZap /></span>
        <span className="cpr-ai-title">{label}<small>{item.type === 'coding' ? 'Feedback on your code, the approach and a model solution' : 'Step-by-step reasoning for the correct answer'}</small></span>
        {open ? <FiChevronUp /> : <span className="cpr-ai-cta">{text ? 'Show' : 'Explain with AI'} <FiChevronDown /></span>}
      </button>
      {open && (
        <div className="cpr-ai-body">
          {loading ? <div className="cpr-ai-loading"><FiLoader className="cpx-spin" /> Thinking through the answer…</div>
            : error ? <div className="cpr-ai-error"><FiAlertTriangle /> {error} <button type="button" onClick={() => { setText(''); load() }}>Retry</button></div>
              : (() => { const d = parseAi(text); return d ? (item.type === 'coding' ? <CodeExplanation d={d} /> : <McqExplanation d={d} />) : <AiText text={text} /> })()}
        </div>
      )}
    </div>
  )
}

const ExamResult = ({ api, attemptId, onBack, onRetake }: {
  api: Api
  attemptId: string
  onBack: () => void
  onRetake?: () => void
}) => {
  const [data, setData] = useState<ResultPayload | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | Status>('all')
  const [section, setSection] = useState('')

  useEffect(() => {
    api.result(attemptId).then(setData).catch(e => setError(e.message))
  }, [attemptId]) // eslint-disable-line

  if (error) return <div className="cpx-root cpx-center"><div className="cpx-alert"><FiAlertTriangle /> {error}</div><button type="button" className="cpx-btn" onClick={onBack}>Back</button><ExamStyles /></div>
  if (!data) return <div className="cpx-root cpx-center"><FiLoader className="cpx-spin" /> Loading result…<ExamStyles /></div>

  const a = data.attempt as ResultPayload['attempt'] & { tabSwitches?: number }
  const pct = Math.round(a.percentage)
  const tone = toneOf(pct)
  const verdict = pct >= 75 ? 'Excellent performance' : pct >= 50 ? 'Good attempt — a little more practice' : 'Needs more practice'
  const review = data.review.map((r, i) => ({ ...r, n: i + 1, status: statusOf(r) }))
  const counts = { right: review.filter(r => r.status === 'right').length, wrong: review.filter(r => r.status === 'wrong').length, skipped: review.filter(r => r.status === 'skipped').length }
  const attempted = counts.right + counts.wrong
  const accuracy = attempted ? Math.round((counts.right / attempted) * 100) : 0
  const prev = data.history.filter(h => h._id !== a._id).slice(-1)[0]
  const delta = prev ? Math.round(pct - prev.percentage) : null
  const limitSecs = data.exam.durationMins * 60
  const items = review.filter(r => (!section || r.section === section) && (filter === 'all' || r.status === filter))

  return (
    <div className="cpx-root">
      <div className="cpx-head">
        <button type="button" className="cpx-link" onClick={onBack}><FiArrowLeft /> {data.company.name} papers</button>
        <span className="cpb-top-sep" />
        <span className="cpx-logo cpx-logo-sm">{data.company.logoUrl ? <img src={data.company.logoUrl} alt="" /> : <b>{data.company.name[0]}</b>}</span>
        <div className="cpx-head-title">
          <b>{data.exam.title}</b>
          <small>Result · <span style={{ color: LEVEL_COLOR[data.exam.level] }}>{data.exam.level}</span>{a.submittedAt ? ` · ${new Date(a.submittedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}` : ''}</small>
        </div>
        {onRetake && <button type="button" className="cpx-btn cpx-btn-primary" onClick={onRetake}><FiRotateCcw /> Retake</button>}
      </div>

      <div className="cpr-scroll">
        <div className="cpr-wrap cpr-layout">
          <div className="cpr-main">
            {/* ── Review ── */}
            <section className="cpr-card">
            <div className="cpr-card-head">
              <h3>Answer review {section && <span className="cpr-chip">{section}<button type="button" onClick={() => setSection('')} aria-label="Clear section"><FiX /></button></span>}</h3>
              <div className="cpr-filter">
                {([['all', 'All', review.length], ['wrong', 'Wrong', counts.wrong], ['skipped', 'Skipped', counts.skipped], ['right', 'Correct', counts.right]] as const).map(([k, label, n]) => (
                  <button key={k} type="button" className={filter === k ? 'is-on' : ''} onClick={() => setFilter(k)}>{label} <span>{n}</span></button>
                ))}
              </div>
            </div>
            {items.length === 0 ? <p className="cpx-muted cpr-none">Nothing to show for this filter.</p> : (
              <div className="cpr-review">
                {items.map(r => (
                  <article key={r.questionId} id={`cpr-q-${r.n}`} className={`cpr-q is-${r.status}`}>
                    <div className="cpr-q-head">
                      <span className="cpr-q-no">{r.n}</span>
                      <div className="cpr-q-meta">
                        <b>Question {r.n}</b>
                        <span>{r.section}{r.section.toLowerCase() !== TYPE_LABEL[r.type].toLowerCase() ? ` · ${TYPE_LABEL[r.type]}` : ''}</span>
                      </div>
                      <span className={`cpr-status is-${r.status}`}>
                        {r.status === 'right' ? <FiCheckCircle /> : r.status === 'wrong' ? <FiXCircle /> : <FiMinusCircle />}
                        {r.status === 'right' ? 'Correct' : r.status === 'wrong' ? 'Wrong' : 'Skipped'} · {r.marksAwarded}/{r.marks}
                      </span>
                    </div>
                    <p className="cpr-q-text">{r.question}</p>

                    {r.type === 'mcq' && (
                      <div className="cpr-opts">
                        {(['A', 'B', 'C', 'D'] as const).filter(k => r.options?.[k]).map(k => {
                          const isCorrect = r.correctAnswer === k
                          const isYours = r.yourAnswer === k
                          return (
                            <div key={k} className={`cpr-opt${isCorrect ? ' is-correct' : ''}${isYours && !isCorrect ? ' is-yours' : ''}`}>
                              <span className="cpr-opt-key">{k}</span>
                              <span className="cpr-opt-text">{r.options?.[k]}</span>
                              {isCorrect && <em><FiCheckCircle /> Correct</em>}
                              {isYours && !isCorrect && <em><FiXCircle /> Your answer</em>}
                              {isYours && isCorrect && <em className="yours">Your answer</em>}
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {r.type === 'fill' && (
                      <div className="cpr-answers">
                        <div className={r.isCorrect ? 'ok' : 'no'}><small>Your answer</small><b>{r.yourAnswer || '— not answered —'}</b></div>
                        <div className="ok"><small>Accepted answer</small><b>{r.correctAnswer}</b></div>
                      </div>
                    )}
                    {r.type === 'coding' && (
                      <div className="cpr-code">
                        <div className="cpr-code-bar">
                          <span><FiCode /> {r.language ? LANG_LABEL[r.language] || r.language : 'No language'}</span>
                          <span className={r.passed === r.total && r.total ? 'ok' : r.passed ? 'part' : 'no'}>{r.passed ?? 0} / {r.total ?? 0} test cases passed</span>
                        </div>
                        {r.yourAnswer ? <pre>{r.yourAnswer}</pre> : <p className="cpx-muted">No code submitted.</p>}
                      </div>
                    )}
                    {r.explanation && <div className="cpr-expl"><b>Explanation</b><p>{r.explanation}</p></div>}
                    <AiExplain api={api} attemptId={a._id} item={r} />
                  </article>
                ))}
              </div>
            )}
          </section>
          </div>

          {/* ── Side panel ── */}
          <aside className="cpr-side-wrap">
            <div className="cpr-side">
              <div className="cpr-side-score">
                <div className="cpr-ring cpr-ring-sm" style={{ background: `conic-gradient(${tone} ${pct * 3.6}deg, rgba(255,255,255,0.12) 0deg)` }}>
                  <div><b><CountUp text={`${pct}%`} /></b><small>Score</small></div>
                </div>
                <div className="cpr-side-score-text">
                  <span className="cpr-verdict" style={{ color: tone === '#dc2626' ? '#fca5a5' : tone === '#d97706' ? '#fcd34d' : '#86efac' }}><FiAward /> {verdict}</span>
                  <h2><CountUp text={String(a.score)} /><small> / {a.totalMarks} marks</small></h2>
                  <div className="cpr-score-meta">
                    <span><FiTarget /> {accuracy}% accuracy</span>
                    <span><FiClock /> {fmtDuration(a.timeTakenSecs || 0)}</span>
                  </div>
                </div>
                <div className="cpr-time">
                  <div className="cpr-time-row"><span>Time used of {data.exam.durationMins} min</span><b>{Math.min(100, Math.round(((a.timeTakenSecs || 0) / limitSecs) * 100))}%</b></div>
                  <div className="cpr-time-bar"><span style={{ width: `${Math.min(100, ((a.timeTakenSecs || 0) / limitSecs) * 100)}%` }} /></div>
                </div>
                {delta != null && <p className={`cpr-delta-line ${delta >= 0 ? 'up' : 'down'}`}>{delta >= 0 ? <FiTrendingUp /> : <FiTrendingDown />} {delta >= 0 ? '+' : ''}{delta} points vs your last attempt</p>}
                {a.autoSubmitted && <p className="cpr-auto">Submitted automatically when the time ran out.</p>}
              </div>

              <div className="cpr-side-card">
                <div className="cpr-counts">
                  <button type="button" className={`c-green${filter === 'right' ? ' is-on' : ''}`} onClick={() => setFilter(filter === 'right' ? 'all' : 'right')}><FiCheckCircle /><b>{counts.right}</b><small>Correct</small></button>
                  <button type="button" className={`c-red${filter === 'wrong' ? ' is-on' : ''}`} onClick={() => setFilter(filter === 'wrong' ? 'all' : 'wrong')}><FiXCircle /><b>{counts.wrong}</b><small>Wrong</small></button>
                  <button type="button" className={`c-gray${filter === 'skipped' ? ' is-on' : ''}`} onClick={() => setFilter(filter === 'skipped' ? 'all' : 'skipped')}><FiMinusCircle /><b>{counts.skipped}</b><small>Skipped</small></button>
                  <div className="c-purple"><FiTarget /><b>{data.history.length}</b><small>Attempt{data.history.length === 1 ? '' : 's'}</small></div>
                </div>
                {(a.tabSwitches || 0) > 0 && <p className="cpr-tabsw"><FiMonitor /> {a.tabSwitches} tab switch{a.tabSwitches === 1 ? '' : 'es'} recorded</p>}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <ExamStyles />
      <style>{`
        .cpr-scroll { flex: 1; min-height: 0; overflow-y: auto; }
        .cpr-layout { display: grid !important; grid-template-columns: 360px minmax(0, 1fr); gap: 1.25rem; align-items: start; max-width: 1320px !important; }
        .cpr-main { display: flex; flex-direction: column; gap: 1rem; min-width: 0; }
        /* progress panel on the left, questions on the right */
        .cpr-side-wrap { position: sticky; top: 1.5rem; order: -1; }
        .cpr-side { display: flex; flex-direction: column; gap: 12px; }
        .cpr-side-score { position: relative; display: flex; flex-direction: column; gap: 14px; padding: 1.25rem; overflow: hidden; border-radius: 18px; background: linear-gradient(135deg, #1e293b, #0f172a 75%); color: #fff; }
        .cpr-side-score::before { content: ''; position: absolute; right: -70px; top: -80px; width: 220px; height: 220px; border-radius: 50%; background: radial-gradient(circle, rgba(255,122,0,0.3), transparent 70%); pointer-events: none; }
        .cpr-side-score > * { position: relative; }
        .cpr-ring-sm { width: 112px !important; height: 112px !important; flex-basis: 112px !important; margin: 0 auto; }
        .cpr-ring-sm > div { width: 90px !important; height: 90px !important; }
        .cpr-ring-sm b { font-size: 1.6rem !important; }
        .cpr-side-score-text { text-align: center; }
        .cpx-root .cpr-side-score-text h2 { margin: 4px 0 10px; color: #fff; font-size: 1.6rem; font-weight: 800; }
        .cpr-side-score-text h2 small { color: #94a3b8; font-size: 0.9rem; font-weight: 600; }
        .cpr-side-score-text .cpr-score-meta { justify-content: center; }
        .cpr-delta-line { display: flex; align-items: center; justify-content: center; gap: 6px; margin: 0; font-size: 0.8rem; font-weight: 700; }
        .cpr-delta-line.up { color: #86efac; } .cpr-delta-line.down { color: #fca5a5; }
        .cpr-side-card { padding: 1rem; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 16px; background: var(--dash-card-bg, #fff); }
        .cpx-root .cpr-side-card h4 { margin: 0 0 12px; color: var(--dash-gray, #64748b); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }
        .cpr-counts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
        .cpr-counts > * { display: grid; grid-template-columns: 22px 1fr; grid-template-rows: auto auto; align-items: center; column-gap: 8px; padding: 0.6rem 0.75rem; border: 1px solid transparent; border-radius: 12px; background: var(--dash-page-bg, #f8fafc); color: inherit; text-align: left; font: inherit; }
        .cpr-counts button { cursor: pointer; transition: border-color 0.15s; }
        .cpr-counts > * svg { grid-row: 1 / span 2; font-size: 1.05rem; }
        .cpr-counts b { color: var(--dash-text, #0f172a); font-size: 1.15rem; font-weight: 800; line-height: 1.1; }
        .cpr-counts small { color: var(--dash-gray, #64748b); font-size: 0.7rem; font-weight: 600; }
        .cpr-counts .c-green svg { color: #16a34a; } .cpr-counts .c-red svg { color: #dc2626; } .cpr-counts .c-gray svg { color: #64748b; } .cpr-counts .c-purple svg { color: #7c3aed; }
        .cpr-counts .c-green.is-on { border-color: rgba(22,163,74,0.5); } .cpr-counts .c-red.is-on { border-color: rgba(220,38,38,0.5); } .cpr-counts .c-gray.is-on { border-color: rgba(100,116,139,0.5); }
        .cpr-tabsw { display: flex; align-items: center; gap: 6px; margin: 10px 0 0; color: #d97706; font-size: 0.78rem; font-weight: 700; }
        .cpr-sec { padding: 10px 0; border-top: 1px solid var(--dash-border, #eef2f6); }
        .cpr-sec:first-of-type { border-top: 0; padding-top: 0; }
        .cpr-sec-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; width: 100%; margin-bottom: 6px; padding: 0; border: 0; background: none; color: inherit; cursor: pointer; }
        .cpr-sec-head b { color: var(--dash-text, #0f172a); font-size: 0.86rem; }
        .cpr-sec-head span { color: var(--dash-gray, #64748b); font-size: 0.76rem; font-weight: 600; }
        .cpr-sec-head i { font-style: normal; font-weight: 800; }
        .cpr-sec.is-on .cpr-sec-head b { color: #ea580c; }
        .cpr-map { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .cpr-map .cpr-nav-dot { width: 30px; height: 30px; font-size: 0.76rem; }
        .cpr-legend { display: flex; gap: 12px; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--dash-border, #eef2f6); color: var(--dash-gray, #64748b); font-size: 0.72rem; }
        .cpr-legend span { display: inline-flex; align-items: center; gap: 5px; }
        .cpr-legend i { width: 10px; height: 10px; border-radius: 3px; }
        .cpr-legend i.is-right { background: rgba(22,163,74,0.35); } .cpr-legend i.is-wrong { background: rgba(220,38,38,0.35); } .cpr-legend i.is-skipped { background: rgba(100,116,139,0.35); }
        @media (max-width: 1099.98px) { .cpr-layout { grid-template-columns: 1fr; } .cpr-side-wrap { position: static; order: -1; } }
        .cpr-wrap { display: flex; flex-direction: column; gap: 1rem; width: 100%; max-width: 1180px; margin: 0 auto; padding: 1.5rem; }

        /* summary */
        .cpr-summary { position: relative; display: flex; flex-direction: column; gap: 1.25rem; padding: 1.75rem 2rem; overflow: hidden; border-radius: 20px; background: linear-gradient(135deg, #1e293b, #0f172a 70%); color: #fff; }
        .cpr-summary::before { content: ''; position: absolute; right: -90px; top: -100px; width: 340px; height: 340px; border-radius: 50%; background: radial-gradient(circle, rgba(255,122,0,0.28), transparent 70%); pointer-events: none; }
        .cpr-score { position: relative; display: flex; align-items: center; gap: 1.75rem; flex-wrap: wrap; }
        .cpr-ring { display: grid; place-items: center; width: 136px; height: 136px; flex: 0 0 136px; border-radius: 50%; }
        .cpr-ring > div { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 110px; height: 110px; border-radius: 50%; background: #111827; }
        .cpr-ring b { color: #fff; font-size: 2rem; font-weight: 800; line-height: 1; }
        .cpr-ring small { margin-top: 4px; color: #94a3b8; font-size: 0.68rem; letter-spacing: 0.08em; text-transform: uppercase; }
        .cpr-score-text { flex: 1 1 260px; min-width: 240px; }
        .cpr-verdict { display: inline-flex; align-items: center; gap: 7px; font-size: 0.86rem; font-weight: 800; }
        .cpx-root .cpr-score-text h2 { margin: 6px 0 10px; color: #fff; font-size: 2.1rem; font-weight: 800; }
        .cpr-score-text h2 small { color: #94a3b8; font-size: 1.05rem; font-weight: 600; }
        .cpr-score-meta { display: flex; flex-wrap: wrap; gap: 8px; }
        .cpr-score-meta span { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border: 1px solid rgba(255,255,255,0.12); border-radius: 99px; background: rgba(255,255,255,0.06); color: #e2e8f0; font-size: 0.8rem; font-weight: 600; }
        .cpr-score-meta span.up { border-color: rgba(74,222,128,0.35); color: #86efac; }
        .cpr-score-meta span.down { border-color: rgba(248,113,113,0.35); color: #fca5a5; }
        .cpr-auto { margin: 10px 0 0; color: #fcd34d; font-size: 0.8rem; }
        .cpr-time { position: relative; }
        .cpr-time-row { display: flex; justify-content: space-between; margin-bottom: 6px; color: #94a3b8; font-size: 0.76rem; }
        .cpr-time-row b { color: #e2e8f0; }
        .cpr-time-bar { height: 6px; overflow: hidden; border-radius: 99px; background: rgba(255,255,255,0.1); }
        .cpr-time-bar span { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, #ff7a00, #ffb15e); }

        /* stats (inside the summary band) */
        .cpr-stats { position: relative; display: grid; grid-template-columns: repeat(2, minmax(120px, 1fr)); gap: 10px; margin-left: auto; }
        .cpr-stats div { display: grid; grid-template-columns: 36px 1fr; grid-template-rows: auto auto; align-items: center; column-gap: 10px; padding: 0.7rem 0.9rem; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; background: rgba(255,255,255,0.06); }
        .cpr-stats span { grid-row: 1 / span 2; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px; font-size: 1rem; }
        .cpx-root .cpr-stats b { color: #fff; font-size: 1.3rem; font-weight: 800; line-height: 1.1; }
        .cpr-stats small { color: #94a3b8; font-size: 0.72rem; font-weight: 600; }
        .cpr-stats .s-green span { background: rgba(74,222,128,0.16); color: #4ade80; }
        .cpr-stats .s-red span { background: rgba(248,113,113,0.16); color: #f87171; }
        .cpr-stats .s-gray span { background: rgba(148,163,184,0.16); color: #cbd5e1; }
        .cpr-stats .s-purple span { background: rgba(167,139,250,0.16); color: #a78bfa; }
        .cpr-stats .s-amber span { background: rgba(251,191,36,0.16); color: #fbbf24; }

        /* cards */
        .cpr-card { padding: 1.25rem 1.4rem; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 16px; background: var(--dash-card-bg, #fff); }
        .cpr-card-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 1rem; }
        .cpx-root .cpr-card-head h3 { display: flex; align-items: center; gap: 8px; margin: 0; color: var(--dash-text, #0f172a); font-size: 1.02rem; font-weight: 800; }
        .cpr-card-head small { color: var(--dash-gray, #64748b); font-size: 0.76rem; }
        .cpr-chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 6px 3px 10px; border-radius: 99px; background: rgba(255,122,0,0.1); color: #ea580c; font-size: 0.76rem; font-weight: 700; }
        .cpr-chip button { display: grid; place-items: center; border: 0; background: none; color: inherit; cursor: pointer; }
        .cpr-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
        .cpr-table th { padding: 0 12px 10px; color: var(--dash-gray, #64748b); font-size: 0.7rem; font-weight: 800; letter-spacing: 0.05em; text-align: left; text-transform: uppercase; }
        .cpr-table td { padding: 12px; border-top: 1px solid var(--dash-border, #eef2f6); color: var(--dash-text, #0f172a); }
        .cpr-table tbody tr { cursor: pointer; transition: background 0.15s; }
        .cpr-table tbody tr:hover, .cpr-table tbody tr.is-on { background: rgba(255,122,0,0.05); }
        .cpr-perf { display: flex; align-items: center; gap: 12px; }
        .cpr-perf b { width: 42px; text-align: right; font-size: 0.86rem; }
        .cpr-bar { flex: 1; height: 8px; overflow: hidden; border-radius: 99px; background: var(--dash-border, #eef2f6); }
        .cpr-bar span { display: block; height: 100%; border-radius: 99px; animation: cpr-grow 1.2s cubic-bezier(.16,1,.3,1) both; }
        @keyframes cpr-grow { from { width: 0; } }

        /* review */
        .cpr-filter { display: inline-flex; gap: 2px; padding: 3px; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 10px; }
        .cpr-filter button { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border: 0; border-radius: 7px; background: none; color: var(--dash-gray, #64748b); font-size: 0.8rem; font-weight: 700; cursor: pointer; }
        .cpr-filter button span { padding: 0 6px; border-radius: 99px; background: var(--dash-page-bg, #f1f5f9); font-size: 0.7rem; }
        .cpr-filter button.is-on { background: rgba(255,122,0,0.12); color: #ea580c; }
        .cpr-nav { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--dash-border, #eef2f6); }
        .cpr-nav-dot { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 9px; font-size: 0.8rem; font-weight: 800; text-decoration: none; }
        .cpr-nav-dot.is-right { background: rgba(22,163,74,0.12); color: #16a34a; }
        .cpr-nav-dot.is-wrong { background: rgba(220,38,38,0.12); color: #dc2626; }
        .cpr-nav-dot.is-skipped { background: rgba(100,116,139,0.14); color: #64748b; }
        .cpr-none { padding: 1.5rem 0; text-align: center; }
        .cpr-review { display: flex; flex-direction: column; gap: 12px; }
        .cpr-q { scroll-margin-top: 1rem; padding: 1.1rem 1.2rem; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 14px; }
        .cpr-q-head { display: flex; align-items: center; gap: 12px; }
        .cpr-q-no { display: grid; place-items: center; width: 34px; height: 34px; flex: 0 0 34px; border-radius: 10px; font-weight: 800; }
        .cpr-q.is-right .cpr-q-no { background: rgba(22,163,74,0.12); color: #16a34a; }
        .cpr-q.is-wrong .cpr-q-no { background: rgba(220,38,38,0.12); color: #dc2626; }
        .cpr-q.is-skipped .cpr-q-no { background: rgba(100,116,139,0.14); color: #64748b; }
        .cpr-q-meta { display: flex; flex-direction: column; flex: 1; min-width: 0; }
        .cpr-q-meta b { color: var(--dash-text, #0f172a); font-size: 0.9rem; }
        .cpr-q-meta span { color: var(--dash-gray, #64748b); font-size: 0.76rem; font-weight: 600; }
        .cpr-status { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 99px; font-size: 0.76rem; font-weight: 800; white-space: nowrap; }
        .cpr-status.is-right { background: rgba(22,163,74,0.1); color: #16a34a; }
        .cpr-status.is-wrong { background: rgba(220,38,38,0.1); color: #dc2626; }
        .cpr-status.is-skipped { background: rgba(100,116,139,0.12); color: #64748b; }
        .cpr-q-text { margin: 0.85rem 0; color: var(--dash-text, #0f172a); font-size: 0.95rem; font-weight: 600; line-height: 1.55; white-space: pre-wrap; }
        .cpr-opts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
        .cpr-opt { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 10px; font-size: 0.88rem; color: var(--dash-text, #0f172a); }
        .cpr-opt-key { display: grid; place-items: center; width: 24px; height: 24px; flex: 0 0 24px; border-radius: 7px; background: var(--dash-page-bg, #f1f5f9); color: var(--dash-gray, #64748b); font-size: 0.74rem; font-weight: 800; }
        .cpr-opt-text { flex: 1; }
        .cpr-opt em { display: inline-flex; align-items: center; gap: 4px; font-size: 0.72rem; font-style: normal; font-weight: 800; white-space: nowrap; }
        .cpr-opt.is-correct { border-color: rgba(22,163,74,0.45); background: rgba(22,163,74,0.06); }
        .cpr-opt.is-correct .cpr-opt-key { background: #16a34a; color: #fff; }
        .cpr-opt.is-correct em { color: #16a34a; }
        .cpr-opt.is-correct em.yours { margin-left: 6px; color: #64748b; }
        .cpr-opt.is-yours { border-color: rgba(220,38,38,0.45); background: rgba(220,38,38,0.05); }
        .cpr-opt.is-yours .cpr-opt-key { background: #dc2626; color: #fff; }
        .cpr-opt.is-yours em { color: #dc2626; }
        .cpr-answers { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
        .cpr-answers div { display: flex; flex-direction: column; gap: 3px; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--dash-border, #e2e8f0); }
        .cpr-answers small { color: var(--dash-gray, #64748b); font-size: 0.72rem; font-weight: 700; }
        .cpr-answers .ok { border-color: rgba(22,163,74,0.4); background: rgba(22,163,74,0.05); }
        .cpr-answers .ok b { color: #16a34a; }
        .cpr-answers .no { border-color: rgba(220,38,38,0.4); background: rgba(220,38,38,0.05); }
        .cpr-answers .no b { color: #dc2626; }
        .cpr-code { overflow: hidden; border-radius: 12px; border: 1px solid #1e1e1e; }
        .cpr-code-bar { display: flex; justify-content: space-between; gap: 10px; padding: 8px 12px; background: #252526; color: #d1d5db; font-size: 0.78rem; font-weight: 700; }
        .cpr-code-bar span { display: inline-flex; align-items: center; gap: 6px; }
        .cpr-code-bar .ok { color: #4ade80; } .cpr-code-bar .part { color: #fbbf24; } .cpr-code-bar .no { color: #f87171; }
        .cpr-code pre { max-height: 240px; margin: 0; padding: 12px; overflow: auto; background: #1e1e1e; color: #e5e7eb; font-size: 0.8rem; }
        .cpr-code .cpx-muted { margin: 0; padding: 12px; background: #1e1e1e; }
        .cpr-ai { margin-top: 0.85rem; overflow: hidden; border: 1px solid rgba(124,58,237,0.25); border-radius: 12px; background: linear-gradient(135deg, rgba(124,58,237,0.05), rgba(59,130,246,0.04)); }
        .cpr-ai-head { display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 14px; border: 0; background: none; color: var(--dash-text, #0f172a); text-align: left; cursor: pointer; }
        .cpr-ai-icon { display: grid; place-items: center; width: 32px; height: 32px; flex: 0 0 32px; border-radius: 9px; background: linear-gradient(135deg, #7c3aed, #3b82f6); color: #fff; }
        .cpr-ai-title { display: flex; flex-direction: column; flex: 1; min-width: 0; font-size: 0.86rem; font-weight: 800; }
        .cpr-ai-title small { color: var(--dash-gray, #64748b); font-size: 0.74rem; font-weight: 600; }
        .cpr-ai-cta { display: inline-flex; align-items: center; gap: 5px; padding: 5px 12px; border-radius: 99px; background: rgba(124,58,237,0.12); color: #7c3aed; font-size: 0.76rem; font-weight: 800; white-space: nowrap; }
        .cpr-ai-body { padding: 2px 16px 16px; }
        .cpr-ai-loading { display: flex; align-items: center; gap: 8px; color: #7c3aed; font-size: 0.84rem; font-weight: 600; }
        .cpr-ai-error { display: flex; align-items: center; gap: 8px; color: #dc2626; font-size: 0.84rem; }
        .cpr-ai-error button { border: 0; background: none; color: #7c3aed; font-weight: 800; cursor: pointer; }
        .cpr-ai-text { color: var(--dash-text, #334155); font-size: 0.88rem; line-height: 1.6; }
        .cpr-ai-text p { margin: 0 0 6px; }
        .cpr-ai-text p.li { padding-left: 4px; }
        .cpr-ai-text h6 { margin: 10px 0 4px; color: var(--dash-text, #0f172a); font-size: 0.86rem; font-weight: 800; }
        .cpr-ai-text b { color: var(--dash-text, #0f172a); }
        .cpr-ai-text code { padding: 1px 6px; border-radius: 5px; background: rgba(124,58,237,0.1); color: #6d28d9; font-size: 0.82rem; }
        .cpr-ai-text pre { margin: 8px 0; padding: 12px; overflow: auto; border-radius: 10px; background: #1e1e1e; color: #e5e7eb; font-size: 0.8rem; line-height: 1.5; }
        /* structured AI explanation */
        .cai { display: flex; flex-direction: column; gap: 14px; }
        /* highlighter for key words / numbers */
        .cai-hl { padding: 0 4px; border-radius: 4px; background: linear-gradient(transparent 6%, #fde047 6%, #fde047 94%, transparent 94%); color: #422006; font-weight: 700; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
        .cai h6 { margin: 0 0 8px; color: var(--dash-gray, #64748b); font-size: 0.7rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }
        .cai-answer { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border: 1px solid rgba(22,163,74,0.35); border-radius: 12px; background: rgba(22,163,74,0.07); }
        .cai-answer > svg { flex: 0 0 auto; color: #16a34a; font-size: 1.2rem; }
        .cai-answer div { display: flex; flex-direction: column; flex: 1; }
        .cai-answer small { color: #15803d; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; }
        .cai-answer b { color: var(--dash-text, #0f172a); font-size: 1rem; }
        .cai-concept { padding: 3px 10px; border-radius: 99px; background: rgba(124,58,237,0.1); color: #6d28d9; font-size: 0.74rem; font-weight: 700; white-space: nowrap; }
        .cai-steps { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; }
        .cai-steps li { position: relative; display: flex; gap: 12px; padding-bottom: 12px; }
        .cai-steps li:not(:last-child)::before { content: ''; position: absolute; left: 13px; top: 28px; bottom: 0; width: 2px; background: rgba(124,58,237,0.18); }
        .cai-steps li > span { display: grid; place-items: center; width: 28px; height: 28px; flex: 0 0 28px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #3b82f6); color: #fff; font-size: 0.78rem; font-weight: 800; }
        .cai-steps li b { display: block; color: var(--dash-text, #0f172a); font-size: 0.88rem; }
        .cai-steps li p { margin: 2px 0 0; color: var(--dash-text, #334155); font-size: 0.86rem; line-height: 1.55; }
        .cai-others { display: flex; flex-direction: column; gap: 6px; }
        .cai-others div { display: flex; align-items: flex-start; gap: 10px; padding: 8px 12px; border-radius: 10px; background: rgba(220,38,38,0.05); }
        .cai-others span { display: grid; place-items: center; width: 24px; height: 24px; flex: 0 0 24px; border-radius: 7px; background: rgba(220,38,38,0.12); color: #dc2626; font-size: 0.74rem; font-weight: 800; }
        .cai-others p, .cai-plain { margin: 2px 0 0; color: var(--dash-text, #334155); font-size: 0.86rem; line-height: 1.5; }
        .cai-tip { display: flex; gap: 10px; padding: 10px 14px; border-radius: 12px; background: rgba(255,122,0,0.08); }
        .cai-tip > svg { flex: 0 0 auto; margin-top: 2px; color: #ea580c; }
        .cai-tip small { color: #c2410c; font-size: 0.7rem; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; }
        .cai-tip p { margin: 2px 0 0; color: var(--dash-text, #334155); font-size: 0.86rem; }
        .cai-summary { margin: 0; padding: 10px 14px; border-radius: 12px; background: rgba(59,130,246,0.07); color: var(--dash-text, #0f172a); font-size: 0.88rem; font-weight: 600; }
        .cai-review { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .cai-review > div { padding: 10px 14px; border-radius: 12px; }
        .cai-review .is-good { background: rgba(22,163,74,0.06); }
        .cai-review .is-bad { background: rgba(220,38,38,0.05); }
        .cai-review h6 { display: flex; align-items: center; gap: 6px; }
        .cai-review .is-good h6 { color: #15803d; }
        .cai-review .is-bad h6 { color: #b91c1c; }
        .cai-review ul { margin: 0; padding-left: 1.1rem; color: var(--dash-text, #334155); font-size: 0.85rem; line-height: 1.55; }
        .cai-code { margin: 0; padding: 14px; overflow: auto; border-radius: 12px; background: #1e1e1e; color: #e5e7eb; font-size: 0.8rem; line-height: 1.55; }
        .cai-cx { display: flex; gap: 8px; }
        .cai-cx span { display: flex; flex-direction: column; padding: 8px 14px; border: 1px solid var(--dash-border, #e2e8f0); border-radius: 10px; }
        .cai-cx small { color: var(--dash-gray, #64748b); font-size: 0.68rem; font-weight: 700; text-transform: uppercase; }
        .cai-cx b { color: var(--dash-text, #0f172a); font-family: monospace; }
        @media (max-width: 767.98px) { .cai-review { grid-template-columns: 1fr; } }
        .cpr-expl { margin-top: 0.85rem; padding: 0.75rem 0.9rem; border-left: 3px solid #ff7a00; border-radius: 0 10px 10px 0; background: rgba(255,122,0,0.06); }
        .cpr-expl b { color: #ea580c; font-size: 0.76rem; letter-spacing: 0.04em; text-transform: uppercase; }
        .cpr-expl p { margin: 4px 0 0; color: var(--dash-text, #334155); font-size: 0.86rem; line-height: 1.55; }
        @media (max-width: 767.98px) {
          .cpr-wrap { padding: 1rem; }
          .cpr-summary { padding: 1.25rem; }
          .cpr-stats { width: 100%; margin-left: 0; }
          .cpr-opts, .cpr-answers { grid-template-columns: 1fr; }
          .cpr-table th:nth-child(3), .cpr-table td:nth-child(3) { display: none; }
        }
      `}</style>
    </div>
  )
}

export default ExamResult
