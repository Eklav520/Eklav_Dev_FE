// components/InternshipCard.tsx

import React from "react";
import { Card, Button, Badge } from "react-bootstrap";
import { InternshipType } from "../types/internship";

interface Props {
  internship: InternshipType;
  onView: (internship: InternshipType) => void;
}

const InternshipCard: React.FC<Props> = ({ internship, onView }) => {
  const appliedCount = internship.appliedStudents?.length || 0;
  const remainingSlots =
    (internship.maxStudents || 0) - appliedCount;

  return (
    <Card
      className="shadow-sm border-0 h-100"
      style={{
        borderRadius: "14px",
        transition: "0.3s",
        cursor: "pointer",
      }}
    >
      <Card.Body className="d-flex flex-column">
        {/* Title */}
        <Card.Title className="fw-bold mb-2" style={{ fontSize: "1rem" }}>
          {internship.title}
        </Card.Title>

        {/* Tools */}
        <div className="mb-2">
          {internship.tools?.slice(0, 3).map((tool:any, index:any) => (
            <Badge
              key={index}
              bg="light"
              text="dark"
              className="me-2 mb-1"
              style={{ fontSize: "0.7rem" }}
            >
              {tool}
            </Badge>
          ))}
        </div>

        {/* Slots */}
        <div className="mb-2">
          <small className="text-muted">
            Slots:{" "}
            <span className="fw-semibold">
              {remainingSlots > 0 ? remainingSlots : 0}
            </span>{" "}
            / {internship.maxStudents}
          </small>
        </div>

        {/* Status */}
        <div className="mb-3">
          <Badge
            bg={internship.status === "Open" ? "success" : "secondary"}
          >
            {internship.status}
          </Badge>
        </div>

        {/* Button */}
        <div className="mt-auto">
          <Button
            variant={remainingSlots === 0 ? "secondary" : "primary"}
            size="sm"
            className="w-100 rounded-pill"
            disabled={remainingSlots === 0}
            onClick={() => onView(internship)}
          >
            {remainingSlots === 0 ? "Applied" : "View Details"}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default InternshipCard;