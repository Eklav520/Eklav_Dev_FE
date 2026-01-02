import PageMetaData from '@/components/PageMetaData'
import CourseDetails from './components/CourseDetails'
//import TopNavigationBar from './components/TopNavigationBar'
import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthContext } from '@/context/useAuthContext'
import { Spinner, Alert } from 'react-bootstrap'
import Footer from '@/components/StudentLayoutComponents/Footer'
import TopNavigationBar from '@/components/StudentLayoutComponents/TopNavigationBar'
import Banner from '@/components/StudentLayoutComponents/Banner'
import useToggle from '@/hooks/useToggle'

type CourseType = {
  _id: string
  title: string
  shortDescription: string
  description: string
  category: string
  price: string
  discountPrice: string
  duration: string
  totalLectures: string
  image: string | null
  videoUrl?: string
  videos?: {
    video: string
    description: string
  }[]
  addFAQ?: {
    question: string
    answer: string
  }[]
  language: string
  level: string
  isFeatured: string
  createdAt: string
  updatedAt: string
}

const CourseAdvanceDetails = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user, removeSession } = useAuthContext()
  const { isTrue: isOffCanvasMenuOpen, toggle: toggleOffCanvasMenu } = useToggle()
  const token = user?.token
  const { courseId } = useParams()
  const [course, setCourse] = useState<CourseType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cleanCourseData = (course: any) => {
    const cleaned = { ...course }

    const stringFields = ['category', 'language', 'level', 'title', 'shortDescription', 'description']
    const booleanFields = ['isFeatured']
    const numberFields = ['discountPrice', 'duration', 'price', 'totalLectures']

    stringFields.forEach((field) => {
      if (typeof cleaned[field] === 'string') {
        try {
          cleaned[field] = JSON.parse(cleaned[field])
        } catch {
          // ignore parse error
        }
      }
    })

    booleanFields.forEach((field) => {
      if (typeof cleaned[field] === 'string') {
        cleaned[field] = cleaned[field].toLowerCase() === 'true'
      }
    })

    numberFields.forEach((field) => {
      if (typeof cleaned[field] === 'string') {
        const num = Number(cleaned[field])
        cleaned[field] = isNaN(num) ? cleaned[field] : num
      }
    })

    return cleaned
  }

  useEffect(() => {
    if (!courseId || !token) return

    setLoading(true)
    setError(null)

    fetch(`${baseURL}/coursesDetails/${courseId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (res.status === 401) {
          removeSession()
          throw new Error('Session expired. Please log in again.')
        }
        if (res.status === 403) {
          const errData = await res.json()
          throw new Error(errData.message || 'Access denied.')
        }
        if (!res.ok) {
          throw new Error('Failed to fetch course details.')
        }
        return res.json()
      })
      .then((data) => {
        const cleanedData = cleanCourseData(data)
        setCourse(cleanedData)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Course fetch error:', err.message)
        setError(err.message)
        setLoading(false)
      })
  }, [courseId, token])

  return (
    <>
      <PageMetaData title="Course Advance" />
      <TopNavigationBar />
      <main>
        <Banner toggleOffCanvas={toggleOffCanvasMenu} />
        {loading && (
          <div className="d-flex justify-content-center align-items-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        )}

        {error && (
          <div className="container py-5 text-center">
            <Alert variant="danger" className="mx-auto w-75">
              <h5 className="mb-2">{error}</h5>
              {error.includes('Subscription') ? (
                <p>Your subscription is pending approval. Please contact the admin to activate your access.</p>
              ) : error.includes('enroll') ? (
                <p>Please enroll in this course to start learning.</p>
              ) : (
                <p>Please check your access or log in again.</p>
              )}
            </Alert>
          </div>
        )}

        {!loading && !error && course && <CourseDetails course={course} loading={loading} />}
      </main>
      <Footer />
      {/*  <Footer className="bg-light" /> */}
    </>
  )
}

export default CourseAdvanceDetails
