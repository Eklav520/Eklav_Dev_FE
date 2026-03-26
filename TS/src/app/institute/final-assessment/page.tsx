import React, { useEffect, useState } from 'react'
import { Card, Button, Nav, Tab } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import AdminQuizUpload from './components/QuizComponents/AdminQuizUpload'
import AdminCreateProblem from './components/CodeChallenegeComponents/CreateCodeChallenge'
import AdminManageChallenges from './components/CodeChallenegeComponents/AdminManageChallenges'
import InterviewQuestions from './components/InterviewQuestions/InterviewQuestions'
import AdminReview from './components/AdminReview'
import HRInterviewQuestions from './components/HRRoundQuestions/HRInterviewQuestions'
import {
  FaFileAlt,
  FaCode,
  FaComments,
  FaUserTie,
  FaBook,
  FaCheckCircle,
  FaTasks
} from 'react-icons/fa'
import AssessmentConfig from './components/AssessmentConfig'
import { useAuthContext } from '@/context/useAuthContext'

export default function FinalAssessmentPage() {
  const baseURL = import.meta.env.VITE_API_BASE_URL || "";
  const [activeTab, setActiveTab] = useState('config')
  const [examId, setExamId] = useState<string>("")
  const { user } = useAuthContext()

  const tabs = [
    { id: 'config', label: 'Assessment Config', icon: FaCheckCircle, color: '#ffc107' },
    { id: 'quiz', label: 'Quiz Assessment', icon: FaFileAlt, color: '#ff7a00' },
    { id: 'code', label: 'Code Challenge', icon: FaCode, color: '#28a745' },
    { id: 'tr', label: 'TR Interview', icon: FaComments, color: '#17a2b8' },
    { id: 'hr', label: 'HR Interview', icon: FaUserTie, color: '#fd7e14' },
    
  ]

  return (
    <div className="final-assessment-container">
      <PageMetaData title="Admin - Assessments" />
      {!examId && (
        <div className="alert alert-warning text-center">
          ⚠ Please configure or select an exam first to continue
        </div>
      )}
      {/* Tabs Navigation */}
      <div className="tabs-navigation">
        {tabs.map((tab) => {
          const isDisabled = !examId && tab.id !== "config";

          return (
            <button
              key={tab.id}
              disabled={isDisabled}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''} ${isDisabled ? 'disabled-tab' : ''}`}
              onClick={() => !isDisabled && setActiveTab(tab.id)}
            >
              <tab.icon className="tab-icon" />
              <span>{tab.label}</span>

              {activeTab === tab.id && <div className="tab-indicator" />}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="content-area">
        {activeTab === 'quiz' && (
          <Card className="assessment-card">
            <Card.Body className="card-body-custom">
              <div className="card-header-custom">
                <FaFileAlt className="card-icon" />
                <div>
                  <h5 className="card-title">Quiz Assessment</h5>
                  <p className="card-subtitle">Upload and manage quiz questions & templates</p>
                </div>
              </div>
              <AdminQuizUpload />
            </Card.Body>
          </Card>
        )}

        {activeTab === 'code' && (
          <div className="code-challenges-wrapper">
            <Card className="assessment-card mb-4">
              <Card.Body className="card-body-custom">
                <div className="card-header-custom">
                  <FaCode className="card-icon" />
                  <div>
                    <h5 className="card-title">Create Code Challenge</h5>
                    <p className="card-subtitle">Design new coding challenges with test cases</p>
                  </div>
                </div>
                <AdminCreateProblem />
              </Card.Body>
            </Card>

            <Card className="assessment-card">
              <Card.Body className="card-body-custom">
                <div className="card-header-custom">
                  <FaTasks className="card-icon" />
                  <div>
                    <h5 className="card-title">Manage Challenges</h5>
                    <p className="card-subtitle">View and manage existing coding challenges</p>
                  </div>
                </div>
                <AdminManageChallenges
                  eventId={examId}
                  baseURL={import.meta.env.VITE_API_BASE_URL}
                />
              </Card.Body>
            </Card>
          </div>
        )}

        {activeTab === 'tr' && (
          <Card className="assessment-card">
            <Card.Body className="card-body-custom">
              <div className="card-header-custom">
                <FaComments className="card-icon" />
                <div>
                  <h5 className="card-title">Technical Interview Questions</h5>
                  <p className="card-subtitle">Manage technical interview question bank</p>
                </div>
              </div>
              <InterviewQuestions />
            </Card.Body>
          </Card>
        )}

        {activeTab === 'hr' && (
          <Card className="assessment-card">
            <Card.Body className="card-body-custom">
              <div className="card-header-custom">
                <FaUserTie className="card-icon" />
                <div>
                  <h5 className="card-title">HR Interview Questions</h5>
                  <p className="card-subtitle">Manage HR interview question bank</p>
                </div>
              </div>
              <HRInterviewQuestions />
            </Card.Body>
          </Card>
        )}

        {activeTab === 'config' && (
          <Card className="assessment-card">
            <Card.Body className="card-body-custom">
              <div className="card-header-custom">
                <FaCheckCircle className="card-icon" />
                <div>
                  <h5 className="card-title">Assessment Configuration</h5>
                  <p className="card-subtitle">
                    Enable/Disable rounds and set exam timing
                  </p>
                </div>
              </div>
              <AssessmentConfig examId={examId} setExamId={setExamId} />
            </Card.Body>
          </Card>
        )}
      </div>

      <style>{`
        .final-assessment-container {
          background: #000000;
          min-height: 100vh;
          padding: 1rem;
        }

        /* Header Section */
        .header-section {
          background: linear-gradient(135deg, #0a0a0a 0%, #000000 100%);
          border-bottom: 1px solid #ff7a00;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border-radius: 12px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          font-size: 2rem;
          color: #ff7a00;
        }

        .header-title {
          color: #ffffff;
          font-size: 1.75rem;
          font-weight: 700;
          margin: 0;
        }

        .header-subtitle {
          color: #8a8a8a;
          font-size: 0.9rem;
          margin: 0.25rem 0 0 0;
        }

        .stats-badge {
          background: rgba(255, 122, 0, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          color: #ff7a00;
          font-size: 0.85rem;
          font-weight: 500;
          display: flex;
          align-items: center;
        }

        /* Tabs Navigation */
        .tabs-navigation {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          background: #0a0a0a;
          padding: 0.5rem;
          border-radius: 12px;
          border: 1px solid #1f1f1f;
        }

        .tab-button {
          position: relative;
          padding: 0.75rem 1.5rem;
          background: transparent;
          border: none;
          color: #8a8a8a;
          font-weight: 500;
          font-size: 0.9rem;
          border-radius: 8px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }

        .tab-button:hover {
          color: #ff7a00;
          background: rgba(255, 122, 0, 0.1);
        }

        .tab-button.active {
          color: #ff7a00;
          background: rgba(255, 122, 0, 0.15);
        }

        .tab-icon {
          font-size: 1rem;
        }

        .tab-indicator {
          position: absolute;
          bottom: -2px;
          left: 50%;
          transform: translateX(-50%);
          width: 40%;
          height: 2px;
          background: #ff7a00;
          border-radius: 2px;
        }

        /* Assessment Cards */
        .assessment-card {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .assessment-card:hover {
          border-color: #ff7a00;
        }

        .card-body-custom {
          padding: 1.5rem;
        }

        .card-header-custom {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #1f1f1f;
        }

        .card-icon {
          font-size: 1.75rem;
          color: #ff7a00;
        }

        .card-title {
          color: #ffffff;
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
        }

        .card-subtitle {
          color: #8a8a8a;
          font-size: 0.85rem;
          margin: 0.25rem 0 0 0;
        }

        /* Code Challenges Wrapper */
        .code-challenges-wrapper {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .final-assessment-container {
            padding: 0.5rem;
          }

          .header-section {
            padding: 1rem;
          }

          .header-content {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-title {
            font-size: 1.25rem;
          }

          .tabs-navigation {
            flex-direction: column;
            gap: 0.25rem;
          }

          .tab-button {
            width: 100%;
            justify-content: center;
          }

          .tab-indicator {
            display: none;
          }

          .tab-button.active {
            background: rgba(255, 122, 0, 0.2);
          }

          .card-body-custom {
            padding: 1rem;
          }

          .card-header-custom {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  )
}