import { useState } from 'react'
import { Button, Col, Modal, ModalBody, ModalFooter, ModalHeader, Form } from 'react-bootstrap'
import { BsPlusCircle, BsXLg } from 'react-icons/bs'

const AddVideos = ({ onAddVideo }: { onAddVideo: (vid: { file?: File; url?: string; description: string; type: 'file' | 'url' }) => void }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [useUrl, setUseUrl] = useState(false)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [description, setDescription] = useState('')

  const toggle = () => {
    setIsOpen(!isOpen)
    setUseUrl(false)
    setVideoFile(null)
    setVideoUrl('')
    setDescription('')
  }

  const handleSave = () => {
    if (useUrl && videoUrl.trim() && description.trim()) {
      onAddVideo({ url: videoUrl.trim(), description, type: 'url' })
      toggle()
    } else if (!useUrl && videoFile && description.trim()) {
      onAddVideo({ file: videoFile, description, type: 'file' })
      toggle()
    } else {
      alert('Please provide both video and description.')
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
          <Form className="row text-start g-3">
            <Col xs={12}>
              <Form.Check
                type="switch"
                id="toggle-url"
                label="Use Video URL instead of file"
                checked={useUrl}
                onChange={() => {
                  setUseUrl(!useUrl)
                  setVideoFile(null)
                  setVideoUrl('')
                }}
              />
            </Col>

            {useUrl ? (
              <Col xs={12}>
                <Form.Label>Video URL</Form.Label>
                <Form.Control type="url" placeholder="https://example.com/video.mp4" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
              </Col>
            ) : (
              <Col xs={12}>
                <Form.Label>Video File</Form.Label>
                <Form.Control
                  type="file"
                  accept="video/mp4,video/webm,video/ogg"
                  onChange={(e) => {
                    const target = e.target as HTMLInputElement
                    setVideoFile(target.files?.[0] || null)
                  }}
                />
              </Col>
            )}

            <Col xs={12}>
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter a description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Col>
          </Form>
        </ModalBody>

        <ModalFooter>
          <Button variant="danger-soft" onClick={toggle}>
            Close
          </Button>
          <Button variant="success" onClick={handleSave}>
            Save Video
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}

export default AddVideos
