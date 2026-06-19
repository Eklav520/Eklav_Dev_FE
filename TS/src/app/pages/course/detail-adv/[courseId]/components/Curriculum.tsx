import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  ListGroup,
  Modal,
  OverlayTrigger,
  Tooltip,
  Badge,
  ProgressBar,
} from "react-bootstrap";
import { 
  FaPlay, 
  FaCheckCircle, 
  FaCode, 
  FaArrowRight, 
  FaClock, 
  FaPercentage,
  FaTerminal,
  FaCheck,
  FaTimes,
  FaExpand
} from "react-icons/fa";
import Editor from "@monaco-editor/react";

/* -----------------------------
   TYPES
------------------------------ */
interface CaseStudy {
  title: string;
  description: string;
  inputExample: string;
  expectedOutput: string;
  boilerplate: string;
  language?: string;
}

interface Video {
  _id: any;
  video: string;
  description: string;
  duration: number;
  progress: number;
  url: string;
  caseStudy?: CaseStudy | null;
}

// Maps course language label → Judge0 language id string
const LANG_MAP: Record<string, string> = {
  java:       'java',
  python:     'python',
  javascript: 'javascript',
  js:         'javascript',
  c:          'c',
  cpp:        'cpp',
  'c++':      'cpp',
  typescript: 'typescript',
  ts:         'typescript',
  csharp:     'csharp',
  'c#':       'csharp',
  go:         'go',
  rust:       'rust',
  php:        'php',
  ruby:       'ruby',
}

interface CurriculumProps {
  videos: Video[];
  onSelectVideo: (video: Video, opts?: { force?: boolean }) => void;
  courseId: string;
  token?: string;
  language?: string;
}

/* -----------------------------
   COMPONENT
------------------------------ */
export default function Curriculum({
  videos,
  onSelectVideo,
  courseId,
  token,
  language,
}: CurriculumProps) {
  const langStr = Array.isArray(language) ? String(language[0] ?? '') : String(language ?? '');
  const courseLanguage = LANG_MAP[langStr.toLowerCase()] ?? 'java';
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [showCaseModal, setShowCaseModal] = useState(false);
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudy | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const [userCode, setUserCode] = useState("");
  const [output, setOutput] = useState("");
  const [isPassed, setIsPassed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const [caseStudyMap, setCaseStudyMap] = useState<Record<string, boolean>>({});
  const [savedCodeMap, setSavedCodeMap] = useState<Record<string, string>>({});

  /* ----------------------------------------------- */
  useEffect(() => {
    if (!courseId || !token) return;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${baseURL}/userProgress/${courseId}/case-studies`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setCaseStudyMap(data.caseStudyMap || {});
          setSavedCodeMap(data.codeMap || {});
        }
      } catch (err) {
        console.error("Failed loading case-study map:", err);
      }
    };

    fetchStatus();
  }, [courseId, token]);

  /* ----------------------------------------------- */
  const openCaseStudy = (cs: CaseStudy, videoId: string) => {
    setSelectedCaseStudy({ ...cs });
    setUserCode(savedCodeMap[videoId] || cs.boilerplate);
    setOutput("");
    setIsPassed(false);
    setActiveVideoId(videoId);
    setShowCaseModal(true);
  };

  /* ----------------------------------------------- */
  const runCode = async () => {
    if (!selectedCaseStudy) return;
    setIsRunning(true);
    setOutput('');
    setIsPassed(false);

    try {
      const res = await fetch(`${baseURL}/api/judge/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          language: selectedCaseStudy.language || courseLanguage,
          code: userCode,
          stdin: selectedCaseStudy.inputExample ?? '',
        }),
      });

      if (!res.ok) throw new Error(`Execution service error: ${res.status}`);

      const data = await res.json();
      const stdout = (data.stdout ?? '').trim();
      const stderr = (data.stderr ?? '').trim();

      if (stderr) {
        setOutput(`❌ ${stderr.includes('error:') ? 'Compilation' : 'Runtime'} Error:\n\n${stderr}`);
        setIsPassed(false);
        return;
      }

      const expected = (selectedCaseStudy.expectedOutput ?? '').trim();
      const passed = stdout === expected;
      setIsPassed(passed);

      if (passed) {
        setOutput(`✅ Test Passed!\n\nOutput:\n${stdout}`);
      } else {
        setOutput(`❌ Test Failed!\n\nExpected:\n${expected}\n\nGot:\n${stdout || '(no output)'}`);
      }
    } catch (err: any) {
      setOutput(`❌ Error: ${err.message}`);
      setIsPassed(false);
    } finally {
      setIsRunning(false);
    }
  };

  /* ----------------------------------------------- */
  const submitCaseStudy = async () => {
    if (!isPassed) {
      alert("❌ Please ensure your code passes the test case before submitting!");
      return;
    }
    if (!activeVideoId) return;

    setIsSubmitting(true);

    try {
      await fetch(`${baseURL}/userProgress/case-study`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId,
          videoId: activeVideoId,
          code: userCode,
        }),
      });

      setCaseStudyMap((p) => ({ ...p, [activeVideoId]: true }));
      setSavedCodeMap((p) => ({ ...p, [activeVideoId]: userCode }));
      alert("🎉 Congratulations! Case Study Completed Successfully!");
      setShowCaseModal(false);
    } catch (err) {
      console.error("Failed saving case-study:", err);
      alert("❌ Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ----------------------------------------------- */
  const getProgressColor = (progress: number) => {
    if (progress >= 95) return "success";
    if (progress >= 70) return "info";
    if (progress >= 40) return "warning";
    return "secondary";
  };

  const getProgressLabel = (progress: number) => {
    if (progress >= 95) return "Completed";
    if (progress >= 70) return "Almost Done";
    if (progress >= 40) return "In Progress";
    if (progress > 0) return "Started";
    return "Not Started";
  };

  const actionLabel = (progress: number) =>
    progress >= 95 ? "Replay" : progress > 0 ? "Resume" : "Start";

  const actionVariant = (progress: number) =>
    progress >= 95
      ? "outline-secondary"
      : progress > 0
        ? "outline-warning"
        : "outline-success";

  /* ----------------------------------------------- */
  const completedCount = videos.filter(v => (v.progress || 0) >= 95).length;
  const overallProgress = videos.length > 0 ? (completedCount / videos.length) * 100 : 0;

  return (
    <>
      <Card className="curriculum-card">
        <CardBody className="p-0">
          {/* Header with Progress */}
          <div className="curriculum-header">
            <div className="header-content">
              <h5 className="header-title">Course Curriculum</h5>
              <Badge className="video-count-badge">
                {videos.length} Lessons
              </Badge>
            </div>
            <div className="progress-section">
              <div className="progress-info">
                <span className="progress-label">
                  <FaPercentage size={12} /> Overall Progress
                </span>
                <span className="progress-value">{Math.round(overallProgress)}%</span>
              </div>
              <ProgressBar 
                now={overallProgress} 
                variant="warning" 
                className="overall-progress"
              />
            </div>
          </div>

          <ListGroup variant="flush" className="video-list">
            {videos.map((video, index) => {
              const progress = Number(video.progress || 0);
              const isCaseDone = caseStudyMap[video._id];
              const progressColor = getProgressColor(progress);
              const progressLabel = getProgressLabel(progress);

              return (
                <ListGroup.Item key={video._id} className="video-item">
                  <div className="video-content">
                    {/* Left Section - Video Info */}
                    <div 
                      className="video-info"
                      onClick={() => onSelectVideo(video)}
                    >
                      <div className="video-number">
                        <span className="number">{String(index + 1).padStart(2, '0')}</span>
                      </div>
                      <div className="video-details">
                        <div className="video-title-wrapper">
                          <h6 className="video-title">{video.description}</h6>
                          {progress >= 95 && (
                            <FaCheckCircle className="completed-icon" />
                          )}
                        </div>
                        <div className="video-meta">
                          <span className="meta-item">
                            <FaClock size={11} /> {video.duration}
                          </span>
                          {progress > 0 && (
                            <span className={`meta-item status-${progressColor}`}>
                              {progressLabel}
                            </span>
                          )}
                        </div>
                        {progress > 0 && progress < 95 && (
                          <div className="video-progress">
                            <ProgressBar 
                              now={progress} 
                              variant={progressColor} 
                              className="small-progress"
                            />
                          </div>
                        )}
                        {video.caseStudy && (
                          <Button
                            size="sm"
                            variant={isCaseDone ? "success" : "outline-primary"}
                            className="case-study-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              openCaseStudy(video.caseStudy!, video._id);
                            }}
                          >
                            <FaCode size={12} />
                            {isCaseDone ? "Completed" : "Case Study"}
                            {isCaseDone && <FaCheckCircle size={12} />}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Right Section - Action Button */}
                    <div className="video-action">
                      <OverlayTrigger
                        placement="left"
                        overlay={<Tooltip>{actionLabel(progress)} this lesson</Tooltip>}
                      >
                        <Button
                          size="sm"
                          variant={actionVariant(progress)}
                          className="action-btn"
                          onClick={() => onSelectVideo(video, { force: true })}
                        >
                          <FaPlay size={10} />
                          {actionLabel(progress)}
                          <FaArrowRight size={10} />
                        </Button>
                      </OverlayTrigger>
                    </div>
                  </div>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </CardBody>
      </Card>

      {/* Full Screen Case Study Modal */}
      <Modal 
        show={showCaseModal} 
        onHide={() => setShowCaseModal(false)} 
        fullscreen={true}
        className="case-study-modal"
      >
        <Modal.Header closeButton className="modal-header-custom">
          <div className="modal-title-wrapper">
            <div className="title-icon">
              <FaCode size={24} />
            </div>
            <div>
              <Modal.Title>{selectedCaseStudy?.title}</Modal.Title>
              <p className="modal-subtitle">Coding Challenge • Full Screen Editor</p>
            </div>
          </div>
        </Modal.Header>

        <Modal.Body className="modal-body-custom">
          <div className="fullscreen-layout">
            {/* Left Panel - Problem Statement */}
            <div className="left-panel">
              <div className="description-section">
                <h6 className="section-title">📖 Problem Statement</h6>
                <p className="description-text">{selectedCaseStudy?.description}</p>
              </div>

              <div className="io-section">
                <div className="io-card">
                  <div className="io-header">
                    <FaTerminal size={14} />
                    <span>Sample Input</span>
                  </div>
                  <pre className="io-content">{selectedCaseStudy?.inputExample}</pre>
                </div>
                <div className="io-card">
                  <div className="io-header">
                    <FaCheck size={14} />
                    <span>Expected Output</span>
                  </div>
                  <pre className="io-content">{selectedCaseStudy?.expectedOutput}</pre>
                </div>
              </div>

              {/* Output Section */}
              <div className="output-section">
                <div className="output-header">
                  <FaTerminal size={14} />
                  <span>Output Console</span>
                </div>
                <pre className={`output-content ${isPassed && output ? 'success' : output ? 'error' : ''}`}>
                  {output || '▶ Run your code to see output here...'}
                </pre>
              </div>
            </div>

            {/* Right Panel - Code Editor */}
            <div className="right-panel">
              <div className="editor-header">
                <div className="editor-title-section">
                  <FaCode size={14} />
                  <span className="editor-title">Code Editor</span>
                  <span className="language-badge">
                    {(selectedCaseStudy?.language || courseLanguage).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="editor-wrapper">
                <Editor
                  height="100%"
                  language={selectedCaseStudy?.language || courseLanguage}
                  value={userCode}
                  onChange={(v) => setUserCode(v || "")} 
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                    lineNumbers: 'on',
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                    scrollBeyondLastLine: false,
                    renderLineHighlight: 'all',
                    cursorBlinking: 'smooth',
                    smoothScrolling: true,
                    formatOnPaste: true,
                    formatOnType: true,
                    bracketPairColorization: { enabled: true },
                  }}
                />
              </div>
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer className="modal-footer-custom">
          <Button variant="outline-secondary" onClick={() => setShowCaseModal(false)}>
            Close
          </Button>
          <Button 
            variant="warning" 
            onClick={runCode} 
            disabled={isRunning}
            className="run-btn"
          >
            {isRunning ? 'Running...' : '▶ Run Code'}
          </Button>
          <Button
            variant={isPassed ? "success" : "secondary"}
            onClick={submitCaseStudy}
            disabled={!isPassed || isSubmitting}
            className="submit-btn"
          >
            {isSubmitting ? 'Submitting...' : isPassed ? '✓ Submit Solution' : '✗ Pass Test First'}
          </Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .curriculum-card {
          background: #0a0a0a;
          border: 1px solid #2a2a2a;
          border-radius: 16px;
          overflow: hidden;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .curriculum-header {
          padding: 1.25rem 1.25rem 0.75rem 1.25rem;
          border-bottom: 1px solid #2a2a2a;
          background: #0d0d0d;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .video-list {
          flex: 1;
          overflow-y: auto;
          min-height: 0;
          padding-bottom: 20px;
        }
 
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .header-title {
          font-size: 1rem;
          font-weight: 600;
          color: #ff6b35;
          margin: 0;
        }

        .video-count-badge {
          background: rgba(255, 107, 53, 0.15);
          color: #ff6b35;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.7rem;
        }

        .progress-section {
          margin-top: 0.5rem;
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          font-size: 0.7rem;
        }

        .progress-label {
          color: #888;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .progress-value {
          color: #ff6b35;
          font-weight: 600;
        }

        .overall-progress {
          height: 4px;
          border-radius: 2px;
        }

        .overall-progress .progress-bar {
          background-color: #ff6b35;
        }

        .video-list::-webkit-scrollbar {
          width: 4px;
        }

        .video-list::-webkit-scrollbar-track {
          background: #1a1a1a;
        }

        .video-list::-webkit-scrollbar-thumb {
          background: #ff6b35;
          border-radius: 2px;
        }

        .video-item {
          background: #0a0a0a;
          border-bottom: 1px solid #1a1a1a;
          padding: 0;
          transition: all 0.3s ease;
        }

        .video-item:hover {
          background: #0f0f0f;
        }

        .video-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 1.25rem;
        }

        .video-info {
          flex: 1;
          display: flex;
          gap: 1rem;
          cursor: pointer;
        }

        .video-number {
          flex-shrink: 0;
        }

        .video-number .number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          background: rgba(255, 107, 53, 0.1);
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #ff6b35;
        }

        .video-details {
          flex: 1;
        }

        .video-title-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .video-title {
          font-size: 0.85rem;
          font-weight: 500;
          color: #e0e0e0;
          margin: 0;
        }

        .completed-icon {
          color: #28a745;
          font-size: 0.75rem;
        }

        .video-meta {
          display: flex;
          gap: 1rem;
          margin-bottom: 0.5rem;
        }

        .meta-item {
          font-size: 0.65rem;
          color: #888;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .meta-item.status-success {
          color: #28a745;
        }

        .meta-item.status-info {
          color: #17a2b8;
        }

        .meta-item.status-warning {
          color: #ffc107;
        }

        .video-progress {
          margin-top: 0.5rem;
          max-width: 200px;
        }

        .small-progress {
          height: 3px;
        }

        .case-study-btn {
          margin-top: 0.5rem;
          padding: 0.2rem 0.6rem;
          font-size: 0.65rem;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .video-action {
          flex-shrink: 0;
          margin-left: 1rem;
        }

        .action-btn {
          padding: 0.35rem 0.85rem;
          font-size: 0.7rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          white-space: nowrap;
        }

        /* Full Screen Modal Styles */
        .case-study-modal .modal-content {
          background: #0a0a0a;
          border: none;
          border-radius: 0;
          height: 100vh;
        }

        .modal-header-custom {
          background: linear-gradient(135deg, #0a0a0a 0%, #111111 100%);
          border-bottom: 2px solid #ff6b35;
          padding: 1rem 1.5rem;
          flex-shrink: 0;
        }

        .modal-title-wrapper {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .title-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 107, 53, 0.15);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ff6b35;
        }

        .modal-subtitle {
          font-size: 0.7rem;
          color: #888;
          margin: 0;
        }

        .modal-body-custom {
          padding: 0;
          flex: 1;
          overflow: hidden;
        }

        .fullscreen-layout {
          display: flex;
          height: 100%;
          overflow: hidden;
        }

        /* Left Panel - Problem Statement */
        .left-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          padding: 1.5rem;
          border-right: 1px solid #1a1a1a;
          background: #0a0a0a;
        }

        .left-panel::-webkit-scrollbar {
          width: 6px;
        }

        .left-panel::-webkit-scrollbar-track {
          background: #1a1a1a;
        }

        .left-panel::-webkit-scrollbar-thumb {
          background: #ff6b35;
          border-radius: 3px;
        }

        /* Right Panel - Code Editor */
        .right-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #0d0d0d;
        }

        .editor-header {
          background: #111111;
          padding: 0.75rem 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #1a1a1a;
          flex-shrink: 0;
        }

        .editor-title-section {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .editor-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: #ff6b35;
        }

        .language-badge {
          background: rgba(255, 107, 53, 0.15);
          color: #ff6b35;
          font-size: 0.65rem;
          padding: 0.25rem 0.6rem;
        }

        .editor-wrapper {
          flex: 1;
          min-height: 0;
        }

        .description-section {
          margin-bottom: 1.5rem;
        }

        .section-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: #ff6b35;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .description-text {
          color: #b0b0b0;
          font-size: 0.85rem;
          line-height: 1.6;
          margin: 0;
        }

        .io-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .io-card {
          background: #0d0d0d;
          border: 1px solid #1a1a1a;
          border-radius: 12px;
          overflow: hidden;
        }

        .io-header {
          background: #111111;
          padding: 0.6rem 1rem;
          font-size: 0.7rem;
          font-weight: 600;
          color: #ff6b35;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-bottom: 1px solid #1a1a1a;
        }

        .io-content {
          padding: 0.75rem 1rem;
          margin: 0;
          font-size: 0.8rem;
          color: #fbbf24;
          background: #0a0a0a;
          font-family: monospace;
          white-space: pre-wrap;
        }

        .output-section {
          border-radius: 12px;
          border: 1px solid #1a1a1a;
        }

        .output-header {
          background: #111111;
          padding: 0.6rem 1rem;
          font-size: 0.7rem;
          font-weight: 600;
          color: #28a745;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-bottom: 1px solid #1a1a1a;
        }

        .output-content {
          padding: 0.75rem 1rem;
          margin: 0;
          font-size: 0.8rem;
          color: #888;
          background: #0a0a0a;
          font-family: monospace;
          white-space: pre-wrap;
          min-height: 120px;
        }

        .output-content.success {
          color: #28a745;
        }

        .output-content.error {
          color: #dc3545;
        }

        .modal-footer-custom {
          border-top: 1px solid #1a1a1a;
          padding: 1rem 1.5rem;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        .run-btn {
          background: #ffc107;
          border: none;
          color: #000;
          min-width: 120px;
        }

        .run-btn:hover:not(:disabled) {
          background: #e0a800;
        }

        .submit-btn {
          min-width: 160px;
        }

        /* Responsive */
        @media (max-width: 992px) {
          .fullscreen-layout {
            flex-direction: column;
          }

          .left-panel {
            max-height: 40%;
            border-right: none;
            border-bottom: 1px solid #1a1a1a;
          }

          .right-panel {
            min-height: 60%;
          }

          .io-section {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .video-content {
            flex-direction: column;
            gap: 0.75rem;
          }

          .video-action {
            width: 100%;
            margin-left: 0;
          }

          .action-btn {
            width: 100%;
            justify-content: center;
          }

          .modal-footer-custom {
            flex-wrap: wrap;
          }

          .run-btn, .submit-btn {
            flex: 1;
          }
        }
      `}</style>
    </>
  );
}