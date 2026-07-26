// src/components/ViolationAlert.tsx
import React from 'react'
import { Button } from 'react-bootstrap'
import { FaExclamationTriangle } from 'react-icons/fa'

interface ViolationAlertProps {
  show: boolean
  count: number
  maxViolations: number
  onClose: () => void
}

// Plain fixed overlay instead of react-bootstrap's Modal — Modal's
// `centered` flex-centering combined with a custom margin-top override
// was producing a mismatch between the rendered button position and its
// actual clickable hit-box (clicks landed on the button only when clicked
// a bit above it). This also guarantees the alert renders above the exam's
// own fixed z-index:999999 wrappers, which sit well above Bootstrap's
// default modal z-index (~1055).
const ViolationAlert: React.FC<ViolationAlertProps> = ({
  show,
  count,
  maxViolations,
  onClose,
}) => {
  if (!show) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
      }}
    >
      <div
        style={{
          background: '#1a1a2e',
          border: '2px solid #ff6b6b',
          borderRadius: 12,
          padding: '32px 28px',
          maxWidth: 420,
          width: '90%',
          textAlign: 'center',
          color: '#fff',
        }}
      >
        <FaExclamationTriangle style={{ fontSize: '3rem', color: '#ff6b6b' }} />
        <h5 className="mt-3">⚠️ Proctoring Violation Detected</h5>
        <p style={{ color: '#e2e8f0' }}>Tab switching / Alt+Tab is not allowed during the assessment.</p>
        <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ff6b6b' }}>
          Violation {count} / {maxViolations}
        </p>
        {count >= maxViolations && (
          <p style={{ color: '#ffc107' }}>
            ⚠️ Maximum violations reached. Your exam will auto-submit in 3 seconds.
          </p>
        )}
        <Button variant="danger" onClick={onClose} className="mt-2">
          I Understand
        </Button>
      </div>
    </div>
  )
}

export default ViolationAlert
