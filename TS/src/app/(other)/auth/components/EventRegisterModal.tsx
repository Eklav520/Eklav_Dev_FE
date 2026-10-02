import { FC, useState } from "react";
import { createPortal } from "react-dom";

// Rendered via a portal straight into document.body (see PostJobModal in
// TopNavigationBar.tsx for the same pattern) — mounted deep inside the hero
// section, whose orbit-animation elements sit on ancestors with their own
// `transform`, which makes a `position: fixed` descendant resolve against
// that ancestor instead of the real viewport and get trapped under those
// elements' own stacking context instead of covering the whole page.
//
// Collects name/email/phone/college and posts to
// POST /api/site-events/:id/register — reachable from the pre-login landing
// page, so it asks for these directly instead of requiring an account.
// Registrants are reviewed by admin from the Events management modal
// (SiteEventsModal.tsx, "Registrations" button per event).
interface EventRegisterModalProps {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
}

const inputStyle: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 13, outline: "none",
};
const labelStyle: React.CSSProperties = { display: "block", fontSize: 12, color: "rgba(255,255,255,0.6)", fontWeight: 600, marginBottom: 5 };

const EventRegisterModal: FC<EventRegisterModalProps> = ({ eventId, eventTitle, onClose }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [form, setForm] = useState({ name: "", email: "", phone: "", college: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${baseURL}/api/site-events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Registration failed");
      setDone(true);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 420, background: "#0d0d14", border: "1px solid rgba(255,122,0,0.3)",
          borderRadius: 16, padding: "24px", boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 6 }}>You're registered!</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 18 }}>
              We've noted your spot for "{eventTitle}".
            </div>
            <button
              onClick={onClose}
              style={{ background: "#ff7a00", border: "none", borderRadius: 8, padding: "9px 24px", color: "#000", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#ff7a00", marginBottom: 2 }}>Register for Event</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 18 }}>{eventTitle}</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input style={inputStyle} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input type="email" style={inputStyle} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>Phone (optional)</label>
                <input style={inputStyle} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>College / Organization (optional)</label>
                <input style={inputStyle} value={form.college} onChange={(e) => setForm((f) => ({ ...f, college: e.target.value }))} />
              </div>
            </div>

            {error && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 12 }}>{error}</div>}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="submit"
                disabled={submitting}
                style={{ flex: 1, background: "#ff7a00", border: "none", borderRadius: 8, padding: "10px 0", color: "#000", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer", fontSize: 13, opacity: submitting ? 0.6 : 1 }}
              >
                {submitting ? "Registering..." : "Register"}
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "10px 18px", color: "#ccc", cursor: "pointer", fontSize: 13 }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

export default EventRegisterModal;
