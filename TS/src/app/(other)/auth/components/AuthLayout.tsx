import logo from "@/assets/images/logo_white.png";
import { ChildrenType } from "@/types/component-props";
import { Col, Container, Row } from "react-bootstrap";

const AuthLayout = ({ children }: ChildrenType) => {
  return (
    <main>
      <style>
        {`
        /* ---------------- LOGO ANIMATION ---------------- */
        .logo-anim {
          animation: fadeZoom 1.6s ease-out forwards;
          opacity: 0;
        }

        @keyframes fadeZoom {
          0% { opacity: 0; transform: scale(0.85); }
          60% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }

        /* ---------------- DESKTOP ---------------- */
        .auth-left {
          min-height: 100vh;
          padding-top: 88px;
        }

        .auth-logo {
          margin-bottom: 28px; /* ✅ proper gap */
        }

        .auth-video {
          margin-top: 0;
        }

        /* ---------------- MOBILE ---------------- */
        @media (max-width: 991px) {
          .auth-left {
            min-height: auto;
            padding-top: 32px;
            padding-bottom: 24px;
          }

          .auth-logo {
            margin-bottom: 20px;
          }

          .logo-anim {
            width: 230px !important;
          }

          .auth-video {
            margin-bottom: 12px;
          }
        }
        `}
      </style>

      <section className="p-0 d-flex align-items-center position-relative overflow-hidden">
        <Container fluid>
          <Row>
            {/* -------- LEFT SECTION -------- */}
            <Col
              xs={12}
              lg={6}
              className="d-flex flex-column align-items-center bg-dark text-white px-4 position-relative auth-left"
            >
              {/* Logo */}
              <div className="auth-logo">
                <img
                  src={logo}
                  alt="Eklav Logo"
                  className="logo-anim"
                  style={{ width: "300px" }}
                />
              </div>

              {/* Video */}
              <div
                className="auth-video"
                style={{ width: "100%", maxWidth: "700px" }}
              >
                <div
                  className="ratio ratio-16x9 rounded shadow-lg"
                  style={{ overflow: "hidden", borderRadius: "12px" }}
                >
                  <iframe
                    src="https://www.youtube.com/embed/D_qXsrZQC7U"
                    title="Eklav Application Demo"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ border: 0 }}
                  />
                </div>
              </div>
            </Col>

            {/* -------- RIGHT / LOGIN -------- */}
            {children}
          </Row>
        </Container>
      </section>
    </main>
  );
};

export default AuthLayout;
