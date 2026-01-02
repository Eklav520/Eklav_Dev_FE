import { Accordion, AccordionBody, AccordionHeader, AccordionItem, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { BsCheckCircleFill } from 'react-icons/bs'
import { courseMaterialData } from '../data'
import { Fragment } from 'react'
import GlightBox from '@/components/GlightBox'

import { FaPlay } from 'react-icons/fa'
import { Link } from 'react-router-dom'

import course1 from '@/assets/images/courses/4by3/01.jpg'

const CourseMaterial = () => {
  return (
    <Accordion defaultActiveKey="0" className="accordion-icon accordion-border" id="accordionExample2">
      {courseMaterialData.map((course, idx) => (
        <AccordionItem eventKey={`${idx}`} className="mb-3" key={idx}>
          <AccordionHeader as="h6" className="font-base" id="heading-1">
            <div className="fw-bold rounded d-flex collapsed w-100">
              Week {idx + 1} -<span className="small ms-2">{course.date}</span>
              <span className="small ms-0 ms-sm-2 d-none d-sm-block">({course.lectures.length} Items)</span>
              {idx === 0 && (
                <span className="text-secondary ms-auto pe-4 ms-auto" data-bs-toggle="tooltip" data-bs-placement="top" title="Mark as completed">
                  <BsCheckCircleFill />
                </span>
              )}
            </div>
          </AccordionHeader>
          <AccordionBody className="mt-3">
            {course.lectures.map((lecture, idx) => {
              const Icon = lecture.icon
              return (
                <Fragment key={idx}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      {lecture.icon ? (
                        <a href="#" className="icon-md mb-0 position-static flex-shrink-0 text-body">
                          {Icon && <Icon className="fa-fw fs-5" />}
                        </a>
                      ) : (
                        <GlightBox
                          data-glightbox
                          data-gallery="office-tour"
                          href="https://www.youtube.com/embed/tXHviS-4ygo"
                          className="icon-md position-relative">
                          <img src={course1} className="rounded-1" alt="course" />
                          <small className="text-white position-absolute top-50 start-50 translate-middle">
                            <FaPlay className="me-0 " />
                          </small>
                        </GlightBox>
                      )}
                      <div className="ms-3">
                        <a href="#" className="d-inline-block text-truncate mb-0 h6 fw-normal w-100px w-sm-200px w-md-400px">

                          What is Digital Marketing What is Digital Marketing
                        </a>
                        <ul className="nav nav-divider small mb-0">
                          {lecture.features.map((feature, idx) => (
                            <li className="nav-item" key={idx}>
                              {feature}
                            </li>
                          ))}
                          {lecture.isSubmitted && (
                            <li className="nav-item">
                              <Link to="" className="text-success">
                                Submitted
                              </Link>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                    {lecture.isSubmitted ? (
                      <OverlayTrigger placement="top" overlay={<Tooltip>Completed</Tooltip>}>
                        <span role="button" className="p-2 mb-0 text-success">
                          <BsCheckCircleFill />
                        </span>
                      </OverlayTrigger>
                    ) : (
                      <OverlayTrigger placement="top" overlay={<Tooltip>Mark as Complete</Tooltip>}>
                        <span role="button" className="p-2 mb-0">
                          <BsCheckCircleFill />
                        </span>
                      </OverlayTrigger>
                    )}
                  </div>
                  {course.lectures.length - 1 != idx && <hr />}
                </Fragment>
              )
            })}
          </AccordionBody>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
export default CourseMaterial
