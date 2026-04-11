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
        left: 16,
        bottom: "40px", 
        color: "#fff",
        zIndex: 10,
        maxWidth: "70%",
      }}
    >
      {/* Profile Row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 10,
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
              width: 36,
              height: 36,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #fff",
            }}
          />
        ) : null}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "#ff6b00",
            border: "2px solid #fff",
            display: userAvatar ? "none" : "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 16,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          {username.charAt(0).toUpperCase()}
        </div>

        <span
          style={{
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          {username}
        </span>

        <button
          style={{
            marginLeft: 10,
            padding: "4px 14px",
            background: "transparent",
            border: "1px solid #fff",
            borderRadius: 18,
            color: "#fff",
            fontSize: 11,
            cursor: "pointer",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          Follow
        </button>
      </div>

      {/* Description */}
      <p style={{ fontSize: 13, margin: "0 0 6px 0" }}>
        {description}
      </p>

      {/* Music */}
      <div style={{ fontSize: 12, opacity: 0.85 }}>
        🎵 {music || "Original Audio"}
      </div>
    </div>
  );
};

export default ReelOverlay;