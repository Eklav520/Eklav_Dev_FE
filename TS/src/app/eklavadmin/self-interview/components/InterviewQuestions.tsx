import React, { useState } from "react";
import * as XLSX from "xlsx";
import { FaCloudUploadAlt, FaDownload, FaExclamationTriangle, FaFileExcel, FaSpinner, FaTimes } from "react-icons/fa";
import { useAuthContext } from "@/context/useAuthContext";
import { Dropzone, UploadCard, UploadSummary } from "../../aptitudeQuestionsUpload/components/UploadParts";

const SAMPLE_ROWS = [
  ["React", "What is a virtual DOM in React?"],
  ["JavaScript", "Explain closures in JavaScript."],
  ["HTML", "What are semantic HTML elements?"],
];

type UploadResult = { inserted?: number; updated?: number; skipped?: number; message?: string };

const InterviewQuestions: React.FC = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const { user } = useAuthContext();
  const token = user?.token;

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [uploading, setUploading] = useState(false);

  // The upload only accepts Excel, so the template is a real .xlsx (it used to be a CSV)
  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([["Topic", "Question"], ...SAMPLE_ROWS]);
    ws["!cols"] = [{ wch: 18 }, { wch: 60 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, "SelfInterview_Questions_Template.xlsx");
  };

  const acceptFile = (selected: File) => {
    setError("");
    setResult(null);
    const ext = selected.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "xls") {
      setError("Please choose an Excel file (.xlsx or .xls).");
      return;
    }
    setFile(selected);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select an Excel file (.xlsx or .xls) before uploading.");
      return;
    }
    if (!token) {
      setError("You must be signed in to upload questions.");
      return;
    }

    setUploading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("excelFile", file);

      const response = await fetch(`${baseURL}/admin/self-interview/upload-questions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || "Upload failed.");
      }

      setResult({ inserted: data.inserted ?? 0, updated: data.updated ?? 0, skipped: data.skipped ?? 0, message: data.message });
      setFile(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Upload failed. Please check the template and try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <UploadCard
      icon={FaFileExcel}
      title="Interview Question Bank"
      subtitle="Questions students get in their self-interview practice, grouped by topic"
      sample={<button type="button" className="aui-btn" onClick={downloadTemplate}><FaDownload size={11} /> Download template</button>}
      guide={
        <>
          <h4>Expected format</h4>
          <div className="siq-sample">
            <table className="aui-table">
              <thead><tr><th style={{ width: 110 }}>Topic</th><th>Question</th></tr></thead>
              <tbody>
                {SAMPLE_ROWS.map(([topic, q]) => (
                  <tr key={q}><td><span className="aui-badge aui-badge-orange">{topic}</span></td><td>{q}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="aqu-rules" style={{ marginTop: "0.9rem" }}>
            <li>Only the <b>first worksheet</b> is read</li>
            <li>Row 1 must be the headers <code>Topic</code> and <code>Question</code></li>
            <li>One question per row; the topic groups questions for students</li>
          </ul>
        </>
      }
    >
      {error && (
        <div className="aui-alert"><FaExclamationTriangle /> <span>{error}</span>
          <button type="button" className="aui-alert-close" onClick={() => setError("")} aria-label="Dismiss"><FaTimes size={11} /></button>
        </div>
      )}

      <Dropzone
        accept=".xlsx,.xls"
        hint="Excel (.xlsx / .xls)"
        icon={FaFileExcel}
        file={file}
        disabled={uploading}
        onFile={acceptFile}
        onClear={() => { setFile(null); setError(""); }}
        fileSize={(f) => `${(f.size / 1024).toFixed(1)} KB`}
      />

      {result && (
        <>
          <UploadSummary inserted={result.inserted} updated={result.updated} skipped={result.skipped} />
          {result.message && <p className="aui-hint">{result.message}</p>}
        </>
      )}

      <div className="aqu-actions">
        <button type="button" className="aui-btn aui-btn-primary" onClick={handleUpload} disabled={uploading || !file}>
          {uploading ? <><FaSpinner className="aui-spin" style={{ color: "#fff" }} /> Uploading…</> : <><FaCloudUploadAlt /> Upload Questions</>}
        </button>
      </div>

      <style>{`
        .siq-sample { overflow: hidden; border: 1px solid #25282b; border-radius: 10px; }
        .siq-sample .aui-table td { font-size: 0.76rem; }
      `}</style>
    </UploadCard>
  );
};

export default InterviewQuestions;
