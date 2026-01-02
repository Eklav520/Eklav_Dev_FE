import React, { useEffect, useState } from 'react';
import {
  Container, Table, Spinner, Alert, Form, Row, Col, Pagination,
} from 'react-bootstrap';
import { useAuthContext } from '@/context/useAuthContext';

const AdminSubmissionList: React.FC = () => {
  const { user } = useAuthContext();
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const token = user?.token;

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLang, setSelectedLang] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Fetch Data
  useEffect(() => {
    if (!token) return;

    setLoading(true);
      fetch(`${baseURL}/admin/submitted-challenges`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setSubmissions(data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("Failed to fetch submissions");
        setLoading(false);
      });
  }, [token]);

  // Filter logic
  useEffect(() => {
    let temp = submissions;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      temp = temp.filter(sub =>
        sub.userId?.fullName?.toLowerCase().includes(term) ||
        sub.userId?.email?.toLowerCase().includes(term)
      );
    }

    if (selectedLang) {
      temp = temp.filter(sub => sub.language === selectedLang);
    }

    setFiltered(temp);
    setCurrentPage(1); // Reset to page 1 on filter
  }, [searchTerm, selectedLang, submissions]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const handlePageChange = (pageNum: number) => setCurrentPage(pageNum);

  const uniqueLanguages = [...new Set(submissions.map((s) => s.language))];

  return (
    <Container className="my-4">
      <h3 className="text-center text-primary mb-4">All Student Challenge Scores</h3>

      {/* 🔍 Search and Filter */}
      <Row className="mb-3">
        <Col md={6}>
          <Form.Control
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
        <Col md={4}>
          <Form.Select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)}>
            <option value="">Filter by Language</option>
            {uniqueLanguages.map((lang, idx) => (
              <option key={idx} value={lang}>{lang}</option>
            ))}
          </Form.Select>
        </Col>
      </Row>

      {/* 🔄 Loading and Error States */}
      {loading && (
        <div className="text-center"><Spinner animation="border" /></div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {/* 📋 Table */}
      {!loading && currentItems.length === 0 ? (
        <p className="text-muted text-center">No submissions found.</p>
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead className="table-primary">
              <tr>
                <th>#</th>
                <th>Student Name</th>
                <th>Email</th>
                <th>Language</th>
                <th>Submitted On</th>
                <th>Score</th>
                <th>AI Feedback</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((sub, idx) => (
                <tr key={sub._id}>
                  <td>{indexOfFirstItem + idx + 1}</td>
                  <td>{sub.userId?.fullName || '—'}</td>
                  <td>{sub.userId?.email || '—'}</td>
                  <td>{sub.language}</td>
                  <td>{new Date(sub.createdAt).toLocaleDateString()}</td>
                  <td>{sub.score != null ? sub.score : <span className="text-muted">Pending</span>}</td>
                  <td>{sub.feedback || <span className="text-muted">Not reviewed</span>}</td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* 📄 Pagination */}
          <div className="d-flex justify-content-center">
            <Pagination>
              {[...Array(totalPages)].map((_, i) => (
                <Pagination.Item
                  key={i}
                  active={i + 1 === currentPage}
                  onClick={() => handlePageChange(i + 1)}
                >
                  {i + 1}
                </Pagination.Item>
              ))}
            </Pagination>
          </div>
        </>
      )}
    </Container>
  );
};

export default AdminSubmissionList;
