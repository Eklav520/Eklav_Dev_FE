// HumanTeacherAvatar.tsx
import React, { useEffect, useRef, useState } from 'react'

interface HumanTeacherAvatarProps {
  isTyping?: boolean
  isListening?: boolean
  isSpeaking?: boolean
  audioLevel?: number // For microphone input level (0-1)
  expression?: 'neutral' | 'happy' | 'thinking' | 'encouraging'
}

const HumanTeacherAvatar: React.FC<HumanTeacherAvatarProps> = ({
  isTyping = false,
  isListening = false,
  isSpeaking = false,
  audioLevel = 0,
  expression = 'neutral'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const audioContextRef = useRef<AudioContext>()
  const analyserRef = useRef<AnalyserNode>()
  const sourceRef = useRef<MediaStreamAudioSourceNode>()
  const streamRef = useRef<MediaStream>()
  
  const [eyeBlink, setEyeBlink] = useState(0)
  const [headTilt, setHeadTilt] = useState(0)
  const [mouthOpen, setMouthOpen] = useState(0)
  const [eyebrowRaise, setEyebrowRaise] = useState(0)

  // Eye blinking animation
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setEyeBlink(prev => prev === 0 ? 1 : 0)
      setTimeout(() => setEyeBlink(0), 150)
    }, 3000)

    return () => clearInterval(blinkInterval)
  }, [])

  // Head movement (subtle idle animation)
  useEffect(() => {
    const headAnimation = setInterval(() => {
      setHeadTilt(Math.sin(Date.now() / 1000) * 0.05)
    }, 50)

    return () => clearInterval(headAnimation)
  }, [])

  // Mouth animation based on speaking
  useEffect(() => {
    if (isSpeaking) {
      const mouthAnimation = setInterval(() => {
        // Random mouth opening between 0.3 and 0.9
        setMouthOpen(0.3 + Math.random() * 0.6)
      }, 100)
      
      return () => clearInterval(mouthAnimation)
    } else {
      setMouthOpen(isTyping ? 0.2 : 0.1)
    }
  }, [isSpeaking, isTyping])

  // Eyebrow animation based on expression
  useEffect(() => {
    switch(expression) {
      case 'happy':
        setEyebrowRaise(0.3)
        break
      case 'thinking':
        setEyebrowRaise(0.5)
        break
      case 'encouraging':
        setEyebrowRaise(0.2)
        break
      default:
        setEyebrowRaise(0)
    }
  }, [expression])

  // Capture audio for lip-sync when listening
  useEffect(() => {
    if (isListening && !streamRef.current) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          streamRef.current = stream
          audioContextRef.current = new AudioContext()
          analyserRef.current = audioContextRef.current.createAnalyser()
          sourceRef.current = audioContextRef.current.createMediaStreamSource(stream)
          sourceRef.current.connect(analyserRef.current)
          analyserRef.current.fftSize = 256
          
          const bufferLength = analyserRef.current.frequencyBinCount
          const dataArray = new Uint8Array(bufferLength)
          
          const updateAudioLevel = () => {
            if (!analyserRef.current || !isListening) return
            analyserRef.current.getByteFrequencyData(dataArray)
            const average = dataArray.reduce((a, b) => a + b) / bufferLength / 255
            // Update mouth based on audio input
            setMouthOpen(0.1 + average * 0.8)
            animationRef.current = requestAnimationFrame(updateAudioLevel)
          }
          
          updateAudioLevel()
        })
        .catch(err => console.error('Error accessing microphone:', err))
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = undefined
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect()
        sourceRef.current = undefined
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = undefined
      }
    }
  }, [isListening])

  // Draw avatar on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Head with slight tilt
      ctx.save()
      ctx.translate(200 + headTilt * 20, 150)

      // Head shape
      ctx.beginPath()
      ctx.ellipse(0, 0, 90, 100, 0, 0, Math.PI * 2)
      ctx.fillStyle = '#FFDBAC' // Skin tone
      ctx.fill()
      ctx.strokeStyle = '#CCB294'
      ctx.lineWidth = 2
      ctx.stroke()

      // Hair
      ctx.fillStyle = '#8B5A2B' // Brown hair
      ctx.beginPath()
      ctx.ellipse(0, -40, 60, 40, 0, 0, Math.PI * 2)
      ctx.fill()

      // Eyebrows (with raise animation)
      ctx.fillStyle = '#5D3A1A'
      
      // Left eyebrow
      ctx.save()
      ctx.translate(-30, -25 - eyebrowRaise * 10)
      ctx.rotate(-0.1)
      ctx.fillRect(-15, -5, 30, 8)
      ctx.restore()
      
      // Right eyebrow
      ctx.save()
      ctx.translate(30, -25 - eyebrowRaise * 10)
      ctx.rotate(0.1)
      ctx.fillRect(-15, -5, 30, 8)
      ctx.restore()

      // Eyes with blink
      ctx.fillStyle = 'white'
      ctx.beginPath()
      ctx.ellipse(-30, -5, 15, eyeBlink ? 2 : 10, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(30, -5, 15, eyeBlink ? 2 : 10, 0, 0, Math.PI * 2)
      ctx.fill()

      // Pupils
      if (!eyeBlink) {
        ctx.fillStyle = '#2C3E50'
        ctx.beginPath()
        ctx.arc(-30, -5, 6, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(30, -5, 6, 0, Math.PI * 2)
        ctx.fill()
        
        // Eye highlights
        ctx.fillStyle = 'white'
        ctx.beginPath()
        ctx.arc(-34, -9, 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(26, -9, 2, 0, Math.PI * 2)
        ctx.fill()
      }

      // Nose
      ctx.fillStyle = '#E0B691'
      ctx.beginPath()
      ctx.ellipse(0, 15, 8, 12, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#C49A6C'
      ctx.lineWidth = 1
      ctx.stroke()

      // Mouth (animated based on speaking)
      ctx.beginPath()
      ctx.strokeStyle = '#B34B4B'
      ctx.lineWidth = 3
      
      if (mouthOpen > 0.3) {
        // Open mouth for speaking
        ctx.fillStyle = '#E68A8A'
        ctx.beginPath()
        ctx.ellipse(0, 40, 20, 15 * mouthOpen, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        
        // Teeth or tongue
        if (mouthOpen > 0.5) {
          ctx.fillStyle = '#FFB6B6'
          ctx.beginPath()
          ctx.ellipse(0, 40, 15, 8 * mouthOpen, 0, 0, Math.PI * 2)
          ctx.fill()
        }
      } else {
        // Smile
        ctx.beginPath()
        ctx.arc(0, 30, 25, 0.1, Math.PI - 0.1)
        ctx.stroke()
      }

      // Glasses (optional - for teacher look)
      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.ellipse(-30, -5, 20, 18, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(30, -5, 20, 18, 0, 0, Math.PI * 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(-10, -5)
      ctx.lineTo(10, -5)
      ctx.stroke()

      // Teacher outfit (collar)
      ctx.fillStyle = '#4A90E2'
      ctx.beginPath()
      ctx.rect(-40, 70, 80, 30)
      ctx.fill()
      ctx.fillStyle = '#357ABD'
      ctx.beginPath()
      ctx.rect(-30, 70, 60, 15)
      ctx.fill()

      ctx.restore()
    }

    draw()
    animationRef.current = requestAnimationFrame(draw)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [eyeBlink, headTilt, mouthOpen, eyebrowRaise, expression])

  return (
    <div className="human-teacher-avatar" style={{ position: 'relative', width: '100%', height: '100%', minHeight: '300px' }}>
      <canvas
        ref={canvasRef}
        width={400}
        height={300}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
        }}
      />
      
      {/* Status indicators */}
      <div style={{ position: 'absolute', bottom: '10px', left: '10px', display: 'flex', gap: '8px' }}>
        {isListening && (
          <span className="badge bg-info">
            🎤 Listening
          </span>
        )}
        {isSpeaking && (
          <span className="badge bg-success">
            🔴 Speaking
          </span>
        )}
        {isTyping && (
          <span className="badge bg-warning">
            ✏️ Thinking
          </span>
        )}
      </div>

      <style>{`
        .human-teacher-avatar canvas {
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          transition: transform 0.3s ease;
        }
        
        .human-teacher-avatar canvas:hover {
          transform: scale(1.02);
        }
        
        .badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          animation: fadeIn 0.3s ease;
        }
        
        .bg-info {
          background: #ff7a00 !important;
          color: white;
        }
        
        .bg-success {
          background: #4CAF50 !important;
          color: white;
        }
        
        .bg-warning {
          background: #FFC107 !important;
          color: #333;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default HumanTeacherAvatar