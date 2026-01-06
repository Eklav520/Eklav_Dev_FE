import { Modal, Button, Badge } from 'react-bootstrap'
import { getRemainingTrialDays } from '../utils/trialUtils'
import { CSSProperties } from 'react'

type Props = {
    show: boolean
    onClose: () => void
}

const TrialWelcomeModal = ({ show, onClose }: Props) => {
    const daysLeft = getRemainingTrialDays()

    // Color palette
    const colors = {
        primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        warning: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
        danger: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
        info: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
        purple: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
        orange: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        darkBlue: 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)',
        teal: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
        coral: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
        lime: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)'
    }

    // Feature icons with different colors - separate array
    const featureColors = [
        colors.primary,
        colors.secondary,
        colors.success,
        colors.warning,
        colors.danger,
        colors.info,
        colors.purple
    ]

    // Inline styles for colorful glassmorphism effect
    const styles: { [key: string]: CSSProperties } = {
        modalContent: {
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%)',
            backdropFilter: 'blur(25px) saturate(200%)',
            WebkitBackdropFilter: 'blur(25px) saturate(200%)',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            borderRadius: '28px',
            boxShadow: '0 25px 60px rgba(102, 126, 234, 0.15), 0 10px 30px rgba(118, 75, 162, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
            overflow: 'hidden',
            position: 'relative',
        },
        decorativeCircle: {
            position: 'absolute',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.05) 70%, transparent 100%)',
            top: '-150px',
            right: '-100px',
            zIndex: 0,
        },
        badge: {
            background: daysLeft <= 3 ? colors.danger : colors.primary,
            border: '2px solid rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(12px)',
            borderRadius: '50px',
            padding: '12px 24px',
            fontSize: '0.95rem',
            fontWeight: '800',
            letterSpacing: '0.8px',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
        },
        card: {
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(248, 250, 252, 0.85) 100%)',
            backdropFilter: 'blur(15px)',
            border: '2px solid rgba(255, 255, 255, 0.5)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.1), 0 4px 16px rgba(118, 75, 162, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
            padding: '32px',
            marginBottom: '28px',
            position: 'relative',
            zIndex: 1,
        },
        featureItem: {
            display: 'flex',
            alignItems: 'center',
            padding: '16px 18px',
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
            borderRadius: '16px',
            transition: 'all 0.3s ease',
            border: '2px solid rgba(255, 255, 255, 0.8)',
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
        },
        // Default feature icon style
        featureIcon: {
            width: '52px',
            height: '52px',
            background: colors.primary, // Default color
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '18px',
            color: 'white',
            flexShrink: 0,
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
        },
        outlineButton: {
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
            border: '2px solid transparent',
            borderRadius: '16px',
            padding: '14px 32px',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(12px)',
            color: '#667eea',
            fontWeight: '700',
            fontSize: '1rem',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)',
            backgroundClip: 'padding-box',
        },
        primaryButton: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '16px',
            padding: '14px 36px',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 30px rgba(102, 126, 234, 0.5)',
            color: 'white',
            fontWeight: '700',
            fontSize: '1rem',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
        },
        alert: {
            background: 'linear-gradient(135deg, rgba(255, 240, 240, 0.9) 0%, rgba(254, 205, 211, 0.9) 100%)',
            border: '2px solid rgba(255, 200, 200, 0.5)',
            borderRadius: '16px',
            backdropFilter: 'blur(12px)',
            color: '#dc3545',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            fontWeight: '600',
            boxShadow: '0 4px 15px rgba(255, 0, 0, 0.1)',
        },
        iconWrapper: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '16px',
            color: 'white',
            width: '68px',
            height: '68px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
            marginRight: '20px',
        },
        decorativeDots: {
            position: 'absolute',
            width: '100px',
            height: '100px',
            background: 'radial-gradient(circle, rgba(102, 126, 234, 0.1) 2px, transparent 3px)',
            backgroundSize: '20px 20px',
            bottom: '20px',
            left: '20px',
            zIndex: 0,
        }
    }

    const features = [
        {
            title: 'Industry-Ready Courses',
            description: 'Structured learning paths',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 14L9.5 16.5L6 13M12 14L18 8M12 14L14.5 11.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        },
        {
            title: 'AI Mock Interviews',
            description: 'Personalized feedback & analysis',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        },
        {
            title: 'Technical Assessments',
            description: 'Coding, aptitude & reasoning tests',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 8L21 12M21 12L17 16M21 12H10M13 3H7C5.34315 3 4 4.34315 4 6V18C4 19.6569 5.34315 21 7 21H13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        },
        {
            title: 'English Preparation',
            description: 'Speaking, Listening, Writing',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M17 8V6C17 4.89543 16.1046 4 15 4H5C3.89543 4 3 4.89543 3 6V14C3 15.1046 3.89543 16 5 16H7M21 12C21 16.4183 16.9706 20 12 20C7.02944 20 3 16.4183 3 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        },
        {
            title: 'Resume Preparation',
            description: 'Prepare Professional Resumes',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14 2V8H20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 15L11 17L15 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        },
        {
            title: 'Job Posting',
            description: 'Freshers, Interns',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        }
    ]

    // Helper function to get feature icon style with specific color
    const getFeatureIconStyle = (index: number): CSSProperties => ({
        ...styles.featureIcon,
        background: featureColors[index % featureColors.length],
    })

    // Helper function for text styles
    const textStyles = {
        title: {
            background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
            WebkitBackgroundClip: 'text' as const,
            WebkitTextFillColor: 'transparent' as const,
            backgroundClip: 'text' as const,
            fontWeight: '700',
        },
        subtitle: {
            background: 'linear-gradient(135deg, #f95008 0%, #ff6b35 100%)',
            WebkitBackgroundClip: 'text' as const,
            WebkitTextFillColor: 'transparent' as const,
            backgroundClip: 'text' as const,
            fontWeight: '700',
        },
        gradientText: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 20%, #f093fb 40%, #f5576c 60%, #4facfe 80%, #00f2fe 100%)',
            WebkitBackgroundClip: 'text' as const,
            WebkitTextFillColor: 'transparent' as const,
            backgroundClip: 'text' as const,
            fontWeight: '800',
            padding: '0 4px',
        },
        featureTitle: {
            background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
            WebkitBackgroundClip: 'text' as const,
            WebkitTextFillColor: 'transparent' as const,
            backgroundClip: 'text' as const,
        },
        featureDescription: {
            background: 'linear-gradient(135deg, #718096 0%, #a0aec0 100%)',
            WebkitBackgroundClip: 'text' as const,
            WebkitTextFillColor: 'transparent' as const,
            backgroundClip: 'text' as const,
        },
    }

    return (
        <Modal
            show={show}
            centered
            backdrop="static"
            onHide={onClose}
            size="lg"
        >
            <div style={styles.modalContent}>
                {/* Decorative elements */}
                <div style={styles.decorativeCircle}></div>
                <div style={styles.decorativeDots}></div>
                
                <Modal.Header className="border-0 pb-0 pt-5">
                    <Modal.Title className="w-100">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div className="d-flex align-items-center">
                                <div style={styles.iconWrapper} className="me-3">
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="currentColor" />
                                        <path d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="mb-1 fw-bold" style={textStyles.title}>Welcome to Eklav Pro</h4>
                                    <p className="text-bold mb-0" style={textStyles.subtitle}>Premium Placement Platform • Trial Version</p>
                                </div>
                            </div>
                            <Badge
                                bg={daysLeft <= 3 ? "danger" : "primary"}
                                className="px-3 py-2 fs-6 fw-bold"
                                style={styles.badge}
                            >
                                {daysLeft} {daysLeft === 1 ? 'Day' : 'Days'} Remaining
                            </Badge>
                        </div>
                    </Modal.Title>
                </Modal.Header>

                <Modal.Body className="pt-1 pb-4">
                    <div style={styles.card}>
                        <p className="lead mb-4" style={{ lineHeight: '1.6', color: '#4a5568' }}>
                            You're currently experiencing our{' '}
                            <span style={textStyles.gradientText}>
                                15-day premium trial
                            </span>
                            . Access our complete suite of placement preparation tools designed to accelerate your career success.
                        </p>

                        <h6 className="fw-semibold mb-3" style={textStyles.featureTitle}>Trial Features Included:</h6>

                        <div className="row g-3 mt-2">
                            {features.map((feature, index) => (
                                <div className="col-md-6" key={index}>
                                    <div
                                        style={styles.featureItem}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(248, 250, 252, 1) 100%)'
                                            e.currentTarget.style.transform = 'translateY(-4px)'
                                            e.currentTarget.style.boxShadow = '0 12px 28px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(102, 126, 234, 0.1)'
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)'
                                            e.currentTarget.style.transform = 'translateY(0)'
                                            e.currentTarget.style.boxShadow = 'none'
                                        }}
                                    >
                                        <div style={getFeatureIconStyle(index)}>
                                            {feature.icon}
                                        </div>
                                        <div>
                                            <div className="fw-semibold" style={textStyles.featureTitle}>
                                                {feature.title}
                                            </div>
                                            <small className="text-semibold" style={textStyles.featureDescription}>
                                                {feature.description}
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {daysLeft <= 3 && (
                        <div style={styles.alert} className="mb-3">
                            <svg width="24" height="24" className="me-2 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 9V11M12 15H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0378 2.66667 10.268 4L3.33978 16C2.56998 17.3333 3.53223 19 5.07183 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div>
                                {daysLeft === 0
                                    ? "Your trial period has ended. Upgrade to continue accessing premium features and maximize your placement preparation."
                                    : `Limited time remaining! Only ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left in your trial. Upgrade now to maintain full access.`}
                            </div>
                        </div>
                    )}
                </Modal.Body>

                <Modal.Footer className="border-0 pt-0 pb-5 px-5">
                    <Button
                        variant="primary"
                        style={styles.primaryButton}
                        onClick={onClose}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'
                            e.currentTarget.style.boxShadow = '0 12px 35px rgba(102, 126, 234, 0.7)'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)'
                            e.currentTarget.style.boxShadow = '0 8px 30px rgba(102, 126, 234, 0.5)'
                        }}
                    >
                        Continue Exploring
                    </Button>
                </Modal.Footer>
            </div>

            {/* Add backdrop styles */}
            <style>
                {`
          .modal-backdrop.show {
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
          }
          
          .modal {
            backdrop-filter: blur(12px);
          }
          
          .modal-dialog {
            max-width: 750px;
            animation: modalSlideIn 0.4s ease-out;
          }
          
          @keyframes modalSlideIn {
            from {
              opacity: 0;
              transform: translateY(-20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          .modal-content {
            animation: contentFadeIn 0.3s ease-out 0.1s both;
          }
          
          @keyframes contentFadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @media (max-width: 768px) {
            .modal-dialog {
              margin: 16px;
              max-width: calc(100% - 32px);
            }
            
            .modal-content {
              margin: 0;
            }
            
            .d-flex.justify-content-between.align-items-center {
              flex-direction: column;
              align-items: flex-start !important;
            }
            
            .d-flex.justify-content-between.align-items-center .badge {
              margin-top: 12px;
              align-self: flex-start;
            }
            
            .modal-footer {
              flex-direction: column;
              gap: 12px;
            }
            
            .modal-footer .btn {
              width: 100%;
              margin: 0 !important;
            }
          }
        `}
            </style>
        </Modal>
    )
}

export default TrialWelcomeModal