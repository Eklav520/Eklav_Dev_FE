import useToggle from '@/hooks/useToggle'
import { splitArray } from '@/utils/array'
import { Card, CardBody, CardHeader, Col, Collapse, Row } from 'react-bootstrap'
import { FaAngleDown, FaAngleUp, FaCheckCircle } from 'react-icons/fa'

interface CourseDetailsProps {
  course: any | null
  loading: boolean
}

const CourseDescription: React.FC<CourseDetailsProps> = ({ course }) => {
  const { isTrue, toggle } = useToggle()
  let features: string[] = []

  // ✅ Safe parsing — works whether it's already an array or a JSON string
  try {
    if (Array.isArray(course?.features)) {
      features = course.features
    } else if (typeof course?.features === 'string') {
      const parsed = JSON.parse(course.features)
      features = Array.isArray(parsed)
        ? parsed
        : typeof parsed === 'string'
        ? JSON.parse(parsed)
        : []
    } else {
      features = []
    }
  } catch (e) {
    console.error('Failed to parse features safely:', course?.features)
    features = []
  }

  const featureChunks = splitArray(features, 2)

  return (
    <Card className="border">
      <CardHeader className="border-bottom">
        <h3 className="mb-0">Course Description</h3>
      </CardHeader>
      <CardBody>
        <p className="mb-3">
          Welcome to the <strong>{course?.title}</strong>
        </p>
        <p className="mb-3">
          In this practical hands-on training, you’re going to learn to become a digital marketing expert with this{' '}
          <strong>ultimate course bundle that includes 12 digital marketing courses in 1!</strong>
        </p>
        <p className="mb-0">
          If you wish to find out the skills that should be covered in a basic <strong>{course?.title}</strong> course
          syllabus in India or anywhere around the world, then reading this blog will help. Before we delve into the
          advanced{' '}
          <strong>
            <a href="#" className="text-reset text-decoration-underline">
              {course?.title} course
            </a>
          </strong>{' '}
          syllabus, let’s look at the scope of digital marketing and what the future holds.
        </p>

        <Collapse in={isTrue}>
          <div>
            {course?.description ? (
              <div
                className="my-3 course-description"
                dangerouslySetInnerHTML={{ __html: course.description }}
              />
            ) : (
              <div />
            )}
          </div>
        </Collapse>

        <a
          className="p-0 mb-0 mt-2 btn-more d-flex align-items-center"
          onClick={toggle}
          href="#collapseContent"
          role="button"
          aria-expanded="false"
          aria-controls="collapseContent"
        >
          See
          <span className="ms-1">
            {isTrue ? (
              <>
                less <FaAngleUp className="ms-1" />
              </>
            ) : (
              <>
                more <FaAngleDown className="ms-1" />
              </>
            )}
          </span>
        </a>

        {features.length > 0 && (
          <>
            <h5 className="mt-4">What you’ll learn</h5>
            <Row className="mb-3">
              {featureChunks.map((chunk, idx) => (
                <Col md={6} key={idx}>
                  <ul className="list-group list-group-borderless">
                    {chunk.map((feature, idx2) => (
                      <li
                        className="list-group-item h6 fw-light d-flex mb-0"
                        key={idx2}
                      >
                        <FaCheckCircle className="text-success me-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </Col>
              ))}
            </Row>
          </>
        )}
      </CardBody>
    </Card>
  )
}

export default CourseDescription
