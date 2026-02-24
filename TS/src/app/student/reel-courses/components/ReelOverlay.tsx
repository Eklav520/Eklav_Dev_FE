interface ReelOverlayProps {
  username: string;
  userAvatar: string;
  description: string;
  music?: string;
}

const ReelOverlay = ({ username, userAvatar, description, music }: ReelOverlayProps) => {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 120, // Increased from 100 to make room for music
        left: 16,
        color: "#fff",
        zIndex: 10,
        maxWidth: "70%",
        textShadow: "0 1px 2px rgba(0,0,0,0.3)",
      }}
    >
      {/* User Info with Follow Button */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 12, 
        marginBottom: 8 
      }}>
        <img
          src={userAvatar}
          alt={username}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "2px solid #fff",
            objectFit: "cover",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ 
            fontWeight: 700, 
            fontSize: 15,
            letterSpacing: "0.3px"
          }}>
            {username}
          </span>
          <button
            style={{
              padding: "6px 16px",
              background: "transparent",
              border: "1px solid #fff",
              borderRadius: 20,
              color: "#fff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            Follow
          </button>
        </div>
      </div>

      {/* Description */}
      <p style={{ 
        margin: "0 0 4px 0", 
        fontSize: 14, 
        lineHeight: 1.4,
        fontWeight: 400,
        maxWidth: "280px"
      }}>
        {description}
      </p>

      {/* Music Info */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 8, 
        fontSize: 13,
        marginTop: 4
      }}>
        <div style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          background: "rgba(255,255,255,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
        }}>
          🎵
        </div>
        <span style={{ 
          opacity: 0.9,
          fontSize: 12,
          maxWidth: "200px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}>
          {music || "Original Audio"}
        </span>
      </div>
    </div>
  );
};

export default ReelOverlay;