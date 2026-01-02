import React, { useState, useEffect } from 'react';
import {
  Card,
  Col,
  Container,
  Row,
  Spinner,
  Alert,
  Modal,
  Button,
} from 'react-bootstrap';

type QA = {
  question: string;
  answer: string;
  explanation: string;
};

type TopicItem = {
  topic: string;
  questions: QA[];
  _id: string;
};

type Category = {
  title: string;
  items: TopicItem[];
  _id: string;
};

const CategoryGrid = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QA[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleTopicClick = (categoryTitle: string, topicTitle: string) => {
    setSelectedCategory(categoryTitle);
    setSelectedTopic(topicTitle);
    setShowModal(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${baseURL}/apptitudeQuestions`);
        if (!res.ok) throw new Error('Failed to fetch categories');
        const data = await res.json();
        console.log('Fetched categories:', data);
        setCategories(data.data || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load categories.');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedCategory || !selectedTopic) return;

    const category = categories.find((cat) => cat.title === selectedCategory);
    const topicItem = category?.items.find((item) => item.topic === selectedTopic);

    setQuestions(topicItem?.questions || []);
  }, [selectedCategory, selectedTopic, categories]);

  return (
    <Container className="my-5">
      <Row xs={1} sm={2} md={3} className="g-4">
        {loading ? (
          <div className="text-center w-100">
            <Spinner animation="border" variant="primary" />
          </div>
        ) : error ? (
          <Alert variant="danger" className="w-100">{error}</Alert>
        ) : (
          categories.map((category, idx) => (
            <Col key={idx}>
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <Card.Title className="text-success fw-bold mb-3">
                    {category.title}
                  </Card.Title>
                  <ul className="list-unstyled mb-0">
                    {category.items.map((item, index) => (
                      <li key={index} className="mb-1">
                        <span
                          onClick={() => handleTopicClick(category.title, item.topic)}
                          className="text-body text-decoration-none small"
                          style={{ cursor: 'pointer' }}
                        >
                          › {item.topic}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          ))
        )}
      </Row>

      {/* Modal for Questions */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        fullscreen
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>{selectedTopic} - Questions</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {questions.length > 0 ? (
            questions.map((qa, idx) => (
              <div key={idx} className="mb-4">
                <p><strong>Q{idx + 1}:</strong> {qa.question}</p>
                <p><strong>Ans:</strong> {qa.answer}</p>
                <p className="text-muted"><strong>Explanation:</strong> <em>{qa.explanation}</em></p>
                <hr />
              </div>
            ))
          ) : (
            <p className="text-muted">No questions available for this topic.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default CategoryGrid;
