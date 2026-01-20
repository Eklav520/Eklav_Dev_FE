import React, { useEffect, useState } from 'react'
import { ProgressBar } from 'react-bootstrap'

interface PasswordStrengthMeterProps {
  password: string
  onScoreChange?: (score: number) => void
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ 
  password, 
  onScoreChange 
}) => {
  const [strength, setStrength] = useState(0)
  const [label, setLabel] = useState('')
  const [variant, setVariant] = useState<'danger' | 'warning' | 'info' | 'success'>('danger')

  useEffect(() => {
    const calculateStrength = () => {
      let score = 0
      if (!password) {
        score = 0
      } else {
        // Length check
        if (password.length >= 8) score += 1
        if (password.length >= 12) score += 1
        
        // Complexity checks
        if (/[A-Z]/.test(password)) score += 1
        if (/[a-z]/.test(password)) score += 1
        if (/[0-9]/.test(password)) score += 1
        if (/[^A-Za-z0-9]/.test(password)) score += 1
      }

      // Normalize to 0-4 scale
      const normalizedScore = Math.min(Math.max(score, 0), 4)
      const percentage = (normalizedScore / 4) * 100
      
      setStrength(percentage)
      
      // Set labels and colors
      if (percentage <= 25) {
        setLabel('Very Weak')
        setVariant('danger')
      } else if (percentage <= 50) {
        setLabel('Weak')
        setVariant('warning')
      } else if (percentage <= 75) {
        setLabel('Fair')
        setVariant('info')
      } else {
        setLabel('Strong')
        setVariant('success')
      }

      onScoreChange?.(normalizedScore)
    }

    calculateStrength()
  }, [password, onScoreChange])

  return (
    <div className="mt-2">
      <div className="d-flex justify-content-between mb-1">
        <small className="text-muted">Password Strength</small>
        <small className={`text-${variant} fw-semibold`}>{label}</small>
      </div>
      <ProgressBar 
        now={strength} 
        variant={variant}
        style={{ height: '4px' }}
      />
      <small className="text-muted d-block mt-1">
        {password ? 'Use uppercase, lowercase, numbers & symbols' : 'Enter a password'}
      </small>
    </div>
  )
}

export default PasswordStrengthMeter