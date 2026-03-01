import React, { useEffect, useState } from 'react';
import { Card, Button, Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useAuthContext } from '@/context/useAuthContext';

const AdminChallengeList: React.FC = () => {
  const { user } = useAuthContext();
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const token = user?.token;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${baseURL}/admin/challenges`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setChallenges(Array.isArray(data) ? data : data.challenges || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch challenges", err);
        setError("Failed to load challenges");
        setLoading(false);
      });
  }, [token]);

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id);
    alert("Challenge ID copied!");
  };

  return (
    <Container className="my-5">
      <h3 className="mb-4 text-primary text-center">Available Challenges</h3>

      {loading && (
        <div className="text-center mb-4">
          <Spinner animation="border" />
        </div>
      )}

      {error && (
        <Alert variant="danger">{error}</Alert>
      )}

      {challenges.length === 0 && !loading ? (
        <p className="text-muted text-center">No challenges found.</p>
      ) : (
        <Row xs={1} md={2} lg={3} className="g-4">
          {challenges.map(ch => (
            <Col key={ch._id}>
              <Card className="h-100 shadow-sm">
                <Card.Body>
                  <Card.Title className="text-primary">{ch.title}</Card.Title>
                  <Card.Text>
                    <strong>ID:</strong><br />
                    <code className="small">{ch._id}</code>
                  </Card.Text>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => copyToClipboard(ch._id)}
                  >
                    📋 Copy ID to View Submissions
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default AdminChallengeList;
