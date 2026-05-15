import { useEffect, useState } from 'react'
import { Modal, Spinner, Form, Alert } from 'react-bootstrap'
import { FaBuilding, FaGlobe, FaLock, FaUnlock } from 'react-icons/fa'
import { useAuthContext } from '@/context/useAuthContext'

interface Institute {
  _id: string
  name: string
  domain: string
  slug: string
  status: 'active' | 'inactive'
  logo?: string
}

interface Course {
  _id: string
  title: string
  allowedInstitutes?: string[]
}

interface Props {
  show: boolean
  course: Course | null
  onHide: () => void
  onUpdated: (courseId: string, allowedInstitutes: string[]) => void
}

const InstituteAccessModal = ({ show, course, onHide, onUpdated }: Props) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [institutes, setInstitutes]     = useState<Institute[]>([])
  const [allowed, setAllowed]           = useState<Set<string>>(new Set())
  const [loading, setLoading]           = useState(false)
  const [toggling, setToggling]         = useState<string | null>(null)
  const [error, setError]               = useState('')
  const [search, setSearch]             = useState('')

  useEffect(() => {
    if (!show) return
    setError('')
    setSearch('')

    // Seed current allowed list from course prop
    setAllowed(new Set(course?.allowedInstitutes ?? []))

    setLoading(true)
    fetch(`${baseURL}/api/institute/institutes`, {
      headers: { Authorization: `Bearer ${user?.token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setInstitutes(data.institutes || [])
      })
      .catch(() => setError('Failed to load institutes'))
      .finally(() => setLoading(false))
  }, [show, course?._id])

  const toggle = async (institute: Institute) => {
    if (!course) return
    const isGranted = allowed.has(institute._id)
    const action = isGranted ? 'revoke' : 'grant'

    setToggling(institute._id)
    try {
      const res = await fetch(`${baseURL}/courses/${course._id}/institute-access`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ action, instituteId: institute._id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed')

      const newAllowed = new Set(data.allowedInstitutes as string[])
      setAllowed(newAllowed)
      onUpdated(course._id, data.allowedInstitutes)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setToggling(null)
    }
  }

  const filtered = institutes.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.domain.toLowerCase().includes(search.toLowerCase())
  )

  const grantedCount = filtered.filter((i) => allowed.has(i._id)).length

  return (
    <Modal show={show} onHide={onHide} size="lg" contentClassName="bg-dark text-white" centered>
      <Modal.Header closeButton closeVariant="white" style={{ borderColor: '#2a2a2a' }}>
        <Modal.Title style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaBuilding style={{ color: '#ff7a00' }} />
          Institute Access
          {course && (
            <span style={{ color: '#ff7a00', fontWeight: 700, marginLeft: 4 }}>— {course.title}</span>
          )}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ padding: '20px 24px' }}>

        {/* Info banner */}
        <div
          style={{
            background: 'rgba(255,122,0,0.07)', border: '1px solid rgba(255,122,0,0.2)',
            borderRadius: 10, padding: '12px 16px', marginBottom: 20,
            fontSize: '0.82rem', color: '#ccc', display: 'flex', gap: 10, alignItems: 'flex-start',
          }}
        >
          <FaGlobe style={{ color: '#ff7a00', marginTop: 2, flexShrink: 0 }} />
          <div>
            Toggle access per institute. Students of granted institutes can
            <strong style={{ color: '#fff' }}> see and enroll</strong> in this course from their portal.
            Changes take effect immediately.
          </div>
        </div>

        {/* Search + stats */}
        <div className="d-flex gap-3 align-items-center mb-3">
          <input
            type="search"
            placeholder="Search by name or domain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1, background: '#111', border: '1px solid #333', color: '#e2e8f0',
              borderRadius: 8, padding: '8px 12px', fontSize: '0.82rem', outline: 'none',
            }}
          />
          <div style={{ fontSize: '0.75rem', color: '#888', whiteSpace: 'nowrap' }}>
            <span style={{ color: '#22c55e', fontWeight: 700 }}>{grantedCount}</span>
            {' '}/ {filtered.length} granted
          </div>
        </div>

        {error && (
          <Alert variant="danger" className="py-2 mb-3" style={{ fontSize: '0.82rem' }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-5">
            <Spinner variant="warning" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted py-4" style={{ fontSize: '0.85rem' }}>
            {search ? 'No institutes match your search.' : 'No institutes found.'}
          </div>
        ) : (
          <div style={{ maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map((inst) => {
              const isGranted = allowed.has(inst._id)
              const isToggling = toggling === inst._id

              return (
                <div
                  key={inst._id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: isGranted ? 'rgba(34,197,94,0.06)' : '#111',
                    border: `1px solid ${isGranted ? 'rgba(34,197,94,0.25)' : '#222'}`,
                    borderRadius: 10, padding: '12px 16px',
                    transition: 'all 0.15s',
                  }}
                >
                  {/* Logo / Avatar */}
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                      background: '#1a1a1a', border: '1px solid #2a2a2a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {inst.logo ? (
                      <img src={inst.logo} alt={inst.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#ff7a00', fontWeight: 700, fontSize: '0.9rem' }}>
                        {inst.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem' }}>
                      {inst.name}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.72rem', marginTop: 2 }}>
                      {inst.domain}
                    </div>
                  </div>

                  {/* Status pill */}
                  <div
                    style={{
                      fontSize: '0.65rem', fontWeight: 700, padding: '2px 9px',
                      borderRadius: 20,
                      background: inst.status === 'active' ? 'rgba(34,197,94,0.12)' : 'rgba(107,114,128,0.12)',
                      color: inst.status === 'active' ? '#22c55e' : '#6b7280',
                      border: `1px solid ${inst.status === 'active' ? 'rgba(34,197,94,0.25)' : 'rgba(107,114,128,0.25)'}`,
                    }}
                  >
                    {inst.status}
                  </div>

                  {/* Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {isToggling ? (
                      <Spinner size="sm" variant="warning" />
                    ) : (
                      <>
                        <span style={{ fontSize: '0.72rem', color: isGranted ? '#22c55e' : '#555' }}>
                          {isGranted ? (
                            <><FaUnlock style={{ marginRight: 4 }} />Access granted</>
                          ) : (
                            <><FaLock style={{ marginRight: 4 }} />No access</>
                          )}
                        </span>
                        <Form.Check
                          type="switch"
                          checked={isGranted}
                          onChange={() => toggle(inst)}
                          style={{ transform: 'scale(1.1)' }}
                        />
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Modal.Body>

      <Modal.Footer style={{ borderColor: '#2a2a2a', justifyContent: 'flex-start' }}>
        <span style={{ fontSize: '0.75rem', color: '#666' }}>
          {allowed.size} institute{allowed.size !== 1 ? 's' : ''} have access to this course
        </span>
      </Modal.Footer>
    </Modal>
  )
}

export default InstituteAccessModal
