import { useEffect, useRef, useState } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { FaArrowRight, FaEnvelope } from "react-icons/fa";
import { BsPatchCheckFill } from "react-icons/bs";
import {
  TechCoursesIcon,
  StudyMaterialIcon,
  OnlineClassesIcon,
  ChittiRoboIcon,
  EmailPracticeIcon,
  JamIcon,
  VirtualInterviewIcon,
  AptitudeIcon,
  CodeAIIcon,
  ResumeIcon,
  JobVacanciesIcon,
  AssessmentIcon,
} from "./FeatureIcons";
import { useNavigate } from "react-router-dom";
import "./About.css";
import useTenant from "@/utils/tenant";

import element7 from "@/assets/images/element/07.png";
import scienceImg from "@/assets/images/client/science.svg";
import angularImg from "@/assets/images/client/angular.svg";
import figmaImg from "@/assets/images/client/figma.svg";
import avatar1 from "@/assets/images/avatar/01.jpg";
import avatar2 from "@/assets/images/avatar/02.jpg";
import avatar3 from "@/assets/images/avatar/03.jpg";
import avatar4 from "@/assets/images/avatar/04.jpg";

type AboutProps = {
  onStartJourneyClick?: () => void;
};

type Course = { _id: string; title: string; image?: string }

const CourseMarquee = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const [courses, setCourses] = useState<Course[]>([])
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`${baseURL}/courses/public/list`)
      .then(r => r.ok ? r.json() : [])
      .then((data: Course[]) => {
        if (Array.isArray(data)) setCourses(data.filter(c => c.image))
      })
      .catch(() => {})
  }, [])

  if (courses.length === 0) return null

  // duplicate for seamless loop
  const items = [...courses, ...courses]

  return (
    <div className="course-marquee-wrap">
      <div className="course-marquee-track" ref={trackRef}>
        {items.map((c, i) => {
          const imgSrc = c.image?.startsWith('http')
            ? c.image
            : c.image ? `${baseURL}/uploads/${c.image}` : null
          return (
            <div className="course-marquee-card" key={`${c._id}-${i}`}>
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={c.title}
                  className="course-marquee-img"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <div className="course-marquee-placeholder">
                  {c.title.charAt(0).toUpperCase()}
                </div>
              )}
              <p className="course-marquee-title">{c.title}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const About = ({ onStartJourneyClick }: AboutProps) => {
  const navigate = useNavigate();
  const tenant = useTenant();

  const tenantName = tenant?.name || "Eklav";
  const normalizedTenantName =
    tenantName.charAt(0).toUpperCase() + tenantName.slice(1).toLowerCase();
  const tenantNameFirstTwo = normalizedTenantName.slice(0, 2);
  const tenantNameRest = normalizedTenantName.slice(2);
  const isCoreDataLabs =
    tenant?.name === "coredatalabs" ||
    window?.location?.hostname === "coredatalabs.eklav.in";
  const students = [avatar1, avatar2, avatar3, avatar4];

  const features = [
    {
      icon: <TechCoursesIcon />,
      title: "Top Tech Courses",
      description: "Unlimited access to premium tech courses curated by industry experts.",
    },
    {
      icon: <StudyMaterialIcon />,
      title: "Modern Study Material",
      description: "Access updated and comprehensive study materials for all subjects.",
    },
    {
      icon: <OnlineClassesIcon />,
      title: "Online Classes with Industry Experts",
      description: "Learn directly from professionals working in top companies.",
    },
    {
      icon: <ChittiRoboIcon />,
      title: "English Speaking Practice with Chitti Robo",
      description: "Improve your English fluency with our AI-powered speaking assistant.",
    },
    {
      icon: <EmailPracticeIcon />,
      title: "Email Practices",
      description: "Master professional email writing with real-world scenarios.",
    },
    {
      icon: <JamIcon />,
      title: "JAM",
      description: "Practice Just A Minute sessions to improve spontaneous speaking.",
    },
    {
      icon: <VirtualInterviewIcon />,
      title: "Virtual Interview with AI",
      description: "Experience realistic interview simulations with instant AI feedback.",
    },
    {
      icon: <AptitudeIcon />,
      title: "Aptitude Unlimited",
      description: "Endless aptitude practice with adaptive difficulty levels.",
    },
    {
      icon: <CodeAIIcon />,
      title: "Learn Code with AI Tutor",
      description: "Get personalized coding guidance from our AI tutor.",
    },
    {
      icon: <ResumeIcon />,
      title: "Resume Preparation",
      description: "Create ATS-friendly resumes with expert guidance.",
    },
    {
      icon: <JobVacanciesIcon />,
      title: "Job Vacancies",
      description: "Access exclusive job opportunities and placement drives.",
    },
    {
      icon: <AssessmentIcon />,
      title: "Assessment Every Month Like Industry Based",
      description: "Take monthly industry-standard assessments to track your progress.",
    },
  ];


  return (
    <div className="eklav-about">
      {/* ── Hero Section ── */}
      <section className="position-relative overflow-hidden about-hero-combined">
        {/* Decorative dot-grid — left edge */}
        <figure className="position-absolute top-50 start-0 translate-middle-y ms-n7 d-none d-xxl-block">
          <svg className="rotate-74 fill-danger opacity-1">
            <circle cx="180.4" cy="15.5" r="7.7" />
            <path d="m159.9 22.4c-3.8 0-6.9-3.1-6.9-6.9s3.1-6.9 6.9-6.9 6.9 3.1 6.9 6.9-3.1 6.9-6.9 6.9z" />
            <ellipse transform="matrix(.3862 -.9224 .9224 .3862 71.25 138.08)" cx="139.4" cy="15.5" rx="6.1" ry="6.1" />
            <circle cx="118.9" cy="15.5" r="5.4" />
            <path d="m98.4 20.1c-2.5 0-4.6-2.1-4.6-4.6s2.1-4.6 4.6-4.6 4.6 2.1 4.6 4.6-2.1 4.6-4.6 4.6z" />
            <path d="m77.9 19.3c-2.1 0-3.8-1.7-3.8-3.8s1.7-3.8 3.8-3.8 3.8 1.7 3.8 3.8-1.7 3.8-3.8 3.8z" />
            <path d="m57.3 18.6c-1.7 0-3.1-1.4-3.1-3.1s1.4-3.1 3.1-3.1 3.1 1.4 3.1 3.1-1.4 3.1-3.1 3.1z" />
            <path d="m36.8 17.8c-1.3 0-2.3-1-2.3-2.3s1-2.3 2.3-2.3 2.3 1 2.3 2.3-1 2.3-2.3 2.3z" />
            <circle cx="16.3" cy="15.5" r="1.6" />
            <circle cx="180.4" cy="38.5" r="7.7" />
            <path d="m159.9 45.3c-3.8 0-6.9-3.1-6.9-6.9s3.1-6.9 6.9-6.9 6.9 3.1 6.9 6.9-3.1 6.9-6.9 6.9z" />
            <ellipse transform="matrix(.8486 -.5291 .5291 .8486 .7599 79.566)" cx="139.4" cy="38.5" rx="6.1" ry="6.1" />
            <circle cx="118.9" cy="38.5" r="5.4" />
            <path d="m98.4 43.1c-2.5 0-4.6-2.1-4.6-4.6s2.1-4.6 4.6-4.6 4.6 2.1 4.6 4.6-2.1 4.6-4.6 4.6z" />
            <circle cx="77.9" cy="38.5" r="3.8" />
            <path d="m57.3 41.5c-1.7 0-3.1-1.4-3.1-3.1s1.4-3.1 3.1-3.1 3.1 1.4 3.1 3.1c0 1.8-1.4 3.1-3.1 3.1z" />
            <path d="m36.8 40.8c-1.3 0-2.3-1-2.3-2.3s1-2.3 2.3-2.3 2.3 1 2.3 2.3-1 2.3-2.3 2.3z" />
            <circle cx="16.3" cy="38.5" r="1.6" />
            <circle cx="180.4" cy="61.4" r="7.7" />
            <path d="m159.9 68.3c-3.8 0-6.9-3.1-6.9-6.9s3.1-6.9 6.9-6.9 6.9 3.1 6.9 6.9-3.1 6.9-6.9 6.9z" />
            <ellipse transform="matrix(.3862 -.9224 .9224 .3862 28.902 166.26)" cx="139.4" cy="61.4" rx="6.1" ry="6.1" />
            <circle cx="118.9" cy="61.4" r="5.4" />
            <path d="m98.4 66c-2.5 0-4.6-2.1-4.6-4.6s2.1-4.6 4.6-4.6 4.6 2.1 4.6 4.6c0 2.6-2.1 4.6-4.6 4.6z" />
            <path d="m77.9 65.2c-2.1 0-3.8-1.7-3.8-3.8s1.7-3.8 3.8-3.8 3.8 1.7 3.8 3.8-1.7 3.8-3.8 3.8z" />
            <path d="m57.3 64.5c-1.7 0-3.1-1.4-3.1-3.1s1.4-3.1 3.1-3.1 3.1 1.4 3.1 3.1-1.4 3.1-3.1 3.1z" />
            <path d="m36.8 63.7c-1.3 0-2.3-1-2.3-2.3s1-2.3 2.3-2.3 2.3 1 2.3 2.3-1 2.3-2.3 2.3z" />
            <circle cx="16.3" cy="61.4" r="1.6" />
            <circle cx="180.4" cy="84.4" r="7.7" />
            <path d="m159.9 91.3c-3.8 0-6.9-3.1-6.9-6.9s3.1-6.9 6.9-6.9 6.9 3.1 6.9 6.9-3.1 6.9-6.9 6.9z" />
            <path d="m139.4 90.5c-3.4 0-6.1-2.7-6.1-6.1s2.7-6.1 6.1-6.1 6.1 2.7 6.1 6.1c0 3.3-2.7 6.1-6.1 6.1z" />
            <circle cx="118.9" cy="84.4" r="5.4" />
            <path d="m98.4 89c-2.5 0-4.6-2.1-4.6-4.6s2.1-4.6 4.6-4.6 4.6 2.1 4.6 4.6-2.1 4.6-4.6 4.6z" />
            <path d="m77.9 88.2c-2.1 0-3.8-1.7-3.8-3.8s1.7-3.8 3.8-3.8 3.8 1.7 3.8 3.8-1.7 3.8-3.8 3.8z" />
            <path d="m57.3 87.4c-1.7 0-3.1-1.4-3.1-3.1s1.4-3.1 3.1-3.1 3.1 1.4 3.1 3.1c0 1.8-1.4 3.1-3.1 3.1z" />
            <path d="m36.8 86.7c-1.3 0-2.3-1-2.3-2.3s1-2.3 2.3-2.3 2.3 1 2.3 2.3-1 2.3-2.3 2.3z" />
            <circle cx="16.3" cy="84.4" r="1.6" />
          </svg>
        </figure>

        {/* Decorative concentric-rings — right edge */}
        <span className="position-absolute top-50 end-0 translate-middle-y mt-5 me-n5 d-none d-xxl-inline-flex">
          <svg className="fill-warning rotate-186 opacity-8">
            <path d="m35.4 54.2c0 0.6 0 1.1-0.1 1.7-0.9 9.3-9.2 16.1-18.5 15.1-4.5-0.4-8.5-2.6-11.4-6.1-2.8-3.5-4.2-7.9-3.7-12.4 0.9-9.3 9.2-16.1 18.5-15.1 4.5 0.4 8.5 2.6 11.4 6.1 2.4 3 3.8 6.8 3.8 10.7zm-33.4 0c0 3.8 1.3 7.5 3.8 10.4 2.8 3.4 6.8 5.5 11.2 6 9.1 0.9 17.2-5.8 18.1-14.8 0.4-4.4-0.9-8.7-3.7-12.1s-6.8-5.5-11.2-6c-9.2-0.8-17.3 5.8-18.2 14.9v1.6z" />
            <path d="m118.3 54.2c0 13-5.1 25.3-14.3 34.5-19 19-50 19-69 0-9.2-9.2-14.3-21.4-14.3-34.5 0-13 5.1-25.3 14.3-34.5 19-19 50-19 69 0l-0.1 0.1 0.1-0.1c9.2 9.2 14.3 21.5 14.3 34.5zm-97.2 0c0 12.9 5 25.1 14.2 34.2 18.9 18.9 49.6 18.9 68.4 0 9.1-9.1 14.2-21.3 14.2-34.2s-5-25.1-14.2-34.2c-18.8-18.9-49.5-18.9-68.4 0-9.2 9.1-14.2 21.3-14.2 34.2z" />
          </svg>
        </span>

        {/* Small orange circle — top-left */}
        <figure className="position-absolute top-0 start-0 ms-5">
          <svg className="fill-orange opacity-4" width="29px" height="29px">
            <path d="M29.004,14.502 C29.004,22.512 22.511,29.004 14.502,29.004 C6.492,29.004 -0.001,22.512 -0.001,14.502 C-0.001,6.492 6.492,-0.001 14.502,-0.001 C22.511,-0.001 29.004,6.492 29.004,14.502 Z" />
          </svg>
        </figure>

        <Container>
          <Row className="align-items-center g-5">
            {/* ── Left: Eklav text & stats ── */}
            <Col
              lg={5}
              xl={6}
              className="position-relative z-index-1 text-center text-lg-start mb-5 mb-lg-0"
            >
              {/* Star diamond decoration */}
              <figure className="fill-warning position-absolute bottom-0 end-0 me-5 d-none d-xl-block">
                <svg width="42px" height="42px">
                  <path d="M21.000,-0.001 L28.424,13.575 L41.999,20.999 L28.424,28.424 L21.000,41.998 L13.575,28.424 L-0.000,20.999 L13.575,13.575 L21.000,-0.001 Z" />
                </svg>
              </figure>
              {/* Star burst decoration */}
              <figure className="fill-success position-absolute top-0 start-50 translate-middle-x mt-n5 ms-5">
                <svg width="22px" height="21px">
                  <path d="M10.717,4.757 L14.440,-0.001 L14.215,6.023 L20.142,4.757 L16.076,9.228 L21.435,12.046 L15.430,12.873 L17.713,18.457 L12.579,15.252 L10.717,20.988 L8.856,15.252 L3.722,18.457 L6.005,12.873 L-0.000,12.046 L5.359,9.228 L1.292,4.757 L7.220,6.023 L6.995,-0.001 L10.717,4.757 Z" />
                </svg>
              </figure>

              <h1 className="about-title">
                About{" "}
                <span className="position-relative d-inline-block">
                  <span className="text-white position-relative fw-bold" style={{ zIndex: 1 }}>{tenantNameFirstTwo}</span>
                  <span className="text-white position-relative fw-bold" style={{ zIndex: 1 }}>{tenantNameRest}</span>
                  <span className="position-absolute top-50 start-50 translate-middle z-index-n1">
                    <svg
                      width="200px"
                      height="55px"
                      viewBox="0 0 366 62.1"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        className="fill-warning"
                        d="m322.5 25.3c0 1.4 2.9 0.8 3.1 1.6 0.8 1.1-1.1 1.3-0.6 2.4 13.3 0.9 26.9 1.7 40.2 4-2.5 0.7-4.9 1.6-7.3 1.1-4-0.9-8.2-1-12.2-1.2-8.5-0.5-16.9-1.9-25.5-1.7h-3.1c2.6 0.6 4.8 0.4 5.7 2.2-7.3 0.4-14.1-0.8-21.2-1.1-0.2 0.6-0.5 1.2-0.8 1.8 21.3 0.7 42.5 1.6 64.3 4.6-4.2 1.6-7.7 1-10.8 0.8-6.8-0.5-13.5-1.3-20.3-1.9-0.9-0.1-2.3-0.1-2.9 0.2-2.2 1.6-4.3 0.6-7 0.4 1.4-1 2.5 0.5 3.9-0.8-5.6-1-10.7 0.6-15.9 0s-10.5-0.6-16.6-0.8c2 1.6 4.6 1.3 6.2 1.4 4.9 0 9.9 0.8 14.8 0.7 5.3-0.1 10.4 0.5 15.5 0.9 3.2 0.3 6.7-0.1 9.9-0.4 1.1-0.1 0.5 0.3 0.6 0.6 0.5 0.9 2.2 0.8 3.6 0.8 5.1-0.1 10.1 0.6 14.8 1.5 0.8 0.1 1.5 0 1.7 0.7 0 0.7-0.8 0.6-1.5 0.8-3.9 1.2-7.4-0.2-11.1-0.2-2 0-4.3-1.5-6 0.5-0.3 0.4-1.4 0.1-2.2-0.1-4.5-0.8-9.1-0.5-13.8-1.5-2.3-0.5-5.6 0.1-8.4 0.5-4 0.5-8-0.7-12.1-0.9-3.4-0.2-7.1-0.5-10.5-0.7-7.1-0.3-14.2-1.2-22.3-0.4 4.9 1.1 9.4 1.2 13.8 1.2 9.7 0 19.2 2.3 28.9 1.6 7.3 3.2 15.9 1.5 23.8 2.9 4.9 0.8 10.1 0.8 15.2 1.2 0.5 0 0.8 0.3 1.1 0.9-20-2.1-40.2-1.4-60.8-3 4.9 2.1 10.8-0.3 15.3 2.7-8 1.9-15.8-0.9-23.5-0.1 2.8 1.4 7.1 1.1 9.3 3.3 0.5 0.5 0.2 1.1-1.2 1.3 2.3 1 3.4-2.1 5.7-0.4 0.2-0.6 0.2-1 0.3-1.5 0.8-0.3 2 0.8 1.5 1.5-0.2 0.1 0 0.3 0 0.5 18.7 0.4 37.3 1.7 56.2 3.6-1.7 1.1-2.8 1.2-4.2 1.1-7.1-0.5-14.1-0.9-21.2-1.4-3.1-0.2-6.3-0.4-9.4-0.4-7.6-0.2-15-0.7-22.4-1-9-0.4-17.9-0.1-26.9-0.1-1.2 0-2.9-0.4-3.9 1 14.8 0.3 29.7 0.6 44.4 1.1 14.8 0.6 29.9 1.3 44.2 4.2-4.3 1-8.8 0.9-13 0.5-5.3-0.5-10.5-1.1-15.8-1.2-11.4-0.3-22.9-0.9-34.3-1.2-17.6-0.4-35.4-0.3-53.1-0.4-10.8-0.1-21.7-0.2-32.5 0-17.8 0.4-35.7 0.2-53.5 0.5-13.1 0.3-26.3 0.1-39.4 0.5-11.1 0.3-22.4 0.6-33.6 1-13.1 0.6-26.1 0.2-39.3 0.4-3.9 0.1-7.6 0.2-11.8-0.2 0.9-1.2 2.3-1.3 3.9-1.3 8.4 0.2 16.6-0.4 24.9-0.9 3.9-0.2 7.9-0.4 11.9 0.2 2.5 0.4 5.3-0.3 8-0.4 7.3-0.4 14.7-0.7 22-0.9 11.9-0.5 23.7-1.2 35.6-0.8 7.7 0.2 15.3-0.6 22.9-0.1 2.3 0.2 4.3-0.5 6.5-1h-17.6c-9.6 0-19-0.1-28.6 0-8 0.1-16.1 0.3-24 0.8-2.6 0.2-5.4 0.1-8.2 0.1-10.1 0.3-20.1 0.6-30.2 0.5-5.4 0-10.7-0.1-15.9 0.6-2.3 0.3-4-1.3-6.5-0.6 0.2 0.4 0.5 0.9 0.6 1.5-1.9 0-4 0.4-4.9-0.1-4.2-2.2-9.4-1.5-14.1-2.3-1.7-0.3-3.7-0.1-4.3-1.5-0.5-1.3 1.9-1.5 2.6-2.6-4.2-1.4-4.6-5-8.5-7.2-1.5 0.2-0.9 2.8-4.2 1.3 0.3 2.4 4.5 3.9 2.8 6.4-2.3 0.3-3.2-0.8-4.2-1.7-2.5-4-5.1-8.4-5.1-12.7 0.2-6.8 0.2-13.8 3.6-20.4 0.3-0.5 0.3-1 0.8-1.4 0.9-0.9 1.2-2.4 3.6-2.1 2.2 0.2 2.5 1.5 2.6 2.6 0.2 1.4 1.5 1.8 3.2 2.5 0.9-1.4 0.5-2.9 2.6-3.7 0.2-0.1 0.3-0.4 0.3-0.4-3.1-2.2 1.2-2.2 2.3-3.3-3.1-1.8-4-4.3-3.7-7-1.5-0.3-3.1-0.4-4.5 0-1.7 0.6-2.2-0.5-2.9-1 0.6-0.5 0.8-1.1 2.2-1.3 7.6-0.9 15.2-1.7 22.9-2 20-0.7 39.9-0.9 59.9-1 11.9-0.1 23.8 0.4 35.6 1.1 3.6 0.2 7.1-0.9 10.7-0.5 7.9 0.9 15.8 0.3 23.8 0.5 7.3 0.1 14.4-0.6 21.7-0.1 12.2 0.9 24.4 0.3 36.7 0.6 9.4 0.3 18.9 0.4 28.2 1 11.9 0.7 23.8 1.3 35.6 2 11.1 0.6 22.4 0.5 33.3 2 7.1 1 14.4 1.1 21.3 2.4 4 0.7 8.2 1.6 12.4 1.9 2.2 0.2 0.9 1 1.5 1.5-4-0.8-8-0.8-12.1-1.4-4.3-0.7-8.5-1-12.8 0.4-2.9 1-6.3 0.2-9.3-0.1-10.2-1.1-20.6-1.6-30.8-2.4-12.1-0.9-24.3-1.4-36.4-2.1-9.9-0.6-20-0.5-29.9-1-11.4-0.6-22.7 0-34.2-0.5-6.3-0.3-12.3-0.3-18.5-0.4-4.2-0.1-8.4 1.3-12.8 0.3 0.6 0.2 1.2 0.7 1.9 0.7 10.5 0 20.9 1.9 31.6 1.7 6.5-0.1 13.1 0.2 19.8 0.8 3.2 0.3 6.3-0.4 9.7-0.1 7.6 0.7 15.5 0.5 23 0.8 12.4 0.5 24.7 0.4 37.1 1.1 13.3 0.7 26.8 2.1 39.9 4.1 6.2 0.9 12.7 1.5 19.2 1.7 0.6 0 1.1 0.1 1.5 0.5-4.6 0.1-9.3 0-13.9-0.5-0.6 1.1 1.4 0.9 1.5 1.9-9.7 1.6-19.6-1.4-29.4-0.1 2.2 1.4 5.1 1 7.4 1 7.3 0.1 14.1 1.3 21.2 1.9 2.8 0.3 5.9 0 8.5 0.8 1.5 0.5 4.6-1.1 4.9 1.3 4-0.7 7.3 1.5 11.1 1.2 4-0.3 7.7 0.6 11.6 1.1 0.8 0.1 2.2 0.3 2.3 1.1 0.2 1-1.1 1.2-2 1.5-3.4 1-6.7-0.4-10.1-0.4-0.9 0-2-0.2-2.9-0.2-9.4 0.1-18.8-1.3-28.3-1.8-6-0.4-12.1-0.9-18.1-1.3 0 0.2 0 0.4-0.2 0.6 6.1 0.5 12.1 1.4 18.3 0.7z"
                      />
                    </svg>
                  </span>
                </span>
              </h1>

              <p className="about-description">
                <span className="lead-text">
                  <strong>
                    <span className="text-white">{tenantNameFirstTwo}</span>
                    {tenantNameRest}
                  </strong>{" "}
                  is a modern{" "}
                  <strong>All-in-One E-Learning Platform</strong> designed to
                  help students move from{" "}
                  <strong className="text-orange">Campus to Career</strong>.
                </span>

                {isCoreDataLabs && (
                  <span className="ai-strategy-text">
                    <strong className="text-orange">
                      AI Strategy &amp; Advanced Data Science Partner
                    </strong>{" "}
                    — Supporting global AI companies with talent intelligence,
                    model deployment, and scalable solutions for 12+ years.
                  </span>
                )}

                <span className="mission-text">
                  Powerful learning tools, AI practice systems, and real
                  industry training — all at an affordable cost.
                </span>
              </p>

              <ul className="list-inline justify-content-center justify-content-lg-start mb-3">
                <li className="list-inline-item me-3 hero-check-item">
                  <BsPatchCheckFill className="me-1 text-orange" />
                  Learn with Experts
                </li>
                <li className="list-inline-item me-3 hero-check-item">
                  <BsPatchCheckFill className="me-1 text-orange" />
                  Practice with AI
                </li>
                <li className="list-inline-item hero-check-item">
                  <BsPatchCheckFill className="me-1 text-orange" />
                  Get Placed
                </li>
                <li className="list-inline-item hero-check-item">
                  <BsPatchCheckFill className="me-1 text-orange" />
                  Gain Knowledge
                </li>
              </ul>

              {/* Course Marquee */}
              <CourseMarquee />
            </Col>

            {/* ── Right: decorative image ── */}
            <Col lg={7} xl={6} className="text-center position-relative">
              {/* Blue organic blob background */}
              <figure className="position-absolute bottom-0 start-50 translate-middle-x mt-4 mb-0">
                <svg
                  className="pt-5 pt-sm-0"
                  width="550px"
                  height="538px"
                  viewBox="0 0 554 544"
                  xmlSpace="preserve"
                >
                  <path
                    className="fill-blue"
                    d="M423.3,77.2c49.5,32.5,100.4,67.2,118.4,114.5s3.5,107.1-15.4,165.7
                    c-18.7,58.6-41.8,116.1-84,148.6c-42.5,32.8-104.2,40.2-163.8,37.3
                    c-59.5-3.2-116.8-17.1-164.7-47.9c-48.3-30.6-87.2-78.2-102-131.6
                    C-3,310.5,6.6,251,25.3,194.7C43.6,138,70.7,84.3,114.1,49.5
                    C157.2,14.8,216.7-1,270.8,6.4C324.8,14.2,373.4,44.7,423.3,77.2z"
                  />
                </svg>
              </figure>

              {/* Ground / platform shape */}
              <figure className="position-absolute bottom-0 start-50 translate-middle-x mb-n5 z-index-9">
                <svg width="686px" height="298px" viewBox="0 0 686 298">
                  <path
                    className="fill-body"
                    d="M60.9,0L0.1,0C0,0,0,0,0,0.1c1.5,5,0,249.5,11.5,297.9
                    c0,0,649.1,16.1,669-4.6c0,0,0,0,0,0c0.2-0.4,1.2-177.2,4.2-293.3
                    c0,0,0-0.1-0.1-0.1l-72.9,0c0,0-0.1,0-0.1,0
                    c-0.8,3-43.3,162.3-105.9,209.1c0,0-111.4,87.2-309.9-6
                    C195.9,203.1,66.1,143.2,60.9,0C61,0,60.9,0,60.9,0z"
                  />
                </svg>
              </figure>

              {/* Floating tech-icon badges */}
              <div className="p-2 bg-white shadow rounded-3 position-absolute top-50 start-0 translate-middle-y mt-n7 d-none d-sm-block">
                <img src={scienceImg} alt="Science" />
              </div>
              <div className="p-2 bg-white shadow rounded-3 position-absolute top-0 end-0 me-5">
                <img src={angularImg} alt="Angular" />
              </div>
              <div className="p-2 bg-white shadow rounded-3 position-absolute top-50 end-0 translate-middle-y mt-5 ms-5 d-none d-lg-block z-index-9">
                <img src={figmaImg} alt="Figma" />
              </div>

              {/* Email / notification badge */}
              <div className="p-3 bg-blur border border-light shadow rounded-4 position-absolute bottom-0 start-0 z-index-9 d-none d-xl-block mb-5 ms-5">
                <div className="d-flex align-items-center">
                  <span className="icon-lg bg-warning rounded-circle">
                    <FaEnvelope className="text-white" />
                  </span>
                </div>
              </div>

              {/* Daily students badge */}
              <div
                className="p-3 d-inline-block rounded-4 shadow-lg position-absolute top-50 end-0 translate-middle-y mt-n7 z-index-1 d-none d-md-block"
                style={{
                  background:
                    "url(assets/images/pattern/01.png) no-repeat center center",
                  backgroundSize: "cover",
                  backgroundColor: "#198754",
                }}
              >
                <p className="text-white mb-2 small fw-semibold">
                  Our daily new students
                </p>
                <ul className="avatar-group mb-0">
                  {students.map((student, idx) => (
                    <li className="avatar avatar-sm" key={idx}>
                      <img
                        className="avatar-img rounded-circle border-white"
                        src={student}
                        alt="avatar"
                      />
                    </li>
                  ))}
                  <li className="avatar avatar-sm">
                    <div className="avatar-img rounded-circle border-white bg-primary">
                      <span className="text-white position-absolute top-50 start-50 translate-middle small">
                        1K+
                      </span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Main illustration */}
              <div className="position-relative ms-sm-4">
                <img src={element7} alt="Eklav platform illustration" className="img-fluid" />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── Features Section ── */}
      <section className="about-features">
        <Container>
          <div className="section-header text-center">
            <h2 className="section-title">
              What Makes{" "}
              <span>
                <span className="text-white">{tenantNameFirstTwo}</span>
                <span className="text-white">{tenantNameRest}</span>
              </span>{" "}
              Different
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
                    <p className="feature-description">{feature.description}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* ── Mission Section ── */}
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
              <button
                className="btn-mission"
                onClick={() =>
                  onStartJourneyClick
                    ? onStartJourneyClick()
                    : navigate("/auth/sign-in")
                }
              >
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
