import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Container, Form, Button, Alert, Card } from 'react-bootstrap';
import axios from 'axios';

const AdminUploadQuestions: React.FC = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMessage('');
      setError('');
    }
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${baseURL}/admin/upload-questions`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage('✅ Questions uploaded successfully!');
      setFile(null);
    } catch (err) {
      console.error(err);
      setError('❌ Upload failed. Please check file format or server.');
    }
  };

  return (
    <Container className="mt-4">
      <Card className="p-4">
        <h4>📥 Upload Company Questions (Excel)</h4>
        <Form onSubmit={handleUpload}>
          <Form.Group controlId="formFile" className="mt-3">
            <Form.Label>Select Excel File</Form.Label>
            <Form.Control
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
            />
          </Form.Group>
          <Button
            type="submit"
            className="mt-3"
            disabled={!file}
            variant="primary"
          >
            Upload
          </Button>
        </Form>
        {message && <Alert variant="success" className="mt-3">{message}</Alert>}
        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
      </Card>
    </Container>
  );
};

export default AdminUploadQuestions;
