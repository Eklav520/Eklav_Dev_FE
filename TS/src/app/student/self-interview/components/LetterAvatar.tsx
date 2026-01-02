interface AvatarProps {
  name: string;
  image?: string | null;
  size?: number;
  className?: string;
}

export default function Avatar({ name, image, size = 40, className = "" }: AvatarProps) {
  const letter = name?.charAt(0)?.toUpperCase() || "?";

  const avatarStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    objectFit: "cover",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#6C63FF",
    color: "white",
    fontWeight: 600,
    fontSize: size * 0.45,
  };

  const baseURL = "http://34.239.0.56:3000"; // your backend URL

  return image ? (
    <img
      src={`${baseURL}${image}`}
      alt={name}
      style={avatarStyle}
      className={className}
      onError={(e) => {
        // If image fails → fallback to letter
        (e.currentTarget as HTMLImageElement).style.display = "none";
        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
        if (fallback) fallback.style.display = "flex";
      }}
    />
  ) : (
    <div style={avatarStyle} className={className}>
      {letter}
    </div>
  );
}
