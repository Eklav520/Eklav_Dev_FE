import React, { useState } from 'react';
import {
    Modal,
    Button,
    Form,
    Alert,
    Spinner,
    Table,
    Badge,
    Pagination
} from 'react-bootstrap';
import axios from 'axios';
import { FaUpload, FaDownload, FaFileExcel, FaUsers, FaEye, FaFileDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { useAuthContext } from '@/context/useAuthContext';

interface BulkUploadResult {
    name: string;
    email: string;
    phone?: string;
    userId?: string;
    error?: string;
}

interface BulkUploadSummary {
    total: number;
    successful: number;
    failed: number;
}

interface BulkUploadResponse {
    success: boolean;
    message: string;
    results: {
        successful: BulkUploadResult[];
        failed: BulkUploadResult[];
    };
    summary: BulkUploadSummary;
}

interface BulkUploadStudentsProps {
    show: boolean;
    onHide: () => void;
    onSuccess?: () => void;
}

const BulkUploadStudents: React.FC<BulkUploadStudentsProps> = ({ show, onHide, onSuccess }) => {
    const [studentsData, setStudentsData] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<BulkUploadResponse | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    
    // Pagination states for failed records
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage] = useState(10);

    const { user } = useAuthContext()
    const token = user?.token
    const baseURL = import.meta.env.VITE_API_BASE_URL

    // Handle file upload
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset states
        setError(null);
        setSuccess(null);
        
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('File size should be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                // Validate required columns
                const requiredColumns = ['name', 'email', 'password'];
                const firstRow = jsonData[0] as any;
                const missingColumns = requiredColumns.filter(col => !(col in firstRow));

                if (missingColumns.length > 0) {
                    setError(`Missing required columns: ${missingColumns.join(', ')}`);
                    return;
                }

                // Check for duplicate emails in the file
                const emails = jsonData.map((row: any) => row.email.toLowerCase());
                const duplicateEmails = emails.filter((email: string, index: number) => emails.indexOf(email) !== index);
                
                if (duplicateEmails.length > 0) {
                    setError(`Duplicate emails found in file: ${[...new Set(duplicateEmails)].join(', ')}`);
                    return;
                }

                setStudentsData(jsonData);
                setPreviewData(jsonData.slice(0, 5));
                setError(null);
            } catch (err) {
                setError('Failed to parse file. Please check the format.');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    // Download template
    const downloadTemplate = () => {
        const template = [
            { name: 'John Doe', email: 'john@example.com', phone: '1234567890', password: 'password123' },
            { name: 'Jane Smith', email: 'jane@example.com', phone: '0987654321', password: 'password123' }
        ];

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Students');
        XLSX.writeFile(wb, 'student_bulk_upload_template.xlsx');
    };

    // Download failed records as Excel
    const downloadFailedRecords = () => {
        if (!success?.results.failed.length) return;
        
        const failedData = success.results.failed.map(record => ({
            'Name': record.name,
            'Email': record.email,
            'Phone': record.phone || 'N/A',
            'Error': record.error
        }));
        
        const ws = XLSX.utils.json_to_sheet(failedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Failed Records');
        XLSX.writeFile(wb, `failed_records_${new Date().getTime()}.xlsx`);
    };

    // Download successful records as Excel
    const downloadSuccessfulRecords = () => {
        if (!success?.results.successful.length) return;
        
        const successData = success.results.successful.map(record => ({
            'Name': record.name,
            'Email': record.email,
            'Phone': record.phone || 'N/A',
            'User ID': record.userId
        }));
        
        const ws = XLSX.utils.json_to_sheet(successData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Successful Records');
        XLSX.writeFile(wb, `successful_records_${new Date().getTime()}.xlsx`);
    };

    // Handle bulk upload
    const handleBulkUpload = async () => {
        if (studentsData.length === 0) {
            setError('Please upload a file with student data');
            return;
        }

        if (studentsData.length > 1000) {
            setError('Maximum 1000 students can be uploaded at once. Please split your file.');
            return;
        }

        try {
            setUploading(true);
            setError(null);

            const response = await axios.post<BulkUploadResponse>(
                `${baseURL}/api/institute/bulkUploadStudents`,
                {
                    students: studentsData
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setSuccess(response.data);
            setCurrentPage(1); // Reset pagination

            if (response.data.summary.successful > 0 && onSuccess) {
                onSuccess();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to upload students');
        } finally {
            setUploading(false);
        }
    };

    // Pagination logic for failed records
    const getPaginatedFailedRecords = () => {
        if (!success?.results.failed) return [];
        const startIndex = (currentPage - 1) * recordsPerPage;
        const endIndex = startIndex + recordsPerPage;
        return success.results.failed.slice(startIndex, endIndex);
    };

    const totalPages = Math.ceil((success?.results.failed.length || 0) / recordsPerPage);

    const resetForm = () => {
        setStudentsData([]);
        setPreviewData([]);
        setError(null);
        setSuccess(null);
        setCurrentPage(1);
    };

    const handleClose = () => {
        resetForm();
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg" className="bulk-upload-modal" centered>
            <Modal.Header closeButton className="modal-header-custom">
                <Modal.Title>
                    <FaUpload className="modal-icon" />
                    Bulk Students Upload
                </Modal.Title>
            </Modal.Header>

            <Modal.Body className="modal-body-custom">
                {error && (
                    <Alert variant="danger" className="custom-alert">
                        <Alert.Heading>Error!</Alert.Heading>
                        <p>{error}</p>
                    </Alert>
                )}

                {success && (
                    <div>
                        <Alert variant="success" className="custom-alert success-alert">
                            <Alert.Heading>Upload Complete!</Alert.Heading>
                            <p>{success.message}</p>
                            <hr />
                            <div className="summary-stats">
                                <div className="stat-item">
                                    <FaUsers className="me-2" />
                                    <strong>Total:</strong> {success.summary.total}
                                </div>
                                <div className="stat-item text-success">
                                    <strong>✓ Successful:</strong> {success.summary.successful}
                                </div>
                                <div className="stat-item text-danger">
                                    <strong>✗ Failed:</strong> {success.summary.failed}
                                </div>
                            </div>
                            
                            {/* Download buttons */}
                            <div className="download-buttons mt-3">
                                {success.results.successful.length > 0 && (
                                    <Button 
                                        size="sm" 
                                        variant="success" 
                                        onClick={downloadSuccessfulRecords}
                                        className="me-2"
                                    >
                                        <FaFileDownload className="me-1" />
                                        Download Successful ({success.results.successful.length})
                                    </Button>
                                )}
                                {success.results.failed.length > 0 && (
                                    <Button 
                                        size="sm" 
                                        variant="danger" 
                                        onClick={downloadFailedRecords}
                                    >
                                        <FaFileDownload className="me-1" />
                                        Download Failed ({success.results.failed.length})
                                    </Button>
                                )}
                            </div>
                        </Alert>

                        {/* Failed Records Table with Pagination */}
                        {success.results.failed.length > 0 && (
                            <div className="failed-records-section mt-3">
                                <h6 className="text-danger mb-3">
                                    Failed Records ({success.results.failed.length} total)
                                </h6>
                                <div className="table-responsive">
                                    <Table size="sm" className="preview-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Error</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getPaginatedFailedRecords().map((failed, idx) => (
                                                <tr key={idx}>
                                                    <td>{(currentPage - 1) * recordsPerPage + idx + 1}</td>
                                                    <td>{failed.name}</td>
                                                    <td>{failed.email}</td>
                                                    <td>{failed.phone || '-'}</td>
                                                    <td className="text-danger">{failed.error}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                                
                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="pagination-wrapper mt-3">
                                        <Pagination size="sm">
                                            <Pagination.First 
                                                onClick={() => setCurrentPage(1)} 
                                                disabled={currentPage === 1}
                                            />
                                            <Pagination.Prev 
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage === 1}
                                            />
                                            
                                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                                let pageNum;
                                                if (totalPages <= 5) {
                                                    pageNum = i + 1;
                                                } else if (currentPage <= 3) {
                                                    pageNum = i + 1;
                                                } else if (currentPage >= totalPages - 2) {
                                                    pageNum = totalPages - 4 + i;
                                                } else {
                                                    pageNum = currentPage - 2 + i;
                                                }
                                                
                                                return (
                                                    <Pagination.Item
                                                        key={pageNum}
                                                        active={pageNum === currentPage}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                    >
                                                        {pageNum}
                                                    </Pagination.Item>
                                                );
                                            })}
                                            
                                            <Pagination.Next 
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                disabled={currentPage === totalPages}
                                            />
                                            <Pagination.Last 
                                                onClick={() => setCurrentPage(totalPages)}
                                                disabled={currentPage === totalPages}
                                            />
                                        </Pagination>
                                        <span className="text-muted ms-2">
                                            Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, success.results.failed.length)} of {success.results.failed.length}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {!success && (
                    <Form>
                        <Form.Group className="mb-4">
                            <Form.Label className="form-label-custom">
                                <FaFileExcel className="label-icon" />
                                Upload Excel File
                            </Form.Label>
                            <Form.Control
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                onChange={handleFileUpload}
                                className="form-control-custom"
                            />
                            <div className="template-download mt-2">
                                <Button
                                    variant="link"
                                    onClick={downloadTemplate}
                                    className="download-template-btn"
                                >
                                    <FaDownload className="me-1" />
                                    Download Template
                                </Button>
                            </div>
                            <small className="form-text text-muted mt-2">
                                File should contain columns: name, email, phone (optional), password
                                <br />
                                <strong>Limits:</strong> Max 1000 students, Max file size 5MB
                            </small>
                        </Form.Group>

                        {previewData.length > 0 && (
                            <div className="preview-section">
                                <h6>Preview (First 5 of {studentsData.length} records)</h6>
                                <div className="table-responsive">
                                    <Table size="sm" className="preview-table">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Password</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData.map((row, idx) => (
                                                <tr key={idx}>
                                                    <td>{row.name}</td>
                                                    <td>{row.email}</td>
                                                    <td>{row.phone || '-'}</td>
                                                    <td>{'•'.repeat(8)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                                <div className="upload-summary mt-2">
                                    <Badge bg="info">
                                        Total records: {studentsData.length}
                                    </Badge>
                                    {studentsData.length > 500 && (
                                        <Badge bg="warning" className="ms-2">
                                            Large file: Processing may take a moment
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )}
                    </Form>
                )}
            </Modal.Body>

            <Modal.Footer className="modal-footer-custom">
                <Button variant="secondary" onClick={handleClose} disabled={uploading}>
                    {success ? 'Close' : 'Cancel'}
                </Button>

                {!success && (
                    <Button
                        onClick={handleBulkUpload}
                        disabled={uploading || studentsData.length === 0}
                        className="upload-btn"
                    >
                        {uploading ? (
                            <>
                                <Spinner as="span" animation="border" size="sm" className="me-2" />
                                Uploading {studentsData.length} students...
                            </>
                        ) : (
                            <>
                                <FaUpload className="me-2" />
                                Upload {studentsData.length > 0 ? `${studentsData.length} Students` : 'Students'}
                            </>
                        )}
                    </Button>
                )}
            </Modal.Footer>

            <style>{`
                .bulk-upload-modal .modal-content {
                    background: #0a0a0a;
                    border: 1px solid #ff7a00;
                    border-radius: 16px;
                }

                .modal-header-custom {
                    border-bottom: 1px solid #1f1f1f;
                    padding: 1.25rem 1.5rem;
                }

                .modal-header-custom .modal-title {
                    color: #ff7a00;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .modal-icon {
                    font-size: 1.25rem;
                }

                .modal-body-custom {
                    padding: 1.5rem;
                    max-height: 65vh;
                    overflow-y: auto;
                }

                .form-label-custom {
                    color: #ff7a00;
                    font-weight: 500;
                    margin-bottom: 0.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .label-icon {
                    font-size: 0.9rem;
                }

                .form-control-custom {
                    background: #000000;
                    border: 1px solid #2c2c2c;
                    color: #ffffff;
                    padding: 0.75rem;
                    border-radius: 8px;
                }

                .form-control-custom:focus {
                    background: #141414;
                    border-color: #ff7a00;
                    box-shadow: 0 0 0 0.2rem rgba(255, 122, 0, 0.25);
                    color: #ffffff;
                }

                .template-download {
                    text-align: right;
                }

                .download-template-btn {
                    color: #ff7a00;
                    text-decoration: none;
                    padding: 0;
                }

                .download-template-btn:hover {
                    color: #ff944d;
                }

                .preview-section {
                    margin-top: 1.5rem;
                    padding: 1rem;
                    background: #000000;
                    border-radius: 8px;
                    border: 1px solid #1f1f1f;
                }

                .preview-section h6 {
                    color: #ff7a00;
                    margin-bottom: 1rem;
                }

                .preview-table {
                    background: #0a0a0a;
                    color: #e5e5e5;
                }

                .preview-table thead th {
                    background: #000000;
                    color: #ff7a00;
                    border-bottom: 1px solid #ff7a00;
                }

                .upload-summary {
                    text-align: right;
                }

                .custom-alert {
                    background: rgba(220, 53, 69, 0.1);
                    border: 1px solid #dc3545;
                    color: #ff6b6b;
                }

                .success-alert {
                    background: rgba(40, 167, 69, 0.1);
                    border-color: #28a745;
                    color: #28a745;
                }

                .summary-stats {
                    display: flex;
                    gap: 1rem;
                    flex-wrap: wrap;
                }

                .stat-item {
                    padding: 0.5rem;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                }

                .download-buttons {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }

                .failed-records-section {
                    padding: 1rem;
                    background: rgba(220, 53, 69, 0.05);
                    border-radius: 8px;
                    border: 1px solid rgba(220, 53, 69, 0.3);
                }

                .pagination-wrapper {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 1rem;
                }

                .pagination-wrapper .pagination {
                    margin-bottom: 0;
                }

                .modal-footer-custom {
                    border-top: 1px solid #1f1f1f;
                    padding: 1rem 1.5rem;
                }

                .upload-btn {
                    background: linear-gradient(135deg, #ff7a00 0%, #ff944d 100%);
                    border: none;
                    padding: 0.625rem 1.5rem;
                    border-radius: 8px;
                    color: #000000;
                    font-weight: 600;
                }

                .upload-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(255, 122, 0, 0.4);
                }

                .upload-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                @media (max-width: 768px) {
                    .pagination-wrapper {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                }
            `}</style>
        </Modal>
    );
};

export default BulkUploadStudents;