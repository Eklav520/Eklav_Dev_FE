import useToggle from '@/hooks/useToggle'
import { Card, CardBody, CardFooter, CardTitle, Col, Container, Nav, NavItem, NavLink, Row, TabContainer, TabContent, TabPane } from 'react-bootstrap'
import { FaHeart, FaRegClock, FaRegHeart, FaRegStar, FaStar, FaStarHalfAlt, FaTable } from 'react-icons/fa'
import { useEffect, useState } from 'react'
import Inner from './Inner'
import MockInterviewVideos from './MockInterviewVideos'
import InterviewDetails from './InterviewDetails'
import Bookmark from './Bookmark'

type CourseType = {
  _id: string
  title: string
  shortDescription: string
  category: string[] // Ensure your backend sends this as array
  duration: string
  lectures: string
  rating: { star: number }
  image: string
  badge: { text: string; class: string }
  description: string
  totalLectures: string
}

const CourseCard = ({ course }: { course: CourseType }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { isTrue: isOpen, toggle } = useToggle()
  const { duration, image, totalLectures, rating, title, shortDescription, _id } = course
  return (
    <Card className="shadow h-100">
      <img
        src={`${baseURL}/uploads/${course.image}`}
        onError={(e) => {
          e.currentTarget.onerror = null
          e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(course.title || 'User')}`
        }}
        className="card-img-top"
        alt="course image"
      />
      <CardBody className="pb-0">
        <div className="d-flex justify-content-between mb-2">
          <span role="button" className="h6 mb-0" onClick={toggle}>
            {isOpen ? <FaHeart fill="red" /> : <FaRegHeart />}
          </span>
        </div>
        <CardTitle className="fw-normal">
          <a href={`/pages/course/detail-adv/${_id}`} target="_blank" rel="noopener noreferrer">
           {title}
          </a>
        </CardTitle>
        <p className="mb-2 text-truncate-2">{shortDescription}</p>
        {rating && (
          <ul className="list-inline mb-0">
            {Array(Math.floor(rating.star))
              .fill(0)
              .map((_star, idx) => (
                <li key={idx} className="list-inline-item me-1 small">
                  <FaStar className="text-warning" />
                </li>
              ))}
            {!Number.isInteger(rating) && (
              <li className="list-inline-item me-1 small">
                <FaStarHalfAlt className="text-warning" />
              </li>
            )}
            {rating.star < 5 &&
              Array(5 - Math.ceil(rating.star))
                .fill(0)
                .map((_star, idx) => (
                  <li key={idx} className="list-inline-item me-1 small">
                    <FaRegStar className="text-warning" />
                  </li>
                ))}
            <li className="list-inline-item ms-2 h6 fw-light mb-0">{rating.star}/5.0</li>
          </ul>
        )}
      </CardBody>
      <CardFooter className="pt-0 pb-3">
        <hr />
        <div className="d-flex justify-content-between">
          <span className="h6 fw-light mb-0">
            <FaRegClock className="text-danger me-2" />
            {duration}
          </span>
          <span className="h6 fw-light mb-0">
            <FaTable className="text-orange me-2" />
            {totalLectures} lectures
          </span>
        </div>
      </CardFooter>
    </Card>
  )
}

const Courses = ({ courseKey }: { courseKey: any }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [courses, setCourses] = useState<CourseType[]>([])
  const [loading, setLoading] = useState(true)

  // Helper function to clean course data
  const cleanCourseData = (course: any) => {
    const cleaned = { ...course }

    const stringFields = ['category', 'language', 'level', 'title', 'shortDescription', 'description', 'features']
    const booleanFields = ['isFeatured']
    const numberFields = ['discountPrice', 'duration', 'price', 'totalLectures']

    stringFields.forEach((field) => {
      if (typeof cleaned[field] === 'string') {
        try {
          cleaned[field] = JSON.parse(cleaned[field])
        } catch {
          // keep original if parse fails
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
    fetch(`${baseURL}/courses`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then((data) => {
        console.log('data.', data)
        const cleanedData = data.map(cleanCourseData) // clean each course
        setCourses(cleanedData)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Fetch error:', err)
        setLoading(false)
      })
  }, [])

  const filteredCourses = courses.filter((course) => course.category.includes(courseKey))

  return (
    <TabPane
      eventKey={courseKey}
      className="fade show"
      id={`course-pills-tabs-${courseKey}`}
      role="tabpanel"
      aria-labelledby={`course-pills-tab-${courseKey}`}>
      {loading ? (
        <p>Loading courses...</p>
      ) : (
        <Row className="g-4">
          {filteredCourses.map((course) => (
            <Col sm={6} lg={4} xl={3} key={course._id}>
              <CourseCard course={course} />
            </Col>
          ))}
        </Row>
      )}

      {courseKey === 'development' && (
        <div className="mt-4">
          <Bookmark />
          {/* <Inner /> */}
        </div>
      )}
      {courseKey === 'graphic-design' && (
        <div className="mt-4">
          <MockInterviewVideos />
        </div>
      )}

      {courseKey === 'marketing' && <InterviewDetails />}
    </TabPane>
  )
}

const PopularCourse = () => {
  const categories: string[] = ['Information technology', 'development', 'graphic-design', 'marketing']
  // const categories: CourseType['category'][] = ['web-design', 'development', 'graphic-design', 'marketing', 'finance']
  return (
    <section>
      <Container>
        <TabContainer defaultActiveKey="Information technology">
          <Nav className="nav-pills nav-pills-bg-soft justify-content-sm-center mb-3 px-3" id="course-pills-tab" role="tablist">
            <NavItem className="me-2 me-sm-5">
              <NavLink as="button" eventKey="Information technology" className="mb-2 mb-md-0" type="button" role="tab">
                📚 Courses
              </NavLink>
            </NavItem>
            <NavItem className="me-2 me-sm-5">
              <NavLink as="button" eventKey="development" className="mb-2 mb-md-0" type="button" role="tab">
                🧠 Aptitude Preparation
              </NavLink>
            </NavItem>
            <NavItem className="me-2 me-sm-5">
              <NavLink as="button" eventKey="graphic-design" className="mb-2 mb-md-0" type="button" role="tab">
                🎥 Mock Interviews
              </NavLink>
            </NavItem>
            {/* <NavItem className="me-2 me-sm-5">
              <NavLink as="button" eventKey="marketing" className="mb-2 mb-md-0" type="button" role="tab">
                🎤 Self Interview
              </NavLink>
            </NavItem> */}
          </Nav>
          <TabContent id="course-pills-tabContent">
            {categories.map((category, idx) => (
              <Courses courseKey={category} key={idx} />
            ))}
          </TabContent>
        </TabContainer>
      </Container>
    </section>
  )
}

export default PopularCourse
