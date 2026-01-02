// ReadyPlayerMeAvatar.tsx
import React, { useEffect, useRef, useState } from 'react'
import { Spinner } from 'react-bootstrap'

interface ReadyPlayerMeAvatarProps {
  isSpeaking: boolean
  status: 'idle' | 'speaking' | 'listening' | 'processing'
  avatarUrl?: string
  size?: number
}

const ReadyPlayerMeAvatar: React.FC<ReadyPlayerMeAvatarProps> = ({ 
  isSpeaking, 
  status, 
  avatarUrl,
  size = 140
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Sample avatar images - using high-quality AI/professional avatars
  const avatarImages = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face', // Professional male
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face', // Professional female
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face', // Professional female 2
  ]

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

  // Select a random avatar or use the first one
  const selectedAvatar = avatarImages[0]

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const handleImageError = () => {
    setError('Failed to load avatar')
    setIsLoading(false)
  }

  if (error) {
    return (
      <div className="avatar-fallback" style={{ width: size, height: size }}>
        <div className="fallback-avatar animated">
          <div className="avatar-head">
            <div className="avatar-face">
              <div className="avatar-eyes">
                <div className={`eye left ${status}`}></div>
                <div className={`eye right ${status}`}></div>
              </div>
              <div className="avatar-mouth-container">
                <div className={`avatar-mouth ${isSpeaking ? 'talking' : ''}`}>
                  {isSpeaking && (
                    <>
                      <div className="lip-top"></div>
                      <div className="lip-bottom"></div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="avatar-status">
          <div className={`status-badge ${status}`}>
            {getStatusText()}
          </div>
        </div>
      </div>
    )
  }
  const MouthAnimation = ({ isSpeaking }: { isSpeaking: boolean }) => {
  return (
    <div className="mouth-animation-container">
      <div className={`mouth ${isSpeaking ? 'speaking' : ''}`}>
        {isSpeaking && (
          <div className="mouth-inner">
            <div className="lip-top"></div>
            <div className="lip-bottom"></div>
          </div>
        )}
      </div>
    </div>
  )
}

  return (
    <div 
      className="ready-player-me-avatar" 
      style={{ width: size, height: size }}
    >
      {isLoading && (
        <div className="avatar-loading">
          <Spinner animation="border" variant="primary" size="sm" />
          <span>Loading Avatar...</span>
        </div>
      )}
      
      <div className={`avatar-image-container ${isLoading ? 'loading' : 'loaded'}`}>
        <img
          src={selectedAvatar}
          alt="AI Interviewer"
          className={`avatar-image ${isSpeaking ? 'speaking' : ''} ${status}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '12px'
          }}
        />
        <MouthAnimation isSpeaking={isSpeaking} />
        
        {/* Status border */}
        <div 
          className="status-border"
          style={{
            borderColor: getStatusColor(),
            opacity: isSpeaking ? 0.8 : 0.4
          }}
        ></div>
        
        {/* Speaking animation overlay */}
        {isSpeaking && (
          <div 
            className="speaking-glow"
            style={{
              backgroundColor: getStatusColor()
            }}
          ></div>
        )}
      </div>
      
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

export default ReadyPlayerMeAvatar