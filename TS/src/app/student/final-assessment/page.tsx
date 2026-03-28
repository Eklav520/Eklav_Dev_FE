import React, { useEffect, useRef, useState } from 'react'
import { Card, Button, ListGroup, Badge, Modal, Spinner, Alert } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import StudentQuiz from './components/StudentQuiz'
import { useAuthContext } from '@/context/useAuthContext'
import StudentCodeChallengeComponent from './components/codeChallenge/StudentCodeChallengeComponent'
import TechnicalRound from './components/TRRound/TechnicalRound'
import HRRound from './HRRound/HRRound'
import StarRating from '@/app/eklavadmin/final-assessment-details/components/StarRating'
import AssessmentCompaniesMarquee from './AssessmentCompaniesMarquee'

type RoundKey = 'quiz' | 'code' | 'tr' | 'hr'
type RoundStatus = 'locked' | 'ready' | 'in_progress' | 'pending' | 'passed' | 'failed'

// Typed status constants
const LOCKED: RoundStatus = 'locked'
const READY: RoundStatus = 'ready'
const IN_PROGRESS: RoundStatus = 'in_progress'
const PENDING: RoundStatus = 'pending'
const PASSED: RoundStatus = 'passed'
const FAILED: RoundStatus = 'failed'

// states we should not clobber (server/user-driven)
const PERSIST_STATUSES: readonly RoundStatus[] = [PENDING, IN_PROGRESS, PASSED, FAILED] as const

const initialRounds: { key: RoundKey; label: string; status: RoundStatus, approvalStatus: string }[] = [
  { key: 'quiz', label: 'Quiz', status: READY, approvalStatus: "pending" },
  { key: 'code', label: 'Code Challenge', status: LOCKED, approvalStatus: "pending" },
  { key: 'tr', label: 'Technical Round (TR)', status: LOCKED, approvalStatus: "pending" },
  { key: 'hr', label: 'HR Round', status: LOCKED, approvalStatus: "pending" },
]

const statusBadge = (s: RoundStatus, approvalStatus?: string) => {
  switch (s) {
    case READY:
      return <Badge style={{ backgroundColor: '#ff7a00' }}>
        Ready
      </Badge>

    case IN_PROGRESS:
      return <Badge style={{ backgroundColor: '#ff9a3c' }}>
        In Progress
      </Badge>

    case PENDING:
      return (
        <Badge bg="warning" text="dark">
          {approvalStatus === "approved"
            ? "Evaluated"
            : "Pending evaluation"}
        </Badge>
      )

    case PASSED:
      return <Badge bg="success">Passed</Badge>

    case FAILED:
      return <Badge bg="danger">Failed</Badge>

    case LOCKED:
    default:
      return <Badge bg="secondary">Locked</Badge>
  }
}

// Get schedule-based status badge for round cards
const getScheduleStatusBadge = (roundInfo: any, roundStatus: RoundStatus) => {
  if (!roundInfo) {
    return <Badge bg="secondary">Not Scheduled</Badge>
  }

  const now = new Date();
  const startTime = new Date(roundInfo.startDateTime);
  const endTime = new Date(roundInfo.endDateTime);

  // If round is already passed/failed/completed, show the original status
  if (roundStatus === PASSED) {
    return <Badge bg="success">Passed</Badge>
  }
  if (roundStatus === FAILED) {
    return <Badge bg="danger">Failed</Badge>
  }
  if (roundStatus === IN_PROGRESS) {
    return <Badge style={{ backgroundColor: '#ff9a3c' }}>In Progress</Badge>
  }
  if (roundStatus === PENDING) {
    return <Badge bg="warning" text="dark">Pending Evaluation</Badge>
  }
  if (roundStatus === READY) {
    return <Badge style={{ backgroundColor: '#ff7a00' }}>Ready to Start</Badge>
  }

  // Check schedule status for locked rounds
  if (now < startTime) {
    return <Badge style={{ backgroundColor: '#ffaa44', color: '#1a1a2e' }}>📅 Upcoming</Badge>
  }
  if (now >= startTime && now <= endTime) {
    return <Badge style={{ backgroundColor: '#22c55e' }}>✅ Active</Badge>
  }
  if (now > endTime) {
    return <Badge bg="danger">⌛ Expired</Badge>
  }

  return <Badge bg="secondary">Locked</Badge>
}

/** CODE -> TR unlocks (preserve TR state if already active/terminal) */
function deriveWithCodeStatus(
  prev: { key: RoundKey; label: string; status: RoundStatus }[],
  codeStatus: RoundStatus,
): { key: RoundKey; label: string; status: RoundStatus }[] {
  return prev.map((r) => {
    if (r.key === 'code') return { ...r, status: codeStatus }
    if (r.key === 'tr') {
      const prevStatus = r.status
      if (PERSIST_STATUSES.includes(prevStatus)) return r
      if (prevStatus === LOCKED && codeStatus === PASSED) return { ...r, status: READY }
      return r
    }
    return r
  })
}

/** TR -> HR unlocks (preserve HR state if already active/terminal) */
function deriveWithTRStatus(
  prev: { key: RoundKey; label: string; status: RoundStatus }[],
  trStatus: RoundStatus,
): { key: RoundKey; label: string; status: RoundStatus }[] {
  return prev.map((r) => {
    if (r.key === 'tr') {
      // TR is source-of-truth from server
      return { ...r, status: trStatus }
    }
    if (r.key === 'hr') {
      const prevStatus = r.status
      if (PERSIST_STATUSES.includes(prevStatus)) return r
      if (prevStatus === LOCKED && trStatus === PASSED) {
        return { ...r, status: READY } // 🔓 unlock HR when TR passed
      }
      return r
    }
    return r
  })
}

// Violation warnings for each round type
const VIOLATION_WARNINGS = {
  quiz: {
    title: "Important: Quiz Rules & Violation Warnings",
    warnings: [
      "🚫 STRICTLY NO CHEATING: Any form of cheating will result in immediate disqualification",
      "📹 Screen & Webcam Recording: Your screen and webcam will be recorded throughout the quiz",
      "🔒 No New Tabs: Do not open new browser tabs or switch to other applications",
      "📵 No Mobile Phones: Keep mobile devices away during the assessment",
      "🤫 No External Help: Do not seek help from others or use external resources",
      "⏰ Time Limit: The quiz must be completed within the allocated time",
      "⚠️ Violation Consequences: Any violation will lead to automatic failure and may result in permanent ban from future assessments"
    ],
    instructions: [
      "Ensure you have a stable internet connection",
      "Close all unnecessary applications and browser tabs",
      "Make sure your webcam is working properly",
      "Find a quiet, well-lit environment without distractions",
      "Have your student ID ready for verification if required"
    ]
  },
  code: {
    title: "Code Challenge: Rules & Violation Warnings",
    warnings: [
      "🚫 PLAGIARISM PROHIBITED: All code must be your own original work",
      "🔍 Code Similarity Detection: Your code will be checked against existing solutions",
      "🌐 Restricted Browsing: Only allowed documentation sites are permitted",
      "📹 Screen Recording Active: Your coding activity is being monitored",
      "🚷 No Code Sharing: Do not share or discuss solutions with others",
      "⏱️ Time Tracking: The time taken for each problem is recorded",
      "⚠️ Violation Consequences: Plagiarism or cheating will result in immediate failure and permanent record"
    ],
    instructions: [
      "Use proper coding standards and comments",
      "Test your code thoroughly before submission",
      "Only use approved documentation (if specified)",
      "Focus on writing clean, efficient code",
      "Save your work regularly"
    ]
  },
  tr: {
    title: "Technical Round: Guidelines & Important Notes",
    warnings: [
      "🎤 Audio/Video Recording: This interview will be recorded for evaluation",
      "🧠 Demonstrate Problem-Solving: Explain your thought process clearly",
      "🚫 No Pre-written Answers: Do not read from prepared scripts",
      "💻 No IDE Assistance: Solve problems without coding assistance tools",
      "📝 Whiteboard Thinking: Use the shared editor to demonstrate your approach",
      "⏰ Punctuality: Be on time and prepared for the scheduled session",
      "⚠️ Professional Conduct: Unprofessional behavior may lead to disqualification"
    ],
    instructions: [
      "Have your development environment ready (if required)",
      "Prepare to explain your past projects and experiences",
      "Be ready to solve problems on a virtual whiteboard",
      "Practice clear communication of technical concepts",
      "Review fundamental computer science concepts"
    ]
  },
  hr: {
    title: "HR Round: Professional Conduct Guidelines",
    warnings: [
      "🎥 Video Conference Etiquette: Maintain professional appearance and background",
      "🤝 Authentic Responses: Be genuine in your answers - do not memorize responses",
      "🚫 Misrepresentation: Do not falsify qualifications or experiences",
      "📞 No External Assistance: This is an individual assessment",
      "⏰ Respect Time: Join the meeting on time and be prepared",
      "👔 Professional Attire: Dress appropriately for the interview",
      "⚠️ Integrity Check: Any dishonesty will result in immediate rejection"
    ],
    instructions: [
      "Research the company and position beforehand",
      "Prepare examples of your achievements and experiences",
      "Think about your career goals and motivations",
      "Prepare thoughtful questions for the interviewer",
      "Practice professional communication skills"
    ]
  }
}

// Round Card Component - No start button, just display info
const RoundCard = ({ round, index, examInfo }: any) => {
  const mapKey: any = {
    quiz: "mcq",
    code: "coding",
    tr: "tr",
    hr: "hr"
  };

  const roundInfo = examInfo?.rounds?.find((r: any) => r.roundType === mapKey[round.key]);
  const now = new Date();
  const startTime = roundInfo ? new Date(roundInfo.startDateTime) : null;
  const endTime = roundInfo ? new Date(roundInfo.endDateTime) : null;

  const isUpcoming = startTime && now < startTime;
  const isActive = startTime && endTime && now >= startTime && now <= endTime;
  const isExpired = endTime && now > endTime;

  // Calculate time remaining for active rounds
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (!isActive || !endTime) return;

    const interval = setInterval(() => {
      const diff = endTime.getTime() - new Date().getTime();
      if (diff <= 0) {
        setTimeRemaining("Expired");
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime, isActive]);

  const getRoundColor = () => {
    if (round.status === PASSED) return "#22c55e";
    if (round.status === FAILED) return "#dc3545";
    if (round.status === READY) return "#ff7a00";
    if (round.status === IN_PROGRESS) return "#ff9a3c";
    if (round.status === PENDING) return "#ffb347";
    // For locked rounds, show color based on schedule
    if (isActive) return "#22c55e";
    if (isUpcoming) return "#ffaa44";
    if (isExpired) return "#dc3545";
    return "#6c757d";
  };

  const getDateTimeDisplay = () => {
    if (!roundInfo) {
      return (
        <div>
          <div style={{ fontSize: 13, color: "#888" }}>
            📅 Not Scheduled
          </div>
        </div>
      );
    }
    if (!startTime) {
      return (
        <div>
          <div style={{ fontSize: 13, color: "#888" }}>
            📅 Schedule pending
          </div>
        </div>
      );
    }

    const dateStr = startTime.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const timeStr = startTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
    const endTimeStr = endTime ? endTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }) : '';

    if (isActive) {
      return (
        <div>
          <div style={{ fontSize: 13, color: "#22c55e", fontWeight: 500 }}>
            ✅ Active • {timeRemaining} remaining
          </div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
            {dateStr} • {timeStr} - {endTimeStr}
          </div>
        </div>
      );
    }

    if (isUpcoming) {
      return (
        <div>
          <div style={{ fontSize: 13, color: "#ffaa44", fontWeight: 500 }}>
            📅 Upcoming
          </div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
            {dateStr} • {timeStr} - {endTimeStr}
          </div>
        </div>
      );
    }

    if (isExpired) {
      return (
        <div>
          <div style={{ fontSize: 13, color: "#dc3545", fontWeight: 500 }}>
            ⌛ Expired
          </div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
            {dateStr} • {timeStr} - {endTimeStr}
          </div>
        </div>
      );
    }

    return (
      <div>
        <div style={{ fontSize: 13, color: "#888" }}>
          📅 Scheduled
        </div>
        <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
          {dateStr} • {timeStr} - {endTimeStr}
        </div>
      </div>
    );
  };

  const getDuration = () => {
    if (!roundInfo) return null;
    const duration = Math.floor((new Date(roundInfo.endDateTime).getTime() - new Date(roundInfo.startDateTime).getTime()) / (1000 * 60));
    return duration;
  };

  const duration = getDuration();

  // Get schedule-based status badge
  const scheduleBadge = getScheduleStatusBadge(roundInfo, round.status);

  return (
    <div
      style={{
        flex: 1,
        minWidth: "200px",
        background: "rgba(255,255,255,0.05)",
        borderRadius: 12,
        padding: "20px 16px",
        borderTop: `3px solid ${getRoundColor()}`,
        transition: "all 0.3s ease",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <h5 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#fff" }}>
            {round.label}
          </h5>
          <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
            Round {index + 1} of 4
          </div>
        </div>
        {scheduleBadge}
      </div>

      {getDateTimeDisplay()}

      {duration && duration > 0 && (
        <div style={{ fontSize: 11, color: "#888", marginTop: 12 }}>
          ⏱️ Duration: {duration} minutes
        </div>
      )}
    </div>
  );
};

export default function StudentFinalAssessmentPage() {
  const { user } = useAuthContext()
  const token = user?.token
  const studentId = (user as any)?._id ?? (user as any)?.id ?? undefined
  const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
  const templateId = 'default'
  const status = user?.status?.toLowerCase()

  const [rounds, setRounds] = useState(initialRounds)
  const [activeRound, setActiveRound] = useState<RoundKey | null>(null)
  const [started, setStarted] = useState(false)
  const [statusChecked, setStatusChecked] = useState(false)
  const pollRef = useRef<number | null>(null)

  // TR status gate (so we don't flash HR start before we know TR status)
  const [trStatusChecked, setTrStatusChecked] = useState(false)
  const [hrStatusChecked, setHrStatusChecked] = useState(false)

  const [startCodeNow, setStartCodeNow] = useState(false)

  // ----- Review modal state -----
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewKind, setReviewKind] = useState<RoundKey | null>(null)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewData, setReviewData] = useState<any | null>(null)

  // ----- Warning modal state -----
  const [warningOpen, setWarningOpen] = useState(false)
  const [pendingRound, setPendingRound] = useState<RoundKey | null>(null)
  const [warningConfirmed, setWarningConfirmed] = useState(false)
  const [trialUsed, setTrialUsed] = useState(false)
  const [examId, setExamId] = useState<string>("");
  const [examInfo, setExamInfo] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const now = currentTime;
  const [examStatus, setExamStatus] = useState("upcoming");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const [nextRefreshTime, setNextRefreshTime] = useState<Date | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [capturedStream, setCapturedStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-refresh logic for upcoming rounds
  useEffect(() => {
    if (!examInfo?.rounds) return;

    // Find the next upcoming round that is not started yet
    const upcomingRounds = examInfo.rounds.filter((round: any) => {
      const startTime = new Date(round.startDateTime);
      const now = new Date();
      return startTime > now && round.enabled;
    });

    if (upcomingRounds.length === 0) {
      setNextRefreshTime(null);
      return;
    }

    // Find the nearest upcoming round
    const nearestRound = upcomingRounds.reduce((nearest: any, current: any) => {
      const currentStart = new Date(current.startDateTime);
      const nearestStart = nearest ? new Date(nearest.startDateTime) : null;
      if (!nearestStart || currentStart < nearestStart) {
        return current;
      }
      return nearest;
    }, null);

    if (nearestRound) {
      const startTime = new Date(nearestRound.startDateTime);
      const now = new Date();
      const timeUntilStart = startTime.getTime() - now.getTime();

      // If less than 2 minutes until start, set refresh for 20 seconds before start
      if (timeUntilStart <= 120000 && timeUntilStart > 0) {
        const refreshDelay = Math.max(0, timeUntilStart - 20000); // Refresh 20 seconds before start

        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }

        refreshTimeoutRef.current = setTimeout(() => {
          console.log("Auto-refreshing page to enable start button...");
          setAutoRefreshing(true);
          window.location.reload();
        }, refreshDelay);

        const refreshTime = new Date(now.getTime() + refreshDelay);
        setNextRefreshTime(refreshTime);
      } else {
        setNextRefreshTime(null);
      }
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [examInfo, currentTime]);

  useEffect(() => {
    if (!examInfo?.rounds) return;

    const now = new Date();

    const active = examInfo.rounds.find((r: any) => {
      return (
        r.enabled &&
        now >= new Date(r.startDateTime) &&
        now <= new Date(r.endDateTime)
      );
    });

    if (active) {
      setExamStatus("active");
    } else {
      setExamStatus("inactive");
    }
  }, [examInfo, currentTime]);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/assessment/current-exam`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (data?.examId && !examId) {
          setExamId(data.examId);

          if (data?.rounds?.length > 0) {
            setExamInfo({
              title: data.title,
              rounds: data.rounds
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch exam", err);
      }
    };

    if (token) fetchExam();
  }, [token]);

  const labelFor = (k: RoundKey) => (rounds.find((r) => r.key === k)?.label) || k.toUpperCase()
  const coerceScore = (sub: any) => {
    const score = sub?.score ?? sub?.totalScore ?? sub?.marks ?? sub?.avgRating ?? null
    const max = sub?.maxScore ?? sub?.total ?? null
    return { score, max }
  }
  const coerceFeedback = (sub: any) => sub?.feedback ?? sub?.comments ?? sub?.notes ?? ''

  const startAssessment = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/assessment/start/${examId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!data.success) return;

      const allowedRounds = data.allowedRounds || [];
      const completedRounds = data.progress?.completedRounds || [];
      const currentRound = data.activeRound;

      setRounds((prev) =>
        prev.map((r) => {
          const mapKey =
            r.key === "quiz"
              ? "mcq"
              : r.key === "code"
                ? "coding"
                : r.key;

          if (!allowedRounds.includes(mapKey)) {
            return { ...r, status: LOCKED };
          }

          if (currentRound === mapKey) {
            return { ...r, status: READY };
          }

          if (completedRounds.includes(mapKey)) {
            return { ...r, status: PENDING };
          }

          return { ...r, status: LOCKED };
        })
      );
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token && examId) startAssessment();
  }, [token, examId]);

  useEffect(() => {
    if (examId) {
      fetchResultStatus();
    }
  }, [examId]);

  const handleStartWithWarning = (roundKey: RoundKey) => {
    setPendingRound(roundKey)
    setWarningOpen(true)
    setWarningConfirmed(false)
  }

  const fetchResultStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/assessment/result/${examId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!data.success) return;

      const allowedRounds = data.allowedRounds || [];

      setRounds(prev =>
        prev.map(r => {
          const mapKey =
            r.key === "quiz"
              ? "mcq"
              : r.key === "code"
                ? "coding"
                : r.key;

          if (!allowedRounds.includes(mapKey)) {
            return r;
          }

          if (r.key === "quiz") {
            return {
              ...r,
              approvalStatus: data.approvalStatus || "pending",
              status:
                data.approvalStatus === "approved"
                  ? (data.status === "pass" ? PASSED : FAILED)
                  : PENDING
            };
          }

          return r;
        })
      );
    } catch (err) {
      console.error("Result fetch error", err);
    }
  };

const handleConfirmStart = async () => {
  if (!pendingRound) return;

  setWarningOpen(false);

  setTimeout(async () => {
    setActiveRound(pendingRound);
    setStarted(true);

    // ✅ ENTER FULLSCREEN HERE
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      await elem.requestFullscreen().catch(() => {});
    }

    setRounds((rs) =>
      rs.map((r) =>
        r.key === pendingRound ? { ...r, status: IN_PROGRESS } : r
      )
    );
  }, 100);
};

  const openReview = async (kind: RoundKey) => {
    if (!token) return

    setReviewKind(kind)
    setReviewOpen(true)
    setReviewLoading(true)
    setReviewError(null)
    setReviewData(null)

    try {
      let url = ''

      switch (kind) {
        case 'quiz':
          url = `${API_BASE}/api/student/submission-status/${templateId}`
          break
        case 'code':
        case 'tr':
        case 'hr':
          url = `${API_BASE}/api/assessment/current/${examId}`
          break
      }

      let res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error('Failed to load submission')

      const data = await res.json()
      const submission = data?.submission ?? null

      let resultData: any = null

      try {
        const resultRes = await fetch(
          `${API_BASE}/api/assessment/result/${examId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        )

        if (resultRes.ok) {
          resultData = await resultRes.json()
        }
      } catch (err) {
        console.warn("Result API not available")
      }

      const isApproved = resultData?.approvalStatus === "approved"

      let finalStatus = "pending"

      if (isApproved) {
        finalStatus =
          resultData?.status === "pass" ? "Passed" : "Failed"
      }

      let latestProfileFeedback = null

      const profileRes = await fetch(`${API_BASE}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (profileRes.ok) {
        const profileJson = await profileRes.json()
        const fb = Array.isArray(profileJson?.feedback)
          ? profileJson.feedback
          : []

        latestProfileFeedback = fb.length ? fb[fb.length - 1] : null
      }

      setReviewData({
        submission,
        status: finalStatus,
        approvalStatus: resultData?.approvalStatus || "pending",
        feedback: coerceFeedback(submission),
        score: isApproved ? resultData?.scores?.mcq : null,
        max: isApproved ? resultData?.mcq?.total : null,
        displayScore: isApproved ? resultData?.mcq?.display : null,
        answers: submission?.answers || null,
        profileFeedback: latestProfileFeedback,
      })

    } catch (e: any) {
      setReviewError(e?.message || 'Failed to load review')
    } finally {
      setReviewLoading(false)
    }
  }

  const fetchQuizStatus = async () => {
    if (!token || !examId) {
      setStatusChecked(true)
      return
    }

    try {
      const res = await fetch(`${API_BASE}/api/assessment/current/${examId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        setStatusChecked(true)
        return
      }

      const data = await res.json()
      console.log("START API:", data);

      const completed = data.completedRounds || []
      const current = data.currentRound

      let quizNext: RoundStatus = LOCKED

      if (completed.includes("mcq")) {
        if (data.status === "completed") {
          quizNext = PENDING
        } else {
          quizNext = PENDING
        }
      } else if (current === "mcq") {
        quizNext = READY
      }

      setRounds((prev) =>
        prev.map((r) => {
          if (r.key === "quiz") {
            return { ...r, status: quizNext }
          }

          if (r.key === "code") {
            if (completed.includes("mcq") && data.allowedRounds.includes("coding")) {
              return { ...r, status: READY }
            }
          }

          return r
        })
      )

    } catch (err) {
      console.error(err)
    } finally {
      setStatusChecked(true)
    }
  }

  const startPolling = () => {
    stopPolling()
    pollRef.current = window.setInterval(fetchQuizStatus, 15000) as unknown as number
  }
  const stopPolling = () => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  useEffect(() => {
    ; (async () => {
      await fetchCodeLatest()
      await fetchTRLatest()
      await fetchHRLatest()
      await fetchQuizStatus()
    })()
    return () => stopPolling()
  }, [token, templateId])

  const fetchCodeLatest = async () => {
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/api/student/code-latest`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      if (data?.success && data?.hasSubmission && data?.submission) {
        const s = String(data.submission.status || PENDING).toLowerCase()
        const codeNext: RoundStatus = s === 'passed' ? PASSED : s === 'failed' ? FAILED : PENDING

        setRounds((prev) => {
          const updated = deriveWithCodeStatus(prev, codeNext);

          return updated.map((r, index) => ({
            ...r,
            approvalStatus: prev[index]?.approvalStatus || "pending"
          }));
        });
      }
    } catch {
      /* ignore */
    }
  }

  const fetchTRLatest = async () => {
    if (!token) {
      setTrStatusChecked(true)
      return
    }

    try {
      const res = await fetch(`${API_BASE}/api/tr/status/latest`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        return
      }

      const data = await res.json()

      if (data?.success && data?.hasSubmission && data?.submission) {
        const s = String(data.submission.status || 'pending').toLowerCase()

        const trNext: RoundStatus =
          s === 'passed' || s === 'evaluated'
            ? PASSED
            : s === 'failed'
              ? FAILED
              : PENDING

        setRounds((prev) => {
          const updated = deriveWithTRStatus(prev, trNext);

          return updated.map((r) => {
            const old = prev.find(p => p.key === r.key);

            return {
              ...r,
              approvalStatus: old?.approvalStatus || "pending",
              status:
                old?.approvalStatus === "approved"
                  ? r.status
                  : PENDING
            };
          });
        });
      }
    } catch {
      // ❌ Do NOT unlock TR here
    } finally {
      setTrStatusChecked(true)
    }
  }

  const fetchHRLatest = async () => {
    if (!token) {
      setHrStatusChecked(true)
      return
    }
    try {
      const res = await fetch(`${API_BASE}/api/hr/status/latest`, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) return
      const data = await res.json()
      if (data?.success && data?.hasSubmission && data?.submission) {
        const s = String(data.submission.status || 'pending').toLowerCase()
        const hrNext: RoundStatus = s === 'passed' || s === 'evaluated' ? PASSED : s === 'failed' ? FAILED : PENDING
        setRounds((prev) => prev.map((r) => (r.key === 'hr' ? { ...r, status: hrNext } : r)))
      }
    } finally {
      setHrStatusChecked(true)
    }
  }

  const handleStartQuiz = async () => {
    try {
      const elem = document.getElementById("quiz-root");
      if (elem) {
        await elem.requestFullscreen();
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      setCapturedStream(stream); // ✅ correct
      handleStartWithWarning("quiz");

    } catch (e) {
      console.warn("Screen share cancelled");
    }
  };

  const handleQuizClose = (submittedPending = true) => {
    setActiveRound(null)
    setStarted(false)
    setRounds((rs) => rs.map((r) => (r.key === 'quiz' ? { ...r, status: submittedPending ? PENDING : READY } : r)))
    fetchQuizStatus()
  }

  const handleStartCode = () => {
    handleStartWithWarning('code')
    setStartCodeNow(true);
  }

  const handleStartTR = () => {
    handleStartWithWarning('tr')
  }

  const handleStartHR = () => {
    handleStartWithWarning('hr')
  }

  const handleCodeCancel = async () => {
    await fetchCodeLatest()
    setActiveRound(null)
    setStarted(false)
    setStartCodeNow(false)
  }

  const handleCodeSubmitted = async () => {
    try {
      await fetch(`${API_BASE}/api/assessment/complete-round`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          examId,
          roundType: "coding",
        }),
      });

      // ✅ Immediately update UI
      setRounds((prev) =>
        prev.map((r) =>
          r.key === "code"
            ? { ...r, status: "pending" } // 👈 THIS IS KEY
            : r
        )
      );

    } catch (err) {
      console.error("Complete round error", err);
    }

    setActiveRound(null);
    setStarted(false);
    setStartCodeNow(false);

    // optional refresh
    await fetchCodeLatest();   // 👈 ensure sync
  };

  const canStart = (r: { key: RoundKey; status: RoundStatus }) => {
    if (r.status !== READY) return false;

    if (activeRound && r.key !== activeRound) return false;

    if (!examInfo?.rounds) return false;

    const map: any = {
      quiz: "mcq",
      code: "coding",
      tr: "tr",
      hr: "hr"
    };

    const round = examInfo.rounds.find(
      (x: any) => x.roundType === map[r.key]
    );

    if (!round) return false;

    const now = new Date();

    return (
      now >= new Date(round.startDateTime) &&
      now <= new Date(round.endDateTime)
    );
  };

  const handleViewResult = (roundKey: RoundKey) => {
    openReview(roundKey);
  };

  // Format next refresh time display
  const getNextRefreshDisplay = () => {
    if (!nextRefreshTime) return null;
    const now = new Date();
    const diff = nextRefreshTime.getTime() - now.getTime();
    if (diff <= 0) return null;

    const seconds = Math.floor(diff / 1000);
    if (seconds <= 60) {
      return `${seconds} seconds`;
    }
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''}`;
  };

  return (
    <>
      <PageMetaData title="Final Assessment" />

      <Card className="bg-transparent border rounded-4 p-4 mb-4">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between mb-4 gap-2">
          <h4 className="mb-0" style={{ color: '#ff7a00' }}>
            Final Assessment
          </h4>

          <Alert variant="danger" className="mb-0 py-2 px-3">
            <strong>⚠️ Important:</strong>{' '}
            Available exclusively in the <b>Premium Version</b>
          </Alert>
        </div>

        {/* Auto-refresh info banner */}
        {nextRefreshTime && getNextRefreshDisplay() && (
          <Alert variant="info" className="mb-3 py-2 px-3" style={{ fontSize: 13 }}>
            <strong>🔄 Auto-refresh:</strong> Page will automatically refresh in {getNextRefreshDisplay()} to enable the start button for the upcoming round.
          </Alert>
        )}

        {autoRefreshing && (
          <Alert variant="warning" className="mb-3 py-2 px-3">
            <Spinner animation="border" size="sm" className="me-2" />
            <strong>Refreshing page...</strong> Please wait while we prepare your assessment.
          </Alert>
        )}

        {/* Four Round Cards at Top - Display Only */}
        <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
          {rounds.map((round, index) => (
            <RoundCard
              key={round.key}
              round={round}
              index={index}
              examInfo={examInfo}
            />
          ))}
        </div>

        <Alert
          style={{
            backgroundColor: 'rgba(255,122,0,0.08)',
            borderColor: '#ff7a00',
            color: '#ff7a00',
          }}
        >
          <strong>⚠️ Important:</strong> All rounds are monitored and recorded. Any violation of assessment rules will result in immediate disqualification.
          Please read all warnings carefully before starting each round.
        </Alert>

        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ width: 420 }}>
            {status === 'pending' && trialUsed && (
              <Alert variant="danger">
                🚫 Trial users are allowed only one Final Assessment attempt.
                Please upgrade to Premium.
              </Alert>
            )}
            <ListGroup as="ol" numbered>
              {rounds.map((r, idx) => {
                const isQuiz = r.key === 'quiz'
                const startable = canStart(r)
                let displayStatus = r.status

                return (
                  <ListGroup.Item
                    as="li"
                    key={r.key}
                    className="d-flex justify-content-between align-items-start"
                    style={{
                      background:
                        r.status === LOCKED
                          ? 'rgba(255,255,255,0.02)'
                          : r.status === READY
                            ? 'rgba(255,122,0,0.06)'
                            : undefined,

                      borderLeft:
                        r.status === READY
                          ? '3px solid #ff7a00'
                          : r.status === PASSED
                            ? '3px solid #22c55e'
                            : r.status === FAILED
                              ? '3px solid #dc3545'
                              : r.status === PENDING
                                ? '3px solid #ffb347'
                                : '3px solid rgba(255,255,255,0.08)',

                      transition: 'all 0.25s ease',
                    }}>
                    <div className="ms-2 me-auto">
                      <div className="fw-semibold">{r.label}</div>
                      <div className="small text-muted">Round {idx + 1}</div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      {statusBadge(displayStatus)}

                      {isQuiz && r.status === READY && !statusChecked && (
                        <Button size="sm" variant="outline-secondary" disabled>
                          Checking...
                        </Button>
                      )}
                      {r.key === 'tr' && r.status === READY && !trStatusChecked && (
                        <Button size="sm" variant="outline-secondary" disabled>
                          Checking...
                        </Button>
                      )}
                      {r.key === 'hr' && r.status === READY && !hrStatusChecked && (
                        <Button size="sm" variant="outline-secondary" disabled>
                          Checking...
                        </Button>
                      )}

                      {r.status !== LOCKED && r.status !== READY && (
                        <>
                          {r.approvalStatus === "approved" && (
                            <Button
                              size="sm"
                              variant="outline-success"
                              onClick={() => openReview(r.key)}
                            >
                              View Result
                            </Button>
                          )}
                        </>
                      )}

                      <Button
                        size="sm"
                        disabled={!startable}
                        onClick={() => {
                          if (!startable) return

                          if (r.key === 'quiz') handleStartQuiz()
                          else if (r.key === 'code') handleStartCode()
                          else if (r.key === 'tr') handleStartTR()
                          else if (r.key === 'hr') handleStartHR()
                        }}
                        style={{
                          backgroundColor: startable ? '#ff7a00' : '#444',
                          borderColor: startable ? '#ff7a00' : '#444',
                          cursor: startable ? 'pointer' : 'not-allowed',
                          opacity: startable ? 1 : 0.5,
                        }}
                      >
                        Start
                      </Button>
                    </div>
                  </ListGroup.Item>
                )
              })}
            </ListGroup>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <Card
              className="p-4"
              style={{
                overflow: "hidden",
                position: "relative",
                borderRadius: 16,
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  marginBottom: 20,
                  color: "#ff7a00",
                }}
              >
                Industry-Level Interviews
              </div>

              <div
                style={{
                  background: "rgba(255,122,0,0.06)",
                  padding: 16,
                  borderRadius: 12,
                  marginBottom: 24,
                }}
              >
                <p className="small mb-2">
                  <strong>Quiz:</strong> Screen & webcam monitored. After submission it becomes{" "}
                  <em>Pending</em> until admin review.
                </p>
                <p className="small mb-0">
                  <strong>Code Challenge:</strong> Unlocks after Quiz is{" "}
                  <em>Passed</em>. Passing Code unlocks <strong>TR</strong>, then <strong>HR</strong>.
                </p>
              </div>

              <div style={{ marginBottom: 24 }}>
                <AssessmentCompaniesMarquee />
              </div>

              <Alert variant="danger" className="small mb-0">
                <strong>🚫 Violation Policy:</strong> Cheating, plagiarism, or misconduct
                will result in immediate failure and possible permanent ban.
              </Alert>
            </Card>
          </div>
        </div>
      </Card>

      {/* Quiz modal */}
      {started && activeRound === 'quiz' && (
        <StudentQuiz
          questionCount={20}
          examId={examId}
          onClose={() => handleQuizClose(true)}
          stream={capturedStream || undefined}
        />
      )}

      {/* Code challenge */}
      {started && activeRound === 'code' && (
        <StudentCodeChallengeComponent
          baseURL={API_BASE}
          eventId={examId}
          startOpen={startCodeNow}
          hidePreview
          onClose={handleCodeCancel}
          onSubmitted={handleCodeSubmitted}
          authToken={token}
          studentId={studentId}
        />
      )}

      {/* TR modal */}
      {started && activeRound === 'tr' && (
        <TechnicalRound
          baseURL={API_BASE}
          authToken={token}
          onClose={() => {
            setActiveRound(null)
            setStarted(false)
          }}
          onSubmitted={async () => {
            setRounds((rs) => rs.map((r) => (r.key === 'tr' ? { ...r, status: PENDING } : r)))
            setActiveRound(null)
            setStarted(false)
            await fetchTRLatest()
          }}
        />
      )}

      {/* HR modal */}
      {started && activeRound === 'hr' && (
        <HRRound
          baseURL={API_BASE}
          authToken={token}
          onClose={() => {
            setActiveRound(null)
            setStarted(false)
          }}
          onSubmitted={async () => {
            setRounds((rs) => rs.map((r) => (r.key === 'hr' ? { ...r, status: 'pending' as RoundStatus } : r)))
            setActiveRound(null)
            setStarted(false)
          }}
        />
      )}

      {/* Warning Modal */}
      <Modal show={warningOpen} onHide={() => setWarningOpen(false)} centered size="lg">
        <Modal.Header closeButton className="bg-warning bg-opacity-10">
          <Modal.Title>
            ⚠️ {pendingRound ? VIOLATION_WARNINGS[pendingRound].title : 'Important Warning'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {pendingRound && (
            <>
              <Alert variant="danger" className="mb-4">
                <h6 className="alert-heading">🚫 STRICT VIOLATION WARNINGS:</h6>
                <ul className="mb-0">
                  {VIOLATION_WARNINGS[pendingRound].warnings.map((warning, index) => (
                    <li key={index} className="small">{warning}</li>
                  ))}
                </ul>
              </Alert>

              <Card className="mb-3">
                <Card.Header className="bg-primary bg-opacity-10">
                  <strong>📋 Preparation Instructions:</strong>
                </Card.Header>
                <Card.Body>
                  <ul className="mb-0">
                    {VIOLATION_WARNINGS[pendingRound].instructions.map((instruction, index) => (
                      <li key={index} className="small">{instruction}</li>
                    ))}
                  </ul>
                </Card.Body>
              </Card>

              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="warningConfirmation"
                  checked={warningConfirmed}
                  onChange={(e) => setWarningConfirmed(e.target.checked)}
                />
                <label className="form-check-label small" htmlFor="warningConfirmation">
                  <strong>I understand and agree to all the rules and warnings above.</strong> I confirm that I will not engage in any form of cheating or misconduct during this assessment.
                </label>
              </div>
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setWarningOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmStart}
            disabled={!warningConfirmed}
            style={{
              backgroundColor: warningConfirmed ? '#ff7a00' : '#ccc',
              borderColor: warningConfirmed ? '#ff7a00' : '#ccc',
            }}
          >
            I Understand - Start Assessment
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Review Modal */}
      <Modal show={reviewOpen} onHide={() => setReviewOpen(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{reviewKind ? `${labelFor(reviewKind)} — Review` : 'Review'}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {reviewLoading && (
            <div className="d-flex align-items-center gap-2">
              <Spinner animation="border" size="sm" />
              <span>Loading…</span>
            </div>
          )}

          {!reviewLoading && reviewError && <Alert variant="danger">{reviewError}</Alert>}

          {!reviewLoading && !reviewError && reviewData && (
            <>
              <div className="d-flex justify-content-between">
                <div>
                  <strong>Status</strong><br />

                  <Badge bg={
                    reviewData.status === "Passed"
                      ? "success"
                      : reviewData.status === "Failed"
                        ? "danger"
                        : "warning"
                  }>
                    {reviewData.status}
                  </Badge>
                </div>

                {reviewData.approvalStatus === "approved" && (
                  <div>
                    <strong>Score</strong><br />
                    {reviewData.displayScore || reviewData.score}
                  </div>
                )}
              </div>

              {reviewData.feedback ? (
                <Card className="mb-3">
                  <Card.Body>
                    <div className="fw-semibold mb-1">Feedback</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{reviewData.feedback}</div>
                  </Card.Body>
                </Card>
              ) : (
                <div className="text-muted small mb-3">No general feedback provided.</div>
              )}

              {reviewData.profileFeedback ? (
                <Card className="mb-3 border-primary">
                  <Card.Body>
                    <div className="fw-semibold mb-1">Admin Feedback</div>

                    {reviewData.profileFeedback.rating != null && (
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <span className="text-muted small">Rating:</span>
                        <StarRating rating={reviewData.profileFeedback.rating} readOnly />
                        <span className="text-muted small">
                          ({reviewData.profileFeedback.rating}/5)
                        </span>
                      </div>
                    )}

                    <div style={{ whiteSpace: 'pre-wrap' }}>
                      {reviewData.profileFeedback.text}
                    </div>

                    <div className="text-muted small mt-2">
                      {new Date(reviewData.profileFeedback.date).toLocaleString()}
                    </div>
                  </Card.Body>
                </Card>
              ) : (
                <div className="text-muted small mb-3">
                  No profile feedback provided yet.
                </div>
              )}

              {Array.isArray(reviewData.answers) && reviewData.answers.length > 0 && (
                <>
                  <div className="fw-semibold mb-2">Per-question review</div>
                  <ListGroup variant="flush">
                    {reviewData.answers.map((a: any, i: number) => (
                      <ListGroup.Item key={a.qid || i} className="px-0">
                        <div className="fw-semibold mb-1">
                          Q{i + 1} {a.topic ? <span className="text-muted">· {a.topic}</span> : null}
                        </div>

                        {a.questionText && (
                          <div className="text-muted mb-1">{a.questionText}</div>
                        )}

                        <div className="small">
                          <span className="text-muted">Rating: </span>
                          <strong>{a.rating ?? '—'}</strong>
                        </div>

                        {a.feedback && (
                          <div className="small mt-1">
                            <span className="text-muted">Feedback: </span>
                            {a.feedback}
                          </div>
                        )}
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </>
              )}
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setReviewOpen(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}