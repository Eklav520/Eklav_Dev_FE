// ManageCoursePage.tsx
import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import PageMetaData from '@/components/PageMetaData'
import EditCourseModal from './EditCourseModal'
import DeleteConfirmationModal from './DeleteConfirmationModal'
import { Button, Card, CardBody, CardHeader, Col, Form, Row, Badge, Alert, Spinner, Dropdown } from 'react-bootstrap'
import {
  FaAngleRight,
  FaCheckCircle,
  FaPlus,
  FaRegEdit,
  FaSearch,
  FaTable,
  FaTimes,
  FaEye,
  FaTrash,
  FaFilter,
  FaSort,
  FaEllipsisV,
  FaToggleOn,
  FaToggleOff,
  FaExclamationTriangle
} from 'react-icons/fa'
import { FaAngleLeft, FaClock, FaDollarSign, FaChartBar } from 'react-icons/fa6'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/context/useAuthContext'

interface CaseStudy {
  title?: string
  description?: string
  inputExample?: string
  expectedOutput?: string
  boilerplate?: string
}

interface Video {
  _id: string
  video: string
  description: string
  caseStudy?: CaseStudy | null
  progress?: number
}

interface FAQ {
  question: string
  answer: string
}

interface Quiz {
  question: string
  options: string[]
  correctAnswer: string
}

interface Course {
  _id: string
  title: string
  shortDescription?: string
  category: string[] | string
  level?: string[] | string
  language?: string[] | string
  visibility?: 'public' | 'private'
  courseType?: 'paid' | 'free'
  courseStatus?: 'active' | 'inactive'
  isFeatured?: boolean
  features?: string[]
  previewVideo?: string
  duration?: string
  totalLectures?: string
  price?: string | number
  discountPrice?: string | number
  description?: string
  image?: string
  videoUrl?: string[]
  videos: Video[]
  addFAQ: FAQ[]
  quiz?: Quiz[]
  createdAt?: string
  updatedAt?: string
  enrolledStudents?: number
  rating?: number
  status?: 'Draft' | 'Published' | 'Archived'
}

type SortOption = 'newest' | 'popular' | 'alphabetical' | 'price-low-high' | 'price-high-low'
type FilterOption = 'all' | 'published' | 'draft' | 'archived' | 'featured'

const ManageCoursePage = () => {
  const [courses, setCourses] = useState<Course[]>([])
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [filterBy, setFilterBy] = useState<FilterOption>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(8)
  const [isUpdating, setIsUpdating] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { user } = useAuthContext();
  const token = user?.token;

  // Add these video handlers inside your ManageCoursePage component

  // Handle video change (description, URL, or caseStudy object)
  const handleVideoChange = (index: number, field: keyof Video, value: string | CaseStudy | null) => {
    if (!selectedCourse) return

    const updatedVideos = [...selectedCourse.videos]
    updatedVideos[index] = { ...updatedVideos[index], [field]: value }

    setSelectedCourse({
      ...selectedCourse,
      videos: updatedVideos
    })
  }

  // Add a new video
  const handleAddVideo = () => {
    if (!selectedCourse) return

    const newVideo: Video = {
      _id: `temp-${Date.now()}`,
      video: '',
      description: ''
    }

    setSelectedCourse({
      ...selectedCourse,
      videos: [...selectedCourse.videos, newVideo]
    })
  }

  // Remove a video
  const handleRemoveVideo = (index: number) => {
    if (!selectedCourse) return

    const updatedVideos = selectedCourse.videos.filter((_, i) => i !== index)

    setSelectedCourse({
      ...selectedCourse,
      videos: updatedVideos
    })
  }


  // Upload video function
  const handleUploadVideo = async (file: File, description: string): Promise<void> => {
    if (!selectedCourse) {
      throw new Error('No course selected')
    }

    setUploadingVideo(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('video', file)
      formData.append('description', description)

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) { clearInterval(progressInterval); return 90 }
          return prev + 10
        })
      }, 300)

      const res = await fetch(`${baseURL}/courses/${selectedCourse._id}/video`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      clearInterval(progressInterval)

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.message || 'Upload failed')
      }

      const data = await res.json()
      setUploadProgress(100)

      const timestamp = Date.now()
      const newVideo: Video = {
        _id: data._id || `video-${timestamp}`,
        video: data.url || data.video || '',
        description: description,
        progress: 0
      }

      // Update the selected course
      setSelectedCourse({
        ...selectedCourse,
        videos: [...selectedCourse.videos, newVideo]
      })

      // Update the main courses list as well
      setCourses(prev => prev.map(course =>
        course._id === selectedCourse._id
          ? { ...course, videos: [...course.videos, newVideo] }
          : course
      ))

      // Reset states after a delay - ONLY the ones that exist in this component
      setTimeout(() => {
        setUploadingVideo(false)
        setUploadProgress(0)
        alert('Video uploaded successfully!')
      }, 500)

    } catch (error) {
      setUploadingVideo(false)
      setUploadProgress(0)
      console.error('Upload error:', error)
      alert(`Failed to upload video: ${(error as Error).message}`)
      throw error
    }
  }

  // Update your handleUpdate function to include videos
  const handleUpdate = async () => {
    if (!selectedCourse) return

    setIsUpdating(true)
    try {
      const formData = new FormData()

      // Simple string fields
      const stringFields: (keyof Course)[] = [
        'title', 'shortDescription', 'description', 'duration', 'totalLectures',
        'previewVideo', 'visibility', 'courseType', 'courseStatus', 'status'
      ]
      stringFields.forEach(f => formData.append(f, String(selectedCourse[f] ?? '')))

      formData.append('price', String(selectedCourse.price ?? ''))
      formData.append('discountPrice', String(selectedCourse.discountPrice ?? ''))
      formData.append('isFeatured', String(selectedCourse.isFeatured ?? false))
      formData.append('enrolledStudents', String(selectedCourse.enrolledStudents ?? 0))
      formData.append('rating', String(selectedCourse.rating ?? 0))

      // Array/object fields as JSON strings (backend parses with parseIfString)
      formData.append('category', JSON.stringify(
        Array.isArray(selectedCourse.category) ? selectedCourse.category : [selectedCourse.category]
      ))
      formData.append('level', JSON.stringify(
        Array.isArray(selectedCourse.level) ? selectedCourse.level : [selectedCourse.level || 'All level']
      ))
      formData.append('language', JSON.stringify(
        Array.isArray(selectedCourse.language) ? selectedCourse.language : [selectedCourse.language || 'English']
      ))
      formData.append('features', JSON.stringify(selectedCourse.features || []))
      formData.append('addFAQ', JSON.stringify(selectedCourse.addFAQ || []))
      formData.append('quiz', JSON.stringify(selectedCourse.quiz || []))
      formData.append('videoUrl', JSON.stringify(selectedCourse.videoUrl || []))
      // Send existing videos with updated descriptions/caseStudy
      formData.append('existingVideos', JSON.stringify(selectedCourse.videos || []))

      // Image file upload (if a new file was selected)
      if (imageFile) {
        formData.append('image', imageFile)
      }

      const res = await fetch(`${baseURL}/courses/${selectedCourse._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }, // no Content-Type — browser sets multipart boundary
        body: formData,
      })

      const data = await res.json()
      if (res.ok) {
        setCourses(prev => prev.map(c =>
          c._id === selectedCourse._id ? data.course || data : c
        ))
        setShowModal(false)
        setSelectedCourse(null)
        setImageFile(null)
        alert('Course updated successfully!')
      } else {
        throw new Error(data.message || 'Update failed')
      }
    } catch (err) {
      console.error('Update error:', err)
      alert(err instanceof Error ? err.message : 'An error occurred while updating.')
    } finally {
      setIsUpdating(false)
    }
  }

  const baseURL = import.meta.env.VITE_API_BASE_URL
  const navigate = useNavigate()

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    filterAndSortCourses()
  }, [courses, searchTerm, sortBy, filterBy])

  const fetchCourses = async () => {
    setIsLoading(true)
    setError(null)

    try {

      const res = await fetch(`${baseURL}/courses`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!res.ok) throw new Error('Failed to fetch courses')

      const data = await res.json()
      setCourses(data)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses')
      console.error('Error fetching courses:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortCourses = () => {
    let result = [...courses]

    // Filter
    if (filterBy === 'published') {
      result = result.filter(course => course.status === 'Published')
    } else if (filterBy === 'draft') {
      result = result.filter(course => course.status === 'Draft')
    } else if (filterBy === 'archived') {
      result = result.filter(course => course.status === 'Archived')
    } else if (filterBy === 'featured') {
      result = result.filter(course => course.isFeatured)
    }

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(course =>
        course.title.toLowerCase().includes(term) ||
        (Array.isArray(course.category) ? course.category.join(' ').toLowerCase() : course.category.toLowerCase()).includes(term) ||
        course.shortDescription?.toLowerCase().includes(term) ||
        course.description?.toLowerCase().includes(term)
      )
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        case 'popular':
          return (b.enrolledStudents || 0) - (a.enrolledStudents || 0)
        case 'alphabetical':
          return a.title.localeCompare(b.title)
        case 'price-low-high':
          return (parseFloat(a.price as string) || 0) - (parseFloat(b.price as string) || 0)
        case 'price-high-low':
          return (parseFloat(b.price as string) || 0) - (parseFloat(a.price as string) || 0)
        default:
          return 0
      }
    })

    setFilteredCourses(result)
    setCurrentPage(1)
  }

  const handleDelete = async () => {
    if (!courseToDelete) return

    setIsUpdating(true)
    try {
      const res = await fetch(`${baseURL}/courses/${courseToDelete._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (res.ok) {
        setCourses(courses.filter((c) => c._id !== courseToDelete._id))
        setShowDeleteModal(false)
        setCourseToDelete(null)
        setDeleteConfirm('')
      } else {
        const data = await res.json()
        throw new Error(data.message || 'Failed to delete course')
      }
    } catch (err) {
      console.error('Delete error:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete course')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEdit = (course: Course) => {
    // Ensure videos array exists
    const courseWithVideos = {
      ...course,
      videos: course.videos || []
    }
    setSelectedCourse(courseWithVideos)
    setShowModal(true)
  }

  const handleStatusToggle = async (courseId: string, newStatus: Course['status']) => {
    try {
      const res = await fetch(`${baseURL}/courses/${courseId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        const updatedCourse = await res.json()
        setCourses(prev => prev.map(c =>
          c._id === courseId ? { ...c, ...updatedCourse } : c
        ))
      }
    } catch (err) {
      console.error('Status update error:', err)
      alert('Failed to update status')
    }
  }

  const handleFeatureToggle = async (courseId: string, isFeatured: boolean) => {
    try {
      const res = await fetch(`${baseURL}/courses/${courseId}/feature`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isFeatured }),
      })

      if (res.ok) {
        const updatedCourse = await res.json()
        setCourses(prev => prev.map(c =>
          c._id === courseId ? { ...c, ...updatedCourse } : c
        ))
      }
    } catch (err) {
      console.error('Feature update error:', err)
      alert('Failed to update feature status')
    }
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!selectedCourse) return
    const { name, value, type } = e.target

    setSelectedCourse(prev => {
      if (!prev) return prev

      if (type === 'checkbox') {
        const checkbox = e.target as HTMLInputElement
        return { ...prev, [name]: checkbox.checked }
      }

      if (name === 'price' || name === 'discountPrice') {
        return { ...prev, [name]: value }
      }

      return { ...prev, [name]: value }
    })
  }

  const handleFeaturesChange = (featuresText: string) => {
    if (!selectedCourse) return
    const features = featuresText.split('\n').filter(f => f.trim())
    setSelectedCourse({ ...selectedCourse, features })
  }

  const handleVideoUrlChange = (urlsText: string) => {
    if (!selectedCourse) return
    const urls = urlsText.split('\n').filter(url => url.trim())
    setSelectedCourse({ ...selectedCourse, videoUrl: urls })
  }

  const handleFAQChange = (index: number, field: keyof FAQ, value: string) => {
    if (!selectedCourse) return
    const newFAQs = [...selectedCourse.addFAQ]
    newFAQs[index] = { ...newFAQs[index], [field]: value }
    setSelectedCourse({ ...selectedCourse, addFAQ: newFAQs })
  }

  const addFAQ = () => {
    if (!selectedCourse) return
    setSelectedCourse({
      ...selectedCourse,
      addFAQ: [...selectedCourse.addFAQ, { question: '', answer: '' }]
    })
  }

  const removeFAQ = (index: number) => {
    if (!selectedCourse) return
    const newFAQs = selectedCourse.addFAQ.filter((_, i) => i !== index)
    setSelectedCourse({ ...selectedCourse, addFAQ: newFAQs })
  }

  const handleQuizChange = (index: number, field: keyof Quiz, value: string | string[]) => {
    if (!selectedCourse) return
    const newQuiz = [...(selectedCourse.quiz || [])]
    newQuiz[index] = { ...newQuiz[index], [field]: value }
    setSelectedCourse({ ...selectedCourse, quiz: newQuiz })
  }

  const handleQuizOptionChange = (quizIndex: number, optionIndex: number, value: string) => {
    if (!selectedCourse) return
    const newQuiz = [...(selectedCourse.quiz || [])]
    const options = [...newQuiz[quizIndex].options]
    const wasCorrect = newQuiz[quizIndex].correctAnswer === options[optionIndex]
    options[optionIndex] = value
    newQuiz[quizIndex] = {
      ...newQuiz[quizIndex],
      options,
      correctAnswer: wasCorrect ? value : newQuiz[quizIndex].correctAnswer,
    }
    setSelectedCourse({ ...selectedCourse, quiz: newQuiz })
  }

  const addQuiz = () => {
    if (!selectedCourse) return
    const newQuestion: Quiz = { question: '', options: ['', '', '', ''], correctAnswer: '' }
    setSelectedCourse({ ...selectedCourse, quiz: [...(selectedCourse.quiz || []), newQuestion] })
  }

  const removeQuiz = (index: number) => {
    if (!selectedCourse) return
    setSelectedCourse({ ...selectedCourse, quiz: (selectedCourse.quiz || []).filter((_, i) => i !== index) })
  }

  const addQuizOption = (quizIndex: number) => {
    if (!selectedCourse) return
    const newQuiz = [...(selectedCourse.quiz || [])]
    newQuiz[quizIndex] = { ...newQuiz[quizIndex], options: [...newQuiz[quizIndex].options, ''] }
    setSelectedCourse({ ...selectedCourse, quiz: newQuiz })
  }

  const removeQuizOption = (quizIndex: number, optionIndex: number) => {
    if (!selectedCourse) return
    const newQuiz = [...(selectedCourse.quiz || [])]
    const options = newQuiz[quizIndex].options.filter((_, i) => i !== optionIndex)
    const correctAnswer = newQuiz[quizIndex].correctAnswer === newQuiz[quizIndex].options[optionIndex]
      ? '' : newQuiz[quizIndex].correctAnswer
    newQuiz[quizIndex] = { ...newQuiz[quizIndex], options, correctAnswer }
    setSelectedCourse({ ...selectedCourse, quiz: newQuiz })
  }



  const getStatusBadge = (course: Course) => {
    if (course.isFeatured) {
      return <Badge bg="warning" className="rounded-pill px-3">Featured</Badge>
    }

    const status = course.status || 'Draft'
    const variants = {
      'Published': 'success',
      'Draft': 'warning',
      'Archived': 'secondary'
    }
    return <Badge bg={variants[status] || 'secondary'} className="rounded-pill px-3">{status}</Badge>
  }

  const getLevelBadge = (level?: string[] | string) => {
    if (!level) return null

    const levelText = Array.isArray(level) ? level[0] : level
    const variants = {
      'Beginner': 'info',
      'Intermediate': 'primary',
      'Advanced': 'danger',
      'All level': 'secondary'
    }
    return <Badge bg={variants[levelText as keyof typeof variants] || 'secondary'} className="ms-2">{levelText}</Badge>
  }

  const getCategoryText = (category: string[] | string) => {
    return Array.isArray(category) ? category.join(', ') : category
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCourses = filteredCourses.slice(startIndex, startIndex + itemsPerPage)

  return (
    <>
      <PageMetaData title="Course Management" />

      {/* Edit Course Modal */}
      <EditCourseModal
        show={showModal}
        onHide={() => { setShowModal(false); setSelectedCourse(null) }}
        selectedCourse={selectedCourse}
        onFormChange={handleFormChange}
        onFeaturesChange={handleFeaturesChange}
        onVideoUrlChange={handleVideoUrlChange}
        onFAQChange={handleFAQChange}
        onAddFAQ={addFAQ}
        onRemoveFAQ={removeFAQ}
        onUpdate={handleUpdate}
        isUpdating={isUpdating}
        // Add these video management props
        onImageFileSelect={(file) => setImageFile(file)}
        onVideoChange={handleVideoChange}
        onAddVideo={handleAddVideo}
        onRemoveVideo={handleRemoveVideo}
        onUploadVideo={handleUploadVideo}
        onQuizChange={handleQuizChange}
        onQuizOptionChange={handleQuizOptionChange}
        onAddQuiz={addQuiz}
        onRemoveQuiz={removeQuiz}
        onAddQuizOption={addQuizOption}
        onRemoveQuizOption={removeQuizOption}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => { setShowDeleteModal(false); setDeleteConfirm('') }}
        courseToDelete={courseToDelete}
        onDelete={handleDelete}
        isDeleting={isUpdating}
      />

      <Card className="border-0 bg-transparent rounded-3 shadow-sm">
        <CardHeader className="bg-dark border-bottom d-flex justify-content-between align-items-center py-3">
          <div>
            <h3 className="mb-0 text-white fw-semibold">Course Management</h3>
            <p className="mb-0 text-white-50 small">Manage and organize your course catalog</p>
          </div>

          <div className="d-flex gap-2">
            <Button
              variant="outline-light"
              size="sm"
              className="d-flex align-items-center gap-2 px-3"
              onClick={fetchCourses}
              disabled={isLoading}
            >
              <FaSearch />
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="d-flex align-items-center gap-2 px-3"
              onClick={() => window.open('/instructor/create-course', '_blank')}
            >
              <FaPlus className="fs-5" />
              <span className="fw-semibold">Create New Course</span>
            </Button>
          </div>
        </CardHeader>

        <CardBody className="bg-light">
          {error && (
            <Alert variant="danger" className="d-flex align-items-center">
              <FaExclamationTriangle className="me-2" />
              {error}
              <Button variant="link" onClick={fetchCourses} className="ms-auto p-0">
                Retry
              </Button>
            </Alert>
          )}

          {/* Filters and Search */}
          <Card className="mb-4 border">
            <CardBody>
              <Row className="g-3 align-items-center">
                <Col md={4}>
                  <Form.Group>
                    <Form.Label className="small text-muted mb-1">
                      <FaSearch className="me-1" />
                      Search Courses
                    </Form.Label>
                    <div className="input-group">
                      <Form.Control
                        type="search"
                        placeholder="Search by title, category, or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-white"
                      />
                      {searchTerm && (
                        <Button
                          variant="outline-secondary"
                          onClick={() => setSearchTerm('')}
                        >
                          <FaTimes />
                        </Button>
                      )}
                    </div>
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small text-muted mb-1">
                      <FaFilter className="me-1" />
                      Filter by Status
                    </Form.Label>
                    <Form.Select
                      value={filterBy}
                      onChange={(e) => setFilterBy(e.target.value as FilterOption)}
                      className="bg-white"
                    >
                      <option value="all">All Courses</option>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                      <option value="featured">Featured</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label className="small text-muted mb-1">
                      <FaSort className="me-1" />
                      Sort by
                    </Form.Label>
                    <Form.Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="bg-white"
                    >
                      <option value="newest">Newest First</option>
                      <option value="popular">Most Popular</option>
                      <option value="alphabetical">Alphabetical</option>
                      <option value="price-low-high">Price: Low to High</option>
                      <option value="price-high-low">Price: High to Low</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={2} className="d-flex align-items-end">
                  <Badge bg="info" className="rounded-pill px-3 py-2">
                    {filteredCourses.length} courses found
                  </Badge>
                </Col>
              </Row>
            </CardBody>
          </Card>

          {/* Courses Table */}
          <div className="table-responsive rounded border">
            {isLoading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3 text-muted">Loading courses...</p>
              </div>
            ) : paginatedCourses.length === 0 ? (
              <div className="text-center py-5">
                <FaSearch className="display-1 text-muted mb-3" />
                <h5>No courses found</h5>
                <p className="text-muted">
                  {searchTerm ? 'Try a different search term' : 'Create your first course to get started'}
                </p>
                {searchTerm && (
                  <Button variant="outline-primary" onClick={() => setSearchTerm('')}>
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <table className="table table-hover align-middle mb-0">
                <thead className="table-dark">
                  <tr>
                    <th scope="col" className="ps-4">Course</th>
                    <th scope="col">Category</th>
                    <th scope="col">Status</th>
                    <th scope="col">Students</th>
                    <th scope="col">Price</th>
                    <th scope="col" className="text-end pe-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCourses.map((course) => (
                    <tr key={course._id} className="hover-shadow">
                      <td className="ps-4">
                        <div className="d-flex align-items-center">
                          <div className="rounded overflow-hidden" style={{ width: '60px', height: '60px' }}>
                            <img
                              src={course.image ||
                                `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(course.title)}&backgroundColor=4a90e2`
                              }
                              alt={course.title}
                              className="img-fluid h-100 w-100 object-fit-cover"
                              onError={(e) => {
                                e.currentTarget.onerror = null
                                e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(course.title)}&backgroundColor=4a90e2`
                              }}
                            />
                          </div>
                          <div className="ms-3">
                            <h6 className="mb-1">{course.title}</h6>
                            <div className="d-flex align-items-center text-muted small">
                              <FaTable className="me-1" />
                              <span className="me-3">{course.videos.length} videos</span>
                              <FaClock className="me-1" />
                              <span>{course.duration || 'N/A'}</span>
                              {getLevelBadge(course.level)}
                            </div>
                            {course.isFeatured && (
                              <Badge bg="warning" className="mt-1">Featured</Badge>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-white text-dark">{getCategoryText(course.category)}</span>
                      </td>
                      <td>{getStatusBadge(course)}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <FaChartBar className="text-primary me-2" />
                          {course.enrolledStudents || 0}
                        </div>
                      </td>
                      <td>
                        {course.price && course.price !== '' ? (
                          <div>
                            <span className="fw-bold">
                              <FaDollarSign className="small" />
                              {course.discountPrice || course.price}
                            </span>
                            {course.discountPrice && (
                              <div className="text-muted small text-decoration-line-through">
                                ${course.price}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Badge bg="success">Free</Badge>
                        )}
                      </td>
                      <td className="text-end pe-4">
                        <Dropdown>
                          <Dropdown.Toggle variant="light" size="sm" className="px-3">
                            <FaEllipsisV />
                          </Dropdown.Toggle>
                          <Dropdown.Menu>
                            <Dropdown.Item onClick={() => handleEdit(course)}>
                              <FaRegEdit className="me-2" />
                              Edit Details
                            </Dropdown.Item>
                            <Dropdown.Item onClick={() => navigate(`/course/${course._id}`)}>
                              <FaEye className="me-2" />
                              Preview
                            </Dropdown.Item>
                            <Dropdown.Divider />
                            <Dropdown.Item
                              onClick={() => handleFeatureToggle(course._id, !course.isFeatured)}
                            >
                              {course.isFeatured ? (
                                <>
                                  <FaToggleOff className="me-2" />
                                  Remove from Featured
                                </>
                              ) : (
                                <>
                                  <FaToggleOn className="me-2" />
                                  Mark as Featured
                                </>
                              )}
                            </Dropdown.Item>
                            {course.status === 'Published' ? (
                              <Dropdown.Item
                                onClick={() => handleStatusToggle(course._id, 'Draft')}
                              >
                                <FaTimes className="me-2" />
                                Unpublish
                              </Dropdown.Item>
                            ) : (
                              <Dropdown.Item
                                onClick={() => handleStatusToggle(course._id, 'Published')}
                              >
                                <FaCheckCircle className="me-2" />
                                Publish
                              </Dropdown.Item>
                            )}
                            <Dropdown.Divider />
                            <Dropdown.Item
                              className="text-danger"
                              onClick={() => {
                                setCourseToDelete(course)
                                setShowDeleteModal(true)
                              }}
                            >
                              <FaTrash className="me-2" />
                              Delete Course
                            </Dropdown.Item>
                          </Dropdown.Menu>
                        </Dropdown>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {filteredCourses.length > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-4">
              <div className="text-muted">
                Showing <strong>{startIndex + 1}</strong> to{' '}
                <strong>{Math.min(startIndex + itemsPerPage, filteredCourses.length)}</strong>{' '}
                of <strong>{filteredCourses.length}</strong> courses
              </div>
              <nav>
                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <Button
                      variant="light"
                      className="page-link"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    >
                      <FaAngleLeft />
                    </Button>
                  </li>
                  {[...Array(totalPages)].map((_, i) => (
                    <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                      <Button
                        variant="light"
                        className="page-link"
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    </li>
                  ))}
                  <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <Button
                      variant="light"
                      className="page-link"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    >
                      <FaAngleRight />
                    </Button>
                  </li>
                </ul>
              </nav>
            </div>
          )}

          {/* Quick Stats */}
          {!isLoading && courses.length > 0 && (
            <Row className="mt-4 g-3">
              <Col md={3}>
                <Card className="border">
                  <CardBody className="py-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-0">Total Courses</h6>
                        <p className="text-muted small mb-0">All time</p>
                      </div>
                      <Badge bg="primary" className="fs-5 px-3">
                        {courses.length}
                      </Badge>
                    </div>
                  </CardBody>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border">
                  <CardBody className="py-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-0">Published</h6>
                        <p className="text-muted small mb-0">Live courses</p>
                      </div>
                      <Badge bg="success" className="fs-5 px-3">
                        {courses.filter(c => c.status === 'Published').length}
                      </Badge>
                    </div>
                  </CardBody>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border">
                  <CardBody className="py-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-0">Featured</h6>
                        <p className="text-muted small mb-0">Highlighted</p>
                      </div>
                      <Badge bg="warning" className="fs-5 px-3">
                        {courses.filter(c => c.isFeatured).length}
                      </Badge>
                    </div>
                  </CardBody>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border">
                  <CardBody className="py-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-0">Total Videos</h6>
                        <p className="text-muted small mb-0">Across all courses</p>
                      </div>
                      <Badge bg="info" className="fs-5 px-3">
                        {courses.reduce((acc, course) => acc + course.videos.length, 0)}
                      </Badge>
                    </div>
                  </CardBody>
                </Card>
              </Col>
            </Row>
          )}
        </CardBody>
      </Card>
    </>
  )
}

export default ManageCoursePage