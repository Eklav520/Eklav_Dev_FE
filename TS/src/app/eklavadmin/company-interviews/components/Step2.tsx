import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { FaCheckCircle, FaDownload, FaExclamationTriangle, FaFileExcel, FaSpinner, FaTimes } from "react-icons/fa";
import { Tabs } from "@/components/admin-ui";
import { Dropzone } from "../../aptitudeQuestionsUpload/components/UploadParts";
import { roundTitle } from "./shared";

type Columns = { required: string[]; optional: string[] };

const columnsFor = (type: string): Columns => {
    switch (type) {
        case "MCQ":
            return { required: ["question", "option1", "option2", "option3", "option4", "correctAnswer"], optional: ["explanation"] };
        case "CODING":
            return { required: ["title", "description", "input", "output"], optional: [] };
        default:
            return { required: ["question", "expectedAnswer"], optional: ["explanation"] };
    }
};

const sampleRow = (type: string): Record<string, string> => {
    switch (type) {
        case "MCQ":
            return { question: "What is 25% of 200?", option1: "25", option2: "50", option3: "75", option4: "100", correctAnswer: "50", explanation: "25% of 200 = 0.25 × 200 = 50" };
        case "CODING":
            return { title: "Reverse a String", description: "Read a string and print it reversed.", input: "hello", output: "olleh" };
        default:
            return { question: "Tell me about a project you are proud of.", expectedAnswer: "Explains the problem, their own role, the result and what they learned.", explanation: "" };
    }
};

const ROUND_KIND: Record<string, string> = { MCQ: "Multiple choice", CODING: "Coding problems" };

const truncate = (v: any, n = 90) => {
    const s = v == null ? "" : String(v);
    return s.length > n ? `${s.slice(0, n)}…` : s;
};

const Step2 = ({ formData, setFormData }: any) => {
    const rounds: any[] = formData?.rounds || [];
    const [active, setActive] = useState(0);
    const [errors, setErrors] = useState<Record<number, string | null>>({});
    const [warnings, setWarnings] = useState<Record<number, string[]>>({});
    const [fileNames, setFileNames] = useState<Record<number, string>>({});
    const [parsing, setParsing] = useState<number | null>(null);
    const replaceInput = useRef<HTMLInputElement>(null);

    const index = Math.min(active, Math.max(0, rounds.length - 1));
    const round = rounds[index];

    const downloadTemplate = (r: any) => {
        const cols = columnsFor(r.roundType);
        const headers = [...cols.required, ...cols.optional];
        const sample = sampleRow(r.roundType);
        const ws = XLSX.utils.aoa_to_sheet([headers, headers.map((h) => sample[h] ?? "")]);
        ws["!cols"] = headers.map((h) => ({ wch: ["question", "description", "expectedAnswer", "explanation"].includes(h) ? 48 : 16 }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Questions");
        XLSX.writeFile(wb, `${roundTitle(r).replace(/[^\w]+/g, "_")}_Template.xlsx`);
    };

    const handleFile = (file: File, roundIndex: number) => {
        const r = rounds[roundIndex];
        setParsing(roundIndex);
        setErrors((prev) => ({ ...prev, [roundIndex]: null }));
        setWarnings((prev) => ({ ...prev, [roundIndex]: [] }));

        const reader = new FileReader();
        reader.onerror = () => {
            setErrors((prev) => ({ ...prev, [roundIndex]: "Could not read the file." }));
            setParsing(null);
        };
        reader.onload = (evt: any) => {
            try {
                const workbook = XLSX.read(new Uint8Array(evt.target.result), { type: "array" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const data: any[] = XLSX.utils.sheet_to_json(sheet);
                processRows(data, roundIndex, r.roundType, file.name);
            } catch {
                setErrors((prev) => ({ ...prev, [roundIndex]: "This file couldn't be read. Use the template (.xlsx, .xls or .csv)." }));
            } finally {
                setParsing(null);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const processRows = (data: any[], roundIndex: number, type: string, fileName: string) => {
        if (!data.length) {
            setErrors((prev) => ({ ...prev, [roundIndex]: "The first sheet has no question rows." }));
            return;
        }

        const fileCols = Object.keys(data[0]);
        const missingCols = columnsFor(type).required.filter((col) => !fileCols.includes(col));
        if (missingCols.length > 0) {
            setErrors((prev) => ({ ...prev, [roundIndex]: `Missing columns: ${missingCols.join(", ")}. Column names are case-sensitive.` }));
            return;
        }

        let formatted: any[] = [];
        const notes: string[] = [];

        if (type === "MCQ") {
            formatted = data.map((row) => ({
                question: row.question,
                options: [row.option1, row.option2, row.option3, row.option4],
                correctAnswer: row.correctAnswer,
                ...(row.explanation ? { explanation: row.explanation } : {}),
            }));
            // Answers are checked by exact option text, so flag rows that can never be marked correct
            formatted.forEach((q, i) => {
                if (!q.options.some((o: any) => o != null && String(o).trim() === String(q.correctAnswer ?? "").trim())) {
                    notes.push(`Row ${i + 2}: correctAnswer "${truncate(q.correctAnswer, 30)}" doesn't match any option`);
                }
            });
        } else if (type === "CODING") {
            formatted = data.map((row) => ({
                title: row.title,
                description: row.description,
                input: row.input,
                output: row.output,
            }));
        } else {
            formatted = data.map((row) => ({
                question: row.question,
                expectedAnswer: row.expectedAnswer,
                ...(row.explanation ? { explanation: row.explanation } : {}),
            }));
        }

        const key = type === "CODING" ? "title" : "question";
        formatted.forEach((q, i) => { if (q[key] == null || String(q[key]).trim() === "") notes.push(`Row ${i + 2}: ${key} is empty`); });

        setFormData((prev: any) => ({
            ...prev,
            rounds: prev.rounds.map((r: any, i: number) => (i === roundIndex ? { ...r, questions: formatted } : r)),
        }));
        setWarnings((prev) => ({ ...prev, [roundIndex]: notes }));
        setFileNames((prev) => ({ ...prev, [roundIndex]: fileName }));
    };

    if (!round) return null;

    const cols = columnsFor(round.roundType);
    const questions: any[] = round.questions || [];
    const error = errors[index];
    const roundWarnings = warnings[index] || [];
    const readyCount = rounds.filter((r) => r.questions?.length > 0).length;

    return (
        <div className="ci-q">
            <div className="ci-q-nav">
                <Tabs<string>
                    small
                    label="Rounds"
                    value={String(index)}
                    onChange={(v) => setActive(Number(v))}
                    items={rounds.map((r, i) => ({
                        value: String(i),
                        label: <>{r.order}. {roundTitle(r)} {r.questions?.length > 0 ? <FaCheckCircle className="ci-q-tick" size={10} /> : <span className="ci-q-dot" />}</>,
                    }))}
                />
                <span className={`aui-badge ${readyCount === rounds.length ? "aui-badge-green" : "aui-badge-amber"}`}>
                    {readyCount} / {rounds.length} rounds ready
                </span>
            </div>

            <div className="aui-card">
                <div className="aui-toolbar">
                    <div className="aqu-title">
                        <span className="ci-q-order">{round.order}</span>
                        <div className="aui-toolbar-title">
                            <h3>
                                {roundTitle(round)}
                                {questions.length > 0
                                    ? <span className="aui-badge aui-badge-dot aui-badge-green ci-q-state">{questions.length} question{questions.length === 1 ? "" : "s"}</span>
                                    : <span className="aui-badge aui-badge-dot aui-badge-amber ci-q-state">Needs questions</span>}
                            </h3>
                            <p>{ROUND_KIND[round.roundType] || "Question & answer"}{round.duration ? ` · ${round.duration} min` : ""}</p>
                        </div>
                    </div>
                    <div className="aui-toolbar-filters">
                        <button type="button" className="aui-btn" onClick={() => downloadTemplate(round)}>
                            <FaDownload size={11} /> Download template
                        </button>
                    </div>
                </div>

                <div className="aqu-grid">
                    <div className="aqu-main">
                        {error && (
                            <div className="aui-alert"><FaExclamationTriangle /> <span>{error}</span>
                                <button type="button" className="aui-alert-close" onClick={() => setErrors((p) => ({ ...p, [index]: null }))} aria-label="Dismiss"><FaTimes size={11} /></button>
                            </div>
                        )}

                        {parsing === index ? (
                            <div className="aqu-drop"><FaSpinner className="aui-spin" /><small>Reading file…</small></div>
                        ) : questions.length > 0 ? (
                            <div className="aqu-file">
                                <span className="aqu-file-icon"><FaFileExcel /></span>
                                <div className="aui-stack">
                                    <strong>{fileNames[index] || "Saved questions"}</strong>
                                    <small>{questions.length} question{questions.length === 1 ? "" : "s"} loaded · uploading a new file replaces them</small>
                                </div>
                                <input
                                    ref={replaceInput}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    className="d-none"
                                    onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) handleFile(f, index); }}
                                />
                                <button type="button" className="aui-btn aui-btn-sm" onClick={() => replaceInput.current?.click()}>Replace file</button>
                            </div>
                        ) : (
                            <Dropzone
                                accept=".xlsx,.xls,.csv"
                                hint="Excel or CSV · one question per row"
                                icon={FaFileExcel}
                                file={null}
                                onFile={(f) => handleFile(f, index)}
                                onClear={() => undefined}
                                fileSize={() => ""}
                            />
                        )}

                        {roundWarnings.length > 0 && (
                            <div className="aqu-warnings ci-q-warn">
                                <div><FaExclamationTriangle /> {roundWarnings.length} row{roundWarnings.length === 1 ? "" : "s"} to check</div>
                                <ul>
                                    {roundWarnings.slice(0, 5).map((w, i) => <li key={i}>{w}</li>)}
                                    {roundWarnings.length > 5 && <li>…and {roundWarnings.length - 5} more</li>}
                                </ul>
                            </div>
                        )}

                        {questions.length > 0 && (
                            <div className="ci-q-preview">
                                <div className="aui-section-label">Preview · first {Math.min(5, questions.length)} of {questions.length}</div>
                                <div className="aui-table-scroll">
                                    <table className="aui-table">
                                        <thead>
                                            {round.roundType === "MCQ" ? (
                                                <tr><th style={{ width: 40 }}>#</th><th>Question</th><th>Options</th><th>Answer</th></tr>
                                            ) : round.roundType === "CODING" ? (
                                                <tr><th style={{ width: 40 }}>#</th><th>Title</th><th>Description</th><th>Input</th><th>Output</th></tr>
                                            ) : (
                                                <tr><th style={{ width: 40 }}>#</th><th>Question</th><th>Expected answer</th></tr>
                                            )}
                                        </thead>
                                        <tbody>
                                            {questions.slice(0, 5).map((q: any, i: number) => (
                                                <tr key={i}>
                                                    <td className="aui-num">{i + 1}</td>
                                                    {round.roundType === "MCQ" ? (
                                                        <>
                                                            <td>{truncate(q.question)}</td>
                                                            <td>
                                                                <div className="ci-q-opts">
                                                                    {(q.options || []).map((o: any, oi: number) => (
                                                                        <span key={oi} className={`aui-badge ${String(o ?? "").trim() === String(q.correctAnswer ?? "").trim() ? "aui-badge-green" : "aui-badge-muted"}`}>{truncate(o, 24)}</span>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td><span className="ci-q-answer">{truncate(q.correctAnswer, 30)}</span></td>
                                                        </>
                                                    ) : round.roundType === "CODING" ? (
                                                        <>
                                                            <td><strong className="ci-q-strong">{truncate(q.title, 40)}</strong></td>
                                                            <td>{truncate(q.description, 70)}</td>
                                                            <td><code className="ci-q-code">{truncate(q.input, 24)}</code></td>
                                                            <td><code className="ci-q-code">{truncate(q.output, 24)}</code></td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td>{truncate(q.question)}</td>
                                                            <td className="ci-q-muted">{truncate(q.expectedAnswer)}</td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    <aside className="aqu-guide">
                        <h4>Expected columns</h4>
                        <div className="aqu-cols">
                            {cols.required.map((c) => <code key={c} className="is-key">{c}</code>)}
                            {cols.optional.map((c) => <code key={c}>{c} (optional)</code>)}
                        </div>
                        <ul className="aqu-rules">
                            <li>Only the <b>first worksheet</b> is read; row 1 holds the column names</li>
                            <li>Column names are <b>case-sensitive</b></li>
                            {round.roundType === "MCQ" && <li><code>correctAnswer</code> must be the <b>exact text</b> of one option</li>}
                            {round.roundType === "CODING" && <li><code>input</code> and <code>output</code> are the sample test shown to students</li>}
                            {round.roundType !== "MCQ" && round.roundType !== "CODING" && <li><code>expectedAnswer</code> is what a good answer should cover</li>}
                            <li>Uploading again replaces this round's questions</li>
                        </ul>
                    </aside>
                </div>
            </div>

            <style>{`
                .ci-q { display: flex; flex-direction: column; gap: 0.85rem; }
                .ci-q-nav { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
                .ci-q-nav .aui-tabs { flex-wrap: wrap; }
                .ci-q-tick { color: #45dd75; }
                .aui-tabs button.is-active .ci-q-tick { color: #fff; }
                .ci-q-dot { width: 7px; height: 7px; border-radius: 50%; background: #f4b43f; }
                .ci-q-order { display: grid; place-items: center; width: 36px; height: 36px; border: 1px solid rgba(255,122,0,0.3); border-radius: 10px; background: rgba(255,122,0,0.1); color: #ff9a3c; font-size: 0.95rem; font-weight: 800; }
                .ci-q-state { margin-left: 8px; vertical-align: 2px; }
                .ci-q-warn { padding: 0.75rem 0.9rem; border: 1px solid rgba(244,180,63,0.25); border-radius: 10px; background: rgba(244,180,63,0.05); margin-top: 0; }
                .ci-q-preview { overflow: hidden; border: 1px solid #25282b; border-radius: 10px; }
                .ci-q-preview .aui-section-label { margin: 0; padding: 0.6rem 0.85rem; border-bottom: 1px solid #25282b; background: #111315; }
                .ci-q-preview .aui-table td { font-size: 0.76rem; vertical-align: top; }
                .ci-q-opts { display: flex; flex-wrap: wrap; gap: 4px; }
                .ci-q-answer { color: #45dd75; font-weight: 650; }
                .ci-q-strong { color: #eceef0; }
                .ci-q-muted { color: #9da2a8; }
                .ci-q-code { color: #ffb15e; font-size: 0.72rem; }
            `}</style>
        </div>
    );
};

export default Step2;
