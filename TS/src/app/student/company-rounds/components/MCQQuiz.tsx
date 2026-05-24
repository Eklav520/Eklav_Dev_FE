import React, { useState, useEffect } from 'react'
import { Button, Badge, ProgressBar } from 'react-bootstrap'
import { ChevronLeft, ChevronRight, Clock, CheckCircle, XCircle, FileText, AlertCircle, Grid3x3, List } from 'lucide-react'

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

const MCQQuiz: React.FC<Props> = ({ round, companyName, role, quizQuestions, onClose, onAttemptComplete }) => {
  const total = quizQuestions.length
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [reviewIdx, setReviewIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(round.duration * 60)
  const [timerActive, setTimerActive] = useState(true)

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); setTimerActive(false); doSubmit(); return 0 }
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

  const doSubmit = () => {
    let correct = 0
    quizQuestions.forEach(q => { if (answers[q._id] === q.correctAnswer) correct++ })
    const pct = (correct / total) * 100
    setScore(pct)
    setSubmitted(true)
    setTimerActive(false)
    // Fire attempt callback so parent can save + show result screen
    onAttemptComplete?.({
      answers,
      score: Math.round(pct),
      totalQuestions: total,
      correctAnswers: correct,
    })
  }

  const answeredCount = Object.keys(answers).length
  const passed = score >= 70
  const correctCount = Math.round((score / 100) * total)

  const getStatus = (idx: number) => {
    const q = quizQuestions[idx]
    if (!submitted) {
      if (idx === currentIdx) return 'current'
      if (answers[q._id] != null) return 'answered'
      return 'unanswered'
    }
    return answers[q._id] === q.correctAnswer ? 'correct' : 'incorrect'
  }

  if (submitted) {
    const reviewQ = quizQuestions[reviewIdx]
    const isCorrect = answers[reviewQ._id] === reviewQ.correctAnswer
    return (
      <div className="mq-container">
        <div className="mq-header">
          <div className="mq-header-left">
            <Button className="mq-back-btn" onClick={onClose}><ChevronLeft size={14} /> Exit</Button>
            <div className="mq-title-group">
              <span className="mq-company">{companyName} • {role}</span>
              <span className="mq-round-name"><FileText size={12} /> {round.roundName}</span>
            </div>
          </div>
          <div className="mq-score-summary">
            <span className={`mq-score-pill ${passed ? 'mq-pill-pass' : 'mq-pill-fail'}`}>
              {passed ? <CheckCircle size={12} /> : <XCircle size={12} />}
              {Math.round(score)}% {passed ? 'Passed' : 'Failed'}
            </span>
            <span className="mq-score-detail">{correctCount}/{total} correct</span>
          </div>
        </div>
        
        <div className="mq-body">
          <div className="mq-sidebar">
            <div className="mq-sidebar-header">
              <Grid3x3 size={12} />
              <span>Questions</span>
            </div>
            <div className="mq-grid">
              {quizQuestions.map((q, i) => (
                <button
                  key={q._id}
                  className={`mq-box ${answers[q._id] === q.correctAnswer ? 'mq-box-correct' : 'mq-box-incorrect'} ${i === reviewIdx ? 'mq-box-active' : ''}`}
                  onClick={() => setReviewIdx(i)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="mq-progress-summary">
              <ProgressBar 
                now={(correctCount / total) * 100} 
                variant="warning" 
                className="mq-progress-bar"
              />
              <span className="mq-progress-text">{correctCount} of {total} correct</span>
            </div>
          </div>
          
          <div className="mq-question-area">
            <div className="mq-question-header">
              <span className="mq-qnum-label">Q{reviewIdx + 1}</span>
              <Badge className={`mq-review-badge ${isCorrect ? 'mq-rb-correct' : 'mq-rb-incorrect'}`}>
                {isCorrect ? <CheckCircle size={10} /> : <XCircle size={10} />}
                {isCorrect ? 'Correct' : 'Incorrect'}
              </Badge>
            </div>
            
            <p className="mq-question-text">{reviewQ.question}</p>
            
            <div className="mq-options-compact">
              {(reviewQ.options || []).map((opt, oi) => {
                const isSelected = answers[reviewQ._id] === opt
                const isAnswer = reviewQ.correctAnswer === opt
                let cls = 'mq-option-compact'
                if (isAnswer) cls += ' mq-opt-correct'
                else if (isSelected) cls += ' mq-opt-wrong'
                return (
                  <div key={oi} className={cls}>
                    <span className="mq-opt-letter">{String.fromCharCode(65 + oi)}</span>
                    <span className="mq-opt-text">{String(opt)}</span>
                    {isAnswer && <CheckCircle size={12} className="mq-opt-icon-correct" />}
                    {isSelected && !isAnswer && <XCircle size={12} className="mq-opt-icon-wrong" />}
                  </div>
                )
              })}
            </div>
            
            {reviewQ.explanation && (
              <div className="mq-explanation-compact">
                <span className="mq-exp-label">💡 Explanation</span>
                <p className="mq-exp-text">{reviewQ.explanation}</p>
              </div>
            )}
            
            <div className="mq-nav-btns">
              <Button size="sm" className="mq-nav-btn" disabled={reviewIdx === 0} onClick={() => setReviewIdx(i => i - 1)}>
                <ChevronLeft size={12} /> Previous
              </Button>
              <Button size="sm" className="mq-nav-btn" disabled={reviewIdx === total - 1} onClick={() => setReviewIdx(i => i + 1)}>
                Next <ChevronRight size={12} />
              </Button>
            </div>
          </div>
        </div>
        <MQStyles />
      </div>
    )
  }

  return (
    <div className="mq-container">
      <div className="mq-header">
        <div className="mq-header-left">
          <Button className="mq-back-btn" onClick={onClose}><ChevronLeft size={14} /> Exit</Button>
          <div className="mq-title-group">
            <span className="mq-company">{companyName} • {role}</span>
            <span className="mq-round-name"><FileText size={12} /> {round.roundName}</span>
          </div>
        </div>
        <div className="mq-header-right">
          <div className="mq-stats-compact">
            <div className="mq-stat-item">
              <span className="mq-stat-value answered">{answeredCount}</span>
              <span className="mq-stat-label">Answered</span>
            </div>
            <div className="mq-stat-item">
              <span className="mq-stat-value">{total - answeredCount}</span>
              <span className="mq-stat-label">Left</span>
            </div>
          </div>
          <div className={`mq-timer ${timeLeft < 300 ? 'mq-timer-warn' : ''}`}>
            <Clock size={12} />
            <span>{formatTime(timeLeft)}</span>
          </div>
          <Button size="sm" className="mq-submit-btn" onClick={doSubmit}>Submit</Button>
        </div>
      </div>
      
      <div className="mq-body-compact">
        <div className="mq-sidebar-compact">
          <div className="mq-sidebar-header">
            <List size={12} />
            <span>Questions</span>
          </div>
          <div className="mq-grid-compact">
            {quizQuestions.map((q, i) => (
              <button
                key={q._id}
                className={`mq-box-compact mq-box-${getStatus(i)}`}
                onClick={() => setCurrentIdx(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mq-legend-compact">
            <div className="mq-legend-item">
              <span className="mq-legend-dot current" />
              <span>Current</span>
            </div>
            <div className="mq-legend-item">
              <span className="mq-legend-dot answered" />
              <span>Answered</span>
            </div>
            <div className="mq-legend-item">
              <span className="mq-legend-dot unanswered" />
              <span>Unanswered</span>
            </div>
          </div>
        </div>
        
        <div className="mq-question-area-compact">
          <div className="mq-question-header">
            <span className="mq-qnum-label">Question {currentIdx + 1}</span>
            {answers[currentQ._id] != null && (
              <Badge className="mq-answered-badge-compact">
                <CheckCircle size={10} /> Answered
              </Badge>
            )}
          </div>
          
          <p className="mq-question-text-compact">{currentQ.question}</p>
          
          <div className="mq-options-compact">
            {(currentQ.options || []).map((opt, oi) => {
              const selected = answers[currentQ._id] === opt
              return (
                <div 
                  key={oi} 
                  className={`mq-option-compact ${selected ? 'mq-option-selected' : ''}`} 
                  onClick={() => handleSelect(opt)}
                >
                  <span className="mq-opt-letter">{String.fromCharCode(65 + oi)}</span>
                  <span className="mq-opt-text">{String(opt)}</span>
                  <span className={`mq-radio-compact ${selected ? 'mq-radio-filled' : ''}`} />
                </div>
              )
            })}
          </div>
          
          <div className="mq-nav-btns-compact">
            {answers[currentQ._id] != null && (
              <Button size="sm" variant="link" className="mq-clear-btn-compact" onClick={() => {
                const n = { ...answers }
                delete n[currentQ._id]
                setAnswers(n)
              }}>
                <AlertCircle size={12} /> Clear
              </Button>
            )}
            <div className="mq-nav-spacer" />
            <div className="mq-nav-buttons-group">
              <Button size="sm" className="mq-nav-btn" disabled={currentIdx === 0} onClick={() => setCurrentIdx(i => i - 1)}>
                <ChevronLeft size={12} /> Prev
              </Button>
              <Button size="sm" className="mq-nav-btn" disabled={currentIdx === total - 1} onClick={() => setCurrentIdx(i => i + 1)}>
                Next <ChevronRight size={12} />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <MQStyles />
    </div>
  )
}

const MQStyles = () => (
  <style>{`
    .mq-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #0a0a0f;
      color: #e0e0e0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* Header */
    .mq-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 1.25rem;
      background: #0f0f14;
      border-bottom: 1px solid #1e1e2a;
      flex-shrink: 0;
    }

    .mq-header-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .mq-back-btn {
      background: transparent;
      border: 1px solid #2a2a35;
      color: #888;
      padding: 0.25rem 0.6rem;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      border-radius: 6px;
    }

    .mq-back-btn:hover {
      border-color: #ff6b35;
      color: #ff6b35;
    }

    .mq-title-group {
      display: flex;
      flex-direction: column;
    }

    .mq-company {
      font-size: 0.65rem;
      color: #666;
    }

    .mq-round-name {
      font-size: 0.8rem;
      color: #ff6b35;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .mq-header-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .mq-stats-compact {
      display: flex;
      gap: 0.75rem;
    }

    .mq-stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .mq-stat-value {
      font-size: 0.9rem;
      font-weight: 700;
      line-height: 1.2;
      color: #ff6b35;
    }

    .mq-stat-value.answered {
      color: #ff6b35;
    }

    .mq-stat-label {
      font-size: 0.55rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .mq-timer {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(255, 107, 53, 0.1);
      border: 1px solid rgba(255, 107, 53, 0.3);
      color: #ff6b35;
      padding: 0.25rem 0.7rem;
      border-radius: 6px;
      font-size: 0.85rem;
      font-weight: 700;
      font-family: monospace;
    }

    .mq-timer.mq-timer-warn {
      background: rgba(255, 107, 53, 0.2);
      border-color: #ff6b35;
      color: #ff6b35;
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    .mq-submit-btn {
      background: linear-gradient(135deg, #ff6b35 0%, #ff9a5c 100%);
      border: none;
      padding: 0.3rem 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 6px;
      color: #fff;
    }

    .mq-submit-btn:hover {
      opacity: 0.9;
    }

    .mq-score-summary {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .mq-score-pill {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.25rem 0.7rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .mq-pill-pass {
      background: rgba(40, 167, 69, 0.15);
      color: #28a745;
      border: 1px solid #28a745;
    }

    .mq-pill-fail {
      background: rgba(220, 53, 69, 0.15);
      color: #dc3545;
      border: 1px solid #dc3545;
    }

    .mq-score-detail {
      font-size: 0.7rem;
      color: #888;
    }

    /* Body - Compact Version */
    .mq-body-compact {
      display: flex;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    /* Sidebar Compact */
    .mq-sidebar-compact {
      width: 170px;
      flex-shrink: 0;
      background: #0b0b10;
      border-right: 1px solid #1a1a25;
      padding: 0.75rem 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .mq-sidebar-header {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.65rem;
      font-weight: 600;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .mq-grid-compact {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
    }

    .mq-box-compact {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 5px;
      font-size: 0.65rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }

    .mq-box-compact:hover {
      transform: scale(1.05);
    }

    .mq-box-unanswered {
      background: #1a1a25;
      color: #666;
    }

    .mq-box-answered {
      background: rgba(255, 107, 53, 0.2);
      color: #ff6b35;
      border: 1px solid rgba(255, 107, 53, 0.4);
    }

    .mq-box-current {
      background: #ff6b35;
      color: #fff;
      box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.3);
    }

    .mq-box-correct {
      background: rgba(40, 167, 69, 0.25);
      color: #28a745;
      border: 1px solid rgba(40, 167, 69, 0.5);
    }

    .mq-box-incorrect {
      background: rgba(220, 53, 69, 0.2);
      color: #dc3545;
      border: 1px solid rgba(220, 53, 69, 0.4);
    }

    .mq-box-active {
      box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.25) !important;
    }

    .mq-legend-compact {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      margin-top: auto;
    }

    .mq-legend-item {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.6rem;
      color: #777;
    }

    .mq-legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 2px;
    }

    .mq-legend-dot.current {
      background: #ff6b35;
    }

    .mq-legend-dot.answered {
      background: #ff6b35;
      opacity: 0.7;
    }

    .mq-legend-dot.unanswered {
      background: #2a2a35;
    }

    /* Question Area Compact */
    .mq-question-area-compact {
      flex: 1;
      padding: 0.85rem 1rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.7rem;
    }

    .mq-question-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .mq-qnum-label {
      font-size: 0.7rem;
      font-weight: 700;
      color: #ff6b35;
    }

    .mq-answered-badge-compact {
      background: rgba(255, 107, 53, 0.15);
      color: #ff6b35;
      border: 1px solid rgba(255, 107, 53, 0.4);
      font-size: 0.6rem;
      padding: 0.15rem 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.2rem;
    }

    .mq-question-text-compact {
      font-size: 0.85rem;
      color: #f0f0f0;
      line-height: 1.45;
      margin: 0;
      font-weight: 500;
    }

    .mq-options-compact {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    .mq-option-compact {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.45rem 0.7rem;
      background: #0f0f16;
      border: 1px solid #1e1e2a;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .mq-option-compact:hover {
      border-color: #ff6b35;
      background: rgba(255, 107, 53, 0.05);
    }

    .mq-option-selected {
      border-color: #ff6b35;
      background: rgba(255, 107, 53, 0.08);
    }

    .mq-opt-letter {
      width: 22px;
      height: 22px;
      border-radius: 5px;
      background: #1a1a25;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.65rem;
      font-weight: 700;
      color: #ff6b35;
      flex-shrink: 0;
    }

    .mq-opt-text {
      flex: 1;
      font-size: 0.8rem;
      color: #d0d0d0;
    }

    .mq-radio-compact {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid #444;
      flex-shrink: 0;
    }

    .mq-radio-filled {
      border-color: #ff6b35;
      background: #ff6b35;
      box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.2);
    }

    .mq-nav-btns-compact {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid #1a1a25;
    }

    .mq-nav-spacer {
      flex: 1;
    }

    .mq-nav-buttons-group {
      display: flex;
      gap: 0.4rem;
    }

    .mq-nav-btn {
      background: #141420;
      border: 1px solid #2a2a35;
      color: #ccc;
      padding: 0.25rem 0.65rem;
      font-size: 0.7rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      border-radius: 6px;
    }

    .mq-nav-btn:hover:not(:disabled) {
      border-color: #ff6b35;
      color: #ff6b35;
    }

    .mq-nav-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    .mq-clear-btn-compact {
      color: #888;
      font-size: 0.7rem;
      padding: 0.25rem 0.5rem;
      text-decoration: none;
    }

    .mq-clear-btn-compact:hover {
      color: #ff6b35;
    }

    /* Review Mode Styles */
    .mq-body {
      display: flex;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .mq-sidebar {
      width: 180px;
      flex-shrink: 0;
      background: #0b0b10;
      border-right: 1px solid #1a1a25;
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }

    .mq-sidebar-header {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.7rem;
      font-weight: 600;
      color: #888;
    }

    .mq-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 5px;
    }

    .mq-box {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 6px;
      font-size: 0.7rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }

    .mq-progress-summary {
      margin-top: auto;
      padding-top: 0.5rem;
    }

    .mq-progress-bar {
      height: 3px;
      margin-bottom: 0.3rem;
    }

    .mq-progress-bar .progress-bar {
      background-color: #ff6b35;
    }

    .mq-progress-text {
      font-size: 0.6rem;
      color: #666;
    }

    .mq-question-area {
      flex: 1;
      padding: 1rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
    }

    .mq-review-badge {
      font-size: 0.65rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.2rem 0.6rem;
    }

    .mq-rb-correct {
      background: rgba(40, 167, 69, 0.15);
      color: #28a745;
      border: 1px solid rgba(40, 167, 69, 0.4);
    }

    .mq-rb-incorrect {
      background: rgba(220, 53, 69, 0.15);
      color: #dc3545;
      border: 1px solid rgba(220, 53, 69, 0.4);
    }

    .mq-opt-correct {
      border-color: #28a745;
      background: rgba(40, 167, 69, 0.1);
    }

    .mq-opt-wrong {
      border-color: #dc3545;
      background: rgba(220, 53, 69, 0.1);
    }

    .mq-opt-icon-correct {
      color: #28a745;
    }

    .mq-opt-icon-wrong {
      color: #dc3545;
    }

    .mq-explanation-compact {
      background: #0d0d14;
      border-left: 3px solid #ff6b35;
      border-radius: 6px;
      padding: 0.6rem;
      margin-top: 0.25rem;
    }

    .mq-exp-label {
      font-size: 0.65rem;
      font-weight: 600;
      color: #ff6b35;
      display: block;
      margin-bottom: 0.25rem;
    }

    .mq-exp-text {
      font-size: 0.75rem;
      color: #aaa;
      line-height: 1.4;
      margin: 0;
    }

    /* Scrollbar */
    .mq-question-area-compact::-webkit-scrollbar,
    .mq-question-area::-webkit-scrollbar {
      width: 4px;
    }

    .mq-question-area-compact::-webkit-scrollbar-track,
    .mq-question-area::-webkit-scrollbar-track {
      background: #1a1a25;
    }

    .mq-question-area-compact::-webkit-scrollbar-thumb,
    .mq-question-area::-webkit-scrollbar-thumb {
      background: #ff6b35;
      border-radius: 2px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .mq-header {
        flex-direction: column;
        gap: 0.5rem;
        align-items: stretch;
      }
      
      .mq-header-left {
        justify-content: space-between;
      }
      
      .mq-header-right {
        justify-content: space-between;
      }
      
      .mq-sidebar-compact {
        width: 120px;
      }
      
      .mq-grid-compact {
        grid-template-columns: repeat(3, 1fr);
      }
      
      .mq-question-text-compact {
        font-size: 0.8rem;
      }
      
      .mq-opt-text {
        font-size: 0.75rem;
      }
    }
  `}</style>
)

export default MCQQuiz