import { FC, lazy, memo, Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Container } from "react-bootstrap";
import LogoBox from "@/components/LogoBox";
import TopNavbar from "@/components/TopNavbar";
import useTenant from "@/utils/tenant";

const PostJobPage = lazy(() => import("@/app/post-job/page"));

interface TopNavigationBarProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

// Modal wrapping the public job-post form, so "Post a Job" opens in-place
// instead of navigating away from whatever the visitor was doing. Rendered
// via a portal straight into document.body — mounted inside the nav tree,
// `position: fixed` would resolve against whichever ancestor happens to
// establish a containing block (any transform/filter/etc in that chain), not
// the viewport, leaving it sized to a tiny box instead of covering the page.
const PostJobModal: FC<{ onClose: () => void }> = ({ onClose }) => {
  // Lock background scroll while open — otherwise the page behind and the
  // modal's own inner content both scroll independently, showing two bars.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prevOverflow; };
  }, []);

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(15,15,20,0.55)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "3vh 3vw" }}>
      <div style={{ width: "88vw", height: "94vh", maxWidth: 1720, background: "#f8fafc", borderRadius: 16, overflow: "hidden", boxShadow: "0 30px 80px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column" }}>
        <div className="post-job-modal-scroll" style={{ flex: 1, overflowY: "auto" }}>
          <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Loading…</div>}>
            <PostJobPage onClose={onClose} />
          </Suspense>
        </div>
      </div>
      <style>{`
        .post-job-modal-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .post-job-modal-scroll::-webkit-scrollbar { display: none; }
      `}</style>
    </div>,
    document.body
  );
};

// "For Employers" dropdown — houses the public job-posting link. A plain
// outlined button next to Login/Sign Up read as a third, competing CTA;
// tucking it under a dropdown reads more like a standard enterprise nav item.
const EmployersDropdown: FC = () => {
  const [open, setOpen] = useState(false);
  const [showPostJob, setShowPostJob] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div className="nav-employers-dropdown" ref={ref}>
      <button
        type="button"
        className="nav-employers-trigger"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        For Employers
        <svg className={`nav-employers-chevron${open ? " open" : ""}`} width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="nav-employers-menu" role="menu">
          <button
            type="button"
            className="nav-employers-item"
            role="menuitem"
            onClick={() => { setOpen(false); setShowPostJob(true); }}
          >
            <span className="nav-employers-item-title">Post a Job</span>
            <span className="nav-employers-item-sub">Reach students on Eklav</span>
          </button>
        </div>
      )}
      {showPostJob && <PostJobModal onClose={() => setShowPostJob(false)} />}
    </div>
  );
};

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
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.01em;
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
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.01em;
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
          .nav-login-btn, .nav-signup-btn, .nav-employers-trigger { transition: none; }
        }

        /* "For Employers" dropdown — houses the public job-post link */
        .nav-employers-dropdown {
          position: relative;
        }

        .nav-employers-trigger {
          display: flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.7);
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          padding: 6px 4px;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .nav-employers-trigger:hover {
          color: #fff;
        }

        .nav-employers-chevron {
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }

        .nav-employers-chevron.open {
          transform: rotate(180deg);
        }

        .nav-employers-menu {
          position: absolute;
          top: calc(100% + 12px);
          left: 50%;
          transform: translateX(-50%);
          min-width: 220px;
          background: #0c0c16;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.5);
          padding: 6px;
          z-index: 1060;
          animation: navEmployersFadeIn 0.15s ease;
        }

        @keyframes navEmployersFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .nav-employers-item {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
          width: 100%;
          background: transparent;
          border: none;
          border-radius: 7px;
          padding: 9px 12px;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .nav-employers-item:hover {
          background: rgba(255,122,0,0.1);
        }

        .nav-employers-item-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: #fff;
        }

        .nav-employers-item-sub {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.5);
        }
      `}</style>

      <Container
        fluid
        className="d-flex align-items-center justify-content-between px-4 px-xl-5"
        style={{ height: 60 }}
      >
        {/* Logo — auth nav is always dark so force white logo */}
        <LogoBox height={34} tenant={tenant} alwaysDark />

        {/* Actions */}
        <div className="d-flex align-items-center gap-3">
          <EmployersDropdown />
          {onLoginClick && (
            <button className="nav-login-btn" onClick={onLoginClick}>
              Log In
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
