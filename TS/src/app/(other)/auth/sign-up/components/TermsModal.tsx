import React from 'react'
import { Modal, Button } from 'react-bootstrap'

interface TermsModalProps {
  show: boolean
  onHide: () => void
  onAccept: () => void
}

const TermsModal: React.FC<TermsModalProps> = ({ show, onHide, onAccept }) => {
  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      scrollable
    >
      <Modal.Header closeButton>
        <Modal.Title>Terms of Service & Privacy Policy</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-4">
          <h5>Terms of Service</h5>
          <p>Last Updated: {new Date().toLocaleDateString()}</p>
          
          <h6>1. Acceptance of Terms</h6>
          <p>
            By accessing and using this platform, you accept and agree to be bound by the terms 
            and provision of this agreement. Your use of the platform constitutes acceptance of 
            these terms.
          </p>
          
          <h6>2. User Responsibilities</h6>
          <p>
            You are responsible for maintaining the confidentiality of your account and password. 
            You agree to accept responsibility for all activities that occur under your account.
          </p>
          
          <h6>3. Content Guidelines</h6>
          <p>
            Users must not post inappropriate, offensive, or illegal content. We reserve the 
            right to remove any content and suspend accounts that violate our guidelines.
          </p>
          
          <h6>4. Intellectual Property</h6>
          <p>
            All content on this platform, including text, graphics, logos, and software, is the 
            property of the platform and protected by intellectual property laws.
          </p>
          
          <hr className="my-4" />
          
          <h5>Privacy Policy</h5>
          
          <h6>1. Information We Collect</h6>
          <p>
            We collect information you provide directly, such as when you create an account, 
            including your name, email address, phone number, and academic information.
          </p>
          
          <h6>2. How We Use Your Information</h6>
          <p>
            We use your information to provide, maintain, and improve our services, communicate 
            with you, and ensure platform security.
          </p>
          
          <h6>3. Data Security</h6>
          <p>
            We implement appropriate security measures to protect your personal information. 
            However, no method of transmission over the Internet is 100% secure.
          </p>
          
          <h6>4. Your Rights</h6>
          <p>
            You have the right to access, correct, or delete your personal information. 
            Contact us at support@example.com for assistance.
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onAccept}>
          I Accept Terms
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default TermsModal