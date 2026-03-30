// src/components/ProctorLockModal.tsx
import React from 'react'
import { Modal, Button, Alert } from 'react-bootstrap'
import { FaExclamationTriangle, FaDesktop, FaShieldAlt } from 'react-icons/fa'

interface ProctorLockModalProps {
  show: boolean
  message: string
  isFullscreen: boolean
  remaining: number
  disabledAcknowledge?: boolean
  onReenterFullscreen: () => void
  onAcknowledge: () => void
}

const ProctorLockModal: React.FC<ProctorLockModalProps> = ({
  show,
  message,
  isFullscreen,
  remaining,
  disabledAcknowledge,
  onReenterFullscreen,
  onAcknowledge,
}) => {
  return (
    <Modal show={show} centered backdrop="static" keyboard={false} className="proctor-lock-modal">
      <Modal.Header className="bg-danger bg-opacity-10 border-danger">
        <Modal.Title>
          <FaExclamationTriangle className="me-2 text-danger" />
          Assessment Locked - Proctoring Violation
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <Alert variant="danger" className="mb-3">
          <FaShieldAlt className="me-2" />
          {message}
        </Alert>
        
        <div className="mb-3">
          <strong>Remaining violations before auto-submission:</strong>{' '}
          <span className="text-warning">{remaining}</span>
        </div>
        
        {!isFullscreen && (
          <Button 
            variant="warning" 
            onClick={onReenterFullscreen}
            className="mb-3 w-100"
          >
            <FaDesktop className="me-2" />
            Re-enter Fullscreen Mode
          </Button>
        )}
        
        <div className="text-muted small">
          <strong>⚠️ Strict Proctoring Rules:</strong>
          <ul className="mt-2 mb-0">
            <li>Do not switch tabs or windows</li>
            <li>Do not use Alt+Tab, Ctrl+Tab, or other system shortcuts</li>
            <li>ESC key is disabled - cannot exit fullscreen</li>
            <li>Right-click is disabled</li>
            <li>Screen recording is active</li>
          </ul>
        </div>
      </Modal.Body>
      
      <Modal.Footer>
        <Button
          variant="danger"
          onClick={onAcknowledge}
          disabled={disabledAcknowledge}
        >
          I Understand - Continue
        </Button>
      </Modal.Footer>
      
      <style>{`
        .proctor-lock-modal .modal-content {
          background: #1a1a2e;
          border: 2px solid #dc3545;
        }
        
        .proctor-lock-modal .modal-header {
          border-bottom-color: #dc3545;
        }
      `}</style>
    </Modal>
  )
}

export default ProctorLockModal