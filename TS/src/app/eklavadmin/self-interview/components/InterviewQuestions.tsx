import React, { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";

const InterviewQuestions: React.FC = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!file) return;

    const fileType =
      file.type ||
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    try {
      // ===============================
      // Step 1: Get presigned POST data
      // ===============================
      const presignedRes = await fetch(
        `${baseURL}/s3/presign/interview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileType,
            context: "interview-questions", // ✅ REQUIRED
            assetType: "excel",
          }),
        }
      );

      if (!presignedRes.ok) {
        throw new Error("Failed to get presigned URL");
      }

      const { uploadUrl, fields, fileKey } = await presignedRes.json();

      // ===============================
      // Step 2: Upload using Presigned POST
      // ===============================
      const formData = new FormData();

      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });

      formData.append("file", file);

      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("S3 upload failed");
      }

      // ===============================
      // Step 3: Tell backend to parse Excel
      // ===============================
      const saveRes = await fetch(
        `${baseURL}/admin-upload-questions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileKey }),
        }
      );

      const data = await saveRes.json();
      setMessage(data.message || "Upload completed");
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
          onChange={(e) => {
            const input = e.target as HTMLInputElement;
            setFile(input.files?.[0] || null);
          }}
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
