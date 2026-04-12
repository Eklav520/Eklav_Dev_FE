// JobNotificationsSection.tsx - Dark Theme Version
import React, { useEffect, useState } from 'react'
import { Card, Badge, Button, Spinner, Alert } from 'react-bootstrap'
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  ExternalLink, 
  IndianRupee,
  Sparkles,
  ArrowRight,
  Building2,
  TrendingUp,
  Eye,
  Calendar
} from 'lucide-react'
import { useAuthContext } from '@/context/useAuthContext'

interface Job {
  _id: string
  title: string
  company: string
  location: string
  salary: string
  jobType: string
  domain: string
  postedDate: string
  expiryDate: string
  isExpired: boolean
  logo?: string
  skills?: string[]
  highlights?: string[]
}

const JobNotificationsSection: React.FC = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL
  const { user } = useAuthContext()
  const token = user?.token

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      fetchRecentJobs()
    }
  }, [token])

  const fetchRecentJobs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`${baseURL}/jobs/student`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Failed to fetch jobs')
      
      const data = await response.json()
      
      // Handle different response formats
      let allJobs: Job[] = []
      if (Array.isArray(data)) {
        allJobs = data
      } else if (data?.jobs && Array.isArray(data.jobs)) {
        allJobs = data.jobs
      } else if (data?.data && Array.isArray(data.data)) {
        allJobs = data.data
      } else if (data?.results && Array.isArray(data.results)) {
        allJobs = data.results
      }
      
      const tenDaysAgo = new Date()
      tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)
      
      const recentJobs = allJobs.filter(job => {
        const postedDate = new Date(job.postedDate)
        return postedDate >= tenDaysAgo && !job.isExpired
      })
      
      const shuffled = [...recentJobs].sort(() => 0.5 - Math.random())
      const selectedJobs = shuffled.slice(0, Math.min(3, shuffled.length))
      
      setJobs(selectedJobs)
    } catch (err: any) {
      console.error('Error fetching jobs:', err)
      setError(err.message)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const getTimeAgo = (dateString: string) => {
    const posted = new Date(dateString)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Yesterday'
    return `${diffDays}d ago`
  }

  const formatSalary = (salary: string) => {
    if (!salary) return null
    return salary
  }

  if (loading) {
    return (
      <Card className="job-notification-dark mb-4">
        <Card.Body className="py-4">
          <div className="d-flex align-items-center justify-content-center gap-3">
            <div className="dark-spinner"></div>
            <span className="text-light-muted">Loading latest opportunities...</span>
          </div>
        </Card.Body>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="job-notification-dark mb-4">
        <Card.Body className="py-4">
          <Alert variant="danger" className="mb-0 text-center bg-transparent text-danger border-danger">
            Unable to load opportunities. Please try again later.
          </Alert>
        </Card.Body>
      </Card>
    )
  }

  return (
    <Card className="job-notification-dark mb-4">
      {/* Header */}
      <div className="dark-header">
        <div className="header-left-section">
          <div className="header-icon-dark">
            <Sparkles size={20} fill="#ff7a00" stroke="#ff7a00" />
          </div>
          <div>
            <h5 className="header-title-dark">Latest Opportunities</h5>
            <p className="header-subtitle-dark">Posted in last 10 days</p>
          </div>
        </div>
        <div className="header-badge-dark">
          <span className="badge-number-dark">{jobs.length}</span>
          <span className="badge-label-dark">New</span>
        </div>
      </div>

      {/* Jobs Grid */}
      {jobs.length === 0 ? (
        <div className="empty-state-dark">
          <Briefcase size={48} strokeWidth={1.5} />
          <h6 className="empty-title-dark">No new opportunities</h6>
          <p className="empty-description-dark">Check back later for latest job postings</p>
        </div>
      ) : (
        <>
          <div className="jobs-grid-dark">
            {jobs.map((job) => {
              const timeAgo = getTimeAgo(job.postedDate)
              const isUrgent = timeAgo === 'Just now' || timeAgo === '1h ago'
              
              return (
                <div key={job._id} className="job-card-dark">
                  <div className="job-card-inner-dark">
                    <div className="company-icon-dark">
                      <Building2 size={22} />
                    </div>
                    
                    <div className="job-content-dark">
                      <div className="job-title-section-dark">
                        <div className="job-title-left-dark">
                          <h6 className="job-title-dark">{job.title}</h6>
                          {isUrgent && (
                            <span className="urgent-tag-dark">
                              <TrendingUp size={10} />
                              Urgent
                            </span>
                          )}
                        </div>

                        <Button
                          variant="link"
                          className="view-btn-dark"
                          onClick={() => window.open('/student/interview-details', '_blank')}
                        >
                          <Eye size={16} />
                          <span>View</span>
                        </Button>
                      </div>
                      
                      <p className="company-name-dark">{job.company}</p>
                      
                      <div className="job-tags-dark">
                        {job.location && (
                          <span className="tag-dark">
                            <MapPin size={10} />
                            {job.location}
                          </span>
                        )}
                        {formatSalary(job.salary) && (
                          <span className="tag-dark salary-tag-dark">
                            <IndianRupee size={10} />
                            {formatSalary(job.salary)}
                          </span>
                        )}
                        <span className="tag-dark type-tag-dark">
                          {job.jobType || 'Fresher'}
                        </span>
                        <span className="tag-dark time-tag-dark">
                          <Clock size={10} />
                          {timeAgo}
                        </span>
                      </div>
                    </div>
                    
                  </div>
                </div>
              )
            })}
          </div>
          
          {/* Footer */}
          <div className="dark-footer">
            <Button
              variant="link"
              className="view-all-dark"
              onClick={() => window.open('/student/interview-details', '_blank')}
            >
              <span>View all opportunities</span>
              <ArrowRight size={16} />
            </Button>
          </div>
        </>
      )}

      <style>{`
        .job-notification-dark {
          background: #000000 !important;
          border: 1px solid #1a1a1a !important;
          border-radius: 16px !important;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .job-notification-dark:hover {
          border-color: #ff7a00 !important;
          box-shadow: 0 4px 20px rgba(255, 122, 0, 0.1);
        }

        /* Dark Header */
        .dark-header {
          background: #0a0a0a;
          padding: 1rem 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #ff7a00;
        }

        .header-left-section {
          display: flex;
          align-items: center;
          gap: 0.875rem;
        }

        .header-icon-dark {
          width: 40px;
          height: 40px;
          background: rgba(255, 122, 0, 0.15);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-title-dark {
          color: #ffffff !important;
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
          letter-spacing: -0.3px;
        }

        .header-subtitle-dark {
          color: #8a8a8a !important;
          font-size: 0.7rem;
          margin: 0.2rem 0 0 0;
        }

        .header-badge-dark {
          background: rgba(255, 122, 0, 0.15);
          border-radius: 24px;
          padding: 0.3rem 0.9rem;
          border: 1px solid rgba(255, 122, 0, 0.3);
        }

        .badge-number-dark {
          color: #ff7a00 !important;
          font-size: 1rem;
          font-weight: 700;
          margin-right: 0.25rem;
        }

        .badge-label-dark {
          color: #ff7a00 !important;
          font-size: 0.7rem;
          font-weight: 500;
        }

        /* Jobs Grid Dark */
        .jobs-grid-dark {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
          padding: 1.25rem;
          background: #000000;
        }

        .job-card-dark {
          transition: all 0.2s ease;
        }

        .job-card-inner-dark {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: #0a0a0a;
          border: 1px solid #1a1a1a;
          border-radius: 14px;
          transition: all 0.2s ease;
          height: 100%;
        }

        .job-card-inner-dark:hover {
          background: #0f0f0f;
          border-color: #ff7a00;
          transform: translateY(-2px);
        }

        .company-icon-dark {
          width: 48px;
          height: 48px;
          background: rgba(255, 122, 0, 0.1);
          border: 1px solid rgba(255, 122, 0, 0.3);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ff7a00;
          flex-shrink: 0;
        }

        .job-content-dark {
          flex: 1;
          min-width: 0;
        }

        .job-title-section-dark {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.25rem;
        }

        .job-title-left-dark {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          min-width: 0;
        }

        .job-title-dark {
          font-size: 0.9rem;
          font-weight: 600;
          color: #ffffff !important;
          margin: 0;
          line-height: 1.3;
        }

        .urgent-tag-dark {
          background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%);
          color: white;
          font-size: 0.6rem;
          padding: 0.2rem 0.5rem;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
          white-space: nowrap;
        }

        .company-name-dark {
          font-size: 0.7rem;
          color: #8a8a8a !important;
          margin: 0 0 0.6rem 0;
          font-weight: 500;
        }

        .job-tags-dark {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          align-items: center;
        }

        .tag-dark {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.6rem;
          padding: 0.25rem 0.6rem;
          border-radius: 20px;
          background: #141414;
          color: #b0b0b0;
          white-space: nowrap;
          border: 1px solid #2a2a2a;
        }

        .salary-tag-dark {
          color: #4caf50 !important;
          background: rgba(76, 175, 80, 0.1);
          border-color: rgba(76, 175, 80, 0.3);
        }

        .type-tag-dark {
          background: rgba(25, 118, 210, 0.1);
          color: #42a5f5 !important;
          border-color: rgba(66, 165, 245, 0.3);
        }

        .time-tag-dark {
          background: #141414;
          color: #b0b0b0;
        }

        .view-btn-dark {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          color: #ff7a00 !important;
          padding: 0.3rem 0.65rem;
          font-size: 0.75rem;
          font-weight: 500;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s ease;
          white-space: nowrap;
          flex-shrink: 0;
          background: rgba(255, 122, 0, 0.05);
          margin-left: auto;
        }

        .view-btn-dark:hover {
          background: rgba(255, 122, 0, 0.15);
          color: #ff944d !important;
          gap: 0.5rem;
        }

        /* Empty State Dark */
        .empty-state-dark {
          text-align: center;
          padding: 3rem 1.5rem;
          background: #000000;
        }

        .empty-state-dark svg {
          color: #2a2a2a;
          margin-bottom: 1rem;
        }

        .empty-title-dark {
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff !important;
          margin-bottom: 0.5rem;
        }

        .empty-description-dark {
          font-size: 0.8rem;
          color: #8a8a8a !important;
          margin: 0;
        }

        /* Footer Dark */
        .dark-footer {
          padding: 0.75rem 1.25rem;
          border-top: 1px solid #1a1a1a;
          background: #0a0a0a;
          text-align: center;
        }

        .view-all-dark {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #ff7a00 !important;
          font-size: 0.8rem;
          font-weight: 600;
          text-decoration: none;
          padding: 0.4rem 1rem;
          border-radius: 20px;
          transition: all 0.2s ease;
        }

        .view-all-dark:hover {
          gap: 0.75rem;
          color: #ff944d !important;
          background: rgba(255, 122, 0, 0.1);
          text-decoration: none;
        }

        /* Loading Spinner Dark */
        .dark-spinner {
          width: 30px;
          height: 30px;
          border: 2px solid #2a2a2a;
          border-top: 2px solid #ff7a00;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .text-light-muted {
          color: #8a8a8a !important;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .jobs-grid-dark {
            grid-template-columns: 1fr;
            padding: 1rem;
            gap: 0.75rem;
          }
          
          .dark-header {
            padding: 0.875rem 1rem;
          }
          
          .header-icon-dark {
            width: 34px;
            height: 34px;
          }
          
          .header-title-dark {
            font-size: 0.9rem;
          }
          
          .job-card-inner-dark {
            padding: 0.875rem;
          }
          
          .company-icon-dark {
            width: 40px;
            height: 40px;
          }
          
          .job-title-dark {
            font-size: 0.85rem;
          }

          .job-title-section-dark {
            gap: 0.5rem;
          }

          .view-btn-dark {
            padding: 0.25rem 0.55rem;
            font-size: 0.7rem;
          }
        }
      `}</style>
    </Card>
  )
}

export default JobNotificationsSection