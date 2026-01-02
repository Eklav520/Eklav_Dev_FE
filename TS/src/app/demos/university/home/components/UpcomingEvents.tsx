import TinySlider from '@/components/TinySlider'
import { getAllEvents } from '@/helpers/data'
import { useFetchData } from '@/hooks/useFetchData'
import useToggle from '@/hooks/useToggle'
import { EventType } from '@/types/other'

import { Link } from 'react-router-dom'
import { Card, CardBody, CardTitle, Container, Row } from 'react-bootstrap'
import { renderToString } from 'react-dom/server'
import { FaArrowLeft, FaArrowRight, FaCircle, FaHeart, FaRegCalendarAlt, FaRegHeart } from 'react-icons/fa'
import type { TinySliderSettings } from 'tiny-slider'

const EventCard = ({ event }: { event: EventType }) => {
  const { date, description, image, title, hasLive } = event
  const { isTrue, toggle } = useToggle()
  return (
    <Card className="bg-transparent">
      <div className="position-relative">
        <img src={image} className="card-img" alt="course image" />
        <div className="card-img-overlay d-flex align-items-start flex-column p-3">
          <div className="w-100 mb-auto d-flex justify-content-end" onClick={toggle}>
            <span role="button" className="icon-sm bg-white rounded-2">
              {isTrue ? <FaHeart fill="red" /> : <FaRegHeart className="text-danger" />}
            </span>
          </div>
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
        <p className="mb-0 text-truncate-2">{description}</p>
      </CardBody>
    </Card>
  )
}

const UpcomingEvents = () => {
  const allEvents = useFetchData<EventType[]>(getAllEvents)
  const eventSliderSettings: TinySliderSettings = {
    arrowKeys: true,
    gutter: 30,
    autoplayButton: false,
    autoplayButtonOutput: false,
    nested: 'inner',
    controlsText: [renderToString(<FaArrowLeft size={16} />), renderToString(<FaArrowRight size={16} />)],
    autoplay: false,
    mouseDrag: true,
    controls: true,
    edgePadding: 2,

    items: 4,
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
        items: 3,
      },
      1200: {
        items: 4,
      },
    },
  }
  return (
    <section className="pt-0">
      <Container>
        <Row className="mb-4">
          <h2 className="mb-0">Upcoming Events</h2>
        </Row>
        <Row>
          <div className="tiny-slider arrow-round arrow-creative arrow-blur">
            <TinySlider settings={eventSliderSettings}>{allEvents?.map((event, idx) => <EventCard key={idx} event={event} />)}</TinySlider>
          </div>
        </Row>
      </Container>
    </section>
  )
}

export default UpcomingEvents
