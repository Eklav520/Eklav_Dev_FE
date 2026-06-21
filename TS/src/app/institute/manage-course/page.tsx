// ManageCoursePage.tsx
import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import PageMetaData from '@/components/PageMetaData'
import EditCourseModal from './EditCourseModal'
import DeleteConfirmationModal from './DeleteConfirmationModal'
import { Spinner, Dropdown } from 'react-bootstrap'
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
  FaEllipsisV,
  FaToggleOn,
  FaToggleOff,
  FaExclamationTriangle
} from 'react-icons/fa'
import { FaAngleLeft, FaClock, FaChartBar } from 'react-icons/fa6'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/context/useAuthContext'

interface Video {
  _id: string
  video: string
  description: string
  caseStudy?: string | null
  progress?: number
}

interface FAQ {
  question: string
  answer: string
}

interface Quiz {
  question: string
  options: string[]
  answer: string
}

interface Course {
  _id: string
  title: string
  shortDescription?: string
  category: string[] | string
  level?: string[] | string
  language?: string[] | string
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
  // Add these state variables near your other state declarations
  const [videos, setVideos] = useState<Video[]>([])
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { user } = useAuthContext();
  const token = user?.token;

  // Add these video handlers inside your ManageCoursePage component

  // Handle video change (description or URL)
  const handleVideoChange = (index: number, field: keyof Video, value: string) => {
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


  // Upload video function - UPDATED VERSION
  const handleUploadVideo = async (file: File, description: string): Promise<void> => {
    if (!selectedCourse) {
      throw new Error('No course selected')
    }

    setUploadingVideo(true)
    setUploadProgress(0)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('video', file)
      formData.append('description', description)
      formData.append('courseId', selectedCourse._id)

      // Generate a unique videoKey (required by backend)
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const videoKey = `course_${selectedCourse._id}_${timestamp}_${randomString}_${safeFileName}`
      formData.append('videoKey', videoKey)

      // Optional: Add additional metadata
      formData.append('fileName', file.name)
      formData.append('fileType', file.type)
      formData.append('fileSize', file.size.toString())

      // Debug: Log FormData contents
      console.log('Uploading video with data:')
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value)
      }

      // Simulate upload progress
      const simulateProgress = () => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }

      const progressInterval = setInterval(simulateProgress, 200)

      // API call
      const res = await fetch(`${baseURL}/courses/${selectedCourse._id}/video`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      })

      clearInterval(progressInterval)

      if (!res.ok) {
        let errorMessage = 'Failed to upload video'
        try {
          const errorData = await res.json()
          errorMessage = errorData.message || errorMessage
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = res.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const data = await res.json()
      console.log('Upload response:', data)
      setUploadProgress(100)

      // Add the new video to the course
      const newVideo: Video = {
        _id: data._id || `video-${timestamp}`,
        video: data.url || data.video || data.videoUrl || data.path || '',
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
      // Prepare data for API - include videos
      const updateData = {
        ...selectedCourse,
        // Ensure array fields are properly formatted
        category: Array.isArray(selectedCourse.category) ? selectedCourse.category : [selectedCourse.category],
        level: Array.isArray(selectedCourse.level) ? selectedCourse.level : [selectedCourse.level || 'All level'],
        language: Array.isArray(selectedCourse.language) ? selectedCourse.language : [selectedCourse.language || 'English'],
        price: selectedCourse.price || '',
        discountPrice: selectedCourse.discountPrice || '',
        isFeatured: selectedCourse.isFeatured || false,
        features: selectedCourse.features || [],
        videoUrl: selectedCourse.videoUrl || [],
        videos: selectedCourse.videos || [], // Include videos
        // Ensure empty strings for optional fields
        shortDescription: selectedCourse.shortDescription || '',
        description: selectedCourse.description || '',
        image: selectedCourse.image || '',
        previewVideo: selectedCourse.previewVideo || '',
        duration: selectedCourse.duration || '',
        totalLectures: selectedCourse.totalLectures || '',
        enrolledStudents: selectedCourse.enrolledStudents || 0,
        rating: selectedCourse.rating || 0
      }

      const res = await fetch(`${baseURL}/courses/${selectedCourse._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      const data = await res.json()
      if (res.ok) {
        setCourses(prev => prev.map(c =>
          c._id === selectedCourse._id ? data.course || data : c
        ))
        setShowModal(false)
        setSelectedCourse(null)
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



  const getCategoryText = (category: string[] | string) => {
    return Array.isArray(category) ? category.join(', ') : category
  }

  // Pagination calculations
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCourses = filteredCourses.slice(startIndex, startIndex + itemsPerPage)

  const totalVideos = courses.reduce((acc, c) => acc + c.videos.length, 0)
  const publishedCount = courses.filter(c => c.status === 'Published').length
  const featuredCount = courses.filter(c => c.isFeatured).length
  const draftCount = courses.filter(c => c.status === 'Draft').length

  return (
    <>
      <PageMetaData title="Course Management" />

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
        onVideoChange={handleVideoChange}
        onAddVideo={handleAddVideo}
        onRemoveVideo={handleRemoveVideo}
        onUploadVideo={handleUploadVideo}
      />

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => { setShowDeleteModal(false); setDeleteConfirm('') }}
        courseToDelete={courseToDelete}
        onDelete={handleDelete}
        isDeleting={isUpdating}
      />

      <div className="mc-page">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div>
            <h5 className="text-white fw-semibold mb-0">Course Management</h5>
            <p className="text-muted small mb-0">Manage and organise your course catalog</p>
          </div>
          <div className="d-flex gap-2">
            <button className="mc-btn-outline" onClick={fetchCourses} disabled={isLoading}>
              <FaSearch size={12} className="me-1" /> Refresh
            </button>
            <button className="mc-btn-primary" onClick={() => window.open('/instructor/create-course', '_blank')}>
              <FaPlus size={12} className="me-1" /> Create Course
            </button>
          </div>
        </div>

        {/* Stat pills + search on same row */}
        <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
          {[
            { label: 'Total',     value: courses.length,  color: '#ff8c00', bg: 'rgba(255,140,0,0.08)',   border: 'rgba(255,140,0,0.25)' },
            { label: 'Published', value: publishedCount,  color: '#198754', bg: 'rgba(25,135,84,0.08)',   border: 'rgba(25,135,84,0.25)' },
            { label: 'Draft',     value: draftCount,      color: '#ffc107', bg: 'rgba(255,193,7,0.08)',   border: 'rgba(255,193,7,0.25)' },
            { label: 'Featured',  value: featuredCount,   color: '#0dcaf0', bg: 'rgba(13,202,240,0.08)',  border: 'rgba(13,202,240,0.25)' },
            { label: 'Videos',    value: totalVideos,     color: '#6f42c1', bg: 'rgba(111,66,193,0.08)',  border: 'rgba(111,66,193,0.25)' },
          ].map(({ label, value, color, bg, border }) => (
            <div key={label} className="mc-stat-pill flex-shrink-0" style={{ background: bg, border: `1px solid ${border}` }}>
              <span className="fw-bold" style={{ color, fontSize: '1rem' }}>{value}</span>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>{label}</span>
            </div>
          ))}
          <div className="position-relative flex-grow-1" style={{ minWidth: 180 }}>
            <FaSearch className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" size={12} />
            <input
              type="text"
              className="mc-search"
              placeholder="Search by title, category, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="position-absolute top-50 end-0 translate-middle-y me-2 border-0 bg-transparent text-muted"
                onClick={() => setSearchTerm('')}
                style={{ lineHeight: 1 }}
              >
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Filter bar — single line */}
        <div className="mc-filter-bar mb-4">
          <select className="mc-select" value={filterBy} onChange={(e) => setFilterBy(e.target.value as FilterOption)}>
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
            <option value="featured">Featured</option>
          </select>
          <select className="mc-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="price-low-high">Price: Low → High</option>
            <option value="price-high-low">Price: High → Low</option>
          </select>
          <span className="text-muted small ms-auto flex-shrink-0">
            {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="mc-error mb-3">
            <FaExclamationTriangle className="me-2" />
            {error}
            <button className="mc-btn-outline ms-auto" onClick={fetchCourses}>Retry</button>
          </div>
        )}

        {/* Table */}
        <div className="mc-table-wrap">
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" style={{ color: '#ff8c00' }} />
              <p className="mt-3 text-muted small">Loading courses...</p>
            </div>
          ) : paginatedCourses.length === 0 ? (
            <div className="text-center py-5">
              <FaSearch size={36} className="mb-3 text-muted opacity-25 d-block mx-auto" />
              <p className="text-muted mb-2">No courses found</p>
              <p className="text-muted small">
                {searchTerm ? 'Try a different search term' : 'Create your first course to get started'}
              </p>
              {searchTerm && (
                <button className="mc-btn-outline mt-2" onClick={() => setSearchTerm('')}>Clear Search</button>
              )}
            </div>
          ) : (
            <table className="mc-table">
              <thead>
                <tr>
                  <th className="ps-3">#</th>
                  <th>Course</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Students</th>
                  <th>Price</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCourses.map((course, idx) => (
                  <tr key={course._id}>
                    <td className="ps-3 text-muted small">{startIndex + idx + 1}</td>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div className="mc-thumb">
                          <img
                            src={course.image || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(course.title)}&backgroundColor=2a2a2a`}
                            alt={course.title}
                            onError={(e) => {
                              e.currentTarget.onerror = null
                              e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(course.title)}&backgroundColor=2a2a2a`
                            }}
                          />
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-white fw-medium text-truncate" style={{ maxWidth: 260 }}>{course.title}</div>
                          <div className="d-flex align-items-center gap-2 mt-1">
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                              <FaTable size={10} className="me-1" />{course.videos.length} videos
                            </span>
                            {course.duration && (
                              <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                <FaClock size={10} className="me-1" />{course.duration}
                              </span>
                            )}
                            {course.isFeatured && (
                              <span className="mc-badge-warning">Featured</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="mc-badge-secondary">{getCategoryText(course.category)}</span>
                    </td>
                    <td>
                      {(() => {
                        const s = course.status || 'Draft'
                        const cls = s === 'Published' ? 'mc-badge-success' : s === 'Archived' ? 'mc-badge-secondary' : 'mc-badge-warning'
                        return <span className={cls}>{s}</span>
                      })()}
                    </td>
                    <td>
                      <span className="text-white small">
                        <FaChartBar size={11} className="me-1 text-muted" />
                        {course.enrolledStudents || 0}
                      </span>
                    </td>
                    <td>
                      {course.price && course.price !== '' ? (
                        <div>
                          <span className="text-white fw-medium small">
                            ₹{course.discountPrice || course.price}
                          </span>
                          {course.discountPrice && (
                            <div className="text-muted text-decoration-line-through" style={{ fontSize: '0.72rem' }}>
                              ₹{course.price}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="mc-badge-success">Free</span>
                      )}
                    </td>
                    <td className="text-center">
                      <Dropdown>
                        <Dropdown.Toggle as="button" className="mc-action-btn">
                          <FaEllipsisV size={13} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className="mc-dropdown-menu">
                          <Dropdown.Item className="mc-dropdown-item" onClick={() => handleEdit(course)}>
                            <FaRegEdit size={12} className="me-2 text-muted" /> Edit Details
                          </Dropdown.Item>
                          <Dropdown.Item className="mc-dropdown-item" onClick={() => navigate(`/course/${course._id}`)}>
                            <FaEye size={12} className="me-2 text-muted" /> Preview
                          </Dropdown.Item>
                          <Dropdown.Divider className="mc-divider" />
                          <Dropdown.Item className="mc-dropdown-item" onClick={() => handleFeatureToggle(course._id, !course.isFeatured)}>
                            {course.isFeatured
                              ? <><FaToggleOff size={12} className="me-2 text-muted" /> Remove Featured</>
                              : <><FaToggleOn size={12} className="me-2 text-muted" /> Mark as Featured</>}
                          </Dropdown.Item>
                          {course.status === 'Published' ? (
                            <Dropdown.Item className="mc-dropdown-item" onClick={() => handleStatusToggle(course._id, 'Draft')}>
                              <FaTimes size={12} className="me-2 text-muted" /> Unpublish
                            </Dropdown.Item>
                          ) : (
                            <Dropdown.Item className="mc-dropdown-item" onClick={() => handleStatusToggle(course._id, 'Published')}>
                              <FaCheckCircle size={12} className="me-2 text-muted" /> Publish
                            </Dropdown.Item>
                          )}
                          <Dropdown.Divider className="mc-divider" />
                          <Dropdown.Item className="mc-dropdown-item mc-dropdown-danger" onClick={() => { setCourseToDelete(course); setShowDeleteModal(true) }}>
                            <FaTrash size={12} className="me-2" /> Delete
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
        {totalPages > 1 && (
          <div className="mc-pagination">
            <span className="text-muted small">
              {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filteredCourses.length)} of {filteredCourses.length}
            </span>
            <div className="d-flex gap-1">
              <button className="mc-page-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                <FaAngleLeft size={12} />
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  className={`mc-page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button className="mc-page-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                <FaAngleRight size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .mc-page { color: #e0e0e0; }

        .mc-btn-primary {
          background: #ff8c00; border: none; color: #fff;
          padding: 7px 14px; border-radius: 8px; font-size: 0.82rem;
          font-weight: 600; cursor: pointer; display: flex; align-items: center;
          transition: background 0.2s;
        }
        .mc-btn-primary:hover { background: #e67e00; }
        .mc-btn-outline {
          background: transparent; border: 1px solid #444; color: #ccc;
          padding: 7px 14px; border-radius: 8px; font-size: 0.82rem;
          cursor: pointer; display: flex; align-items: center;
          transition: border-color 0.2s, color 0.2s;
        }
        .mc-btn-outline:hover { border-color: #ff8c00; color: #ff8c00; }
        .mc-btn-outline:disabled { opacity: 0.4; cursor: not-allowed; }

        .mc-stat-pill {
          display: flex; align-items: center; gap: 6px;
          border-radius: 8px; padding: 5px 12px;
          transition: transform 0.15s;
        }
        .mc-stat-pill:hover { transform: translateY(-1px); }

        .mc-search {
          width: 100%; height: 36px; padding: 0 32px 0 36px;
          background: #1e1e1e; border: 1px solid #333; border-radius: 8px;
          color: #e0e0e0; font-size: 0.83rem; outline: none;
          transition: border-color 0.2s;
        }
        .mc-search:focus { border-color: rgba(255,140,0,0.5); }
        .mc-search::placeholder { color: #555; }

        .mc-filter-bar {
          display: flex; align-items: center; gap: 8px;
          background: #1a1a1a; border: 1px solid #2a2a2a;
          border-radius: 10px; padding: 8px 14px;
          flex-wrap: nowrap; overflow-x: auto;
        }
        .mc-select {
          background: #252525; border: 1px solid #333; color: #e0e0e0;
          border-radius: 7px; padding: 5px 10px; font-size: 0.82rem;
          outline: none; cursor: pointer; flex-shrink: 0;
        }
        .mc-select:focus { border-color: rgba(255,140,0,0.5); }

        .mc-error {
          display: flex; align-items: center;
          background: rgba(220,53,69,0.1); border: 1px solid rgba(220,53,69,0.3);
          border-radius: 8px; padding: 10px 14px; color: #f8d7da; font-size: 0.85rem;
        }

        .mc-table-wrap {
          background: #1a1a1a; border: 1px solid #2a2a2a;
          border-radius: 12px; overflow: visible;
          position: relative;
        }
        .mc-table { width: 100%; border-collapse: collapse; }
        .mc-table thead tr { background: #141414; border-bottom: 2px solid #2a2a2a; }
        .mc-table th {
          padding: 11px 14px; font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.6px; text-transform: uppercase; color: #6c757d;
        }
        .mc-table tbody tr { border-bottom: 1px solid #222; transition: background 0.15s; }
        .mc-table tbody tr:last-child { border-bottom: none; }
        .mc-table tbody tr:hover { background: #1e1e1e; }
        .mc-table td { padding: 12px 14px; vertical-align: middle; }

        .mc-thumb {
          width: 50px; height: 50px; border-radius: 8px;
          overflow: hidden; flex-shrink: 0; background: #2a2a2a;
        }
        .mc-thumb img { width: 100%; height: 100%; object-fit: cover; }

        .mc-badge-success {
          background: rgba(25,135,84,0.15); border: 1px solid rgba(25,135,84,0.3);
          color: #20c374; border-radius: 20px; padding: 2px 10px; font-size: 0.72rem; font-weight: 600;
        }
        .mc-badge-warning {
          background: rgba(255,193,7,0.12); border: 1px solid rgba(255,193,7,0.3);
          color: #ffc107; border-radius: 20px; padding: 2px 10px; font-size: 0.72rem; font-weight: 600;
        }
        .mc-badge-secondary {
          background: rgba(108,117,125,0.12); border: 1px solid rgba(108,117,125,0.25);
          color: #adb5bd; border-radius: 20px; padding: 2px 10px; font-size: 0.72rem; font-weight: 600;
        }

        .mc-action-btn {
          background: #252525; border: 1px solid #333; color: #ccc;
          width: 32px; height: 32px; border-radius: 8px; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          transition: border-color 0.15s, color 0.15s;
        }
        .mc-action-btn:hover { border-color: #ff8c00; color: #ff8c00; }
        .mc-action-btn::after { display: none !important; }

        .mc-dropdown-menu {
          background: #1e1e1e !important; border: 1px solid #333 !important;
          border-radius: 10px !important; padding: 6px !important;
          min-width: 180px; box-shadow: 0 12px 32px rgba(0,0,0,0.5) !important;
          z-index: 9999 !important;
        }
        .mc-dropdown-item {
          color: #ccc !important; font-size: 0.83rem !important;
          padding: 7px 12px !important; border-radius: 6px !important;
          display: flex; align-items: center;
          transition: background 0.15s !important;
        }
        .mc-dropdown-item:hover { background: #2a2a2a !important; color: #fff !important; }
        .mc-dropdown-danger { color: #f87171 !important; }
        .mc-dropdown-danger:hover { background: rgba(220,53,69,0.12) !important; }
        .mc-divider { border-color: #2a2a2a !important; margin: 4px 0 !important; }

        .mc-pagination {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: 1.25rem; padding: 10px 16px;
          background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 10px;
        }
        .mc-page-btn {
          min-width: 34px; height: 34px; background: #252525;
          border: 1px solid #333; color: #ccc; border-radius: 7px;
          font-size: 0.8rem; cursor: pointer; display: flex;
          align-items: center; justify-content: center; padding: 0 8px;
          transition: all 0.15s;
        }
        .mc-page-btn:hover:not(:disabled) { background: #ff8c00; border-color: #ff8c00; color: #fff; }
        .mc-page-btn.active { background: #ff8c00; border-color: #ff8c00; color: #fff; }
        .mc-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
      `}</style>
    </>
  )
}

export default ManageCoursePage