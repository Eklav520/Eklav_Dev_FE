import { Link } from 'react-router-dom'
import { Col, Container, Row } from 'react-bootstrap'
import { FaFacebook, FaInstagram, FaLinkedinIn, FaApple, FaGooglePlay } from 'react-icons/fa'
import { FaXTwitter } from 'react-icons/fa6'
import logoLight from '@/assets/images/logo_white.png'
import useTenant from '@/utils/tenant'

const Footer = () => {
  const tenant = useTenant()

  const tenantName = tenant?.name?.trim() || "Eklav"
  const tenantLogo = tenant?.logo
  const themeColor = tenant?.themeColor || "#f97316"

  const isDefaultEklav = tenantName.toLowerCase() === "eklav"

  return (
    <footer className="footer-section w-100">
      <style>{`
        .footer-section {
          background: #030308;
          padding: 72px 0 28px;
          position: relative;
          z-index: 2;
          border-top: 1px solid rgba(255,122,0,0.12);
          width: 100%;
          overflow: hidden;
        }
        .footer-section::before {
          content:'';
          position:absolute;inset:0;
          background:
            radial-gradient(ellipse at 20% 0%,rgba(255,122,0,0.06) 0%,transparent 50%),
            radial-gradient(ellipse at 80% 100%,rgba(0,212,255,0.04) 0%,transparent 50%);
          pointer-events:none;z-index:0;
        }
        .footer-hex {
          position:absolute;inset:0;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 0L56 16v48L28 80 0 64V16Z' fill='none' stroke='rgba(255,122,0,0.03)' stroke-width='0.5'/%3E%3C/svg%3E");
          background-size:56px 100px;z-index:0;pointer-events:none;
        }

        /* Footer Links */
        .footer-links { margin-bottom: 48px; position:relative;z-index:1; }
        .footer-links > .footer-column { display:flex;flex-direction:column;align-items:flex-start; }
        .footer-column { margin-bottom: 28px; }
        .footer-column-title {
          color: #fff;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 20px;
          position: relative;
          padding-bottom: 12px;
        }
        .footer-column-title::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0;
          width: 28px; height: 2px;
          background: linear-gradient(90deg,#ff7a00,transparent);
          border-radius:2px;
        }
        .footer-links-list { list-style:none;padding:0;margin:0; }
        .footer-links-list li { margin-bottom: 10px; }
        .footer-links-list a {
          color: #4a5568;
          text-decoration: none;
          transition: all 0.25s ease;
          font-size: 0.85rem;
          display:inline-flex;align-items:center;gap:6px;
        }
        .footer-links-list a::before {
          content:'›';color:#ff7a00;opacity:0;transition:opacity 0.25s ease,transform 0.25s ease;
          transform:translateX(-4px);
        }
        .footer-links-list a:hover { color:#ff7a00;padding-left:4px; }
        .footer-links-list a:hover::before { opacity:1;transform:translateX(0); }

        /* Contact Info */
        .contact-info { color:#4a5568;font-size:0.85rem;line-height:2; }
        .contact-info a { color:#ff7a00;text-decoration:none; }
        .contact-info a:hover { text-decoration:underline; }
        .made-with { display:flex;align-items:center;gap:5px;color:#4a5568;font-size:0.82rem;margin-top:4px; }
        .made-with svg { color:#ff7a00;animation:ft-heartbeat 1.5s ease infinite; }
        @keyframes ft-heartbeat { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }

        /* Divider */
        .footer-divider {
          height:1px;
          background:linear-gradient(90deg,transparent,rgba(255,122,0,0.2),rgba(0,212,255,0.15),transparent);
          margin-bottom:32px;position:relative;z-index:1;
        }

        /* Footer Bottom */
        .footer-bottom { position:relative;z-index:1; }
        .footer-logo { transition:transform 0.3s ease; }
        .footer-logo:hover { transform:translateY(-2px); }
        .copyright-text { color:#2d3748;font-size:0.8rem; }
        .copyright-text .highlight { color:#ff7a00;font-weight:600; }

        /* Social Icons */
        .social-list { display:flex;justify-content:flex-end;gap:10px;margin:0;padding:0; }
        .social-item { list-style:none; }
        .social-link {
          display:flex;align-items:center;justify-content:center;
          width:38px;height:38px;border-radius:50%;
          background:rgba(255,255,255,0.03);color:#4a5568;font-size:16px;
          transition:all 0.3s ease;
          border:1px solid rgba(255,255,255,0.06);
        }
        .social-link:hover {
          background:linear-gradient(135deg,#ff7a00,#ffb347);
          transform:translateY(-3px);color:#fff;border-color:transparent;
          box-shadow:0 6px 20px rgba(255,122,0,0.35);
        }

        /* Tenant Logo Text */
        .tenant-logo-text { font-size:20px;font-weight:800;display:flex;align-items:center;letter-spacing:0.5px; }
        .tenant-logo-primary { margin-right:2px; }
        .tenant-logo-secondary { color:#ffffff; }

        /* Responsive */
        @media(max-width:768px){
          .footer-column { text-align:center; }
          .footer-column-title::after { left:50%;transform:translateX(-50%); }
          .footer-links > .footer-column { align-items:center; }
          .social-list { justify-content:center;margin-top:20px; }
          .footer-logo,.copyright-text { text-align:center;margin-bottom:12px; }
          .made-with { justify-content:center; }
        }
        @media(max-width:576px){
          .footer-section{padding:48px 0 20px}
          .tenant-logo-text{font-size:18px}
        }
      `}</style>
      <div className="footer-hex" />

      <Container>
        {/* CTA Section */}
        {/* <div className="cta-section">
          <h2 className="cta-title">Ready to Transform Your Career {tenantName}?</h2>
          <p className="cta-description">
            Explore our course bundles designed to take you from beginner to job-ready,
            with skills that top companies demand.
          </p>
          <Link to="#" className="cta-button">
            EXPLORE COURSE BUNDLES
          </Link>

          <div className="app-buttons">
            <a href="#" className="app-button">
              <FaApple />
              <span>Download on the App Store</span>
            </a>
            <a href="#" className="app-button">
              <FaGooglePlay />
              <span>GET IT ON Google Play</span>
            </a>
          </div>
        </div> */}

        {/* Footer Links */}
        <Row className="footer-links justify-content-center align-items-start g-4">
          <Col md={3} sm={6} className="footer-column">
            <h4 className="footer-column-title">AI Based Courses</h4>
            <ul className="footer-links-list">
              <li><Link to="#">{tenantName} AI/ML</Link></li>
              <li><Link to="#">{tenantName} Data Science</Link></li>
              <li><Link to="#">{tenantName} Python</Link></li>
              <li><Link to="#">{tenantName} Prompt Engineering</Link></li>
              <li><Link to="#">{tenantName} GenAI Apps</Link></li>
            </ul>
          </Col>

          <Col md={3} sm={6} className="footer-column">
            <h4 className="footer-column-title">Domain Based Courses</h4>
            <ul className="footer-links-list">
              <li><Link to="#">{tenantName} DSA</Link></li>
              <li><Link to="#">{tenantName} React</Link></li>
              <li><Link to="#">{tenantName} Node</Link></li>
              <li><Link to="#">{tenantName} Full Stack</Link></li>
              <li><Link to="#">{tenantName} DevOps</Link></li>
              <li><Link to="#">{tenantName} Cybersecurity</Link></li>
            </ul>
          </Col>

          <Col md={3} sm={6} className="footer-column">
            <h4 className="footer-column-title">Contact Us</h4>
            <div className="contact-info">
              <p><a href="mailto:admin@eklav.in">admin@eklav.in</a></p>
              <p><Link to="/privacy-policy">Privacy Policy</Link></p>
              <p><Link to="/delete-account">Delete Account</Link></p>
              <div className="made-with">
                <span>Made with</span>
                <FaApple />
                <span>in India</span>
              </div>
            </div>
          </Col>

          <Col md={3} sm={6} className="footer-column">
            <h4 className="footer-column-title">Follow Us</h4>
            <ul className="footer-links-list">
              <li>
                <a
                  href="https://www.instagram.com/eklav_in/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href="https://www.facebook.com/eklav.in"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="https://www.linkedin.com/company/eklav/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LinkedIn
                </a>
              </li>
            </ul>
          </Col>
        </Row>

        {/* Divider */}
        <div className="footer-divider" />

        {/* Footer Bottom */}
        <Row className="footer-bottom align-items-center">
          <Col md={4} className="text-center text-md-start">
            <div className="footer-logo">
              <Link to="/" aria-label={`${tenantName} homepage`}>
                {/* Case 1: Default Eklav - Show Eklav logo */}
                {isDefaultEklav && (
                  <img
                    src={logoLight}
                    alt="Eklav Logo"
                    height={36}
                    width={126}
                    loading="lazy"
                  />
                )}

                {/* Case 2: Tenant with custom logo - Show tenant logo */}
                {!isDefaultEklav && tenantLogo && (
                  <img
                    src={tenantLogo}
                    alt={tenantName}
                    height={36}
                    style={{ maxWidth: '126px', objectFit: 'contain' }}
                    loading="lazy"
                  />
                )}

                {/* Case 3: Tenant without logo - Show tenant name as text logo */}
                {!isDefaultEklav && !tenantLogo && (() => {
                  const safeName = (tenantName || "Eklav").trim();

                  // ✅ First letter CAPS
                  const firstChar = safeName.charAt(0).toUpperCase();

                  // ✅ Second letter small
                  const secondChar = safeName.charAt(1)
                    ? safeName.charAt(1).toLowerCase()
                    : "";

                  // ✅ First two letters (orange)
                  const firstPart = firstChar + secondChar;

                  // ✅ Remaining letters (white)
                  const restPart = safeName.slice(2);

                  return (
                    <span className="tenant-logo-text">
                      <span
                        className="tenant-logo-primary"
                        style={{ color: themeColor }}
                      >
                        {firstPart}
                      </span>

                      <span className="tenant-logo-secondary">
                        {restPart}
                      </span>
                    </span>
                  );
                })()}
              </Link>
            </div>
          </Col>

          <Col md={4} className="text-center">
            <div className="copyright-text">
              Copyrights © {new Date().getFullYear()}{" "}
              <span className="highlight">{tenantName}</span>. All rights reserved
            </div>
          </Col>

          <Col md={4}>
            <ul className="social-list">
              <li className="social-item">
                <Link
                  to="https://www.instagram.com/eklav_in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label="Follow us on Instagram"
                >
                  <FaInstagram />
                </Link>
              </li>
              <li className="social-item">
                <Link
                  to="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label="Follow us on Facebook"
                >
                  <FaFacebook />
                </Link>
              </li>
              <li className="social-item">
                <Link
                  to="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label="Follow us on Twitter"
                >
                  <FaXTwitter />
                </Link>
              </li>
              <li className="social-item">
                <Link
                  to="https://www.linkedin.com/company/eklav/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  aria-label="Follow us on LinkedIn"
                >
                  <FaLinkedinIn />
                </Link>
              </li>
            </ul>
          </Col>
        </Row>
      </Container>
    </footer>
  )
}

export default Footer