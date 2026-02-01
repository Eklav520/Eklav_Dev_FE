import React, { useEffect, useRef } from 'react'

interface AudioVisualizerProps {
  recording: boolean
  strokeColor?: string
  backgroundColor?: string
  className?: string
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  recording,
  strokeColor = '#0d6efd',
  backgroundColor = '#f8f9fa',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const analyserRef = useRef<AnalyserNode>()
  const dataArrayRef = useRef<Uint8Array>()
  const audioContextRef = useRef<AudioContext>()
  const streamRef = useRef<MediaStream>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const canvasContext = canvas.getContext('2d')
    if (!canvasContext) return

    const draw = () => {
      if (!analyserRef.current || !dataArrayRef.current || !canvasContext) return

      animationRef.current = requestAnimationFrame(draw)

      analyserRef.current.getByteTimeDomainData(dataArrayRef.current)

      canvasContext.fillStyle = backgroundColor
      canvasContext.fillRect(0, 0, canvas.width, canvas.height)

      canvasContext.lineWidth = 2
      canvasContext.strokeStyle = strokeColor
      canvasContext.beginPath()

      const sliceWidth = canvas.width / dataArrayRef.current.length
      let x = 0

      for (let i = 0; i < dataArrayRef.current.length; i++) {
        const v = dataArrayRef.current[i] / 128.0
        const y = (v * canvas.height) / 2

        if (i === 0) {
          canvasContext.moveTo(x, y)
        } else {
          canvasContext.lineTo(x, y)
        }

        x += sliceWidth
      }

      canvasContext.lineTo(canvas.width, canvas.height / 2)
      canvasContext.stroke()
    }

    const drawFlatLine = () => {
      if (!canvasContext) return
      
      canvasContext.fillStyle = backgroundColor
      canvasContext.fillRect(0, 0, canvas.width, canvas.height)
      
      canvasContext.lineWidth = 2
      canvasContext.strokeStyle = strokeColor
      canvasContext.beginPath()
      canvasContext.moveTo(0, canvas.height / 2)
      canvasContext.lineTo(canvas.width, canvas.height / 2)
      canvasContext.stroke()
    }

    if (recording) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(stream => {
          streamRef.current = stream
          audioContextRef.current = new AudioContext()
          analyserRef.current = audioContextRef.current.createAnalyser()
          const source = audioContextRef.current.createMediaStreamSource(stream)

          source.connect(analyserRef.current)
          analyserRef.current.fftSize = 2048

          const bufferLength = analyserRef.current.frequencyBinCount
          dataArrayRef.current = new Uint8Array(bufferLength)

          draw()
        })
        .catch(err => {
          console.error('Error accessing microphone:', err)
          drawFlatLine()
        })
    } else {
      // Stop recording
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      drawFlatLine()
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [recording, strokeColor, backgroundColor])

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={100}
      className={className}
      style={{
        width: '100%',
        maxWidth: '600px',
        height: '100px',
        borderRadius: '4px',
      }}
    />
  )
}

export default AudioVisualizer
