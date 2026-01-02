import { useEffect, useState } from 'react'
import { Table, Modal, Button, Image } from 'react-bootstrap'
import { FaAngleLeft, FaAngleRight, FaPlay } from 'react-icons/fa'

const MockInterviewVideos = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [videos, setVideos] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

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

  const extractYouTubeID = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu.be\/)([^&]+)/)
    return match ? match[1] : null
  }

  const indexOfLast = currentPage * itemsPerPage
  const indexOfFirst = indexOfLast - itemsPerPage
  const currentVideos = videos.slice(indexOfFirst, indexOfLast)

  const totalPages = Math.ceil(videos.length / itemsPerPage)

  return (
    <div className="card border">
      <div className="card-header border-bottom">
        <h5 className="mb-0">Mock Interview Videos</h5>
      </div>
      <div className="card-body p-1">
        <Table hover responsive className="mb-0">
          <thead className="table-dark">
            <tr>
              <th>Preview</th>
              <th className="text-center">Title</th>
              <th className="text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            {currentVideos.map((vid) => (
              <tr key={vid._id}>
                <td style={{ width: 120 }}>
                  {vid.type === 'url' ? (
                    <Image
                      src={`https://img.youtube.com/vi/${extractYouTubeID(vid.video)}/mqdefault.jpg`}
                      width={100}
                      className="rounded"
                    />
                  ) : (
                    // ✅ Use direct S3 video URL
                    <video
                      width="100"
                      height="60"
                      src={vid.video}
                      className="rounded"
                    />
                  )}
                </td>
                <td className="align-middle text-center">
                  <strong>{vid.description}</strong>
                </td>
                <td className="text-end align-middle">
                  <Button variant="primary" onClick={() => handleVideoClick(vid)}>
                    <FaPlay className="me-1" /> Play
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        {/* Pagination */}
        <div className="d-sm-flex justify-content-sm-between align-items-sm-center mt-5 pt-2">
          <p className="mb-0 text-start ms-3">Showing {currentVideos.length} entries</p>
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
                <li key={idx} className={`page-item ${currentPage === idx + 1 ? 'active' : ''}`}>
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
      </div>

      {/* Modal for video playback */}
      <Modal show={showModal} onHide={handleClose} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Video Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {selectedVideo?.type === 'url' ? (
            <iframe
              width="100%"
              height="600"
              src={`https://www.youtube.com/embed/${extractYouTubeID(selectedVideo.video)}`}
              title="YouTube video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded"
            ></iframe>
          ) : (
            <video
              src={selectedVideo?.video} // ✅ Use direct S3 URL
              controls
              width="100%"
              height="600"
              autoPlay
              className="w-200 rounded"
              style={{ maxHeight: '600px' }}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default MockInterviewVideos
