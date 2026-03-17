import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Button, Card, Container, Row, Col, Spinner, Alert, Table } from 'react-bootstrap'
import { useNavigate } from "react-router-dom";


type Challenge = {
  _id: string
  eventId: string
  title: string
  slug: string
  description: string
  timeLimitSeconds: number
  maxScore: number
  createdAt: string
}

type Props = {
  eventId: string
  baseURL: string // e.g. import.meta.env.VITE_API_BASE_URL or NEXT_PUBLIC_API_BASE_URL
}

export default function AdminManageChallenges({ eventId, baseURL }: Props) {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null)
  const navigate = useNavigate();


  async function fetchChallenges() {
    setLoading(true)
    try {
      // ensure baseURL already contains trailing /api if needed, or adjust accordingly
      const res = await axios.get(`${baseURL}/api/events/${eventId}/codechallenges`)
      setChallenges(res.data)
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.error || 'Failed to fetch challenges',
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Are you sure you want to delete this challenge?')) return

    try {
      await axios.delete(`${baseURL}/api/codechallenges/${id}`)
      setChallenges((prev) => prev.filter((c) => c._id !== id))
      setMessage({ type: 'success', text: 'Challenge deleted successfully' })
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.response?.data?.error || 'Failed to delete challenge',
      })
    }
  }

  useEffect(() => {
    fetchChallenges()
  }, [eventId])

  return (
    <Container className="my-4">
      <h2 className="mb-3">Manage Challenges</h2>

      {message && <Alert variant={message.type === 'error' ? 'danger' : 'success'}>{message.text}</Alert>}
      <Card className="p-3 bg-dark border-0">
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          ) : challenges.length === 0 ? (
            <Alert variant="info">No challenges found for this event.</Alert>
          ) : (
            <Table striped bordered hover responsive className="align-middle">
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Title</th>
                  <th style={{ width: '35%' }}>Slug</th>
                  <th style={{ width: '10%' }}>Max Score</th>
                  <th style={{ width: '10%' }}>Created</th>
                  <th style={{ width: '10%' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {challenges.map((ch) => (
                  <tr key={ch._id}>
                    <td style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{ch.title}</td>
                    <td style={{ whiteSpace: 'normal', wordBreak: 'break-word', color: '#9AA0A6' }}>{ch.slug}</td>
                    <td className="text-center">{ch.maxScore}</td>
                    <td className="text-center">{new Date(ch.createdAt).toLocaleDateString()}</td>
                    <td className="text-nowrap">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate(`/instructor/challenges/${ch._id}`)} // use navigate instead of href
                        className="me-2">
                        View / Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(ch._id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  )
}
