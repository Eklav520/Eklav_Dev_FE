import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";
import { useAuthContext } from "@/context/useAuthContext";
import AdminQuizUpload from "./QuizComponents/AdminQuizUpload";
import AdminCreateProblem from "./CodeChallenegeComponents/CreateCodeChallenge";
import InterviewQuestions from "./InterviewQuestions/InterviewQuestions";
import HRInterviewQuestions from "./HRRoundQuestions/HRInterviewQuestions";
import EnglishRoundConfig from "../../../eklavadmin/final-assessment/components/EnglishRoundComponents/EnglishRoundConfig";
import QuestionListModal from "./QuestionListModal";
import {
    FaSave,
    FaSpinner,
    FaCheckCircle,
    FaTimesCircle,
    FaClock,
    FaCalendarAlt,
    FaPercentage,
    FaList,
    FaCode,
    FaComments,
    FaUserTie,
    FaLanguage,
    FaPlus,
    FaTrash,
    FaEdit,
    FaEnvelope,
    FaInfoCircle,
    FaExclamationTriangle,
    FaUpload
} from "react-icons/fa";

type RoundType = "mcq" | "coding" | "tr" | "hr" | "english";

interface RoundConfig {
    roundType: RoundType;
    enabled: boolean;
    pickCount: number;
    timeSeconds: number;
    startDateTime: string;
    endDateTime: string;
    passPercentage: number;
}

interface Props {
    examId?: string;
    setExamId?: (id: string) => void;
    onSave?: (exam: any) => void;
}

const roundIcons = {
    mcq:     { icon: FaList,     label: "MCQ Quiz",        color: "#ff7a00", description: "Multiple choice questions" },
    coding:  { icon: FaCode,     label: "Code Challenge",  color: "#28a745", description: "Programming problems" },
    tr:      { icon: FaComments, label: "Technical Round", color: "#17a2b8", description: "Technical interview" },
    hr:      { icon: FaUserTie,  label: "HR Round",        color: "#fd7e14", description: "HR interview" },
    english: { icon: FaLanguage, label: "English Exam",    color: "#a855f7", description: "English communication assessment" },
};

export default function AssessmentConfig({ examId, setExamId, onSave }: Props) {
    const { user } = useAuthContext();

    const [rounds, setRounds] = useState<RoundConfig[]>([
        { roundType: "mcq",     enabled: false, pickCount: 10, timeSeconds: 600,  startDateTime: "", endDateTime: "", passPercentage: 40 },
        { roundType: "coding",  enabled: false, pickCount: 1,  timeSeconds: 1800, startDateTime: "", endDateTime: "", passPercentage: 40 },
        { roundType: "tr",      enabled: false, pickCount: 5,  timeSeconds: 600,  startDateTime: "", endDateTime: "", passPercentage: 40 },
        { roundType: "hr",      enabled: false, pickCount: 5,  timeSeconds: 600,  startDateTime: "", endDateTime: "", passPercentage: 40 },
        { roundType: "english", enabled: false, pickCount: 50, timeSeconds: 1800, startDateTime: "", endDateTime: "", passPercentage: 40 },
    ]);

    const [examList, setExamList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [branch, setBranch] = useState<string[]>([]);
    const [joiningYear, setJoiningYear] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [uploadRound, setUploadRound] = useState<RoundType | null>(null);
    const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
    const [viewRound, setViewRound] = useState<{ type: 'mcq'|'tr'|'hr'; label: string } | null>(null);
    const [savedRoundTypes, setSavedRoundTypes] = useState<Set<string>>(new Set());
    const [savingRound, setSavingRound] = useState<string | null>(null);

    const currentYear = new Date().getFullYear();
    const JOINING_YEARS = Array.from({ length: 8 }, (_, i) => String(currentYear - i));
    const BRANCHES = ['CSE', 'ECE', 'EEE', 'IT', 'Mechanical', 'Civil', 'Chemical', 'Aerospace', 'Biomedical'];

    // Notify modal state
    const [notifyExam, setNotifyExam]       = useState<any | null>(null)
    const [notifySubject, setNotifySubject] = useState('')
    const [notifyMsg, setNotifyMsg]         = useState('')
    const [notifySending, setNotifySending] = useState(false)
    const [notifyResult, setNotifyResult]   = useState<{ sent: number; failed: { email: string; error: string }[] } | null>(null)
    const [notifyError, setNotifyError]     = useState('')

    /* ================= FETCH EXAMS ================= */
    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/assessment/admin/exams`,
                    {
                        headers: { Authorization: `Bearer ${user?.token}` },
                    }
                );

                const data = await res.json();
                setExamList(data.exams || []);
            } catch (err) {
                console.error("Failed to fetch exams", err);
            }
        };

        fetchExams();
    }, []);

    /* ================= HANDLE EXAM SELECTION CHANGE ================= */
    const handleExamChange = (selectedExamId: string) => {
        setExamId?.(selectedExamId);

        // Clear fields when "Create New Exam" is selected
        if (!selectedExamId) {
            setTitle("");
            setDescription("");
            setBranch([]);
            setJoiningYear([]);
            setSavedRoundTypes(new Set());
            // Reset rounds to default state
            setRounds([
                { roundType: "mcq",     enabled: false, pickCount: 10, timeSeconds: 600,  startDateTime: "", endDateTime: "", passPercentage: 40 },
                { roundType: "coding",  enabled: false, pickCount: 1,  timeSeconds: 1800, startDateTime: "", endDateTime: "", passPercentage: 40 },
                { roundType: "tr",      enabled: false, pickCount: 5,  timeSeconds: 600,  startDateTime: "", endDateTime: "", passPercentage: 40 },
                { roundType: "hr",      enabled: false, pickCount: 5,  timeSeconds: 600,  startDateTime: "", endDateTime: "", passPercentage: 40 },
                { roundType: "english", enabled: false, pickCount: 50, timeSeconds: 1800, startDateTime: "", endDateTime: "", passPercentage: 40 },
            ]);
        }
    };

    /* ================= FETCH EXAM DETAILS WHEN EXAM IS SELECTED ================= */
    useEffect(() => {
        if (!examId) return;

        const fetchExamDetails = async () => {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/assessment/admin/exam/${examId}`,
                    {
                        headers: { Authorization: `Bearer ${user?.token}` },
                    }
                );

                const data = await res.json();
                const toLocal = (utc: string) => {
                    const d = new Date(utc);
                    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
                        .toISOString()
                        .slice(0, 16);
                };

                if (data.success) {
                    const exam = data.exam;
                    setTitle(exam.title);
                    setDescription(exam.description || "");
                    setBranch(Array.isArray(exam.branch) ? exam.branch : (exam.branch ? [exam.branch] : []));
                    setJoiningYear(Array.isArray(exam.joiningYear) ? exam.joiningYear : (exam.joiningYear ? [exam.joiningYear] : []));

                    const updatedRounds = rounds.map((defaultRound) => {
                        const existing = exam.rounds.find(
                            (r: any) => r.roundType === defaultRound.roundType
                        );

                        if (existing) {
                            return {
                                ...defaultRound,
                                enabled: true,
                                pickCount: existing.pickCount,
                                timeSeconds: existing.timeSeconds,
                                startDateTime: toLocal(existing.startDateTime),
                                endDateTime: toLocal(existing.endDateTime),
                                passPercentage: existing.passPercentage || 40,
                            };
                        }

                        return defaultRound;
                    });

                    setRounds(updatedRounds);
                    setSavedRoundTypes(new Set(exam.rounds.map((r: any) => r.roundType)));
                }
            } catch (err) {
                console.error("Failed to fetch exam details", err);
            }
        };

        fetchExamDetails();
    }, [examId]);

    const fetchQuestionCounts = async () => {
        if (!examId) return;
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/assessment/admin/exam/${examId}/question-counts`,
                { headers: { Authorization: `Bearer ${user?.token}` } }
            );
            const data = await res.json();
            if (data.success) setQuestionCounts(data.counts || {});
        } catch {}
    };

    useEffect(() => { fetchQuestionCounts(); }, [examId]);

    /* ================= TOGGLE ROUND ================= */
    const toggleRound = (index: number) => {
        const updated = rounds.map((r, i) => ({
            ...r,
            enabled: i === index ? !r.enabled : r.enabled,
        }));
        setRounds(updated);
    };

    /* ================= UPDATE ROUND FIELD ================= */
    const updateRound = (index: number, field: keyof RoundConfig, value: any) => {
        const updated = [...rounds];
        updated[index] = { ...updated[index], [field]: value };
        setRounds(updated);
    };

    const roundLabel: Record<string, string> = { mcq: 'MCQ Quiz', coding: 'Code Challenge', tr: 'Technical Round', hr: 'HR Round' }

    const openNotify = (exam: any) => {
        setNotifyExam(exam)
        setNotifySubject(`Upcoming Assessment: ${exam.title}`)

        const fmtDate = (dt: string) =>
            new Date(dt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

        const roundLines = (exam.rounds || [])
            .map((r: any) => `  • ${roundLabel[r.roundType] || r.roundType}: ${fmtDate(r.startDateTime)} → ${fmtDate(r.endDateTime)}`)
            .join('\n')

        const roundSection = roundLines
            ? `\nScheduled Rounds:\n${roundLines}\n`
            : ''

        setNotifyMsg(
            `Dear {name},\n\nThis is a reminder that the assessment "${exam.title}" has been scheduled for you.${roundSection}\nPlease log in to the Eklav portal and complete your assessment before the deadline.\n\nIf you have any questions, feel free to reach out to your placement team.\n\nBest regards,\nEklav Training & Placement Cell`
        )
        setNotifyResult(null)
        setNotifyError('')
    }

    const handleNotifySend = async () => {
        if (!notifySubject.trim() || !notifyMsg.trim()) {
            setNotifyError('Subject and message are required.')
            return
        }
        setNotifySending(true)
        setNotifyError('')
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/assessment/admin/exam/${notifyExam._id}/notify`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
                    body: JSON.stringify({ subject: notifySubject.trim(), message: notifyMsg.trim() }),
                }
            )
            const data = await res.json()
            if (data.success) {
                setNotifyResult({ sent: data.sent, failed: data.failed || [] })
            } else {
                setNotifyError(data.message || 'Failed to send.')
            }
        } catch {
            setNotifyError('Something went wrong. Please try again.')
        } finally {
            setNotifySending(false)
        }
    }

    const handleDeleteExam = async (id?: string) => {
        const deleteId = id || examId;
        if (!deleteId) return;

        const confirmDelete = window.confirm("Are you sure you want to delete this exam?");
        if (!confirmDelete) return;

        try {
            setLoading(true);
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/assessment/admin/exam/${deleteId}`,
                { method: "DELETE", headers: { Authorization: `Bearer ${user?.token}` } }
            );
            const data = await res.json();

            if (data.success) {
                setMessage({ type: "success", text: "Exam deleted successfully" });
                if (deleteId === examId) {
                    setExamId?.("");
                    setTitle("");
                    setDescription("");
                    setRounds([
                        { roundType: "mcq",     enabled: false, pickCount: 10, timeSeconds: 600,  startDateTime: "", endDateTime: "", passPercentage: 40 },
                        { roundType: "coding",  enabled: false, pickCount: 1,  timeSeconds: 1800, startDateTime: "", endDateTime: "", passPercentage: 40 },
                        { roundType: "tr",      enabled: false, pickCount: 5,  timeSeconds: 600,  startDateTime: "", endDateTime: "", passPercentage: 40 },
                        { roundType: "hr",      enabled: false, pickCount: 5,  timeSeconds: 600,  startDateTime: "", endDateTime: "", passPercentage: 40 },
                        { roundType: "english", enabled: false, pickCount: 50, timeSeconds: 1800, startDateTime: "", endDateTime: "", passPercentage: 40 },
                    ]);
                }
                // Refresh list
                const refreshRes = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/assessment/admin/exams`,
                    { headers: { Authorization: `Bearer ${user?.token}` } }
                );
                const refreshData = await refreshRes.json();
                setExamList(refreshData.exams || []);
            } else {
                setMessage({ type: "error", text: data.message || "Delete failed" });
            }
        } catch (err) {
            setMessage({ type: "error", text: "Something went wrong" });
        } finally {
            setLoading(false);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    /* ================= SUBMIT ================= */
    const handleSubmit = async () => {
        try {
            const enabledRounds = rounds.filter((r) => r.enabled);

            if (!enabledRounds.length) {
                setMessage({ type: 'error', text: 'Enable at least one round' });
                // Auto-scroll to top to show message
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            if (!title.trim()) {
                setMessage({ type: 'error', text: 'Please enter an exam title' });
                window.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }

            /* ================= FRONTEND OVERLAP CHECK ================= */
            for (let i = 0; i < enabledRounds.length; i++) {
                for (let j = i + 1; j < enabledRounds.length; j++) {
                    const r1 = enabledRounds[i];
                    const r2 = enabledRounds[j];

                    const r1Start = new Date(r1.startDateTime);
                    const r1End = new Date(r1.endDateTime);

                    const r2Start = new Date(r2.startDateTime);
                    const r2End = new Date(r2.endDateTime);

                    const overlap = r1Start < r2End && r1End > r2Start;

                    if (overlap) {
                        setMessage({
                            type: 'error',
                            text: `${roundIcons[r1.roundType].label} overlaps with ${roundIcons[r2.roundType].label}`
                        });
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        return;
                    }
                }
            }
            setSaving(true);
            setMessage(null);

            const url = examId
                ? `${import.meta.env.VITE_API_BASE_URL}/api/assessment/admin/exam/${examId}`
                : `${import.meta.env.VITE_API_BASE_URL}/api/assessment/admin/exam`;

            const method = examId ? "PUT" : "POST";

            const toISOString = (localDateTime: string) => {
                return new Date(localDateTime).toISOString();
            };

            const payloadRounds = enabledRounds.map((r) => ({
                roundType: r.roundType,
                enabled: r.enabled,
                pickCount: r.pickCount,
                timeSeconds: r.timeSeconds,
                startDateTime: toISOString(r.startDateTime),
                endDateTime: toISOString(r.endDateTime),
                passPercentage: r.passPercentage,
            }));

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user?.token}`,
                },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    rounds: payloadRounds,
                    branch,
                    joiningYear,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: '✅ Configuration saved successfully!' });
                window.scrollTo({ top: 0, behavior: 'smooth' });

                if (!examId && data.examId) {
                    setExamId?.(data.examId);
                }

                // Notify parent with the saved exam so it can refresh round tabs immediately
                if (data.exam) {
                    onSave?.(data.exam);
                    setSavedRoundTypes(new Set(data.exam.rounds.map((r: any) => r.roundType)));
                }

                const refreshRes = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/assessment/admin/exams`,
                    { headers: { Authorization: `Bearer ${user?.token}` } }
                );
                const refreshData = await refreshRes.json();
                setExamList(refreshData.exams || []);
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to save configuration' });
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    const handleSaveRound = async (roundType: string) => {
        const round = rounds.find(r => r.roundType === roundType);
        if (!round) return;
        if (!round.startDateTime || !round.endDateTime) {
            setMessage({ type: 'error', text: 'Please set Start & End dates for this round before saving.' });
            return;
        }
        if (!title.trim()) {
            setMessage({ type: 'error', text: 'Please enter an exam title first.' });
            return;
        }
        setSavingRound(roundType);
        try {
            const toISOString = (localDateTime: string) => new Date(localDateTime).toISOString();
            const enabledRounds = rounds.filter(r => r.enabled && r.startDateTime && r.endDateTime);
            const url = examId
                ? `${import.meta.env.VITE_API_BASE_URL}/api/assessment/admin/exam/${examId}`
                : `${import.meta.env.VITE_API_BASE_URL}/api/assessment/admin/exam`;
            const method = examId ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    rounds: enabledRounds.map(r => ({
                        roundType: r.roundType,
                        enabled: r.enabled,
                        pickCount: r.pickCount,
                        timeSeconds: r.timeSeconds,
                        startDateTime: toISOString(r.startDateTime),
                        endDateTime: toISOString(r.endDateTime),
                        passPercentage: r.passPercentage,
                    })),
                    branch,
                    joiningYear,
                }),
            });
            const data = await res.json();
            if (data.success) {
                if (!examId && data.examId) setExamId?.(data.examId);
                if (data.exam) {
                    setSavedRoundTypes(new Set(data.exam.rounds.map((r: any) => r.roundType)));
                    onSave?.(data.exam);
                }
                setMessage({ type: 'success', text: `✅ ${roundType.toUpperCase()} round saved! Upload is now enabled.` });
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to save round config.' });
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
        } finally {
            setSavingRound(null);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins} min${mins !== 1 ? 's' : ''} ${secs > 0 ? `${secs} sec` : ''}`;
    };

    return (
        <>
            {/* Fixed Position Toast Notification */}
            {message && (
                <div className={`toast-notification ${message.type}`}>
                    <div className="toast-content">
                        {message.type === 'success' ? (
                            <FaCheckCircle className="toast-icon success" />
                        ) : (
                            <FaTimesCircle className="toast-icon error" />
                        )}
                        <span className="toast-message">{message.text}</span>
                        <button
                            className="toast-close"
                            onClick={() => setMessage(null)}
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            <div className="assessment-config-container">
                <div className="config-card">
                    {/* Two Fields in One Row - Exam Selection & Title */}
                    <div className="form-row-group">
                        <div className="form-group-half">
                            <label className="form-label">
                                <FaInfoCircle className="label-icon" />
                                Exam Configuration
                            </label>
                            <select
                                value={examId || ""}
                                onChange={(e) => handleExamChange(e.target.value)}
                                className="form-select-custom"
                            >
                                <option value="">+ Create New Exam</option>
                                {examList.map((e) => (
                                    <option key={e._id} value={e._id}>
                                        {e.title}
                                    </option>
                                ))}
                            </select>
                            <small className="form-hint">Select an existing exam to edit, or create a new one</small>
                        </div>

                        <div className="form-group-half">
                            <label className="form-label">
                                <FaCheckCircle className="label-icon" />
                                Exam Title
                            </label>
                            <input
                                value={title}
                                disabled={!!examId}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={!examId ? "e.g., Full Stack Developer Assessment" : "Title is locked when editing existing exam"}
                                className={`form-input-custom ${!!examId ? 'disabled-input' : ''}`}
                            />
                            <small className="form-hint">
                                {examId
                                    ? 'Title is locked when editing existing exam'
                                    : 'Enter a descriptive title for your new exam'}
                            </small>
                        </div>
                    </div>

                    <div className="form-row-group">
                        <div className="form-group-full">
                            <label className="form-label">
                                <FaInfoCircle className="label-icon" />
                                Exam Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Enter a description or instructions students will see before starting the exam"
                                className="form-input-custom form-textarea-custom"
                                rows={4}
                            />
                            <small className="form-hint">
                                This description will display to students while they take the exam.
                            </small>
                        </div>
                    </div>

                    {/* Target Batch */}
                    <div className="form-row-group">
                        <div className="form-group-half">
                            <label className="form-label">
                                <FaList className="label-icon" />
                                Target Branch
                                {branch.length > 0 && <span style={{ marginLeft: 8, background: 'rgba(255,122,0,0.2)', color: '#ff7a00', borderRadius: 10, padding: '1px 7px', fontSize: '0.72rem', fontWeight: 700 }}>{branch.length} selected</span>}
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0.6rem 0' }}>
                                {BRANCHES.map(b => {
                                    const active = branch.includes(b);
                                    return (
                                        <button
                                            key={b}
                                            type="button"
                                            onClick={() => setBranch(active ? branch.filter(x => x !== b) : [...branch, b])}
                                            style={{
                                                background: active ? 'rgba(255,122,0,0.2)' : '#111',
                                                color: active ? '#ff7a00' : '#888',
                                                border: `1px solid ${active ? '#ff7a00' : '#2c2c2c'}`,
                                                borderRadius: 20,
                                                padding: '4px 14px',
                                                fontSize: '0.78rem',
                                                fontWeight: active ? 700 : 400,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s',
                                            }}
                                        >{b}</button>
                                    );
                                })}
                            </div>
                            <small className="form-hint">Select none to show to all branches</small>
                        </div>
                        <div className="form-group-half">
                            <label className="form-label">
                                <FaCalendarAlt className="label-icon" />
                                Target Joining Year
                                {joiningYear.length > 0 && <span style={{ marginLeft: 8, background: 'rgba(253,126,20,0.2)', color: '#fd7e14', borderRadius: 10, padding: '1px 7px', fontSize: '0.72rem', fontWeight: 700 }}>{joiningYear.length} selected</span>}
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '0.6rem 0' }}>
                                {JOINING_YEARS.map(y => {
                                    const active = joiningYear.includes(y);
                                    return (
                                        <button
                                            key={y}
                                            type="button"
                                            onClick={() => setJoiningYear(active ? joiningYear.filter(x => x !== y) : [...joiningYear, y])}
                                            style={{
                                                background: active ? 'rgba(253,126,20,0.2)' : '#111',
                                                color: active ? '#fd7e14' : '#888',
                                                border: `1px solid ${active ? '#fd7e14' : '#2c2c2c'}`,
                                                borderRadius: 20,
                                                padding: '4px 14px',
                                                fontSize: '0.78rem',
                                                fontWeight: active ? 700 : 400,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s',
                                            }}
                                        >{y}</button>
                                    );
                                })}
                            </div>
                            <small className="form-hint">Select none to show to all batches</small>
                        </div>
                    </div>

                    {/* Rounds Section */}
                    <div className="rounds-section">
                        <div className="section-header">
                            <h6 className="section-title">Assessment Rounds</h6>
                            <p className="section-subtitle">Enable and configure each round of the assessment</p>
                        </div>

                        <div className="rounds-grid">
                            {rounds.map((round, index) => {
                                const RoundIcon = roundIcons[round.roundType].icon;
                                const roundInfo = roundIcons[round.roundType];

                                return (
                                    <div key={round.roundType} className={`round-card ${round.enabled ? 'enabled' : ''}`}>
                                        <div className="round-header">
                                            <div className="round-header-left">
                                                <input
                                                    type="checkbox"
                                                    checked={round.enabled}
                                                    onChange={() => toggleRound(index)}
                                                    id={`round-${round.roundType}`}
                                                    className="round-checkbox"
                                                />
                                                <label htmlFor={`round-${round.roundType}`} className="round-checkbox-label">
                                                    <RoundIcon className="round-icon" style={{ color: roundInfo.color }} />
                                                    <div>
                                                        <span className="round-name">{roundInfo.label}</span>
                                                        <span className="round-description">{roundInfo.description}</span>
                                                    </div>
                                                </label>
                                            </div>
                                            <div className="round-status">
                                                {round.enabled ? (
                                                    <span className="status-badge enabled">Active</span>
                                                ) : (
                                                    <span className="status-badge disabled">Inactive</span>
                                                )}
                                            </div>
                                        </div>

                                        {round.enabled && (
                                            <div className="round-body">
                                                <div className="form-row">
                                                    <div className="form-group-small">
                                                        <label className="form-label-small">Questions</label>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={50}
                                                            value={round.pickCount}
                                                            onChange={(e) => updateRound(index, 'pickCount', Number(e.target.value))}
                                                            className="form-input-small"
                                                        />
                                                    </div>
                                                    <div className="form-group-small">
                                                        <label className="form-label-small">Time (seconds)</label>
                                                        <input
                                                            type="number"
                                                            min={60}
                                                            step={60}
                                                            value={round.timeSeconds}
                                                            onChange={(e) => updateRound(index, 'timeSeconds', Number(e.target.value))}
                                                            className="form-input-small"
                                                        />
                                                        <small className="time-hint">{formatTime(round.timeSeconds)}</small>
                                                    </div>
                                                    <div className="form-group-small">
                                                        <label className="form-label-small">Pass %</label>
                                                        <input
                                                            type="number"
                                                            min={0}
                                                            max={100}
                                                            value={round.passPercentage}
                                                            onChange={(e) => updateRound(index, 'passPercentage', Number(e.target.value))}
                                                            className="form-input-small"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="form-row">
                                                    <div className="form-group-full">
                                                        <label className="form-label-small">
                                                            <FaCalendarAlt className="me-1" /> Start Date & Time
                                                        </label>
                                                        <input
                                                            type="datetime-local"
                                                            value={round.startDateTime}
                                                            onChange={(e) => updateRound(index, 'startDateTime', e.target.value)}
                                                            className="form-input-custom"
                                                        />
                                                    </div>
                                                    <div className="form-group-full">
                                                        <label className="form-label-small">
                                                            <FaClock className="me-1" /> End Date & Time
                                                        </label>
                                                        <input
                                                            type="datetime-local"
                                                            value={round.endDateTime}
                                                            onChange={(e) => updateRound(index, 'endDateTime', e.target.value)}
                                                            className="form-input-custom"
                                                        />
                                                    </div>
                                                </div>
                                                {/* Per-round Save Config button */}
                                                <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveRound(round.roundType)}
                                                        disabled={savingRound === round.roundType}
                                                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.45rem 1.1rem', background: savingRound === round.roundType ? '#333' : roundInfo.color, border: 'none', borderRadius: 8, cursor: savingRound === round.roundType ? 'not-allowed' : 'pointer', color: '#fff', fontWeight: 600, fontSize: '0.82rem', opacity: savingRound === round.roundType ? 0.7 : 1 }}
                                                    >
                                                        <FaSave style={{ fontSize: '0.75rem' }} />
                                                        {savingRound === round.roundType ? 'Saving…' : 'Save Config'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Upload + View buttons — only after round is saved to server */}
                                        {round.enabled && (() => {
                                            const count = questionCounts[round.roundType] ?? 0;
                                            const isScheduled = !!(round.startDateTime && round.endDateTime);
                                            const isStarted = isScheduled && new Date(round.startDateTime) <= new Date();
                                            const isMCQTRHR = round.roundType === 'mcq' || round.roundType === 'tr' || round.roundType === 'hr';
                                            const isSaved = savedRoundTypes.has(round.roundType);
                                            return (
                                                <div style={{ padding: '0.85rem 1rem', borderTop: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                                    {!isSaved ? (
                                                        <small style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#666', fontSize: '0.78rem' }}>
                                                            <span style={{ color: '#f59e0b' }}>💾</span>
                                                            Set dates above and click <strong style={{ color: roundInfo.color }}>&nbsp;Save Config&nbsp;</strong> to enable upload
                                                        </small>
                                                    ) : !isScheduled ? (
                                                        <small style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#666', fontSize: '0.78rem' }}>
                                                            <span style={{ color: '#f59e0b' }}>📅</span>
                                                            Set Start &amp; End dates above, then save to enable upload
                                                        </small>
                                                    ) : isStarted ? (
                                                        <>
                                                            <span style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontSize: '0.78rem', padding: '4px 12px', borderRadius: 20, fontWeight: 600, border: '1px solid #ef444430' }}>
                                                                🔒 Exam in Progress — Editing Locked
                                                            </span>
                                                            {count > 0 && (
                                                                <button type="button"
                                                                    onClick={() => isMCQTRHR
                                                                        ? setViewRound({ type: round.roundType as 'mcq'|'tr'|'hr', label: roundInfo.label })
                                                                        : setUploadRound(round.roundType)}
                                                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.45rem 1rem', background: 'transparent', border: `1px solid ${roundInfo.color}55`, borderRadius: 8, cursor: 'pointer', color: roundInfo.color, fontWeight: 600, fontSize: '0.82rem' }}>
                                                                    👁 View Questions ({count})
                                                                </button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button type="button" onClick={() => setUploadRound(round.roundType)}
                                                                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.5rem 1.1rem', background: roundInfo.color, border: 'none', borderRadius: 8, cursor: 'pointer', color: '#fff', fontWeight: 600, fontSize: '0.83rem' }}>
                                                                <FaUpload style={{ fontSize: '0.75rem' }} />
                                                                {round.roundType === 'english' ? 'Manage Sections' : 'Upload Questions'}
                                                            </button>
                                                            {count > 0 && isMCQTRHR && (
                                                                <button type="button"
                                                                    onClick={() => setViewRound({ type: round.roundType as 'mcq'|'tr'|'hr', label: roundInfo.label })}
                                                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1.1rem', background: 'transparent', border: `1px solid ${roundInfo.color}`, borderRadius: 8, cursor: 'pointer', color: roundInfo.color, fontWeight: 600, fontSize: '0.83rem' }}>
                                                                    📋 View / Edit ({count})
                                                                </button>
                                                            )}
                                                            {count > 0 && !isMCQTRHR && (
                                                                <button type="button" onClick={() => setUploadRound(round.roundType)}
                                                                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0.5rem 1.1rem', background: 'transparent', border: `1px solid ${roundInfo.color}`, borderRadius: 8, cursor: 'pointer', color: roundInfo.color, fontWeight: 600, fontSize: '0.83rem' }}>
                                                                    📋 View / Edit ({count})
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                /* Fixed Toast Notification */
                .toast-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    animation: slideInRight 0.3s ease-out;
                    max-width: 400px;
                    min-width: 300px;
                }

                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }

                .toast-notification.hiding {
                    animation: slideOutRight 0.3s ease-out forwards;
                }

                .toast-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 18px;
                    border-radius: 12px;
                    background: #1a1a1a;
                    border: 1px solid;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
                    backdrop-filter: blur(10px);
                }

                .toast-notification.success .toast-content {
                    border-color: #28a745;
                    background: linear-gradient(135deg, #0a1a0a 0%, #0a0a0a 100%);
                }

                .toast-notification.error .toast-content {
                    border-color: #dc3545;
                    background: linear-gradient(135deg, #1a0a0a 0%, #0a0a0a 100%);
                }

                .toast-icon {
                    font-size: 1.5rem;
                    flex-shrink: 0;
                }

                .toast-icon.success {
                    color: #28a745;
                }

                .toast-icon.error {
                    color: #dc3545;
                }

                .toast-message {
                    flex: 1;
                    color: #ffffff;
                    font-size: 0.9rem;
                    font-weight: 500;
                    line-height: 1.4;
                }

                .toast-close {
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    color: #ffffff;
                    font-size: 1.25rem;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .toast-close:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: scale(1.05);
                }

                /* Scroll to top button hint */
                .scroll-hint {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: rgba(255, 107, 53, 0.9);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-size: 12px;
                    cursor: pointer;
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.2s ease;
                }

                .scroll-hint:hover {
                    background: #ff6b35;
                    transform: translateY(-2px);
                }

                .assessment-config-container {
                    background: #000000;
                    min-height: 100vh;
                    padding: 0;
                }

                .config-card {
                    max-width: 1200px;
                    margin: 0 auto;
                    background: #0a0a0a;
                    border: 1px solid #1f1f1f;
                    border-radius: 16px;
                    overflow: hidden;
                }

                .config-header {
                    background: linear-gradient(135deg, #0a0a0a 0%, #000000 100%);
                    border-bottom: 1px solid #ff6b35;
                    padding: 1.5rem;
                }

                .config-title {
                    color: #ffffff;
                    font-size: 1.5rem;
                    font-weight: 700;
                    margin: 0;
                }

                .config-subtitle {
                    color: #8a8a8a;
                    font-size: 0.85rem;
                    margin: 0.25rem 0 0 0;
                }

                /* Two Fields in One Row */
                .form-row-group {
                    display: flex;
                    gap: 1.5rem;
                    padding: 1.5rem;
                    border-bottom: 1px solid #1f1f1f;
                }

                .form-group-half {
                    flex: 1;
                }

                .form-label {
                    color: #ff6b35;
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .label-icon {
                    font-size: 0.85rem;
                }

                .form-select-custom, .form-input-custom {
                    width: 100%;
                    background: #000000;
                    border: 1px solid #2c2c2c;
                    color: #ffffff;
                    padding: 0.75rem;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }

                .form-select-custom:focus, .form-input-custom:focus {
                    background: #141414;
                    border-color: #ff6b35;
                    box-shadow: 0 0 0 0.2rem rgba(255, 107, 53, 0.25);
                    outline: none;
                }

                .disabled-input {
                    background: #0a0a0a;
                    cursor: not-allowed;
                    opacity: 0.7;
                }

                .form-hint {
                    color: #6c757d;
                    font-size: 0.7rem;
                    margin-top: 0.5rem;
                    display: block;
                }

                /* Rounds Section */
                .rounds-section {
                    padding: 1.5rem;
                }

                .section-header {
                    margin-bottom: 1.5rem;
                }

                .section-title {
                    color: #ff6b35;
                    font-size: 1rem;
                    font-weight: 600;
                    margin-bottom: 0.25rem;
                }

                .section-subtitle {
                    color: #8a8a8a;
                    font-size: 0.8rem;
                    margin: 0;
                }

                .rounds-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
                    gap: 1.5rem;
                }

                .round-card {
                    background: #000000;
                    border: 1px solid #2c2c2c;
                    border-radius: 12px;
                    transition: all 0.2s ease;
                }

                .round-card.enabled {
                    border-color: #ff6b35;
                    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.1);
                }

                .round-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    border-bottom: 1px solid #2c2c2c;
                }

                .round-header-left {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    flex: 1;
                }

                .round-checkbox {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                    accent-color: #ff6b35;
                }

                .round-checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    margin: 0;
                    flex: 1;
                }

                .round-icon {
                    font-size: 1.25rem;
                }

                .round-name {
                    color: #ffffff;
                    font-weight: 600;
                    display: block;
                    font-size: 0.9rem;
                }

                .round-description {
                    color: #6c757d;
                    font-size: 0.7rem;
                    display: block;
                }

                .status-badge {
                    padding: 0.25rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                }

                .status-badge.enabled {
                    background: rgba(40, 167, 69, 0.2);
                    color: #28a745;
                    border: 1px solid rgba(40, 167, 69, 0.3);
                }

                .status-badge.disabled {
                    background: rgba(108, 117, 125, 0.2);
                    color: #8a8a8a;
                    border: 1px solid rgba(108, 117, 125, 0.3);
                }

                .round-body {
                    padding: 1rem;
                }

                .form-row {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 1rem;
                    flex-wrap: wrap;
                }

                .form-group-small {
                    flex: 1;
                    min-width: 100px;
                }

                .form-group-full {
                    flex: 1;
                }

                .form-label-small {
                    color: #ff6b35;
                    font-size: 0.75rem;
                    font-weight: 500;
                    margin-bottom: 0.25rem;
                    display: block;
                }

                .form-input-small {
                    width: 100%;
                    background: #0a0a0a;
                    border: 1px solid #2c2c2c;
                    color: #ffffff;
                    padding: 0.5rem;
                    border-radius: 6px;
                }

                .time-hint {
                    color: #6c757d;
                    font-size: 0.65rem;
                    display: block;
                    margin-top: 0.25rem;
                }

                /* Form Actions */
                .form-actions {
                    padding: 1.5rem;
                    border-top: 1px solid #1f1f1f;
                    display: flex;
                    justify-content: flex-end;
                }

                .submit-btn {
                    background: linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%);
                    border: none;
                    padding: 0.75rem 2rem;
                    border-radius: 8px;
                    color: #000000;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .submit-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
                }

                .submit-btn:disabled {
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

                /* Responsive */
                @media (max-width: 768px) {
                    .toast-notification {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                        max-width: none;
                    }

                    .form-row-group {
                        flex-direction: column;
                        gap: 1rem;
                    }

                    .rounds-grid {
                        grid-template-columns: 1fr;
                    }

                    .form-row {
                        flex-direction: column;
                    }

                    .form-group-small, .form-group-full {
                        width: 100%;
                    }

                    .config-header {
                        padding: 1rem;
                    }

                    .config-title {
                        font-size: 1.25rem;
                    }

                    .form-actions {
                        justify-content: stretch;
                    }

                    .submit-btn {
                        width: 100%;
                        justify-content: center;
                    }

                    .round-header-left {
                        flex-wrap: wrap;
                    }
                }
            /* ── Exam List ── */
            .exam-list-container {
                border-top: 1px solid #1f1f1f;
                margin-top: 0;
            }

            .exam-list-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1.1rem 1.5rem 0.9rem;
                border-bottom: 1px solid #1f1f1f;
            }

            .exam-list-title {
                color: #ff6b35;
                font-size: 0.95rem;
                font-weight: 700;
                margin: 0;
            }

            .exam-list-subtitle {
                color: #666;
                font-size: 0.75rem;
                margin: 0.15rem 0 0 0;
            }

            .exam-count-badge {
                background: rgba(255,107,53,0.12);
                color: #ff6b35;
                border: 1px solid rgba(255,107,53,0.3);
                font-size: 0.7rem;
                font-weight: 700;
                padding: 3px 10px;
                border-radius: 20px;
                white-space: nowrap;
            }

            .no-exams {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 2rem 1.5rem;
                color: #555;
                font-size: 0.85rem;
            }

            .no-exams-icon { font-size: 1.1rem; color: #333; }

            .table-wrapper { overflow-x: auto; }

            .exam-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.83rem;
            }

            .exam-table thead tr {
                background: #0d0d0d;
                border-bottom: 1px solid #222;
            }

            .exam-table th {
                padding: 10px 14px;
                color: #ff6b35;
                font-weight: 700;
                text-align: left;
                white-space: nowrap;
                font-size: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 0.4px;
            }

            .exam-table tbody tr {
                border-bottom: 1px solid #181818;
                transition: background 0.15s ease;
            }

            .exam-table tbody tr:last-child { border-bottom: none; }

            .exam-table tbody tr:hover { background: #111; }

            .exam-table tbody tr.active-row {
                background: rgba(255,107,53,0.04);
                border-left: 3px solid #ff6b35;
            }

            .exam-table td {
                padding: 12px 14px;
                color: #ccc;
                vertical-align: middle;
            }

            .row-num {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                border-radius: 6px;
                background: #1a1a1a;
                border: 1px solid #2a2a2a;
                color: #666;
                font-size: 0.72rem;
                font-weight: 600;
            }

            .exam-info-cell { display: flex; flex-direction: column; gap: 3px; }

            .exam-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

            .exam-title-cell {
                color: #fff;
                font-weight: 600;
                font-size: 0.88rem;
            }

            .editing-badge {
                background: rgba(255,107,53,0.18);
                color: #ff6b35;
                border: 1px solid rgba(255,107,53,0.35);
                font-size: 0.6rem;
                padding: 1px 7px;
                border-radius: 20px;
                font-weight: 700;
                letter-spacing: 0.3px;
            }

            .desc-cell {
                color: #666;
                font-size: 0.75rem;
                line-height: 1.4;
            }

            /* Round schedule rows */
            .rounds-schedule { display: flex; flex-direction: column; gap: 6px; }

            .round-schedule-row {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
            }

            .round-badge {
                font-size: 0.64rem;
                padding: 2px 9px;
                border-radius: 20px;
                font-weight: 700;
                white-space: nowrap;
                flex-shrink: 0;
            }

            .round-badge.mcq    { background: rgba(255,122,0,0.13);  color: #ff7a00; border: 1px solid rgba(255,122,0,0.28); }
            .round-badge.coding { background: rgba(40,167,69,0.13);  color: #28a745; border: 1px solid rgba(40,167,69,0.28); }
            .round-badge.tr     { background: rgba(23,162,184,0.13); color: #17a2b8; border: 1px solid rgba(23,162,184,0.28); }
            .round-badge.hr     { background: rgba(253,126,20,0.13); color: #fd7e14; border: 1px solid rgba(253,126,20,0.28); }

            .round-dates {
                color: #777;
                font-size: 0.72rem;
                display: flex;
                align-items: center;
                gap: 6px;
                flex-wrap: wrap;
            }

            .date-sep { color: #444; font-size: 0.65rem; }

            /* Action icon buttons */
            .action-btns {
                display: flex;
                gap: 6px;
                align-items: center;
                justify-content: flex-end;
            }

            .action-icon-btn {
                width: 32px;
                height: 32px;
                border-radius: 8px;
                border: 1px solid;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 0.8rem;
                transition: all 0.15s ease;
                flex-shrink: 0;
            }

            .results-icon-btn {
                background: rgba(23,162,184,0.12);
                border-color: rgba(23,162,184,0.35);
                color: #17a2b8;
            }
            .results-icon-btn:hover { background: rgba(23,162,184,0.24); }

            .edit-icon-btn {
                background: rgba(255,107,53,0.12);
                border-color: rgba(255,107,53,0.35);
                color: #ff6b35;
            }
            .edit-icon-btn:hover { background: rgba(255,107,53,0.24); }

            .notify-icon-btn {
                background: rgba(99,102,241,0.12);
                border-color: rgba(99,102,241,0.35);
                color: #818cf8;
            }
            .notify-icon-btn:hover { background: rgba(99,102,241,0.24); }

            .delete-icon-btn {
                background: rgba(220,53,69,0.12);
                border-color: rgba(220,53,69,0.35);
                color: #dc3545;
            }
            .delete-icon-btn:hover:not(:disabled) { background: rgba(220,53,69,0.24); }
            .delete-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }

            @media (max-width: 768px) {
                .round-schedule-row { flex-direction: column; align-items: flex-start; gap: 4px; }
                .action-btns { justify-content: flex-start; }
            }
            `}</style>

            {/* ── Notify Students Modal ── */}
            <Modal
                show={!!notifyExam}
                onHide={() => setNotifyExam(null)}
                size="lg"
                contentClassName="bg-dark text-white"
                centered
            >
                <Modal.Header closeButton closeVariant="white" style={{ borderColor: '#2a2a2a' }}>
                    <Modal.Title style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FaEnvelope style={{ color: '#818cf8' }} />
                        Notify All Students
                        {notifyExam && <span style={{ color: '#818cf8', fontWeight: 700, marginLeft: 4 }}>— {notifyExam.title}</span>}
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body style={{ padding: '20px 24px' }}>
                    {notifyResult ? (
                        <div className="text-center py-4">
                            {notifyResult.sent === 0 ? (
                                <>
                                    <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444' }}>Failed to Send</div>
                                    <div className="text-muted mt-1" style={{ fontSize: '0.85rem' }}>No emails were delivered.</div>
                                </>
                            ) : notifyResult.failed.length > 0 ? (
                                <>
                                    <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f59e0b' }}>Partially Sent</div>
                                    <div className="text-muted mt-1" style={{ fontSize: '0.85rem' }}>
                                        Delivered to <strong style={{ color: '#fff' }}>{notifyResult.sent}</strong> student{notifyResult.sent !== 1 ? 's' : ''},{' '}
                                        <strong style={{ color: '#ef4444' }}>{notifyResult.failed.length}</strong> failed.
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#22c55e' }}>Emails Sent!</div>
                                    <div className="text-muted mt-1" style={{ fontSize: '0.85rem' }}>
                                        Successfully delivered to <strong style={{ color: '#fff' }}>{notifyResult.sent}</strong> student{notifyResult.sent !== 1 ? 's' : ''}.
                                    </div>
                                </>
                            )}
                            {notifyResult.failed.length > 0 && (
                                <div className="mt-3 text-start" style={{ maxHeight: 120, overflowY: 'auto' }}>
                                    {notifyResult.failed.map((f, i) => (
                                        <div key={i} className="px-3 py-1 rounded mb-1"
                                            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.76rem' }}>
                                            <span style={{ color: '#ef4444', fontWeight: 600 }}>{f.email}</span>
                                            <span className="text-muted ms-2">{f.error}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {notifyError && (
                                <Alert variant="danger" className="py-2 mb-3" style={{ fontSize: '0.85rem' }}>
                                    <FaTimesCircle className="me-2" />{notifyError}
                                </Alert>
                            )}
                            <div className="mb-2 px-3 py-2 rounded" style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '0.78rem', color: '#ccc' }}>
                                <strong style={{ color: '#818cf8' }}>Bulk send:</strong> Email goes to all students in your institute.
                                Use <code style={{ color: '#818cf8' }}>{'{name}'}</code> to personalise with each student's name.
                            </div>
                            <Form.Group className="mb-3 mt-3">
                                <Form.Label style={{ fontSize: '0.8rem', color: '#aaa' }}>Subject</Form.Label>
                                <Form.Control
                                    className="bg-black text-white border-secondary"
                                    value={notifySubject}
                                    onChange={(e) => setNotifySubject(e.target.value)}
                                />
                            </Form.Group>
                            <Form.Group>
                                <Form.Label style={{ fontSize: '0.8rem', color: '#aaa' }}>Message</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    rows={10}
                                    className="bg-black text-white border-secondary"
                                    style={{ fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical' }}
                                    value={notifyMsg}
                                    onChange={(e) => setNotifyMsg(e.target.value)}
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>

                <Modal.Footer style={{ borderColor: '#2a2a2a' }}>
                    <Button variant="secondary" onClick={() => setNotifyExam(null)}>
                        {notifyResult ? 'Close' : 'Cancel'}
                    </Button>
                    {!notifyResult && (
                        <Button
                            disabled={notifySending}
                            onClick={handleNotifySend}
                            style={{ backgroundColor: '#6366f1', borderColor: '#6366f1', color: '#fff', fontWeight: 600 }}
                        >
                            <FaEnvelope className="me-2" />
                            {notifySending ? 'Sending...' : 'Send to All Students'}
                        </Button>
                    )}
                </Modal.Footer>
            </Modal>

            {/* Upload / Manage Questions Modal */}
            <Modal
                show={!!uploadRound}
                onHide={() => { setUploadRound(null); fetchQuestionCounts(); }}
                fullscreen
                backdrop="static"
            >
                <Modal.Header
                    closeButton
                    style={{ background: '#0a0a0a', borderBottom: '1px solid #1f1f1f' }}
                >
                    <Modal.Title style={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}>
                        {uploadRound === 'mcq'     && '📋 MCQ Questions'}
                        {uploadRound === 'coding'  && '💻 Code Challenges'}
                        {uploadRound === 'tr'      && '🎤 Technical Interview Questions'}
                        {uploadRound === 'hr'      && '👥 HR Interview Questions'}
                        {uploadRound === 'english' && '🇬🇧 English Assessment'}
                        {uploadRound && (() => {
                            const activeRound = rounds.find(r => r.roundType === uploadRound);
                            const isStarted = activeRound?.startDateTime ? new Date(activeRound.startDateTime) <= new Date() : false;
                            return isStarted ? <span style={{ marginLeft: 12, fontSize: '0.75rem', color: '#ef4444', background: 'rgba(239,68,68,0.12)', padding: '2px 10px', borderRadius: 20, border: '1px solid #ef444430' }}>🔒 View Only — Exam in Progress</span> : null;
                        })()}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ background: '#000', padding: '1.5rem', overflowY: 'auto' }}>
                    {uploadRound && examId && (() => {
                        const activeRound = rounds.find(r => r.roundType === uploadRound);
                        const isStarted = activeRound?.startDateTime ? new Date(activeRound.startDateTime) <= new Date() : false;
                        return (
                            <>
                                {uploadRound === 'mcq'     && <AdminQuizUpload defaultExamId={examId} readOnly={isStarted} />}
                                {uploadRound === 'coding'  && <AdminCreateProblem defaultExamId={examId} readOnly={isStarted} />}
                                {uploadRound === 'tr'      && <InterviewQuestions defaultExamId={examId} readOnly={isStarted} />}
                                {uploadRound === 'hr'      && <HRInterviewQuestions defaultExamId={examId} readOnly={isStarted} />}
                                {uploadRound === 'english' && <EnglishRoundConfig defaultExamId={examId} readOnly={isStarted} />}
                            </>
                        );
                    })()}
                </Modal.Body>
            </Modal>

            {viewRound && (
                <QuestionListModal
                    show={!!viewRound}
                    onHide={() => { setViewRound(null); fetchQuestionCounts(); }}
                    examId={examId}
                    roundType={viewRound.type}
                    roundLabel={viewRound.label}
                    readOnly={(() => {
                        const r = rounds.find(x => x.roundType === viewRound.type);
                        return r?.startDateTime ? new Date(r.startDateTime) <= new Date() : false;
                    })()}
                />
            )}
        </>
    );
}