import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Badge, Card, Row, Col, Form, InputGroup, Alert, Spinner } from "react-bootstrap";
import { 
  BsSearch, BsFilter, BsCheckCircle, BsXCircle, BsClock, 
  BsEye, BsPerson, BsEnvelope, BsTelephone, BsBriefcase, 
  BsBookmark, BsInfoCircle, BsArrowLeft, BsArrowRight,
  BsGrid, BsList, BsFileText, BsAward
} from "react-icons/bs";
import { FaChalkboardTeacher, FaStar } from "react-icons/fa";
import { useAuthContext } from "@/context/useAuthContext";

interface TutorProfile {
    _id: string;
    fullName: string;
    email: string;
    phoneNo: string;
    designation?: string;
    experience?: string;
    aboutMe?: string;
    skills?: string[] | string;
    status: string;
    profileImage?: string;
    resume?: string;
    createdAt?: string;
    updatedAt?: string;
    college?: string;
    department?: string;
    joiningYear?: string;
    education?: string[];
    certifications?: string[];
}

type ViewMode = 'table' | 'cards';

const AdminTutorApproval = () => {
    const baseURL = import.meta.env.VITE_API_BASE_URL;
    const { user } = useAuthContext();

    const [tutors, setTutors] = useState<TutorProfile[]>([]);
    const [selectedTutor, setSelectedTutor] = useState<TutorProfile | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>("pending");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>('table');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchTutors();
    }, []);

    // Helper function to parse skills (handle both array and string)
    const parseSkills = (skills: string[] | string | undefined): string[] => {
        if (!skills) return [];
        if (Array.isArray(skills)) return skills;
        // If it's a string, split by comma and clean up
        return skills.split(',').map(s => s.trim()).filter(s => s);
    };

    const filteredTutors = React.useMemo(() => {
        let filtered = tutors.filter((tutor) => {
            const matchesStatus =
                statusFilter === "all" || tutor.status === statusFilter;

            const matchesSearch =
                tutor.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tutor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tutor.phoneNo?.includes(searchTerm);

            return matchesStatus && matchesSearch;
        });

        // Sort by status priority: pending first, then approved, then rejected
        filtered.sort((a, b) => {
            const statusOrder = { pending: 0, approved: 1, rejected: 2 };
            return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
        });

        return filtered;
    }, [tutors, statusFilter, searchTerm]);

    // Pagination
    const totalPages = Math.ceil(filteredTutors.length / itemsPerPage);
    const paginatedTutors = filteredTutors.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const fetchTutors = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch(`${baseURL}/admin/tutors`, {
                headers: { Authorization: `Bearer ${user?.token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch tutors');
            const data = await res.json();
            setTutors(data);
        } catch (err) {
            setError('Failed to load tutors. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            const res = await fetch(`${baseURL}/admin/tutors/${id}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${user?.token}`,
                },
                body: JSON.stringify({ status }),
            });

            if (res.ok) {
                await fetchTutors();
                setShowModal(false);
                setSuccessMessage(`Tutor ${status === 'approved' ? 'approved' : 'rejected'} successfully`);
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                throw new Error('Failed to update status');
            }
        } catch (err) {
            setError('Failed to update tutor status');
            setTimeout(() => setError(null), 3000);
        }
    };

    const getStatusBadge = (status: string) => {
        const config = {
            approved: { bg: 'success', icon: <BsCheckCircle size={12} className="me-1" />, label: 'Approved' },
            rejected: { bg: 'danger', icon: <BsXCircle size={12} className="me-1" />, label: 'Rejected' },
            pending: { bg: 'warning', icon: <BsClock size={12} className="me-1" />, label: 'Pending' }
        };
        const { bg, icon, label } = config[status as keyof typeof config] || config.pending;
        return <Badge bg={bg} className="px-2 py-1 d-inline-flex align-items-center">{icon}{label}</Badge>;
    };

    const getImageUrl = (path?: string) => {
        if (!path) return undefined;
        if (path.startsWith('http')) return path;
        return `${baseURL}${path}`;
    };

    const getStats = () => {
        return {
            total: tutors.length,
            pending: tutors.filter(t => t.status === 'pending').length,
            approved: tutors.filter(t => t.status === 'approved').length,
            rejected: tutors.filter(t => t.status === 'rejected').length
        };
    };

    const stats = getStats();

    return (
        <div className="admin-tutor-approval">
            {/* Header Section */}
            <Card className="bg-dark border-secondary mb-4">
                <Card.Body>
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div>
                            <h3 className="text-white mb-1">Tutor Approval Panel</h3>
                            <p className="text-muted mb-0">Manage and approve tutor applications</p>
                        </div>
                        <div className="d-flex gap-2">
                            <Button 
                                variant={viewMode === 'table' ? 'orange' : 'outline-secondary'}
                                size="sm"
                                onClick={() => setViewMode('table')}
                            >
                                <BsList className="me-1" /> Table
                            </Button>
                            <Button 
                                variant={viewMode === 'cards' ? 'orange' : 'outline-secondary'}
                                size="sm"
                                onClick={() => setViewMode('cards')}
                            >
                                <BsGrid className="me-1" /> Cards
                            </Button>
                        </div>
                    </div>
                </Card.Body>
            </Card>

            {/* Stats Cards */}
            <Row className="g-3 mb-4">
                <Col xs={6} md={3}>
                    <Card className="stat-card bg-dark-lighter border-secondary h-100">
                        <Card.Body className="d-flex align-items-center justify-content-between">
                            <div>
                                <h6 className="text-muted mb-1">Total Applications</h6>
                                <h2 className="text-white mb-0">{stats.total}</h2>
                            </div>
                            <div className="stat-icon bg-info">
                                <FaChalkboardTeacher size={24} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="stat-card bg-dark-lighter border-secondary h-100">
                        <Card.Body className="d-flex align-items-center justify-content-between">
                            <div>
                                <h6 className="text-muted mb-1">Pending Review</h6>
                                <h2 className="text-warning mb-0">{stats.pending}</h2>
                            </div>
                            <div className="stat-icon bg-warning">
                                <BsClock size={24} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="stat-card bg-dark-lighter border-secondary h-100">
                        <Card.Body className="d-flex align-items-center justify-content-between">
                            <div>
                                <h6 className="text-muted mb-1">Approved</h6>
                                <h2 className="text-success mb-0">{stats.approved}</h2>
                            </div>
                            <div className="stat-icon bg-success">
                                <BsCheckCircle size={24} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={6} md={3}>
                    <Card className="stat-card bg-dark-lighter border-secondary h-100">
                        <Card.Body className="d-flex align-items-center justify-content-between">
                            <div>
                                <h6 className="text-muted mb-1">Rejected</h6>
                                <h2 className="text-danger mb-0">{stats.rejected}</h2>
                            </div>
                            <div className="stat-icon bg-danger">
                                <BsXCircle size={24} />
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Filters */}
            <Card className="bg-dark border-secondary mb-4">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={6}>
                            <InputGroup>
                                <InputGroup.Text className="bg-dark-lighter border-secondary">
                                    <BsSearch />
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Search by name, email or phone..."
                                    className="bg-dark-lighter border-secondary text-white"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                />
                            </InputGroup>
                        </Col>
                        <Col md={6}>
                            <InputGroup>
                                <InputGroup.Text className="bg-dark-lighter border-secondary">
                                    <BsFilter />
                                </InputGroup.Text>
                                <Form.Select
                                    className="bg-dark-lighter border-secondary text-white"
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <option value="all">All Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </Form.Select>
                            </InputGroup>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {/* Success/Error Messages */}
            {successMessage && (
                <Alert variant="success" className="custom-alert" onClose={() => setSuccessMessage(null)} dismissible>
                    <BsCheckCircle className="me-2" /> {successMessage}
                </Alert>
            )}
            {error && (
                <Alert variant="danger" className="custom-alert" onClose={() => setError(null)} dismissible>
                    <BsXCircle className="me-2" /> {error}
                </Alert>
            )}

            {/* Main Content */}
            {isLoading ? (
                <div className="text-center py-5">
                    <Spinner animation="border" variant="orange" />
                    <p className="text-muted mt-2">Loading tutors...</p>
                </div>
            ) : filteredTutors.length === 0 ? (
                <Card className="bg-dark border-secondary text-center py-5">
                    <Card.Body>
                        <FaChalkboardTeacher size={48} className="text-muted mb-3" />
                        <h5 className="text-white">No tutors found</h5>
                        <p className="text-muted">Try adjusting your search or filter criteria</p>
                    </Card.Body>
                </Card>
            ) : viewMode === 'table' ? (
                <>
                    <div className="table-responsive">
                        <Table bordered hover className="custom-table mb-0">
                            <thead>
                                <tr>
                                    <th style={{ minWidth: '180px' }}>Name</th>
                                    <th style={{ minWidth: '200px' }}>Contact</th>
                                    <th style={{ minWidth: '150px' }}>Designation</th>
                                    <th style={{ minWidth: '200px' }}>Skills</th>
                                    <th style={{ width: '100px' }}>Status</th>
                                    <th style={{ width: '100px' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedTutors.map((tutor) => {
                                    const skillsArray = parseSkills(tutor.skills);
                                    return (
                                        <tr key={tutor._id}>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="tutor-avatar flex-shrink-0">
                                                        {tutor.profileImage ? (
                                                            <img 
                                                                src={getImageUrl(tutor.profileImage)} 
                                                                alt={tutor.fullName} 
                                                                width={32} 
                                                                height={32} 
                                                                className="rounded-circle object-fit-cover"
                                                                style={{ objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            <BsPerson size={20} />
                                                        )}
                                                    </div>
                                                    <div className="min-width-0">
                                                        <div className="fw-semibold text-white">{tutor.fullName}</div>
                                                        <small className="text-muted">ID: {tutor._id.slice(-6)}</small>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="small">
                                                    <div className="text-truncate" style={{ maxWidth: '180px' }}>{tutor.email}</div>
                                                    <div className="text-muted">{tutor.phoneNo}</div>
                                                </div>
                                            </td>
                                            <td className="text-white">{tutor.designation || '—'}</td>
                                            <td>
                                                <div className="d-flex flex-wrap gap-1">
                                                    {skillsArray.slice(0, 2).map((skill, idx) => (
                                                        <Badge key={idx} bg="secondary" className="skill-badge">{skill}</Badge>
                                                    ))}
                                                    {skillsArray.length > 2 && (
                                                        <Badge bg="secondary">+{skillsArray.length - 2}</Badge>
                                                    )}
                                                    {skillsArray.length === 0 && <span className="text-muted">—</span>}
                                                </div>
                                            </td>
                                            <td>{getStatusBadge(tutor.status)}</td>
                                            <td>
                                                <Button
                                                    size="sm"
                                                    variant="outline-orange"
                                                    onClick={() => {
                                                        setSelectedTutor(tutor);
                                                        setShowModal(true);
                                                    }}
                                                >
                                                    <BsEye className="me-1" /> View
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 mt-4">
                            <div className="text-muted small">
                                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTutors.length)} of {filteredTutors.length} tutors
                            </div>
                            <div className="d-flex gap-2">
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <BsArrowLeft className="me-1" /> Previous
                                </Button>
                                <span className="text-white px-3 py-1">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline-secondary"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next <BsArrowRight className="ms-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                // Cards View
                <Row className="g-3">
                    {paginatedTutors.map((tutor) => {
                        const skillsArray = parseSkills(tutor.skills);
                        return (
                            <Col xs={12} md={6} lg={4} key={tutor._id}>
                                <Card className="tutor-card bg-dark border-secondary h-100">
                                    <Card.Body>
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="tutor-avatar-lg flex-shrink-0">
                                                    {tutor.profileImage ? (
                                                        <img 
                                                            src={getImageUrl(tutor.profileImage)} 
                                                            alt={tutor.fullName} 
                                                            width={48} 
                                                            height={48} 
                                                            className="rounded-circle object-fit-cover"
                                                            style={{ objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <BsPerson size={30} />
                                                    )}
                                                </div>
                                                <div className="min-width-0">
                                                    <h6 className="text-white mb-0 text-truncate" style={{ maxWidth: '150px' }}>{tutor.fullName}</h6>
                                                    <small className="text-muted text-truncate d-block" style={{ maxWidth: '150px' }}>
                                                        {tutor.designation || 'Tutor'}
                                                    </small>
                                                </div>
                                            </div>
                                            {getStatusBadge(tutor.status)}
                                        </div>
                                        
                                        <div className="tutor-info mb-2">
                                            <BsEnvelope size={12} className="text-muted me-2 flex-shrink-0" />
                                            <small className="text-truncate">{tutor.email}</small>
                                        </div>
                                        <div className="tutor-info mb-2">
                                            <BsTelephone size={12} className="text-muted me-2" />
                                            <small>{tutor.phoneNo}</small>
                                        </div>
                                        {tutor.experience && (
                                            <div className="tutor-info mb-2">
                                                <BsBriefcase size={12} className="text-muted me-2" />
                                                <small>{tutor.experience} years experience</small>
                                            </div>
                                        )}
                                        <div className="tutor-info mb-3">
                                            <BsBookmark size={12} className="text-muted me-2 flex-shrink-0" />
                                            <small className="text-truncate">
                                                {skillsArray.length > 0 
                                                    ? skillsArray.slice(0, 3).join(', ')
                                                    : 'No skills listed'}
                                                {skillsArray.length > 3 && '...'}
                                            </small>
                                        </div>
                                        
                                        <Button
                                            variant="outline-orange"
                                            size="sm"
                                            className="w-100"
                                            onClick={() => {
                                                setSelectedTutor(tutor);
                                                setShowModal(true);
                                            }}
                                        >
                                            <BsEye className="me-1" /> View Full Details
                                        </Button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            )}

            {/* View Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered scrollable>
                <Modal.Header closeButton className="bg-dark border-secondary">
                    <Modal.Title className="text-white">Tutor Application Details</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-dark text-white">
                    {selectedTutor && (
                        <>
                            <div className="text-center mb-4">
                                <div className="tutor-avatar-xl mx-auto mb-3">
                                    {selectedTutor.profileImage ? (
                                        <img 
                                            src={getImageUrl(selectedTutor.profileImage)} 
                                            alt={selectedTutor.fullName} 
                                            width={80} 
                                            height={80} 
                                            className="rounded-circle object-fit-cover"
                                            style={{ objectFit: 'cover' }}
                                        />
                                    ) : (
                                        <FaChalkboardTeacher size={50} />
                                    )}
                                </div>
                                <h4>{selectedTutor.fullName}</h4>
                                {getStatusBadge(selectedTutor.status)}
                            </div>

                            <Row className="g-3">
                                <Col md={6}>
                                    <div className="info-section">
                                        <BsEnvelope className="text-orange me-2" />
                                        <strong>Email:</strong>
                                        <p className="text-muted mb-0 mt-1 word-break">{selectedTutor.email}</p>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="info-section">
                                        <BsTelephone className="text-orange me-2" />
                                        <strong>Phone:</strong>
                                        <p className="text-muted mb-0 mt-1">{selectedTutor.phoneNo}</p>
                                    </div>
                                </Col>
                                {selectedTutor.college && (
                                    <Col md={6}>
                                        <div className="info-section">
                                            <FaStar className="text-orange me-2" />
                                            <strong>College:</strong>
                                            <p className="text-muted mb-0 mt-1">{selectedTutor.college}</p>
                                        </div>
                                    </Col>
                                )}
                                {selectedTutor.department && (
                                    <Col md={6}>
                                        <div className="info-section">
                                            <BsBriefcase className="text-orange me-2" />
                                            <strong>Department:</strong>
                                            <p className="text-muted mb-0 mt-1">{selectedTutor.department}</p>
                                        </div>
                                    </Col>
                                )}
                                <Col md={6}>
                                    <div className="info-section">
                                        <BsBriefcase className="text-orange me-2" />
                                        <strong>Designation:</strong>
                                        <p className="text-muted mb-0 mt-1">{selectedTutor.designation || 'Not specified'}</p>
                                    </div>
                                </Col>
                                <Col md={6}>
                                    <div className="info-section">
                                        <FaStar className="text-orange me-2" />
                                        <strong>Experience:</strong>
                                        <p className="text-muted mb-0 mt-1">{selectedTutor.experience || 'Not specified'}</p>
                                    </div>
                                </Col>
                                {selectedTutor.education && selectedTutor.education.length > 0 && (
                                    <Col xs={12}>
                                        <div className="info-section">
                                            <BsAward className="text-orange me-2" />
                                            <strong>Education:</strong>
                                            <div className="mt-1">
                                                {selectedTutor.education.map((edu, idx) => (
                                                    <Badge key={idx} bg="info" className="me-2 mb-2">{edu}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </Col>
                                )}
                                <Col xs={12}>
                                    <div className="info-section">
                                        <BsInfoCircle className="text-orange me-2" />
                                        <strong>About Me:</strong>
                                        <p className="text-muted mb-0 mt-1" style={{ whiteSpace: 'pre-wrap' }}>
                                            {selectedTutor.aboutMe || 'No description provided'}
                                        </p>
                                    </div>
                                </Col>
                                <Col xs={12}>
                                    <div className="info-section">
                                        <BsBookmark className="text-orange me-2" />
                                        <strong>Skills:</strong>
                                        <div className="mt-2 d-flex flex-wrap gap-2">
                                            {parseSkills(selectedTutor.skills).map((skill, idx) => (
                                                <Badge key={idx} bg="secondary" className="px-3 py-2">
                                                    {skill}
                                                </Badge>
                                            ))}
                                            {parseSkills(selectedTutor.skills).length === 0 && (
                                                <span className="text-muted">No skills listed</span>
                                            )}
                                        </div>
                                    </div>
                                </Col>
                                {selectedTutor.resume && (
                                    <Col xs={12}>
                                        <div className="info-section">
                                            <BsFileText className="text-orange me-2" />
                                            <strong>Resume:</strong>
                                            <div className="mt-2">
                                                <Button 
                                                    variant="outline-orange" 
                                                    size="sm"
                                                    onClick={() => {
                                                        const resumeUrl = getImageUrl(selectedTutor.resume);
                                                        if (resumeUrl) window.open(resumeUrl, '_blank');
                                                    }}
                                                >
                                                    <BsFileText className="me-1" /> View Resume
                                                </Button>
                                            </div>
                                        </div>
                                    </Col>
                                )}
                            </Row>

                            {selectedTutor.status === 'pending' && (
                                <div className="d-flex gap-3 mt-4 pt-3 border-top border-secondary">
                                    <Button
                                        variant="success"
                                        className="flex-grow-1"
                                        onClick={() => updateStatus(selectedTutor._id, "approved")}
                                    >
                                        <BsCheckCircle className="me-2" /> Approve Application
                                    </Button>
                                    <Button
                                        variant="danger"
                                        className="flex-grow-1"
                                        onClick={() => updateStatus(selectedTutor._id, "rejected")}
                                    >
                                        <BsXCircle className="me-2" /> Reject Application
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </Modal.Body>
            </Modal>

            {/* Global Styles */}
            <style>{`
                .admin-tutor-approval { padding: 0; }
                
                .bg-dark-lighter { background-color: #2a2a2a; }
                .text-orange { color: #ff8c00; }
                
                .min-width-0 { min-width: 0; }
                .word-break { word-break: break-all; }
                .object-fit-cover { object-fit: cover; }
                
                .stat-card { 
                    transition: transform 0.2s, box-shadow 0.2s; 
                    cursor: pointer;
                }
                .stat-card:hover { 
                    transform: translateY(-4px); 
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3); 
                }
                
                .stat-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                }
                
                .custom-table {
                    background: #2a2a2a;
                    color: #e0e0e0;
                }
                .custom-table thead th {
                    background: #1a1a1a;
                    border-color: #3a3a3a;
                    color: #ff8c00;
                    font-weight: 600;
                }
                .custom-table tbody td {
                    border-color: #3a3a3a;
                    vertical-align: middle;
                }
                .custom-table tbody tr:hover {
                    background: rgba(255, 140, 0, 0.1);
                }
                
                .table-responsive {
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }
                
                .tutor-avatar {
                    width: 32px;
                    height: 32px;
                    background: rgba(255, 140, 0, 0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ff8c00;
                    overflow: hidden;
                }
                
                .tutor-avatar-lg {
                    width: 48px;
                    height: 48px;
                    background: rgba(255, 140, 0, 0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ff8c00;
                    overflow: hidden;
                }
                
                .tutor-avatar-xl {
                    width: 80px;
                    height: 80px;
                    background: rgba(255, 140, 0, 0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #ff8c00;
                    overflow: hidden;
                }
                
                .tutor-card {
                    transition: transform 0.2s, box-shadow 0.2s;
                    height: 100%;
                }
                .tutor-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
                }
                
                .tutor-info {
                    display: flex;
                    align-items: center;
                    font-size: 0.875rem;
                }
                
                .skill-badge {
                    font-size: 0.7rem;
                    padding: 0.25rem 0.5rem;
                }
                
                .info-section {
                    background: #1a1a1a;
                    padding: 0.75rem;
                    border-radius: 8px;
                    margin-bottom: 0.5rem;
                }
                
                .custom-alert { 
                    border-radius: 12px; 
                    border: none; 
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1050;
                    min-width: 300px;
                    animation: slideIn 0.3s ease-out;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                .btn-orange {
                    background-color: #ff8c00;
                    border-color: #ff8c00;
                    color: white;
                }
                .btn-orange:hover { 
                    background-color: #e67e00; 
                    border-color: #e67e00; 
                    color: white;
                }
                
                .btn-outline-orange {
                    border-color: #ff8c00;
                    color: #ff8c00;
                }
                .btn-outline-orange:hover {
                    background-color: #ff8c00;
                    color: white;
                }
                
                .form-control:focus, .form-select:focus {
                    border-color: #ff8c00;
                    box-shadow: 0 0 0 0.2rem rgba(255, 140, 0, 0.25);
                }
                
                /* Scrollbar Styling */
                .table-responsive::-webkit-scrollbar {
                    height: 8px;
                }
                .table-responsive::-webkit-scrollbar-track {
                    background: #2a2a2a;
                    border-radius: 4px;
                }
                .table-responsive::-webkit-scrollbar-thumb {
                    background: #ff8c00;
                    border-radius: 4px;
                }
                .table-responsive::-webkit-scrollbar-thumb:hover {
                    background: #e67e00;
                }
                
                /* Modal scrollbar */
                .modal-body::-webkit-scrollbar {
                    width: 6px;
                }
                .modal-body::-webkit-scrollbar-track {
                    background: #2a2a2a;
                }
                .modal-body::-webkit-scrollbar-thumb {
                    background: #ff8c00;
                    border-radius: 3px;
                }
                
                @media (max-width: 768px) {
                    .custom-alert {
                        left: 20px;
                        right: 20px;
                        min-width: auto;
                    }
                }
            `}</style>
        </div>
    );
};

export default AdminTutorApproval;