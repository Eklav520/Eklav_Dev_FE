"use client";

import { useEffect, useState } from "react";
import axios from "axios";

interface CommentsDrawerProps {
  reelId: string;
  token?: string;
  baseURL: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Comment {
  _id: string;
  text: string;
  user?: {
    fullName?: string;
  };
  createdAt: string;
}

const CommentsDrawer = ({
  reelId,
  token,
  baseURL,
  isOpen,
  onClose,
}: CommentsDrawerProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= FETCH COMMENTS ================= */
  useEffect(() => {
    if (!isOpen) return;

    const fetchComments = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${baseURL}/api/studentSideReels/${reelId}/comments`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setComments(res.data.comments || []);
      } catch (err) {
        console.error("Fetch comments failed");
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [isOpen]);

  /* ================= ADD COMMENT ================= */
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const res = await axios.post(
        `${baseURL}/api/studentSideReels/${reelId}/comment`,
        { text: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setComments((prev) => [
        ...prev,
        {
          _id: Date.now().toString(),
          text: newComment,
          createdAt: new Date().toISOString(),
        },
      ]);

      setNewComment("");
    } catch (err) {
      console.error("Add comment failed");
    }
  };

return (
  <>
    {isOpen && (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
        }}
      >
        {/* Overlay */}
        <div
          onClick={onClose}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
          }}
        />

        {/* Drawer */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "60vh", // ✅ reduced height
            background: "#111", // ✅ dark theme (matches reels)
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            display: "flex",
            flexDirection: "column",
            transform: "translateY(0%)",
            transition: "transform 0.3s ease",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: 14,
              borderBottom: "1px solid #333",
              textAlign: "center",
              fontWeight: 600,
              color: "#fff",
            }}
          >
            Comments
          </div>

          {/* Comments List */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 14,
              color: "#fff",
            }}
          >
            {loading ? (
              <p>Loading...</p>
            ) : comments.length === 0 ? (
              <p style={{ textAlign: "center", opacity: 0.6 }}>
                No comments yet
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment._id} style={{ marginBottom: 12 }}>
                  <strong style={{ fontSize: 13 }}>
                    {comment.user?.fullName || "User"}
                  </strong>
                  <p style={{ margin: 0, fontSize: 13 }}>
                    {comment.text}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <div
            style={{
              padding: 10,
              borderTop: "1px solid #333",
              display: "flex",
              gap: 8,
              background: "#111",
            }}
          >
            <input
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 20,
                border: "none",
                background: "#222",
                color: "#fff",
                fontSize: 13,
              }}
            />
            <button
              onClick={handleAddComment}
              style={{
                background: "#000",
                color: "#fff",
                border: "none",
                padding: "0 16px",
                borderRadius: 20,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Post
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);
};

export default CommentsDrawer;