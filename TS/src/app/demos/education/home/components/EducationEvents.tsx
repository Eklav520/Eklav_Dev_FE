import { Link } from 'react-router-dom'
import { Button, Card, CardBody, CardTitle, Container, Row } from 'react-bootstrap'
import { renderToString } from 'react-dom/server'
import { FaArrowLeft, FaArrowRight, FaCircle, FaMapMarkerAlt, FaRegCalendarAlt } from 'react-icons/fa'
import type { TinySliderSettings } from 'tiny-slider'
import TinySlider from '@/components/TinySlider'
import { useFetchData } from '@/hooks/useFetchData'
import type { EventType } from '@/types/other'

import { getAllEvents } from '@/helpers/data'

const EventCard = ({ event }: { event: EventType }) => {
  const { city, date, image, title, hasLive } = event
  return (
    <Card className="bg-transparent">
      <div className="position-relative">
        <img src={image} className="card-img" alt="course image" />
        <div className="card-img-overlay d-flex align-items-start flex-column p-3">
          <div className="w-100 mt-auto">
            {hasLive ? (
              <Link to="" className="badge text-success bg-white fs-6 rounded-1">
                <FaCircle className="text-success me-2" />
                Live
              </Link>
            ) : (
              <Link to="" className="badge text-bg-white fs-6 rounded-1">
                <FaRegCalendarAlt className="text-orange me-2" />
                {date}
              </Link>
            )}
          </div>
        </div>
      </div>
      <CardBody className="px-2">
        <CardTitle>
          <Link to="">{title}</Link>
        </CardTitle>
        <div className="d-flex justify-content-between align-items-center">
          <address className="mb-0">
            <FaMapMarkerAlt className="me-2" />
            {city}
          </address>
          <Button variant="primary-soft" size="sm" className="mb-0">
            Join now
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

const EducationEvents = () => {
  const allEvents = useFetchData<EventType[]>(getAllEvents)

  const eventSliderSettings: TinySliderSettings = {
    arrowKeys: true,
    gutter: 30,
    autoplayButton: false,
    autoplayButtonOutput: false,
    mouseDrag: true,
    nested: 'inner',
    controlsText: [renderToString(<FaArrowLeft size={16} />), renderToString(<FaArrowRight size={16} />)],
    autoplay: false,
    controls: true,
    edgePadding: 2,
    items: 3,
    nav: false,
    responsive: {
      1: {
        items: 1,
      },
      576: {
        items: 1,
      },
      768: {
        items: 2,
      },
      992: {
        items: 2,
      },
      1200: {
        items: 3,
      },
    },
  }
  return (
    <section className="pb-0 pb-md-5">
      <Container>
        <Row className="mb-4">
          <h2 className="mb-0">
            Upcoming <span className="text-warning">Education</span> Events
          </h2>
        </Row>
        <Row>
          <div className="tiny-slider arrow-round arrow-creative arrow-blur arrow-hover">
            {allEvents && (
              <TinySlider settings={eventSliderSettings}>{allEvents?.map((event, idx) => <EventCard event={event} key={idx} />)}</TinySlider>
            )}
          </div>
        </Row>
      </Container>
    </section>
  )
}

export default EducationEvents
