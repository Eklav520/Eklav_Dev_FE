// src/components/ViolationAlert.tsx
import React, { useEffect } from 'react'
import { Modal, Button } from 'react-bootstrap'
import { FaExclamationTriangle } from 'react-icons/fa'

interface ViolationAlertProps {
  show: boolean
  count: number
  maxViolations: number
  onClose: () => void
}

const ViolationAlert: React.FC<ViolationAlertProps> = ({
  show,
  count,
  maxViolations,
  onClose,
}) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [show, onClose])
  
  return (
    <Modal show={show} centered backdrop={false} keyboard={false} className="violation-alert">
      <Modal.Body className="text-center">
        <FaExclamationTriangle className="violation-icon" />
        <h5 className="mt-3">⚠️ Proctoring Violation Detected</h5>
        <p>Tab switching / Alt+Tab is not allowed during the assessment.</p>
        <p className="violation-count">
          Violation {count} / {maxViolations}
        </p>
        {count >= maxViolations && (
          <p className="text-warning">
            ⚠️ Maximum violations reached. Assessment will auto-submit on next violation.
          </p>
        )}
        <Button variant="danger" onClick={onClose} className="mt-2">
          I Understand
        </Button>
      </Modal.Body>
      
      <style>{`
        .violation-alert .modal-content {
          background: #1a1a2e;
          border: 2px solid #ff6b6b;
          border-radius: 12px;
        }
        
        .violation-icon {
          font-size: 3rem;
          color: #ff6b6b;
        }
        
        .violation-count {
          font-size: 1.1rem;
          font-weight: bold;
          color: #ff6b6b;
        }
        
        .violation-alert .modal-dialog {
          margin-top: 20vh;
        }
      `}</style>
    </Modal>
  )
}

export default ViolationAlert