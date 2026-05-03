import React, { useRef, useState } from "react";
import { useEffect } from "react";
import { Card, Form, Button, Alert, Spinner, Table } from "react-bootstrap";
import * as XLSX from "xlsx";
import axios from "axios";
import { FaFileExcel, FaUpload, FaEye, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { useAuthContext } from "@/context/useAuthContext";

const baseURL = import.meta.env.VITE_API_BASE_URL || "";

const AdminFinalAssessmentUpload: React.FC = () => {
  const { user } = useAuthContext()
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [examId, setExamId] = useState("");
  const [exams, setExams] = useState([]);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await axios.get(
          `${baseURL}/api/assessment/admin/exams`,   // 🔥 your exams API
          {
            headers: {
              Authorization: `Bearer ${user?.token}`,
            },
          }
        );

        setExams(res.data.exams || []);
      } catch (err) {
        console.error("Failed to fetch exams", err);
      }
    };

    fetchExams();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setPreview([]);
    setResult(null);
    setError(null);
  };

  const handlePreview = async () => {
    if (!file) return;

    try {
      const buf = await file.arrayBuffer();
      const workbook = XLSX.read(buf, { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(
        workbook.Sheets[firstSheet],
        { defval: "" }
      );
      setPreview(rows.slice(0, 5));
    } catch (err: any) {
      setError("Preview failed: " + err.message);
    }
  };

  const handleUpload = async () => {
    /* ✅ ADD HERE (TOP OF FUNCTION) */
    if (!examId) {
      alert("Please select exam");
      return;
    }

    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const presignRes = await axios.post(
        `${baseURL}/api/final-assessment/generate-presigned-url`,
        {
          fileName: file.name,
          fileType: file.type,
          courseTitle: "FinalAssessment",
        },
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      const { uploadUrl, fileUrl } = presignRes.data;

      await fetch(uploadUrl, {
        method: "PUT",   // ✅ MUST BE PUT
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      const resp = await axios.post(
        `${baseURL}/api/final-assessment/upload-final-assessment`,
        { fileUrl, examId },
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      /* ✅ UPDATED RESULT */
      setResult({
        message: "Upload Success",
        count: resp.data.inserted || 0,
        details: resp.data.data || []
      });

    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Upload failed";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="assessment-upload-container">
      <Card className="upload-card">
        <Card.Body className="card-body-custom">

          {/* ================= EXAM SELECT ================= */}
          <Form.Group className="mb-3">
            <Form.Label>Select Exam</Form.Label>
            <Form.Control
              as="select"
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
            >
              <option value="">-- Select Exam --</option>
              {exams.map((exam: any) => (
                <option key={exam._id} value={exam._id}>
                  {exam.title}
                </option>
              ))}
            </Form.Control>

            {!examId && (
              <small className="text-danger">
                ⚠ Please select an exam before uploading
              </small>
            )}
          </Form.Group>

          {/* ================= HEADER ================= */}
          <div className="upload-header">
            <FaFileExcel className="upload-icon" />
            <div>
              <h5 className="upload-title">Upload MCQ Questions</h5>
              <p className="upload-subtitle">
                Upload Excel (.xlsx, .xls) with MCQ data
              </p>
            </div>
          </div>

          {/* ================= ERROR ================= */}
          {error && (
            <Alert variant="danger" className="custom-alert error-alert">
              <FaTimesCircle className="alert-icon" />
              <div>{error}</div>
            </Alert>
          )}

          {/* ================= SUCCESS ================= */}
          {result && (
            <Alert variant="success" className="custom-alert success-alert">
              <FaCheckCircle className="alert-icon" />
              <div>
                <strong>Upload Successful 🎉</strong>
                <div>Inserted Questions: {result.count}</div>
              </div>
            </Alert>
          )}

          {/* ================= FILE INPUT ================= */}
          <Form.Group className="mb-4">
            <Form.Label className="form-label-custom">
              <FaFileExcel className="label-icon" />
              Select Excel File
            </Form.Label>

            <Form.Control
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="file-input-custom"
            />

            <small className="form-text text-muted">
              Only Excel files are supported
            </small>
          </Form.Group>

          {/* ================= BUTTONS ================= */}
          <div className="button-group">
            <Button
              variant="secondary"
              className="preview-btn"
              disabled={!file || uploading}
              onClick={handlePreview}
            >
              <FaEye className="me-2" />
              Preview
            </Button>

            <Button
              variant="primary"
              className="upload-btn"
              disabled={!file || !examId || uploading}
              onClick={handleUpload}
            >
              {uploading ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <FaUpload className="me-2" />
                  Upload
                </>
              )}
            </Button>
          </div>

          {/* ================= FILE INFO ================= */}
          {file && (
            <div className="file-info">
              <FaFileExcel className="file-icon" />
              <div>
                <div className="file-name">{file.name}</div>
                <div className="file-size">
                  {(file.size / 1024).toFixed(2)} KB
                </div>
              </div>
            </div>
          )}

          {/* ================= PREVIEW ================= */}
          {preview.length > 0 && (
            <div className="preview-section">
              <hr className="preview-divider" />

              <h6 className="preview-title">
                <FaEye className="me-2" />
                Preview (First 5 Rows)
              </h6>

              <div className="table-responsive">
                <Table className="preview-table" bordered size="sm">
                  <thead>
                    <tr>
                      {Object.keys(preview[0]).map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((r, i) => (
                      <tr key={i}>
                        {Object.keys(preview[0]).map((h) => (
                          <td key={h}>{String(r[h] ?? "")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          )}

        </Card.Body>
      </Card>

      <style>{`
        .assessment-upload-container {
          background: transparent;
        }

        .upload-card {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          overflow: hidden;
        }

        .card-body-custom {
          padding: 1.5rem;
        }

        .upload-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #1f1f1f;
        }

        .upload-icon {
          font-size: 2rem;
          color: #ff7a00;
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

        .custom-alert {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 1rem;
          padding: 1rem;
          border-radius: 8px;
        }

        .error-alert {
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid #dc3545;
          color: #ff6b6b;
        }

        .success-alert {
          background: rgba(40, 167, 69, 0.1);
          border: 1px solid #28a745;
          color: #28a745;
        }

        .alert-icon {
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .result-preview {
          background: #000000;
          color: #e5e5e5;
          padding: 0.5rem;
          border-radius: 6px;
          margin-top: 0.5rem;
          font-size: 0.75rem;
          overflow-x: auto;
        }

        .form-label-custom {
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

        .file-input-custom {
          background: #000000;
          border: 1px solid #2c2c2c;
          color: #ffffff;
          padding: 0.625rem;
          border-radius: 8px;
        }

        .file-input-custom:focus {
          background: #141414;
          border-color: #ff7a00;
          box-shadow: 0 0 0 0.2rem rgba(255, 122, 0, 0.25);
        }

        .button-group {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .preview-btn {
          background: #2c2c2c;
          border: none;
          padding: 0.625rem 1.5rem;
          border-radius: 8px;
          color: #ffffff;
          transition: all 0.2s ease;
        }

        .preview-btn:hover:not(:disabled) {
          background: #3a3a3a;
        }

        .upload-btn {
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
          border: none;
          padding: 0.625rem 1.5rem;
          border-radius: 8px;
          color: #000000;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .upload-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 122, 0, 0.4);
        }

        .file-info {
          background: #000000;
          border: 1px solid #2c2c2c;
          border-radius: 8px;
          padding: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-top: 1rem;
        }

        .file-icon {
          color: #ff7a00;
          font-size: 1.25rem;
        }

        .file-name {
          color: #ffffff;
          font-weight: 500;
        }

        .file-size {
          color: #8a8a8a;
          font-size: 0.8rem;
        }

        .preview-section {
          margin-top: 1.5rem;
        }

        .preview-divider {
          border-color: #2c2c2c;
          margin: 1rem 0;
        }

        .preview-title {
          color: #ff7a00;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
        }

        .preview-table {
          background: #000000;
          color: #e5e5e5;
        }

        .preview-table thead th {
          background: #0a0a0a;
          color: #ff7a00;
          border-bottom: 2px solid #ff7a00;
        }

        .preview-table tbody td {
          border-color: #2c2c2c;
        }

        .preview-table tbody tr:hover {
          background: #141414;
        }

        @media (max-width: 768px) {
          .card-body-custom {
            padding: 1rem;
          }

          .button-group {
            flex-direction: column;
          }

          .preview-btn, .upload-btn {
            width: 100%;
          }

          .upload-header {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminFinalAssessmentUpload;