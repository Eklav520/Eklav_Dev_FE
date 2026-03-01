import React, { useState } from 'react';
import { Button, Card, Col, Container, Form, Row, Table } from 'react-bootstrap';

interface TestCase {
  input: string;
  expectedOutput: string;
  type: string;
}

interface ProblemForm {
  title: string;
  description: string;
  techOptions: string[];
  testCases: TestCase[];
}

export default function AdminCreateProblem() {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [form, setForm] = useState<ProblemForm>({
    title: '',
    description: '',
    techOptions: [],
    testCases: [],
  });

  const [testCase, setTestCase] = useState<TestCase>({
    input: '',
    expectedOutput: '',
    type: 'positive',
  });

  const handleSubmit = async () => {
    const response = await fetch(`${baseURL}/admin/create-problem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (response.ok) {
      alert('Problem created!');
      setForm({ title: '', description: '', techOptions: [], testCases: [] });
    }
  };

  const addTestCase = () => {
    if (testCase.input && testCase.expectedOutput) {
      setForm({ ...form, testCases: [...form.testCases, testCase] });
      setTestCase({ input: '', expectedOutput: '', type: 'positive' });
    }
  };

  return (
    <Container className="my-4">
      <Card className="shadow-lg p-4 rounded-4">
        <h3 className="mb-4 text-center">🧠 Create Coding Problem</h3>

        <Form.Group className="mb-3">
          <Form.Label>Title</Form.Label>
          <Form.Control
            placeholder="Enter problem title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            placeholder="Enter problem description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label>Technologies (comma separated)</Form.Label>
          <Form.Control
            placeholder="e.g. JavaScript, Python"
            onChange={(e) =>
              setForm({
                ...form,
                techOptions: e.target.value.split(',').map((t) => t.trim()),
              })
            }
          />
        </Form.Group>

        <h5 className="mb-3">🧪 Add Test Case</h5>
        <Row className="g-3 align-items-end">
          <Col md={4}>
            <Form.Control
              placeholder="Input"
              value={testCase.input}
              onChange={(e) => setTestCase({ ...testCase, input: e.target.value })}
            />
          </Col>
          <Col md={4}>
            <Form.Control
              placeholder="Expected Output"
              value={testCase.expectedOutput}
              onChange={(e) =>
                setTestCase({ ...testCase, expectedOutput: e.target.value })
              }
            />
          </Col>
          <Col md={3}>
            <Form.Select
              value={testCase.type}
              onChange={(e) => setTestCase({ ...testCase, type: e.target.value })}
            >
              <option value="positive">Positive</option>
              <option value="negative">Negative</option>
            </Form.Select>
          </Col>
          <Col md={1}>
            <Button variant="outline-secondary" onClick={addTestCase}>
              ➕
            </Button>
          </Col>
        </Row>

        {form.testCases.length > 0 && (
          <Table striped bordered hover responsive className="mt-4">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Input</th>
                <th>Expected Output</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {form.testCases.map((tc, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{tc.input}</td>
                  <td>{tc.expectedOutput}</td>
                  <td>{tc.type}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        <div className="text-end mt-4">
          <Button variant="primary" onClick={handleSubmit}>
            🚀 Create Problem
          </Button>
        </div>
      </Card>
    </Container>
  );
}
