import React, { useState } from "react";
import { Form, Button, Alert, Table, Card } from "react-bootstrap";
import { useAuthContext } from "@/context/useAuthContext";

const InterviewQuestions: React.FC = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const { user } = useAuthContext();
  const token = user?.token;

  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [alertVariant, setAlertVariant] = useState<"success" | "danger">("success");
  const [uploading, setUploading] = useState(false);

  const downloadTemplate = () => {
    const rows = [
      ["Topic", "Question"],
      ["React", "What is a virtual DOM in React?"],
      ["JavaScript", "Explain closures in JavaScript."],
      ["HTML", "What are semantic HTML elements?"],
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "TR_InterviewQuestions_Template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = async () => {
    if (!file) {
      setAlertVariant("danger");
      setMessage("Please select an Excel file (.xlsx or .xls) before uploading.");
      return;
    }

    if (!token) {
      setAlertVariant("danger");
      setMessage("You must be signed in to upload questions.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("excelFile", file);

      const response = await fetch(`${baseURL}/admin/tr/upload-questions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || "Upload failed.");
      }

      setAlertVariant("success");
      setMessage(
        data.message || `Upload completed. Inserted: ${data.inserted ?? 0}, Updated: ${data.updated ?? 0}, Skipped: ${data.skipped ?? 0}`
      );
      setFile(null);

      const fileInput = document.getElementById("interviewFileUpload") as HTMLInputElement | null;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err) {
      console.error(err);
      setAlertVariant("danger");
      setMessage(
        err instanceof Error
          ? err.message
          : "Upload failed. Please check the template and try again."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4">
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
            <div>
              <h4>Upload Self Interview Questions</h4>
              <p className="text-muted mb-0">
                Backend expects the first worksheet and headers <strong>Topic</strong> and <strong>Question</strong>.
              </p>
            </div>
            <Button variant="outline-primary" onClick={downloadTemplate}>
              Download Template
            </Button>
          </div>

          <div className="mb-4 p-3 bg-light rounded-3 border">
            <h6 className="mb-3">Expected Excel template</h6>
            <Table bordered size="sm" className="mb-0">
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Question</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>React</td>
                  <td>What is a virtual DOM in React?</td>
                </tr>
                <tr>
                  <td>JavaScript</td>
                  <td>Explain closures in JavaScript.</td>
                </tr>
              </tbody>
            </Table>
          </div>

          <Form.Group controlId="interviewFileUpload">
            <Form.Label className="fw-semibold">Select Excel File (.xlsx / .xls)</Form.Label>
            <Form.Control
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => {
                const input = e.target as HTMLInputElement;
                setFile(input.files?.[0] || null);
                setMessage("");
              }}
            />
          </Form.Group>

          <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-3 mt-4">
            <Button variant="primary" onClick={handleUpload} disabled={uploading || !file}>
              {uploading ? "Uploading..." : "Upload Questions"}
            </Button>
            <small className="text-muted">
              Tip: use the first worksheet only and keep the header row in row 1.
            </small>
          </div>

          {message && (
            <Alert className="mt-4" variant={alertVariant}>
              {message}
            </Alert>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default InterviewQuestions;
