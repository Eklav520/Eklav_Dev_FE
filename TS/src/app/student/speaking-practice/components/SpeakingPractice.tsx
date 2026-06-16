import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Container,
  Row,
  Col,
  Spinner,
  Badge,
  ProgressBar,
  Alert,
} from "react-bootstrap";
import { useAuthContext } from "@/context/useAuthContext";
import {
  FaMicrophone,
  FaStop,
  FaStar,
  FaLightbulb,
  FaCheckCircle,
  FaRedo,
} from "react-icons/fa";

type Prompt = {
  _id: string;
  text: string;
};

type Feedback = {
  correctedTranscript: string;
  grammar: string;
  fluency: string;
  vocabulary: string;
  pronunciation: string;
  recommendations: string;
  score: number;
};

const SpeakingPractice: React.FC = () => {
  const { user } = useAuthContext();
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const token = user?.token;

  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [sampleAnswer, setSampleAnswer] = useState<string>("");
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micCheckRef = useRef<NodeJS.Timeout | null>(null);

  const [micWarning, setMicWarning] = useState<'muted' | 'low' | null>(null);

  const [maxDuration] = useState(60);
  const [timeUp, setTimeUp] = useState(false);

  // ⭐ Fetch speaking topic
  const fetchPrompt = async () => {
    const res = await fetch(`${baseURL}/speaking/prompt`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setPrompt(data);
  };

  // ⭐ User clicks Start → Load topic only
  const beginPractice = async () => {
    setShowPrompt(true);
    setLoadingPrompt(true);
    await fetchPrompt();
    setLoadingPrompt(false);
  };

  const fetchSampleAnswer = async (question: string) => {
    try {
      const res = await fetch(
        `${baseURL}/speaking/sampleAnswer?prompt=${encodeURIComponent(question)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setSampleAnswer(data.sampleAnswer);
    } catch (err) {
      console.error("Error fetching sample answer:", err);
    }
  };

  const startRecording = async () => {
    setTranscript("");
    setFeedback(null);
    setSampleAnswer("");
    setRecordingTime(0);
    setTimeUp(false);

    if (prompt) fetchSampleAnswer(prompt.text);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunks.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunks.current.push(event.data);
    };

    // Monitor mic volume — warn if muted or too quiet (like Google Meet)
    setMicWarning(null);
    try {
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      let silentTicks = 0;
      micCheckRef.current = setInterval(() => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((s, v) => s + v, 0) / data.length;
        if (avg < 1) {
          silentTicks++;
          if (silentTicks >= 3) setMicWarning('muted');
        } else if (avg < 5) {
          silentTicks++;
          if (silentTicks >= 3) setMicWarning('low');
        } else {
          silentTicks = 0;
          setMicWarning(null);
        }
      }, 1000);
    } catch (_) { /* AudioContext not supported — skip */ }

    mediaRecorderRef.current.start();
    setRecording(true);

    // Timer
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        if (prev + 1 >= maxDuration) {
          clearInterval(timerRef.current!);
          setTimeUp(true);
          stopRecording();
          return maxDuration;
        }
        return prev + 1;
      });
    }, 1000);

    // Speech recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      let finalTranscript = "";
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const chunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalTranscript += " " + chunk;
          else interimTranscript += chunk;
        }
        setTranscript((finalTranscript + " " + interimTranscript).trim());
      };
      recognitionRef.current.start();
    }
  };

  const stopRecording = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (micCheckRef.current) clearInterval(micCheckRef.current);
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null; }
    setMicWarning(null);
    if (!mediaRecorderRef.current) return;

    if (recognitionRef.current) {
      const recognition = recognitionRef.current;
      await new Promise<void>((resolve) => {
        recognition.onend = () => resolve();
        recognition.stop();
      });
    }

    const recorder = mediaRecorderRef.current;
    recorder.onstop = async () => {
      if (audioChunks.current.length === 0) return;

      const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });

      const formData = new FormData();
      formData.append("audio", audioBlob, "speech.webm");
      formData.append("studentId", user?.id || "");
      formData.append("promptId", prompt?._id || "");
      formData.append("transcript", transcript || "");

      setLoading(true);
      try {
        const res = await fetch(`${baseURL}/speaking/submit`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const data = await res.json();
        setFeedback({
          correctedTranscript: data.correctedTranscript,
          grammar: data.feedback.grammar,
          fluency: data.feedback.fluency,
          vocabulary: data.feedback.vocabulary,
          pronunciation: data.feedback.pronunciation,
          recommendations: data.feedback.recommendations,
          score: data.score,
        });
      } catch (error) {
        console.error("Error submitting speech:", error);
      } finally {
        setLoading(false);
      }
    };

    recorder.stop();
    setRecording(false);
  };

  const resetPractice = async () => {
    setTranscript("");
    setFeedback(null);
    setSampleAnswer("");
    setRecordingTime(0);
    await fetchPrompt();
  };

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(
      s % 60
    ).padStart(2, "0")}`;

  const getScoreVariant = (score: number) =>
    score >= 8 ? "success" : score >= 6 ? "warning" : "danger";

  const getScoreFeedback = (score: number) =>
    score >= 9
      ? "Excellent!"
      : score >= 8
      ? "Very Good!"
      : score >= 7
      ? "Good!"
      : score >= 6
      ? "Fair"
      : "Needs Improvement";

  return (
    <Container fluid className="py-4 px-3">
      {/* ⭐ START SCREEN */}
      {!showPrompt && (
        <div className="d-flex justify-content-center mt-4">
          <Card
            className="shadow-lg border-0 rounded-4 p-5 text-center"
            style={{ maxWidth: "650px", background: "#ffffff" }}
          >
            <div className="mb-3" style={{ fontSize: "3rem" }}>🎤</div>

            <h2 className="fw-bold mb-3" style={{ color: "#1a3353" }}>
              Speaking Practice
            </h2>

            <p
              className="mb-4 px-4"
              style={{
                color: "#4a5568",
                fontSize: "1.05rem",
                lineHeight: "1.6",
              }}
            >
              Test your speaking skills with AI-powered evaluation.
            </p>

            <Button
              size="lg"
              className="px-4 py-2"
              style={{ borderRadius: "12px", background: "#006ADC" }}
              onClick={beginPractice}
            >
              ▶ Start Speaking Practice
            </Button>
          </Card>
        </div>
      )}

      {/* ⭐ SPINNER WHILE LOADING TOPIC */}
      {showPrompt && loadingPrompt && (
        <div
          className="d-flex flex-column justify-content-center align-items-center"
          style={{ height: "70vh" }}
        >
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading your speaking topic...</p>
        </div>
      )}

      {/* ⭐ MAIN UI */}
      {showPrompt && !loadingPrompt && prompt && (
        <Card className="shadow-lg border-0 rounded-4 p-4 mt-4">
          <h4 className="fw-bold mb-4 text-primary d-flex align-items-center gap-2">
            <FaMicrophone /> Speaking Challenge
            <Badge bg={recording ? "danger" : "success"} className="ms-auto">
              {recording ? "Recording..." : "Ready"}
            </Badge>
          </h4>

          <Row className="g-3">
            <Col lg={6}>
              <div className="p-4 rounded-4 bg-light shadow-sm mb-3 border-start border-5 border-primary">
                <h5 className="fw-bold mb-3 text-primary">🎯 Your Topic</h5>
                <p className="fs-5">{prompt.text}</p>
              </div>

              {!recording ? (
                <Button
                  variant="primary"
                  size="lg"
                  className="px-4 py-3 rounded-pill"
                  onClick={startRecording}
                >
                  <FaMicrophone className="me-2" /> Start Speaking
                </Button>
              ) : (
                <Button
                  variant="danger"
                  size="lg"
                  className="px-4 py-3 rounded-pill"
                  onClick={stopRecording}
                >
                  <FaStop className="me-2" /> Stop Recording
                </Button>
              )}

              {recording && (
                <Badge
                  bg={recordingTime > maxDuration - 10 ? "warning" : "danger"}
                  className="ms-3 fs-6"
                >
                  ⏱ {formatTime(recordingTime)} / {formatTime(maxDuration)}
                </Badge>
              )}

              {/* Mic warning — Google Meet style floating popup */}
              {micWarning && (
                <div style={{
                  position: 'fixed',
                  bottom: 32,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 9999,
                  background: '#3c4043',
                  borderRadius: 12,
                  boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
                  padding: '16px 20px',
                  minWidth: 320,
                  maxWidth: 400,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}>
                  {/* Warning icon */}
                  <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>⚠️</span>

                  {/* Text */}
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>
                      {micWarning === 'muted' ? 'Microphone muted by system' : 'Microphone volume is very low'}
                    </div>
                    <div style={{ color: '#bdc1c6', fontSize: '0.82rem', lineHeight: 1.5, marginBottom: 8 }}>
                      Go to your computer's settings to unmute your mic and increase its level
                    </div>
                    <button
                      onClick={() => window.open('ms-settings:sound', '_blank')}
                      style={{
                        background: 'none', border: 'none', padding: 0,
                        color: '#8ab4f8', fontSize: '0.82rem', fontWeight: 600,
                        cursor: 'pointer', textDecoration: 'none',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      Open Sound Settings
                    </button>
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => setMicWarning(null)}
                    style={{
                      background: 'none', border: 'none', color: '#bdc1c6',
                      fontSize: '1.1rem', cursor: 'pointer', lineHeight: 1,
                      padding: '0 0 0 4px', flexShrink: 0,
                    }}
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              )}
            </Col>

            <Col lg={6}>
              <div
                className="rounded-3 p-3"
                style={{
                  minHeight: "220px",
                  maxHeight: "280px",
                  overflowY: "auto",
                  border: "1px solid #ddd",
                  background: "#fff",
                }}
              >
                <h6 className="text-primary fw-bold mb-2">🎙️ Live Transcript</h6>
                <p className="fs-6">
                  {transcript || "Start speaking to see your transcript..."}
                </p>
              </div>
            </Col>
          </Row>

          {/* FEEDBACK */}
          <div className="mt-5">
            <h4 className="fw-bold mb-3 text-success d-flex align-items-center gap-2">
              <FaLightbulb /> AI Feedback
            </h4>

            {loading && (
              <div className="text-center py-5">
                <Spinner animation="border" variant="success" />
                <p className="mt-2">Analyzing your speech...</p>
              </div>
            )}

            {feedback && !loading && (
              <>
                <div className="text-center mb-4">
                  <h5>Your Score</h5>
                  <div className="display-5 fw-bold">{feedback.score}/10</div>
                  <div className="text-muted">
                    {getScoreFeedback(feedback.score)}
                  </div>
                  <ProgressBar
                    now={feedback.score * 10}
                    variant={getScoreVariant(feedback.score)}
                    className="mt-2"
                  />
                </div>

                {sampleAnswer && (
                  <Alert variant="success">
                    <h6 className="fw-bold">
                      <FaStar className="me-2" /> Model Answer
                    </h6>
                    {sampleAnswer}
                  </Alert>
                )}

                <Alert variant="info">
                  <h6 className="fw-bold mb-2">
                    <FaCheckCircle className="me-2" /> Corrected Transcript
                  </h6>
                  {feedback.correctedTranscript}
                </Alert>

                <Row className="g-3">
                  <Col md={6}>
                    <div className="p-3 border-start border-4 border-primary bg-white rounded">
                      <strong>📚 Grammar:</strong> {feedback.grammar}
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="p-3 border-start border-4 border-success bg-white rounded">
                      <strong>🔄 Fluency:</strong> {feedback.fluency}
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="p-3 border-start border-4 border-warning bg-white rounded">
                      <strong>💎 Vocabulary:</strong> {feedback.vocabulary}
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="p-3 border-start border-4 border-danger bg-white rounded">
                      <strong>🔊 Pronunciation:</strong> {feedback.pronunciation}
                    </div>
                  </Col>
                </Row>

                <Alert variant="warning" className="mt-3">
                  <FaLightbulb className="me-2" />
                  <strong>Recommendations:</strong>{" "}
                  {feedback.recommendations}
                </Alert>

                <div className="text-center mt-4">
                  <Button variant="outline-primary" onClick={resetPractice}>
                    <FaRedo className="me-2" /> Try Another Topic
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      )}
    </Container>
  );
};

export default SpeakingPractice;
