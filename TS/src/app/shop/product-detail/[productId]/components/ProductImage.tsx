import { BookType } from '@/types/other'
import { Button, Card, CardBody, Col, Row } from 'react-bootstrap'
import { BsBookmark, BsCart3 } from 'react-icons/bs'
import ProductImageWrapper from './ProductImageWrapper'

const ProductImage = ({ event }: { event: BookType }) => {
  return (
    <ProductImageWrapper>
      <Row className="justify-content-center">
        <Col md={8} xl={12}>
          <Card className="shadow">
            <div className="rounded-3">
              <img src={event.image} className="card-img-top " alt="book image" />
            </div>
            <CardBody className="pb-3">
              <div className="text-center">
                <Button variant="success-soft" className=" mb-2 mb-sm-0 me-00 me-sm-3">
                  <BsCart3 className="me-2" />
                  Add to Cart
                </Button>
                <Button variant="light " className="mb-0">
                  <BsBookmark className="me-2" />
                  Add wishlist
                </Button>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </ProductImageWrapper>
  )
}

export default ProductImage
