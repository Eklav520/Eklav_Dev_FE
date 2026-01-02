import PageMetaData from '@/components/PageMetaData'
import { useEffect, useState } from 'react'
import { Button, Card, Modal, Row, Col, Form, InputGroup, CardHeader } from 'react-bootstrap'
import { FaPlay, FaSearch, FaAngleLeft, FaAngleRight, FaClock } from 'react-icons/fa'

interface Video {
  _id: string
  description: string
  video: string // this is already a full S3 URL
}

const MarketingCourse = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [videos, setVideos] = useState<Video[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [showModal, setShowModal] = useState(false)

  const itemsPerPage = 5

  useEffect(() => {
    fetchVideos()
  }, [])

  const fetchVideos = async () => {
    try {
      const res = await fetch(`${baseURL}/communicationSkills/videos`)
      const data = await res.json()
      setVideos(data)
    } catch (err) {
      console.error('Failed to fetch videos:', err)
    }
  }

  const handlePlay = (video: Video) => {
    setSelectedVideo(video)
    setShowModal(true)
  }

  const filteredVideos = videos.filter((video) =>
    video.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalPages = Math.ceil(filteredVideos.length / itemsPerPage)
  const currentVideos = filteredVideos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <>
      <Card className="bg-transparent border rounded-4">
        <CardHeader className="bg-transparent border-bottom">
          <Row className="align-items-center">
            <Col md={6}>
              <h4>Communication Skills Videos</h4>
            </Col>
            <Col md={6}>
              <Form className="d-flex">
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder="Search by title"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1)
                    }}
                  />
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                </InputGroup>
              </Form>
            </Col>
          </Row>
        </CardHeader>
        <Row xs={1} sm={2} md={3} lg={4} className="gy-4 gx-4 px-3 pt-3">
          {currentVideos.map((video) => (
            <Col key={video._id}>
              <Card className="shadow-sm border-0 h-100 bg-dark text-white d-flex flex-column">
                {/* ✅ use video.video directly (S3 URL) */}
                <video
                  src={video.video}
                  width="100%"
                  height="180"
                  muted
                  autoPlay
                  loop
                  style={{
                    objectFit: 'cover',
                    borderTopLeftRadius: '0.5rem',
                    borderTopRightRadius: '0.5rem',
                  }}
                />

                <Card.Body className="d-flex flex-column justify-content-between flex-grow-1">
                  <div>
                    <Card.Title
                      className="fw-semibold text-truncate text-body"
                      title={video.description}
                    >
                      Title : {video.description || 'No description provided.'}
                    </Card.Title>
                  </div>
                </Card.Body>

                <Card.Footer className="border-0 bg-transparent d-flex justify-content-between align-items-center">
                  {/* <div className="small text-secondary">
                    <FaClock className="me-1 text-primary" />
                    ~1 min
                  </div> */}
                  <Button variant="primary" size="sm" onClick={() => handlePlay(video)}>
                    <FaPlay className="me-1" />
                    Play
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Pagination */}
        <div className="d-sm-flex justify-content-sm-between align-items-sm-center mt-5 pt-2">
          <p className="mb-0 text-start ms-3">Showing {filteredVideos.length} entries</p>
          <nav aria-label="Page navigation">
            <ul className="pagination pagination-sm pagination-primary-soft d-inline-block d-md-flex rounded mb-0">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <FaAngleLeft className="icons-center" />
                </button>
              </li>

              {[...Array(totalPages)].map((_, idx) => (
                <li
                  key={idx}
                  className={`page-item ${currentPage === idx + 1 ? 'active' : ''}`}
                >
                  <button className="page-link" onClick={() => setCurrentPage(idx + 1)}>
                    {idx + 1}
                  </button>
                </li>
              ))}

              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <FaAngleRight className="icons-center" />
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </Card>

      {/* Modal for video playback */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>{selectedVideo?.description}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {selectedVideo && (
            <video
              src={selectedVideo.video} // ✅ use direct S3 URL
              controls
              autoPlay
              className="w-100 rounded"
              style={{ maxHeight: '800px' }}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default MarketingCourse
