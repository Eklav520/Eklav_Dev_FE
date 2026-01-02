import type { TestimonialType } from '@/types/other'

import { FaQuoteLeft, FaQuoteRight } from 'react-icons/fa'

const TestimonialCard = ({ testimonial }: { testimonial: TestimonialType }) => {
  const { description, course } = testimonial
  return (
    <div className="bg-body text-center p-4 rounded-3 border border-1 position-relative">
      <div className="avatar avatar-lg mb-3">{course?.avatar && <img className="avatar-img rounded-circle" src={course?.avatar} alt="avatar" />}</div>
      <h6 className="mb-2">{course?.name}</h6>
      <blockquote className="mt-1">
        <p>
          <span className="me-1 small">
            <FaQuoteLeft />
          </span>
          {description}
          <span className="ms-1 small">
            <FaQuoteRight />
          </span>
        </p>
      </blockquote>
    </div>
  )
}

export default TestimonialCard
