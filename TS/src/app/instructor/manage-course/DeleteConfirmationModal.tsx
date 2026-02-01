// components/course/DeleteConfirmationModal.tsx
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap'
import { FaExclamationTriangle, FaTrash } from 'react-icons/fa'
import { useState } from 'react'

interface Course {
  _id: string
  title: string
}

interface DeleteConfirmationModalProps {
  show: boolean
  onHide: () => void
  courseToDelete: Course | null
  onDelete: () => void
  isDeleting: boolean
}

const DeleteConfirmationModal = ({
  show,
  onHide,
  courseToDelete,
  onDelete,
  isDeleting
}: DeleteConfirmationModalProps) => {
  const [confirmText, setConfirmText] = useState('')
  
  const handleConfirmTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmText(e.target.value)
  }

  const handleClose = () => {
    setConfirmText('')
    onHide()
  }

  const handleDeleteClick = () => {
    onDelete()
    setConfirmText('')
  }

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton className="bg-danger text-white">
        <Modal.Title>
          <FaExclamationTriangle className="me-2" />
          Confirm Deletion
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="danger">
          <h5>Warning: This action cannot be undone!</h5>
          <p className="mb-0">
            Are you sure you want to delete <strong>{courseToDelete?.title}</strong>? 
            All associated videos, FAQs, and student data will be permanently removed.
          </p>
        </Alert>
        <p className="text-muted">Type "DELETE" to confirm:</p>
        <Form.Control 
          type="text" 
          placeholder="Type DELETE here" 
          value={confirmText}
          onChange={handleConfirmTextChange}
          autoComplete="off"
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button 
          variant="danger" 
          onClick={handleDeleteClick}
          disabled={isDeleting || confirmText !== 'DELETE'}
        >
          {isDeleting ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Deleting...
            </>
          ) : (
            <>
              <FaTrash className="me-2" />
              Delete Permanently
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default DeleteConfirmationModal