import React, { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuthContext } from '@/context/useAuthContext';

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
  const [result, setResult] = useState<UploadResult>(null);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setResult(null);
    setFile(e.currentTarget.files?.[0] ?? null);
  };

  const handleUpload = async () => {
    if (!file) return;

    // Add auth header only if we actually have a token
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
    } catch (e: any) {
      setResult({ success: false, error: e?.message || 'Upload failed' });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    // CSV template (you can open in Excel → Save As .xlsx)
    const csv = [
      'Topic,Question',
      'Communication,Describe a conflict you resolved at work.',
      'Teamwork,How do you handle tight deadlines?',
      'Leadership,How do you motivate a team?',
      'Culture Fit,Why do you want to work here?',
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'HRInterviewQuestionsTemplate.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4">
      <h4>📥 Upload HR Interview Questions</h4>
      <p className="text-muted mb-3">
        Expected headers: <code>Topic</code> | <code>Question</code>. Upload an Excel file
        (<code>.xlsx</code> / <code>.xls</code>). You can also{' '}
        <Button variant="link" className="p-0 align-baseline" onClick={downloadTemplate}>
          download a CSV template
        </Button>{' '}
        and save it as <code>.xlsx</code> before uploading.
      </p>

      <Form.Group className="mb-3" controlId="excelFileInput">
        <Form.Label>Select Excel File (.xlsx / .xls)</Form.Label>
        <Form.Control type="file" accept=".xlsx,.xls" onChange={onFile} />
      </Form.Group>

      <div className="d-flex gap-2">
        <Button onClick={handleUpload} disabled={!file || loading}>
          {loading ? <Spinner size="sm" animation="border" /> : 'Upload'}
        </Button>
        {file && <span className="text-muted">{file.name}</span>}
      </div>

      {result && (
        <Alert className="mt-3" variant={result.success ? 'success' : 'danger'}>
          {result.message || result.error || (result.success ? 'Uploaded.' : 'Upload failed.')}
          {(result.processed !== undefined ||
            result.inserted !== undefined ||
            result.updated !== undefined ||
            result.skipped !== undefined) && (
            <div className="mt-2 small">
              {result.processed !== undefined && (
                <div><strong>Processed:</strong> {result.processed}</div>
              )}
              {result.inserted !== undefined && (
                <div><strong>Inserted:</strong> {result.inserted}</div>
              )}
              {result.updated !== undefined && (
                <div><strong>Updated:</strong> {result.updated}</div>
              )}
              {result.skipped !== undefined && (
                <div><strong>Skipped:</strong> {result.skipped}</div>
              )}
            </div>
          )}
        </Alert>
      )}
    </div>
  );
}
