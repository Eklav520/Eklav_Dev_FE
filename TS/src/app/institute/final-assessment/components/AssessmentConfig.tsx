import React, { useState, useEffect } from "react";
import { useAuthContext } from "@/context/useAuthContext";
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
    FaPlus,
    FaTrash,
    FaEdit,
    FaInfoCircle,
    FaExclamationTriangle
} from "react-icons/fa";

type RoundType = "mcq" | "coding" | "tr" | "hr";

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
}

const roundIcons = {
    mcq: { icon: FaList, label: "MCQ Quiz", color: "#ff7a00", description: "Multiple choice questions" },
    coding: { icon: FaCode, label: "Code Challenge", color: "#28a745", description: "Programming problems" },
    tr: { icon: FaComments, label: "Technical Round", color: "#17a2b8", description: "Technical interview" },
    hr: { icon: FaUserTie, label: "HR Round", color: "#fd7e14", description: "HR interview" }
};

export default function AssessmentConfig({ examId, setExamId }: Props) {
    const { user } = useAuthContext();

    const [rounds, setRounds] = useState<RoundConfig[]>([
        { roundType: "mcq", enabled: false, pickCount: 10, timeSeconds: 600, startDateTime: "", endDateTime: "", passPercentage: 40 },
        { roundType: "coding", enabled: false, pickCount: 1, timeSeconds: 1800, startDateTime: "", endDateTime: "", passPercentage: 40 },
        { roundType: "tr", enabled: false, pickCount: 5, timeSeconds: 600, startDateTime: "", endDateTime: "", passPercentage: 40 },
        { roundType: "hr", enabled: false, pickCount: 5, timeSeconds: 600, startDateTime: "", endDateTime: "", passPercentage: 40 },
    ]);

    const [examList, setExamList] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
        
        // Clear title when "Create New Exam" is selected
        if (!selectedExamId) {
            setTitle("");
            // Reset rounds to default state
            setRounds([
                { roundType: "mcq", enabled: false, pickCount: 10, timeSeconds: 600, startDateTime: "", endDateTime: "", passPercentage: 40 },
                { roundType: "coding", enabled: false, pickCount: 1, timeSeconds: 1800, startDateTime: "", endDateTime: "", passPercentage: 40 },
                { roundType: "tr", enabled: false, pickCount: 5, timeSeconds: 600, startDateTime: "", endDateTime: "", passPercentage: 40 },
                { roundType: "hr", enabled: false, pickCount: 5, timeSeconds: 600, startDateTime: "", endDateTime: "", passPercentage: 40 },
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
                }
            } catch (err) {
                console.error("Failed to fetch exam details", err);
            }
        };

        fetchExamDetails();
    }, [examId]);

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
                    rounds: payloadRounds,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setMessage({ type: 'success', text: '✅ Configuration saved successfully!' });
                window.scrollTo({ top: 0, behavior: 'smooth' });

                if (!examId && data.examId) {
                    setExamId?.(data.examId);
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
                    <div className="config-header">
                        <h5 className="config-title">Assessment Configuration</h5>
                        <p className="config-subtitle">Configure your exam rounds, timing, and passing criteria</p>
                    </div>

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
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="form-actions">
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="submit-btn"
                        >
                            {saving ? (
                                <>
                                    <FaSpinner className="spinner-icon" />
                                    Saving Configuration...
                                </>
                            ) : (
                                <>
                                    <FaSave className="me-2" />
                                    Save Assessment
                                </>
                            )}
                        </button>
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
            `}</style>
        </>
    );
}