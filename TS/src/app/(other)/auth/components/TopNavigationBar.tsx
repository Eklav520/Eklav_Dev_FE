import { FC, memo } from "react";
import { Container, Button } from "react-bootstrap";
import LogoBox from "@/components/LogoBox";
import TopNavbar from "@/components/TopNavbar";
import useTenant from "@/utils/tenant";

// Define the props interface
interface TopNavigationBarProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

const TopNavigationBar: FC<TopNavigationBarProps> = memo(({ onLoginClick, onSignupClick }) => {
  const tenant = useTenant();
  return (
    <TopNavbar>
      <Container
        fluid
        className="d-flex align-items-center justify-content-between px-3 px-md-4"
        style={{ height: 64 }}
      >
        <LogoBox height={36} width={140} tenant={tenant}/>

        <div className="d-flex align-items-center gap-3">
          <Button
            variant="link"
            className="fw-semibold text-decoration-none nav-login-btn"
            onClick={onLoginClick}
          >
            Login
          </Button>

          <Button
            className="rounded-pill px-4 nav-signup-btn"
            onClick={onSignupClick}
          >
            Sign Up
          </Button>
        </div>
      </Container>

      <style>{`
        .nav-login-btn {
          color: #fd692a;
          font-weight: 600;
          background: transparent;
          border: none;
          padding: 0.5rem 1rem;
        }

        .nav-login-btn:hover {
          color: #ff8a50;
          text-decoration: underline;
        }

        .nav-signup-btn {
          background: linear-gradient(135deg, #fd692a 0%, #ff8a50 100%);
          border: none;
          color: #ffffff;
          font-weight: 600;
          padding: 0.5rem 1.5rem;
          border-radius: 50px;
          transition: all .25s ease;
        }

        .nav-signup-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(253,105,42,0.35);
        }

        @media (prefers-reduced-motion: reduce) {
          .nav-signup-btn {
            transition: none;
          }
        }
      `}</style>
    </TopNavbar>
  );
});

TopNavigationBar.displayName = "TopNavigationBar";
export default TopNavigationBar;