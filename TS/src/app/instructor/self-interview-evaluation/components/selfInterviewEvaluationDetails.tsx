import React, { useEffect, useState } from 'react'
import { Card, Col, Collapse, Container, Modal, Pagination, Row, Spinner, Button } from 'react-bootstrap'

interface Response {
  question: string
  answer: string
  feedback: string
  rating: number
  idealAnswer: string
}

interface Interview {
  _id: string
  userId: string
  topic: string
  videoPath: string
  startedAt: string
  completedAt: string
  responses?: Response[]
}

interface Student {
  _id: string
  fullName: string
  profileImage: string
}

export default function SelfInterviewEvaluation() {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [students, setStudents] = useState<Student[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [groupedData, setGroupedData] = useState<Record<string, Record<string, Interview[]>>>({})
  const [openStudents, setOpenStudents] = useState<Record<string, boolean>>({})
  const [openTopics, setOpenTopics] = useState<Record<string, boolean>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)

  // For modal popup
  const [showModal, setShowModal] = useState(false)
  const [modalVideoURL, setModalVideoURL] = useState<string | null>(null)

  const itemsPerPage = 5

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [studentsRes, interviewsRes] = await Promise.all([
          fetch(`${baseURL}/adminProfiles`),
          fetch(`${baseURL}/admin/all-self-interviews`),
        ])

        if (!studentsRes.ok || !interviewsRes.ok) throw new Error('Fetch failed')

        const studentsData: Student[] = await studentsRes.json()
        const interviewData: Interview[] = await interviewsRes.json()

        setStudents(studentsData)
        setInterviews(interviewData)

        const grouped: Record<string, Record<string, Interview[]>> = {}

        interviewData.forEach((interview) => {
          const userId = interview.userId
          const topic = interview.topic

          if (!grouped[userId]) grouped[userId] = {}
          if (!grouped[userId][topic]) grouped[userId][topic] = []

          grouped[userId][topic].push(interview)
        })

        setGroupedData(grouped)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching data', err)
        setLoading(false)
      }
    }

    fetchAllData()
  }, [])

  const toggleStudent = (id: string) => {
    setOpenStudents((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleTopic = (userId: string, topic: string) => {
    const key = `${userId}-${topic}`
    setOpenTopics((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const getStudentName = (id: string) => {
    return students.find((s) => s._id === id)?.fullName || 'Unknown Student'
  }

  const openVideoModal = (url: string) => {
    setModalVideoURL(url)
    setShowModal(true)
  }

  const closeVideoModal = () => {
    setShowModal(false)
    setModalVideoURL(null)
  }

  const renderStars = (avg: number) => {
    const stars = []
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} style={{ color: i <= avg ? '#ffc107' : '#e4e5e9', fontSize: '1.2rem' }}>
          ★
        </span>,
      )
    }
    return stars
  }

  const getAverageRating = (responses?: Response[]) => {
    if (!responses || responses.length === 0) return 0
    const total = responses.reduce((sum, r) => sum + (r.rating || 0), 0)
    return total / responses.length
  }

  const userIds = Object.keys(groupedData)
  const totalPages = Math.ceil(userIds.length / itemsPerPage)
  const paginatedUserIds = userIds.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <Container className="py-4">
      <h3 className="mb-4">📁 Self Interview Evaluations</h3>

      {loading ? (
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <>
          {paginatedUserIds.map((userId) => (
            <Card className="mb-3" key={userId}>
              <Card.Header style={{ cursor: 'pointer', backgroundColor: '#e9f2fc' }} onClick={() => toggleStudent(userId)}>
                📁 {getStudentName(userId)}
              </Card.Header>

              <Collapse in={openStudents[userId]}>
                <div>
                  {Object.entries(groupedData[userId]).map(([topic, vids]) => (
                    <Card className="ms-4 mt-2 mb-3" key={topic}>
                      <Card.Header style={{ cursor: 'pointer', backgroundColor: '#f0f8e9' }} onClick={() => toggleTopic(userId, topic)}>
                        📚 {topic}
                      </Card.Header>

                      <Collapse in={openTopics[`${userId}-${topic}`]}>
                        <div>
                          <Row className="p-3">
                            {vids.map((vid) => {
                              const avgRating = getAverageRating(vid.responses)
                              // Normalize video path
                              let rawPath = vid.videoPath || ''
                              rawPath = rawPath.replace(/\\/g, '/') // Windows fix
                              rawPath = rawPath.replace(/\/?db\//, '') // Remove db/

                              const videoURL = `${baseURL}/${rawPath}`
                              console.log('Resolved Video Path:', videoURL)

                              return (
                                <Col md={4} key={vid._id}>
                                  <Card className="mb-3">
                                    <Card.Body>
                                      {vid.videoPath ? (
                                        <video controls style={{ width: '100%' }}>
                                          <source src={videoURL} type="video/webm" />
                                          Your browser does not support the video tag.
                                        </video>
                                      ) : (
                                        <p className="text-danger">No video available</p>
                                      )}

                                      <p className="mt-2 small text-muted">
                                        Started: {vid.startedAt ? new Date(vid.startedAt).toLocaleString() : 'N/A'} <br />
                                        Completed: {vid.completedAt ? new Date(vid.completedAt).toLocaleString() : 'N/A'}
                                      </p>

                                      {vid.responses && vid.responses.length > 0 && (
                                        <div className="mt-2">
                                          <strong>Avg Rating:</strong> {avgRating.toFixed(1)} &nbsp;
                                          {renderStars(avgRating)}
                                        </div>
                                      )}
                                    </Card.Body>
                                  </Card>
                                </Col>
                              )
                            })}
                          </Row>
                        </div>
                      </Collapse>
                    </Card>
                  ))}
                </div>
              </Collapse>
            </Card>
          ))}

          {totalPages > 1 && (
            <Pagination className="justify-content-center mt-4">
              <Pagination.Prev disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} />
              {Array.from({ length: totalPages }, (_, idx) => (
                <Pagination.Item key={idx + 1} active={idx + 1 === currentPage} onClick={() => setCurrentPage(idx + 1)}>
                  {idx + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} />
            </Pagination>
          )}
        </>
      )}

      {/* Video Modal */}
      <Modal show={showModal} onHide={closeVideoModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Interview Video Playback</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalVideoURL ? (
            <video controls autoPlay style={{ width: '100%' }}>
              <source src={modalVideoURL} type="video/webm" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <p>No video selected.</p>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  )
}
