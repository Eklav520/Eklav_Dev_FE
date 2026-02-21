import { Modal } from "react-bootstrap";

interface Props {
  type: "login" | "register";
  onClose: () => void;
  onSuccess?: () => void;
  children: React.ReactNode;
}

const AuthModal = ({ type, onClose, onSuccess, children }: Props) => {
  return (
    <Modal 
      show 
      onHide={onClose} 
      centered 
      size="lg"
      className="auth-modal"
    >
      <style>{`
        .auth-modal .modal-content {
          background: linear-gradient(135deg, #1e2228 0%, #121417 100%);
          border: 1px solid rgba(255, 152, 0, 0.2);
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }

        .auth-modal .modal-header {
          border-bottom: 1px solid rgba(255, 152, 0, 0.2);
          padding: 1.5rem;
        }

        .auth-modal .modal-title {
          color: white;
          font-size: 24px;
          font-weight: 600;
          background: linear-gradient(135deg, #fff 0%, #ff9800 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .auth-modal .btn-close {
          filter: brightness(0) invert(1);
          opacity: 0.8;
          transition: all 0.2s ease;
        }

        .auth-modal .btn-close:hover {
          opacity: 1;
          transform: scale(1.1);
        }

        .auth-modal .modal-body {
          padding: 2rem;
        }

        /* Orange Button Styling */
        .btn.orange-btn {
          background-color: #fd692a !important;
          border-color: #fd692a !important;
          color: #fff !important;
          font-weight: 600;
          transition: all .2s ease;
        }

        .btn.orange-btn:hover {
          background-color: #e85c1f !important;
          border-color: #e85c1f !important;
          transform: translateY(-1px);
        }

        .btn.orange-btn:disabled {
          background-color: #fd692a80 !important;
          border-color: #fd692a80 !important;
        }

        /* Orange Link */
        .orange-link {
          color: #fd692a !important;
          cursor: pointer;
          transition: .2s;
        }

        .orange-link:hover {
          color: #ff7d47 !important;
          text-decoration: underline;
        }

        /* Input Focus */
        .form-control:focus {
          border-color: #fd692a !important;
          box-shadow: 0 0 0 .2rem rgba(253,105,42,.25) !important;
        }
      `}</style>

      <Modal.Header closeButton>
        <Modal.Title>
          {type === "login" ? "Welcome Back! 👋" : "Join Eklav Today! 🚀"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {children}
      </Modal.Body>
    </Modal>
  );
};

export default AuthModal;