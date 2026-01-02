import React, { useRef, useState } from "react";
import { Card, Form, Button, Alert, Spinner, Table } from "react-bootstrap";
import * as XLSX from "xlsx";
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "";

const AdminFinalAssessmentUpload: React.FC = () => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { defval: "" });
      setPreview(rows.slice(0, 5));
    } catch (err: any) {
      setError("Preview failed: " + err.message);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      // Step 1: Presign
      const presign = await axios.post(`${baseURL}/s3/generate-presigned-url`, {
        fileName: file.name,
        fileType: file.type,
        folder: "FinalAssessment",
      });
      const { uploadUrl, fileUrl } = presign.data;

      // Step 2: PUT to S3
      await axios.put(uploadUrl, file, { headers: { "Content-Type": file.type } });

      // Step 3: Notify backend
      const resp = await axios.post(`${baseURL}/api/final-assessment/upload-final-assessment`, { fileUrl });
      setResult(resp.data);
    } catch (err: any) {
      setError("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Body>
        <h5>📥 Upload Final Assessment (Excel)</h5>

        {error && <Alert variant="danger">{error}</Alert>}
        {result && <Alert variant="success">Upload complete. {JSON.stringify(result)}</Alert>}

        <Form.Group className="mb-3">
          <Form.Control ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
        </Form.Group>

        <div className="d-flex gap-2">
          <Button variant="secondary" disabled={!file || uploading} onClick={handlePreview}>
            Preview
          </Button>
          <Button variant="primary" disabled={!file || uploading} onClick={handleUpload}>
            {uploading ? <Spinner size="sm" animation="border" /> : "Upload"}
          </Button>
        </div>

        {preview.length > 0 && (
          <>
            <hr />
            <h6>Preview (first 5 rows of first sheet)</h6>
            <Table bordered size="sm">
              <thead>
                <tr>{Object.keys(preview[0]).map((h) => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i}>{Object.keys(preview[0]).map((h) => <td key={h}>{String(r[h] ?? "")}</td>)}</tr>
                ))}
              </tbody>
            </Table>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default AdminFinalAssessmentUpload;
