import React, { useState, useEffect, useRef, FormEvent } from "react";
import { Card, Button, Form, Spinner, ProgressBar } from "react-bootstrap";
import axios from "axios";

interface Message {
  sender: "user" | "rob";
  text: string;
}

const EnglishTalkPractice: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "rob",
      text: "👋 Hi! I'm Rob. Let's practice English for 2 minutes. Say something to start!",
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(120);

  // Correctly type the ref as an HTMLDivElement or null
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format timer
  const formatTime = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post<{ reply: string }>(
        "http://localhost:3000/api/english/chat",
        { message: input }
      );

      const robMsg: Message = { sender: "rob", text: res.data.reply };
      setMessages((prev) => [...prev, robMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "rob",
          text: "⚠️ Sorry, something went wrong. Try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  return (
    <div className="container mt-5">
      <Card className="shadow-lg border-0 rounded-4">
        <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">💬 English Practice with Rob</h5>
          <div>
            <strong>{formatTime(timeLeft)}</strong>
          </div>
        </Card.Header>

        <Card.Body
          className="p-3"
          style={{
            height: "400px",
            overflowY: "auto",
            background: "#f8f9fa",
          }}
        >
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`d-flex mb-3 ${
                msg.sender === "user"
                  ? "justify-content-end"
                  : "justify-content-start"
              }`}
            >
              <div
                className={`p-3 rounded-4 ${
                  msg.sender === "user"
                    ? "bg-primary text-white"
                    : "bg-light text-dark border"
                }`}
                style={{ maxWidth: "75%" }}
              >
                <strong>{msg.sender === "rob" ? "Rob 🤖" : "You"}:</strong>{" "}
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef}></div>
        </Card.Body>

        <Card.Footer>
          {timeLeft > 0 ? (
            <Form onSubmit={handleSubmit}>
              <div className="d-flex">
                <Form.Control
                  type="text"
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={loading}
                />
                <Button
                  variant="primary"
                  className="ms-2"
                  onClick={handleSend}
                  disabled={loading}
                >
                  {loading ? <Spinner animation="border" size="sm" /> : "Send"}
                </Button>
              </div>
            </Form>
          ) : (
            <div className="text-center text-muted">
              ⏰ Time’s up! Restart the session to continue.
            </div>
          )}
          <ProgressBar
            now={(timeLeft / 120) * 100}
            className="mt-3"
            variant={timeLeft < 30 ? "danger" : "success"}
          />
        </Card.Footer>
      </Card>
    </div>
  );
};

export default EnglishTalkPractice;
