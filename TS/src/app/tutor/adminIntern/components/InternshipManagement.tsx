import { useEffect, useState } from "react";
import {
    Button,
    Card,
    Col,
    Container,
    Form,
    Row,
    Table,
    Badge,
} from "react-bootstrap";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import axios from "axios";
import { useAuthContext } from "@/context/useAuthContext";
import InternshipModal from "./InternshipModal";

export interface InternshipType {
    _id?: string;
    title: string;
    description: string;
    tools: string[];
    difficulty: string;
    dueDate: string;
    maxStudents: number;
    status: string;
    stipend: string;
    acceptanceCriteria?: string[];
    links?: string[];
    screenshots?: File[] | string[];
}

const InternshipManagement = () => {
    const { user } = useAuthContext();
    const [internships, setInternships] = useState<InternshipType[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState<InternshipType | null>(null);

    /* ================= FETCH ALL ================= */
    const fetchInternships = async () => {
        try {
            const res = await axios.get(
                "http://localhost:3000/api/admin-internship",
                {
                    headers: {
                        Authorization: `Bearer ${user?.token}`,
                    },
                }
            );
            setInternships(res.data.internships);
        } catch (error) {
            console.error("Fetch internships error:", error);
        }
    };

    useEffect(() => {
        fetchInternships();
    }, []);

    /* ================= CREATE / UPDATE ================= */
    const handleSave = async (data: InternshipType) => {
        try {
            const form = new FormData();

            form.append("title", data.title);
            form.append("description", data.description);
            form.append("difficulty", data.difficulty);
            form.append("dueDate", data.dueDate);
            form.append("maxStudents", String(data.maxStudents));
            form.append("status", data.status);

            form.append("tools", JSON.stringify(data.tools));
            form.append(
                "acceptanceCriteria",
                JSON.stringify(data.acceptanceCriteria || [])
            );
            form.append("links", JSON.stringify(data.links || []));

            if (data.screenshots) {
                (data.screenshots as File[]).forEach((file) => {
                    form.append("screenshots", file);
                });
            }

            if (editData?._id) {
                await axios.patch(
                    `http://localhost:3000/api/admin-internship/toggle/${editData._id}`,
                    form,
                    {
                        headers: {
                            Authorization: `Bearer ${user?.token}`,
                        },
                    }
                );
            } else {
                await axios.post(
                    "http://localhost:3000/api/admin-internship",
                    form,
                    {
                        headers: {
                            Authorization: `Bearer ${user?.token}`,
                        },
                    }
                );
            }

            setShowModal(false);
            fetchInternships();
        } catch (error) {
            console.error("Save error:", error);
        }
    };

    /* ================= DELETE ================= */
    const handleDelete = async (id?: string) => {
        if (!id) return;

        if (!window.confirm("Are you sure you want to delete this internship?"))
            return;

        try {
            await axios.delete(
                `http://localhost:3000/api/admin-internship/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${user?.token}`,
                    },
                }
            );

            fetchInternships();
        } catch (error) {
            console.error("Delete error:", error);
        }
    };

    return (
        <Container fluid className="p-4">
            <div className="d-flex justify-content-between mb-4">
                <h2 className="text-white">Internship Management</h2>
                <Button onClick={() => { setEditData(null); setShowModal(true); }}>
                    <FaPlus className="me-2" />
                    Create Internship
                </Button>
            </div>

            <Card>
                <Card.Body>
                    <Table responsive hover>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Difficulty</th>
                                <th>Due Date</th>
                                <th>Status</th>
                                <th>Stipend</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {internships.map((item) => (
                                <tr key={item._id}>
                                    <td>
                                        <strong>{item.title}</strong>
                                        <div className="small text-muted">
                                            {item.tools?.join(", ")}
                                        </div>
                                    </td>

                                    <td>
                                        <Badge bg="info">{item.difficulty}</Badge>
                                    </td>

                                    <td>
                                        {item.dueDate
                                            ? new Date(item.dueDate).toLocaleDateString()
                                            : "-"}
                                    </td>

                                    <td>
                                        <Badge
                                            bg={item.status === "Open" ? "success" : "secondary"}
                                        >
                                            {item.status}
                                        </Badge>
                                    </td>
                                    <td>
                                        <Badge
                                            bg={item.stipend === "Free" ? "secondary" : "warning"}
                                            text={item.stipend === "Free" ? "light" : "dark"}
                                        >
                                            {item.stipend}
                                        </Badge>
                                    </td>

                                    <td>
                                        <FaEdit
                                            className="me-3"
                                            style={{ cursor: "pointer" }}
                                            onClick={() => {
                                                setEditData(item);
                                                setShowModal(true);
                                            }}
                                        />
                                        <FaTrash
                                            style={{ cursor: "pointer" }}
                                            onClick={() => handleDelete(item._id)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Card.Body>
            </Card>

            <InternshipModal
                show={showModal}
                handleClose={() => setShowModal(false)}
                handleSave={handleSave}
                editData={editData}
            />
        </Container>
    );
};

export default InternshipManagement;