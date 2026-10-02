import { FC, useEffect, useState } from "react";
import SiteBannerStrip from "./SiteBannerStrip";
import UpcomingEventsPanel from "./UpcomingEventsPanel";

// Picks which admin-managed content (the promo banner or the events cards)
// renders in this one shared hero slot — mutually exclusive by design (see
// SiteHeroConfig on the backend). Exposes the same onVisibleChange contract
// both children already use, so callers (About.tsx) don't need to know which
// one is actually active.
interface HeroContentSlotProps {
  onVisibleChange?: (visible: boolean) => void;
}

const HeroContentSlot: FC<HeroContentSlotProps> = ({ onVisibleChange }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [activeContent, setActiveContent] = useState<"banner" | "events">("banner");

  useEffect(() => {
    let cancelled = false;
    fetch(`${baseURL}/api/site-hero-config`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && (data.activeContent === "banner" || data.activeContent === "events")) {
          setActiveContent(data.activeContent);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [baseURL]);

  return activeContent === "events"
    ? <UpcomingEventsPanel onVisibleChange={onVisibleChange} />
    : <SiteBannerStrip onVisibleChange={onVisibleChange} />;
};

export default HeroContentSlot;
