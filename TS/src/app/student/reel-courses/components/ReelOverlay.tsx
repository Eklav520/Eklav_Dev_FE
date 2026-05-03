interface ReelOverlayProps {
  username: string;
  userAvatar: string;
  description: string;
  music?: string;
}

const ReelOverlay = ({
  username,
  userAvatar,
  description,
  music,
}: ReelOverlayProps) => {
  return (
    <div
      style={{
        position: "absolute",
        left: 12,
        bottom: "14px",
        color: "#fff",
        zIndex: 10,
        maxWidth: "65%",
      }}
    >
      {/* Profile Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
        }}
      >
        {userAvatar ? (
          <img
            src={userAvatar}
            alt={username}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              (e.currentTarget.nextSibling as HTMLElement)?.style.setProperty("display", "flex");
            }}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              objectFit: "cover",
              border: "1.5px solid #fff",
            }}
          />
        ) : null}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "#ff6b00",
            border: "1.5px solid #fff",
            display: userAvatar ? "none" : "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 13,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {username.charAt(0).toUpperCase()}
        </div>

        <span style={{ fontWeight: 600, fontSize: 12 }}>
          {username}
        </span>

        <button
          style={{
            marginLeft: 6,
            padding: "2px 10px",
            background: "transparent",
            border: "1px solid #fff",
            borderRadius: 14,
            color: "#fff",
            fontSize: 10,
            cursor: "pointer",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          Follow
        </button>
      </div>

      {/* Description */}
      <p style={{ fontSize: 12, margin: "0 0 4px 0", lineHeight: 1.4 }}>
        {description}
      </p>

      {/* Music */}
      <div style={{ fontSize: 11, opacity: 0.8 }}>
        🎵 {music || "Original Audio"}
      </div>
    </div>
  );
};

export default ReelOverlay;