import { useEffect, useState } from "react";
import {
    Modal,
    Button,
    Form,
    Badge,
    Row,
    Col,
    Card,
} from "react-bootstrap";
import { InternshipType } from "./InternshipManagement";
import ReactQuill from 'react-quill-new'
import 'quill/dist/quill.snow.css'

interface Props {
    show: boolean;
    handleClose: () => void;
    handleSave: (data: any) => void;
    editData: InternshipType | null;
}

const InternshipModal = ({
    show,
    handleClose,
    handleSave,
    editData,
}: Props) => {
    const [formData, setFormData] = useState<any>({
        title: "",
        description: "",
        tools: [],
        difficulty: "Beginner",
        dueDate: "",
        maxStudents: 0,
        status: "Open",
        stipend: "",
        acceptanceCriteria: [""],
        links: [""],
        screenshots: [],
    });

    const [toolInput, setToolInput] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (editData) {
            setFormData({
                title: editData.title ?? "",
                description: editData.description ?? "",
                tools: editData.tools ?? [],
                difficulty: editData.difficulty ?? "Beginner",
                dueDate: editData.dueDate ?? "",
                maxStudents: editData.maxStudents ?? 0,
                status: editData.status ?? "Open",
                acceptanceCriteria:
                    editData.acceptanceCriteria && editData.acceptanceCriteria.length > 0
                        ? editData.acceptanceCriteria
                        : [""],
                links:
                    editData.links && editData.links.length > 0
                        ? editData.links
                        : [""],
                screenshots: editData.screenshots ?? [],
            });
        }
    }, [editData]);

    useEffect(() => {
        if (!show) {
            setFormData({
                title: "",
                description: "",
                tools: [],
                difficulty: "Beginner",
                dueDate: "",
                maxStudents: 0,
                status: "Open",
                acceptanceCriteria: [""],
                links: [""],
                screenshots: [],
            });
            setToolInput("");
        }
    }, [show]);

    /* =========================
       TOOL HANDLING (Manual)
    ========================== */

    const handleAddTool = () => {
        const trimmed = toolInput.trim();
        if (!trimmed) return;

        if (
            !formData.tools.some(
                (t: string) => t.toLowerCase() === trimmed.toLowerCase()
            )
        ) {
            setFormData({
                ...formData,
                tools: [...formData.tools, trimmed],
            });
        }

        setToolInput("");
    };

    const handleRemoveTool = (tool: string) => {
        setFormData({
            ...formData,
            tools: formData.tools.filter((t: string) => t !== tool),
        });
    };

    /* =========================
       ACCEPTANCE CRITERIA
    ========================== */

    const handleAddCriteria = () => {
        setFormData({
            ...formData,
            acceptanceCriteria: [...formData.acceptanceCriteria, ""],
        });
    };

    const handleRemoveCriteria = (index: number) => {
        const updated = [...formData.acceptanceCriteria];
        updated.splice(index, 1);
        setFormData({ ...formData, acceptanceCriteria: updated });
    };

    /* =========================
       LINKS
    ========================== */

    const handleAddLink = () => {
        setFormData({
            ...formData,
            links: [...formData.links, ""],
        });
    };

    const handleRemoveLink = (index: number) => {
        const updated = [...formData.links];
        updated.splice(index, 1);
        setFormData({ ...formData, links: updated });
    };

    /* =========================
       FILE UPLOAD
    ========================== */

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        setFormData({
            ...formData,
            screenshots: Array.from(e.target.files),
        });
    };

    /* =========================
       SUBMIT
    ========================== */

    const handleSubmit = async () => {
        setLoading(true);
        await handleSave(formData);
        setLoading(false);
    };

    return (
        <Modal
            show={show}
            onHide={handleClose}
            fullscreen
            scrollable
            backdrop="static"
        >
            <Modal.Header closeButton>
                <Modal.Title>
                    {editData ? "Update Internship Task" : "Create Internship Task"}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <Row>
                    {/* ================= LEFT SIDE ================= */}
                    <Col lg={8}>
                        {/* Basic Info */}
                        <Card className="mb-4 shadow-sm">
                            <Card.Body>
                                <h5>Basic Information</h5>

                                <Form.Group className="mb-3">
                                    <Form.Label>Title</Form.Label>
                                    <Form.Control
                                        value={formData.title}
                                        onChange={(e) =>
                                            setFormData({ ...formData, title: e.target.value })
                                        }
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Full Description *</Form.Label>
                                    <label className="form-label">Add description</label>
                                    <ReactQuill
                                        className="pb-2 pb-sm-0"
                                        theme="snow"
                                        style={{ height: 400 }}
                                        value={formData.description}
                                        onChange={(value: any) =>
                                            setFormData({
                                                ...formData,
                                                description: value,
                                            })
                                        }
                                        id="quilltoolbar"
                                    />
                                </Form.Group>
                            </Card.Body>
                        </Card>

                        {/* Tools (Manual Input) */}
                        <Card className="mb-4 shadow-sm">
                            <Card.Body>
                                <h5>Tools Required</h5>

                                <Form.Control
                                    className="mb-3"
                                    placeholder="Type tool and press Enter (e.g., React, Python)"
                                    value={toolInput}
                                    onChange={(e) => setToolInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddTool();
                                        }
                                    }}
                                />

                                <div className="d-flex flex-wrap gap-2">
                                    {formData.tools.map((tool: string, index: number) => (
                                        <Badge
                                            key={index}
                                            bg="primary"
                                            style={{
                                                padding: "8px 14px",
                                                borderRadius: "20px",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                            }}
                                        >
                                            {tool}
                                            <span
                                                style={{
                                                    cursor: "pointer",
                                                    fontWeight: "bold",
                                                }}
                                                onClick={() => handleRemoveTool(tool)}
                                            >
                                                ✕
                                            </span>
                                        </Badge>
                                    ))}
                                </div>
                            </Card.Body>
                        </Card>

                        {/* Acceptance Criteria */}
                        <Card className="mb-4 shadow-sm">
                            <Card.Body>
                                <h5>Acceptance Criteria</h5>

                                {formData.acceptanceCriteria.map(
                                    (item: string, index: number) => (
                                        <div key={index} className="d-flex mb-2 gap-2">
                                            <Form.Control
                                                placeholder={`Criteria ${index + 1}`}
                                                value={item}
                                                onChange={(e) => {
                                                    const updated = [
                                                        ...formData.acceptanceCriteria,
                                                    ];
                                                    updated[index] = e.target.value;
                                                    setFormData({
                                                        ...formData,
                                                        acceptanceCriteria: updated,
                                                    });
                                                }}
                                            />
                                            {formData.acceptanceCriteria.length > 1 && (
                                                <Button
                                                    variant="outline-danger"
                                                    size="sm"
                                                    onClick={() => handleRemoveCriteria(index)}
                                                >
                                                    ✕
                                                </Button>
                                            )}
                                        </div>
                                    )
                                )}

                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={handleAddCriteria}
                                >
                                    + Add Criteria
                                </Button>
                            </Card.Body>
                        </Card>

                        {/* Reference Links */}
                        <Card className="mb-4 shadow-sm">
                            <Card.Body>
                                <h5>Reference Links</h5>

                                {formData.links.map((link: string, index: number) => (
                                    <div key={index} className="d-flex mb-2 gap-2">
                                        <Form.Control
                                            placeholder="https://example.com"
                                            value={link}
                                            onChange={(e) => {
                                                const updated = [...formData.links];
                                                updated[index] = e.target.value;
                                                setFormData({ ...formData, links: updated });
                                            }}
                                        />
                                        {formData.links.length > 1 && (
                                            <Button
                                                variant="outline-danger"
                                                size="sm"
                                                onClick={() => handleRemoveLink(index)}
                                            >
                                                ✕
                                            </Button>
                                        )}
                                    </div>
                                ))}

                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={handleAddLink}
                                >
                                    + Add Link
                                </Button>
                            </Card.Body>
                        </Card>

                        {/* Screenshots */}
                        <Card className="mb-4 shadow-sm">
                            <Card.Body>
                                <h5>Screenshots / Attachments</h5>

                                <Form.Control
                                    type="file"
                                    multiple
                                    onChange={handleFileChange}
                                />
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* ================= RIGHT SIDE ================= */}
                    <Col lg={4}>
                        <Card className="shadow-sm sticky-top" style={{ top: "20px" }}>
                            <Card.Body>
                                <h5>Settings</h5>

                                <Form.Group className="mb-3">
                                    <Form.Label>Difficulty</Form.Label>
                                    <Form.Select
                                        value={formData.difficulty}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                difficulty: e.target.value,
                                            })
                                        }
                                    >
                                        <option>Beginner</option>
                                        <option>Intermediate</option>
                                        <option>Advanced</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Due Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                dueDate: e.target.value,
                                            })
                                        }
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Stipend Type</Form.Label>
                                    <Form.Select
                                        value={formData.stipendType}
                                        onChange={(e) =>
                                            setFormData({ ...formData, stipendType: e.target.value })
                                        }
                                    >
                                        <option value="Free">Free</option>
                                        <option value="Paid">Paid</option>
                                        <option value="Performance">Performance Based</option>
                                    </Form.Select>
                                </Form.Group>

                                {formData.stipendType === "Paid" && (
                                    <Form.Group className="mb-3">
                                        <Form.Label>Amount</Form.Label>
                                        <Form.Control
                                            type="number"
                                            placeholder="Enter amount"
                                            value={formData.stipendAmount}
                                            onChange={(e) =>
                                                setFormData({ ...formData, stipendAmount: e.target.value })
                                            }
                                        />
                                    </Form.Group>
                                )}

                                <Form.Group className="mb-3">
                                    <Form.Label>Max Students</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={formData.maxStudents}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                maxStudents: Number(e.target.value),
                                            })
                                        }
                                    />
                                </Form.Group>

                                <Form.Check
                                    type="switch"
                                    label="Open Internship"
                                    checked={formData.status === "Open"}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            status: e.target.checked ? "Open" : "Closed",
                                        })
                                    }
                                />

                                <Button
                                    variant="primary"
                                    className="w-100 mt-4"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? "Saving..." : editData ? "Update Task" : "Publish Task"}
                                </Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Modal.Body>
        </Modal>
    );
};

export default InternshipModal;