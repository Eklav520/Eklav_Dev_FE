import { booksList } from "./data/booksList"
import { Container, Row, Col, Card, Button } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import './BookLibrary.css'

interface Props {
  onSelectBook: (id: string) => void
}

const BookLibrary = ({ onSelectBook }: Props) => {

  const navigate = useNavigate()

  return (
    <Container fluid className="mt-4 px-4">
      <h3 className="mb-4 fw-bold">
        <span style={{ color: '#ff7a00' }}>Technical Library</span>
      </h3>

      <Row className="g-3">
        {booksList.map((book: any) => (
          <Col sm={6} lg={4} xl={3} key={book.id} className="d-flex">
            
            <Card className="material-card w-100">
              <img
                src={book.image}
                alt={book.title}
                className="material-thumb"
              />

              <div className="p-3 d-flex flex-column">
                {/* Optional: Add category badge if available in your data */}
                {book.category && (
                  <span className="book-badge mb-2">
                    {book.category}
                  </span>
                )}
                
                {/* Title centered with proper spacing */}
                <h5 className="fw-semibold text-white mb-3 text-center">
                  <Button
                  className="mt-auto material-btn"
                  onClick={() => onSelectBook(book.id)}
                >
                   {book.title} Book
                </Button>
                </h5>
              </div>
            </Card>

          </Col>
        ))}
      </Row>
    </Container>
  )
}

export default BookLibrary