import React, { useEffect, useState, useRef } from 'react'
import { Badge } from 'react-bootstrap'

let typingAudio: HTMLAudioElement | null = null
try { typingAudio = new Audio('/assets/sounds/typing.mp3') } catch {}

interface Props {
  currentQuestion: string
  isFollowUp: boolean
}

const TypingQuestionBox: React.FC<Props> = ({ currentQuestion, isFollowUp }) => {
  const [displayedText, setDisplayedText] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Clear any running interval first
    if (timerRef.current) clearInterval(timerRef.current)
    setDisplayedText('')

    if (!currentQuestion) return

    let i = 0  // local — no stale closure

    timerRef.current = setInterval(() => {
      if (i >= currentQuestion.length) {
        if (timerRef.current) clearInterval(timerRef.current)
        return
      }
      setDisplayedText(prev => prev + currentQuestion[i])
      i++

      try {
        if (typingAudio) { typingAudio.currentTime = 0; typingAudio.play() }
      } catch {}
    }, 40)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentQuestion])

  return (
    <div className="flex-fill d-flex justify-content-center align-items-center bg-body text-body p-4 border-start border-end border-secondary" style={{ minHeight: '300px' }}>
      <div className="text-center">
        <h4 className="fw-semibold" style={{ lineHeight: '1.6' }}>
          🧠 Que : {displayedText}
          <span style={{ borderRight: '2px solid currentColor', marginLeft: 2, animation: 'blink .7s step-end infinite' }} />
        </h4>
        {isFollowUp && (
          <div className="mt-2">
            <Badge bg="warning" text="dark" className="px-3 py-2 rounded-pill fs-6">
              🔁 Follow-up Question
            </Badge>
          </div>
        )}
      </div>
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  )
}

export default TypingQuestionBox
