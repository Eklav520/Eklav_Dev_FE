// src/pages/student/english-practice/page.tsx
import React, { useState, useEffect } from "react"
import { Container } from "react-bootstrap"
import PageMetaData from "@/components/PageMetaData"
import LearningPractice from "./components/LearningPractice"
import ReadingPractice from "./components/ReadingPractice"
import VocabularyPractice from "./components/VocabularyPractice"
import { FaBars, FaTimes, FaHeadphones, FaBookReader, FaBookOpen } from "react-icons/fa"

const EnglishPractice = () => {
  const [activeTab, setActiveTab] = useState<string>("listening")
  const [isMobile, setIsMobile] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const tabs = [
    { 
      id: "listening", 
      title: "🎧 Listening", 
      icon: <FaHeadphones />,
      component: <LearningPractice />,
      description: "Improve your listening comprehension with AI-powered audio challenges"
    },
    { 
      id: "reading", 
      title: "📖 Reading", 
      icon: <FaBookReader />,
      component: <ReadingPractice />,
      description: "Enhance reading skills with interactive passages and comprehension exercises"
    },
    { 
      id: "vocabulary", 
      title: "📚 Vocabulary", 
      icon: <FaBookOpen />,
      component: <VocabularyPractice />,
      description: "Build your vocabulary with contextual learning and practice exercises"
    }
  ]

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId)
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const getCurrentTab = () => {
    return tabs.find(tab => tab.id === activeTab) || tabs[0]
  }

  return (
    <Container fluid className="english-practice-container">
      <PageMetaData title="English Practice" />
      
      {/* Mobile Header */}
      {isMobile && (
        <div className="mobile-header">
          <button 
            className="menu-toggle" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <FaTimes /> : <FaBars />}
          </button>
          <h1 className="mobile-title">English Practice</h1>
          <div className="active-tab-mobile">
            <span className="mobile-tab-icon">{getCurrentTab().title.split(' ')[0]}</span>
            <span className="mobile-tab-title">
              {getCurrentTab().title.split(' ').slice(1).join(' ')} Practice
            </span>
          </div>
        </div>
      )}

      <div className={`main-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
        {/* Sidebar Navigation */}
        <div className={`sidebar ${isMobile && !sidebarOpen ? 'sidebar-hidden' : ''}`}>
          {isMobile && (
            <div className="mobile-sidebar-header">
              <h2 className="sidebar-title">English Practice</h2>
              <button 
                className="close-sidebar"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
              >
                <FaTimes />
              </button>
            </div>
          )}
          
          {!isMobile && (
            <div className="sidebar-header">
              <h2 className="sidebar-title">English Practice</h2>
            </div>
          )}
          
          <div className="tabs-container">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleTabClick(tab.id)}
                aria-label={`Switch to ${tab.title} practice`}
              >
                <div className="tab-content">
                  <span className="tab-icon">{tab.icon}</span>
                  <div className="tab-text">
                    <span className="tab-name">
                      {tab.title.split(' ').slice(1).join(' ')}
                    </span>
                    <span className="tab-description">
                      {tab.description}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <div className="sidebar-footer">
            <p className="help-text">
              Need help? <a href="/help" className="help-link">Visit our help center</a>
            </p>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="content-area">
          {!isMobile && (
            <div className="content-header">
              <h2 className="content-title">{getCurrentTab().title.split(' ').slice(1).join(' ')} Practice</h2>
              <p className="content-subtitle">{getCurrentTab().description}</p>
            </div>
          )}
          
          <div className="active-tab-content">
            {getCurrentTab().component}
          </div>
        </div>
      </div>

      <style>{`
        .english-practice-container {
          padding: 0 !important;
          font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          min-height: 100vh;
          background: #f8fafc;
        }
        
        /* Mobile Header */
        .mobile-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          height: 60px;
        }
        
        .menu-toggle {
          background: transparent;
          border: none;
          color: white;
          font-size: 1.25rem;
          padding: 0.5rem;
          cursor: pointer;
          border-radius: 8px;
          transition: background-color 0.2s;
        }
        
        .menu-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .mobile-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0;
          flex: 1;
          text-align: center;
        }
        
        .active-tab-mobile {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.1);
          padding: 0.375rem 0.75rem;
          border-radius: 20px;
          min-width: 0;
        }
        
        .mobile-tab-icon {
          font-size: 1rem;
        }
        
        .mobile-tab-title {
          font-size: 0.85rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100px;
        }
        
        /* Main Layout */
        .main-layout {
          display: flex;
          min-height: 100vh;
          background: #f8fafc;
        }
        
        @media (max-width: 767px) {
          .main-layout {
            padding-top: 60px;
          }
        }
        
        /* Sidebar */
        .sidebar {
          width: 300px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          flex-direction: column;
          z-index: 900;
          transition: transform 0.3s ease;
        }
        
        @media (max-width: 767px) {
          .sidebar {
            position: fixed;
            top: 60px;
            left: 0;
            bottom: 0;
            transform: translateX(-100%);
            box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
          }
          
          .sidebar.sidebar-hidden {
            transform: translateX(-100%);
          }
          
          .sidebar-open .sidebar {
            transform: translateX(0);
          }
        }
        
        .mobile-sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.1);
        }
        
        .close-sidebar {
          background: transparent;
          border: none;
          color: white;
          font-size: 1.25rem;
          padding: 0.5rem;
          cursor: pointer;
          border-radius: 8px;
          transition: background-color 0.2s;
        }
        
        .close-sidebar:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        .sidebar-header {
          padding: 2rem 1.5rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 1rem;
        }
        
        .sidebar-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          text-align: left;
        }
        
        /* Tabs Container */
        .tabs-container {
          flex: 1;
          padding: 0.5rem;
          overflow-y: auto;
        }
        
        /* Tab Button */
        .tab-button {
          width: 100%;
          padding: 1rem 1.25rem;
          background: transparent;
          border: none;
          border-left: 4px solid transparent;
          text-align: left;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 0.5rem;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .tab-button:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border-left-color: rgba(255, 255, 255, 0.3);
        }
        
        .tab-button.active {
          background: rgba(255, 255, 255, 0.95);
          border-left-color: #764ba2;
          color: #2d3748;
        }
        
        .tab-button.active:hover {
          background: rgba(255, 255, 255, 0.95);
          color: #2d3748;
        }
        
        .tab-content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .tab-icon {
          font-size: 1.25rem;
          width: 24px;
          text-align: center;
        }
        
        .tab-text {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          flex: 1;
        }
        
        .tab-name {
          font-size: 0.95rem;
          font-weight: 600;
        }
        
        .tab-description {
          font-size: 0.8rem;
          opacity: 0.9;
          font-weight: 400;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        /* Sidebar Footer */
        .sidebar-footer {
          padding: 1rem 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          margin-top: auto;
        }
        
        .help-text {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.85rem;
          margin: 0;
        }
        
        .help-link {
          color: #ffffff;
          text-decoration: underline;
          font-weight: 500;
        }
        
        .help-link:hover {
          color: #e2e8f0;
        }
        
        /* Content Area */
        .content-area {
          flex: 1;
          background: #f8fafc;
          min-height: 100vh;
          overflow: auto;
        }
        
        @media (max-width: 767px) {
          .content-area {
            width: 100%;
          }
        }
        
        /* Content Header */
        .content-header {
          background: #ffffff;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .content-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #2d3748;
          margin: 0 0 0.5rem 0;
        }
        
        .content-subtitle {
          color: #718096;
          font-size: 0.95rem;
          margin: 0;
          line-height: 1.5;
        }
        
        /* Active Tab Content */
        .active-tab-content {
          padding: 1.5rem;
          min-height: calc(100vh - 80px);
          overflow: auto;
        }
        
        @media (max-width: 767px) {
          .active-tab-content {
            padding: 1rem;
            min-height: calc(100vh - 60px);
          }
        }
        
        /* Responsive Adjustments */
        @media (min-width: 768px) and (max-width: 1024px) {
          .sidebar {
            width: 280px;
          }
          
          .tab-button {
            padding: 0.875rem 1rem;
          }
          
          .tab-name {
            font-size: 0.9rem;
          }
          
          .tab-description {
            font-size: 0.75rem;
          }
        }
        
        @media (max-width: 576px) {
          .mobile-header {
            padding: 0.75rem;
          }
          
          .mobile-title {
            font-size: 1rem;
          }
          
          .mobile-tab-title {
            font-size: 0.8rem;
            max-width: 80px;
          }
          
          .sidebar {
            width: 280px;
          }
          
          .tab-button {
            padding: 0.875rem 1rem;
          }
          
          .tab-name {
            font-size: 0.9rem;
          }
          
          .tab-description {
            font-size: 0.75rem;
            -webkit-line-clamp: 2;
          }
          
          .active-tab-content {
            padding: 1rem 0.75rem;
          }
        }
        
        @media (max-width: 400px) {
          .sidebar {
            width: 100%;
          }
          
          .mobile-tab-title {
            max-width: 60px;
          }
          
          .tab-content {
            gap: 0.75rem;
          }
          
          .tab-icon {
            font-size: 1.1rem;
          }
        }
        
        /* Overlay for mobile sidebar */
        @media (max-width: 767px) {
          .main-layout.sidebar-open::before {
            content: '';
            position: fixed;
            top: 60px;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 800;
            animation: fadeIn 0.3s ease;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        }
        
        /* Accessibility improvements */
        .tab-button:focus {
          outline: 2px solid #667eea;
          outline-offset: 2px;
        }
        
        .menu-toggle:focus,
        .close-sidebar:focus {
          outline: 2px solid white;
          outline-offset: 2px;
        }
      `}</style>
    </Container>
  )
}

export default EnglishPractice