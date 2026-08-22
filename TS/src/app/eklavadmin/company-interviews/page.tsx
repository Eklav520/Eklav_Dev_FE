import { useState, useEffect, useCallback } from 'react'
import { Card, Button, Table, Badge, Spinner, Form, InputGroup } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import Step1 from './components/Step1'
import Step2 from './components/Step2'
import { useAuthContext } from '@/context/useAuthContext'
import { FaEdit, FaTrash, FaPlus, FaSearch, FaBuilding } from 'react-icons/fa'

const emptyForm = {
  companyName: '',
  title: '',
  logoUrl: '',
  role: '',
  package: '',
  location: '',
  description: '',
  rounds: [] as any[],
}

const CompanyInterview = () => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  // ── View state ──────────────────────────────────────────────
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editId, setEditId] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<any>(emptyForm)

  // ── List state ───────────────────────────────────────────────
  const [companies, setCompanies] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)

  // ── Fetch list ───────────────────────────────────────────────
  const fetchCompanies = useCallback(async (p = 1, q = '') => {
    setLoading(true)
    try {
      const res = await fetch(
        `${baseURL}/api/company-interview/?page=${p}&limit=10&search=${encodeURIComponent(q)}`,
        { headers: { Authorization: `Bearer ${user?.token}` } }
      )
      const data = await res.json()
      if (data.success) {
        setCompanies(data.data)
        setPagination(data.pagination)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [baseURL, user?.token])

  useEffect(() => {
    if (view === 'list') fetchCompanies(page, search)
  }, [view, page])

  // ── Open create form ─────────────────────────────────────────
  const handleCreate = () => {
    setEditId(null)
    setFormData(emptyForm)
    setStep(1)
    setView('form')
  }

  // ── Open edit form ───────────────────────────────────────────
  const handleEdit = async (id: string) => {
    try {
      const res = await fetch(`${baseURL}/api/company-interview/${id}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      const data = await res.json()
      if (!data.success) { alert('Failed to load company'); return }

      const c = data.data
      setFormData({
        companyName: c.companyName || '',
        title: c.title || '',
        logoUrl: c.logoUrl || '',
        role: c.role || '',
        package: c.package || '',
        location: c.location || '',
        description: c.description || '',
        rounds: (c.rounds || []).map((r: any) => ({
          roundName: r.roundName,
          roundType: r.roundType,
          duration: r.duration || '',
          questionCount: r.questionCount || '',
          order: r.order,
          questions: r.questions || [],
        })),
      })
      setEditId(id)
      setStep(1)
      setView('form')
    } catch (e) {
      alert('Failed to load company data')
    }
  }

  // ── Delete ───────────────────────────────────────────────────
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`${baseURL}/api/company-interview/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user?.token}` },
      })
      const data = await res.json()
      if (data.success) fetchCompanies(page, search)
      else alert(data.error || 'Delete failed')
    } catch (e) {
      alert('Server error')
    }
  }

  // ── Step navigation ──────────────────────────────────────────
  const handleNext = () => {
    if (step === 1) {
      if (!formData.companyName) { alert('Please enter company name'); return }
      if (!formData.rounds.length) { alert('Please select at least one round'); return }
    }
    setStep((p) => p + 1)
  }

  const handlePrev = () => setStep((p) => p - 1)

  // ── Submit (create or update) ────────────────────────────────
  const handleSubmit = async () => {
    try {
      if (!user?.token) { alert('Unauthorized'); return }

      const isValid = formData.rounds.every((r: any) => r.questions && r.questions.length > 0)
      if (!isValid) { alert('Please upload questions for all rounds'); return }

      const payload = {
        ...formData,
        rounds: formData.rounds.map((r: any) => ({
          ...r,
          duration: Number(r.duration) || 0,
          questionCount: Number(r.questionCount) || 0,
          questions: r.questions || [],
        })),
      }

      const url = editId
        ? `${baseURL}/api/company-interview/${editId}`
        : `${baseURL}/api/company-interview/create`

      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (data.success) {
        alert(editId ? '✅ Company Interview Updated' : '✅ Company Interview Created')
        setView('list')
        setEditId(null)
        setFormData(emptyForm)
        setStep(1)
        fetchCompanies(1, '')
        setPage(1)
        setSearch('')
      } else {
        alert(data.error || 'Failed')
      }
    } catch (e) {
      console.error(e)
      alert('Server Error')
    }
  }

  // ── Render list ──────────────────────────────────────────────
  if (view === 'list') {
    return (
      <>
        <PageMetaData title="Company Interviews" />

        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0 d-flex align-items-center gap-2">
            <FaBuilding /> Company Interviews
          </h5>
          <Button variant="primary" size="sm" onClick={handleCreate}>
            <FaPlus className="me-1" /> Add New
          </Button>
        </div>

        {/* Search */}
        <Card className="mb-3 border-0 bg-transparent">
          <InputGroup>
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control
              placeholder="Search by company or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); fetchCompanies(1, search) } }}
            />
            <Button variant="outline-secondary" onClick={() => { setPage(1); fetchCompanies(1, search) }}>
              Search
            </Button>
          </InputGroup>
        </Card>

        <Card className="border rounded-4">
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : companies.length === 0 ? (
              <div className="text-center py-5 text-muted">No companies found.</div>
            ) : (
              <Table hover responsive className="mb-0">
                <thead className="table-dark">
                  <tr>
                    <th>#</th>
                    <th>Logo</th>
                    <th>Company</th>
                    <th>Title</th>
                    <th>Role</th>
                    <th>Package</th>
                    <th>Location</th>
                    <th>Rounds</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c, i) => (
                    <tr key={c._id}>
                      <td>{(page - 1) * 10 + i + 1}</td>
                      <td>
                        {c.logoUrl ? (
                          <img
                            src={c.logoUrl}
                            alt={c.companyName}
                            style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6, background: '#fff', border: '1px solid #dee2e6' }}
                          />
                        ) : (
                          <div
                            style={{ width: 36, height: 36, borderRadius: 6, background: '#f1f3f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <FaBuilding className="text-muted" />
                          </div>
                        )}
                      </td>
                      <td><strong>{c.companyName}</strong></td>
                      <td>{c.title || '—'}</td>
                      <td>{c.role || '—'}</td>
                      <td>{c.package || '—'}</td>
                      <td>{c.location || '—'}</td>
                      <td>
                        <Badge bg="info">{c.roundsCount || 0} rounds</Badge>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEdit(c._id)}
                        >
                          <FaEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(c._id, c.companyName)}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <Card.Footer className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                Showing {companies.length} of {pagination.total}
              </small>
              <div className="d-flex gap-2">
                <Button
                  size="sm" variant="outline-secondary"
                  disabled={page <= 1}
                  onClick={() => { setPage(p => p - 1); fetchCompanies(page - 1, search) }}
                >
                  Previous
                </Button>
                <span className="align-self-center small">Page {page} / {pagination.pages}</span>
                <Button
                  size="sm" variant="outline-secondary"
                  disabled={page >= pagination.pages}
                  onClick={() => { setPage(p => p + 1); fetchCompanies(page + 1, search) }}
                >
                  Next
                </Button>
              </div>
            </Card.Footer>
          )}
        </Card>
      </>
    )
  }

  // ── Render form ──────────────────────────────────────────────
  return (
    <>
      <PageMetaData title={editId ? 'Edit Company Interview' : 'Create Company Interview'} />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">
          {editId ? '✏️ Edit Company Interview' : '➕ New Company Interview'}
        </h5>
        <Button variant="outline-secondary" size="sm" onClick={() => { setView('list'); setEditId(null); setFormData(emptyForm); setStep(1) }}>
          ← Back to List
        </Button>
      </div>

      <Card className="bg-transparent border rounded-4 p-3">
        <div className="mb-3">
          <h6 className="text-muted">Step {step} of 2</h6>
        </div>

        {step === 1 && <Step1 formData={formData} setFormData={setFormData} />}
        {step === 2 && <Step2 formData={formData} setFormData={setFormData} />}

        <div className="d-flex justify-content-between mt-4">
          {step > 1 && (
            <Button variant="secondary" onClick={handlePrev}>Previous</Button>
          )}
          {step < 2 && (
            <Button variant="primary" onClick={handleNext}>Next</Button>
          )}
          {step === 2 && (
            <Button variant="success" onClick={handleSubmit}>
              {editId ? 'Update' : 'Submit'}
            </Button>
          )}
        </div>
      </Card>
    </>
  )
}

export default CompanyInterview
