// src/components/TypingQuestionBox.tsx
import React, { useEffect, useState } from 'react'
import { Badge } from 'react-bootstrap'

// You can remove this or make it optional if sound not needed
const typingSound = new Audio('/assets/sounds/typing.mp3') // Ensure this exists or remove

interface Props {
  currentQuestion: string
  isFollowUp: boolean
}

const TypingQuestionBox: React.FC<Props> = ({ currentQuestion, isFollowUp }) => {
  const [displayedText, setDisplayedText] = useState('')
  const [charIndex, setCharIndex] = useState(0)

 useEffect(() => {
  let timer: ReturnType<typeof setInterval> | undefined

  setDisplayedText('')
  setCharIndex(0)

  if (currentQuestion) {
    timer = setInterval(() => {
      setDisplayedText((prev) => {
        const nextChar = currentQuestion[charIndex]
        try {
          typingSound.currentTime = 0
          typingSound.play()
        } catch {}
        return prev + nextChar
      })

      setCharIndex((prev) => prev + 1)
    }, 40)

    if (charIndex >= currentQuestion.length && timer) clearInterval(timer)
  }

  return () => {
    if (timer) clearInterval(timer)
  }
}, [currentQuestion])


  return (
    <div className="flex-fill d-flex justify-content-center align-items-center bg-body text-body p-4 border-start border-end border-secondary" style={{ minHeight: '300px' }}>
      <div className="text-center">
        <h4 className="fw-semibold" style={{ lineHeight: '1.6' }}>
          🧠 Que : {displayedText}
        </h4>
        {isFollowUp && (
          <div className="mt-2">
            <Badge bg="warning" text="dark" className="px-3 py-2 rounded-pill fs-6">
              🔁 Follow-up Question
            </Badge>
          </div>
        )}
      </div>
    </div>
  )
}

export default TypingQuestionBox
