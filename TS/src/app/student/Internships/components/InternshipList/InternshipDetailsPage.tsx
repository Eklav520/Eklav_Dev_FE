// pages/InternshipDetailsPage.tsx

import React, { useEffect, useState } from "react";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import axios from "axios";
import PageMetaData from "@/components/PageMetaData";
import InternshipCard from "./InternshipCard";
import { InternshipType } from "../types/internship";

const baseURL = import.meta.env.VITE_API_BASE_URL;

const InternshipDetailsPage = () => {
  const [internships, setInternships] = useState<InternshipType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInternships();
  }, []);

  const fetchInternships = async () => {
    try {
      const res = await axios.get(`${baseURL}/api/internships`);
      setInternships(res.data);
    } catch (error) {
      console.error("Error fetching internships:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (internship: InternshipType) => {
    console.log("Selected:", internship._id);
    // You can open modal or navigate
    // navigate(`/student/internships/${internship._id}`);
  };

  return (
    <>
      <PageMetaData title="Available Internships" />

      <Container className="py-4">
        {loading ? (
          <div className="text-center">
            <Spinner animation="border" />
          </div>
        ) : (
          <Row>
            {internships.map((internship) => (
              <Col key={internship._id} md={4} sm={6} className="mb-4">
                <InternshipCard
                  internship={internship}
                  onView={handleView}
                />
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </>
  );
};

export default InternshipDetailsPage;