import { FC, lazy, memo, Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Container } from "react-bootstrap";
import LogoBox from "@/components/LogoBox";
import TopNavbar from "@/components/TopNavbar";
import useTenant from "@/utils/tenant";
import brainovisionLogo from "@/assets/images/partners/brainovision-logo.png";

// Shared with the <LogoBox height={...}> below, so the Brainovision badge is
// always sized proportionally to the actual Eklav logo instead of an
// independent fixed value that can drift out of balance with it. 36 (not 34)
// to match the theme's own .navbar-brand-item { height: $navbar-brand-height }
// SCSS rule, which overrides the height prop anyway.
const EKLAV_LOGO_HEIGHT = 36;
// logo_white.png has ~211px of fully transparent padding baked into its right
// edge (19% of its 1093px width) — invisible, but the <img> still lays out at
// its full canvas width, which was the real source of the big gap after
// "Eklav" that no margin/padding tweak could remove. This is the logo's
// actual non-transparent content width (x:7–881) as a fraction of its height,
// used below to clip that dead space out visually via an overflow:hidden
// wrapper instead of margin/padding.
const EKLAV_LOGO_CONTENT_RATIO = (881 - 7) / 228;
// The Brainovision logo's own artwork has more empty vertical padding baked
// into the PNG than the Eklav wordmark does, so matching heights exactly made
// it read as smaller — this scales it up a bit to compensate and keep both
// looking visually balanced.
const BRAINOVISION_LOGO_HEIGHT = Math.round(EKLAV_LOGO_HEIGHT * 1.3);

// Partner-brand badge shown next to the logo — a fixed Eklav/Brainovision
// partnership credit, not tenant-specific, so it's unaffected by white-label
// tenant branding. The logo already contains the brand name, so no separate
// "Brainovision" text is needed alongside it.
const PoweredByBadge: FC = () => (
  <div className="nav-powered-by">
    <span className="nav-powered-by-divider" />
    <span className="nav-powered-by-text">Powered by</span>
    <img
      src={brainovisionLogo}
      alt="Brainovision"
      className="nav-powered-by-logo"
      style={{ height: BRAINOVISION_LOGO_HEIGHT }}
    />
  </div>
);

const PostJobPage = lazy(() => import("@/app/post-job/page"));

interface TopNavigationBarProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
  showForEmployers?: boolean;
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

const TopNavigationBar: FC<TopNavigationBarProps> = memo(({ onLoginClick, onSignupClick, showForEmployers = true }) => {
  const tenant = useTenant();
  // The fixed-width crop below only matches the default logo_white.png's
  // baked-in dead space — a white-label tenant's own logo/text renders at
  // its own natural width, so forcing it into that same fixed box leaves a
  // gap (narrower logo) or clips it (wider logo). Only crop for the default.
  const isDefaultEklav = !tenant?.name || tenant.name.trim().toLowerCase() === "eklav";
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

        /* Bootstrap's .navbar-brand ships a built-in margin-right: 1rem — that was
           the actual source of the big gap after the logo, not the badge's own
           spacing next to it. */
        .futuristic-nav .navbar-brand {
          margin-right: 0 !important;
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

        /* "Powered by Brainovision" badge */
        .nav-powered-by {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-left: 0;
          padding-left: 20px;
        }

        .nav-powered-by-divider {
          width: 2px;
          height: 28px;
          background: rgba(255,255,255,0.45);
          border-radius: 1px;
          flex-shrink: 0;
        }

        .nav-powered-by-text {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.75);
          font-weight: 500;
          white-space: nowrap;
        }

        .nav-powered-by-logo {
          /* height is set inline from BRAINOVISION_LOGO_HEIGHT, scaled off the
             actual Eklav logo height so the two stay visually balanced */
          width: auto;
          flex-shrink: 0;
          border-radius: 4px;
          box-shadow: 0 0 10px rgba(255,255,255,0.12);
        }

        @media (max-width: 767px) {
          .futuristic-nav .nav-container {
            height: auto !important;
            min-height: 56px;
            padding-right: 12px !important;
            padding-left: 12px !important;
          }

          .nav-powered-by-text { display: none; }
          .nav-powered-by { gap: 6px; margin-left: 10px; padding-left: 10px; }
          .nav-actions { gap: 8px !important; }
          .nav-login-btn,
          .nav-signup-btn {
            padding: 6px 10px;
            font-size: 0.75rem;
          }
          .nav-employers-trigger {
            gap: 4px;
            padding: 6px 0;
            font-size: 0.7rem;
          }
          .nav-brand-group .navbar-brand-item { height: 26px !important; }
          .nav-logo-crop { width: 100px !important; height: 26px !important; }
        }

        @media (max-width: 520px) {
          .nav-powered-by { display: none; }
        }

        @media (max-width: 380px) {
          .futuristic-nav .nav-container {
            justify-content: center !important;
            row-gap: 8px;
            padding-top: 8px;
            padding-bottom: 8px;
          }

          .nav-brand-group,
          .nav-actions {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      <Container
        fluid
        className="nav-container d-flex align-items-center justify-content-between px-4 px-xl-5"
        style={{ height: 60 }}
      >
        {/* Logo — auth nav is always dark so force white logo. Clipped to the
            logo's real content width (see EKLAV_LOGO_CONTENT_RATIO above) —
            the source PNG has ~19% dead transparent space on its right edge
            that otherwise renders as a big gap before the badge. */}
        <div className="nav-brand-group d-flex align-items-center">
          {isDefaultEklav ? (
            <div className="nav-logo-crop" style={{ height: EKLAV_LOGO_HEIGHT, width: EKLAV_LOGO_HEIGHT * EKLAV_LOGO_CONTENT_RATIO, overflow: "hidden", display: "flex", alignItems: "center", flexShrink: 0 }}>
              <LogoBox height={EKLAV_LOGO_HEIGHT} tenant={tenant} alwaysDark />
            </div>
          ) : (
            <LogoBox height={EKLAV_LOGO_HEIGHT} tenant={tenant} alwaysDark />
          )}
          <PoweredByBadge />
        </div>

        {/* Actions */}
        <div className="nav-actions d-flex align-items-center gap-3">
          {showForEmployers && <EmployersDropdown />}
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
