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
  FaTasks,
  FaCog,
  FaQuestionCircle,
  FaTerminal,
  FaMicrophone,
  FaUsers
} from 'react-icons/fa'
import AssessmentConfig from './components/AssessmentConfig'
import { useAuthContext } from '@/context/useAuthContext'

export default function FinalAssessmentPage() {
  const baseURL = import.meta.env.VITE_API_BASE_URL || "";
  const [activeTab, setActiveTab] = useState('config')
  const [examId, setExamId] = useState<string>("")
  const { user } = useAuthContext()

  const tabs = [
    { id: 'config', label: 'Assessment Config', icon: FaCog, color: '#ff6b35', description: 'Configure exam settings and rounds' },
    { id: 'quiz', label: 'Quiz Assessment', icon: FaFileAlt, color: '#ff7a00', description: 'MCQ & quiz questions' },
    { id: 'code', label: 'Code Challenge', icon: FaTerminal, color: '#28a745', description: 'Programming challenges' },
    { id: 'tr', label: 'TR Interview', icon: FaMicrophone, color: '#17a2b8', description: 'Technical interview questions' },
    { id: 'hr', label: 'HR Interview', icon: FaUsers, color: '#fd7e14', description: 'HR interview questions' },
  ]

  const isConfigTab = activeTab === 'config'
  const isDisabled = !examId && !isConfigTab

  return (
    <div className="final-assessment-container">
      <PageMetaData title="Admin - Assessments" />
      
      {/* Warning Banner */}
      {!examId && !isConfigTab && (
        <div className="warning-banner">
          <FaQuestionCircle className="warning-icon" />
          <div className="warning-content">
            <strong>⚠️ No exam selected</strong>
            <p>Please configure or select an exam in the "Assessment Config" tab first</p>
          </div>
        </div>
      )}
      
      {/* Tabs Navigation - Inside Container */}
      <div className="tabs-wrapper">
        <div className="tabs-header">
          <h3 className="tabs-title">Assessment Builder</h3>
          <p className="tabs-subtitle">Create and manage your complete assessment flow</p>
        </div>
        
        <div className="tabs-navigation">
          {tabs.map((tab) => {
            const disabled = !examId && tab.id !== "config";

            return (
              <button
                key={tab.id}
                disabled={disabled}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''} ${disabled ? 'disabled-tab' : ''}`}
                onClick={() => !disabled && setActiveTab(tab.id)}
              >
                <tab.icon className="tab-icon" style={{ color: activeTab === tab.id ? tab.color : '#8a8a8a' }} />
                <div className="tab-content">
                  <span className="tab-label">{tab.label}</span>
                  <span className="tab-description">{tab.description}</span>
                </div>
                {activeTab === tab.id && <div className="tab-indicator" style={{ background: tab.color }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="content-area">
        {activeTab === 'quiz' && (
          <Card className="assessment-card">
            <Card.Body className="card-body-custom">
              <div className="card-header-custom">
                <FaFileAlt className="card-icon" style={{ color: '#ff7a00' }} />
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
                  <FaTerminal className="card-icon" style={{ color: '#28a745' }} />
                  <div>
                    <h5 className="card-title">Create Code Challenge</h5>
                    <p className="card-subtitle">Design new coding challenges with test cases</p>
                  </div>
                </div>
                <AdminCreateProblem />
              </Card.Body>
            </Card>
          </div>
        )}

        {activeTab === 'tr' && (
          <Card className="assessment-card">
            <Card.Body className="card-body-custom">
              <div className="card-header-custom">
                <FaMicrophone className="card-icon" style={{ color: '#17a2b8' }} />
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
                <FaUsers className="card-icon" style={{ color: '#fd7e14' }} />
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
          <AssessmentConfig examId={examId} setExamId={setExamId} />
        )}
      </div>

      <style>{`
        .final-assessment-container {
          background: #000000;
          min-height: 100vh;
          padding: 1.5rem;
        }

        /* Warning Banner */
        .warning-banner {
          background: linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 107, 53, 0.05) 100%);
          border-left: 4px solid #ff6b35;
          border-radius: 8px;
          padding: 1rem 1.5rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .warning-icon {
          font-size: 1.5rem;
          color: #ff6b35;
        }

        .warning-content strong {
          color: #ff6b35;
          display: block;
          margin-bottom: 0.25rem;
        }

        .warning-content p {
          color: #8a8a8a;
          margin: 0;
          font-size: 0.85rem;
        }

        /* Tabs Wrapper */
        .tabs-wrapper {
          background: #0a0a0a;
          border-radius: 16px;
          border: 1px solid #1f1f1f;
          margin-bottom: 2rem;
          overflow: hidden;
        }

        .tabs-header {
          padding: 1.5rem 1.5rem 0.5rem 1.5rem;
          border-bottom: 1px solid #1f1f1f;
        }

        .tabs-title {
          color: #ffffff;
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0;
        }

        .tabs-subtitle {
          color: #8a8a8a;
          font-size: 0.85rem;
          margin: 0.25rem 0 0 0;
        }

        /* Tabs Navigation */
        .tabs-navigation {
          display: flex;
          gap: 0.25rem;
          padding: 1rem 1.5rem;
          flex-wrap: wrap;
          background: #0a0a0a;
        }

        .tab-button {
          position: relative;
          padding: 0.75rem 1.25rem;
          background: transparent;
          border: none;
          color: #8a8a8a;
          font-weight: 500;
          font-size: 0.9rem;
          border-radius: 12px;
          transition: all 0.2s ease;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex: 1;
          min-width: 180px;
          text-align: left;
        }

        .tab-button:hover:not(:disabled) {
          background: rgba(255, 107, 53, 0.1);
          transform: translateY(-1px);
        }

        .tab-button.active {
          background: rgba(255, 107, 53, 0.15);
          color: #ff6b35;
        }

        .tab-button.disabled-tab {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .tab-icon {
          font-size: 1.25rem;
          transition: color 0.2s ease;
        }

        .tab-content {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .tab-label {
          font-weight: 600;
          font-size: 0.85rem;
        }

        .tab-description {
          font-size: 0.7rem;
          color: #6c757d;
          margin-top: 0.125rem;
        }

        .tab-button.active .tab-description {
          color: #ff6b35;
        }

        .tab-indicator {
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: #ff6b35;
          border-radius: 2px;
        }

        /* Content Area */
        .content-area {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Assessment Cards */
        .assessment-card {
          background: #0a0a0a;
          border: 1px solid #1f1f1f;
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .assessment-card:hover {
          border-color: #ff6b35;
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
            padding: 1rem;
          }

          .tabs-header {
            padding: 1rem;
          }

          .tabs-navigation {
            flex-direction: column;
            padding: 0.75rem;
          }

          .tab-button {
            width: 100%;
            min-width: auto;
          }

          .tab-indicator {
            display: none;
          }

          .tab-button.active {
            background: rgba(255, 107, 53, 0.2);
          }

          .card-body-custom {
            padding: 1rem;
          }

          .card-header-custom {
            flex-direction: column;
            text-align: center;
          }

          .warning-banner {
            padding: 0.75rem 1rem;
          }
        }
      `}</style>
    </div>
  )
}