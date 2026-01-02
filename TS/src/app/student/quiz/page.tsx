import PageMetaData from '@/components/PageMetaData'
import { Card, CardHeader, CardTitle, Col, Row } from 'react-bootstrap'
import Inner from './components/Inner'

const CountdownPage = () => {
  return (
    <>
      <PageMetaData title="Quiz" />
      <Card className="border">
        <CardHeader className="border-bottom">
          <Row>
            <Col xs={12}>
              <Card>
                <Row className="g-0">
                  <CardTitle as={'h4'} className="text-center">
                    Test your knowledge
                  </CardTitle>
                </Row>
              </Card>
            </Col>
          </Row>
        </CardHeader>
        <Inner />
      </Card>
    </>
  )
}

export default CountdownPage
