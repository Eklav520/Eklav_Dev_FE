import React, { useState, useRef } from 'react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import AudioVisualizer from '../../../../components/AudioVisualizer'
import Lottie from 'lottie-react'
import avatarAnimation from '../../../../assets/data/Avatar.json'

const questions = [
  'Tell me about yourself.',
  'What are your strengths?',
  'Describe a challenge you faced and how you overcame it.',
]

const AIInterview = () => {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition()

  const micRef = useRef<any>(null)

  const currentQuestion = questions[questionIndex]

  const handleStart = () => {
    setRecording(true)
    SpeechRecognition.startListening({ continuous: true, language: 'en-IN' })
  }

  const handleStop = () => {
    setRecording(false)
    SpeechRecognition.stopListening()
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${baseURL}/ask-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: '1234',
          question: currentQuestion,
          responseText: transcript,
        }),
      })

      const data = await response.json()
      setFeedback(data.feedback)

      // Next question after delay
      setTimeout(() => {
        if (questionIndex < questions.length - 1) {
          setQuestionIndex(prev => prev + 1)
          setFeedback('')
          resetTranscript()
        }
      }, 3000)
    } catch (err) {
      setFeedback('Error while getting feedback.')
    } finally {
      setLoading(false)
      setRecording(false)
      SpeechRecognition.stopListening()
    }
  }

  if (!browserSupportsSpeechRecognition) {
    return <p>Your browser does not support speech recognition.</p>
  }

  return (
    <div className="container text-center">
      <Lottie
        animationData={avatarAnimation}
        loop
        autoplay
        style={{
          height: 200,
          width: 200,
          filter: listening ? 'drop-shadow(0 0 20px #0d6efd)' : 'none',
        }}
      />

      <h4 className="mt-3">🧠 Question:</h4>
      <p className="lead">{currentQuestion}</p>

      <AudioVisualizer
        recording={recording}
        strokeColor="#0d6efd"
        backgroundColor="#f8f9fa"
        className="sound-wave"
      />

      <div className="my-3">
        <button className="btn btn-outline-primary me-2" onClick={handleStart} disabled={recording}>
          🎙️ Start
        </button>
        <button className="btn btn-outline-secondary me-2" onClick={handleStop} disabled={!recording}>
          ⏹️ Stop
        </button>
        <button className="btn btn-success" onClick={handleSubmit} disabled={!transcript || loading}>
          {loading ? 'Analyzing...' : 'Submit'}
        </button>
      </div>

      <div className="bg-light p-3 rounded mt-2">
        <h6>Your Answer:</h6>
        <p>{transcript || '(Waiting for response...)'}</p>
      </div>

      {feedback && (
        <div className="alert alert-info mt-3">
          <h6>✅ AI Feedback:</h6>
          <p>{feedback}</p>
        </div>
      )}
    </div>
  )
}

export default AIInterview
