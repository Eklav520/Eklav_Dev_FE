// FreeAnimatedAvatar.tsx
import React, { useEffect, useState } from 'react'
import Lottie from 'lottie-react'
import { Spinner } from 'react-bootstrap'

interface FreeAnimatedAvatarProps {
  isSpeaking: boolean
  status: 'idle' | 'speaking' | 'listening' | 'processing'
  size?: number
}

const FreeAnimatedAvatar: React.FC<FreeAnimatedAvatarProps> = ({ 
  isSpeaking, 
  status, 
  size = 180 
}) => {
  const [animationData, setAnimationData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Free Lottie animations from LottieFiles
  const animations = {
    idle: 'https://assets1.lottiefiles.com/packages/lf20_uk52nx2q.json',
    speaking: 'https://assets1.lottiefiles.com/packages/lf20_kdxn8d2c.json',
    listening: 'https://assets1.lottiefiles.com/packages/lf20_osdxlbqq.json',
    processing: 'https://assets1.lottiefiles.com/packages/lf20_yy6g2msw.json'
  }

  useEffect(() => {
    const loadAnimation = async () => {
      try {
        setLoading(true)
        const animationUrl = isSpeaking ? animations.speaking : 
                           status === 'listening' ? animations.listening :
                           status === 'processing' ? animations.processing : 
                           animations.idle
        
        const response = await fetch(animationUrl)
        const data = await response.json()
        setAnimationData(data)
      } catch (error) {
        console.error('Failed to load animation:', error)
        // Fallback to local animations if needed
      } finally {
        setLoading(false)
      }
    }

    loadAnimation()
  }, [isSpeaking, status])

  const getStatusColor = () => {
    switch (status) {
      case 'speaking': return '#00e5ff'
      case 'listening': return '#28a745'
      case 'processing': return '#ffc107'
      case 'idle': return '#6c757d'
      default: return '#6c757d'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'speaking': return 'Speaking...'
      case 'listening': return 'Listening...'
      case 'processing': return 'Processing...'
      case 'idle': return 'Ready'
      default: return 'Ready'
    }
  }

  if (loading) {
    return (
      <div className="free-avatar-container" style={{ width: size, height: size }}>
        <div className="avatar-loading">
          <Spinner animation="border" variant="primary" size="sm" />
          <span>Loading Avatar...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="free-avatar-container" style={{ width: size, height: size }}>
      {animationData && (
        <Lottie
          animationData={animationData}
          loop={true}
          autoplay={true}
          style={{
            width: size,
            height: size,
            borderRadius: '12px'
          }}
        />
      )}
      
      {/* Status border */}
      <div 
        className="status-border"
        style={{
          borderColor: getStatusColor(),
          opacity: isSpeaking ? 0.8 : 0.4
        }}
      ></div>

      {/* Status indicator */}
      <div className="avatar-status">
        <div 
          className={`status-indicator ${status}`}
          style={{
            backgroundColor: getStatusColor() + '20',
            color: getStatusColor()
          }}
        >
          <div 
            className="pulse-dot"
            style={{ backgroundColor: getStatusColor() }}
          ></div>
          <span className="status-text">{getStatusText()}</span>
        </div>
      </div>
    </div>
  )
}

export default FreeAnimatedAvatar