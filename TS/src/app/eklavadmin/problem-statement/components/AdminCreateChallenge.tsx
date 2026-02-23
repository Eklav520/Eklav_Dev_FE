import { useAuthContext } from '@/context/useAuthContext'
import React, { useState, useEffect } from 'react'
import { Container, Form, Button, Alert, Row, Col, Table, Modal, Spinner } from 'react-bootstrap'
import ReactQuill from 'react-quill-new'
import 'quill/dist/quill.snow.css'

const AdminManageChallenges: React.FC = () => {
  const [form, setForm] = useState({
    _id: '',
    title: '',
    description: '',
    inputFormat: '',
    outputFormat: '',
    sampleInput: '',
    sampleOutput: '',
    tags: '',
    functionName: '',
    testCases: [{ input: '', expectedOutput: '' }],
  })

  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [challenges, setChallenges] = useState<any[]>([])
  const [editing, setEditing] = useState(false)
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [loading, setLoading] = useState(true)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { user } = useAuthContext()
  const token = user?.token

  const fetchChallenges = async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await fetch(`${baseURL}/admin/challenges`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setChallenges(data)
    } catch (err) {
      setStatus({ type: 'error', message: 'Failed to load challenges' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChallenges()
  }, [token])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    if (!token) return setStatus({ type: 'error', message: 'No token provided' })

    const method = editing ? 'PUT' : 'POST'
    const url = editing ? `${baseURL}/admin/challenge/${form._id}` : `${baseURL}/admin/challenge`

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...form,
        tags: form.tags.split(',').map((tag) => tag.trim()),
      }),
    })

    const data = await response.json()

    if (response.ok) {
      setStatus({ type: 'success', message: editing ? 'Challenge updated!' : 'Challenge created!' })
      setForm({
        _id: '',
        title: '',
        description: '',
        inputFormat: '',
        outputFormat: '',
        sampleInput: '',
        sampleOutput: '',
        tags: '',
        functionName: '',
        testCases: [{ input: '', expectedOutput: '' }],
      })
      setEditing(false)
      fetchChallenges()
    } else {
      setStatus({ type: 'error', message: data.error || 'Failed to save challenge.' })
    }
  }

  const handleEdit = (challenge: any) => {
    setForm({
      _id: challenge._id,
      title: challenge.title,
      description: challenge.description,
      inputFormat: challenge.inputFormat,
      outputFormat: challenge.outputFormat,
      sampleInput: challenge.sampleInput,
      sampleOutput: challenge.sampleOutput,
      tags: challenge.tags?.join(', '),
      functionName: challenge.functionName || '',
      testCases: challenge.testCases?.length ? challenge.testCases : [{ input: '', expectedOutput: '' }],
    })
    setEditing(true)
  }

  const confirmDelete = (id: string) => {
    setDeleteId(id)
    setShowConfirmDelete(true)
  }

  const handleDelete = async () => {
    if (!deleteId || !token) return

    const res = await fetch(`${baseURL}/admin/challenge/${deleteId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })

    if (res.ok) {
      setStatus({ type: 'success', message: 'Challenge deleted successfully!' })
      fetchChallenges()
    } else {
      const data = await res.json()
      setStatus({ type: 'error', message: data.error || 'Failed to delete challenge.' })
    }

    setShowConfirmDelete(false)
    setDeleteId(null)
  }

  return (
    <Container className="my-5">
      <h2 className="mb-4 text-center text-primary">Manage Daily Challenges</h2>

      {status && <Alert variant={status.type === 'success' ? 'success' : 'danger'}>{status.message}</Alert>}

      <Form>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control name="title" value={form.title} onChange={handleChange} placeholder="Enter title" />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Input Format</Form.Label>
              <Form.Control name="inputFormat" value={form.inputFormat} onChange={handleChange} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Output Format</Form.Label>
              <Form.Control name="outputFormat" value={form.outputFormat} onChange={handleChange} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Sample Input</Form.Label>
              <Form.Control name="sampleInput" value={form.sampleInput} onChange={handleChange} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Sample Output</Form.Label>
              <Form.Control name="sampleOutput" value={form.sampleOutput} onChange={handleChange} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tags</Form.Label>
              <Form.Control name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. strings, array, easy" />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Function Name</Form.Label>
              <Form.Control name="functionName" value={form.functionName} onChange={handleChange} placeholder="e.g. reverseString" />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group className="mb-5">
              <Form.Label>Description</Form.Label>
              <ReactQuill
                theme="snow"
                style={{ height: 200 }}
                value={form.description}
                onChange={(value) => setForm({ ...form, description: value })}
              />
            </Form.Group>

            <hr />
            <h5>Test Cases</h5>
            {form.testCases.map((tc, idx) => (
              <Row key={idx} className="mb-2">
                <Col md={5}>
                  <Form.Control
                    placeholder='Input (e.g. "hello")'
                    value={tc.input}
                    onChange={(e) => {
                      const updated = [...form.testCases]
                      updated[idx].input = e.target.value
                      setForm({ ...form, testCases: updated })
                    }}
                  />
                </Col>
                <Col md={5}>
                  <Form.Control
                    placeholder='Expected Output (e.g. "olleh")'
                    value={tc.expectedOutput}
                    onChange={(e) => {
                      const updated = [...form.testCases]
                      updated[idx].expectedOutput = e.target.value
                      setForm({ ...form, testCases: updated })
                    }}
                  />
                </Col>
                <Col md={2}>
                  <Button
                    variant="danger"
                    onClick={() => {
                      const updated = form.testCases.filter((_, i) => i !== idx)
                      setForm({ ...form, testCases: updated })
                    }}>
                    Remove
                  </Button>
                </Col>
              </Row>
            ))}

            <Button
              variant="secondary"
              className="mt-2"
              onClick={() => setForm({ ...form, testCases: [...form.testCases, { input: '', expectedOutput: '' }] })}>
              ➕ Add Test Case
            </Button>
          </Col>
        </Row>

        <div className="text-center mt-4">
          <Button variant={editing ? 'warning' : 'primary'} onClick={handleSubmit}>
            {editing ? 'Update Challenge' : 'Submit Challenge'}
          </Button>
        </div>
      </Form>

      <hr className="my-5" />
      <h4>Existing Challenges</h4>

      {loading ? (
        <div className="text-center my-4">
          <Spinner animation="border" />
        </div>
      ) : (
        <Table bordered hover responsive className="mt-3">
          <thead className="table-primary">
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Tags</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {challenges.map((ch, index) => (
              <tr key={ch._id}>
                <td>{index + 1}</td>
                <td>{ch.title}</td>
                <td>{ch.tags?.join(', ')}</td>
                <td>{new Date(ch.date).toLocaleDateString('en-GB')}</td>
                <td>
                  <Button size="sm" variant="info" className="me-2" onClick={() => handleEdit(ch)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => confirmDelete(ch._id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Delete Confirmation Modal */}
      <Modal show={showConfirmDelete} onHide={() => setShowConfirmDelete(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this challenge?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Yes, Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default AdminManageChallenges
