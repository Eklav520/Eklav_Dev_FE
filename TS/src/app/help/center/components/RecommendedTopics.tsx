import { FaAngleRight } from 'react-icons/fa'
import { topicData, TopicType } from '../../data'
import { Card, CardBody, CardHeader, CardTitle, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const TopicsCard = ({ features, icon: Icon, title, variant }: TopicType) => {
  return (
    <Card className="bg-light h-100">
      <CardHeader className="bg-light pb-0 border-0">
        <Icon size={45} className={`text-${variant}`} />
        <CardTitle as={'h5'} className="mb-0 mt-2">
          {title}
        </CardTitle>
      </CardHeader>
      <CardBody>
        <ul className="nav flex-column">
          {features.map((data, idx) => (
            <li className="nav-item" key={idx}>
              <Link className="nav-link d-flex" to="/help/center-detail">
                <FaAngleRight size={18} className="text-primary pt-1 me-2" />
                {data}
              </Link>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}

const RecommendedTopics = () => {
  return (
    <section>
      <Container>
        <Row>
          <Col xs={12} className="text-center">
            <h2 className="text-center mb-4">Recommended Topics</h2>
          </Col>
        </Row>
        <Row className="g-4">
          {topicData.map((item, idx) => (
            <Col md={6} xl={3} key={idx}>
              <TopicsCard {...item} />
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  )
}

export default RecommendedTopics
