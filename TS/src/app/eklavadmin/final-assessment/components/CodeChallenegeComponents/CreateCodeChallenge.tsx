import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Alert,
  Badge,
  ListGroup,
  Modal,
  Table,
} from "react-bootstrap";
import { useAuthContext } from "@/context/useAuthContext";

type MatchType = "trimmed" | "exact" | "regex";

type TestCase = {
  input: string;
  expectedOutput: string;
  points: number;
  matchType: MatchType;
};

type TestSpec = {
  type: string;
  entry: string;
  command: string;
  timeoutSeconds: number;
  positiveTests: TestCase[];
  negativeTests: TestCase[];
};

type Challenge = {
  _id?: string;
  eventId: string; // This is the examId
  title: string;
  slug: string;
  description: string;
  timeLimitSeconds: number;
  maxScore: number;
  testSpec: TestSpec;
  visibility?: string;
  instituteId?: string;
  createdAt?: string;
  updatedAt?: string;
};

type Message = {
  type: "error" | "success";
  text: string;
};

export default function AdminCreateProblem({ defaultExamId, readOnly }: { defaultExamId?: string; readOnly?: boolean } = {}) {
  const [examId, setExamId] = useState<string>(defaultExamId || "");
  const [exams, setExams] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<Message | null>(null);
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const { user } = useAuthContext();

  useEffect(() => { if (defaultExamId) { setExamId(defaultExamId); setChallenges([]); } }, [defaultExamId]);

  // Modal state
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [challengeToDelete, setChallengeToDelete] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(60);
  const [maxScore, setMaxScore] = useState<number>(100);
  const [positiveTests, setPositiveTests] = useState<TestCase[]>([
    { input: "", expectedOutput: "", points: 1, matchType: "trimmed" },
  ]);
  const [negativeTests, setNegativeTests] = useState<TestCase[]>([]);
  const [showJsonPreview, setShowJsonPreview] = useState<boolean>(false);

  // Bulk upload state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkRows, setBulkRows] = useState<any[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const bulkFileRef = useRef<HTMLInputElement>(null);

  // Fetch exams
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await axios.get(`${baseURL}/api/assessment/admin/exams`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setExams(res.data.exams || []);
      } catch (err) {
        console.error("Failed to fetch exams", err);
        setExams([]);
      }
    };
    fetchExams();
  }, []);

  // Fetch challenges when exam is selected
  useEffect(() => {
    if (examId) {
      fetchChallenges();
    }
  }, [examId]);

  const fetchChallenges = async () => {
    try {
      const res = await axios.get(`${baseURL}/api/code-challenges/events/${examId}/codechallenges`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setChallenges(res.data.challenges || []);
    } catch (err) {
      console.error("Failed to fetch challenges", err);
      setChallenges([]);
    }
  };

  // Auto-generate slug
  useEffect(() => {
    const s = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(s);
  }, [title]);

  // Test case helpers
  const addPositive = () => {
    setPositiveTests((p) => [
      ...p,
      { input: "", expectedOutput: "", points: 1, matchType: "trimmed" },
    ]);
  };

  const removePositive = (i: number) => {
    setPositiveTests((p) => p.filter((_, idx) => idx !== i));
  };

  const updatePositive = (i: number, key: keyof TestCase, value: string | number) => {
    setPositiveTests((p) =>
      p.map((t, idx) => (idx === i ? { ...t, [key]: value } : t))
    );
  };

  const addNegative = () => {
    setNegativeTests((p) => [
      ...p,
      { input: "", expectedOutput: "", points: 1, matchType: "trimmed" },
    ]);
  };

  const removeNegative = (i: number) => {
    setNegativeTests((p) => p.filter((_, idx) => idx !== i));
  };

  const updateNegative = (i: number, key: keyof TestCase, value: string | number) => {
    setNegativeTests((p) =>
      p.map((t, idx) => (idx === i ? { ...t, [key]: value } : t))
    );
  };

  const buildTestSpec = (): TestSpec => {
    return {
      type: "node",
      entry: "index.js",
      command: "node index.js",
      timeoutSeconds: 5,
      positiveTests,
      negativeTests,
    };
  };

  const validateForm = (): string | null => {
    if (!title.trim()) return "Title is required";
    if (positiveTests.length === 0) return "Add at least one positive test";
    for (const t of [...positiveTests, ...negativeTests]) {
      if (typeof t.points !== "number" || isNaN(t.points) || t.points <= 0)
        return "All tests must have positive numeric points";
    }
    return null;
  };

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setDescription("");
    setTimeLimitMinutes(60);
    setMaxScore(100);
    setPositiveTests([{ input: "", expectedOutput: "", points: 1, matchType: "trimmed" }]);
    setNegativeTests([]);
    setEditingChallenge(null);
    setShowJsonPreview(false);
  };

  const handleOpenModal = (challenge?: Challenge) => {
    if (challenge) {
      // Edit mode
      setEditingChallenge(challenge);
      setTitle(challenge.title);
      setSlug(challenge.slug);
      setDescription(challenge.description);
      setTimeLimitMinutes(Math.floor(challenge.timeLimitSeconds / 60));
      setMaxScore(challenge.maxScore);
      setPositiveTests(challenge.testSpec.positiveTests || []);
      setNegativeTests(challenge.testSpec.negativeTests || []);
    } else {
      // Create new mode
      resetForm();
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSaveChallenge = async () => {
    if (!examId) {
      setMessage({ type: "error", text: "Please select an exam first" });
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    const payload = {
      title: title.trim(),
      slug: slug || undefined,
      description: description.trim(),
      timeLimitSeconds: Math.max(10, Math.floor(Number(timeLimitMinutes) * 60)),
      maxScore: Math.max(1, Number(maxScore) || 100),
      testSpec: buildTestSpec(),
    };

    setLoading(true);
    setMessage(null);

    try {
      if (editingChallenge?._id) {
        // Update existing challenge
        await axios.put(`${baseURL}/api/code-challenges/codechallenges/${editingChallenge._id}`, payload, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setMessage({ type: "success", text: "Challenge updated successfully!" });
      } else {
        // Create new challenge - this automatically links to the selected exam via eventId
        await axios.post(`${baseURL}/api/code-challenges/events/${examId}/codechallenges`, payload, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setMessage({ type: "success", text: "Challenge created successfully for this exam!" });
      }

      // Refresh the list
      await fetchChallenges();
      handleCloseModal();
    } catch (err: any) {
      const backendErr = err?.response?.data?.error || err.message || "Failed to save challenge";
      const friendly = backendErr.includes("coding round")
        ? "⚠️ This exam does not have a Coding round scheduled. Please edit the exam and add a Coding round before adding challenges."
        : backendErr;
      setMessage({ type: "error", text: friendly });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChallenge = async () => {
    if (!challengeToDelete) return;

    try {
      await axios.delete(`${baseURL}/api/code-challenges/codechallenges/${challengeToDelete}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      setMessage({ type: "success", text: "Challenge deleted successfully!" });
      await fetchChallenges();
      setShowDeleteModal(false);
      setChallengeToDelete(null);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err?.response?.data?.error || "Failed to delete challenge",
      });
    }
  };

  const copyJsonToClipboard = async () => {
    const txt = JSON.stringify(buildTestSpec(), null, 2);
    await navigator.clipboard.writeText(txt);
    setMessage({ type: "success", text: "Test spec copied to clipboard" });
  };

  // Download Excel template
  const downloadTemplate = () => {
    const rows = [
      // Row 1: Section headers
      ["CHALLENGE INFO", "", "TEST CASE 1 (required)", "", "", "", "TEST CASE 2", "", "", "", "TEST CASE 3", "", "", "", "EDGE CASE 1 (optional)", "", "EDGE CASE 2", ""],
      // Row 2: Column headers
      ["Title *", "Description *",
        "Input", "Expected Output", "Points", "Match Type",
        "Input", "Expected Output", "Points", "Match Type",
        "Input", "Expected Output", "Points", "Match Type",
        "Input", "Expected Output",
        "Input", "Expected Output"],
      // Row 3: Example
      [
        "Sum of Two Numbers",
        "Given two integers a and b on separate lines, print their sum.",
        "1\n2", "3", 10, "trimmed",
        "5\n7", "12", 10, "trimmed",
        "0\n0", "0", 10, "trimmed",
        "abc\ndef", "",
        "", "",
      ],
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },   // CHALLENGE INFO
      { s: { r: 0, c: 2 }, e: { r: 0, c: 5 } },   // TEST CASE 1
      { s: { r: 0, c: 6 }, e: { r: 0, c: 9 } },   // TEST CASE 2
      { s: { r: 0, c: 10 }, e: { r: 0, c: 13 } }, // TEST CASE 3
      { s: { r: 0, c: 14 }, e: { r: 0, c: 15 } }, // EDGE CASE 1
      { s: { r: 0, c: 16 }, e: { r: 0, c: 17 } }, // EDGE CASE 2
    ];
    ws["!cols"] = [30, 50, 20, 20, 8, 12, 20, 20, 8, 12, 20, 20, 8, 12, 20, 20, 20, 20].map(wch => ({ wch }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Challenges");
    XLSX.writeFile(wb, "coding_challenges_template.xlsx");
  };

  // Parse uploaded Excel file
  // Row 0 = section labels, row 1 = column headers, row 2+ = data
  // sheet_to_json with range:1 uses row 1 as header; duplicate column names get _1, _2 suffixes
  const handleBulkFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "", range: 1 });

      const str = (v: any) => String(v ?? "").trim();
      const num = (v: any, def: number) => Number(v) || def;

      const makeTest = (inp: any, exp: any, pts: any, mt: any) => ({
        input: str(inp), expectedOutput: str(exp),
        points: num(pts, 10), matchType: str(mt) || "trimmed",
      });

      const parsed = rows.map((r: any) => ({
        title: str(r["Title *"]),
        description: str(r["Description *"]),
        timeLimitMinutes: 60,
        maxScore: 100,
        testSpec: {
          type: "node", entry: "index.js", command: "node index.js", timeoutSeconds: 5,
          positiveTests: [
            str(r["Input"]) || str(r["Expected Output"])
              ? makeTest(r["Input"], r["Expected Output"], r["Points"], r["Match Type"]) : null,
            str(r["Input_1"]) || str(r["Expected Output_1"])
              ? makeTest(r["Input_1"], r["Expected Output_1"], r["Points_1"], r["Match Type_1"]) : null,
            str(r["Input_2"]) || str(r["Expected Output_2"])
              ? makeTest(r["Input_2"], r["Expected Output_2"], r["Points_2"], r["Match Type_2"]) : null,
          ].filter(Boolean) as any[],
          negativeTests: [
            str(r["Input_3"]) ? { input: str(r["Input_3"]), expectedOutput: str(r["Expected Output_3"]), points: 0, matchType: "trimmed" } : null,
            str(r["Input_4"]) ? { input: str(r["Input_4"]), expectedOutput: str(r["Expected Output_4"]), points: 0, matchType: "trimmed" } : null,
          ].filter(Boolean) as any[],
        },
      })).filter(r => r.title && r.description && r.testSpec.positiveTests.length > 0);

      setBulkRows(parsed);
      setShowBulkModal(true);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  // Submit bulk challenges
  const handleBulkSubmit = async () => {
    if (!examId || bulkRows.length === 0) return;
    setBulkUploading(true);
    try {
      await axios.post(
        `${baseURL}/api/code-challenges/events/${examId}/codechallenges/bulk`,
        { challenges: bulkRows },
        { headers: { Authorization: `Bearer ${user?.token}` } }
      );
      setMessage({ type: "success", text: `${bulkRows.length} challenges uploaded successfully!` });
      setShowBulkModal(false);
      setBulkRows([]);
      await fetchChallenges();
    } catch (err: any) {
      const backendErr = err?.response?.data?.error || "Bulk upload failed";
      const friendly = backendErr.includes("coding round")
        ? "⚠️ This exam does not have a Coding round scheduled. Please edit the exam and add a Coding round before uploading challenges."
        : backendErr;
      setMessage({ type: "error", text: friendly });
      setShowBulkModal(false);
    } finally {
      setBulkUploading(false);
    }
  };

  // Get exam title by ID
  const getExamTitle = (examId: string) => {
    const exam = exams.find(e => e._id === examId);
    return exam?.title || "Unknown Exam";
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>Code Challenges</div>
          <div style={{ color: '#555', fontSize: '0.78rem', marginTop: 2 }}>
            {challenges.length} challenge{challenges.length !== 1 ? 's' : ''} added
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={downloadTemplate}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.45rem 1rem', background: 'transparent', border: '1px solid #333', borderRadius: 8, color: '#aaa', fontSize: '0.82rem', cursor: 'pointer' }}>
            ⬇ Template
          </button>
          {!readOnly && (
            <>
              <button disabled={!examId} onClick={() => bulkFileRef.current?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.45rem 1rem', background: 'transparent', border: '1px solid #17a2b8', borderRadius: 8, color: '#17a2b8', fontSize: '0.82rem', cursor: examId ? 'pointer' : 'not-allowed', opacity: examId ? 1 : 0.4 }}>
                ⬆ Bulk Upload
              </button>
              <button onClick={() => handleOpenModal()} disabled={!examId}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.45rem 1.1rem', background: '#ff6b35', border: 'none', borderRadius: 8, color: '#fff', fontSize: '0.82rem', fontWeight: 600, cursor: examId ? 'pointer' : 'not-allowed', opacity: examId ? 1 : 0.4 }}>
                + Add Challenge
              </button>
            </>
          )}
          <input ref={bulkFileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleBulkFile} />
        </div>
      </div>

      {readOnly && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid #ef444430', borderRadius: 8, padding: '0.65rem 1rem', marginBottom: '1rem', color: '#ef4444', fontSize: '0.82rem', fontWeight: 600 }}>
          🔒 Exam is in progress — editing is disabled.
        </div>
      )}

      {message && (
        <div style={{ background: message.type === 'error' ? 'rgba(220,53,69,0.1)' : 'rgba(40,167,69,0.1)', border: `1px solid ${message.type === 'error' ? '#dc354560' : '#28a74560'}`, borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', color: message.type === 'error' ? '#ff6b6b' : '#28a745', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>×</button>
        </div>
      )}

      {!defaultExamId && (
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ color: '#888', fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>SELECT EXAM</label>
          <select value={examId} onChange={e => { setExamId(e.target.value); setChallenges([]); }}
            style={{ width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 8, color: '#fff', padding: '0.6rem 1rem', fontSize: '0.9rem' }}>
            <option value="">— Select an exam —</option>
            {exams.map((exam: any) => <option key={exam._id} value={exam._id}>{exam.title}</option>)}
          </select>
        </div>
      )}

      {/* ── Challenges table ── */}
      {examId && (
        challenges.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed #222', borderRadius: 12, color: '#444' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>💻</div>
            <div style={{ color: '#666', fontSize: '0.95rem', marginBottom: 8 }}>No challenges yet</div>
            {!readOnly && <div style={{ color: '#444', fontSize: '0.8rem' }}>Click "+ Add Challenge" or use Bulk Upload to get started</div>}
          </div>
        ) : (
          <div style={{ border: '1px solid #1a1a1a', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 80px 80px 80px 120px', gap: 0, background: '#0a0a0a', padding: '0.6rem 1.25rem', borderBottom: '1px solid #1a1a1a' }}>
              {['Title', 'Description', 'Score', 'Time', 'Tests', ''].map((h, i) => (
                <div key={i} style={{ color: '#ff6b35', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: i >= 4 ? 'center' : 'left' }}>{h}</div>
              ))}
            </div>
            {challenges.map((challenge, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 80px 80px 80px 120px', gap: 0, padding: '0.9rem 1.25rem', borderBottom: idx < challenges.length - 1 ? '1px solid #111' : 'none', alignItems: 'center', background: idx % 2 === 0 ? 'transparent' : '#050505' }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.88rem' }}>{challenge.title}</div>
                  <div style={{ color: '#555', fontSize: '0.72rem', marginTop: 2 }}>/{challenge.slug}</div>
                </div>
                <div style={{ color: '#888', fontSize: '0.82rem', lineHeight: 1.4 }}>
                  {challenge.description?.length > 80 ? challenge.description.slice(0, 80) + '…' : challenge.description}
                </div>
                <div style={{ textAlign: 'center', color: '#28a745', fontWeight: 700, fontSize: '0.85rem' }}>{challenge.maxScore}</div>
                <div style={{ textAlign: 'center', color: '#17a2b8', fontSize: '0.82rem' }}>{Math.floor(challenge.timeLimitSeconds / 60)}m</div>
                <div style={{ textAlign: 'center', color: '#aaa', fontSize: '0.82rem' }}>
                  {(challenge.testSpec?.positiveTests?.length || 0) + (challenge.testSpec?.negativeTests?.length || 0)}
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                  {!readOnly && (
                    <>
                      <button onClick={() => handleOpenModal(challenge)}
                        style={{ padding: '4px 14px', background: 'transparent', border: '1px solid #ff6b35', borderRadius: 6, color: '#ff6b35', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                        Edit
                      </button>
                      <button onClick={() => { setChallengeToDelete(challenge._id!); setShowDeleteModal(true); }}
                        style={{ padding: '4px 14px', background: 'transparent', border: '1px solid #dc3545', borderRadius: 6, color: '#dc3545', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Create/Edit Challenge Modal */}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        fullscreen
        backdrop="static"
      >
        <Modal.Header
          closeButton
          style={{ background: "#0d0d0d", borderBottom: "1px solid #ff6b35", padding: "1.1rem 1.5rem" }}
        >
          <div>
            <Modal.Title style={{ color: "#ff6b35", fontWeight: 700, fontSize: "1.15rem", marginBottom: 2 }}>
              {editingChallenge ? "Edit Challenge" : "New Coding Challenge"}
            </Modal.Title>
            {examId && (
              <div style={{ color: "#888", fontSize: "0.78rem" }}>
                Exam: <span style={{ color: "#aaa" }}>{getExamTitle(examId)}</span>
              </div>
            )}
          </div>
        </Modal.Header>
        <Modal.Body
          style={{
            background: "#0d0d0d",
            color: "#fff",
            overflowY: "auto",
            padding: "2rem 3rem",
          }}
        >
          <Form>
            {/* Title */}
            <Form.Group className="mb-3">
              <Form.Label style={{ color: "#aaa", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Challenge Title *</Form.Label>
              <Form.Control
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Two Sum Problem"
                style={{ background: "#1a1a1a", color: "#fff", borderColor: "#2c2c2c", borderRadius: 8, padding: "0.65rem 1rem" }}
              />
            </Form.Group>

            {/* Description */}
            <Form.Group className="mb-4">
              <Form.Label style={{ color: "#aaa", fontSize: "0.8rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Problem Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the problem, input/output format, constraints and examples..."
                style={{ background: "#1a1a1a", color: "#fff", borderColor: "#2c2c2c", borderRadius: 8, padding: "0.65rem 1rem", resize: "vertical" }}
              />
            </Form.Group>

            {/* Positive Tests */}
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <div>
                  <span style={{ color: "#28a745", fontWeight: 700, fontSize: "0.9rem" }}>✅ Test Cases</span>
                  <span style={{ color: "#555", fontSize: "0.75rem", marginLeft: 8 }}>Must pass to earn points</span>
                </div>
                <button type="button" onClick={addPositive}
                  style={{ background: "rgba(40,167,69,0.15)", border: "1px solid rgba(40,167,69,0.4)", color: "#28a745", borderRadius: 6, padding: "4px 14px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                  + Add Test Case
                </button>
              </div>
              {positiveTests.map((t, i) => (
                <div key={i} style={{ background: "#111", border: "1px solid #222", borderRadius: 10, padding: "1rem", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <span style={{ color: "#ff6b35", fontWeight: 700, fontSize: "0.85rem" }}>Test #{i + 1}</span>
                    <button type="button" onClick={() => removePositive(i)}
                      style={{ background: "rgba(220,53,69,0.15)", border: "1px solid rgba(220,53,69,0.4)", color: "#dc3545", borderRadius: 6, padding: "3px 12px", fontSize: "0.75rem", cursor: "pointer" }}>
                      Remove
                    </button>
                  </div>
                  <Row className="g-2 mb-2">
                    <Col md={6}>
                      <Form.Label style={{ color: "#888", fontSize: "0.75rem", marginBottom: 4 }}>Input</Form.Label>
                      <Form.Control as="textarea" rows={2} value={t.input}
                        onChange={(e) => updatePositive(i, "input", e.target.value)}
                        placeholder="stdin input..."
                        style={{ background: "#1a1a1a", color: "#fff", borderColor: "#2c2c2c", fontSize: "0.85rem", fontFamily: "monospace" }} />
                    </Col>
                    <Col md={6}>
                      <Form.Label style={{ color: "#888", fontSize: "0.75rem", marginBottom: 4 }}>Expected Output</Form.Label>
                      <Form.Control as="textarea" rows={2} value={t.expectedOutput}
                        onChange={(e) => updatePositive(i, "expectedOutput", e.target.value)}
                        placeholder="expected stdout..."
                        style={{ background: "#1a1a1a", color: "#fff", borderColor: "#2c2c2c", fontSize: "0.85rem", fontFamily: "monospace" }} />
                    </Col>
                  </Row>
                  <Row className="g-2">
                    <Col md={4}>
                      <Form.Label style={{ color: "#888", fontSize: "0.75rem", marginBottom: 4 }}>Points</Form.Label>
                      <Form.Control type="number" value={t.points}
                        onChange={(e) => updatePositive(i, "points", Number(e.target.value))}
                        style={{ background: "#1a1a1a", color: "#fff", borderColor: "#2c2c2c", fontSize: "0.85rem" }} />
                    </Col>
                    <Col md={8}>
                      <Form.Label style={{ color: "#888", fontSize: "0.75rem", marginBottom: 4 }}>Match Type</Form.Label>
                      <Form.Select value={t.matchType}
                        onChange={(e) => updatePositive(i, "matchType", e.target.value as MatchType)}
                        style={{ background: "#1a1a1a", color: "#fff", borderColor: "#2c2c2c", fontSize: "0.85rem" }}>
                        <option value="trimmed">Trimmed (ignore leading/trailing spaces)</option>
                        <option value="exact">Exact match</option>
                        <option value="regex">Regex</option>
                      </Form.Select>
                    </Col>
                  </Row>
                </div>
              ))}
            </div>

            {/* Negative Tests */}
            <div style={{ marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                <div>
                  <span style={{ color: "#ffc107", fontWeight: 700, fontSize: "0.9rem" }}>⚠️ Edge Cases</span>
                  <span style={{ color: "#555", fontSize: "0.75rem", marginLeft: 8 }}>Invalid / boundary inputs (optional)</span>
                </div>
                <button type="button" onClick={addNegative}
                  style={{ background: "rgba(255,193,7,0.1)", border: "1px solid rgba(255,193,7,0.3)", color: "#ffc107", borderRadius: 6, padding: "4px 14px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>
                  + Add Edge Case
                </button>
              </div>
              {negativeTests.map((t, i) => (
                <div key={i} style={{ background: "#111", border: "1px solid #222", borderRadius: 10, padding: "1rem", marginBottom: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <span style={{ color: "#ffc107", fontWeight: 700, fontSize: "0.85rem" }}>Edge Case #{i + 1}</span>
                    <button type="button" onClick={() => removeNegative(i)}
                      style={{ background: "rgba(220,53,69,0.15)", border: "1px solid rgba(220,53,69,0.4)", color: "#dc3545", borderRadius: 6, padding: "3px 12px", fontSize: "0.75rem", cursor: "pointer" }}>
                      Remove
                    </button>
                  </div>
                  <Row className="g-2 mb-2">
                    <Col md={6}>
                      <Form.Label style={{ color: "#888", fontSize: "0.75rem", marginBottom: 4 }}>Input</Form.Label>
                      <Form.Control as="textarea" rows={2} value={t.input}
                        onChange={(e) => updateNegative(i, "input", e.target.value)}
                        placeholder="invalid/boundary input..."
                        style={{ background: "#1a1a1a", color: "#fff", borderColor: "#2c2c2c", fontSize: "0.85rem", fontFamily: "monospace" }} />
                    </Col>
                    <Col md={6}>
                      <Form.Label style={{ color: "#888", fontSize: "0.75rem", marginBottom: 4 }}>Expected Output</Form.Label>
                      <Form.Control as="textarea" rows={2} value={t.expectedOutput}
                        onChange={(e) => updateNegative(i, "expectedOutput", e.target.value)}
                        placeholder="expected response..."
                        style={{ background: "#1a1a1a", color: "#fff", borderColor: "#2c2c2c", fontSize: "0.85rem", fontFamily: "monospace" }} />
                    </Col>
                  </Row>
                </div>
              ))}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer style={{ background: "#0d0d0d", borderTop: "1px solid #222", padding: "1rem 1.5rem" }}>
          <Button variant="secondary" onClick={handleCloseModal}
            style={{ background: "#1e1e1e", border: "1px solid #333", color: "#aaa", padding: "0.5rem 1.4rem" }}>
            Cancel
          </Button>
          <Button onClick={handleSaveChallenge} disabled={loading}
            style={{ background: "#ff6b35", border: "none", padding: "0.5rem 1.8rem", fontWeight: 600 }}>
            {loading ? "Saving..." : editingChallenge ? "Update Challenge" : "Create Challenge"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton style={{ background: "#111", color: "#fff", borderBottom: "1px solid #333" }}>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: "#0a0a0a", color: "#fff" }}>
          Are you sure you want to delete this challenge? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer style={{ background: "#111", borderTop: "1px solid #333" }}>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} style={{ background: "#333", border: "none" }}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDeleteChallenge} style={{ background: "#dc3545", border: "none" }}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bulk Upload Preview Modal */}
      <Modal show={showBulkModal} onHide={() => { setShowBulkModal(false); setBulkRows([]); }} size="lg" centered>
        <Modal.Header closeButton style={{ background: '#0d0d0d', borderBottom: '1px solid #1a1a1a', padding: '1rem 1.5rem' }}>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.95rem' }}>Review Before Upload</div>
            <div style={{ color: '#555', fontSize: '0.75rem', marginTop: 2 }}>
              {bulkRows.length} challenge{bulkRows.length !== 1 ? 's' : ''} parsed from your file
            </div>
          </div>
        </Modal.Header>
        <Modal.Body style={{ background: '#0a0a0a', padding: '1.25rem', maxHeight: '55vh', overflowY: 'auto' }}>
          {bulkRows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666', fontSize: '0.85rem' }}>
              No valid rows found — ensure title, description and at least one test case are filled.
            </div>
          ) : (
            <div style={{ border: '1px solid #1a1a1a', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '32px 2fr 4fr 80px 80px', background: '#060606', padding: '0.5rem 1rem', borderBottom: '1px solid #1a1a1a' }}>
                {['#', 'Title', 'Description', 'Tests', 'Edges'].map((h, i) => (
                  <div key={i} style={{ color: '#ff6b35', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
                ))}
              </div>
              {bulkRows.map((r, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '32px 2fr 4fr 80px 80px', padding: '0.7rem 1rem', borderBottom: i < bulkRows.length - 1 ? '1px solid #111' : 'none', alignItems: 'center', background: i % 2 === 0 ? 'transparent' : '#050505' }}>
                  <div style={{ color: '#444', fontSize: '0.78rem' }}>{i + 1}</div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>{r.title}</div>
                  <div style={{ color: '#666', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</div>
                  <div style={{ color: '#28a745', fontWeight: 700, fontSize: '0.82rem' }}>{r.testSpec.positiveTests.length}</div>
                  <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.82rem' }}>{r.testSpec.negativeTests.length}</div>
                </div>
              ))}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ background: '#0d0d0d', borderTop: '1px solid #1a1a1a', padding: '0.85rem 1.25rem' }}>
          <button onClick={() => { setShowBulkModal(false); setBulkRows([]); }}
            style={{ padding: '0.45rem 1.2rem', background: 'transparent', border: '1px solid #333', borderRadius: 8, color: '#888', fontSize: '0.83rem', cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleBulkSubmit} disabled={bulkUploading || bulkRows.length === 0}
            style={{ padding: '0.45rem 1.4rem', background: '#ff6b35', border: 'none', borderRadius: 8, color: '#fff', fontSize: '0.83rem', fontWeight: 700, cursor: bulkRows.length > 0 && !bulkUploading ? 'pointer' : 'not-allowed', opacity: bulkRows.length > 0 && !bulkUploading ? 1 : 0.5, marginLeft: 8 }}>
            {bulkUploading ? 'Uploading…' : `Upload ${bulkRows.length} Challenge${bulkRows.length !== 1 ? 's' : ''}`}
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}