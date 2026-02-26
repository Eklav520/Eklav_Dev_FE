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
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 999,
          }}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "70%",
          background: "#fff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          transform: isOpen ? "translateY(0%)" : "translateY(100%)",
          transition: "transform 0.3s ease",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: 16,
            borderBottom: "1px solid #eee",
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          Comments
        </div>

        {/* Comments List */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 16,
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
              <div
                key={comment._id}
                style={{
                  marginBottom: 12,
                }}
              >
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
            padding: 12,
            borderTop: "1px solid #eee",
            display: "flex",
            gap: 8,
          }}
        >
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            style={{
              flex: 1,
              padding: 8,
              borderRadius: 20,
              border: "1px solid #ddd",
              fontSize: 13,
            }}
          />
          <button
            onClick={handleAddComment}
            style={{
              background: "#000",
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: 20,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Post
          </button>
        </div>
      </div>
    </>
  );
};

export default CommentsDrawer;