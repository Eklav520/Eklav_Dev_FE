import { FC, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaArrowRight, FaTimes, FaGraduationCap, FaUsers, FaLandmark, FaBriefcase, FaStar } from "react-icons/fa";
import type { IconType } from "react-icons";
import EventRegisterModal from "./EventRegisterModal";

// Admin-managed events (see eklavadmin/events + SiteEvent/SiteHeroConfig on the
// backend), shown in the SAME hero slot SiteBannerStrip occupies — only one of
// the two is ever live at once, decided by HeroContentSlot.tsx based on
// /api/site-hero-config. Mirrors SiteBannerStrip's host-eligibility rule so it
// behaves identically wherever it's dropped.

interface SiteEvent {
  _id: string;
  category: string;
  title: string;
  subtitle?: string;
  date: string;
  time?: string;
  location?: string;
  registerLink?: string;
}

interface UpcomingEventsPanelProps {
  onVisibleChange?: (visible: boolean) => void;
}

const isEligibleHost = () => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "eklav.in" || host.startsWith("www") || host === "localhost" || host === "127.0.0.1";
};

// Cycled by card index — admin-entered categories are free text, so colors
// are assigned by position rather than parsed from the category string.
const CATEGORY_COLORS = ["#ff7a00", "#a855f7", "#14b8a6", "#3b82f6", "#ec4899", "#22c55e"];

// Category text is free-form admin input, so the badge icon is picked by
// matching known keywords rather than an exact category -> icon map.
function getCategoryIcon(category: string): IconType {
  const c = category.toLowerCase();
  if (c.includes("student")) return FaGraduationCap;
  if (c.includes("tpo") || c.includes("placement")) return FaUsers;
  if (c.includes("chairman") || c.includes("principal") || c.includes("institute") || c.includes("college")) return FaLandmark;
  if (c.includes("job") || c.includes("career") || c.includes("hr") || c.includes("recruit")) return FaBriefcase;
  return FaStar;
}

// Only this many show inline in the hero strip — beyond that, cards would
// wrap onto a second row and push the rest of the hero content down. Extra
// events are reachable via "View All Events" instead.
const INLINE_LIMIT = 2;

// The model stores a real Date + 24h "HH:MM" time (picked via calendar/time
// inputs on the admin side) — formatted here into the friendlier strings
// shown on the card.
function formatEventDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function formatEventTime(hhmm: string): string {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

// One event card — shared between the inline strip and the "View All
// Events" grid so they never visually drift apart.
const EventCard: FC<{ ev: SiteEvent; color: string; onRegister: () => void; style?: React.CSSProperties }> = ({ ev, color, onRegister, style }) => (
  <div
    style={{
      background: "rgba(255,255,255,0.03)",
      border: `1px solid ${color}55`,
      borderRadius: 12,
      padding: "10px 12px 9px",
      display: "flex",
      flexDirection: "column",
      ...style,
    }}
  >
    <span
      style={{
        alignSelf: "flex-start",
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: `${color}22`,
        color,
        border: `1px solid ${color}66`,
        borderRadius: 20,
        padding: "2px 10px",
        fontSize: "0.65rem",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.03em",
        marginBottom: 7,
      }}
    >
      {(() => { const Icon = getCategoryIcon(ev.category); return <Icon size={10} />; })()}
      {ev.category}
    </span>

    <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#fff", lineHeight: 1.25, marginBottom: 3 }}>
      {ev.title}
    </div>
    {ev.subtitle && (
      <div
        style={{
          fontSize: "0.75rem",
          color: "rgba(255,255,255,0.55)",
          marginBottom: 6,
          lineHeight: 1.25,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {ev.subtitle}
      </div>
    )}

    <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8, fontSize: "0.7rem", color: "rgba(255,255,255,0.6)" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <FaCalendarAlt size={10} /> {formatEventDate(ev.date)}
        {ev.time && <><FaClock size={10} style={{ marginLeft: 8 }} /> {formatEventTime(ev.time)}</>}
      </span>
      {ev.location && (
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <FaMapMarkerAlt size={10} /> {ev.location}
        </span>
      )}
    </div>

    <button
      type="button"
      onClick={onRegister}
      style={{
        marginTop: "auto",
        alignSelf: "flex-start",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        background: "#ff7a00",
        border: "none",
        color: "#fff",
        fontSize: "0.76rem",
        fontWeight: 700,
        padding: "6px 12px",
        borderRadius: 8,
        cursor: "pointer",
      }}
    >
      Register Now <FaArrowRight size={10} />
    </button>
  </div>
);

// Full event list, shown over the hero when "View All Events" is clicked.
// Portaled to document.body for the same reason EventRegisterModal is — the
// hero's orbit-animation elements sit on ancestors with their own `transform`,
// which would otherwise trap a `position: fixed` overlay under them.
const AllEventsModal: FC<{ events: SiteEvent[]; onClose: () => void; onRegister: (ev: SiteEvent) => void }> = ({ events, onClose, onRegister }) =>
  createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 1000, maxHeight: "85vh", overflowY: "auto",
          background: "#0d0d14", border: "1px solid rgba(255,122,0,0.3)",
          borderRadius: 16, padding: "22px 24px", boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FaCalendarAlt size={15} color="#ff7a00" />
            <span style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff" }}>All Upcoming Events</span>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#888", cursor: "pointer", fontSize: 18, display: "flex" }}>
            <FaTimes />
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          {events.map((ev, i) => (
            <EventCard key={ev._id} ev={ev} color={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} onRegister={() => onRegister(ev)} />
          ))}
        </div>
      </div>
    </div>,
    document.body
  );

const UpcomingEventsPanel: FC<UpcomingEventsPanelProps> = ({ onVisibleChange }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [events, setEvents] = useState<SiteEvent[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isEligibleHost()) { setLoaded(true); return; }
    let cancelled = false;
    fetch(`${baseURL}/api/site-events`)
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setEvents(Array.isArray(data.events) ? data.events : []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [baseURL]);

  const visible = loaded && isEligibleHost() && events.length > 0;

  useEffect(() => { onVisibleChange?.(visible); }, [visible]);

  const [registerFor, setRegisterFor] = useState<SiteEvent | null>(null);
  const [showAll, setShowAll] = useState(false);

  // When there are more events than fit inline, auto-advance the window
  // every 3s so every event gets shown in rotation instead of the extras
  // being permanently hidden behind "View All Events".
  const [startIndex, setStartIndex] = useState(0);
  useEffect(() => {
    if (events.length <= INLINE_LIMIT) return;
    const id = setInterval(() => {
      setStartIndex((i) => (i + 1) % events.length);
    }, 3000);
    return () => clearInterval(id);
  }, [events.length]);

  if (!visible) return null;

  const inlineEvents = Array.from({ length: Math.min(INLINE_LIMIT, events.length) }, (_, i) => events[(startIndex + i) % events.length]);

  return (
    <div
      style={{
        margin: "20px 0",
        background: "rgba(255,122,0,0.05)",
        border: "1px solid rgba(255,122,0,0.35)",
        borderRadius: 14,
        padding: "16px 18px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FaCalendarAlt size={14} color="#ff7a00" />
          <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff" }}>Upcoming Events</span>
        </div>
        <button
          type="button"
          onClick={() => setShowAll(true)}
          style={{
            background: "none", border: "none", color: "#ff7a00", fontSize: "0.78rem", fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 5, padding: 0,
          }}
        >
          View All Events <FaArrowRight size={10} />
        </button>
      </div>

      {/* Just the first INLINE_LIMIT events — "View All Events" above covers
          seeing the rest, so no in-row pagination/arrows are needed here. */}
      <div style={{ display: "flex", gap: 12 }}>
        {inlineEvents.map((ev, i) => (
          <EventCard
            key={ev._id}
            ev={ev}
            color={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
            onRegister={() => setRegisterFor(ev)}
            style={{ flex: "1 1 0", minWidth: 0 }}
          />
        ))}
      </div>

      {showAll && (
        <AllEventsModal
          events={events}
          onClose={() => setShowAll(false)}
          onRegister={(ev) => { setShowAll(false); setRegisterFor(ev); }}
        />
      )}

      {registerFor && (
        <EventRegisterModal
          eventId={registerFor._id}
          eventTitle={registerFor.title}
          onClose={() => setRegisterFor(null)}
        />
      )}
    </div>
  );
};

export default UpcomingEventsPanel;
