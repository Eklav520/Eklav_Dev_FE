import { Card, CardTitle, Col, Container, Row } from 'react-bootstrap'
import { articleData, ArticleType } from '../../data'

const ArticleCard = ({ description, members, subTitle, title }: ArticleType) => {
  return (
    <Card className="card-body border p-4 h-100">
      <CardTitle as={'h4'} className="mb-4">
        <a href="#" className="stretched-link">
          {title}
        </a>
      </CardTitle>
      <div className="d-sm-flex align-items-center">
        <ul className="avatar-group mb-2 mb-sm-0">
          {members.map((image, idx) => (
            <li className="avatar avatar-md" key={idx}>
              <img className="avatar-img rounded-circle border-white" src={image} alt="avatar" />
            </li>
          ))}
        </ul>
        <div className="ms-sm-2">
          <h6 className="mb-1">{subTitle}</h6>
          <p className="mb-0">{description}</p>
        </div>
      </div>
    </Card>
  )
}

const PopularArticles = () => {
  return (
    <section>
      <Container>
        <Row>
          <Col xs={12} className="text-center">
            <h2 className="text-center mb-4">Popular Articles</h2>
          </Col>
        </Row>
        <Row className="g-4">
          {articleData.map((item, idx) => (
            <Col xl={6} key={idx}>
              <ArticleCard {...item} />
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  )
}

export default PopularArticles
