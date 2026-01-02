// src/components/ProctorLockModal.tsx
import React from 'react'
import { Button, Modal } from 'react-bootstrap'

type Props = {
  show: boolean
  message: string
  isFullscreen: boolean
  remaining: number
  disabledAcknowledge?: boolean
  onReenterFullscreen?: () => void
  onAcknowledge?: () => void
  title?: string
}

const ProctorLockModal: React.FC<Props> = ({
  show,
  message,
  isFullscreen,
  remaining,
  disabledAcknowledge,
  onReenterFullscreen,
  onAcknowledge,
  title = '⚠️ Proctoring Violation Detected',
}) => {
  return (
    <Modal show={show} onHide={() => {}} backdrop="static" keyboard={false} centered>
      <div
        style={{
          background: '#200',
          color: '#fff',
          border: '3px solid #ff4d4f',
          borderRadius: 12,
        }}>
        <Modal.Header style={{ border: 'none' }}>
          <Modal.Title style={{ color: '#ff4d4f', fontWeight: 800 }}>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ whiteSpace: 'pre-wrap', fontSize: 16, lineHeight: 1.5 }}>{message}</p>

          {!isFullscreen && onReenterFullscreen && (
            <div style={{ marginTop: 12 }}>
              <Button variant="warning" onClick={onReenterFullscreen}>
                Re-enter Fullscreen
              </Button>
            </div>
          )}

          <div
            style={{
              background: 'rgba(255,255,255,0.1)',
              padding: 12,
              borderRadius: 8,
              marginTop: 16,
              fontSize: 14,
            }}>
            <strong>Remaining Violations:</strong> {remaining}
          </div>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          <Button variant="light" onClick={onAcknowledge} disabled={disabledAcknowledge}>
            {disabledAcknowledge ? 'Limit reached' : 'I Understand — Continue'}
          </Button>
        </Modal.Footer>
      </div>
    </Modal>
  )
}

export default ProctorLockModal
