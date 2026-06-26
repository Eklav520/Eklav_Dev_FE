import { FC, memo } from "react";
import { Container } from "react-bootstrap";
import LogoBox from "@/components/LogoBox";
import TopNavbar from "@/components/TopNavbar";
import useTenant from "@/utils/tenant";

interface TopNavigationBarProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

const TopNavigationBar: FC<TopNavigationBarProps> = memo(({ onLoginClick, onSignupClick }) => {
  const tenant = useTenant();
  return (
    <TopNavbar className="futuristic-nav">
      <style>{`
        /* ── Futuristic Navbar ── */
        .futuristic-nav,
        .futuristic-nav.navbar-sticky,
        .futuristic-nav.header-static,
        .futuristic-nav.navbar-sticky-on {
          background: rgba(4, 4, 14, 0.88) !important;
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: none !important;
          box-shadow: none !important;
          position: relative;
          z-index: 1050;
        }

        .futuristic-nav::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 50% 0%, rgba(255,122,0,0.06) 0%, transparent 60%);
          pointer-events: none;
          z-index: 0;
        }

        .futuristic-nav .navbar,
        .futuristic-nav .navbar-expand-xl {
          border: none !important;
          box-shadow: none !important;
          position: relative;
          z-index: 1;
        }

        /* Single controlled bottom line */
        .futuristic-nav::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(255,122,0,0.55) 30%, rgba(255,122,0,0.55) 70%, transparent 100%);
          z-index: 10;
          pointer-events: none;
        }



        /* Login button */
        .nav-login-btn {
          position: relative;
          background: transparent;
          border: 1px solid rgba(255,122,0,0.4);
          color: #ff7a00;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 6px 20px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.25s ease;
          overflow: hidden;
        }

        .nav-login-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,122,0,0.12), transparent);
          opacity: 0;
          transition: opacity 0.25s ease;
        }

        .nav-login-btn:hover {
          border-color: rgba(255,122,0,0.8);
          color: #ffb347;
          box-shadow: 0 0 18px rgba(255,122,0,0.3), inset 0 0 12px rgba(255,122,0,0.08);
          transform: translateY(-1px);
        }

        .nav-login-btn:hover::before { opacity: 1; }

        /* Sign Up button */
        .nav-signup-btn {
          position: relative;
          background: linear-gradient(135deg, #ff7a00, #ffb347);
          border: none;
          color: #fff;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 6px 22px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.25s ease;
          overflow: hidden;
        }

        .nav-signup-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0;
          transition: opacity 0.25s ease;
        }

        .nav-signup-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(255,122,0,0.45);
        }

        .nav-signup-btn:hover::after { opacity: 1; }

        @media (prefers-reduced-motion: reduce) {
          .nav-login-btn, .nav-signup-btn { transition: none; }
        }
      `}</style>

      <Container
        fluid
        className="d-flex align-items-center justify-content-between px-4 px-xl-5"
        style={{ height: 60 }}
      >
        {/* Logo */}
        <LogoBox height={34} tenant={tenant} />

        {/* Actions */}
        <div className="d-flex align-items-center gap-3">
          {onLoginClick && (
            <button className="nav-login-btn" onClick={onLoginClick}>
              Login
            </button>
          )}
          {onSignupClick && (
            <button className="nav-signup-btn" onClick={onSignupClick}>
              Sign Up
            </button>
          )}
        </div>
      </Container>
    </TopNavbar>
  );
});

TopNavigationBar.displayName = "TopNavigationBar";
export default TopNavigationBar;
