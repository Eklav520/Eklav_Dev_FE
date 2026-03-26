import React, { useState, useEffect } from "react";
import { useAuthContext } from "@/context/useAuthContext";

type RoundType = "mcq" | "coding" | "tr" | "hr";

interface RoundConfig {
    roundType: RoundType;
    enabled: boolean;
    pickCount: number;
    timeSeconds: number;
}

interface Props {
    examId?: string;
    setExamId?: (id: string) => void;
}

export default function AssessmentConfig({ examId, setExamId }: Props) {
    const { user } = useAuthContext();

    const [rounds, setRounds] = useState<RoundConfig[]>([
        { roundType: "mcq", enabled: false, pickCount: 10, timeSeconds: 600 },
        { roundType: "coding", enabled: false, pickCount: 1, timeSeconds: 1800 },
        { roundType: "tr", enabled: false, pickCount: 5, timeSeconds: 600 },
        { roundType: "hr", enabled: false, pickCount: 5, timeSeconds: 600 },
    ]);

    const [examList, setExamList] = useState<any[]>([]);

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [passPercentage, setPassPercentage] = useState(40);



    /* =========================
       FETCH EXISTING EXAMS
    ========================= */
    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/api/assessment/admin/exams`,
                    {
                        headers: {
                            Authorization: `Bearer ${user?.token}`,
                        },
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

    /* =========================
       AUTO LOAD TITLE
    ========================= */
    useEffect(() => {
        if (!examId) return;

        const selected = examList.find((e) => e._id === examId);
        if (selected) {
            setTitle(selected.title);
        }
    }, [examId, examList]);

    /* =========================
       TOGGLE ROUND
    ========================= */
    const toggleRound = (index: number) => {
        const updated = rounds.map((r, i) => ({
            ...r,
            enabled: i === index ? !r.enabled : false // 🔥 only one active
        }));

        setRounds(updated);
    };

    /* =========================
       SUBMIT
    ========================= */
    const handleSubmit = async () => {
        try {
            if (!startDate || !endDate || !startTime || !endTime) {
                return alert("Please select all date & time fields ❌");
            }

            setLoading(true);

            const url = examId
                ? `${import.meta.env.VITE_API_BASE_URL}/api/assessment/admin/exam/${examId}`
                : `${import.meta.env.VITE_API_BASE_URL}/api/assessment/admin/exam`;

            const method = examId ? "PUT" : "POST";

            const payloadRounds = rounds
                .filter((r) => r.enabled)
                .map((r) => ({
                    roundType: r.roundType,
                    enabled: r.enabled,
                    pickCount: r.pickCount,
                    timeSeconds: r.timeSeconds,
                }));

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user?.token}`,
                },
                body: JSON.stringify({
                    title,
                    rounds: payloadRounds,
                    startDate,
                    endDate,
                    startTime,
                    endTime,
                    passPercentage,
                }),
            });

            const data = await res.json();

            if (data.success) {
                alert("Configuration saved ✅");

                // ✅ STORE examId after creation
                if (!examId && data.examId) {
                    setExamId?.(data.examId);
                }
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong ❌");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            backgroundColor: "#000000",
            color: "#ffffff",
            padding: "2rem",
            borderRadius: "12px",
            minHeight: "100vh"
        }}>
            <h5 style={{
                marginBottom: "1rem",
                color: "#ff7a00",
                fontSize: "1.25rem",
                fontWeight: "600"
            }}>
                Assessment Configuration
            </h5>

            {/* MODE */}
            <h6
                style={{
                    color: examId ? "#ff7a00" : "#ff7a00",
                    marginBottom: "1rem",
                    fontWeight: "500"
                }}
            >
                {examId ? "🟢 Editing Existing Exam" : "🟠 Creating New Exam"}
            </h6>

            {/* SELECT EXISTING EXAM */}
            <div style={{ marginBottom: "1.5rem" }}>
                <h6 style={{ color: "#ff7a00", marginBottom: "0.5rem", fontWeight: "500" }}>
                    Select Existing Exam
                </h6>

                <select
                    value={examId || ""}
                    onChange={(e) => {
                        const selectedId = e.target.value;
                        setExamId?.(selectedId);
                    }}
                    style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        background: "#0a0a0a",
                        color: "#ffffff",
                        border: "1px solid #ff7a00",
                        fontSize: "14px",
                        cursor: "pointer"
                    }}
                >
                    <option value="">-- Create New Exam --</option>

                    {examList.map((exam) => (
                        <option key={exam._id} value={exam._id}>
                            {exam.title}
                        </option>
                    ))}
                </select>
            </div>

            {/* CREATE NEW BUTTON */}
            <button
                onClick={() => {
                    setExamId?.("");
                    setTitle("");
                    alert("Switched to New Exam Mode");
                }}
                style={{
                    marginBottom: "1.5rem",
                    padding: "8px 16px",
                    background: "transparent",
                    color: "#ff7a00",
                    border: "1px solid #ff7a00",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#ff7a00";
                    e.currentTarget.style.color = "#000000";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#ff7a00";
                }}
            >
                + Create New Exam
            </button>

            {/* TITLE */}
            <div style={{ marginBottom: "1.5rem" }}>
                <h6 style={{ color: "#ff7a00", marginBottom: "0.5rem", fontWeight: "500" }}>
                    Exam Title
                </h6>

                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter exam name"
                    style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        background: "#0a0a0a",
                        color: "#ffffff",
                        border: "1px solid #ff7a00",
                        fontSize: "14px"
                    }}
                />
            </div>

            {/* ROUNDS */}
            <div style={{ marginBottom: "1.5rem" }}>
                <h6 style={{ color: "#ff7a00", marginBottom: "1rem", fontWeight: "500" }}>
                    Assessment Rounds
                </h6>
                <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
                    {rounds.map((r, i) => (
                        <div
                            key={r.roundType}
                            style={{
                                padding: "16px",
                                border: r.enabled ? "2px solid #ff7a00" : "1px solid #333",
                                borderRadius: "10px",
                                background: "#0a0a0a",
                                minWidth: "200px",
                                transition: "all 0.3s ease"
                            }}
                        >
                            <div style={{ marginBottom: "12px", display: "flex", alignItems: "center" }}>
                                <input
                                    type="radio"
                                    name="round"
                                    checked={r.enabled}
                                    onChange={() => toggleRound(i)}
                                    style={{
                                        accentColor: "#ff7a00",
                                        cursor: "pointer"
                                    }}
                                />
                                <span style={{
                                    marginLeft: "8px",
                                    fontWeight: "600",
                                    color: r.enabled ? "#ff7a00" : "#ffffff"
                                }}>
                                    {r.roundType.toUpperCase()}
                                </span>
                            </div>

                            <div style={{ marginBottom: "10px" }}>
                                <label style={{
                                    fontSize: "12px",
                                    color: "#ff7a00",
                                    display: "block",
                                    marginBottom: "4px"
                                }}>
                                    Questions to pick
                                </label>
                                <input
                                    type="number"
                                    value={r.pickCount}
                                    disabled={!r.enabled}
                                    onChange={(e) => {
                                        const updated = [...rounds];
                                        updated[i].pickCount = Number(e.target.value);
                                        setRounds(updated);
                                    }}
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        borderRadius: "6px",
                                        background: !r.enabled ? "#1a1a1a" : "#0a0a0a",
                                        color: "#ffffff",
                                        border: "1px solid #ff7a00",
                                        fontSize: "14px"
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{
                                    fontSize: "12px",
                                    color: "#ff7a00",
                                    display: "block",
                                    marginBottom: "4px"
                                }}>
                                    Time (seconds)
                                </label>
                                <input
                                    type="number"
                                    value={r.timeSeconds}
                                    disabled={!r.enabled}
                                    onChange={(e) => {
                                        const updated = [...rounds];
                                        updated[i].timeSeconds = Number(e.target.value);
                                        setRounds(updated);
                                    }}
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        borderRadius: "6px",
                                        background: !r.enabled ? "#1a1a1a" : "#0a0a0a",
                                        color: "#ffffff",
                                        border: "1px solid #ff7a00",
                                        fontSize: "14px"
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* DATES & TIME SECTION */}
            <div style={{ marginBottom: "1.5rem" }}>
                <h6 style={{ color: "#ff7a00", marginBottom: "1rem", fontWeight: "500" }}>
                    Schedule
                </h6>
                <div style={{ display: "flex", gap: "15px", flexWrap: "wrap", marginBottom: "15px" }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: "12px", color: "#ff7a00", display: "block", marginBottom: "4px" }}>
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "8px",
                                background: "#0a0a0a",
                                color: "#ffffff",
                                border: "1px solid #ff7a00",
                                fontSize: "14px"
                            }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: "12px", color: "#ff7a00", display: "block", marginBottom: "4px" }}>
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "8px",
                                background: "#0a0a0a",
                                color: "#ffffff",
                                border: "1px solid #ff7a00",
                                fontSize: "14px"
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: "12px", color: "#ff7a00", display: "block", marginBottom: "4px" }}>
                            Start Time
                        </label>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "8px",
                                background: "#0a0a0a",
                                color: "#ffffff",
                                border: "1px solid #ff7a00",
                                fontSize: "14px"
                            }}
                        />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: "12px", color: "#ff7a00", display: "block", marginBottom: "4px" }}>
                            End Time
                        </label>
                        <input
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "8px",
                                background: "#0a0a0a",
                                color: "#ffffff",
                                border: "1px solid #ff7a00",
                                fontSize: "14px"
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* PASS % */}
            <div style={{ marginBottom: "2rem" }}>
                <h6 style={{ color: "#ff7a00", marginBottom: "0.5rem", fontWeight: "500" }}>
                    Pass Percentage
                </h6>
                <input
                    type="number"
                    value={passPercentage}
                    onChange={(e) => setPassPercentage(Number(e.target.value))}
                    style={{
                        width: "200px",
                        padding: "10px",
                        borderRadius: "8px",
                        background: "#0a0a0a",
                        color: "#ffffff",
                        border: "1px solid #ff7a00",
                        fontSize: "14px"
                    }}
                />
            </div>

            {/* SUBMIT BUTTON */}
            <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                    width: "100%",
                    padding: "14px",
                    background: loading ? "#666" : "#ff7a00",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "all 0.3s ease"
                }}
                onMouseEnter={(e) => {
                    if (!loading) {
                        e.currentTarget.style.background = "#ff8c33";
                    }
                }}
                onMouseLeave={(e) => {
                    if (!loading) {
                        e.currentTarget.style.background = "#ff7a00";
                    }
                }}
            >
                {loading ? "Saving..." : "Save Configuration"}
            </button>
        </div>
    );
}