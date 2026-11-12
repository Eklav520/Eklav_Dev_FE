import React, { useState, useEffect, useRef } from "react";
import { Modal } from "react-bootstrap";
import { useAuthContext } from "@/context/useAuthContext";
import AdminQuizUpload from "./QuizComponents/AdminQuizUpload";
import AdminCreateProblem from "./CodeChallenegeComponents/CreateCodeChallenge";
import InterviewQuestions from "./InterviewQuestions/InterviewQuestions";
import HRInterviewQuestions from "./HRRoundQuestions/HRInterviewQuestions";
import EnglishRoundConfig from "./EnglishRoundComponents/EnglishRoundConfig";
import QuestionListModal from "./QuestionListModal";
import {
    FaSave,
    FaSpinner,
    FaCheckCircle,
    FaTimesCircle,
    FaClock,
    FaCalendarAlt,
    FaList,
    FaCode,
    FaComments,
    FaUserTie,
    FaLanguage,
    FaTrash,
    FaInfoCircle,
    FaExclamationTriangle,
    FaUpload,
    FaTimes,
    FaCheck,
    FaLock,
    FaEye,
    FaListUl,
    FaClipboardList,
    FaChevronDown,
    FaSearch,
    FaPlus,
    FaUsers,
} from "react-icons/fa";
/* Exam switcher: lists existing exams with a short summary, "Create new exam" sits apart at the bottom */
const ExamPicker = ({ exams, value, onChange }: { exams: any[]; value: string; onChange: (id: string) => void }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const ref = useRef<HTMLDivElement>(null);
    const current = exams.find((e) => e._id === value);

    useEffect(() => {
        if (!open) return;
        const onPointer = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("mousedown", onPointer);
        document.addEventListener("keydown", onKey);
        return () => { document.removeEventListener("mousedown", onPointer); document.removeEventListener("keydown", onKey); };
    }, [open]);

    const pick = (id: string) => { onChange(id); setOpen(false); setQuery(""); };
    const q = query.trim().toLowerCase();
    const visible = exams.filter((e) => !q || (e.title || "").toLowerCase().includes(q));
    const meta = (e: any) => {
        const n = (e.rounds || []).length;
        const who = Array.isArray(e.branch) && e.branch.length ? e.branch.join(", ") : "All branches";
        return `${n} round${n === 1 ? "" : "s"} · ${who}`;
    };

    return (
        <div className="afc-picker" ref={ref}>
            <button type="button" className={`afc-picker-trigger${open ? " is-open" : ""}`} onClick={() => setOpen((v) => !v)} aria-haspopup="listbox" aria-expanded={open}>
                <span className={`afc-picker-icon${current ? "" : " is-new"}`}>{current ? <FaClipboardList /> : <FaPlus />}</span>
                <span className="afc-picker-text">
                    <small>{current ? "Editing exam" : "New exam · unsaved"}</small>
                    <strong>{current ? current.title : "Untitled exam"}</strong>
                </span>
                <FaChevronDown className="afc-picker-caret" />
            </button>
            {open && (
                <div className="afc-picker-menu">
                    <div className="afc-picker-head">
                        <span>Your exams</span>
                        <span className="aui-badge aui-badge-muted">{exams.length}</span>
                    </div>
                    {exams.length > 5 && (
                        <div className="afc-picker-search">
                            <FaSearch />
                            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search exams…" />
                        </div>
                    )}
                    <ul role="listbox" aria-label="Exams">
                        {visible.length === 0 ? (
                            <li className="afc-picker-empty">{exams.length ? "No exams match" : "No exams yet — create your first one below"}</li>
                        ) : visible.map((e) => (
                            <li key={e._id} role="option" aria-selected={e._id === value}>
                                <button type="button" className={e._id === value ? "is-active" : ""} onClick={() => pick(e._id)}>
                                    <span className="aui-stack">
                                        <strong>{e.title}</strong>
                                        <small>{meta(e)}</small>
                                    </span>
                                    {e._id === value && <FaCheckCircle />}
                                </button>
                            </li>
                        ))}
                    </ul>
                    <button type="button" className="afc-picker-new" onClick={() => pick("")}>
                        <FaPlus size={10} /> Create new exam
                    </button>
                </div>
            )}
        </div>
    );
};

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
    // Rounds a student has actually started/completed — used instead of the
    // scheduled start time to decide whether editing should be locked, so a
    // round doesn't lock the instant its start time passes with nobody
    // having attempted it yet.
    const [startedRoundTypes, setStartedRoundTypes] = useState<Set<string>>(new Set());
    const [viewRound, setViewRound] = useState<{ type: 'mcq'|'tr'|'hr'; label: string } | null>(null);
    const [savedRoundTypes, setSavedRoundTypes] = useState<Set<string>>(new Set());
    const [savingRound, setSavingRound] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const currentYear = new Date().getFullYear();
    const JOINING_YEARS = Array.from({ length: 8 }, (_, i) => String(currentYear - i));
    const BRANCHES = ['CSE', 'ECE', 'EEE', 'IT', 'Mechanical', 'Civil', 'Chemical', 'Aerospace', 'Biomedical'];

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
                    onSave?.(exam); // lets the page header show the selected exam's name
                    setDescription(exam.description || "");
                    setBranch(Array.isArray(exam.branch) ? exam.branch : (exam.branch ? [exam.branch] : []));
                    setJoiningYear(Array.isArray(exam.joiningYear) ? exam.joiningYear : (exam.joiningYear ? [exam.joiningYear] : []));

                    // Always start from clean defaults — never carry over previous exam's state
                    const freshDefaults: RoundConfig[] = [
                        { roundType: "mcq",     enabled: false, pickCount: 10, timeSeconds: 600,  startDateTime: "", endDateTime: "", passPercentage: 40 },
                        { roundType: "coding",  enabled: false, pickCount: 1,  timeSeconds: 1800, startDateTime: "", endDateTime: "", passPercentage: 40 },
                        { roundType: "tr",      enabled: false, pickCount: 5,  timeSeconds: 600,  startDateTime: "", endDateTime: "", passPercentage: 40 },
                        { roundType: "hr",      enabled: false, pickCount: 5,  timeSeconds: 600,  startDateTime: "", endDateTime: "", passPercentage: 40 },
                        { roundType: "english", enabled: false, pickCount: 50, timeSeconds: 1800, startDateTime: "", endDateTime: "", passPercentage: 40 },
                    ];

                    const updatedRounds = freshDefaults.map((defaultRound) => {
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

    const fetchRoundActivity = async () => {
        if (!examId) return;
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/api/assessment/admin/exam/${examId}/round-activity`,
                { headers: { Authorization: `Bearer ${user?.token}` } }
            );
            const data = await res.json();
            if (data.success) setStartedRoundTypes(new Set(data.startedRoundTypes || []));
        } catch {}
    };

    useEffect(() => { fetchQuestionCounts(); fetchRoundActivity(); }, [examId]);

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

    const handleDeleteExam = async (id?: string) => {
        const deleteId = id || examId;
        if (!deleteId) return;

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

            /* ── Within-exam overlap check ── */
            for (let i = 0; i < enabledRounds.length; i++) {
                for (let j = i + 1; j < enabledRounds.length; j++) {
                    const r1 = enabledRounds[i], r2 = enabledRounds[j];
                    const overlap = new Date(r1.startDateTime) < new Date(r2.endDateTime) &&
                                    new Date(r1.endDateTime)   > new Date(r2.startDateTime);
                    if (overlap) {
                        setMessage({ type: 'error', text: `${r1.roundType.toUpperCase()} and ${r2.roundType.toUpperCase()} rounds overlap within the same exam` });
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
                setMessage({ type: 'success', text: 'Configuration saved successfully.' });
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
                setMessage({ type: 'success', text: `${roundIcons[roundType as RoundType].label} saved — question upload is now enabled.` });
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

    const fmtShort = (local: string) =>
        local ? new Date(local).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

    const selectedExam = examList.find((e) => e._id === examId);
    const enabledCount = rounds.filter((r) => r.enabled).length;
    const toggleChip = (list: string[], value: string, set: (v: string[]) => void) =>
        set(list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

    const uploadTitle: Record<RoundType, string> = {
        mcq: 'MCQ Questions',
        coding: 'Code Challenges',
        tr: 'Technical Interview Questions',
        hr: 'HR Interview Questions',
        english: 'English Assessment',
    };

    return (
        <>
            {/* Toast — per-round saves happen far down the page, so feedback floats top-right */}
            {message && (
                <div className={`aui-alert afc-toast ${message.type === 'success' ? 'aui-alert-success' : ''}`} role="status">
                    {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                    <span>{message.text}</span>
                    <button type="button" className="aui-alert-close" onClick={() => setMessage(null)} aria-label="Dismiss"><FaTimes size={11} /></button>
                </div>
            )}

            {/* ── Exam details ── */}
            <div className="aui-card">
                <div className="aui-toolbar">
                    <div className="aui-toolbar-title">
                        <h3>Exam Details {!examId && <span className="aui-badge aui-badge-orange afc-title-badge">New</span>}</h3>
                        <p>{examId ? 'Editing an existing exam — the title is locked' : 'Name the exam and choose who it is for'}</p>
                    </div>
                    <div className="aui-toolbar-filters">
                        <ExamPicker exams={examList} value={examId || ''} onChange={handleExamChange} />
                        {examId && (
                            <>
                                <button type="button" className="aui-icon-btn afc-delete" onClick={() => setConfirmDelete(true)} disabled={loading} title="Delete exam" aria-label="Delete exam">
                                    <FaTrash size={11} />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="afc-body">
                    <div className="aui-field">
                        <label className="aui-label" htmlFor="afc-title">Exam Title</label>
                        <input
                            id="afc-title"
                            className="aui-input"
                            value={title}
                            disabled={!!examId}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Full Stack Developer Assessment"
                        />
                    </div>

                    <div className="aui-field">
                        <label className="aui-label" htmlFor="afc-desc">Description <span className="aui-optional">Shown to students</span></label>
                        <textarea
                            id="afc-desc"
                            className="aui-input afc-textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Instructions students will see before starting the exam"
                            rows={3}
                        />
                    </div>

                    {/* Audience — an explicit "All" chip per row instead of "leave empty" */}
                    <div className="afc-audience">
                        <div className="afc-audience-head">
                            <span className="aui-label">Who can take this exam</span>
                            <span className="afc-summary">
                                <FaUsers size={11} /> Visible to:{' '}
                                <b>{branch.length ? branch.join(', ') : 'All branches'}</b>
                                <i>·</i>
                                <b>{joiningYear.length ? `${[...joiningYear].sort().reverse().join(', ')} batch${joiningYear.length > 1 ? 'es' : ''}` : 'All batches'}</b>
                            </span>
                        </div>
                        {([
                            { label: 'Branch', hint: 'Pick one or more', values: BRANCHES, list: branch, set: setBranch },
                            { label: 'Joining year', hint: 'Student batch', values: JOINING_YEARS, list: joiningYear, set: setJoiningYear },
                        ]).map((group) => (
                            <div key={group.label} className="afc-aud-row">
                                <div className="afc-aud-label">
                                    <strong>{group.label}</strong>
                                    <small>{group.list.length ? `${group.list.length} selected` : group.hint}</small>
                                </div>
                                <div className="afc-chips">
                                    <button type="button" className={`afc-chip afc-chip-all${group.list.length === 0 ? ' is-active' : ''}`} aria-pressed={group.list.length === 0} onClick={() => group.set([])}>
                                        {group.list.length === 0 && <FaCheck size={9} />} All
                                    </button>
                                    <span className="afc-chip-sep" aria-hidden="true" />
                                    {group.values.map((v) => (
                                        <button key={v} type="button" className={`afc-chip${group.list.includes(v) ? ' is-active' : ''}`} aria-pressed={group.list.includes(v)} onClick={() => toggleChip(group.list, v, group.set)}>
                                            {group.list.includes(v) && <FaCheck size={9} />} {v}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Rounds ── */}
            <div className="aui-card">
                <div className="aui-toolbar">
                    <div className="aui-toolbar-title">
                        <h3>Assessment Rounds</h3>
                        <p>Turn on a round, schedule it and save — then upload its questions</p>
                    </div>
                    <span className="aui-badge aui-badge-muted">{enabledCount} of {rounds.length} enabled</span>
                </div>

                <div className="afc-rounds">
                    {rounds.map((round, index) => {
                        const info = roundIcons[round.roundType];
                        const RoundIcon = info.icon;
                        const count = questionCounts[round.roundType] ?? 0;
                        const isScheduled = !!(round.startDateTime && round.endDateTime);
                        const isStarted = startedRoundTypes.has(round.roundType);
                        const isMCQTRHR = round.roundType === 'mcq' || round.roundType === 'tr' || round.roundType === 'hr';
                        const isSaved = savedRoundTypes.has(round.roundType);
                        const isSaving = savingRound === round.roundType;
                        const openQuestions = () => isMCQTRHR
                            ? setViewRound({ type: round.roundType as 'mcq' | 'tr' | 'hr', label: info.label })
                            : setUploadRound(round.roundType);

                        return (
                            <div key={round.roundType} className={`afc-round${round.enabled ? ' is-on' : ''}`} style={{ '--afc-tone': info.color } as React.CSSProperties}>
                                <div className="afc-round-head">
                                    <span className="afc-round-icon"><RoundIcon /></span>
                                    <div className="aui-stack afc-round-name">
                                        <strong>{info.label}</strong>
                                        <small>
                                            {round.enabled && isSaved && isScheduled
                                                ? <><FaCalendarAlt size={9} /> {fmtShort(round.startDateTime)} → {fmtShort(round.endDateTime)}</>
                                                : info.description}
                                        </small>
                                    </div>
                                    <div className="afc-round-badges">
                                        {!round.enabled ? (
                                            <span className="aui-badge aui-badge-muted">Off</span>
                                        ) : isStarted ? (
                                            <span className="aui-badge aui-badge-red"><FaLock size={8} /> In progress · locked</span>
                                        ) : isSaved ? (
                                            <span className="aui-badge aui-badge-green aui-badge-dot">Saved</span>
                                        ) : (
                                            <span className="aui-badge aui-badge-amber aui-badge-dot">Not saved</span>
                                        )}
                                        {round.enabled && isSaved && (
                                            <span className={`aui-badge ${count > 0 ? 'aui-badge-blue' : 'aui-badge-muted'}`}>
                                                {count} question{count === 1 ? '' : 's'}
                                            </span>
                                        )}
                                    </div>
                                    <label className="aui-toggle afc-switch" title={round.enabled ? 'Disable round' : 'Enable round'}>
                                        <input type="checkbox" checked={round.enabled} onChange={() => toggleRound(index)} aria-label={`Enable ${info.label}`} />
                                        <span className="aui-toggle-track" />
                                    </label>
                                </div>

                                {round.enabled && (
                                    <div className="afc-round-body">
                                        <div className="afc-round-grid">
                                            <div className="aui-field">
                                                <label className="aui-label">Questions</label>
                                                <input type="number" min={1} max={50} className="aui-input" value={round.pickCount} onChange={(e) => updateRound(index, 'pickCount', Number(e.target.value))} />
                                            </div>
                                            <div className="aui-field">
                                                <label className="aui-label">Duration</label>
                                                <div className="aui-input-group afc-suffix">
                                                    <input type="number" min={1} step={1} className="aui-input" value={Math.round(round.timeSeconds / 60)} onChange={(e) => updateRound(index, 'timeSeconds', Number(e.target.value) * 60)} />
                                                    <span>min</span>
                                                </div>
                                            </div>
                                            <div className="aui-field">
                                                <label className="aui-label">Pass mark</label>
                                                <div className="aui-input-group afc-suffix">
                                                    <input type="number" min={0} max={100} className="aui-input" value={round.passPercentage} onChange={(e) => updateRound(index, 'passPercentage', Number(e.target.value))} />
                                                    <span>%</span>
                                                </div>
                                            </div>
                                            <div className="aui-field">
                                                <label className="aui-label"><FaCalendarAlt size={10} /> Starts</label>
                                                <input type="datetime-local" className="aui-input" value={round.startDateTime} onChange={(e) => updateRound(index, 'startDateTime', e.target.value)} />
                                            </div>
                                            <div className="aui-field">
                                                <label className="aui-label"><FaClock size={10} /> Ends</label>
                                                <input type="datetime-local" className="aui-input" value={round.endDateTime} onChange={(e) => updateRound(index, 'endDateTime', e.target.value)} />
                                            </div>
                                        </div>

                                        <div className="afc-round-foot">
                                            <span className="aui-hint afc-hint">
                                                {isStarted
                                                    ? <><FaLock /> Students have started this round — questions are view-only.</>
                                                    : !isSaved
                                                        ? <><FaInfoCircle /> Set the schedule and click Save Round to enable question upload.</>
                                                        : !isScheduled
                                                            ? <><FaInfoCircle /> Set start and end times, then save to enable upload.</>
                                                            : count === 0
                                                                ? <><FaInfoCircle /> Saved — now add questions for this round.</>
                                                                : <><FaCheckCircle className="afc-ok" /> Ready · {count} question{count === 1 ? '' : 's'} in the bank, {round.pickCount} picked per student.</>}
                                            </span>
                                            <div className="afc-round-actions">
                                                {!isStarted && (
                                                    <button type="button" className="aui-btn" onClick={() => handleSaveRound(round.roundType)} disabled={isSaving}>
                                                        {isSaving ? <><FaSpinner className="aui-spin" /> Saving…</> : <><FaSave size={11} /> Save Round</>}
                                                    </button>
                                                )}
                                                {isSaved && isScheduled && (isStarted ? (
                                                    count > 0 && (
                                                        <button type="button" className="aui-btn aui-btn-soft" onClick={openQuestions}>
                                                            <FaEye size={11} /> View Questions ({count})
                                                        </button>
                                                    )
                                                ) : (
                                                    <>
                                                        {count > 0 && (
                                                            <button type="button" className="aui-btn aui-btn-soft" onClick={openQuestions}>
                                                                <FaListUl size={11} /> View / Edit ({count})
                                                            </button>
                                                        )}
                                                        <button type="button" className="aui-btn aui-btn-primary" onClick={() => setUploadRound(round.roundType)}>
                                                            <FaUpload size={11} /> {round.roundType === 'english' ? 'Manage Sections' : 'Upload Questions'}
                                                        </button>
                                                    </>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <style>{`
                .afc-toast { position: fixed; top: 20px; right: 20px; z-index: 1080; width: min(420px, calc(100vw - 40px)); margin: 0 !important; box-shadow: 0 14px 34px rgba(0,0,0,0.55); backdrop-filter: blur(8px); animation: afc-in 0.25s ease-out; }
                .afc-toast:not(.aui-alert-success) { background: rgba(40, 14, 16, 0.95); }
                .afc-toast.aui-alert-success { background: rgba(10, 32, 18, 0.95); }
                @keyframes afc-in { from { transform: translateX(24px); opacity: 0; } to { transform: none; opacity: 1; } }

                .afc-title-badge { margin-left: 8px; vertical-align: 2px; }
                .afc-picker { position: relative; }
                .afc-picker-trigger { display: flex; align-items: center; gap: 10px; width: 300px; height: 44px; padding: 0 0.7rem 0 0.4rem; border: 1px solid #34383d; border-radius: 9px; background: #17191c; color: #e6e8ea; text-align: left; transition: border-color 0.15s, box-shadow 0.15s; }
                .afc-picker-trigger:hover { border-color: #4a4f55; }
                .afc-picker-trigger.is-open, .afc-picker-trigger:focus-visible { border-color: rgba(255,122,0,0.75); box-shadow: 0 0 0 2px rgba(255,122,0,0.12); outline: none; }
                .afc-picker-icon { display: grid; place-items: center; width: 32px; height: 32px; flex: 0 0 32px; border-radius: 8px; background: rgba(56,189,248,0.12); color: #38bdf8; font-size: 0.8rem; }
                .afc-picker-icon.is-new { background: rgba(255,122,0,0.13); color: #ff9a3c; }
                .afc-picker-text { display: flex; flex: 1; min-width: 0; flex-direction: column; line-height: 1.2; }
                .afc-picker-text small { color: #858a90; font-size: 0.64rem; font-weight: 650; letter-spacing: 0.04em; text-transform: uppercase; }
                .afc-picker-text strong { overflow: hidden; color: #f1f5f9; font-size: 0.82rem; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
                .afc-picker-caret { color: #9aa0a6; font-size: 0.62rem; transition: transform 0.15s; }
                .afc-picker-trigger.is-open .afc-picker-caret { transform: rotate(180deg); }
                .afc-picker-menu { position: absolute; top: calc(100% + 6px); right: 0; z-index: 60; width: 340px; overflow: hidden; border: 1px solid #34383d; border-radius: 11px; background: #17191c; box-shadow: 0 18px 40px rgba(0,0,0,0.6); }
                .afc-picker-head { display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0.8rem 0.45rem; color: #9da2a8; font-size: 0.66rem; font-weight: 750; letter-spacing: 0.06em; text-transform: uppercase; }
                .afc-picker-search { position: relative; margin: 0 0.5rem 0.4rem; }
                .afc-picker-search svg { position: absolute; top: 50%; left: 10px; color: #6b7280; font-size: 0.7rem; transform: translateY(-50%); }
                .afc-picker-search input { width: 100%; height: 32px; padding: 0 0.6rem 0 1.9rem; border: 1px solid #2c3034; border-radius: 7px; outline: none; background: #111315; color: #e6e8ea; font-size: 0.78rem; }
                .afc-picker-search input:focus { border-color: rgba(255,122,0,0.6); }
                .afc-picker-menu ul { max-height: 280px; margin: 0; padding: 0 0.35rem 0.35rem; overflow-y: auto; list-style: none; }
                .afc-picker-menu li button { display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; padding: 0.5rem 0.6rem; border: 0; border-radius: 7px; background: transparent; text-align: left; }
                .afc-picker-menu li button:hover { background: #23262a; }
                .afc-picker-menu li button.is-active { background: rgba(255,122,0,0.1); }
                .afc-picker-menu li button.is-active strong { color: #ffb15e; }
                .afc-picker-menu li button > svg { flex: 0 0 auto; color: #ff7a00; font-size: 0.75rem; }
                .afc-picker-empty { padding: 0.75rem 0.6rem; color: #6b7280; font-size: 0.78rem; }
                .afc-picker-new { display: flex; align-items: center; gap: 8px; width: 100%; padding: 0.7rem 0.95rem; border: 0; border-top: 1px solid #2c3034; background: #131518; color: #ff9a3c; font-size: 0.8rem; font-weight: 650; text-align: left; }
                .afc-picker-new:hover { background: rgba(255,122,0,0.08); color: #ffb15e; }

                .afc-audience { margin-top: 0.25rem; padding-top: 1rem; border-top: 1px solid #202326; }
                .afc-audience-head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
                .afc-summary { display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; border: 1px solid rgba(255,122,0,0.25); border-radius: 99px; background: rgba(255,122,0,0.07); color: #a6abb0; font-size: 0.74rem; }
                .afc-summary svg { color: #ff9a3c; }
                .afc-summary b { color: #f1f5f9; font-weight: 650; }
                .afc-summary i { color: #4b5056; font-style: normal; }
                .afc-aud-row { display: grid; grid-template-columns: 150px minmax(0, 1fr); align-items: center; gap: 1rem; padding: 0.7rem 0; border-bottom: 1px dashed #24272b; }
                .afc-aud-row:last-child { border-bottom: 0; padding-bottom: 0.2rem; }
                .afc-aud-label { display: flex; flex-direction: column; gap: 2px; }
                .afc-aud-label strong { color: #e5e7eb; font-size: 0.8rem; font-weight: 650; }
                .afc-aud-label small { color: #6b7280; font-size: 0.7rem; }
                .afc-chip-sep { width: 1px; height: 20px; margin: 0 4px; align-self: center; background: #2c3034; }
                .afc-chip-all.is-active { border-color: rgba(56,189,248,0.55); background: rgba(56,189,248,0.12); color: #7dd3fc; }
                .afc-delete:hover:not(:disabled) { border-color: rgba(251,95,103,0.55) !important; color: #fb737a !important; }

                .afc-body { padding: 1.1rem 1.1rem 0.9rem; }
                .afc-textarea { height: auto; min-height: 84px; padding: 0.6rem 0.8rem; line-height: 1.5; resize: vertical; }
                .afc-chips { display: flex; flex-wrap: wrap; gap: 6px; }
                .afc-chip { display: inline-flex; align-items: center; gap: 5px; height: 30px; padding: 0 0.75rem; border: 1px solid #34383d; border-radius: 99px; background: #17191c; color: #b4b9be; font-size: 0.76rem; font-weight: 600; cursor: pointer; transition: border-color 0.15s, background 0.15s, color 0.15s; }
                .afc-chip:hover { border-color: #4a4f55; color: #fff; }
                .afc-chip.is-active { border-color: rgba(255,122,0,0.6); background: rgba(255,122,0,0.13); color: #ffb15e; }
                .afc-hint { display: flex; align-items: flex-start; gap: 7px; line-height: 1.45; }
                .afc-hint svg { flex: 0 0 auto; margin-top: 2px; color: #ff9a3c; }
                .afc-hint .afc-ok { color: #45dd75; }

                .afc-rounds { display: flex; flex-direction: column; }
                .afc-round { border-bottom: 1px solid #202326; border-left: 3px solid transparent; transition: background 0.15s; }
                .afc-round:last-child { border-bottom: 0; border-radius: 0 0 12px 12px; }
                .afc-round.is-on { border-left-color: var(--afc-tone); background: #111315; }
                .afc-round-head { display: flex; align-items: center; gap: 12px; padding: 0.85rem 1.1rem; }
                .afc-round-icon { display: grid; place-items: center; width: 36px; height: 36px; flex: 0 0 36px; border: 1px solid color-mix(in srgb, var(--afc-tone) 35%, transparent); border-radius: 10px; background: color-mix(in srgb, var(--afc-tone) 13%, transparent); color: var(--afc-tone); font-size: 0.9rem; }
                .afc-round:not(.is-on) .afc-round-icon { filter: saturate(0.4); opacity: 0.75; }
                .afc-round-name { flex: 1; }
                .afc-round-name strong { font-size: 0.86rem; }
                .afc-round-name small { display: inline-flex; align-items: center; gap: 5px; }
                .afc-round-badges { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
                .afc-switch { padding: 0; border: 0; background: none; }
                .afc-switch .aui-toggle-track { margin-top: 0; }

                .afc-round-body { padding: 0 1.1rem 0.95rem calc(1.1rem + 48px); }
                .afc-round-grid { display: grid; grid-template-columns: repeat(3, minmax(90px, 0.6fr)) repeat(2, minmax(190px, 1fr)); gap: 0 0.85rem; }
                .afc-round-grid .aui-field { margin-bottom: 0.8rem; }
                .afc-round-grid .aui-label { font-size: 0.74rem; color: #b4b9be; }
                .afc-round-grid .aui-label svg { color: #6b7280; }
                .afc-suffix > .aui-input { padding-right: 2.6rem; }
                .afc-suffix > span { position: absolute; right: 0.8rem; color: #858a90; font-size: 0.76rem; font-weight: 600; pointer-events: none; }
                .afc-round-foot { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; padding-top: 0.8rem; border-top: 1px dashed #2a2e33; }
                .afc-round-actions { display: flex; gap: 8px; flex-wrap: wrap; }

                .afc-full-head { display: flex; align-items: center; gap: 12px; padding: 0.85rem 1.25rem; border-bottom: 1px solid #25282b; background: #111315; color: #eceef0; }
                .afc-full-head > div { flex: 1; min-width: 0; }
                .afc-full-head h3 { display: flex; align-items: center; gap: 10px; margin: 0; color: #fff; font-size: 1.05rem; font-weight: 750; }
                .afc-full-head p { margin: 2px 0 0; color: #858a90; font-size: 0.76rem; }
                .afc-full-body { background: #0a0a0a !important; padding: 1.25rem 1.5rem !important; }

                .afc-notice { padding: 0.65rem 0.85rem; border: 1px solid rgba(129,140,248,0.25); border-radius: 9px; background: rgba(129,140,248,0.07); color: #c7cbe0; font-size: 0.78rem; line-height: 1.5; margin-bottom: 1rem; }
                .afc-notice code { color: #a5b4fc; }
                .afc-result { padding: 1.25rem 0.5rem 0.5rem; text-align: center; }
                .afc-result-icon { display: inline-grid; place-items: center; width: 52px; height: 52px; margin-bottom: 0.75rem; border-radius: 15px; font-size: 1.3rem; }
                .afc-result-icon.is-ok { background: rgba(49,216,102,0.13); color: #45dd75; }
                .afc-result-icon.is-warn { background: rgba(246,170,36,0.14); color: #f4b43f; }
                .afc-result-icon.is-fail { background: rgba(251,95,103,0.13); color: #fb737a; }
                .afc-result h4 { margin: 0 0 4px; color: #fff; font-size: 1.05rem; font-weight: 750; }
                .afc-result p { margin: 0; color: #9aa0a6; font-size: 0.84rem; }
                .afc-result p b { color: #fff; }
                .afc-failed { max-height: 140px; margin-top: 1rem; overflow-y: auto; text-align: left; }
                .afc-failed div { margin-bottom: 4px; padding: 5px 10px; border: 1px solid rgba(251,95,103,0.2); border-radius: 7px; background: rgba(251,95,103,0.07); font-size: 0.75rem; }
                .afc-failed b { color: #fb737a; }
                .afc-failed span { margin-left: 8px; color: #858a90; }

                .afc-confirm { padding: 1.5rem 1.5rem 1.1rem; text-align: center; }
                .afc-confirm-icon { display: inline-grid; place-items: center; width: 48px; height: 48px; margin-bottom: 0.75rem; border: 1px solid rgba(251,95,103,0.3); border-radius: 14px; background: rgba(251,95,103,0.12); color: #fb737a; font-size: 1.05rem; }
                .afc-confirm h3 { margin: 0 0 0.4rem; color: #fff; font-size: 1.05rem; font-weight: 750; }
                .afc-confirm p { margin: 0; color: #9aa0a6; font-size: 0.82rem; line-height: 1.5; }
                .afc-confirm p b { color: #e5e7eb; }

                @media (max-width: 1199.98px) {
                    .afc-round-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
                    .afc-round-grid > :nth-child(4), .afc-round-grid > :nth-child(5) { grid-column: span 1; }
                }
                @media (max-width: 767.98px) {
                    .afc-round-body { padding-left: 1.1rem; }
                    .afc-round-grid { grid-template-columns: 1fr 1fr; }
                    .afc-round-head { flex-wrap: wrap; }
                    .afc-round-badges { order: 4; width: 100%; justify-content: flex-start; padding-left: 48px; }
                    .afc-picker, .afc-picker-trigger { width: 100%; }
                    .afc-picker-menu { left: 0; right: auto; width: 100%; }
                    .afc-aud-row { grid-template-columns: 1fr; gap: 0.5rem; }
                }
            `}</style>

            {/* ── Delete exam confirm ── */}
            <Modal show={confirmDelete} onHide={() => !loading && setConfirmDelete(false)} centered contentClassName="aui-modal" backdropClassName="aui-backdrop">
                <div className="aui-page">
                    <div className="aui-modal-body afc-confirm">
                        <span className="afc-confirm-icon"><FaTrash /></span>
                        <h3>Delete this exam?</h3>
                        <p><b>{title || selectedExam?.title}</b> and its round configuration will be removed. This can’t be undone.</p>
                    </div>
                    <div className="aui-modal-foot">
                        <button type="button" className="aui-btn" onClick={() => setConfirmDelete(false)} disabled={loading}>Cancel</button>
                        <button type="button" className="aui-btn aui-btn-danger" onClick={async () => { await handleDeleteExam(); setConfirmDelete(false); }} disabled={loading}>
                            {loading ? <><FaSpinner className="aui-spin" /> Deleting…</> : <><FaTrash size={11} /> Delete Exam</>}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── Upload / Manage Questions (full screen) ── */}
            <Modal show={!!uploadRound} onHide={() => { setUploadRound(null); fetchQuestionCounts(); }} fullscreen backdrop="static">
                {uploadRound && (() => {
                    const info = roundIcons[uploadRound];
                    const RoundIcon = info.icon;
                    const isStarted = startedRoundTypes.has(uploadRound);
                    return (
                        <>
                            <div className="afc-full-head">
                                <span className="aui-heading-icon"><RoundIcon /></span>
                                <div>
                                    <h3>
                                        {uploadTitle[uploadRound]}
                                        {isStarted && <span className="aui-badge aui-badge-red"><FaLock size={8} /> View only — exam in progress</span>}
                                    </h3>
                                    <p>{title || selectedExam?.title}</p>
                                </div>
                                <button type="button" className="aui-icon-btn" onClick={() => { setUploadRound(null); fetchQuestionCounts(); }} aria-label="Close"><FaTimes size={12} /></button>
                            </div>
                            <Modal.Body className="afc-full-body">
                                {examId && (
                                    <>
                                        {uploadRound === 'mcq'     && <AdminQuizUpload defaultExamId={examId} readOnly={isStarted} />}
                                        {uploadRound === 'coding'  && <AdminCreateProblem defaultExamId={examId} readOnly={isStarted} />}
                                        {uploadRound === 'tr'      && <InterviewQuestions defaultExamId={examId} readOnly={isStarted} />}
                                        {uploadRound === 'hr'      && <HRInterviewQuestions defaultExamId={examId} readOnly={isStarted} />}
                                        {uploadRound === 'english' && <EnglishRoundConfig defaultExamId={examId} readOnly={isStarted} />}
                                    </>
                                )}
                            </Modal.Body>
                        </>
                    );
                })()}
            </Modal>

            {viewRound && (
                <QuestionListModal
                    show={!!viewRound}
                    onHide={() => { setViewRound(null); fetchQuestionCounts(); }}
                    examId={examId || ''}
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
