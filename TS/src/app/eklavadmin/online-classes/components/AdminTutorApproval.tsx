import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Badge } from "react-bootstrap";
import { useAuthContext } from "@/context/useAuthContext";

interface TutorProfile {
    _id: string;
    fullName: string;
    email: string;
    phoneNo: string;
    designation?: string;
    experience?: string;
    aboutMe?: string;
    skills?: string[];
    status: string;
    profileImage?: string;
}

const AdminTutorApproval = () => {
    const baseURL = import.meta.env.VITE_API_BASE_URL;
    const { user } = useAuthContext();

    const [tutors, setTutors] = useState<TutorProfile[]>([]);
    const [selectedTutor, setSelectedTutor] = useState<TutorProfile | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState<string>("");

    useEffect(() => {
        fetchTutors();
    }, []);

    const filteredTutors = React.useMemo(() => {
        return tutors.filter((tutor) => {
            const matchesStatus =
                statusFilter === "all" || tutor.status === statusFilter;

            const matchesSearch =
                tutor.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tutor.email?.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesStatus && matchesSearch;
        });
    }, [tutors, statusFilter, searchTerm]);

    const fetchTutors = async () => {
        const res = await fetch(`${baseURL}/admin/tutors`, {
            headers: { Authorization: `Bearer ${user?.token}` },
        });
        const data = await res.json();
        setTutors(data);
    };

    const updateStatus = async (id: string, status: string) => {
        const res = await fetch(`${baseURL}/admin/tutors/${id}/status`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user?.token}`,
            },
            body: JSON.stringify({ status }),
        });

        if (res.ok) {
            fetchTutors();
            setShowModal(false);
        } else {
            alert("Failed to update status");
        }
    };

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h3 className="mb-0">Tutor Approval Panel</h3>

                <div className="d-flex gap-3">
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search by name or email"
                        className="form-control"
                        style={{ width: "220px" }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />

                    {/* Status Filter */}
                    <select
                        className="form-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ width: "180px" }}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            <Table bordered hover responsive>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Designation</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTutors.map((tutor) => (
                        <tr key={tutor._id}>
                            <td>{tutor.fullName}</td>
                            <td>{tutor.email}</td>
                            <td>{tutor.designation}</td>
                            <td>
                                <Badge
                                    bg={
                                        tutor.status === "approved"
                                            ? "success"
                                            : tutor.status === "rejected"
                                                ? "danger"
                                                : "warning"
                                    }
                                >
                                    {tutor.status}
                                </Badge>
                            </td>
                            <td>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        setSelectedTutor(tutor);
                                        setShowModal(true);
                                    }}
                                >
                                    View
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* View Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Tutor Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedTutor && (
                        <>
                            <h5>{selectedTutor.fullName}</h5>
                            <p><strong>Email:</strong> {selectedTutor.email}</p>
                            <p><strong>Phone:</strong> {selectedTutor.phoneNo}</p>
                            <p><strong>Designation:</strong> {selectedTutor.designation}</p>
                            <p><strong>Experience:</strong> {selectedTutor.experience}</p>
                            <p><strong>About:</strong> {selectedTutor.aboutMe}</p>
                            <p>
                                <strong>Skills:</strong>{" "}
                                {selectedTutor.skills?.join(", ")}
                            </p>

                            <div className="d-flex gap-3 mt-4">
                                <Button
                                    variant="success"
                                    onClick={() =>
                                        updateStatus(selectedTutor._id, "approved")
                                    }
                                >
                                    Approve
                                </Button>

                                <Button
                                    variant="danger"
                                    onClick={() =>
                                        updateStatus(selectedTutor._id, "rejected")
                                    }
                                >
                                    Reject
                                </Button>
                            </div>
                        </>
                    )}
                </Modal.Body>
            </Modal>
        </>
    );
};

export default AdminTutorApproval;