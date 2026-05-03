import React, { useState } from "react";
import { Row, Col, Form, Card, Button } from "react-bootstrap";
import ReactQuill from 'react-quill-new'
import 'quill/dist/quill.snow.css'

const roundOptions = [
  { label: "Aptitude Test", value: "MCQ" },
  { label: "Coding Round", value: "CODING" },
  { label: "Technical Interview (TR)", value: "TR" },
  { label: "HR Interview", value: "HR" },
  { label: "Group Discussion", value: "GD" },
  { label: "Case Study", value: "CASE_STUDY" },
  { label: "System Design", value: "SYSTEM_DESIGN" },
  { label: "Managerial Round", value: "MANAGERIAL" },
];

const Step1 = ({ formData, setFormData }: any) => {
  const [customRound, setCustomRound] = useState("");

  // ✅ Handle input change
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  // ✅ Select predefined rounds
  const handleRoundSelection = (e: any) => {
    const { value, checked } = e.target;

    setFormData((prev: any) => {
      let updatedRounds = [...(prev.rounds || [])];

      if (checked) {
        updatedRounds.push({
          roundName: value,
          roundType: value,
          duration: "",
          questionCount: "",
          order: updatedRounds.length + 1,
        });
      } else {
        updatedRounds = updatedRounds.filter(
          (r: any) => r.roundType !== value
        );

        // reassign order
        updatedRounds = updatedRounds.map((r: any, i: number) => ({
          ...r,
          order: i + 1,
        }));
      }

      return { ...prev, rounds: updatedRounds };
    });
  };

  // ✅ Add custom round
  const handleAddCustomRound = () => {
    if (!customRound.trim()) return;

    setFormData((prev: any) => {
      const exists = prev.rounds?.some(
        (r: any) =>
          r.roundName.toLowerCase() === customRound.toLowerCase()
      );

      if (exists) return prev;

      return {
        ...prev,
        rounds: [
          ...(prev.rounds || []),
          {
            roundName: customRound,
            roundType: "CUSTOM",
            duration: "",
            questionCount: "",
            order: (prev.rounds?.length || 0) + 1,
          },
        ],
      };
    });

    setCustomRound("");
  };

  // ✅ Update duration
  const handleRoundChange = (index: number, field: string, value: any) => {
    const updatedRounds = [...(formData?.rounds || [])]
    updatedRounds[index][field] = value
    setFormData({ ...formData, rounds: updatedRounds });
  };

  // ✅ Delete round
  const handleDeleteRound = (index: number) => {
    let updatedRounds = [...(formData?.rounds || [])];
    updatedRounds.splice(index, 1);

    updatedRounds = updatedRounds.map((r: any, i: number) => ({
      ...r,
      order: i + 1,
    }));

    setFormData({ ...formData, rounds: updatedRounds });
  };

  if (!formData) return null;

  return (
    <div>
      {/* 🔹 Company Details */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <h5>Company Details</h5>

          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Company Name</Form.Label>
                <Form.Control
                  name="companyName"
                  value={formData?.companyName || ""}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Role</Form.Label>
                <Form.Control
                  name="role"
                  value={formData?.role || ""}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>

            <Col md={6} className="mt-3">
              <Form.Group>
                <Form.Label>Package</Form.Label>
                <Form.Control
                  name="package"
                  value={formData?.package || ""}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>

            <Col md={6} className="mt-3">
              <Form.Group>
                <Form.Label>Location</Form.Label>
                <Form.Control
                  name="location"
                  value={formData?.location || ""}
                  onChange={handleChange}
                />
              </Form.Group>
            </Col>

            <Col md={12} className="mt-3">
              <Form.Group>
                <Form.Label>Description</Form.Label>
                <div className="quill-editor-wrapper">
                  <ReactQuill
                    theme="snow"
                    value={formData?.description || ""}
                    onChange={(value) =>
                      setFormData((prev: any) => ({ ...prev, description: value }))
                    }
                    placeholder="Add interview/company description..."
                    className="custom-quill"
                    modules={{
                      toolbar: [
                        [{ header: [false, 2, 3] }],
                        ['bold', 'italic', 'underline'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['link'],
                        ['clean']
                      ]
                    }}
                  />
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* 🔹 Hiring Rounds */}
      <Card className="shadow-sm">
        <Card.Body>
          <h5>Hiring Rounds</h5>

          {/* ✅ Predefined */}
          <Row>
            {roundOptions.map((round, index) => (
              <Col md={3} key={index}>
                <Form.Check
                  type="checkbox"
                  label={round.label}
                  value={round.value}
                  onChange={handleRoundSelection}
                  checked={
                    formData?.rounds?.some(
                      (r: any) => r.roundType === round.value
                    ) || false
                  }
                />
              </Col>
            ))}
          </Row>

          {/* ✅ Custom Round */}
          <Row className="mt-3">
            <Col md={8}>
              <Form.Control
                placeholder="Add custom round (e.g. Machine Test)"
                value={customRound}
                onChange={(e) => setCustomRound(e.target.value)}
              />
            </Col>
            <Col md={4}>
              <Button
                className="w-100"
                onClick={handleAddCustomRound}
              >
                + Add Round
              </Button>
            </Col>
          </Row>

          {/* ✅ Selected Rounds */}
          {formData?.rounds?.length > 0 && (
            <div className="mt-4">
              <h6>Configure Rounds</h6>

              {formData.rounds.map((round: any, index: number) => (
                <Row key={index} className="align-items-center mb-2">
                  <Col md={3}>
                    <Form.Control
                      value={`${round.order}. ${round.roundName}`}
                      disabled
                    />
                  </Col>

                  <Col md={3}>
                    <Form.Control
                      type="number"
                      placeholder="Duration (mins)"
                      value={round.duration}
                      onChange={(e) =>
                        handleRoundChange(index, 'duration', e.target.value)
                      }
                    />
                  </Col>

                  <Col md={3}>
                    <Form.Control
                      type="number"
                      placeholder="No. of Questions"
                      value={round.questionCount}
                      onChange={(e) =>
                        handleRoundChange(index, 'questionCount', e.target.value)
                      }
                    />
                  </Col>

                  <Col md={3}>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteRound(index)}
                    >
                      Delete
                    </Button>
                  </Col>
                </Row>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      <style>{`
        .quill-editor-wrapper {
          border: 1px solid #2c2c2c;
          border-radius: 0.375rem;
          overflow: hidden;
          background: #000000;
        }

        .custom-quill .ql-toolbar {
          border: none;
          border-bottom: 1px solid #2c2c2c;
          background: #1a1a1a;
        }

        .custom-quill .ql-container {
          border: none;
          min-height: 180px;
          background: #000000;
        }

        .custom-quill .ql-editor {
          min-height: 150px;
          color: #ffffff;
        }

        .custom-quill .ql-editor.ql-blank::before {
          color: #6c757d;
        }

        .custom-quill .ql-stroke {
          stroke: #e5e5e5;
        }

        .custom-quill .ql-fill {
          fill: #e5e5e5;
        }

        .custom-quill .ql-picker {
          color: #e5e5e5;
        }

        .custom-quill .ql-picker-options {
          background: #1a1a1a;
          border-color: #2c2c2c;
        }

        .custom-quill .ql-toolbar button:hover .ql-stroke {
          stroke: #ff7a00;
        }

        .custom-quill .ql-toolbar button:hover .ql-fill {
          fill: #ff7a00;
        }

        .custom-quill .ql-toolbar .ql-active .ql-stroke {
          stroke: #ff7a00;
        }

        .custom-quill .ql-toolbar .ql-active .ql-fill {
          fill: #ff7a00;
        }
      `}</style>
    </div>
  );
};

export default Step1;