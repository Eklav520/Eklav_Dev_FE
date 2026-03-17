import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Card, Button, Form, Table, Modal, Spinner, Alert } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'

type Student = {
  _id: string
  name: string
  email: string
  phoneNo?: string
}

const InstituteAdmin: React.FC = () => {

  const { user } = useAuthContext()
  const token = user?.token
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [students, setStudents] = useState<Student[]>([])
  const [instituteId, setInstituteId] = useState<string | null>(null)

  const [showModal, setShowModal] = useState(false)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneNo: '',
    password: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ============================
     FETCH PROFILE (GET INSTITUTE)
  ============================ */
  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${baseURL}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setInstituteId(res.data.instituteId)

    } catch (err) {
      console.error("Profile fetch failed", err)
    }
  }

  /* ============================
     FETCH STUDENTS
  ============================ */
  const fetchStudents = async () => {
    if (!token) return

    try {
      setLoading(true)

      const res = await axios.get(`${baseURL}/api/institute/students`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setStudents(res.data?.students || [])

    } catch (err) {
      console.error(err)
      setError("Failed to fetch students")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      fetchProfile()
      fetchStudents()
    }
  }, [token])

  /* ============================
     CREATE STUDENT
  ============================ */
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await axios.post(
        `${baseURL}/api/institute/createStudent`,
        {
          ...form,
          instituteId
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      alert("Student created successfully")

      setForm({
        name: '',
        email: '',
        phoneNo: '',
        password: ''
      })

      setShowModal(false)
      fetchStudents()

    } catch (err: any) {
      console.error(err)
      alert(err?.response?.data?.message || "Failed to create student")
    }
  }

  /* ============================
     DELETE STUDENT
  ============================ */
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete student?")) return

    try {
      await axios.delete(
        `${baseURL}/api/institute/deleteStudent/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      fetchStudents()

    } catch (err) {
      console.error(err)
      alert("Delete failed")
    }
  }

  return (
    <Card className="p-4 shadow-sm border-0">

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-semibold">🎓 Student Management</h4>

        <Button onClick={() => setShowModal(true)}>
          ➕ Add Student
        </Button>
      </div>

      {loading && <Spinner animation="border" />}
      {error && <Alert variant="danger">{error}</Alert>}

      <Table bordered hover responsive>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {students.map((stu) => (
            <tr key={stu._id}>
              <td>{stu.name}</td>
              <td>{stu.email}</td>
              <td>{stu.phoneNo || '-'}</td>

              <td>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(stu._id)}
                >
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* ================= MODAL ================= */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>

        <Modal.Header closeButton>
          <Modal.Title>Create Student</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form onSubmit={handleCreateStudent}>

            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                required
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                required
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                value={form.phoneNo}
                onChange={(e) =>
                  setForm({ ...form, phoneNo: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                required
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
              />
            </Form.Group>

            <div className="text-end">
              <Button
                variant="secondary"
                className="me-2"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>

              <Button type="submit" variant="success">
                Create Student
              </Button>
            </div>

          </Form>
        </Modal.Body>

      </Modal>

    </Card>
  )
}

export default InstituteAdmin