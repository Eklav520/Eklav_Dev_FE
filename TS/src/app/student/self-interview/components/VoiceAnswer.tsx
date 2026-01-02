import React, { useEffect, useRef, useState } from 'react'

type VoiceAnswerProps = {
  answer: string
  onChange: (text: string) => void
  onSubmit: () => void
  onNext: () => void
  isLastQuestion: boolean
  disabled?: boolean
}

const VoiceAnswer: React.FC<VoiceAnswerProps> = ({
  answer,
  onChange,
  onSubmit,
  onNext,
  isLastQuestion,
  disabled = false,
}) => {
  const recognitionRef = useRef<any>(null)
  const finalRef = useRef('')                 // persist final transcript between events
  const [listening, setListening] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const getSpeechCtor = () =>
    (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition

  const browserSupportsSpeech = typeof window !== 'undefined' && !!getSpeechCtor()

  // Build (or rebuild) a single recognition instance
  const ensureRecognition = () => {
    const Ctor = getSpeechCtor()
    if (!Ctor) return null
    if (recognitionRef.current) return recognitionRef.current

    const rec = new Ctor()
    rec.lang = 'en-US'
    rec.interimResults = true
    rec.continuous = true // we will still handle auto-restart on onend

    rec.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalRef.current += chunk + ' '
        } else {
          interim += chunk
        }
      }
      onChange((finalRef.current + interim).trim())
    }

    rec.onerror = (e: any) => {
      // common: "not-allowed", "service-not-allowed", "network", "no-speech", "aborted"
      setErrorMsg(`Speech recognition error: ${e?.error ?? 'unknown'}`)
      // if mic permission denied or service unavailable, stop listening state
      if (['not-allowed', 'service-not-allowed'].includes(e?.error)) {
        setListening(false)
      }
    }

    rec.onend = () => {
      // Chrome often calls onend even while speaking; if we *want* to be listening, auto-restart.
      if (listening && !disabled) {
        try {
          rec.start()
        } catch {
          // start can throw if already started; swallow
        }
      } else {
        setListening(false)
      }
    }

    rec.onstart = () => {
      setErrorMsg(null)
      setListening(true)
    }

    recognitionRef.current = rec
    return rec
  }

  const startVoice = async () => {
    if (!browserSupportsSpeech || disabled) return

    setErrorMsg(null)

    // Warm up mic permission (prevents some silent failures)
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        // Immediately stop tracks; we only needed the permission prompt
        stream.getTracks().forEach((t) => t.stop())
      }
    } catch (e: any) {
      setErrorMsg('Microphone permission denied.')
      return
    }

    const rec = ensureRecognition()
    if (!rec) {
      setErrorMsg('Your browser does not support speech recognition.')
      return
    }

    // Reset interim + final only when starting a fresh recording session
    finalRef.current = ''
    onChange('')

    try {
      rec.start()
      setListening(true)
    } catch {
      // If it’s already started, ignore
    }
  }

  const stopVoice = () => {
    if (disabled) return
    const rec = recognitionRef.current
    if (!rec) return
    // Prevent auto-restart in onend
    setListening(false)
    try {
      rec.stop()
    } catch {
      // ignore
    }
  }

  const handleSubmit = () => {
    if (disabled) return
    stopVoice()
    onSubmit()
  }

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      try {
        recognitionRef.current?.stop?.()
      } catch {}
      recognitionRef.current = null
    }
  }, [])

  if (!browserSupportsSpeech) {
    return <span className="text-danger">🎤 Your browser does not support voice input.</span>
  }

  return (
    <div className="p-3 border rounded mt-4">
      <h5>🎙 Voice Answer</h5>
      <div className="d-flex align-items-center gap-2">
        <span className={listening ? 'text-success' : 'text-light'}>
          {listening ? '🟢 Listening…' : '🎤 Click Start to speak.'}
        </span>
        {errorMsg && <span className="text-danger ms-2">{errorMsg}</span>}
      </div>

      <div className="row mt-2">
        <div className="col-md-2 d-flex flex-column gap-2 mb-3">
          <button onClick={startVoice} className="btn btn-success w-auto" disabled={disabled || listening}>
            Start
          </button>
          <button onClick={stopVoice} className="btn btn-warning w-auto" disabled={disabled || !listening}>
            Stop
          </button>
          <button onClick={handleSubmit} className="btn btn-primary w-auto" disabled={disabled}>
            Submit
          </button>
        </div>

        <div className="col-md-10">
          <textarea
            className="form-control h-100"
            rows={5}
            placeholder="You can also type your answer here..."
            value={answer}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  )
}

export default VoiceAnswer
