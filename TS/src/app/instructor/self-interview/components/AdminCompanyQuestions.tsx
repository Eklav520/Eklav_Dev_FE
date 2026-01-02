import React, { useEffect, useState } from 'react';
import { Accordion, Card, Container, Spinner, Table, Badge } from 'react-bootstrap';
import axios from 'axios';

interface QuestionItem {
  level: 'beginner' | 'middle' | 'experienced';
  question: string;
}

interface CompanyQuestions {
  [round: string]: QuestionItem[];
}

interface AllCompanies {
  [company: string]: CompanyQuestions;
}

const levelColorMap = {
  beginner: 'success',
  middle: 'warning',
  experienced: 'danger'
};

const AdminCompanyQuestions: React.FC = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [data, setData] = useState<AllCompanies>({});
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    axios.get(`${baseURL}/admin/questions`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching questions', err);
        setLoading(false);
      });
  }, []);

  return (
    <Container className="mt-4">
      <h4 className="mb-4">📊 Uploaded Companies and Questions</h4>
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <Accordion alwaysOpen>
          {Object.entries(data).map(([company, rounds], idx) => (
            <Accordion.Item eventKey={idx.toString()} key={company}>
              <Accordion.Header>{company}</Accordion.Header>
              <Accordion.Body>
                {Object.entries(rounds).map(([round, questions]) => (
                  <Card key={round} className="mb-3">
                    <Card.Header>
                      <strong>🌀 {round} Round</strong>
                    </Card.Header>
                    <Card.Body>
                      <Table striped bordered hover responsive>
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Question</th>
                            <th>Level</th>
                          </tr>
                        </thead>
                        <tbody>
                          {questions.map((q, index) => (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td>{q.question}</td>
                              <td>
                                <Badge bg={levelColorMap[q.level]}>{q.level}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </Card.Body>
                  </Card>
                ))}
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </Container>
  );
};

export default AdminCompanyQuestions;
