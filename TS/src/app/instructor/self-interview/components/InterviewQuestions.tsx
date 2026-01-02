import React, { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";

const InterviewQuestions: React.FC = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return;

    try {
      // Step 1: Ask backend for presigned URL
      const presignedRes = await fetch(`${baseURL}/s3/generate-presigned-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          folder: "excel/interview", // 👈 keep files organized
        }),
      });

      const { uploadUrl, fileUrl } = await presignedRes.json();

      // Step 2: Upload file to S3
      await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      // Step 3: Tell backend to parse + save
      const saveRes = await fetch(`${baseURL}/admin-upload-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl }),
      });

      const data = await saveRes.json();
      setMessage(data.message);
    } catch (err) {
      console.error(err);
      setMessage("Upload failed.");
    }
  };

  return (
    <div className="p-4">
      <h4>📥 Upload Interview Questions (Excel)</h4>
      <Form.Group>
        <Form.Label>Select Excel File (.xlsx)</Form.Label>
        <Form.Control
          type="file"
          accept=".xlsx"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setFile(e.target.files?.[0] || null)
          }
        />
      </Form.Group>
      <Button className="mt-3" onClick={handleUpload}>
        Upload
      </Button>
      {message && <Alert className="mt-3">{message}</Alert>}
    </div>
  );
};

export default InterviewQuestions;
