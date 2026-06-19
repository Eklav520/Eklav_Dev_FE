import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import axios from 'axios'
import { Card, Button, Form, Modal, Spinner, Alert, Badge, Row, Col } from 'react-bootstrap'
import { useAuthContext } from '@/context/useAuthContext'
import { FaBuilding, FaEnvelope, FaPhone, FaGlobe, FaEdit, FaTrash, FaPlus, FaUserPlus, FaExternalLinkAlt, FaCopy, FaCheck, FaTimes, FaSpinner, FaInfoCircle, FaSearch, FaFilter, FaUniversity, FaKey, FaUserGraduate, FaClipboardList, FaSlidersH, FaEye, FaIdCard, FaCodeBranch, FaCalendarAlt, FaVenusMars, FaPhoneAlt, FaSave } from 'react-icons/fa'
import { MdDomain, MdEmail, MdPhone, MdAdminPanelSettings, MdVerified } from 'react-icons/md'

type Institute = {
  _id: string
  name: string
  email: string
  phone?: string
  domain?: string
  dbName?: string
  navSections?: string[] | null
  adminNavSections?: string[] | null
  createdAt?: string
  updatedAt?: string
}

// All configurable student sidebar sections
const NAV_SECTION_DEFS = [
  { key: 'dashboard',      label: 'Dashboard',             alwaysOn: true },
  { key: 'englishPractice',label: 'English Practice',      alwaysOn: false },
  { key: 'selfInterview',  label: 'Self Interview with AI', alwaysOn: false },
  { key: 'courses',        label: 'Courses',               alwaysOn: false },
  { key: 'preparation',    label: 'Self Preparation',      alwaysOn: false },
  { key: 'freelancing',    label: 'Internship Tasks',      alwaysOn: false },
  { key: 'myColleges',     label: 'My Colleges',           alwaysOn: false },
  { key: 'activities',     label: 'Jobs Search',           alwaysOn: false },
  { key: 'assessment',     label: 'Final Assessment',      alwaysOn: false },
  { key: 'profile',        label: 'Update Profile',        alwaysOn: true },
]

// All configurable institute admin sidebar sections — keys must match INSTITUTEADMIN_MENU_ITEMS
const ADMIN_NAV_SECTION_DEFS = [
  { key: 'dashboard',              label: 'Dashboard',           alwaysOn: true },
  { key: 'courses',                label: 'Courses',             alwaysOn: false },
  { key: 'students',               label: 'Students',            alwaysOn: false },
  { key: 'onlineClasses',          label: 'Online Classes',      alwaysOn: false },
  { key: 'freelencing',            label: 'Internship Tasks',    alwaysOn: false },
  { key: 'jobOpenings',            label: 'Job Openings',        alwaysOn: false },
  { key: 'placements',             label: 'Placements',          alwaysOn: false },
  { key: 'collegeAssessment',      label: 'College Assessment',  alwaysOn: false },
  { key: 'finalAssessment',        label: 'Final Assessment',    alwaysOn: false },
  { key: 'instituteAnnouncements', label: 'Achievements',        alwaysOn: false },
  { key: 'facultyAdmin',           label: 'Faculty Admin',       alwaysOn: false },
  { key: 'profile',                label: 'Edit Profile',        alwaysOn: true },
]

const ALL_KEYS = NAV_SECTION_DEFS.map(s => s.key)
const ALL_ADMIN_KEYS = ADMIN_NAV_SECTION_DEFS.map(s => s.key)

// Professional Pagination Component
const InstitutePagination: React.FC<{
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}> = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    }
    return pages
  }

  return (
    <div className="institute-pagination">
      <div className="pagination-info">
        <FaInfoCircle className="me-1" size={12} />
        Page {currentPage} of {totalPages}
      </div>
      <div className="pagination-controls">
        <button className="pagination-btn" onClick={() => onPageChange(1)} disabled={currentPage === 1}>«</button>
        <button className="pagination-btn" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>‹</button>
        {getPageNumbers().map((page, idx) => (
          page === '...' ? <span key={`dots-${idx}`} className="pagination-dots">...</span> :
          <button key={idx} className={`pagination-btn ${currentPage === page ? 'active' : ''}`} onClick={() => onPageChange(page as number)}>{page}</button>
        ))}
        <button className="pagination-btn" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
        <button className="pagination-btn" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages}>»</button>
      </div>
      <div className="pagination-stats">
        Showing {((currentPage - 1) * 10) + 1} - {Math.min(currentPage * 10, totalPages * 10)} of {totalPages * 10}+ Institutes
      </div>
    </div>
  )
}

const InstituteAdmin: React.FC = () => {
  const { user } = useAuthContext()
  const token = user?.token

  const [institutes, setInstitutes] = useState<Institute[]>([])
  const [filteredInstitutes, setFilteredInstitutes] = useState<Institute[]>([])
  const [editing, setEditing] = useState<Institute | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Institute | null>(null)

  const [form, setForm] = useState({ name: '', email: '', phone: '' })
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null)
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({})

  // Student details modal
  const [showStudentsModal, setShowStudentsModal] = useState(false)
  const [studentsInstitute, setStudentsInstitute] = useState<Institute | null>(null)
  const [studentList, setStudentList] = useState<any[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [studentSearch, setStudentSearch] = useState('')
  const [studentPage, setStudentPage] = useState(1)
  const [studentTotal, setStudentTotal] = useState(0)
  const [studentTotalPages, setStudentTotalPages] = useState(1)
  const STUDENT_PAGE_SIZE = 20

  // Edit student modal
  const [editStudent, setEditStudent] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({ fullname: '', email: '', phoneNumber: '', rollNumber: '', gender: 'Male', branch: '', joiningYear: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [studentDeleting, setStudentDeleting] = useState<string | null>(null)

  // Student nav config
  const [showNavModal, setShowNavModal] = useState(false)
  const [navInstitute, setNavInstitute] = useState<Institute | null>(null)
  const [navChecked, setNavChecked] = useState<string[]>(ALL_KEYS)
  const [navLoading, setNavLoading] = useState(false)

  // Admin nav config
  const [showAdminNavModal, setShowAdminNavModal] = useState(false)
  const [adminNavInstitute, setAdminNavInstitute] = useState<Institute | null>(null)
  const [adminNavChecked, setAdminNavChecked] = useState<string[]>(ALL_ADMIN_KEYS)
  const [adminNavLoading, setAdminNavLoading] = useState(false)

  const baseURL = import.meta.env.VITE_API_BASE_URL
  const institutesPerPage = 10

  const fetchInstitutes = async () => {
    if (!token) return
    try {
      setLoading(true)
      const [instRes, countRes] = await Promise.allSettled([
        axios.get(`${baseURL}/api/institute/institutes`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${baseURL}/api/institute/student-counts`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      const data = instRes.status === 'fulfilled' ? (instRes.value.data?.institutes || []) : []
      setInstitutes(data)
      setFilteredInstitutes(data)
      if (countRes.status === 'fulfilled') {
        setStudentCounts(countRes.value.data?.counts || {})
      }
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

  // Filter institutes based on search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredInstitutes(institutes)
    } else {
      const filtered = institutes.filter(inst =>
        inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inst.phone && inst.phone.includes(searchTerm)) ||
        (inst.domain && inst.domain.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredInstitutes(filtered)
    }
    setCurrentPage(1)
  }, [searchTerm, institutes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    try {
      setLoading(true)
      if (editing) {
        await axios.put(`${baseURL}/api/institute/updateInstitute/${editing._id}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setSuccessMessage('Institute updated successfully!')
      } else {
        await axios.post(`${baseURL}/api/institute/createInstitute`, form, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setSuccessMessage('Institute created successfully!')
      }
      setForm({ name: '', email: '', phone: '' })
      setEditing(null)
      setShowModal(false)
      fetchInstitutes()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error(err)
      setError("Operation failed")
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setLoading(true)
      await axios.delete(`${baseURL}/api/institute/deleteInstitute/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccessMessage('Institute deleted successfully!')
      setShowDeleteConfirm(null)
      fetchInstitutes()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error(err)
      setError("Delete failed")
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (inst: Institute) => {
    setEditing(inst)
    setForm({ name: inst.name, email: inst.email, phone: inst.phone || '' })
    setShowModal(true)
  }

  const openCreateAdmin = (inst: Institute) => {
    setAdminError(null)
    setShowReset(false)
    setAdminForm({ fullname: '', email: '', phoneNo: '', password: '', instituteId: inst._id })
    setShowAdminModal(true)
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setAdminError(null)
      await axios.post(`${baseURL}/api/institute/createAdmin`, adminForm, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccessMessage('Institute Admin Created Successfully!')
      setShowAdminModal(false)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      if (err?.response?.data?.message === "User already exists") {
        setAdminError("User already exists. You can reset password.")
        setShowReset(true)
      } else {
        console.error(err)
        setError("Failed to create admin")
        setTimeout(() => setError(null), 3000)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    try {
      await axios.post(`${baseURL}/api/institute/reset-password`, {
        email: adminForm.email,
        newPassword: adminForm.password
      }, { headers: { Authorization: `Bearer ${token}` } })
      setSuccessMessage("Password reset successfully")
      setShowAdminModal(false)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error(err)
      setError("Password reset failed")
      setTimeout(() => setError(null), 3000)
    }
  }

  const openNavConfig = async (inst: Institute) => {
    setNavInstitute(inst)
    setNavLoading(true)
    setShowNavModal(true)
    try {
      const res = await axios.get(`${baseURL}/api/institute/nav-config/${inst._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const sections = res.data?.navSections
      setNavChecked(sections && sections.length > 0 ? sections : ALL_KEYS)
    } catch {
      setNavChecked(ALL_KEYS)
    } finally {
      setNavLoading(false)
    }
  }

  const handleSaveNavConfig = async () => {
    if (!navInstitute) return
    try {
      setNavLoading(true)
      await axios.put(`${baseURL}/api/institute/nav-config/${navInstitute._id}`, { navSections: navChecked }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccessMessage(`Navigation saved for ${navInstitute.name}`)
      setShowNavModal(false)
      fetchInstitutes()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch {
      setError('Failed to save navigation config')
      setTimeout(() => setError(null), 3000)
    } finally {
      setNavLoading(false)
    }
  }

  const toggleNavSection = (key: string) => {
    const def = NAV_SECTION_DEFS.find(s => s.key === key)
    if (def?.alwaysOn) return
    setNavChecked(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const ADMIN_LEGACY_KEY_MAP: Record<string, string> = {
    'achievements': 'instituteAnnouncements',
    'editProfile':  'profile',
  }

  const openAdminNavConfig = async (inst: Institute) => {
    setAdminNavInstitute(inst)
    setAdminNavLoading(true)
    setShowAdminNavModal(true)
    try {
      const res = await axios.get(`${baseURL}/api/institute/nav-config/${inst._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      let sections: string[] = res.data?.adminNavSections
      if (sections && sections.length > 0) {
        // Normalize legacy keys
        sections = sections.map(k => ADMIN_LEGACY_KEY_MAP[k] ?? k)
        // Always include alwaysOn keys
        const alwaysOnKeys = ADMIN_NAV_SECTION_DEFS.filter(s => s.alwaysOn).map(s => s.key)
        alwaysOnKeys.forEach(k => { if (!sections.includes(k)) sections.push(k) })
        setAdminNavChecked(sections)
      } else {
        setAdminNavChecked(ALL_ADMIN_KEYS)
      }
    } catch {
      setAdminNavChecked(ALL_ADMIN_KEYS)
    } finally {
      setAdminNavLoading(false)
    }
  }

  const handleSaveAdminNavConfig = async () => {
    if (!adminNavInstitute) return
    try {
      setAdminNavLoading(true)
      await axios.put(`${baseURL}/api/institute/nav-config/${adminNavInstitute._id}`, { adminNavSections: adminNavChecked }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSuccessMessage(`Admin navigation saved for ${adminNavInstitute.name}`)
      setShowAdminNavModal(false)
      fetchInstitutes()
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch {
      setError('Failed to save admin navigation config')
      setTimeout(() => setError(null), 3000)
    } finally {
      setAdminNavLoading(false)
    }
  }

  const toggleAdminNavSection = (key: string) => {
    const def = ADMIN_NAV_SECTION_DEFS.find(s => s.key === key)
    if (def?.alwaysOn) return
    setAdminNavChecked(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const handleCopyDomain = (domain: string) => {
    navigator.clipboard.writeText(`https://${domain}`)
    setCopiedDomain(domain)
    setTimeout(() => setCopiedDomain(null), 2000)
  }

  const fetchStudents = async (inst: Institute, page: number, search: string) => {
    setStudentsLoading(true)
    try {
      const res = await axios.get(`${baseURL}/api/institute/${inst._id}/students`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, limit: STUDENT_PAGE_SIZE, search: search.trim() }
      })
      setStudentList(res.data?.students || [])
      setStudentTotal(res.data?.total ?? 0)
      setStudentTotalPages(res.data?.totalPages ?? 1)
      setStudentPage(page)
    } catch {
      setStudentList([])
      setStudentTotal(0)
      setStudentTotalPages(1)
    } finally {
      setStudentsLoading(false)
    }
  }

  const openStudentsModal = (inst: Institute) => {
    setStudentsInstitute(inst)
    setStudentSearch('')
    setStudentPage(1)
    setStudentTotal(0)
    setStudentTotalPages(1)
    setStudentList([])
    setShowStudentsModal(true)
    fetchStudents(inst, 1, '')
  }

  const handleStudentSearch = (val: string) => {
    setStudentSearch(val)
    setStudentPage(1)
    if (studentsInstitute) fetchStudents(studentsInstitute, 1, val)
  }

  const handleStudentPageChange = (page: number) => {
    if (studentsInstitute) fetchStudents(studentsInstitute, page, studentSearch)
  }

  const openEditStudent = (s: any) => {
    setEditStudent(s)
    setEditForm({
      fullname: s.name || s.fullname || '',
      email: s.email || '',
      phoneNumber: s.phoneNumber || '',
      rollNumber: s.rollNumber || '',
      gender: s.gender || 'Male',
      branch: s.branch || '',
      joiningYear: s.joiningYear || '',
    })
  }

  const handleEditSave = async () => {
    if (!editStudent || !studentsInstitute) return
    setEditSaving(true)
    try {
      await axios.put(
        `${baseURL}/api/institute/updateStudent/${editStudent._id}?instituteId=${studentsInstitute._id}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setEditStudent(null)
      fetchStudents(studentsInstitute, studentPage, studentSearch)
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Update failed')
    } finally {
      setEditSaving(false)
    }
  }

  const handleDeleteStudent = async (id: string, name: string) => {
    if (!window.confirm(`Delete student "${name}"? This cannot be undone.`)) return
    if (!studentsInstitute) return
    setStudentDeleting(id)
    try {
      await axios.delete(
        `${baseURL}/api/institute/deleteStudent/${id}?instituteId=${studentsInstitute._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      fetchStudents(studentsInstitute, studentPage, studentSearch)
      setStudentCounts(prev => ({ ...prev, [studentsInstitute._id]: Math.max(0, (prev[studentsInstitute._id] ?? 1) - 1) }))
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Delete failed')
    } finally {
      setStudentDeleting(null)
    }
  }

  const thStyle: React.CSSProperties = { padding: '10px 14px', color: '#555', fontWeight: 600, textAlign: 'left', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }
  const tdStyle: React.CSSProperties = { padding: '10px 14px', verticalAlign: 'middle' }
  const pgBtnStyle = (disabled: boolean, active = false): React.CSSProperties => ({
    minWidth: 28, height: 28, borderRadius: 6, border: active ? '1px solid #ff8c00' : '1px solid #2a2a2a',
    background: active ? '#ff8c00' : '#111', color: active ? '#000' : disabled ? '#333' : '#aaa',
    cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '0.78rem', fontWeight: 600, padding: '0 6px',
  })

  // Pagination
  const totalPages = Math.ceil(filteredInstitutes.length / institutesPerPage)
  const paginatedInstitutes = filteredInstitutes.slice(
    (currentPage - 1) * institutesPerPage,
    currentPage * institutesPerPage
  )

  // Generate domain preview
  const getDomainPreview = (name: string) => {
    return name ? `${name.toLowerCase().replace(/\s+/g, '')}.eklav.in` : ''
  }

  return (
    <>
      <div className="institute-admin-dashboard">

        {/* ── Compact top bar ── */}
        <div className="ia-topbar">
          <div className="ia-topbar-left">
            <div className="ia-topbar-icon"><FaUniversity size={15} /></div>
            <span className="ia-topbar-title">Institute Management</span>
            <div className="ia-pill"><FaBuilding size={10} /><b>{institutes.length}</b><span>Total</span></div>
            <div className="ia-pill succ"><MdVerified size={10} /><b>{institutes.filter(i => i.domain).length}</b><span>Domains</span></div>
          </div>

          {/* Inline search */}
          <div className="ia-search-wrap">
            <FaSearch size={11} className="ia-search-icon" />
            <input
              className="ia-search"
              placeholder="Search name, email, phone or domain…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="ia-search-clear" onClick={() => setSearchTerm('')}><FaTimes size={10} /></button>
            )}
            {searchTerm && <span className="ia-pill info" style={{ marginLeft: 6 }}>{filteredInstitutes.length} results</span>}
          </div>

          <button
            className="ia-add-btn"
            onClick={() => { setEditing(null); setForm({ name: '', email: '', phone: '' }); setShowModal(true); }}
          >
            <FaPlus size={11} /> Add Institute
          </button>
        </div>

        {/* Toast messages */}
        {successMessage && (
          <div className="ia-toast ia-toast-success"><FaCheck className="me-2" />{successMessage}</div>
        )}
        {error && (
          <div className="ia-toast ia-toast-error"><FaTimes className="me-2" />{error}</div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-container">
            <Spinner animation="border" variant="orange" />
            <p className="mt-2 text-muted">Loading institutes...</p>
          </div>
        )}

        {/* Institutes Table */}
        {!loading && (
          <Card className="bg-dark border-secondary">
            <div className="table-responsive">
              <table className="institute-table">
                <thead>
                  <tr>
                    <th>Institute Name</th>
                    <th>Contact Info</th>
                    <th>Domain</th>
                    <th className="text-center">Students</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInstitutes.length > 0 ? (
                    paginatedInstitutes.map((inst) => (
                      <tr key={inst._id}>
                        <td>
                          <div className="institute-name">
                            <FaBuilding className="text-orange me-2" size={16} />
                            <strong>{inst.name}</strong>
                          </div>
                        </td>
                        <td>
                          <div className="contact-info">
                            <div className="contact-item">
                              <MdEmail className="text-muted me-1" size={12} />
                              <small>{inst.email}</small>
                            </div>
                            {inst.phone && (
                              <div className="contact-item mt-1">
                                <MdPhone className="text-muted me-1" size={12} />
                                <small>{inst.phone}</small>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          {inst.domain ? (
                            <div className="domain-info">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <Badge bg="dark" className="domain-badge">
                                  <MdDomain className="me-1" />
                                  {inst.domain}
                                </Badge>
                                {inst.navSections && inst.navSections.length > 0 && inst.navSections.length < ALL_KEYS.length ? (
                                  <span style={{ fontSize: '0.65rem', background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>
                                    Nav: {inst.navSections.length}/{ALL_KEYS.length}
                                  </span>
                                ) : inst.navSections && inst.navSections.length === ALL_KEYS.length ? (
                                  <span style={{ fontSize: '0.65rem', background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '2px 8px', fontWeight: 600 }}>
                                    Nav: All
                                  </span>
                                ) : null}
                              </div>
                              <div className="domain-actions mt-1">
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="domain-link"
                                  onClick={() => window.open(`https://${inst.domain}`, "_blank")}
                                >
                                  <FaExternalLinkAlt size={12} /> Open Portal
                                </Button>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="domain-link"
                                  onClick={() => handleCopyDomain(inst.domain!)}
                                >
                                  {copiedDomain === inst.domain ? <FaCheck className="text-success" /> : <FaCopy size={12} />}
                                  {copiedDomain === inst.domain ? ' Copied!' : ' Copy URL'}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Badge bg="secondary">No Domain</Badge>
                          )}
                        </td>
                        <td className="text-center">
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <span style={{
                              fontSize: '1.3rem', fontWeight: 700,
                              color: (studentCounts[inst._id] ?? 0) > 0 ? '#ff8c00' : '#444',
                            }}>
                              {studentCounts[inst._id] ?? '—'}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              {(studentCounts[inst._id] ?? 0) === 1 ? 'student' : 'students'}
                            </span>
                          </div>
                        </td>
                        <td className="action-buttons">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => openStudentsModal(inst)}
                            title="View Students"
                          >
                            <FaEye />
                          </Button>
                          <Button
                            variant="outline-orange"
                            size="sm"
                            onClick={() => handleEdit(inst)}
                            title="Edit Institute"
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => setShowDeleteConfirm(inst)}
                            title="Delete Institute"
                          >
                            <FaTrash />
                          </Button>
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => openCreateAdmin(inst)}
                            title="Create Admin"
                          >
                            <FaUserPlus />
                          </Button>
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => openNavConfig(inst)}
                            title="Student Navigation"
                          >
                            <FaSlidersH />
                          </Button>
                          <Button
                            variant="outline-warning"
                            size="sm"
                            onClick={() => openAdminNavConfig(inst)}
                            title="Admin Navigation"
                          >
                            <FaClipboardList />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="empty-state">
                        <div className="empty-state-content">
                          <FaBuilding size={48} className="text-muted mb-3" />
                          <h5>No Institutes Found</h5>
                          <p className="text-muted">Get started by adding your first institute</p>
                          <Button
                            variant="orange"
                            onClick={() => {
                              setEditing(null)
                              setForm({ name: '', email: '', phone: '' })
                              setShowModal(true)
                            }}
                          >
                            <FaPlus className="me-2" />
                            Add Institute
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <InstitutePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </Card>
        )}
      </div>

      {/* Create/Edit Institute Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg" className="institute-modal">
        <Modal.Header closeButton className="bg-dark border-secondary">
          <Modal.Title className="text-white">
            <div className="d-flex align-items-center gap-2">
              {editing ? <FaEdit className="text-orange" /> : <FaPlus className="text-orange" />}
              <span>{editing ? 'Edit Institute' : 'Add New Institute'}</span>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark">
          <Form onSubmit={handleSubmit}>
            <Row className="g-4">
              <Col md={12}>
                <Form.Label className="text-muted">Institute Name</Form.Label>
                <div className="input-with-icon">
                  <FaBuilding className="input-icon" />
                  <Form.Control
                    type="text"
                    placeholder="Enter institute name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="bg-dark-lighter border-secondary text-white"
                  />
                </div>
              </Col>
              <Col md={12}>
                <Form.Label className="text-muted">Domain Preview</Form.Label>
                <div className="domain-preview">
                  <MdDomain className="preview-icon" />
                  <code className="preview-text">{getDomainPreview(form.name)}</code>
                </div>
                <small className="text-muted">This domain will be automatically generated</small>
              </Col>
              <Col md={6}>
                <Form.Label className="text-muted">Email Address</Form.Label>
                <div className="input-with-icon">
                  <MdEmail className="input-icon" />
                  <Form.Control
                    type="email"
                    placeholder="admin@institute.com"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="bg-dark-lighter border-secondary text-white"
                  />
                </div>
              </Col>
              <Col md={6}>
                <Form.Label className="text-muted">Phone Number</Form.Label>
                <div className="input-with-icon">
                  <MdPhone className="input-icon" />
                  <Form.Control
                    type="tel"
                    placeholder="+91XXXXXXXXXX"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="bg-dark-lighter border-secondary text-white"
                  />
                </div>
              </Col>
            </Row>
            <div className="modal-actions mt-4">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="orange" disabled={loading}>
                {loading ? <FaSpinner className="spinning" /> : (editing ? 'Update Institute' : 'Create Institute')}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Create Admin Modal */}
      <Modal show={showAdminModal} onHide={() => setShowAdminModal(false)} centered size="lg" className="admin-modal">
        <Modal.Header closeButton className="bg-dark border-secondary">
          <Modal.Title className="text-white">
            <div className="d-flex align-items-center gap-2">
              <MdAdminPanelSettings className="text-orange" size={24} />
              <span>Create Admin for {institutes.find(i => i._id === adminForm.instituteId)?.name}</span>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark">
          {adminError && <Alert variant="warning" className="mb-3">{adminError}</Alert>}
          <Form onSubmit={handleCreateAdmin}>
            <Row className="g-4">
              <Col md={12}>
                <Form.Label className="text-muted">Full Name</Form.Label>
                <div className="input-with-icon">
                  <FaUserGraduate className="input-icon" />
                  <Form.Control
                    required
                    placeholder="Enter admin full name"
                    value={adminForm.fullname}
                    onChange={(e) => setAdminForm({ ...adminForm, fullname: e.target.value })}
                    className="bg-dark-lighter border-secondary text-white"
                  />
                </div>
              </Col>
              <Col md={6}>
                <Form.Label className="text-muted">Email Address</Form.Label>
                <div className="input-with-icon">
                  <MdEmail className="input-icon" />
                  <Form.Control
                    required
                    type="email"
                    placeholder="admin@institute.com"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    className="bg-dark-lighter border-secondary text-white"
                  />
                </div>
              </Col>
              <Col md={6}>
                <Form.Label className="text-muted">Phone Number</Form.Label>
                <div className="input-with-icon">
                  <MdPhone className="input-icon" />
                  <Form.Control
                    placeholder="+91XXXXXXXXXX"
                    value={adminForm.phoneNo}
                    onChange={(e) => setAdminForm({ ...adminForm, phoneNo: e.target.value })}
                    className="bg-dark-lighter border-secondary text-white"
                  />
                </div>
              </Col>
              <Col md={12}>
                <Form.Label className="text-muted">Password</Form.Label>
                <div className="input-with-icon">
                  <FaKey className="input-icon" />
                  <Form.Control
                    required
                    type="password"
                    placeholder="Enter secure password"
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    className="bg-dark-lighter border-secondary text-white"
                  />
                </div>
              </Col>
            </Row>
            <div className="modal-actions mt-4">
              <Button variant="secondary" onClick={() => setShowAdminModal(false)}>
                Cancel
              </Button>
              {showReset && (
                <Button variant="warning" onClick={handleResetPassword}>
                  Reset Password
                </Button>
              )}
              <Button type="submit" variant="orange" disabled={loading}>
                {loading ? <FaSpinner className="spinning" /> : 'Create Admin'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={!!showDeleteConfirm} onHide={() => setShowDeleteConfirm(null)} centered className="delete-modal">
        <Modal.Header closeButton className="bg-dark border-secondary">
          <Modal.Title className="text-white">Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark text-white">
          <div className="text-center py-3">
            <FaTrash size={48} className="text-danger mb-3" />
            <h5>Are you sure?</h5>
            <p className="text-muted">
              You are about to delete <strong>{showDeleteConfirm?.name}</strong>. This action cannot be undone.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm._id)}>
            Delete Institute
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Nav Config Modal ── */}
      <Modal show={showNavModal} onHide={() => setShowNavModal(false)} centered size="lg" className="institute-modal">
        <Modal.Header closeButton className="bg-dark border-secondary">
          <Modal.Title className="text-white">
            <div className="d-flex align-items-center gap-2">
              <FaSlidersH className="text-info" />
              <span>Configure Navigation — {navInstitute?.name}</span>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark">
          {navLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Spinner animation="border" size="sm" style={{ color: '#ff8c00' }} />
              <p className="text-muted mt-2" style={{ fontSize: '0.85rem' }}>Loading config…</p>
            </div>
          ) : (
            <>
              <p style={{ color: '#888', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                Choose which sections appear in the student sidebar for <strong style={{ color: '#fff' }}>{navInstitute?.name}</strong>.
                Sections marked <span style={{ color: '#22c55e' }}>Always On</span> cannot be hidden.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {NAV_SECTION_DEFS.map(sec => {
                  const checked = navChecked.includes(sec.key)
                  return (
                    <div
                      key={sec.key}
                      onClick={() => toggleNavSection(sec.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        background: checked ? 'rgba(255,140,0,0.08)' : '#1a1a1a',
                        border: `1px solid ${checked ? '#ff8c0055' : '#2a2a2a'}`,
                        borderRadius: 10, padding: '12px 16px',
                        cursor: sec.alwaysOn ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s',
                        opacity: sec.alwaysOn ? 0.7 : 1,
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                        border: `2px solid ${checked ? '#ff8c00' : '#444'}`,
                        background: checked ? '#ff8c00' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}>
                        {checked && <FaCheck size={10} color="#000" />}
                      </div>
                      <div>
                        <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>{sec.label}</div>
                        {sec.alwaysOn && (
                          <div style={{ color: '#22c55e', fontSize: '0.68rem', marginTop: 2 }}>Always On</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: '1rem', padding: '10px 14px', background: '#111', borderRadius: 8, border: '1px solid #222', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaInfoCircle size={12} color="#555" />
                <span style={{ fontSize: '0.75rem', color: '#555' }}>
                  {navChecked.length === ALL_KEYS.length
                    ? 'All sections are enabled (default)'
                    : `${navChecked.length} of ${ALL_KEYS.length} sections enabled`}
                </span>
                {navChecked.length < ALL_KEYS.length && (
                  <button
                    onClick={() => setNavChecked(ALL_KEYS)}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#ff8c00', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                  >
                    Enable All
                  </button>
                )}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button variant="secondary" onClick={() => setShowNavModal(false)}>Cancel</Button>
          <Button variant="orange" onClick={handleSaveNavConfig} disabled={navLoading} style={{ background: '#ff8c00', border: 'none', fontWeight: 600 }}>
            {navLoading ? <FaSpinner className="spinning" /> : 'Save Navigation'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Students Modal ── */}
      {showStudentsModal && ReactDOM.createPortal(
        <div
          onClick={() => setShowStudentsModal(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1049,
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            backgroundColor: 'rgba(0,0,0,0.55)',
          }}
        />,
        document.body
      )}
      <Modal show={showStudentsModal} onHide={() => setShowStudentsModal(false)} centered size="xl" backdrop={false} className="institute-modal students-modal" style={{ zIndex: 1050 }}>
        <Modal.Header closeButton className="bg-dark border-secondary">
          <Modal.Title className="text-white">
            <div className="d-flex align-items-center gap-2">
              <FaUserGraduate className="text-primary" />
              <span>Students — {studentsInstitute?.name}</span>
              {!studentsLoading && (
                <span style={{ fontSize: '0.75rem', background: 'rgba(255,140,0,0.15)', color: '#ff8c00', border: '1px solid rgba(255,140,0,0.3)', borderRadius: 20, padding: '2px 10px', fontWeight: 600, marginLeft: 4 }}>
                  {studentList.length} total
                </span>
              )}
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark" style={{ padding: 0 }}>
          {/* Search bar */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <FaSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: '0.75rem' }} />
              <input
                value={studentSearch}
                onChange={e => handleStudentSearch(e.target.value)}
                placeholder="Search by name, email, roll number or branch…"
                style={{
                  width: '100%', background: '#111', border: '1px solid #222', borderRadius: 8,
                  padding: '7px 10px 7px 30px', color: '#ddd', fontSize: '0.82rem', outline: 'none'
                }}
              />
            </div>
            {studentSearch && (
              <button onClick={() => handleStudentSearch('')} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer' }}>
                <FaTimes size={12} />
              </button>
            )}
            <span style={{ fontSize: '0.72rem', color: '#555', whiteSpace: 'nowrap' }}>
              {studentTotal} student{studentTotal !== 1 ? 's' : ''}
            </span>
          </div>

          {studentsLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <Spinner animation="border" size="sm" style={{ color: '#ff8c00' }} />
              <p className="text-muted mt-2" style={{ fontSize: '0.85rem' }}>Loading students…</p>
            </div>
          ) : studentList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#555' }}>
              <FaUserGraduate size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontSize: '0.85rem' }}>{studentSearch ? 'No students match your search' : 'No students enrolled yet'}</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', maxHeight: '55vh', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#0d0d0d', borderBottom: '1px solid #1a1a1a', position: 'sticky', top: 0, zIndex: 1 }}>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}><FaIdCard style={{ marginRight: 4 }} />Roll No</th>
                    <th style={thStyle}><FaCodeBranch style={{ marginRight: 4 }} />Branch</th>
                    <th style={thStyle}><FaCalendarAlt style={{ marginRight: 4 }} />Year</th>
                    <th style={thStyle}><FaVenusMars style={{ marginRight: 4 }} />Gender</th>
                    <th style={thStyle}><FaPhoneAlt style={{ marginRight: 4 }} />Phone</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Joined</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentList.map((s, i) => (
                    <tr key={s._id} style={{ borderBottom: '1px solid #111', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#0f0f0f')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={tdStyle}><span style={{ color: '#444', fontWeight: 600 }}>{(studentPage - 1) * STUDENT_PAGE_SIZE + i + 1}</span></td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: '50%',
                            background: `hsl(${(s.name || 'A').charCodeAt(0) * 13 % 360}, 55%, 30%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.72rem', fontWeight: 700, color: '#fff', flexShrink: 0
                          }}>
                            {(s.name || s.fullname || '?')[0].toUpperCase()}
                          </div>
                          <span style={{ color: '#e0e0e0', fontWeight: 600 }}>{s.name || s.fullname || '—'}</span>
                        </div>
                      </td>
                      <td style={tdStyle}><span style={{ color: '#888' }}>{s.email}</span></td>
                      <td style={tdStyle}><span style={{ color: '#ff8c00', fontWeight: 600 }}>{s.rollNumber || '—'}</span></td>
                      <td style={tdStyle}><span style={{ color: '#ccc' }}>{s.branch || '—'}</span></td>
                      <td style={tdStyle}><span style={{ color: '#ccc' }}>{s.joiningYear || '—'}</span></td>
                      <td style={tdStyle}><span style={{ color: '#ccc', textTransform: 'capitalize' }}>{s.gender || '—'}</span></td>
                      <td style={tdStyle}><span style={{ color: '#888' }}>{s.phoneNumber || '—'}</span></td>
                      <td style={tdStyle}>
                        <span style={{
                          fontSize: '0.68rem', padding: '2px 8px', borderRadius: 20, fontWeight: 600,
                          background: s.status === 'approved' ? 'rgba(34,197,94,0.12)' : 'rgba(251,191,36,0.12)',
                          color: s.status === 'approved' ? '#22c55e' : '#fbbf24',
                          border: `1px solid ${s.status === 'approved' ? 'rgba(34,197,94,0.25)' : 'rgba(251,191,36,0.25)'}`,
                          textTransform: 'capitalize'
                        }}>
                          {s.status || 'active'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: '#555', fontSize: '0.75rem' }}>
                          {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button
                          onClick={() => openEditStudent(s)}
                          title="Edit student"
                          style={{ background: 'rgba(255,140,0,0.12)', border: '1px solid rgba(255,140,0,0.3)', color: '#ff8c00', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', marginRight: 6, fontSize: '0.75rem' }}
                        >
                          <FaEdit size={11} />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(s._id, s.name || s.fullname || s.email)}
                          disabled={studentDeleting === s._id}
                          title="Delete student"
                          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '0.75rem' }}
                        >
                          {studentDeleting === s._id ? <FaSpinner size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <FaTrash size={11} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Pagination */}
          {studentTotalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => handleStudentPageChange(1)} disabled={studentPage === 1} style={pgBtnStyle(studentPage === 1)}>«</button>
              <button onClick={() => handleStudentPageChange(studentPage - 1)} disabled={studentPage === 1} style={pgBtnStyle(studentPage === 1)}>‹</button>
              {Array.from({ length: studentTotalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === studentTotalPages || Math.abs(p - studentPage) <= 1)
                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, idx) => p === '...'
                  ? <span key={`d${idx}`} style={{ color: '#444', padding: '0 4px' }}>…</span>
                  : <button key={p} onClick={() => handleStudentPageChange(p as number)} style={pgBtnStyle(false, studentPage === p)}>{p}</button>
                )}
              <button onClick={() => handleStudentPageChange(studentPage + 1)} disabled={studentPage === studentTotalPages} style={pgBtnStyle(studentPage === studentTotalPages)}>›</button>
              <button onClick={() => handleStudentPageChange(studentTotalPages)} disabled={studentPage === studentTotalPages} style={pgBtnStyle(studentPage === studentTotalPages)}>»</button>
              <span style={{ fontSize: '0.72rem', color: '#555', marginLeft: 6 }}>
                Page {studentPage} of {studentTotalPages} · Showing {(studentPage - 1) * STUDENT_PAGE_SIZE + 1}–{Math.min(studentPage * STUDENT_PAGE_SIZE, studentTotal)} of {studentTotal}
              </span>
            </div>
          )}
          <Button variant="secondary" onClick={() => setShowStudentsModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* ── Edit Student Modal ── */}
      <Modal show={!!editStudent} onHide={() => setEditStudent(null)} centered size="lg" className="institute-modal">
        <Modal.Header closeButton className="bg-dark border-secondary">
          <Modal.Title className="text-white">
            <div className="d-flex align-items-center gap-2">
              <FaEdit className="text-orange" />
              <span>Edit Student — {editStudent?.name || editStudent?.fullname}</span>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark">
          <Row className="g-3">
            <Col md={6}>
              <Form.Label className="text-muted" style={{ fontSize: '0.8rem' }}>Full Name</Form.Label>
              <Form.Control
                value={editForm.fullname}
                onChange={e => setEditForm(p => ({ ...p, fullname: e.target.value }))}
                className="bg-dark-lighter border-secondary text-white"
                placeholder="Full name"
              />
            </Col>
            <Col md={6}>
              <Form.Label className="text-muted" style={{ fontSize: '0.8rem' }}>Email</Form.Label>
              <Form.Control
                type="email"
                value={editForm.email}
                onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                className="bg-dark-lighter border-secondary text-white"
                placeholder="Email address"
              />
            </Col>
            <Col md={6}>
              <Form.Label className="text-muted" style={{ fontSize: '0.8rem' }}>Roll Number</Form.Label>
              <Form.Control
                value={editForm.rollNumber}
                onChange={e => setEditForm(p => ({ ...p, rollNumber: e.target.value }))}
                className="bg-dark-lighter border-secondary text-white"
                placeholder="Roll number"
              />
            </Col>
            <Col md={6}>
              <Form.Label className="text-muted" style={{ fontSize: '0.8rem' }}>Branch</Form.Label>
              <Form.Control
                value={editForm.branch}
                onChange={e => setEditForm(p => ({ ...p, branch: e.target.value }))}
                className="bg-dark-lighter border-secondary text-white"
                placeholder="Branch"
              />
            </Col>
            <Col md={4}>
              <Form.Label className="text-muted" style={{ fontSize: '0.8rem' }}>Joining Year</Form.Label>
              <Form.Select
                value={editForm.joiningYear}
                onChange={e => setEditForm(p => ({ ...p, joiningYear: e.target.value }))}
                className="bg-dark-lighter border-secondary text-white"
              >
                <option value="">Select year</option>
                {Array.from({ length: 10 }, (_, i) => {
                  const yr = new Date().getFullYear() - i
                  return <option key={yr} value={String(yr)}>{yr}</option>
                })}
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Label className="text-muted" style={{ fontSize: '0.8rem' }}>Gender</Form.Label>
              <Form.Select
                value={editForm.gender}
                onChange={e => setEditForm(p => ({ ...p, gender: e.target.value }))}
                className="bg-dark-lighter border-secondary text-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Form.Select>
            </Col>
            <Col md={4}>
              <Form.Label className="text-muted" style={{ fontSize: '0.8rem' }}>Phone Number</Form.Label>
              <Form.Control
                value={editForm.phoneNumber}
                onChange={e => setEditForm(p => ({ ...p, phoneNumber: e.target.value }))}
                className="bg-dark-lighter border-secondary text-white"
                placeholder="+91XXXXXXXXXX"
              />
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button variant="secondary" onClick={() => setEditStudent(null)}>Cancel</Button>
          <Button onClick={handleEditSave} disabled={editSaving} style={{ background: '#ff8c00', border: 'none', fontWeight: 600, color: '#000', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {editSaving ? <FaSpinner className="spinning" /> : <FaSave size={13} />}
            {editSaving ? 'Saving…' : 'Save Changes'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ── Admin Nav Config Modal ── */}
      <Modal show={showAdminNavModal} onHide={() => setShowAdminNavModal(false)} centered size="lg" className="institute-modal">
        <Modal.Header closeButton className="bg-dark border-secondary">
          <Modal.Title className="text-white">
            <div className="d-flex align-items-center gap-2">
              <FaClipboardList className="text-warning" />
              <span>Admin Navigation — {adminNavInstitute?.name}</span>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-dark">
          {adminNavLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Spinner animation="border" size="sm" style={{ color: '#ff8c00' }} />
              <p className="text-muted mt-2" style={{ fontSize: '0.85rem' }}>Loading config…</p>
            </div>
          ) : (
            <>
              <p style={{ color: '#888', fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                Choose which sections appear in the <strong style={{ color: '#fff' }}>institute admin</strong> sidebar for <strong style={{ color: '#fff' }}>{adminNavInstitute?.name}</strong>.
                Sections marked <span style={{ color: '#22c55e' }}>Always On</span> cannot be hidden.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {ADMIN_NAV_SECTION_DEFS.map(sec => {
                  const checked = adminNavChecked.includes(sec.key)
                  return (
                    <div
                      key={sec.key}
                      onClick={() => toggleAdminNavSection(sec.key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        background: checked ? 'rgba(251,191,36,0.08)' : '#1a1a1a',
                        border: `1px solid ${checked ? '#fbbf2455' : '#2a2a2a'}`,
                        borderRadius: 10, padding: '12px 16px',
                        cursor: sec.alwaysOn ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s',
                        opacity: sec.alwaysOn ? 0.7 : 1,
                      }}
                    >
                      <div style={{
                        width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                        border: `2px solid ${checked ? '#fbbf24' : '#444'}`,
                        background: checked ? '#fbbf24' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}>
                        {checked && <FaCheck size={10} color="#000" />}
                      </div>
                      <div>
                        <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>{sec.label}</div>
                        {sec.alwaysOn && (
                          <div style={{ color: '#22c55e', fontSize: '0.68rem', marginTop: 2 }}>Always On</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: '1rem', padding: '10px 14px', background: '#111', borderRadius: 8, border: '1px solid #222', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaInfoCircle size={12} color="#555" />
                <span style={{ fontSize: '0.75rem', color: '#555' }}>
                  {adminNavChecked.length === ALL_ADMIN_KEYS.length
                    ? 'All admin sections enabled (default)'
                    : `${adminNavChecked.length} of ${ALL_ADMIN_KEYS.length} sections enabled`}
                </span>
                {adminNavChecked.length < ALL_ADMIN_KEYS.length && (
                  <button
                    onClick={() => setAdminNavChecked(ALL_ADMIN_KEYS)}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fbbf24', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                  >
                    Enable All
                  </button>
                )}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-dark border-secondary">
          <Button variant="secondary" onClick={() => setShowAdminNavModal(false)}>Cancel</Button>
          <Button onClick={handleSaveAdminNavConfig} disabled={adminNavLoading} style={{ background: '#fbbf24', border: 'none', fontWeight: 600, color: '#000' }}>
            {adminNavLoading ? <FaSpinner className="spinning" /> : 'Save Admin Navigation'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Global Styles */}
      <style>{`
        .institute-admin-dashboard { padding: 0; display: flex; flex-direction: column; gap: 10px; }

        /* ── Compact top bar ── */
        .ia-topbar {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          background: #141414; border: 1px solid #222; border-radius: 12px;
          padding: 8px 14px;
        }
        .ia-topbar-left { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .ia-topbar-icon {
          width: 30px; height: 30px; border-radius: 8px;
          background: rgba(255,140,0,.12); display: flex; align-items: center;
          justify-content: center; color: #ff8c00;
        }
        .ia-topbar-title { color: #fff; font-weight: 700; font-size: .9rem; white-space: nowrap; }
        .ia-pill {
          display: flex; align-items: center; gap: 4px;
          background: #1e1e1e; border: 1px solid #2a2a2a; border-radius: 20px;
          padding: 3px 10px; font-size: .72rem; color: #888; white-space: nowrap;
        }
        .ia-pill b { color: #ccc; }
        .ia-pill.succ { border-color: #22c55e33; } .ia-pill.succ b { color: #22c55e; }
        .ia-pill.info { border-color: #38bdf833; } .ia-pill.info b { color: #38bdf8; }

        .ia-search-wrap {
          flex: 1; min-width: 200px; position: relative;
          display: flex; align-items: center; gap: 6px;
        }
        .ia-search-icon { position: absolute; left: 10px; color: #555; pointer-events: none; }
        .ia-search {
          width: 100%; background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px;
          color: #ccc; font-size: .8rem; padding: 6px 30px 6px 28px; outline: none;
          transition: border-color .15s;
        }
        .ia-search:focus { border-color: #ff8c00; }
        .ia-search-clear {
          position: absolute; right: 8px;
          background: none; border: none; color: #555; cursor: pointer; padding: 0;
        }
        .ia-search-clear:hover { color: #ff8c00; }

        .ia-add-btn {
          background: #ff8c00; border: none; color: #fff; border-radius: 8px;
          padding: 6px 14px; font-size: .8rem; font-weight: 600; cursor: pointer;
          display: flex; align-items: center; gap: 6px; white-space: nowrap;
          transition: background .15s; flex-shrink: 0;
        }
        .ia-add-btn:hover { background: #e67e00; }

        /* Toast */
        .ia-toast {
          padding: 8px 16px; border-radius: 8px; font-size: .82rem;
          display: flex; align-items: center;
        }
        .ia-toast-success { background: rgba(34,197,94,.1); border: 1px solid rgba(34,197,94,.25); color: #22c55e; }
        .ia-toast-error   { background: rgba(239,68,68,.1);  border: 1px solid rgba(239,68,68,.25);  color: #ef4444; }

        .bg-orange { background-color: #ff8c00; }
        .bg-dark-lighter { background-color: #2a2a2a; }
        .text-orange { color: #ff8c00; }
        .border-orange { border-color: #ff8c00; }
        
        .institute-table {
          width: 100%;
          border-collapse: collapse;
        }
        .institute-table thead th {
          padding: 1rem;
          text-align: left;
          color: #6c757d;
          font-weight: 500;
          border-bottom: 1px solid #3a3a3a;
        }
        .institute-table tbody tr {
          border-bottom: 1px solid #2a2a2a;
          transition: background 0.2s;
        }
        .institute-table tbody tr:hover { background: rgba(255, 140, 0, 0.05); }
        .institute-table td { padding: 1rem; }
        
        .institute-name { color: white; font-weight: 500; }
        .contact-info { font-size: 0.875rem; }
        .contact-item { color: #adb5bd; }
        
        .domain-badge {
          background: #2a2a2a !important;
          color: #ff8c00 !important;
          padding: 0.5rem 1rem;
          font-weight: 500;
        }
        .domain-actions { display: flex; gap: 0.5rem; }
        .domain-link {
          padding: 0;
          font-size: 0.75rem;
          color: #ff8c00;
          text-decoration: none;
        }
        .domain-link:hover { color: #e67e00; }
        
        .action-buttons { display: flex; gap: 0.5rem; justify-content: center; }
        .action-buttons button { width: 32px; height: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center; }
        
        .empty-state { text-align: center; padding: 3rem !important; }
        .empty-state-content { display: flex; flex-direction: column; align-items: center; }
        
        .input-with-icon { position: relative; }
        .input-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #6c757d;
        }
        .input-with-icon input,
        .input-with-icon textarea { padding-left: 2.5rem; }
        
        .domain-preview {
          background: #2a2a2a;
          border: 1px solid #3a3a3a;
          border-radius: 8px;
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .preview-icon { color: #ff8c00; }
        .preview-text { color: #adb5bd; font-family: monospace; }
        
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #3a3a3a;
        }
        
        .spinning { animation: spin 1s linear infinite; }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .loading-container { text-align: center; padding: 3rem; }
        
        .institute-pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          background: #1e1e1e;
          border-radius: 12px;
          border-top: 1px solid #3a3a3a;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .pagination-btn {
          min-width: 36px;
          height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #2a2a2a;
          border: 1px solid #3a3a3a;
          color: #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .pagination-btn:hover:not(:disabled) {
          background: #ff8c00;
          border-color: #ff8c00;
          color: white;
        }
        .pagination-btn.active {
          background: #ff8c00;
          border-color: #ff8c00;
          color: white;
        }
        .pagination-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pagination-dots { color: #6c757d; padding: 0 0.5rem; }
        
        .custom-alert { border-radius: 12px; border: none; }
        
        .btn-outline-orange {
          border-color: #ff8c00;
          color: #ff8c00;
        }
        .btn-outline-orange:hover {
          background-color: #ff8c00;
          color: white;
        }
        
        .modal-content { background-color: #1a1a1a; }
        .modal-header { border-bottom-color: #2a2a2a; }
        .modal-footer { border-top-color: #2a2a2a; }
        
        .form-control:focus, .form-select:focus {
          border-color: #ff8c00;
          box-shadow: 0 0 0 0.2rem rgba(255, 140, 0, 0.25);
        }
      `}</style>
    </>
  )
}

export default InstituteAdmin