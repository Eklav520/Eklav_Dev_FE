import { useState } from 'react'
import { Button, Col, Modal, ModalBody, ModalFooter, ModalHeader } from 'react-bootstrap'
import { BsPlusCircle, BsXLg } from 'react-icons/bs'

const AddVideos = ({ onAddVideo }: { onAddVideo: (vid: { file: File, description: string }) => void }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [videos, setVideos] = useState<File | null>(null)
  const [description, setDescription] = useState('')

  const toggle = () => setIsOpen(!isOpen)

  const handleSave = () => {
    if (videos && description.trim()) {
      onAddVideo({ file: videos, description })  // ✅ FIXED: use `file` instead of `videos`
      setVideos(null)
      setDescription('')
      toggle()
    }
  }

  return (
    <>
      <Button variant="primary-soft" size="sm" onClick={toggle}>
        <BsPlusCircle className="me-2" />
        Add Video
      </Button>

      <Modal show={isOpen} onHide={toggle}>
        <ModalHeader className="bg-dark">
          <h5 className="modal-title text-white">Add Video</h5>
          <button type="button" className="btn btn-sm btn-light mb-0 ms-auto" onClick={toggle}>
            <BsXLg />
          </button>
        </ModalHeader>

        <ModalBody>
          <form className="row text-start g-3">
            <Col xs={12}>
              <label className="form-label">Video File</label>
              <input
                type="file"
                className="form-control"
                accept="video/mp4,video/webm,video/ogg"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) setVideos(file)
                }}
              />
            </Col>
            <Col xs={12}>
              <label className="form-label mt-3">Description</label>
              <textarea
                className="form-control"
                rows={4}
                placeholder="Enter a description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Col>
          </form>
        </ModalBody>

        <ModalFooter>
          <button className="btn btn-danger-soft" onClick={toggle}>
            Close
          </button>
          <button className="btn btn-success" onClick={handleSave}>
            Save Video
          </button>
        </ModalFooter>
      </Modal>
    </>
  )
}

export default AddVideos
