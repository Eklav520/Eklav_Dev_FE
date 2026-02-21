import PageMetaData from '@/components/PageMetaData'
import { Col, Row } from 'react-bootstrap'
import AuthLayout from '../components/AuthLayout'
import SignIn from './components/SignIn'
import { useState } from 'react'
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import CaptchaBox from '@/common/CaptchaBox'

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const SignInPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captchaValid, setCaptchaValid] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const name = e.target.name.value;
    const email = e.target.email.value;
    const phone = e.target.phone.value;
    const message = e.target.message.value;

    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Request sent successfully 🎉");
        e.target.reset();
        setShowForm(false);
      } else {
        toast.warning(data.msg || "Something went wrong ⚠️");
      }
    } catch {
      toast.error("Server error. Try again later ❌");
    }

    setLoading(false);
  };

  return (
    <>
      <PageMetaData title="Sign-In" />

      {/* Glass Popup CSS */}
      <style>{`
  .popup-overlay{
    position:fixed; inset:0; background:rgba(0,0,0,.55);
    backdrop-filter:blur(6px); display:flex; justify-content:center; align-items:center;
    z-index:9999; animation:fadeIn .3s;
  }
  .popup-card{
    width:400px; background:rgba(255,255,255,.08);
    padding:25px; border-radius:14px; border:1px solid rgba(255,255,255,.2);
    box-shadow:0 10px 35px rgba(0,0,0,.45); position:relative;
    animation:scaleIn .3s;
  }
  .close-btn{
    position:absolute; top:14px; right:18px;
    color:#fd692a; font-size:20px; cursor:pointer;
  }

  /* ORANGE BUTTON */
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

  /* ORANGE LINK */
  .orange-link {
    color: #fd692a !important;
    cursor: pointer;
    transition: .2s;
  }

  .orange-link:hover {
    color: #ff7d47 !important;
    text-decoration: underline;
  }

  /* INPUT FOCUS */
  .form-control:focus {
    border-color: #fd692a !important;
    box-shadow: 0 0 0 .2rem rgba(253,105,42,.25) !important;
  }

  @keyframes fadeIn{from{opacity:0;} to{opacity:1;}}
  @keyframes scaleIn{from{transform:scale(.9);opacity:0;} to{transform:scale(1);opacity:1;}}
`}</style>

      <AuthLayout>

        <div className="text-center mb-4">
          <h1 className="fw-bold mb-2" style={{ fontSize: '28px', color:'#fd692a' }}>
            Welcome To Eklav 👋
          </h1>

          <h5 className="mb-0" style={{ color: '#9ca3af' }}>
            Sign in to continue your learning journey
          </h5>

          <div
            style={{
              width: 60,
              height: 3,
              background: '#fd692a',
              margin: '14px auto 0',
              borderRadius: 2
            }}
          />
        </div>


        {/* Card */}
        <div className="card border-0 shadow-sm w-100">
          <div className="card-body p-4 p-lg-5">
            <SignIn />
          </div>
        </div>

        {/* Request Access */}
        {/*  <div className="text-center mt-4">
          <span className="text-muted">
            Need a subscription plan?{" "}
            <span
              className="fw-bold orange-link"
              style={{ cursor: "pointer" }}
              onClick={() => setShowForm(true)}
            >
              Request Access
            </span>
          </span>
        </div> */}

      </AuthLayout>


      {/* Contact Popup Form */}
      {showForm && (
        <div className="popup-overlay" onClick={() => setShowForm(false)}>
          <div className="popup-card" onClick={(e) => e.stopPropagation()}>

            <span className="close-btn" onClick={() => setShowForm(false)}>✖</span>
            <h4 className="text-center text-white mb-3">Get in Touch</h4>

            <form onSubmit={handleSubmit}>
              <label className="form-label text-white">Name</label>
              <input name="name" className="form-control mb-2" maxLength={30} required />

              <label className="form-label text-white">Email</label>
              <input type="email" maxLength={50} name="email" className="form-control mb-2" required />

              <label className="form-label text-white">Phone</label>
              <input type="tel" maxLength={10} minLength={10} name="phone" className="form-control mb-2" required />

              <label className="form-label text-white">Message</label>
              <textarea name="message" rows={3} className="form-control mb-3" maxLength={500} required />
              <CaptchaBox onValidate={setCaptchaValid} />
              <button
                className="btn orange-btn w-100"
                disabled={!captchaValid || loading}
              >
                {loading ? "Sending..." : "Send Request"}
              </button>


            </form>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" theme="colored" autoClose={2500} />
    </>
  );
};

export default SignInPage;
