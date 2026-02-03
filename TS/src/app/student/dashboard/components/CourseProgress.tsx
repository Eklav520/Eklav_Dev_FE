import { useState } from 'react'
import { Card, Badge, ProgressBar } from 'react-bootstrap'
import { FaGraduationCap } from 'react-icons/fa'

type CourseProgressItem = {
  id: string
  name: string
  progress: number
  status: string
  color: string
}

type Props = {
  courses: CourseProgressItem[]
}

const CourseProgress = ({ courses }: Props) => {
  if (!courses || courses.length === 0) {
    return (
      <Card className="border-0 h-100" style={{ background: '#8b5cf6', borderRadius: '12px' }}>
        <Card.Header className="border-0 text-white py-3">
          <h6 className="mb-0 fw-bold">
            <FaGraduationCap className="me-2" />
            Course Progress
          </h6>
        </Card.Header>
        <Card.Body className="text-center text-white" style={{ opacity: 0.8 }}>
          No enrolled courses yet
        </Card.Body>
      </Card>
    )
  }

  return (
    <Card className="border-0 h-100" style={{ background: '#8b5cf6', borderRadius: '12px' }}>
      <Card.Header className="border-0 text-white py-3">
        <h6 className="mb-0 fw-bold">
          <FaGraduationCap className="me-2" />
          Course Progress
        </h6>
      </Card.Header>

      <Card.Body className="text-center text-white" style={{ opacity: 0.8 }}>
        No enrolled courses yet
      </Card.Body>
    </Card>
  )
}

export default CourseProgress
