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
    FaEdit
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
    mcq: { icon: FaList, label: "MCQ Quiz", color: "#ff7a00" },
    coding: { icon: FaCode, label: "Code Challenge", color: "#28a745" },
    tr: { icon: FaComments, label: "Technical Round", color: "#17a2b8" },
    hr: { icon: FaUserTie, label: "HR Round", color: "#fd7e14" }
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

    /* ================= AUTO TITLE ================= */
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

                    // 🔥 LOAD EXISTING ROUNDS
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
                return;
            }

            if (!title.trim()) {
                setMessage({ type: 'error', text: 'Please enter an exam title' });
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
                setMessage({ type: 'success', text: 'Configuration saved successfully!' });

                if (!examId && data.examId) {
                    setExamId?.(data.examId);
                }

                // Refresh exam list
                const refreshRes = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/assessment/admin/exams`,
                    { headers: { Authorization: `Bearer ${user?.token}` } }
                );
                const refreshData = await refreshRes.json();
                setExamList(refreshData.exams || []);
            } else {
                setMessage({ type: 'error', text: data.message || 'Failed to save configuration' });
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
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
        <div className="assessment-config-container">
            <div className="config-card">
                <div className="config-header">
                    <h5 className="config-title">Assessment Configuration</h5>
                    <p className="config-subtitle">Configure your exam rounds, timing, and passing criteria</p>
                </div>

                {/* Message Alert */}
                {message && (
                    <div className={`alert-message ${message.type}`}>
                        {message.type === 'success' ? <FaCheckCircle className="alert-icon" /> : <FaTimesCircle className="alert-icon" />}
                        <span>{message.text}</span>
                    </div>
                )}

                {/* Exam Selection */}
                <div className="form-group">
                    <label className="form-label">Exam Configuration</label>
                    <select
                        value={examId || ""}
                        onChange={(e) => setExamId?.(e.target.value)}
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

                {/* Exam Title */}
                <div className="form-group">
                    <label className="form-label">Exam Title</label>
                    <input
                        value={title}
                        disabled={!!examId} // 🔥 FIX
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Full Stack Developer Assessment"
                        className="form-input-custom"
                    />
                    <small className="form-hint">Give your exam a descriptive title</small>
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
                                                <span className="round-name">{roundInfo.label}</span>
                                            </label>
                                        </div>
                                        <div className="round-status">
                                            {round.enabled ? (
                                                <span className="status-badge enabled">Enabled</span>
                                            ) : (
                                                <span className="status-badge disabled">Disabled</span>
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

            <style>{`
        .assessment-config-container {
          background: #000000;
          min-height: 100vh;
          padding: 2rem;
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
          border-bottom: 1px solid #ff7a00;
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

        /* Alert Message */
        .alert-message {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          margin: 1rem 1.5rem;
          border-radius: 8px;
        }

        .alert-message.success {
          background: rgba(40, 167, 69, 0.1);
          border: 1px solid #28a745;
          color: #28a745;
        }

        .alert-message.error {
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid #dc3545;
          color: #dc3545;
        }

        .alert-icon {
          font-size: 1.25rem;
        }

        /* Form Groups */
        .form-group {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #1f1f1f;
        }

        .form-label {
          color: #ff7a00;
          font-weight: 500;
          margin-bottom: 0.5rem;
          display: block;
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
          border-color: #ff7a00;
          box-shadow: 0 0 0 0.2rem rgba(255, 122, 0, 0.25);
          outline: none;
        }

        .form-hint {
          color: #6c757d;
          font-size: 0.75rem;
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
          color: #ff7a00;
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
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }

        .round-card {
          background: #000000;
          border: 1px solid #2c2c2c;
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .round-card.enabled {
          border-color: #ff7a00;
          box-shadow: 0 4px 12px rgba(255, 122, 0, 0.1);
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
        }

        .round-checkbox {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #ff7a00;
        }

        .round-checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          margin: 0;
        }

        .round-icon {
          font-size: 1.25rem;
        }

        .round-name {
          color: #ffffff;
          font-weight: 600;
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
          color: #ff7a00;
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
          background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
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
          box-shadow: 0 4px 12px rgba(255, 122, 0, 0.4);
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
          .assessment-config-container {
            padding: 1rem;
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
        }
      `}</style>
        </div>
    );
}