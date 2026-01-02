import avatar1 from '@/assets/images/avatar/01.jpg'
import avatar8 from '@/assets/images/avatar/08.jpg'
import { getAllEventSchedule } from '@/helpers/data'
import { useFetchData } from '@/hooks/useFetchData'
import { EventScheduleType } from '@/types/other'
import { Accordion, AccordionBody, AccordionHeader, AccordionItem, Card, CardTitle, Col, Container, Row } from 'react-bootstrap'
import { BsCalendarFill, BsClock, BsGeoAltFill } from 'react-icons/bs'
import { counterData, CounterType } from '../data'

const EventScheduleCard = ({ day, events, id }: EventScheduleType) => {
  return (
    <AccordionItem eventKey={id} className="accordion-item mb-3">
      <AccordionHeader className="accordion-header font-base" id="heading-1">
        <div className="fw-bold">
          Day-{id}
          <span className="fw-normal ms-0 ms-sm-2">({day.toLocaleString('en-US', { weekday: 'long', day: '2-digit', month: 'short' })})</span>
        </div>
      </AccordionHeader>
      <AccordionBody className=" p-0">
        {events.map((items, idx) => (
          <>
            <div className="d-flex align-items-center p-3">
              <div className="avatar avatar-sm flex-shrink-0">
                <img className="avatar-img rounded-circle" src={items.avatar} alt="avatar" />
              </div>
              <div className="ms-2">
                <h6 className="mb-0 fw-normal">
                  <a href="#">
                    {items.title}
                    <span>({items.time.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })})</span>
                  </a>
                </h6>
                <p className="small mb-0">
                  by <a href="#" className="fw-bold text-body text-primary-hover"></a> {items.description}
                </p>
              </div>
            </div>
            {events.length - 1 != idx && <hr className="my-0" />}
            {items.isCoffeeBreak && (
              <>
                <div className="text-center p-3">
                  <h6 className="mb-0 fw-normal">
                    <BsClock /> Coffee Break <span>({items.time.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })})</span>
                  </h6>
                </div>
                <hr className="my-0" />
              </>
            )}
            {items.isLunchBreak && (
              <>
                <div className="text-center p-3">
                  <h6 className="mb-0 fw-normal">
                    <BsClock /> Lunch time <span>({items.time.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' })})</span>
                  </h6>
                </div>
                <hr className="my-0" />
              </>
            )}
          </>
        ))}
      </AccordionBody>
    </AccordionItem>
  )
}

const CounterCard = ({ count, icon: Icon, title }: CounterType) => {
  return (
    <Col sm={4}>
      <div className="d-flex">
        <Icon size={26} />
        <div className="ms-3">
          <h5 className="mb-0">{count}</h5>
          <p className="mb-0">{title}</p>
        </div>
      </div>
    </Col>
  )
}

const MapCard = () => {
  return (
    <Card className="card-body shadow">
      <a className="btn btn-primary w-100" href="#">

        Buy ticket
      </a>
      <div className="mt-4">
        <ul className="list-unstyled mb-4">
          <li className="d-flex justify-content-between mb-3">

            <span className="w-150px">Ticket Price:</span> <h6 className="text-end mb-0"> $210.00 </h6>
          </li>
          <li className="d-flex justify-content-between mb-3">

            <span className="w-150px">Entry fees:</span> <h6 className="text-end mb-0"> $1 per ticket </h6>
          </li>
          <li className="d-flex justify-content-between mb-3">

            <span className="w-150px">Address:</span> <h6 className="text-end mb-0"> 750 Sing Sing Rd, Horseheads, NY, 14845 </h6>
          </li>
        </ul>
        <iframe
          className="w-100 d-block rounded-bottom"
          height={230}
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.9663095343008!2d-74.00425878428698!3d40.74076684379132!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259bf5c1654f3%3A0xc80f9cfce5383d5d!2sGoogle!5e0!3m2!1sen!2sin!4v1586000412513!5m2!1sen!2sin"
          style={{ border: 0 }}
          aria-hidden="false"
          tabIndex={0}
        />
      </div>
    </Card>
  )
}

const EventDetailsContent = () => {
  const eventScheduleData = useFetchData(getAllEventSchedule)

  return (
    <section className="pt-0">
      <Container>
        <Row className="g-4 g-lg-5">
          <Col lg={8} className="order-2">
            <div className="bg-light rounded-3 p-3 mb-4">
              <Row className="g-4">
                <Col md={4}>
                  <h6 className="small">Organized by:</h6>
                  <div className="d-flex align-items-center">
                    <div className="avatar align-middle">
                      <div className="avatar-img rounded-1 bg-danger">
                        <span className="text-white position-absolute top-50 start-50 translate-middle fw-bold">ZC</span>
                      </div>
                    </div>
                    <div className="ms-2">
                      <h6 className="mb-0">Zodiac Event Inc.</h6>
                      <small>2.4k followers</small>
                    </div>
                  </div>
                </Col>
                <Col md={4}>
                  <h6 className="small">Location:</h6>
                  <div className="d-flex align-items-center">
                    <div className="avatar align-middle flex-shrink-0">
                      <div className="avatar-img rounded-2 bg-dark">
                        <span className="position-absolute top-50 start-50 translate-middle text-white">
                          <BsGeoAltFill />
                        </span>
                      </div>
                    </div>
                    <h6 className="fw-normal mb-0 ms-2">Chicago HQ Estica Cop. Macomb, MI 48042</h6>
                  </div>
                </Col>
                <Col md={4}>
                  <h6 className="small">Date &amp; Time:</h6>
                  <div className="d-flex align-items-center">
                    <div className="avatar align-middle flex-shrink-0">
                      <div className="avatar-img rounded-2 bg-dark">
                        <span className="position-absolute top-50 start-50 translate-middle text-white">
                          <BsCalendarFill />
                        </span>
                      </div>
                    </div>
                    <div className="ms-2">
                      <h6 className="fw-normal mb-0">01 Jan 2023</h6>
                      <small>9am to 7pm Daylight Time</small>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
            <h4>About this event</h4>
            <p>
              Satisfied conveying a dependent contented he gentleman agreeable do be. Warrant private blushes removed and in equally totally if.
              Delivered dejection necessary objection do Mr prevailed. Mr feeling chiefly cordial in doing.
            </p>
            <p>
              We focus a great deal on the understanding of behavioral psychology and influence triggers which are crucial for becoming a well-rounded
              Digital Marketer. We understand that theory is important to build a solid foundation, we understand that theory alone isn’t going to get
              the job done so that’s why this course is packed with practical hands-on examples that you can follow step by step.
            </p>
            <h4 className="mt-4 mb-0">Speakers</h4>
            <p>Understand that theory is important to build a solid foundation, we understand that theory alone</p>
            <Row className="g-4">
              <Col sm={6}>
                <Card className="card-body border">
                  <div className="d-xl-flex justify-content-between align-items-center">
                    <div className="hstack gap-2 mb-2 mb-xl-0">
                      <div className="avatar flex-shrink-0">
                        <img className="avatar-img rounded-circle" src={avatar8} alt="avatar" />
                      </div>
                      <div>
                        <CardTitle as={'h6'} className="mb-0">
                          <a href="#">Dennis Barrett</a>
                        </CardTitle>
                        <small>2.5M followers</small>
                      </div>
                    </div>
                    <button className="btn btn-sm btn-dark mb-0">Know more</button>
                  </div>
                </Card>
              </Col>
              <Col sm={6}>
                <Card className="card-body border">
                  <div className="d-xl-flex justify-content-between align-items-center">
                    <div className="hstack gap-2 mb-2 mb-xl-0">
                      <div className="avatar flex-shrink-0">
                        <img className="avatar-img rounded-circle" src={avatar1} alt="avatar" />
                      </div>
                      <div>
                        <CardTitle as={'h6'} className="mb-0">
                          <a href="#">Jacqueline Miller</a>
                        </CardTitle>
                        <small>40K followers</small>
                      </div>
                    </div>
                    <button className="btn btn-sm btn-dark mb-0">Know more</button>
                  </div>
                </Card>
              </Col>
            </Row>
            <h4 className="mt-5 mb-0">Event Schedule</h4>
            <p>Understand that theory is important to build a solid foundation, we understand that theory alone</p>
            <Accordion className="accordion-icon accordion-active-dark" id="accordionExample2">
              {eventScheduleData?.map((item, idx) => <EventScheduleCard key={idx} {...item} />)}
            </Accordion>
            <Card className="card-body bg-light p-4 mt-5">
              <Row className="g-2">
                {counterData.map((item, idx) => (
                  <CounterCard key={idx} {...item} />
                ))}
              </Row>
            </Card>
          </Col>
          <Col lg={4} className="order-1 order-lg-2">
            <MapCard />
          </Col>
        </Row>
      </Container>
    </section>
  )
}

export default EventDetailsContent
