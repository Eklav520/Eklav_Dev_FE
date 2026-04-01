import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuthContext } from '@/context/useAuthContext';
import { 
  FaFileExcel, 
  FaUpload, 
  FaDownload, 
  FaCheckCircle, 
  FaTimesCircle,
  FaSpinner,
  FaDatabase,
  FaPlus,
  FaTrash,
  FaUsers,
  FaBriefcase,
  FaBook
} from 'react-icons/fa';
import axios from 'axios';

type UploadResult =
  | {
      success?: boolean;
      message?: string;
      error?: string;
      processed?: number;
      inserted?: number;
      updated?: number;
      skipped?: number;
    }
  | null;

export default function AdminHRQuestionsUpload(): JSX.Element {
  const baseURL = import.meta.env.VITE_API_BASE_URL as string;
  const { user } = useAuthContext();
  const token = (user as any)?.token as string | undefined;

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [examId, setExamId] = useState("");
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamTitle, setSelectedExamTitle] = useState("");
  const [result, setResult] = useState<UploadResult>(null);

  // Fetch exams on component mount
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await axios.get(
          `${baseURL}/api/assessment/admin/exams`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setExams(res.data.exams || []);
      } catch (err) {
        console.error("Failed to fetch exams", err);
      }
    };

    if (token) {
      fetchExams();
    }
  }, [token]);

  // Update selected exam title when examId changes
  useEffect(() => {
    if (examId) {
      const selectedExam = exams.find(exam => exam._id === examId)
      setSelectedExamTitle(selectedExam?.title || "")
    } else {
      setSelectedExamTitle("")
    }
  }, [examId, exams])

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResult(null);
    setFile(e.currentTarget.files?.[0] ?? null);
  };

  const handleUpload = async () => {
    if (!file) {
      setResult({ success: false, error: 'Please select a file to upload' });
      return;
    }
    
    if (!examId) {
      setResult({ success: false, error: 'Please select an exam first' });
      return;
    }

    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (!headers.Authorization) {
      setResult({ success: false, error: 'Not authenticated' });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('excelFile', file);
      formData.append('examId', examId);

      const endpoint = `${baseURL}/admin/hr/upload-questions`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult({
          success: false,
          error: data?.error || data?.message || `Upload failed (${res.status})`,
        });
        return;
      }
      setResult(data);
      
      // Clear file after successful upload
      if (data.success) {
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (e: any) {
      setResult({ success: false, error: e?.message || 'Upload failed' });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csv = [
      'Topic,Question',
      'Communication,Describe a conflict you resolved at work.',
      'Teamwork,How do you handle tight deadlines?',
      'Leadership,How do you motivate a team?',
      'Culture Fit,Why do you want to work here?',
      'Problem Solving,Describe a challenging problem you solved.',
      'Adaptability,How do you handle change in the workplace?',
      'Motivation,What motivates you to do your best work?',
      'Conflict Resolution,How do you handle disagreements with colleagues?',
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HRInterviewQuestions_${selectedExamTitle || 'Template'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="hr-upload-container">
      <div className="upload-wrapper">
        {/* Header */}
        <div className="upload-header">
          <div className="header-icon-wrapper">
            <FaBriefcase className="header-icon" />
          </div>
          <div className="header-text">
            <h4 className="upload-title">HR Interview Questions</h4>
            <p className="upload-subtitle">Upload HR interview question bank</p>
          </div>
        </div>

        {/* Exam Selection Section */}
        <div className="exam-section">
          <div className="exam-info">
            <FaBook className="exam-icon" />
            <span>Select Exam for HR Questions</span>
          </div>
          <Form.Group className="exam-select-group">
            <Form.Label className="exam-label">
              Choose Assessment
            </Form.Label>
            <Form.Control
              as="select"
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              className="exam-select"
            >
              <option value="">-- Select Exam --</option>
              {exams.map((exam: any) => (
                <option key={exam._id} value={exam._id}>
                  {exam.title}
                </option>
              ))}
            </Form.Control>
            {selectedExamTitle && (
              <div className="selected-exam-badge">
                <FaCheckCircle className="badge-icon" />
                <span>Selected: <strong>{selectedExamTitle}</strong></span>
              </div>
            )}
            {!examId && (
              <small className="exam-warning">
                ⚠ Please select an exam before uploading HR questions
              </small>
            )}
          </Form.Group>
        </div>

        {/* Template Download */}
        <div className="template-section">
          <div className="template-info">
            <FaDownload className="template-icon" />
            <span>Expected headers: <code>Topic</code> | <code>Question</code></span>
          </div>
          <Button 
            variant="link" 
            className="template-download-btn"
            onClick={downloadTemplate}
            disabled={!examId}
            title={!examId ? "Please select an exam first" : "Download template"}
          >
            <FaDownload className="me-2" />
            Download CSV Template
          </Button>
        </div>

        {/* File Upload Area */}
        <div className="file-upload-area">
          <Form.Group controlId="fileInput">
            <Form.Label className="upload-label">
              <FaFileExcel className="label-icon" />
              Select Excel File (.xlsx / .xls)
            </Form.Label>
            <Form.Control
              type="file"
              accept=".xlsx,.xls"
              onChange={onFile}
              className="file-input"
              disabled={!examId}
            />
            <small className="file-hint">
              Supported formats: .xlsx, .xls | Maximum file size: 10MB
            </small>
          </Form.Group>

          {file && (
            <div className="selected-file">
              <FaFileExcel className="file-icon" />
              <span className="file-name">{file.name}</span>
              <span className="file-size">
                ({(file.size / 1024).toFixed(2)} KB)
              </span>
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="upload-action">
          <Button 
            className="upload-btn"
            onClick={handleUpload} 
            disabled={!file || !examId || loading}
          >
            {loading ? (
              <>
                <FaSpinner className="spinner-icon" />
                Uploading to {selectedExamTitle || 'Exam'}...
              </>
            ) : (
              <>
                <FaUpload className="me-2" />
                Upload HR Questions to {selectedExamTitle || 'Exam'}
              </>
            )}
          </Button>
        </div>

        {/* Result Alert */}
        {result && (
          <Alert
            className={`result-alert ${result.success ? 'success-alert' : 'error-alert'}`}
            variant={result.success ? 'success' : 'danger'}
          >
            <div className="alert-header">
              {result.success ? (
                <FaCheckCircle className="alert-icon success" />
              ) : (
                <FaTimesCircle className="alert-icon error" />
              )}
              <span className="alert-message">
                {result.message || result.error || (result.success ? 'Upload completed successfully!' : 'Upload failed.')}
              </span>
            </div>
            
            {(result.processed !== undefined ||
              result.inserted !== undefined ||
              result.updated !== undefined ||
              result.skipped !== undefined) && (
              <div className="stats-grid">
                {result.processed !== undefined && (
                  <div className="stat-item">
                    <FaDatabase className="stat-icon" />
                    <div>
                      <span className="stat-label">Processed</span>
                      <span className="stat-value">{result.processed}</span>
                    </div>
                  </div>
                )}
                {result.inserted !== undefined && (
                  <div className="stat-item">
                    <FaPlus className="stat-icon success" />
                    <div>
                      <span className="stat-label">Inserted</span>
                      <span className="stat-value">{result.inserted}</span>
                    </div>
                  </div>
                )}
                {result.updated !== undefined && (
                  <div className="stat-item">
                    <FaDatabase className="stat-icon info" />
                    <div>
                      <span className="stat-label">Updated</span>
                      <span className="stat-value">{result.updated}</span>
                    </div>
                  </div>
                )}
                {result.skipped !== undefined && (
                  <div className="stat-item">
                    <FaTrash className="stat-icon warning" />
                    <div>
                      <span className="stat-label">Skipped</span>
                      <span className="stat-value">{result.skipped}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Alert>
        )}
      </div>

      <style>{`
        .hr-upload-container {
          background: transparent;
          width: 100%;
        }

        .upload-wrapper {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          padding: 1.5rem;
        }

        /* Header */
        .upload-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #1f1f1f;
        }

        .header-icon-wrapper {
          width: 48px;
          height: 48px;
          background: rgba(255, 122, 0, 0.1);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-icon {
          font-size: 1.75rem;
          color: #ff7a00;
        }

        .header-text {
          flex: 1;
        }

        .upload-title {
          color: #ffffff;
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
        }

        .upload-subtitle {
          color: #8a8a8a;
          font-size: 0.85rem;
          margin: 0.25rem 0 0 0;
        }

        /* Exam Section */
        .exam-section {
          background: #000000;
          border: 1px solid #2c2c2c;
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        }

        .exam-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #2c2c2c;
          color: #ff7a00;
          font-weight: 500;
        }

        .exam-icon {
          font-size: 1rem;
          color: #ff7a00;
        }

        .exam-select-group {
          margin-bottom: 0;
        }

        .exam-label {
          color: #ff7a00;
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 0.5rem;
          display: block;
        }

        .exam-select {
          background: #000000;
          border: 1px solid #2c2c2c;
          color: #ffffff;
          padding: 0.625rem;
          border-radius: 8px;
          cursor: pointer;
        }

        .exam-select:focus {
          background: #141414;
          border-color: #ff7a00;
          box-shadow: 0 0 0 0.2rem rgba(255, 122, 0, 0.25);
        }

        .selected-exam-badge {
          background: rgba(40, 167, 69, 0.1);
          border: 1px solid #28a745;
          border-radius: 6px;
          padding: 0.5rem;
          margin-top: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #28a745;
        }

        .badge-icon {
          font-size: 0.75rem;
        }

        .exam-warning {
          color: #ffc107;
          font-size: 0.7rem;
          margin-top: 0.5rem;
          display: block;
        }

        /* Template Section */
        .template-section {
          background: #000000;
          border: 1px solid #2c2c2c;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .template-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #e5e5e5;
          font-size: 0.9rem;
        }

        .template-icon {
          color: #ff7a00;
          font-size: 1rem;
        }

        .template-info code {
          background: #1a1a1a;
          color: #ff7a00;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.85rem;
        }

        .template-download-btn {
          color: #ff7a00;
          text-decoration: none;
          padding: 0.375rem 1rem;
          border: 1px solid #ff7a00;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .template-download-btn:hover:not(:disabled) {
          background: #ff7a00;
          color: #000000;
          text-decoration: none;
        }

        .template-download-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* File Upload Area */
        .file-upload-area {
          margin-bottom: 1.5rem;
        }

        .upload-label {
          color: #ff7a00;
          font-weight: 500;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .label-icon {
          font-size: 0.9rem;
        }

        .file-input {
          background: #000000;
          border: 1px solid #2c2c2c;
          color: #ffffff;
          padding: 0.625rem;
          borderRadius: 8px;
          cursor: pointer;
        }

        .file-input:focus {
          background: #141414;
          border-color: #ff7a00;
          box-shadow: 0 0 0 0.2rem rgba(255, 122, 0, 0.25);
        }

        .file-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .file-input::file-selector-button {
          background: #2c2c2c;
          border: none;
          color: #ffffff;
          padding: 0.375rem 1rem;
          border-radius: 6px;
          margin-right: 1rem;
          cursor: pointer;
        }

        .file-input::file-selector-button:hover:not(:disabled) {
          background: #3a3a3a;
        }

        .file-hint {
          color: #6c757d;
          font-size: 0.75rem;
          margin-top: 0.5rem;
          display: block;
        }

        .selected-file {
          background: #000000;
          border: 1px solid #2c2c2c;
          border-radius: 8px;
          padding: 0.75rem;
          margin-top: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .file-icon {
          color: #ff7a00;
          font-size: 1.25rem;
        }

        .file-name {
          color: #ffffff;
          font-weight: 500;
          flex: 1;
        }

        .file-size {
          color: #8a8a8a;
          font-size: 0.8rem;
        }

        /* Upload Button */
        .upload-action {
          margin-bottom: 1.5rem;
        }

        .upload-btn {
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 8px;
          color: #000000;
          font-weight: 600;
          width: 100%;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .upload-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 122, 0, 0.4);
        }

        .upload-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner-icon {
          animation: spin 1s linear infinite;
          margin-right: 0.5rem;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Result Alert */
        .result-alert {
          margin-top: 1rem;
          padding: 1rem;
          border-radius: 8px;
          border-left: 4px solid;
        }

        .success-alert {
          background: rgba(40, 167, 69, 0.1);
          border-left-color: #28a745;
        }

        .error-alert {
          background: rgba(220, 53, 69, 0.1);
          border-left-color: #dc3545;
        }

        .alert-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .alert-icon {
          font-size: 1.25rem;
        }

        .alert-icon.success {
          color: #28a745;
        }

        .alert-icon.error {
          color: #dc3545;
        }

        .alert-message {
          color: #ffffff;
          font-weight: 500;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          margin-top: 1rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 6px;
        }

        .stat-icon {
          font-size: 1rem;
          color: #ff7a00;
        }

        .stat-icon.success {
          color: #28a745;
        }

        .stat-icon.info {
          color: #17a2b8;
        }

        .stat-icon.warning {
          color: #ffc107;
        }

        .stat-item div {
          flex: 1;
        }

        .stat-label {
          display: block;
          color: #8a8a8a;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .stat-value {
          display: block;
          color: #ffffff;
          font-size: 1.1rem;
          font-weight: 600;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .upload-wrapper {
            padding: 1rem;
          }

          .template-section {
            flex-direction: column;
            align-items: flex-start;
          }

          .template-download-btn {
            width: 100%;
            text-align: center;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .stat-item {
            padding: 0.75rem;
          }

          .upload-header {
            flex-direction: column;
            text-align: center;
          }

          .header-icon-wrapper {
            margin: 0 auto;
          }

          .exam-section {
            padding: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}