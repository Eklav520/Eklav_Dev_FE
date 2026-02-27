import { useEffect, useState } from "react";
import { Container, Card, Badge, Spinner } from "react-bootstrap";
import axios from "axios";
import { useAuthContext } from "@/context/useAuthContext";

const baseURL = import.meta.env.VITE_API_BASE_URL;

const MyInternships = () => {
  const { user } = useAuthContext();
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMy = async () => {
      try {
        const res = await axios.get(
          `${baseURL}/student-internship/my`,
          {
            headers: {
              Authorization: `Bearer ${user?.token}`,
            },
          }
        );

        setInternships(res.data.internships);
      } catch (error) {
        console.error("Fetch My Internships Error:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchMy();
    }
  }, [user?.token]);

  if (loading)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
      </div>
    );

  return (
    <Container className="py-4">
      <h2 className="mb-4">My Internships</h2>

      {internships.length === 0 && (
        <p className="text-muted">You have not enrolled in any internships yet.</p>
      )}

      {internships.map((item) => (
        <Card key={item._id} className="mb-3 shadow-sm">
          <Card.Body>
            <Card.Title>{item.title}</Card.Title>

            <div className="mb-2">
              <Badge bg="info" className="me-2">
                {item.difficulty}
              </Badge>

              <Badge
                bg={
                  item.stipend?.toLowerCase() === "free"
                    ? "secondary"
                    : "success"
                }
              >
                {item.stipend}
              </Badge>
            </div>

            <Badge bg="success">Enrolled</Badge>
          </Card.Body>
        </Card>
      ))}
    </Container>
  );
};

export default MyInternships;