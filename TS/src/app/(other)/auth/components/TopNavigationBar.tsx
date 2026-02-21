import { FC, memo, useState, Suspense, lazy } from "react";
import { Container, Button, Modal } from "react-bootstrap";
import LogoBox from "@/components/LogoBox";
import TopNavbar from "@/components/TopNavbar";

// Lazy load ONLY form components
const SignInForm = lazy(
  () => import("@/app/(other)/auth/sign-in/components/SignIn")
);

const SignUpForm = lazy(
  () => import("@/app/(other)/auth/sign-up/components/SingUpForm")
);

const TopNavigationBar: FC = memo(() => {
  const [showModal, setShowModal] = useState(false);
  const [authType, setAuthType] = useState<"signin" | "signup">("signin");

  const handleOpen = (type: "signin" | "signup") => {
    setAuthType(type);
    setShowModal(true);
  };

  const handleClose = () => setShowModal(false);

  return (
    <>
      <TopNavbar>
        <Container
          fluid
          className="d-flex align-items-center justify-content-between px-3 px-md-4"
          style={{ height: 64 }}
        >
          <LogoBox height={36} width={140} />

          <div className="d-flex align-items-center gap-3">
            <Button
              variant="link"
              className="text-white text-decoration-none fw-medium"
              onClick={() => handleOpen("signin")}
            >
              Login
            </Button>

            <Button
              variant="outline-light"
              className="rounded-pill px-4"
              onClick={() => handleOpen("signup")}
            >
              Sign Up
            </Button>
          </div>
        </Container>
      </TopNavbar>

      {/* AUTH MODAL */}
      <Modal
        show={showModal}
        onHide={handleClose}
        centered
        backdrop="static"
        size="xl"   // 🔥 Increased width
        dialogClassName="auth-modal-dialog"
        contentClassName="auth-modal-content"
      >
        {/* Header */}
        <div className="auth-modal-header">
          <h4 className="mb-0 fw-bold text-white">
            {authType === "signin"
              ? "Welcome Back 👋"
              : "Create Your Account 🚀"}
          </h4>

          <button className="auth-close-btn" onClick={handleClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <Modal.Body className="p-5">
          <Suspense
            fallback={
              <div className="text-center py-5">
                <span className="spinner-border text-warning" />
              </div>
            }
          >
            {authType === "signin" ? <SignInForm /> : <SignUpForm />}
          </Suspense>

          <div className="text-center mt-4">
            {authType === "signin" ? (
              <p className="mb-0 text-muted">
                Don’t have an account?{" "}
                <span
                  className="auth-switch"
                  onClick={() => setAuthType("signup")}
                >
                  Sign Up
                </span>
              </p>
            ) : (
              <p className="mb-0 text-muted">
                Already have an account?{" "}
                <span
                  className="auth-switch"
                  onClick={() => setAuthType("signin")}
                >
                  Login
                </span>
              </p>
            )}
          </div>
        </Modal.Body>
      </Modal>

      {/* HOMEPAGE MATCH STYLING */}
      <style>{`
        .auth-modal-dialog {
          max-width: 900px;  /* 🔥 Wider */
        }

        .auth-modal-content {
          border-radius: 22px;
          border: 1px solid rgba(255,255,255,0.05);
          background: linear-gradient(135deg, #1e2228 0%, #121417 100%);
          color: #ffffff;
          overflow: hidden;
          box-shadow: 
            0 30px 80px rgba(0,0,0,0.65),
            inset 0 1px 0 rgba(255,255,255,0.04);
          animation: modalFadeIn .25s ease;
        }

        .auth-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 28px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
        }

        .auth-close-btn {
          background: rgba(255,255,255,0.08);
          border: none;
          color: #fd692a;
          font-size: 16px;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          transition: all .25s ease;
        }

        .auth-close-btn:hover {
          background: #fd692a;
          color: white;
          transform: rotate(90deg) scale(1.05);
        }

        .auth-switch {
          color: #fd692a;
          font-weight: 600;
          cursor: pointer;
          transition: .2s;
        }

        .auth-switch:hover {
          color: #ff8a50;
          text-decoration: underline;
        }

        .modal-backdrop.show {
          backdrop-filter: blur(8px);
          background-color: rgba(2,6,23,0.75);
        }

        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(.94); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  );
});

TopNavigationBar.displayName = "TopNavigationBar";
export default TopNavigationBar;