import { useEffect, useState } from 'react'
import { Card, CardBody, CardHeader, CardTitle, Col, Row, Modal, Button } from 'react-bootstrap'

const MockInterviewVideos = () => {
  const [videos, setVideos] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const res = await fetch(`${baseURL}/mock/videos`)
      const data = await res.json()
      setVideos(data)
    } catch (err) {
      console.error('Failed to fetch videos:', err)
    }
  }

  const handleVideoClick = (video: any) => {
    setSelectedVideo(video)
    setShowModal(true)
  }

  const handleClose = () => {
    setShowModal(false)
    setSelectedVideo(null)
  }

  return (
    <Card className="border">
      <CardHeader className="border-bottom">
        <Row className="g-4 align-items-center">
          <Col md={10}>
            <CardTitle as="h3" className="mb-0">
              <h5>Mock Interview Videos</h5>
            </CardTitle>
          </Col>
        </Row>
      </CardHeader>

      <CardBody>
        <Row className="g-3">
          {videos.map((vid) => (
            <Col key={vid._id} xs={12} md={4}>
              <div
                className="border rounded p-2 h-100 d-flex flex-column align-items-center text-center shadow-sm cursor-pointer"
                onClick={() => handleVideoClick(vid)}
                style={{ cursor: 'pointer' }}>
                <video className="mb-2 rounded" src={`${baseURL}/uploads/${vid.video}`} controls autoPlay />
                <h6 className="mb-2 small text-truncate" title={vid.description}>
                  {vid.description}
                </h6>
              </div>
            </Col>
          ))}
        </Row>
      </CardBody>

      {/* Modal for video playback */}
      <Modal show={showModal} onHide={handleClose} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Video Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {selectedVideo && (
            <video
              src={`${baseURL}/uploads/${selectedVideo.video}`}
              controls
              autoPlay
              className="w-100 rounded"
              style={{ maxHeight: '500px' }}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  )
}

export default MockInterviewVideos
