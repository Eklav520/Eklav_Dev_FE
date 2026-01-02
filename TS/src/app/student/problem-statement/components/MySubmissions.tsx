import { useAuthContext } from '@/context/useAuthContext';
import React, { useEffect, useState } from 'react';
import { Container, Table, Spinner, Alert, Badge, Card, OverlayTrigger, Tooltip } from 'react-bootstrap';

const MySubmissions: React.FC = () => {
  const { user } = useAuthContext();
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const token = user?.token;
  const userId = user?.id;

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !userId) return;

    setLoading(true);

    fetch(`${baseURL}/student/submissions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch submissions');
        return res.json();
      })
      .then((data) => setSubmissions(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, userId]);

  if (loading) {
    return (
      <Container className="my-4 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  const renderScoreBadge = (score: number | null) => {
    if (score == null) return <Badge bg="secondary">Not graded</Badge>;
    if (score >= 80) return <Badge bg="success">{score}</Badge>;
    if (score >= 50) return <Badge bg="warning text-dark">{score}</Badge>;
    return <Badge bg="danger">{score}</Badge>;
  };

  return (
    <Container fluid className="my-4">
      <Card className="shadow-sm">
        <Card.Body className="p-0">
          {error && <Alert variant="danger" className="m-3">{error}</Alert>}

          {submissions.length === 0 ? (
            <p className="m-3 text-muted">No submissions found.</p>
          ) : (
            <Table striped bordered hover responsive className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>AI Feedback</th>
                  <th className="text-center">Score</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub, index) => (
                  <tr key={sub._id}>
                    <td>{index + 1}</td>
                    <td>{sub.challengeId?.title || '—'}</td>
                    <td style={{ maxWidth: "300px" }}>
                      {sub.feedback ? (
                        <OverlayTrigger
                          placement="top"
                          overlay={<Tooltip>{sub.feedback}</Tooltip>}
                        >
                          <span>
                            {sub.feedback.length > 60
                              ? sub.feedback.substring(0, 60) + "..."
                              : sub.feedback}
                          </span>
                        </OverlayTrigger>
                      ) : (
                        <span className="text-secondary">Pending</span>
                      )}
                    </td>
                    <td className="text-center">{renderScoreBadge(sub.score)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default MySubmissions;
