import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, FileText, Flag, RotateCcw, Send, AlertTriangle, Lightbulb } from 'lucide-react'

type Question = {
  _id: string
  question?: string
  options?: (string | number)[]
  correctAnswer?: string | number
  explanation?: string
  order: number
}

type Round = {
  _id: string
  roundName: string
  roundType: string
  duration: number
  questionCount: number
  questions: Question[]
}

type AttemptData = {
  answers: Record<string, any>
  score: number
  totalQuestions: number
  correctAnswers: number
}

type Props = {
  round: Round
  companyName: string
  role: string
  quizQuestions: Question[]
  onClose: () => void
  onAttemptComplete?: (data: AttemptData) => void
}

// Round codes are stored in caps (e.g. "MCQ"); show a readable title
const roundTitle = (name: string) => (/^mcq$/i.test(name.trim()) ? 'MCQ Round' : name)

const MCQQuiz: React.FC<Props> = ({ round, companyName, role, quizQuestions, onClose, onAttemptComplete }) => {
  const total = quizQuestions.length
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [flagged, setFlagged] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [score, setScore] = useState(0)
  const [reviewIdx, setReviewIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(round.duration * 60)
  const [timerActive, setTimerActive] = useState(true)

  // Latest answers for the timer's auto-submit (the interval closure would otherwise see the first render)
  const answersRef = useRef(answers)
  answersRef.current = answers

  const doSubmit = () => {
    const finalAnswers = answersRef.current
    let correct = 0
    quizQuestions.forEach(q => { if (finalAnswers[q._id] === q.correctAnswer) correct++ })
    const pct = total ? (correct / total) * 100 : 0
    setScore(pct)
    setSubmitted(true)
    setConfirmOpen(false)
    setTimerActive(false)
    // Fire attempt callback so parent can save + show result screen
    onAttemptComplete?.({
      answers: finalAnswers,
      score: Math.round(pct),
      totalQuestions: total,
      correctAnswers: correct,
    })
  }
  const submitRef = useRef(doSubmit)
  submitRef.current = doSubmit

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); setTimerActive(false); submitRef.current(); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [timerActive])

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const currentQ = quizQuestions[currentIdx]

  const handleSelect = (opt: any) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [currentQ._id]: opt }))
  }

  const clearAnswer = () => {
    const n = { ...answers }
    delete n[currentQ._id]
    setAnswers(n)
  }

  // Keyboard: A–D picks an option, ← / → moves between questions
  useEffect(() => {
    if (submitted || confirmOpen) return
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'ArrowRight') setCurrentIdx(i => Math.min(total - 1, i + 1))
      else if (e.key === 'ArrowLeft') setCurrentIdx(i => Math.max(0, i - 1))
      else {
        const oi = e.key.toUpperCase().charCodeAt(0) - 65
        const opts = currentQ?.options || []
        if (e.key.length === 1 && oi >= 0 && oi < opts.length) handleSelect(opts[oi])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const answeredCount = Object.keys(answers).length
  const flaggedCount = quizQuestions.filter(q => flagged[q._id]).length
  const unanswered = total - answeredCount
  const passed = score >= 70
  const correctCount = Math.round((score / 100) * total)

  const getStatus = (idx: number) => {
    const q = quizQuestions[idx]
    if (idx === currentIdx) return 'current'
    if (flagged[q._id]) return 'flagged'
    if (answers[q._id] != null) return 'answered'
    return 'unanswered'
  }

  const header = (right: React.ReactNode) => (
    <div className="mq-header">
      <div className="mq-header-left">
        <button type="button" className="mq-btn mq-btn-ghost" onClick={onClose}><ChevronLeft size={14} /> Exit</button>
        <span className="mq-head-icon"><FileText size={16} /></span>
        <div className="mq-title-group">
          <span className="mq-round-name">{roundTitle(round.roundName)}</span>
          <span className="mq-company">{companyName} · {role}</span>
        </div>
      </div>
      <div className="mq-header-right">{right}</div>
    </div>
  )

  if (submitted) {
    const reviewQ = quizQuestions[reviewIdx]
    const isCorrect = answers[reviewQ._id] === reviewQ.correctAnswer
    const skipped = answers[reviewQ._id] == null
    return (
      <div className="mq-container">
        {header(
          <>
            <span className={`mq-score-pill ${passed ? 'is-pass' : 'is-fail'}`}>
              {passed ? <CheckCircle size={13} /> : <XCircle size={13} />}
              {Math.round(score)}% · {passed ? 'Passed' : 'Not passed'}
            </span>
            <span className="mq-score-detail">{correctCount} / {total} correct</span>
          </>
        )}

        <div className="mq-body">
          <div className="mq-sidebar">
            <div className="mq-side-summary">
              <div className="mq-side-row"><span>Result</span><b>{correctCount} / {total}</b></div>
              <div className="mq-track"><span className="is-green" style={{ width: `${total ? (correctCount / total) * 100 : 0}%` }} /></div>
            </div>
            <div className="mq-side-label">Questions</div>
            <div className="mq-grid">
              {quizQuestions.map((q, i) => (
                <button
                  key={q._id}
                  type="button"
                  className={`mq-box ${answers[q._id] === q.correctAnswer ? 'is-correct' : answers[q._id] == null ? 'is-skipped' : 'is-incorrect'}${i === reviewIdx ? ' is-active' : ''}`}
                  onClick={() => setReviewIdx(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="mq-legend">
              <span><i className="is-correct" /> Correct</span>
              <span><i className="is-incorrect" /> Wrong</span>
              <span><i className="is-skipped" /> Skipped</span>
            </div>
          </div>

          <div className="mq-main">
            <div className="mq-card">
              <div className="mq-q-head">
                <div className="mq-q-num">
                  <span className="mq-q-badge">{reviewIdx + 1}</span>
                  <span>Question {reviewIdx + 1} <small>of {total}</small></span>
                </div>
                <span className={`mq-chip ${isCorrect ? 'is-correct' : skipped ? 'is-muted' : 'is-incorrect'}`}>
                  {isCorrect ? <CheckCircle size={12} /> : <XCircle size={12} />}
                  {isCorrect ? 'Correct' : skipped ? 'Not answered' : 'Incorrect'}
                </span>
              </div>

              <p className="mq-q-text">{reviewQ.question}</p>

              <div className="mq-options">
                {(reviewQ.options || []).map((opt, oi) => {
                  const isSelected = answers[reviewQ._id] === opt
                  const isAnswer = reviewQ.correctAnswer === opt
                  return (
                    <div key={oi} className={`mq-option is-static${isAnswer ? ' is-correct' : isSelected ? ' is-wrong' : ''}`}>
                      <span className="mq-opt-letter">{String.fromCharCode(65 + oi)}</span>
                      <span className="mq-opt-text">{String(opt)}</span>
                      {isAnswer && <span className="mq-opt-tag is-correct"><CheckCircle size={12} /> Correct answer</span>}
                      {isSelected && !isAnswer && <span className="mq-opt-tag is-wrong"><XCircle size={12} /> Your answer</span>}
                    </div>
                  )
                })}
              </div>

              {reviewQ.explanation && (
                <div className="mq-explanation">
                  <span className="mq-exp-label"><Lightbulb size={13} /> Explanation</span>
                  <p>{reviewQ.explanation}</p>
                </div>
              )}

            <div className="mq-footer">
              <button type="button" className="mq-btn" disabled={reviewIdx === 0} onClick={() => setReviewIdx(i => i - 1)}>
                <ChevronLeft size={14} /> Previous
              </button>
              <span className="mq-footer-count">{reviewIdx + 1} / {total}</span>
              <button type="button" className="mq-btn" disabled={reviewIdx === total - 1} onClick={() => setReviewIdx(i => i + 1)}>
                Next <ChevronRight size={14} />
              </button>
            </div>
            </div>
          </div>
        </div>
        <MQStyles />
      </div>
    )
  }

  const isLast = currentIdx === total - 1
  const isFlagged = !!flagged[currentQ._id]

  return (
    <div className="mq-container">
      {header(
        <>
          <div className={`mq-timer${timeLeft < 300 ? ' is-warn' : ''}`} title="Time left">
            <Clock size={14} />
            <span>{formatTime(timeLeft)}</span>
          </div>
          <button type="button" className="mq-btn mq-btn-primary" onClick={() => setConfirmOpen(true)}>
            <Send size={13} /> Submit
          </button>
        </>
      )}
      <div className="mq-progress" title={`${answeredCount} of ${total} answered`}>
        <span style={{ width: `${total ? (answeredCount / total) * 100 : 0}%` }} />
      </div>

      <div className="mq-body">
        <div className="mq-sidebar">
          <div className="mq-side-summary">
            <div className="mq-side-row"><span>Answered</span><b>{answeredCount} / {total}</b></div>
            <div className="mq-track"><span style={{ width: `${total ? (answeredCount / total) * 100 : 0}%` }} /></div>
            <div className="mq-side-stats">
              <span><b>{unanswered}</b> left</span>
              {flaggedCount > 0 && <span className="is-flag"><Flag size={10} /> <b>{flaggedCount}</b> marked</span>}
            </div>
          </div>
          <div className="mq-side-label">Questions</div>
          <div className="mq-grid">
            {quizQuestions.map((q, i) => (
              <button
                key={q._id}
                type="button"
                className={`mq-box is-${getStatus(i)}${answers[q._id] != null ? ' has-answer' : ''}`}
                onClick={() => setCurrentIdx(i)}
                aria-label={`Question ${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mq-legend">
            <span><i className="is-current" /> Current</span>
            <span><i className="is-answered" /> Answered</span>
            <span><i className="is-flagged" /> Marked</span>
            <span><i className="is-unanswered" /> Not answered</span>
          </div>
        </div>

        <div className="mq-main">
          <div className="mq-card">
            <div className="mq-q-head">
              <div className="mq-q-num">
                <span className="mq-q-badge">{currentIdx + 1}</span>
                <span>Question {currentIdx + 1} <small>of {total}</small></span>
              </div>
              <div className="mq-q-tools">
                {answers[currentQ._id] != null && (
                  <button type="button" className="mq-link" onClick={clearAnswer}><RotateCcw size={12} /> Clear</button>
                )}
                <button
                  type="button"
                  className={`mq-link${isFlagged ? ' is-flag' : ''}`}
                  onClick={() => setFlagged(f => ({ ...f, [currentQ._id]: !f[currentQ._id] }))}
                  aria-pressed={isFlagged}
                >
                  <Flag size={12} /> {isFlagged ? 'Marked for review' : 'Mark for review'}
                </button>
              </div>
            </div>

            <p className="mq-q-text">{currentQ.question}</p>

            <div className="mq-options" role="radiogroup">
              {(currentQ.options || []).map((opt, oi) => {
                const selected = answers[currentQ._id] === opt
                return (
                  <button
                    key={oi}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`mq-option${selected ? ' is-selected' : ''}`}
                    onClick={() => handleSelect(opt)}
                  >
                    <span className="mq-opt-letter">{String.fromCharCode(65 + oi)}</span>
                    <span className="mq-opt-text">{String(opt)}</span>
                    <span className="mq-radio" />
                  </button>
                )
              })}
            </div>
            <p className="mq-hint">Tip: press A–{String.fromCharCode(64 + Math.max(1, (currentQ.options || []).length))} to choose, ← → to move between questions.</p>

          <div className="mq-footer">
            <button type="button" className="mq-btn" disabled={currentIdx === 0} onClick={() => setCurrentIdx(i => i - 1)}>
              <ChevronLeft size={14} /> Previous
            </button>
            <span className="mq-footer-count">{currentIdx + 1} / {total}</span>
            {isLast ? (
              <button type="button" className="mq-btn mq-btn-primary" onClick={() => setConfirmOpen(true)}>
                Finish <Send size={13} />
              </button>
            ) : (
              <button type="button" className="mq-btn mq-btn-next" onClick={() => setCurrentIdx(i => i + 1)}>
                Next <ChevronRight size={14} />
              </button>
            )}
          </div>
          </div>
        </div>
      </div>

      {confirmOpen && (
        <div className="mq-confirm-backdrop" onClick={() => setConfirmOpen(false)}>
          <div className="mq-confirm" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <span className={`mq-confirm-icon${unanswered ? ' is-warn' : ''}`}>
              {unanswered ? <AlertTriangle size={22} /> : <CheckCircle size={22} />}
            </span>
            <h4>Submit your answers?</h4>
            <p>
              {unanswered
                ? <>You have <b>{unanswered}</b> unanswered question{unanswered === 1 ? '' : 's'}. They will be marked wrong.</>
                : <>All {total} questions are answered.</>}
              {flaggedCount > 0 && <> {flaggedCount} {flaggedCount === 1 ? 'is' : 'are'} still marked for review.</>}
            </p>
            <div className="mq-confirm-stats">
              <div><b>{answeredCount}</b><span>Answered</span></div>
              <div><b>{unanswered}</b><span>Not answered</span></div>
              <div><b>{formatTime(timeLeft)}</b><span>Time left</span></div>
            </div>
            <div className="mq-confirm-actions">
              <button type="button" className="mq-btn" onClick={() => setConfirmOpen(false)}>Keep working</button>
              <button type="button" className="mq-btn mq-btn-primary" onClick={doSubmit}><Send size={13} /> Submit now</button>
            </div>
          </div>
        </div>
      )}
      <MQStyles />
    </div>
  )
}

const MQStyles = () => (
  <style>{`
    .mq-container {
      position: relative;
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #0a0b0d;
      color: #e5e7eb;
    }

    /* Buttons */
    .mq-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 38px;
      padding: 0 16px;
      border: 1px solid #2a2e33;
      border-radius: 10px;
      background: #15181b;
      color: #d1d5db;
      font-size: 0.84rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s, opacity 0.15s;
    }
    .mq-btn:hover:not(:disabled) { border-color: #464b52; background: #1d2024; color: #fff; }
    .mq-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .mq-btn-ghost { height: 34px; padding: 0 12px; background: transparent; color: #9ca3af; }
    .mq-btn-primary { border-color: transparent; background: linear-gradient(135deg, #ff6b35, #ff8a3d); color: #fff; box-shadow: 0 4px 14px rgba(255, 107, 53, 0.25); }
    .mq-btn-primary:hover:not(:disabled) { border-color: transparent; background: linear-gradient(135deg, #ff7a45, #ff9a52); color: #fff; }
    .mq-btn-next { border-color: rgba(255, 122, 0, 0.45); background: rgba(255, 122, 0, 0.1); color: #ffa04d; }
    .mq-btn-next:hover:not(:disabled) { border-color: #ff7a00; background: #ff7a00; color: #fff; }
    .mq-link {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      border: 1px solid transparent;
      border-radius: 8px;
      background: transparent;
      color: #8b9098;
      font-size: 0.76rem;
      font-weight: 600;
      cursor: pointer;
    }
    .mq-link:hover { border-color: #2a2e33; color: #e5e7eb; }
    .mq-link.is-flag { border-color: rgba(168, 85, 247, 0.4); background: rgba(168, 85, 247, 0.1); color: #c49bff; }

    /* Header */
    .mq-header {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.7rem 1.25rem;
      background: #0f1113;
      border-bottom: 1px solid #1d2024;
    }
    .mq-header-left, .mq-header-right { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
    .mq-head-icon {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      flex: 0 0 36px;
      border-radius: 10px;
      background: rgba(255, 107, 53, 0.12);
      color: #ff7a45;
    }
    .mq-title-group { display: flex; flex-direction: column; min-width: 0; }
    .mq-round-name { color: #fff; font-size: 0.98rem; font-weight: 700; line-height: 1.2; }
    .mq-company { overflow: hidden; color: #7b8088; font-size: 0.74rem; text-overflow: ellipsis; white-space: nowrap; }
    .mq-timer {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      height: 38px;
      padding: 0 14px;
      border: 1px solid #2a2e33;
      border-radius: 10px;
      background: #15181b;
      color: #e5e7eb;
      font-size: 0.95rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .mq-timer svg { color: #ff7a45; }
    .mq-timer.is-warn { border-color: rgba(239, 68, 68, 0.55); background: rgba(239, 68, 68, 0.1); color: #fca5a5; animation: mq-pulse 1.2s infinite; }
    .mq-timer.is-warn svg { color: #f87171; }
    @keyframes mq-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.65; } }
    .mq-progress { flex-shrink: 0; height: 3px; background: #15181b; }
    .mq-progress span { display: block; height: 100%; background: linear-gradient(90deg, #ff6b35, #ffa04d); transition: width 0.3s; }

    .mq-score-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 34px;
      padding: 0 14px;
      border-radius: 99px;
      font-size: 0.82rem;
      font-weight: 700;
    }
    .mq-score-pill.is-pass { border: 1px solid rgba(34, 197, 94, 0.45); background: rgba(34, 197, 94, 0.12); color: #4ade80; }
    .mq-score-pill.is-fail { border: 1px solid rgba(239, 68, 68, 0.45); background: rgba(239, 68, 68, 0.12); color: #f87171; }
    .mq-score-detail { color: #8b9098; font-size: 0.8rem; }

    /* Body */
    .mq-body { display: flex; flex: 1; min-height: 0; overflow: hidden; }
    .mq-sidebar {
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      gap: 0.9rem;
      width: 248px;
      padding: 1rem;
      overflow-y: auto;
      background: #0d0f11;
      border-right: 1px solid #1d2024;
    }
    .mq-side-summary { display: flex; flex-direction: column; gap: 8px; padding: 0.8rem; border-radius: 12px; background: #131619; }
    .mq-side-row { display: flex; align-items: baseline; justify-content: space-between; color: #8b9098; font-size: 0.76rem; font-weight: 600; }
    .mq-side-row b { color: #fff; font-size: 0.95rem; }
    .mq-track { height: 6px; overflow: hidden; border-radius: 99px; background: #23272b; }
    .mq-track span { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, #ff6b35, #ffa04d); transition: width 0.3s; }
    .mq-track span.is-green { background: linear-gradient(90deg, #16a34a, #4ade80); }
    .mq-side-stats { display: flex; gap: 12px; color: #7b8088; font-size: 0.72rem; }
    .mq-side-stats b { color: #d1d5db; }
    .mq-side-stats .is-flag { display: inline-flex; align-items: center; gap: 4px; color: #c49bff; }
    .mq-side-stats .is-flag b { color: #c49bff; }
    .mq-side-label { color: #6b7280; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }

    .mq-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
    .mq-box {
      position: relative;
      display: grid;
      place-items: center;
      aspect-ratio: 1;
      border: 1px solid #23272b;
      border-radius: 8px;
      background: #15181b;
      color: #7b8088;
      font-size: 0.76rem;
      font-weight: 700;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s, color 0.15s;
    }
    .mq-box:hover { border-color: #464b52; color: #e5e7eb; }
    .mq-box.is-answered { border-color: rgba(34, 197, 94, 0.45); background: rgba(34, 197, 94, 0.12); color: #4ade80; }
    .mq-box.is-flagged { border-color: rgba(168, 85, 247, 0.5); background: rgba(168, 85, 247, 0.12); color: #c49bff; }
    .mq-box.is-flagged.has-answer::after { content: ''; position: absolute; top: 3px; right: 3px; width: 5px; height: 5px; border-radius: 50%; background: #4ade80; }
    .mq-box.is-current { border-color: #ff6b35; background: #ff6b35; color: #fff; box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.22); }
    .mq-box.is-correct { border-color: rgba(34, 197, 94, 0.45); background: rgba(34, 197, 94, 0.12); color: #4ade80; }
    .mq-box.is-incorrect { border-color: rgba(239, 68, 68, 0.45); background: rgba(239, 68, 68, 0.12); color: #f87171; }
    .mq-box.is-skipped { color: #6b7280; }
    .mq-box.is-active { box-shadow: 0 0 0 2px #fff; }

    .mq-legend { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 10px; margin-top: auto; padding-top: 0.75rem; border-top: 1px solid #1d2024; color: #7b8088; font-size: 0.72rem; }
    .mq-legend span { display: inline-flex; align-items: center; gap: 6px; }
    .mq-legend i { width: 10px; height: 10px; border: 1px solid #2a2e33; border-radius: 3px; background: #15181b; }
    .mq-legend i.is-current { border-color: #ff6b35; background: #ff6b35; }
    .mq-legend i.is-answered, .mq-legend i.is-correct { border-color: rgba(34, 197, 94, 0.6); background: rgba(34, 197, 94, 0.25); }
    .mq-legend i.is-flagged { border-color: rgba(168, 85, 247, 0.6); background: rgba(168, 85, 247, 0.25); }
    .mq-legend i.is-incorrect { border-color: rgba(239, 68, 68, 0.6); background: rgba(239, 68, 68, 0.25); }

    /* Question */
    .mq-main { display: flex; flex: 1; flex-direction: column; min-width: 0; padding: 1.5rem; overflow-y: auto; background: #0a0b0d; }
    .mq-card {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 920px;
      margin: 0 auto;
      padding: 1.6rem 1.8rem 0;
      border: 1px solid #1d2024;
      border-radius: 18px;
      background: #101215;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    }
    .mq-q-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 1.1rem; }
    .mq-q-num { display: flex; align-items: center; gap: 10px; color: #c9cdd2; font-size: 0.86rem; font-weight: 700; }
    .mq-q-num small { color: #6b7280; font-size: 0.84rem; font-weight: 600; }
    .mq-q-badge {
      display: grid;
      place-items: center;
      min-width: 34px;
      height: 34px;
      padding: 0 8px;
      border-radius: 10px;
      background: rgba(255, 107, 53, 0.14);
      color: #ff7a45;
      font-size: 0.92rem;
      font-weight: 800;
    }
    .mq-q-tools { display: flex; gap: 6px; }
    .mq-q-text { margin: 0 0 1.4rem; color: #fff; font-size: 1.15rem; font-weight: 600; line-height: 1.55; white-space: pre-wrap; }

    .mq-options { display: flex; flex-direction: column; gap: 10px; }
    .mq-option {
      display: flex;
      font: inherit;
      align-items: center;
      gap: 14px;
      width: 100%;
      padding: 0.9rem 1rem;
      border: 1px solid #23272b;
      border-radius: 12px;
      background: #0c0e10;
      color: inherit;
      text-align: left;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    .mq-option:hover:not(.is-static) { border-color: #3a3f45; background: #131619; }
    .mq-option.is-selected { border-color: #ff6b35; background: rgba(255, 107, 53, 0.08); }
    .mq-option.is-static { cursor: default; }
    .mq-option.is-correct { border-color: rgba(34, 197, 94, 0.55); background: rgba(34, 197, 94, 0.08); }
    .mq-option.is-wrong { border-color: rgba(239, 68, 68, 0.55); background: rgba(239, 68, 68, 0.08); }
    .mq-opt-letter {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      flex: 0 0 32px;
      border: 1px solid #2a2e33;
      border-radius: 9px;
      background: #181b1f;
      color: #9ca3af;
      font-size: 0.82rem;
      font-weight: 700;
    }
    .mq-option.is-selected .mq-opt-letter { border-color: #ff6b35; background: #ff6b35; color: #fff; }
    .mq-option.is-correct .mq-opt-letter { border-color: #22c55e; background: #22c55e; color: #fff; }
    .mq-option.is-wrong .mq-opt-letter { border-color: #ef4444; background: #ef4444; color: #fff; }
    .mq-opt-text { flex: 1; color: #d1d5db; font-size: 0.95rem; line-height: 1.45; }
    .mq-option.is-selected .mq-opt-text { color: #fff; }
    .mq-radio { position: relative; width: 18px; height: 18px; flex: 0 0 18px; border: 2px solid #3a3f45; border-radius: 50%; transition: border-color 0.15s; }
    .mq-option.is-selected .mq-radio { border-color: #ff6b35; }
    .mq-option.is-selected .mq-radio::after { content: ''; position: absolute; inset: 3px; border-radius: 50%; background: #ff6b35; }
    .mq-opt-tag { display: inline-flex; align-items: center; gap: 5px; font-size: 0.74rem; font-weight: 700; white-space: nowrap; }
    .mq-opt-tag.is-correct { color: #4ade80; }
    .mq-opt-tag.is-wrong { color: #f87171; }
    .mq-hint { margin: 0.9rem 0 0; color: #5b6068; font-size: 0.74rem; }

    .mq-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 99px; font-size: 0.74rem; font-weight: 700; }
    .mq-chip.is-correct { background: rgba(34, 197, 94, 0.12); color: #4ade80; }
    .mq-chip.is-incorrect { background: rgba(239, 68, 68, 0.12); color: #f87171; }
    .mq-chip.is-muted { background: #1a1d21; color: #9ca3af; }

    .mq-explanation { margin-top: 1.25rem; padding: 0.9rem 1rem; border-radius: 12px; background: rgba(255, 107, 53, 0.06); border-left: 3px solid #ff6b35; }
    .mq-exp-label { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 4px; color: #ff9a5c; font-size: 0.78rem; font-weight: 700; }
    .mq-explanation p { margin: 0; color: #c4c8ce; font-size: 0.88rem; line-height: 1.55; }

    .mq-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin: 1.5rem -1.8rem 0;
      padding: 1rem 1.8rem;
      border-top: 1px solid #1d2024;
    }
    .mq-footer-count { color: #6b7280; font-size: 0.8rem; font-weight: 600; }

    /* Submit confirm */
    .mq-confirm-backdrop {
      position: fixed;
      inset: 0;
      z-index: 2000;
      display: grid;
      place-items: center;
      padding: 16px;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
    }
    .mq-confirm { width: 100%; max-width: 420px; padding: 1.6rem; border: 1px solid #23272b; border-radius: 16px; background: #111316; text-align: center; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5); }
    .mq-confirm-icon { display: inline-grid; place-items: center; width: 52px; height: 52px; margin-bottom: 0.7rem; border-radius: 50%; background: rgba(34, 197, 94, 0.12); color: #4ade80; }
    .mq-confirm-icon.is-warn { background: rgba(244, 180, 63, 0.12); color: #f4b43f; }
    .mq-confirm h4 { margin: 0 0 6px; color: #fff; font-size: 1.1rem; font-weight: 700; }
    .mq-confirm p { margin: 0 0 1rem; color: #9ca3af; font-size: 0.86rem; line-height: 1.5; }
    .mq-confirm p b { color: #fff; }
    .mq-confirm-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 1.2rem; }
    .mq-confirm-stats div { display: flex; flex-direction: column; gap: 2px; padding: 0.6rem; border-radius: 10px; background: #181b1f; }
    .mq-confirm-stats b { color: #fff; font-size: 1rem; font-variant-numeric: tabular-nums; }
    .mq-confirm-stats span { color: #6b7280; font-size: 0.68rem; font-weight: 600; }
    .mq-confirm-actions { display: flex; gap: 8px; }
    .mq-confirm-actions .mq-btn { flex: 1; }

    /* Scrollbars */
    .mq-main::-webkit-scrollbar, .mq-sidebar::-webkit-scrollbar { width: 6px; }
    .mq-main::-webkit-scrollbar-thumb, .mq-sidebar::-webkit-scrollbar-thumb { border-radius: 3px; background: #2a2e33; }

    /* Responsive */
    @media (max-width: 900px) {
      .mq-sidebar { width: 200px; }
      .mq-grid { grid-template-columns: repeat(4, 1fr); }
      .mq-main { padding: 1rem; }
      .mq-card { padding: 1.25rem 1.25rem 0; }
      .mq-footer { margin: 1.25rem -1.25rem 0; padding: 0.9rem 1.25rem; }
    }
    @media (max-width: 640px) {
      .mq-header { flex-wrap: wrap; padding: 0.6rem 0.9rem; }
      .mq-head-icon { display: none; }
      .mq-body { flex-direction: column; }
      .mq-sidebar { width: 100%; max-height: 180px; border-right: none; border-bottom: 1px solid #1d2024; }
      .mq-grid { grid-template-columns: repeat(8, 1fr); }
      .mq-legend, .mq-hint { display: none; }
      .mq-q-text { font-size: 1.02rem; }
    }
  `}</style>
)

export default MCQQuiz
