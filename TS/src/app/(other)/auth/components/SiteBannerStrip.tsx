import { FC, useEffect, useState } from "react";

// Admin-uploaded promo banner (see SiteBannerUpload.tsx / eklavadmin/dashboard).
// Rendered inline in the "About Eklav" hero section (About.tsx), right below
// the "Powerful learning tools..." paragraph — not in the fixed top nav, so
// it just flows normally with the rest of the page content.
//
// Main domain + localhost only, never on institute subdomains — same rule
// AuthLayout already uses for its own `isSubdomain` check, replicated here
// so this component works standalone wherever it's dropped.
//
// Displayed at a fixed, centered size rather than stretched full-width —
// stretching an image whose own aspect ratio doesn't match a thin strip
// always forces a choice between cropping content or leaving empty side
// margins. A fixed size sidesteps that: it always shows the whole image,
// undistorted.
const BANNER_WIDTH = 560; // px — fixed display size; scales down on narrow screens only

const isEligibleHost = () => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "eklav.in" || host.startsWith("www") || host === "localhost" || host === "127.0.0.1";
};

interface SiteBannerStripProps {
  // Fires once the banner's actual visibility is known (true = an active
  // banner is showing), so callers can adjust nearby layout — e.g. hiding a
  // badge above it to save vertical space.
  onVisibleChange?: (visible: boolean) => void;
}

const SiteBannerStrip: FC<SiteBannerStripProps> = ({ onVisibleChange }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isEligibleHost()) return;
    let cancelled = false;
    fetch(`${baseURL}/api/site-banner`)
      .then((res) => res.json())
      .then((data) => { if (!cancelled) setImageUrl(data.banner?.imageUrl ?? null); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [baseURL]);

  const visible = !!imageUrl && isEligibleHost();

  useEffect(() => { onVisibleChange?.(visible); }, [visible]);

  if (!visible) return null;

  return (
    <div style={{ margin: "20px 0" }}>
      <img
        src={imageUrl}
        alt=""
        style={{ display: "block", width: `min(100%, ${BANNER_WIDTH}px)`, height: "auto", borderRadius: 12 }}
      />
    </div>
  );
};

export default SiteBannerStrip;
