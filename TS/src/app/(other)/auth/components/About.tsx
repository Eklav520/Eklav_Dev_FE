import React from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import {
  FaRobot,
  FaLaptopCode,
  FaVideo,
  FaBrain,
  FaUserTie,
  FaChartLine,
  FaInfinity,
  FaAward,
  FaArrowRight,
  FaBook,
  FaEnvelope,
  FaMicrophone,
  FaCode,
  FaFileAlt,
  FaBriefcase,
  FaCalendarCheck,
} from "react-icons/fa";
import "./About.css";
import useTenant from "@/utils/tenant";

const About = () => {
  const tenant = useTenant();

  // 🔥 fallback (important)
  const tenantName = tenant?.name || "Eklav";

  console.log("Tenant Info:", tenant);

  const features = [
    {
      icon: <FaLaptopCode />,
      title: "Top Tech Courses",
      description:
        "Unlimited access to premium tech courses curated by industry experts.",
    },
    {
      icon: <FaBook />,
      title: "Modern Study Material",
      description:
        "Access updated and comprehensive study materials for all subjects.",
    },
    {
      icon: <FaVideo />,
      title: "Online Classes with Industry Experts",
      description:
        "Learn directly from professionals working in top companies.",
    },
    {
      icon: <FaRobot />,
      title: "English Speaking Practice with Chitti Robo",
      description:
        "Improve your English fluency with our AI-powered speaking assistant.",
    },
    {
      icon: <FaEnvelope />,
      title: "Email Practices",
      description:
        "Master professional email writing with real-world scenarios.",
    },
    {
      icon: <FaMicrophone />,
      title: "JAM",
      description:
        "Practice Just A Minute sessions to improve spontaneous speaking.",
    },
    {
      icon: <FaUserTie />,
      title: "Virtual Interview with AI",
      description:
        "Experience realistic interview simulations with instant AI feedback.",
    },
    {
      icon: <FaBrain />,
      title: "Aptitude Unlimited",
      description:
        "Endless aptitude practice with adaptive difficulty levels.",
    },
    {
      icon: <FaCode />,
      title: "Learn Code with AI Tutor",
      description:
        "Get personalized coding guidance from our AI tutor.",
    },
    {
      icon: <FaFileAlt />,
      title: "Resume Preparation",
      description:
        "Create ATS-friendly resumes with expert guidance.",
    },
    {
      icon: <FaBriefcase />,
      title: "Job Vacancies",
      description:
        "Access exclusive job opportunities and placement drives.",
    },
    {
      icon: <FaCalendarCheck />,
      title: "Assessment Every Month Like Industry Based",
      description:
        "Take monthly industry-standard assessments to track your progress.",
    },
  ];

  const stats = [
    { icon: <FaInfinity />, value: "250+", label: "Courses" },
    { icon: <FaAward />, value: "10K+", label: "Students" },
    { icon: <FaChartLine />, value: "95%", label: "Success" },
  ];

  return (
    <div className="eklav-about">
      {/* Hero Section */}
      <section className="about-hero">
        <Container>
          <Row className="align-items-center">
            <Col lg={8} className="mx-auto text-center">
              <h1 className="about-title">
                About <span className="text-orange">{tenantName}</span>
              </h1>

              <p className="about-description">
                <span className="lead-text">
                  {tenantName} is a modern{" "}
                  <strong>All-in-One E-Learning Platform</strong> designed to help
                  students move from{" "}
                  <strong className="text-orange">Campus to Career</strong>.
                </span>
                <span className="mission-text">
                  Our mission is to provide powerful learning tools, AI practice
                  systems, and real industry training — all at an affordable cost.
                </span>
              </p>

              <div className="stats-container">
                <Row>
                  {stats.map((stat, index) => (
                    <Col md={4} key={index} className="stat-col">
                      <div className="stat-item">
                        <div className="stat-icon">{stat.icon}</div>
                        <h3 className="stat-value">{stat.value}</h3>
                        <p className="stat-label">{stat.label}</p>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="about-features">
        <Container>
          <div className="section-header text-center">
            <h2 className="section-title">
              What Makes{" "}
              <span className="text-orange">{tenantName}</span> Different
            </h2>
            <p className="section-subtitle">
              Comprehensive learning ecosystem designed for your success
            </p>
          </div>

          <Row className="features-grid">
            {features.map((feature, index) => (
              <Col xl={3} lg={4} md={6} key={index}>
                <Card className="feature-card">
                  <Card.Body>
                    <div className="feature-icon">{feature.icon}</div>
                    <h5 className="feature-title">{feature.title}</h5>
                    <p className="feature-description">
                      {feature.description}
                    </p>
                    <div className="feature-link">
                      <span>Explore</span>
                      <FaArrowRight className="arrow-icon" />
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Mission Section */}
      <section className="about-mission">
        <Container>
          <Row className="justify-content-center">
            <Col lg={8} className="text-center">
              <h2 className="mission-heading">Our Mission</h2>
              <p className="mission-statement">
                Our goal is to build a powerful digital learning ecosystem where
                students can learn skills, practice with AI, prepare for
                interviews, and gain real project experience — all within a
                single platform.
              </p>
              <button className="btn-mission">
                Start Your Journey
                <FaArrowRight className="btn-icon" />
              </button>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default About;