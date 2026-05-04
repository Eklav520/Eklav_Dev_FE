import React, { useState } from "react";
import { Card, Table, Alert } from "react-bootstrap";
import * as XLSX from "xlsx";

const Step2 = ({ formData, setFormData }: any) => {
    const [previewData, setPreviewData] = useState<any>({});
    const [errors, setErrors] = useState<any>({});

    // ✅ Expected columns per round (explanation is optional for MCQ/CUSTOM)
    const getExpectedColumns = (type: string) => {
        switch (type) {
            case "MCQ":
                return ["question", "option1", "option2", "option3", "option4", "correctAnswer", "explanation (optional)"];
            case "CODING":
                return ["title", "description", "input", "output"];
            default:
                return ["question", "expectedAnswer", "explanation (optional)"];
        }
    };

    // Required columns used for validation (excludes optional ones)
    const getRequiredColumns = (type: string) => {
        switch (type) {
            case "MCQ":
                return ["question", "option1", "option2", "option3", "option4", "correctAnswer"];
            case "CODING":
                return ["title", "description", "input", "output"];
            default:
                return ["question", "expectedAnswer"];
        }
    };

    // ✅ Upload handler
    const handleFileUpload = (e: any, roundIndex: number) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();

        reader.onload = (evt: any) => {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, { type: "array" });

            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(sheet);

            validateAndProcess(jsonData, roundIndex);
        };

        reader.readAsArrayBuffer(file);
    };

    // ✅ Validate + Process
    const validateAndProcess = (data: any[], roundIndex: number) => {
        const round = formData.rounds[roundIndex];

        if (!data.length) return;

        const fileCols = Object.keys(data[0]);

        const missingCols = getRequiredColumns(round.roundType).filter(
            (col) => !fileCols.includes(col)
        );

        if (missingCols.length > 0) {
            setErrors((prev: any) => ({
                ...prev,
                [roundIndex]: `Missing columns: ${missingCols.join(", ")}`,
            }));
            return;
        }

        setErrors((prev: any) => ({ ...prev, [roundIndex]: null }));

        let formatted: any[] = [];

        if (round.roundType === "MCQ") {
            formatted = data.map((row) => ({
                question: row.question,
                options: [row.option1, row.option2, row.option3, row.option4],
                correctAnswer: row.correctAnswer,
                ...(row.explanation ? { explanation: row.explanation } : {}),
            }));
        } else if (round.roundType === "CODING") {
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

        const updatedRounds = [...formData.rounds];
        updatedRounds[roundIndex].questions = formatted;

        setFormData({ ...formData, rounds: updatedRounds });

        setPreviewData((prev: any) => ({
            ...prev,
            [roundIndex]: formatted,
        }));
    };

    return (
        <div>
            {formData?.rounds?.map((round: any, index: number) => (
                <Card key={index} className="mb-4 shadow-sm">
                    <Card.Body>
                        <h5>
                            {round.order}. {round.roundName}
                        </h5>

                        {/* ✅ Instructions */}
                        <p style={{ fontSize: "13px", color: "#666" }}>
                            Expected Columns:{" "}
                            <b>{getExpectedColumns(round.roundType).join(", ")}</b>
                        </p>

                        {/* ✅ Upload */}
                        <input
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            onChange={(e) => handleFileUpload(e, index)}
                        />
                        {round.questions?.length > 0 && (
                            <p style={{ color: "green", marginTop: "8px" }}>
                                ✅ {round.questions.length} questions loaded
                                {' '}<small className="text-muted">(upload a new file to replace)</small>
                            </p>
                        )}

                        {/* ❌ Error */}
                        {errors[index] && (
                            <Alert variant="danger" className="mt-2">
                                {errors[index]}
                            </Alert>
                        )}

                        {/* ✅ Preview */}
                        {previewData[index] && (
                            <div className="mt-3">
                                <h6>Preview ({previewData[index].length})</h6>

                                <Table bordered size="sm">
                                    <thead>
                                        <tr>
                                            {Object.keys(previewData[index][0]).map((key) => (
                                                <th key={key}>{key}</th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {previewData[index].slice(0, 5).map((row: any, i: number) => (
                                            <tr key={i}>
                                                {Object.values(row).map((val: any, j: number) => (
                                                    <td key={j}>
                                                        {Array.isArray(val)
                                                            ? val.join(", ")
                                                            : val}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            ))}
        </div>
    );
};

export default Step2;