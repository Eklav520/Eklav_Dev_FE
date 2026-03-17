import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Card, Button, Form, Table, Modal, Spinner, Alert } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'

type Institute = {
  _id: string
  name: string
  email: string
  phone?: string
}

const InstituteAdmin: React.FC = () => {

  const { user } = useAuthContext()
  const token = user?.token

  const [institutes, setInstitutes] = useState<Institute[]>([])
  const [editing, setEditing] = useState<Institute | null>(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: ''
  })

  const [adminForm, setAdminForm] = useState({
    fullname: '',
    email: '',
    phoneNo: '',
    password: '',
    instituteId: ''
  })

  const [showModal, setShowModal] = useState(false)
  const [showAdminModal, setShowAdminModal] = useState(false)

  const [adminError, setAdminError] = useState<string | null>(null)
  const [showReset, setShowReset] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const baseURL = import.meta.env.VITE_API_BASE_URL

  const fetchInstitutes = async () => {
    if (!token) return

    try {
      setLoading(true)

      const res = await axios.get(`${baseURL}/api/institute/institutes`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setInstitutes(res.data?.institutes || [])
      setError(null)

    } catch (err) {
      console.error(err)
      setError("Failed to fetch institutes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInstitutes()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    try {

      setLoading(true)

      if (editing) {

        await axios.put(
          `${baseURL}/api/institute/updateInstitute/${editing._id}`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        )

      } else {

        await axios.post(
          `${baseURL}/api/institute/createInstitute`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        )

      }

      setForm({ name: '', email: '', phone: '' })
      setEditing(null)
      setShowModal(false)

      fetchInstitutes()

    } catch (err) {
      console.error(err)
      alert("Operation failed")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {

    if (!window.confirm("Are you sure you want to delete this institute?")) return

    try {

      await axios.delete(
        `${baseURL}/api/institute/deleteInstitute/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      fetchInstitutes()

    } catch (err) {
      console.error(err)
      alert("Delete failed")
    }
  }

  const handleEdit = (inst: Institute) => {

    setEditing(inst)

    setForm({
      name: inst.name,
      email: inst.email,
      phone: inst.phone || ''
    })

    setShowModal(true)
  }

  const openCreateAdmin = (inst: Institute) => {

    setAdminError(null)
    setShowReset(false)

    setAdminForm({
      fullname: '',
      email: '',
      phoneNo: '',
      password: '',
      instituteId: inst._id
    })

    setShowAdminModal(true)
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {

    e.preventDefault()

    try {

      setAdminError(null)

      await axios.post(
        `${baseURL}/api/institute/createAdmin`,
        adminForm,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      alert("Institute Admin Created Successfully")
      setShowAdminModal(false)

    } catch (err: any) {

      if (err?.response?.data?.message === "User already exists") {

        setAdminError("User already exists. You can reset password.")
        setShowReset(true)

      } else {

        console.error(err)
        alert("Failed to create admin")

      }
    }
  }

  const handleResetPassword = async () => {

    try {

      await axios.post(
        `${baseURL}/auth/reset-password`,
        {
          email: adminForm.email,
          newPassword: adminForm.password
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      alert("Password reset successfully")
      setShowAdminModal(false)

    } catch (err) {

      console.error(err)
      alert("Password reset failed")

    }
  }

  return (

    <Card className="p-4 shadow-sm border-0">

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-semibold">🏫 Institute Management</h4>

        <Button
          onClick={() => {
            setEditing(null)
            setForm({ name: '', email: '', phone: '' })
            setShowModal(true)
          }}
        >
          ➕ Add Institute
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

          {institutes.map((inst) => (

            <tr key={inst._id}>

              <td>{inst.name}</td>
              <td>{inst.email}</td>
              <td>{inst.phone || '-'}</td>

              <td>

                <Button
                  size="sm"
                  variant="outline-primary"
                  className="me-2"
                  onClick={() => handleEdit(inst)}
                >
                  Edit
                </Button>

                <Button
                  size="sm"
                  variant="outline-danger"
                  className="me-2"
                  onClick={() => handleDelete(inst._id)}
                >
                  Delete
                </Button>

                <Button
                  size="sm"
                  variant="outline-success"
                  onClick={() => openCreateAdmin(inst)}
                >
                  Create Admin
                </Button>

              </td>

            </tr>

          ))}

        </tbody>

      </Table>

      {/* Create Admin Modal */}

      <Modal show={showAdminModal} onHide={() => setShowAdminModal(false)} centered>

        <Modal.Header closeButton>
          <Modal.Title>Create Institute Admin</Modal.Title>
        </Modal.Header>

        <Modal.Body>

          {adminError && <Alert variant="warning">{adminError}</Alert>}

          <Form onSubmit={handleCreateAdmin}>

            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control
                required
                value={adminForm.fullname}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, fullname: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                required
                type="email"
                value={adminForm.email}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, email: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control
                value={adminForm.phoneNo}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, phoneNo: e.target.value })
                }
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                required
                type="password"
                value={adminForm.password}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, password: e.target.value })
                }
              />
            </Form.Group>

            <div className="text-end">

              {showReset && (
                <Button
                  variant="outline-warning"
                  className="me-2"
                  onClick={handleResetPassword}
                >
                  Reset Password
                </Button>
              )}

              <Button
                variant="secondary"
                className="me-2"
                onClick={() => setShowAdminModal(false)}
              >
                Cancel
              </Button>

              <Button type="submit" variant="success">
                Create Admin
              </Button>

            </div>

          </Form>

        </Modal.Body>

      </Modal>

    </Card>
  )
}

export default InstituteAdmin