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
          background: linear-gradient(135deg, #1a1d23 0%, #0f1114 100%);
          padding: 60px 0 30px;
          position: relative;
          z-index: 2;
          border-top: 1px solid rgba(255, 152, 0, 0.1);
          width: 100%;
          margin-top: 0;
        }

        /* Main CTA Section */
        .cta-section {
          text-align: center;
          margin-bottom: 50px;
          padding-bottom: 40px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .cta-title {
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 15px;
          background: linear-gradient(135deg, #fff 0%, #f97316 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .cta-description {
          color: #9aa4b2;
          font-size: 16px;
          max-width: 700px;
          margin: 0 auto 25px;
          line-height: 1.6;
        }

        .cta-button {
          display: inline-block;
          padding: 12px 32px;
          background: linear-gradient(135deg, #f97316, #ea580c);
          color: white;
          text-decoration: none;
          border-radius: 30px;
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 30px;
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(255, 152, 0, 0.3);
          color: white;
        }

        .app-buttons {
          display: flex;
          justify-content: center;
          gap: 15px;
          flex-wrap: wrap;
        }

        .app-button {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.1);
          padding: 10px 20px;
          border-radius: 30px;
          color: white;
          text-decoration: none;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 152, 0, 0.2);
        }

        .app-button:hover {
          background: rgba(255, 152, 0, 0.2);
          transform: translateY(-2px);
          color: white;
          border-color: #f97316;
        }

        .app-button svg {
          font-size: 20px;
          color: #f97316;
        }

        /* Footer Links */
        .footer-links {
          margin-bottom: 40px;
        }

        .footer-links > .footer-column {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .footer-column {
          margin-bottom: 30px;
        }

        .footer-column-title {
          color: white;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 20px;
          position: relative;
          padding-bottom: 10px;
        }

        .footer-column-title::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 30px;
          height: 2px;
          background: #f97316;
        }

        .footer-links-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .footer-links-list li {
          margin-bottom: 12px;
        }

        .footer-links-list a {
          color: #9aa4b2;
          text-decoration: none;
          transition: all 0.3s ease;
          font-size: 14px;
        }

        .footer-links-list a:hover {
          color: #f97316;
          padding-left: 5px;
        }

        /* Contact Info */
        .contact-info {
          color: #9aa4b2;
          font-size: 14px;
          line-height: 1.8;
        }

        .contact-info a {
          color: #f97316;
          text-decoration: none;
        }

        .contact-info a:hover {
          text-decoration: underline;
        }

        .made-with {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #9aa4b2;
          font-size: 14px;
        }

        .made-with svg {
          color: #f97316;
          animation: heartbeat 1.5s ease infinite;
        }

        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        /* Footer Bottom */
        .footer-bottom {
          margin-top: 40px;
          padding-top: 30px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-logo {
          transition: transform 0.3s ease;
        }

        .footer-logo:hover {
          transform: translateY(-2px);
        }

        .copyright-text {
          color: #9aa4b2;
          font-size: 14px;
        }

        .copyright-text .highlight {
          color: #f97316;
          font-weight: 500;
        }

        /* Social Icons */
        .social-list {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          margin: 0;
          padding: 0;
        }

        .social-item {
          list-style: none;
        }

        .social-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          font-size: 18px;
          transition: all 0.3s ease;
          border: 1px solid rgba(255, 152, 0, 0.1);
        }

        .social-link:hover {
          background: #f97316;
          transform: translateY(-3px);
          color: #1a1d23;
          border-color: transparent;
          box-shadow: 0 5px 15px rgba(255, 152, 0, 0.3);
        }

        /* Tenant Logo Text Styles */
        .tenant-logo-text {
          font-size: 20px;
          font-weight: 800;
          display: flex;
          align-items: center;
          letter-spacing: 0.5px;
        }

        .tenant-logo-primary {
          margin-right: 2px;
        }

        .tenant-logo-secondary {
          color: #ffffff;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .cta-title {
            font-size: 28px;
          }

          .cta-description {
            font-size: 14px;
            padding: 0 20px;
          }

          .app-buttons {
            flex-direction: column;
            align-items: center;
          }

          .app-button {
            width: 200px;
          }

          .footer-column {
            text-align: center;
          }

          .footer-column-title::after {
            left: 50%;
            transform: translateX(-50%);
          }

          .social-list {
            justify-content: center;
            margin-top: 20px;
          }

          .footer-logo {
            text-align: center;
            margin-bottom: 15px;
          }

          .copyright-text {
            text-align: center;
            margin-bottom: 15px;
          }

          .made-with {
            justify-content: center;
          }
        }

        @media (max-width: 576px) {
          .footer-section {
            padding: 40px 0 20px;
          }

          .cta-button {
            padding: 10px 25px;
            font-size: 14px;
          }
          
          .tenant-logo-text {
            font-size: 18px;
          }
        }
      `}</style>

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