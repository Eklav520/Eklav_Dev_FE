// ManageCoursePage.tsx
import ChoicesFormInput from '@/components/form/ChoicesFormInput'
import PageMetaData from '@/components/PageMetaData'
import EditCourseModal from './EditCourseModal'
import DeleteConfirmationModal from './DeleteConfirmationModal'
import InstituteAccessModal from './InstituteAccessModal'
import { Dropdown } from 'react-bootstrap'
import { AdminPage, PageHeader, StatCards, SearchInput, AdminSelect, TableFooter, EmptyState, type SelectOption } from '@/components/admin-ui'
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
  FaExclamationTriangle,
  FaBuilding,
  FaBookOpen,
  FaSyncAlt,
  FaLayerGroup,
  FaStar,
  FaPlayCircle,
  FaUsers,
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
  language?: string
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
  allowedInstitutes?: string[]
}

type SortOption = 'newest' | 'popular' | 'alphabetical' | 'price-low-high' | 'price-high-low'
type FilterOption = 'all' | 'published' | 'draft' | 'archived' | 'featured'

const STATUS_FILTERS: SelectOption[] = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
  { value: 'featured', label: 'Featured' },
]
const SORT_OPTIONS: SelectOption[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'price-low-high', label: 'Price: Low → High' },
  { value: 'price-high-low', label: 'Price: High → Low' },
]

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
  const [showAccessModal, setShowAccessModal] = useState(false)
  const [accessCourse, setAccessCourse] = useState<Course | null>(null)
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


  // Upload video via presigned S3 POST — bypasses Nginx, no server memory used
  const handleUploadVideo = async (
    file: File,
    description: string,
    onProgress: (loaded: number, total: number) => void
  ): Promise<void> => {
    if (!selectedCourse) throw new Error('No course selected')

    try {
      // Step 1: Get presigned POST URL from backend
      const presignRes = await fetch(`${baseURL}/s3/presign/course`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || 'video/mp4',
          courseTitle: selectedCourse.title,
          assetType: 'video',
        }),
      })
      if (!presignRes.ok) throw new Error('Failed to get upload URL')
      const presignData = await presignRes.json()

      if (!presignData.key || !presignData.uploadUrl || !presignData.fields) {
        throw new Error('Invalid presign response from server')
      }

      // Step 2: Upload directly to S3 with real progress (XHR)
      const s3Key: string = await new Promise((resolve, reject) => {
        const formData = new FormData()
        Object.entries(presignData.fields as Record<string, string>).forEach(([k, v]) =>
          formData.append(k, v)
        )
        formData.append('file', file)

        const xhr = new XMLHttpRequest()
        xhr.open('POST', presignData.uploadUrl)
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(e.loaded, e.total)
        }
        xhr.onload = () => {
          if (xhr.status === 204 || xhr.status === 201 || xhr.status === 200) {
            resolve(presignData.key)
          } else {
            reject(new Error(`S3 upload failed with status ${xhr.status}: ${xhr.responseText}`))
          }
        }
        xhr.onerror = () => reject(new Error('S3 upload network error'))
        xhr.send(formData)
      })

      if (!s3Key) throw new Error('S3 key missing after upload')

      // Step 3: Register the S3 key with the course
      const res = await fetch(`${baseURL}/courses/${selectedCourse._id}/video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ key: s3Key, description }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Failed to register video')
      }

      const data = await res.json()
      onProgress(file.size, file.size) // 100%

      const timestamp = Date.now()
      const newVideo: Video = {
        _id: data._id || `video-${timestamp}`,
        video: data.url || data.video || '',
        description,
        progress: 0
      }

      setSelectedCourse({
        ...selectedCourse,
        videos: [...selectedCourse.videos, newVideo]
      })

      setCourses(prev => prev.map(course =>
        course._id === selectedCourse._id
          ? { ...course, videos: [...course.videos, newVideo] }
          : course
      ))

      setTimeout(() => {
        alert('Video uploaded successfully!')
      }, 500)

    } catch (error) {
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

  // Saves a single case study inline — avoids stale closure on handleUpdate
  const handleSaveCaseStudy = async (videoIndex: number, caseStudy: CaseStudy) => {
    if (!selectedCourse) return
    const updatedVideos = selectedCourse.videos.map((v, i) =>
      i === videoIndex ? { ...v, caseStudy } : v
    )
    const updatedCourse = { ...selectedCourse, videos: updatedVideos }
    setSelectedCourse(updatedCourse)

    setIsUpdating(true)
    try {
      const formData = new FormData()
      const stringFields = [
        'title', 'shortDescription', 'description', 'duration', 'totalLectures',
        'previewVideo', 'visibility', 'courseType', 'courseStatus', 'status'
      ] as const
      stringFields.forEach(f => formData.append(f, String(updatedCourse[f] ?? '')))
      formData.append('price', String(updatedCourse.price ?? ''))
      formData.append('discountPrice', String(updatedCourse.discountPrice ?? ''))
      formData.append('isFeatured', String(updatedCourse.isFeatured ?? false))
      formData.append('enrolledStudents', String(updatedCourse.enrolledStudents ?? 0))
      formData.append('rating', String(updatedCourse.rating ?? 0))
      formData.append('category', JSON.stringify(
        Array.isArray(updatedCourse.category) ? updatedCourse.category : [updatedCourse.category]
      ))
      formData.append('level', JSON.stringify(
        Array.isArray(updatedCourse.level) ? updatedCourse.level : [updatedCourse.level || 'All level']
      ))
      formData.append('language', JSON.stringify(
        Array.isArray(updatedCourse.language) ? updatedCourse.language : [updatedCourse.language || 'English']
      ))
      formData.append('features', JSON.stringify(updatedCourse.features || []))
      formData.append('addFAQ', JSON.stringify(updatedCourse.addFAQ || []))
      formData.append('quiz', JSON.stringify(updatedCourse.quiz || []))
      formData.append('videoUrl', JSON.stringify(updatedCourse.videoUrl || []))
      formData.append('existingVideos', JSON.stringify(updatedVideos))
      if (imageFile) formData.append('image', imageFile)

      const res = await fetch(`${baseURL}/courses/${updatedCourse._id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        setCourses(prev => prev.map(c =>
          c._id === updatedCourse._id ? data.course || data : c
        ))
        alert('Case study saved!')
      } else {
        throw new Error(data.message || 'Save failed')
      }
    } catch (err) {
      console.error('Save case study error:', err)
      alert(err instanceof Error ? err.message : 'An error occurred while saving.')
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

  // Only jump back to page 1 when the search/sort/filter criteria actually
  // change — not when `courses` itself changes (e.g. after saving an edit),
  // which was resetting the pager away from whatever page the admin was on.
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, sortBy, filterBy])

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



  const getCategoryText = (category: string[] | string) => {
    return Array.isArray(category) ? category.join(', ') : category
  }

  // Pagination calculations
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCourses = filteredCourses.slice(startIndex, startIndex + itemsPerPage)

  const totalVideos = courses.reduce((acc, c) => acc + c.videos.length, 0)
  const publishedCount = courses.filter(c => c.status === 'Published').length
  const sharedCount = courses.filter(c => (c.allowedInstitutes?.length || 0) > 0).length
  const openAccess = (course: Course) => { setAccessCourse(course); setShowAccessModal(true) }

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
        onSaveCaseStudy={handleSaveCaseStudy}
        isUpdating={isUpdating}
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

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => { setShowDeleteModal(false); setDeleteConfirm('') }}
        courseToDelete={courseToDelete}
        onDelete={handleDelete}
        isDeleting={isUpdating}
      />

      <InstituteAccessModal
        show={showAccessModal}
        course={accessCourse}
        onHide={() => { setShowAccessModal(false); setAccessCourse(null) }}
        onUpdated={(courseId, allowedInstitutes) => {
          setCourses(prev => prev.map(c =>
            c._id === courseId ? { ...c, allowedInstitutes } : c
          ))
        }}
      />

      <AdminPage>
        <PageHeader
          icon={FaBookOpen}
          title="Course Management"
          subtitle="Manage and organise your course catalog"
          stats={
            <StatCards
              inline
              loading={isLoading}
              items={[
                { label: 'Total Courses', value: courses.length, tone: 'orange', icon: FaLayerGroup },
                { label: 'Published', value: publishedCount, tone: 'green', icon: FaCheckCircle },
                { label: 'Videos', value: totalVideos, tone: 'purple', icon: FaPlayCircle },
                { label: 'Shared with Institutes', value: sharedCount, tone: 'blue', icon: FaBuilding },
              ]}
            />
          }
          actions={<>
            <button className="aui-btn" onClick={fetchCourses} disabled={isLoading}>
              <FaSyncAlt size={11} className={isLoading ? 'aui-spin' : ''} /> Refresh
            </button>
            <button className="aui-btn aui-btn-primary" onClick={() => window.open('/instructor/create-course', '_blank')}>
              <FaPlus size={11} /> Create Course
            </button>
          </>}
        />

        {error && (
          <div className="aui-alert">
            <FaExclamationTriangle />
            <span>{error}</span>
            <button className="aui-btn aui-btn-sm ms-auto" onClick={fetchCourses}>Retry</button>
          </div>
        )}

        <div className="aui-card">
          <div className="aui-toolbar">
            <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search by title, category, description..." />
            <div className="aui-toolbar-filters">
              <AdminSelect label="Filter by status" prefix="Status:" value={filterBy} options={STATUS_FILTERS} onChange={value => setFilterBy(value as FilterOption)} />
              <AdminSelect label="Sort courses" prefix="Sort:" value={sortBy} options={SORT_OPTIONS} onChange={value => setSortBy(value as SortOption)} />
              <span className="aui-count">{filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {isLoading ? (
            <div className="aui-empty">
              <FaSyncAlt className="aui-spin" />
              <span>Loading courses…</span>
            </div>
          ) : paginatedCourses.length === 0 ? (
            <EmptyState
              icon={searchTerm ? FaSearch : FaBookOpen}
              title={searchTerm ? `No courses match “${searchTerm}”` : 'No courses yet'}
              text={searchTerm ? 'Try a different search term or clear the filters.' : 'Create your first course to get started.'}
              action={searchTerm
                ? <button className="aui-btn" onClick={() => setSearchTerm('')}>Clear Search</button>
                : <button className="aui-btn aui-btn-primary" onClick={() => window.open('/instructor/create-course', '_blank')}><FaPlus size={11} /> Create Course</button>}
            />
          ) : (
            <>
              <div className="aui-table-scroll">
                <table className="aui-table">
                  <thead>
                    <tr>
                      <th style={{ width: 48 }}>#</th>
                      <th>Course</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Students</th>
                      <th>Institutes</th>
                      <th>Price</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCourses.map((course, idx) => {
                      const status = course.status || 'Draft'
                      return (
                        <tr key={course._id}>
                          <td className="aui-num">{startIndex + idx + 1}</td>
                          <td>
                            <div className="aui-person mc-course">
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
                              <div className="aui-stack">
                                <strong title={course.title} style={{ maxWidth: 300 }}>{course.title}</strong>
                                <small className="mc-course-meta">
                                  <span><FaPlayCircle size={10} /> {course.videos.length} videos</span>
                                  {course.duration && <span><FaClock size={10} /> {course.duration}</span>}
                                  {course.isFeatured && <span className="aui-badge aui-badge-blue"><FaStar size={9} /> Featured</span>}
                                </small>
                              </div>
                            </div>
                          </td>
                          <td><span className="aui-badge aui-badge-muted">{getCategoryText(course.category) || '—'}</span></td>
                          <td>
                            <span className={`aui-badge aui-badge-dot ${status === 'Published' ? 'aui-badge-green' : status === 'Archived' ? 'aui-badge-muted' : 'aui-badge-amber'}`}>
                              {status}
                            </span>
                          </td>
                          <td><span className="aui-inline-icon"><FaUsers /> {course.enrolledStudents || 0}</span></td>
                          <td>
                            {/* Grant-based: students of listed institutes can see and enroll */}
                            <button type="button" className={`mc-access ${(course.allowedInstitutes?.length || 0) > 0 ? 'is-shared' : ''}`} onClick={() => openAccess(course)} title="Manage institute access">
                              <FaBuilding size={10} />
                              {(course.allowedInstitutes?.length || 0) > 0
                                ? `${course.allowedInstitutes!.length} institute${course.allowedInstitutes!.length === 1 ? '' : 's'}`
                                : 'Not shared'}
                            </button>
                          </td>
                          <td>
                            {course.price && course.price !== '' ? (
                              <div className="aui-stack">
                                <strong>₹{course.discountPrice || course.price}</strong>
                                {course.discountPrice && <small><s>₹{course.price}</s></small>}
                              </div>
                            ) : (
                              <span className="aui-badge aui-badge-green">Free</span>
                            )}
                          </td>
                          <td className="text-end">
                            <div className="mc-actions">
                              <button className="aui-icon-btn" title="Edit details" onClick={() => handleEdit(course)}>
                                <FaRegEdit size={12} />
                              </button>
                              <button className="aui-icon-btn" title="Preview course page (opens a new tab)" onClick={() => window.open(`/course/${course._id}`, '_blank', 'noopener')}>
                                <FaEye size={12} />
                              </button>
                              <button className="aui-icon-btn" title="Institute access" onClick={() => openAccess(course)}>
                                <FaBuilding size={12} />
                              </button>
                              <Dropdown align="end">
                                <Dropdown.Toggle as="button" className="aui-icon-btn" title="More actions">
                                  <FaEllipsisV size={11} />
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="mc-dropdown-menu" popperConfig={{ strategy: 'fixed' }} renderOnMount>
                                  <Dropdown.Item className="mc-dropdown-item" onClick={() => handleFeatureToggle(course._id, !course.isFeatured)}>
                                    {course.isFeatured
                                      ? <><FaToggleOff size={12} className="me-2" /> Remove Featured</>
                                      : <><FaToggleOn size={12} className="me-2" /> Mark as Featured</>}
                                  </Dropdown.Item>
                                  {course.status === 'Published' ? (
                                    <Dropdown.Item className="mc-dropdown-item" onClick={() => handleStatusToggle(course._id, 'Draft')}>
                                      <FaTimes size={12} className="me-2" /> Unpublish
                                    </Dropdown.Item>
                                  ) : (
                                    <Dropdown.Item className="mc-dropdown-item" onClick={() => handleStatusToggle(course._id, 'Published')}>
                                      <FaCheckCircle size={12} className="me-2" /> Publish
                                    </Dropdown.Item>
                                  )}
                                  <Dropdown.Divider className="mc-divider" />
                                  <Dropdown.Item className="mc-dropdown-item mc-dropdown-danger" onClick={() => { setCourseToDelete(course); setShowDeleteModal(true) }}>
                                    <FaTrash size={12} className="me-2" /> Delete
                                  </Dropdown.Item>
                                </Dropdown.Menu>
                              </Dropdown>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <TableFooter
                page={currentPage}
                pageSize={itemsPerPage}
                total={filteredCourses.length}
                onPageChange={setCurrentPage}
                noun="courses"
              />
            </>
          )}
        </div>
      </AdminPage>

      <style>{`
        .mc-course { min-width: 260px; }
        .mc-thumb { width: 56px; height: 42px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: #1f1f1f; border: 1px solid #2a2e32; }
        .mc-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .mc-course-meta { display: flex; align-items: center; gap: 10px; }
        .mc-course-meta > span { display: inline-flex; align-items: center; gap: 4px; }
        .mc-actions { display: inline-flex; align-items: center; gap: 6px; }
        .mc-access { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border: 1px solid #3a3e42; border-radius: 99px; background: #1b1e20; color: #9da2a6; font-size: 0.68rem; font-weight: 700; white-space: nowrap; cursor: pointer; transition: border-color 0.15s, color 0.15s; }
        .mc-access:hover { border-color: rgba(255,122,0,0.55); color: #ffb15e; }
        .mc-access.is-shared { border-color: rgba(56,189,248,0.3); background: rgba(56,189,248,0.1); color: #38bdf8; }

        .mc-dropdown-menu {
          background: #17191c !important; border: 1px solid #34383d !important;
          border-radius: 9px !important; padding: 0.35rem !important;
          min-width: 190px; box-shadow: 0 14px 34px rgba(0,0,0,0.55) !important;
          z-index: 9999 !important;
        }
        .mc-dropdown-item {
          color: #d9dde1 !important; font-size: 0.8rem !important;
          padding: 0.45rem 0.6rem !important; border-radius: 6px !important;
          display: flex; align-items: center;
        }
        .mc-dropdown-item:hover, .mc-dropdown-item:focus { background: #23262a !important; color: #fff !important; }
        .mc-dropdown-danger { color: #fb737a !important; }
        .mc-dropdown-danger:hover { background: rgba(251,95,103,0.12) !important; color: #fb737a !important; }
        .mc-divider { border-color: #2a2e32 !important; margin: 4px 0 !important; }
      `}</style>
    </>
  )
}

export default ManageCoursePage
