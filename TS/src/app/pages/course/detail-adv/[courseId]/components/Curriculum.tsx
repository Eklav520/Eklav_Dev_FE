import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  ListGroup,
  Modal,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { FaPlay, FaCheckCircle } from "react-icons/fa";
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

interface CurriculumProps {
  videos: Video[];
  onSelectVideo: (video: Video, opts?: { force?: boolean }) => void;
  courseId: string;
  token?: string;
}

/* -----------------------------
   COMPONENT
------------------------------ */
export default function Curriculum({
  videos,
  onSelectVideo,
  courseId,
  token,
}: CurriculumProps) {
  const baseURL = import.meta.env.VITE_API_BASE_URL;

  const [showCaseModal, setShowCaseModal] = useState(false);
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudy | null>(null);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const [userCode, setUserCode] = useState("");
  const [output, setOutput] = useState("");
  const [isPassed, setIsPassed] = useState(false);

  const [caseStudyMap, setCaseStudyMap] = useState<Record<string, boolean>>({});

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
    setUserCode(cs.boilerplate);
    setOutput("");
    setIsPassed(false);
    setActiveVideoId(videoId);
    setShowCaseModal(true);
  };

  /* ----------------------------------------------- */
  const runCode = () => {
    if (!selectedCaseStudy) return;

    try {
      const fn = new Function(
        userCode + `; return solve("${selectedCaseStudy.inputExample}");`
      );
      const result = fn();

      setOutput(String(result));
      setIsPassed(
        String(result).trim() ===
        String(selectedCaseStudy.expectedOutput).trim()
      );
    } catch (err: any) {
      setOutput("❌ Error: " + err.message);
      setIsPassed(false);
    }
  };

  /* ----------------------------------------------- */
  const submitCaseStudy = async () => {
    if (!isPassed) return alert("❌ Test case did not pass!");
    if (!activeVideoId) return;

    setCaseStudyMap((p) => ({ ...p, [activeVideoId]: true }));

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
    } catch (err) {
      console.error("Failed saving case-study:", err);
    }

    alert("🎉 Case Study Completed Successfully!");
    setShowCaseModal(false);
  };

  /* ----------------------------------------------- */
  const actionLabel = (p: number) =>
    p >= 95 ? "Play again" : p > 0 ? "Resume" : "Play";

  const actionVariant = (p: number) =>
    p >= 95
      ? "outline-secondary"
      : p > 0
      ? "outline-warning"
      : "outline-success";

  /* ----------------------------------------------- */
  return (
    <>
      <Card className="border rounded-3" style={{ minWidth: 360 }}>
        <CardBody style={{ padding: "0.75rem" }}>
          <ListGroup variant="flush">
            {videos.map((video) => {
              const progress = Number(video.progress || 0);
              const isCaseDone = caseStudyMap[video._id];

              return (
                <ListGroup.Item
                  key={video._id}
                  className="py-3 px-2 d-flex justify-content-between align-items-start gap-3"
                >
                  <div
                    className="d-flex gap-2 flex-grow-1"
                    onClick={() => onSelectVideo(video)}
                    style={{ cursor: "pointer" }}
                  >
                    <Button variant="danger" size="sm" className="rounded-circle p-1" style={{ width: 32, height: 32 }}>
                      <FaPlay size={12} />
                    </Button>

                    <div className="flex-grow-1">
                      <strong>{video.description}</strong>
                      <br />
                      <small className="text-muted">{video.duration}</small>

                      {/* ⭐ RESTORED PROGRESS BAR */}
                      {progress > 0 && (
                        <div className="mt-1">
                          <div className="progress" style={{ height: 5 }}>
                            <div
                              className={`progress-bar ${
                                progress >= 95 ? "bg-success" : "bg-primary"
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <small className="text-muted">{Math.round(progress)}%</small>
                        </div>
                      )}

                      {/* ⭐ CASE STUDY BUTTON WITH TICK ON RIGHT */}
                      {video.caseStudy && (
                        <Button
                          size="sm"
                          variant="outline-primary"
                          className="mt-2 d-flex align-items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCaseStudy(video.caseStudy!, video._id);
                          }}
                        >
                          Attempt Case Study
                          {isCaseDone && <FaCheckCircle className="text-success" />}
                        </Button>
                      )}
                    </div>
                  </div>

                  <OverlayTrigger placement="left" overlay={<Tooltip>{actionLabel(progress)}</Tooltip>}>
                    <Button
                      size="sm"
                      variant={actionVariant(progress)}
                      onClick={() => onSelectVideo(video, { force: true })}
                    >
                      {actionLabel(progress)}
                    </Button>
                  </OverlayTrigger>
                </ListGroup.Item>
              );
            })}
          </ListGroup>
        </CardBody>
      </Card>

      {/* ----------------------------------------------------------- */}
      <Modal show={showCaseModal} onHide={() => setShowCaseModal(false)} dialogClassName="modal-fullscreen">
        <Modal.Header closeButton>
          <Modal.Title>{selectedCaseStudy?.title}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <h5>Description</h5>
          <p>{selectedCaseStudy?.description}</p>

          <div className="d-flex gap-4">
            <div>
              <strong>Input:</strong>
              <div>{selectedCaseStudy?.inputExample}</div>
            </div>

            <div>
              <strong>Expected Output:</strong>
              <div>{selectedCaseStudy?.expectedOutput}</div>
            </div>
          </div>

          <h5 className="mt-4">Your Code</h5>
          <Editor height="50vh" defaultLanguage="javascript" value={userCode} onChange={(v) => setUserCode(v || "")} theme="vs-dark" />

          <div className="mt-3 p-3 bg-dark text-white rounded">
            <strong>Output:</strong>
            <pre>{output}</pre>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCaseModal(false)}>Close</Button>
          <Button variant="success" onClick={runCode}>Run Code</Button>
          <Button variant={isPassed ? "primary" : "dark"} disabled={!isPassed} onClick={submitCaseStudy}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
