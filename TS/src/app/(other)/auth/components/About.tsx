import { useEffect, useRef, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import {
  FaArrowRight, FaBookOpen, FaChartLine, FaChevronLeft, FaChevronRight,
  FaBolt, FaCheckCircle, FaClock, FaCode, FaDatabase, FaLayerGroup, FaPlay,
  FaQuoteLeft, FaStar, FaTerminal, FaTrophy, FaUsers, FaUser,
} from "react-icons/fa";
import logoLight from "@/assets/images/logo_white.png";
import heroStudent from "@/assets/images/hero-student.png";
import codeChallengeStudent from "@/assets/images/code-challenge-student.png";
import {
  TechCoursesIcon, StudyMaterialIcon, ATSCheckerIcon, ChittiRoboIcon,
  EmailPracticeIcon, JamIcon, AIMockInterviewIcon, AptitudeIcon,
  CodeAIIcon, ResumeIcon, JobVacanciesIcon, AssessmentIcon,
  OnlineClassesIcon, VirtualInterviewIcon,
} from "./FeatureIcons";
import { useNavigate } from "react-router-dom";
import "./About.css";
import useTenant from "@/utils/tenant";
import HeroContentSlot from "./HeroContentSlot";

type AboutProps = { onStartJourneyClick?: () => void; onCourseClick?: () => void };
const codeChallengeLabel = "EKLAV CODE CHALLENGE";
type Course = {
  _id: string;
  title: string;
  image?: string;
  shortDescription?: string;
  description?: string;
  category?: string[] | string;
  duration?: string;
  totalLectures?: number | string;
  isFeatured?: boolean | string;
};

const getCourseCategories = (category?: string[] | string): string[] => {
  if (!category) return [];
  if (Array.isArray(category)) return category.map((item) => item.trim()).filter(Boolean);
  try {
    const parsed: unknown = JSON.parse(category);
    if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
  } catch {
    return category.split(",").map((item) => item.replace(/["[\]]/g, "").trim()).filter(Boolean);
  }
  return [category.trim()].filter(Boolean);
};

const PublicCourseCatalog = ({ onCourseClick }: { onCourseClick?: () => void }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCategory, setActiveCategory] = useState("All Courses");
  const [loadError, setLoadError] = useState(false);
  const popularTrackRef = useRef<HTMLDivElement>(null);
  const trendingTrackRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    fetch(`${baseURL}/courses/public/list`)
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load public courses (${response.status})`);
        return response.json();
      })
      .then((data: unknown) => {
        if (cancelled) return;
        const list = Array.isArray(data) ? data : (data as { courses?: unknown[] })?.courses;
        setCourses(Array.isArray(list) ? list.filter((course): course is Course => !!course && typeof course === "object" && typeof (course as Course).title === "string") : []);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error("Failed to load public courses:", error);
          setLoadError(true);
        }
      });

    return () => { cancelled = true; };
  }, [baseURL]);

  const categories = Array.from(new Set(courses.flatMap((course) => getCourseCategories(course.category))));
  const filteredCourses = activeCategory === "All Courses"
    ? courses
    : courses.filter((course) => getCourseCategories(course.category).some((category) => category.toLowerCase() === activeCategory.toLowerCase()));
  const featuredCourses = courses.filter((course) => course.isFeatured === true || course.isFeatured === "true");
  const trendingCourses = (featuredCourses.length ? featuredCourses : courses.slice(5)).slice(0, 4);
  const categoryIcons = [FaLayerGroup, FaCode, FaChartLine, FaDatabase];

  const scrollTrack = (track: HTMLDivElement | null, direction: -1 | 1) => {
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.8, behavior: "smooth" });
  };

  const openCourse = () => {
    if (onCourseClick) {
      onCourseClick();
      return;
    }
    navigate("/auth/sign-in");
  };

  const imageURL = (image?: string) => {
    if (!image) return undefined;
    if (image.startsWith("http") || image.startsWith("/")) return image;
    return `${baseURL}/uploads/${image}`;
  };

  const renderCourseCard = (course: Course, index: number, compact = false) => (
    <article className={compact ? "catalog-trending-card" : "catalog-course-card"} key={`${course._id}-${index}`}>
      {compact ? (
        <div className="catalog-trending-image">
          {imageURL(course.image) ? <img src={imageURL(course.image)} alt="" loading="lazy" /> : <FaBookOpen />}
        </div>
      ) : (
        <>
          <div className="catalog-course-image">
            {imageURL(course.image) ? <img src={imageURL(course.image)} alt="" loading="lazy" /> : <FaBookOpen />}
            {(course.isFeatured === true || course.isFeatured === "true") && <span className="catalog-featured-badge"><FaStar /> Featured</span>}
          </div>
          <div className="catalog-course-body">
            <h3>{course.title}</h3>
            <p>{course.shortDescription || course.description || "Build practical, industry-relevant skills."}</p>
            <div className="catalog-course-meta">
              {course.duration && <span><FaClock /> {course.duration}</span>}
              {!!course.totalLectures && <span><FaBookOpen /> {course.totalLectures} lessons</span>}
            </div>
            <div className="catalog-course-tags">
              {getCourseCategories(course.category).slice(0, 3).map((category) => <span key={category}>{category}</span>)}
            </div>
          </div>
        </>
      )}
      {compact && (
        <>
          <div className="catalog-trending-copy">
            <h3>{course.title}</h3>
            <p>{course.shortDescription || getCourseCategories(course.category).slice(0, 2).join(", ") || "Explore this course"}</p>
          </div>
          <button type="button" aria-label={`View ${course.title}`} onClick={openCourse}>
            <FaArrowRight />
          </button>
        </>
      )}
      {!compact && (
        <button type="button" className="catalog-course-open" onClick={openCourse}>
          View course <FaArrowRight />
        </button>
      )}
    </article>
  );

  return (
    <section className="course-catalog-section" aria-label="Popular and trending courses">
      <Container fluid className="px-4 px-xl-5">
        <div className="catalog-heading-row">
          <div>
            <span className="catalog-eyebrow"><FaBookOpen /> Learn In-Demand Skills</span>
            <h2 className="catalog-title">Popular <span>Courses</span></h2>
            <p className="catalog-subtitle">Choose from industry-aligned courses and build the skills that employers want.</p>
          </div>
          <div className="catalog-benefits">
            <div><span><FaBookOpen /></span><strong>Expert Instructors<small>Learn from industry experts</small></strong></div>
            <div><span><FaChartLine /></span><strong>Hands-on Projects<small>Build real-world skills</small></strong></div>
            <div><span><FaStar /></span><strong>Certification<small>Get certified and get noticed</small></strong></div>
          </div>
        </div>

        <div className="catalog-categories" aria-label="Filter courses by category">
          {["All Courses", ...categories].map((category, index) => {
            const CategoryIcon = categoryIcons[index % categoryIcons.length];
            return (
              <button
                type="button"
                key={category}
                className={activeCategory === category ? "active" : ""}
                onClick={() => setActiveCategory(category)}
              >
                <CategoryIcon /> {category}
              </button>
            );
          })}
        </div>

        {loadError ? (
          <p className="catalog-empty">Courses are temporarily unavailable. Please try again later.</p>
        ) : filteredCourses.length > 0 ? (
          <div className="catalog-carousel-wrap">
            <button type="button" className="catalog-arrow catalog-arrow-left" aria-label="Scroll popular courses left" onClick={() => scrollTrack(popularTrackRef.current, -1)}><FaChevronLeft /></button>
            <div className="catalog-course-track" ref={popularTrackRef}>
              {filteredCourses.map((course, index) => renderCourseCard(course, index))}
            </div>
            <button type="button" className="catalog-arrow catalog-arrow-right" aria-label="Scroll popular courses right" onClick={() => scrollTrack(popularTrackRef.current, 1)}><FaChevronRight /></button>
          </div>
        ) : (
          <p className="catalog-empty">{courses.length ? "No courses found in this category yet." : "Courses will appear here as they become available."}</p>
        )}

        <div className="catalog-trending-heading">
          <div>
            <span className="catalog-eyebrow"><FaChartLine /> Stay Ahead</span>
            <h2 className="catalog-title">Trending <span>Courses</span></h2>
            <p className="catalog-subtitle">Discover more courses to keep growing your skills.</p>
          </div>
          <div className="catalog-trending-controls">
            <button type="button" className="catalog-view-all" onClick={openCourse}>View All Courses <FaArrowRight /></button>
            <button type="button" aria-label="Scroll trending courses left" onClick={() => scrollTrack(trendingTrackRef.current, -1)}><FaChevronLeft /></button>
            <button type="button" aria-label="Scroll trending courses right" onClick={() => scrollTrack(trendingTrackRef.current, 1)}><FaChevronRight /></button>
          </div>
        </div>
        {trendingCourses.length > 0 && (
          <div className="catalog-trending-track" ref={trendingTrackRef}>
            {trendingCourses.map((course, index) => renderCourseCard(course, index, true))}
          </div>
        )}
      </Container>
    </section>
  );
};

/* ── Code Challenge editor demo ──
   Types a solution, runs it, shows "Accepted", then loops. Pauses off-screen;
   reduced-motion users get the finished state. */
const DEMO_CODE = [
  "class Solution {",
  "  public int[] twoSum(int[] nums, int t) {",
  "    Map<Integer,Integer> seen = new HashMap<>();",
  "    for (int i = 0; i < nums.length; i++) {",
  "      Integer j = seen.get(t - nums[i]);",
  "      if (j != null) return new int[]{j, i};",
  "      seen.put(nums[i], i);",
  "    }",
  "    return new int[0];",
  "  }",
  "}",
];
const DEMO_TOTAL = DEMO_CODE.reduce((sum, line) => sum + line.length + 1, 0);
const DEMO_TOKEN = /(\b(?:class|public|int|for|if|return|new|null)\b)|(\b(?:Solution|Map|Integer|HashMap)\b)|(\b\d+\b)|(\.\w+(?=\())/g;

const highlight = (text: string) => {
  const parts: React.ReactNode[] = [];
  let last = 0;
  text.replace(DEMO_TOKEN, (match, kw, type, num, call, offset: number) => {
    if (offset > last) parts.push(text.slice(last, offset));
    const cls = kw ? "tk-kw" : type ? "tk-type" : num ? "tk-num" : call ? "tk-call" : "";
    parts.push(<em key={offset} className={cls}>{match}</em>);
    last = offset + match.length;
    return match;
  });
  if (last < text.length) parts.push(text.slice(last));
  return parts;
};

type DemoPhase = "typing" | "running" | "accepted";

const CodeEditorDemo = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState(0);
  const [phase, setPhase] = useState<DemoPhase>("typing");
  const [visible, setVisible] = useState(false);
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") { setVisible(true); return; }
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced) { setTyped(DEMO_TOTAL); setPhase("accepted"); return; }
    if (!visible) return;
    let timer: number;
    if (phase === "typing") {
      timer = typed < DEMO_TOTAL
        ? window.setTimeout(() => setTyped(n => Math.min(DEMO_TOTAL, n + 2)), 24)
        : window.setTimeout(() => setPhase("running"), 500);
    } else if (phase === "running") {
      timer = window.setTimeout(() => setPhase("accepted"), 1300);
    } else {
      timer = window.setTimeout(() => { setTyped(0); setPhase("typing"); }, 3400);
    }
    return () => window.clearTimeout(timer);
  }, [typed, phase, visible, reduced]);

  // Split the typed character count across lines (+1 per line for the newline)
  let remaining = typed;
  const lines = DEMO_CODE.map(line => {
    const shown = line.slice(0, Math.max(0, remaining));
    const done = remaining > line.length;
    remaining -= line.length + 1;
    return { shown, done, active: !done && shown.length > 0 };
  });
  const cursorLine = Math.max(0, lines.findIndex(l => !l.done));
  const typingDone = typed >= DEMO_TOTAL;

  return (
    <div className="code-challenge-code" ref={rootRef}>
      <div className="code-challenge-code-toolbar">
        <span>☕ Java</span>
        <button type="button" tabIndex={-1} className={phase === "running" ? "is-busy" : ""}><FaPlay /> {phase === "running" ? "Running" : "Run"}</button>
        <button type="button" tabIndex={-1} className={phase === "accepted" ? "is-glow" : ""}>Submit <FaArrowRight /></button>
      </div>
      <pre className="code-demo-pre">
        {DEMO_CODE.map((_, i) => {
          const line = lines[i];
          const showCursor = phase === "typing" && (typingDone ? i === DEMO_CODE.length - 1 : i === cursorLine);
          if (!line.shown && !showCursor && i > cursorLine) return <div key={i} className="code-demo-line is-empty"><span>{i + 1}</span></div>;
          return (
            <div key={i} className={`code-demo-line${showCursor ? " is-current" : ""}`}>
              <span>{i + 1}</span>
              <code>{highlight(line.shown)}{showCursor && <b className="code-demo-cursor" />}</code>
            </div>
          );
        })}
      </pre>
      <div className={`code-demo-status is-${phase}`}>
        {phase === "typing" && <><FaTerminal /> <strong>Writing solution…</strong><small>Java · O(n) hash map approach</small></>}
        {phase === "running" && <><span className="code-demo-spinner" /> <strong>Running 3 test cases…</strong><small>Compiling and executing</small></>}
        {phase === "accepted" && (
          <>
            <FaCheckCircle /> <strong>Accepted <em>3/3 passed</em></strong>
            <small>Runtime: 2 ms&nbsp;&nbsp;·&nbsp;&nbsp;Memory: 44.2 MB&nbsp;&nbsp;·&nbsp;&nbsp;Beats 98.6%</small>
          </>
        )}
      </div>
    </div>
  );
};

/* ── Particle Canvas ── */
const ParticleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COLORS = ["#ff7a00", "#00d4ff", "#a855f7", "#22d3ee", "#fb923c"];
    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      size: Math.random() * 1.8 + 0.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: Math.random() * 0.55 + 0.2,
    }));

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255,122,0,${0.12 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
        grd.addColorStop(0, p.color + "66");
        grd.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;

        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }}
    />
  );
};

/* ── Course Marquee ── */
const CourseMarquee = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    fetch(`${baseURL}/courses/public/list`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Course[]) => { if (Array.isArray(data)) setCourses(data.filter((c) => c.image)); })
      .catch(() => {});
  }, []);

  if (courses.length === 0) return null;
  const items = [...courses, ...courses];

  return (
    <div className="neo-marquee-wrap">
      <div className="neo-marquee-track">
        {items.map((c, i) => {
          const imgSrc = c.image?.startsWith("http") ? c.image : c.image ? `${baseURL}/uploads/${c.image}` : null;
          return (
            <div className="neo-marquee-card" key={`${c._id}-${i}`}>
              {imgSrc ? (
                <img src={imgSrc} alt={c.title} className="neo-marquee-img"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div className="neo-marquee-placeholder">{c.title.charAt(0).toUpperCase()}</div>
              )}
              <p className="neo-marquee-title">{c.title}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ── Success Stories ── */
type PublicStory = {
  _id: string;
  studentName: string;
  story: string;
  rating: number;
  avatar?: string;
  avatarUrl?: string;
  profileImage?: string;
  profilePicture?: string;
  studentAvatar?: string;
  profile?: {
    avatar?: string;
    profileImage?: string;
    profilePicture?: string;
  };
  student?: {
    avatar?: string;
    profileImage?: string;
    profilePicture?: string;
  };
};

const StoryStars = ({ rating }: { rating: number }) => (
  <div className="success-story-stars" aria-label={`${rating} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <span key={n} aria-hidden="true" className={n <= rating ? "is-filled" : ""}>★</span>
    ))}
  </div>
);

const getStoryAvatarUrl = (story: PublicStory, baseURL: string) => {
  const avatar = story.student?.profileImage
    || story.student?.profilePicture
    || story.student?.avatar
    || story.profile?.profileImage
    || story.profile?.profilePicture
    || story.profile?.avatar
    || story.profileImage
    || story.profilePicture
    || story.studentAvatar
    || story.avatar;
  if (!avatar) return undefined;
  if (avatar.startsWith("http") || avatar.startsWith("/") || avatar.startsWith("data:")) return avatar;
  return `${baseURL}/uploads/${avatar}`;
};

const StoryAvatar = ({ story, baseURL, className }: { story: PublicStory; baseURL: string; className: string }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const avatar = getStoryAvatarUrl(story, baseURL);

  return (
    <span className={`${className} success-story-avatar`} role="img" aria-label={`${story.studentName || "Student"} profile`}>
      {(!avatar || imageFailed) && <FaUser aria-hidden="true" />}
      {avatar && !imageFailed && <img src={avatar} alt="" onError={() => setImageFailed(true)} />}
    </span>
  );
};

const SuccessStoriesSection = () => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const [stories, setStories] = useState<PublicStory[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    fetch(`${baseURL}/success-stories/public`)
      .then((response) => {
        if (!response.ok) throw new Error(`Could not load public success stories (${response.status})`);
        return response.json();
      })
      .then((data: { stories?: PublicStory[] }) => setStories(Array.isArray(data?.stories) ? data.stories : []))
      .catch((error: unknown) => console.error("Failed to load public success stories:", error));
  }, [baseURL]);

  useEffect(() => {
    if (stories.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % stories.length), 5000);
    return () => clearInterval(t);
  }, [stories.length]);

  if (stories.length === 0) return null;
  const s = stories[idx];
  const previous = stories[(idx - 1 + stories.length) % stories.length];
  const next = stories[(idx + 1) % stories.length];
  const changeStory = (direction: -1 | 1) => {
    setIdx((current) => (current + direction + stories.length) % stories.length);
  };

  return (
    <section className="success-stories">
      <header className="success-stories-heading">
        <span className="success-stories-badge"><FaStar /> Success Stories</span>
        <h2>Real Learners. <span>Real Careers.</span></h2>
        <p>Hear from our learners who upskilled with Eklav and landed great opportunities.</p>
      </header>

      <div className={`success-stories-stage${stories.length > 2 ? " has-side-stories" : stories.length === 2 ? " has-next-story" : ""}`}>
        {stories.length > 2 && (
          <button type="button" className="success-story-card success-story-preview" onClick={() => changeStory(-1)} aria-label={`Read story from ${previous.studentName}`}>
            <StoryAvatar story={previous} baseURL={baseURL} className="success-story-preview-avatar" />
            <span className="success-story-preview-copy">
              <span className="success-story-preview-quote">{previous.story}</span>
              <StoryStars rating={previous.rating} />
            </span>
          </button>
        )}

        <article className="success-story-card success-story-featured" key={s._id}>
          <div className="success-story-quote-row">
            <FaQuoteLeft className="success-story-quote-icon" aria-hidden="true" />
            <blockquote>{s.story}</blockquote>
          </div>
          <div className="success-story-featured-footer">
            <div className="success-story-author">
              <StoryAvatar story={s} baseURL={baseURL} className="success-story-author-avatar" />
              <span className="success-story-author-copy">
                <strong>{s.studentName || "Eklav Learner"}</strong>
                <small>Eklav learner</small>
                <StoryStars rating={s.rating} />
              </span>
            </div>
          </div>
        </article>

        {stories.length > 1 && (
          <button type="button" className="success-story-card success-story-preview success-story-preview-next" onClick={() => changeStory(1)} aria-label={`Read story from ${next.studentName}`}>
            <StoryAvatar story={next} baseURL={baseURL} className="success-story-preview-avatar" />
            <span className="success-story-preview-copy">
              <span className="success-story-preview-quote">{next.story}</span>
              <StoryStars rating={next.rating} />
            </span>
          </button>
        )}
      </div>

      {stories.length > 1 && (
        <div className="success-stories-controls">
          <button type="button" className="success-stories-arrow" onClick={() => changeStory(-1)} aria-label="Previous story"><FaChevronLeft /></button>
          <div className="success-stories-dots" aria-label="Choose a success story">
            {stories.map((story, i) => (
              <button
                key={story._id}
                type="button"
                className={i === idx ? "active" : ""}
                onClick={() => setIdx(i)}
                aria-label={`Go to story ${i + 1}`}
                aria-current={i === idx ? "true" : undefined}
              />
            ))}
          </div>
          <button type="button" className="success-stories-arrow" onClick={() => changeStory(1)} aria-label="Next story"><FaChevronRight /></button>
        </div>
      )}
    </section>
  );
};

/* ── Main About ── */
const About = ({ onStartJourneyClick, onCourseClick }: AboutProps) => {
  const navigate = useNavigate();
  const tenant = useTenant();

  // Subdomains display as "Eklav" here regardless of the tenant's own name.
  const tenantName = "Eklav";
  const normalized = tenantName.charAt(0).toUpperCase() + tenantName.slice(1).toLowerCase();
  const isCoreDataLabs = tenant?.name === "coredatalabs" || window?.location?.hostname === "coredatalabs.eklav.in";
  const [featIdx, setFeatIdx] = useState(0);
  const [challengeLabelLength, setChallengeLabelLength] = useState(0);
  const [isDeletingChallengeLabel, setIsDeletingChallengeLabel] = useState(false);
  // Hide the "Next-Gen E-Learning Platform" badge when the site banner is
  // actually showing above it — saves vertical space instead of stacking both.
  const [bannerVisible, setBannerVisible] = useState(false);

  const features = [
    { icon: <TechCoursesIcon />, title: "Top Tech Courses", description: "Unlimited access to premium tech courses curated by industry experts.", color: "#ff7a00" },
    { icon: <StudyMaterialIcon />, title: "Modern Study Material", description: "Access updated and comprehensive study materials for all subjects.", color: "#00d4ff" },
    { icon: <OnlineClassesIcon />, title: "Online Classes with Industry Experts", description: "Learn directly from professionals working in top companies.", color: "#a855f7" },
    { icon: <ChittiRoboIcon />, title: "English Speaking Practice with Chitti Robo", description: "Improve your English fluency with our AI-powered speaking assistant.", color: "#22d3ee" },
    { icon: <EmailPracticeIcon />, title: "Email Practices", description: "Master professional email writing with real-world scenarios.", color: "#ff7a00" },
    { icon: <JamIcon />, title: "JAM", description: "Practice Just A Minute sessions to improve spontaneous speaking.", color: "#00d4ff" },
    { icon: <VirtualInterviewIcon />, title: "Virtual Interview with AI", description: "Experience realistic interview simulations with instant AI feedback.", color: "#a855f7" },
    { icon: <AptitudeIcon />, title: "Aptitude Unlimited", description: "Endless aptitude practice with adaptive difficulty levels.", color: "#22d3ee" },
    { icon: <CodeAIIcon />, title: "Learn Code with AI Tutor", description: "Get personalized coding guidance from our AI tutor.", color: "#ff7a00" },
    { icon: <ResumeIcon />, title: "Resume Preparation", description: "Create ATS-friendly resumes with expert guidance.", color: "#00d4ff" },
    { icon: <JobVacanciesIcon />, title: "Job Vacancies", description: "Access exclusive job opportunities and placement drives.", color: "#a855f7" },
    { icon: <AssessmentIcon />, title: "Assessment Every Month Like Industry Based", description: "Take monthly industry-standard assessments to track your progress.", color: "#22d3ee" },
  ];

  useEffect(() => {
    const t = setInterval(() => setFeatIdx(i => (i + 1) % features.length), 2800);
    return () => clearInterval(t);
  }, [features.length]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) {
      setChallengeLabelLength(codeChallengeLabel.length);
      return;
    }

    let delay = isDeletingChallengeLabel ? 55 : 115;
    if (!isDeletingChallengeLabel && challengeLabelLength === codeChallengeLabel.length) {
      delay = 1300;
    } else if (isDeletingChallengeLabel && challengeLabelLength === 0) {
      delay = 350;
    }

    const timer = window.setTimeout(() => {
      if (!isDeletingChallengeLabel && challengeLabelLength === codeChallengeLabel.length) {
        setIsDeletingChallengeLabel(true);
      } else if (isDeletingChallengeLabel && challengeLabelLength === 0) {
        setIsDeletingChallengeLabel(false);
      } else {
        setChallengeLabelLength((length) => length + (isDeletingChallengeLabel ? -1 : 1));
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [challengeLabelLength, isDeletingChallengeLabel]);

  return (
    <div className="futuristic-about">
      {/* ── HERO ── */}
      <section className="neo-hero">
        <Container fluid className="px-4 px-xl-5" style={{ position: "relative", zIndex: 1 }}>
          <Row className="align-items-start g-4">

            {/* Left: Text */}
            <Col lg={6} xl={6} className="neo-hero-left">
              {!bannerVisible && (
                <div className="neo-badge">
                  <span className="neo-badge-dot" />
                  Next-Gen E-Learning Platform
                </div>
              )}

              {!bannerVisible && (
                <h1 className="neo-title hero-title">
                  From <span className="hero-title-accent">Campus</span>
                  <br />
                  to <span className="hero-title-accent">Career</span>
                </h1>
              )}

              <p className="neo-subtitle">
                <strong className="hero-brand-name">{normalized}</strong> is a modern{" "}
                <strong className="hero-platform-highlight">All-in-One E-Learning Platform</strong>{" "}
                designed to help students build skills, practice with AI, and get placement ready.
              </p>

              {isCoreDataLabs && (
                <p className="neo-subtitle hero-partner-note">
                  <strong>AI Strategy &amp; Advanced Data Science Partner</strong> — Supporting
                  global AI companies with talent intelligence and scalable solutions for 12+ years.
                </p>
              )}

              <p className="neo-desc">
                Powerful learning tools, AI practice systems, and real industry training — all at an affordable cost.
              </p>

              <HeroContentSlot onVisibleChange={setBannerVisible} />

              <div className="neo-tags hero-highlights">
                <div className="hero-highlight">
                  <span className="hero-highlight-icon"><StudyMaterialIcon /></span>
                  <span><strong>Industry Ready</strong><small>Courses &amp; Certifications</small></span>
                </div>
                <div className="hero-highlight">
                  <span className="hero-highlight-icon"><CodeAIIcon /></span>
                  <span><strong>Practice with AI</strong><small>Interviews &amp; Assessments</small></span>
                </div>
                <div className="hero-highlight">
                  <span className="hero-highlight-icon"><JobVacanciesIcon /></span>
                  <span><strong>Get Placed</strong><small>Real Opportunities</small></span>
                </div>
              </div>

              <button
                className="neo-cta-btn"
                onClick={() => onStartJourneyClick ? onStartJourneyClick() : navigate("/auth/sign-in")}
              >
                <span>Start Your Journey</span>
                <FaArrowRight className="neo-cta-icon" />
              </button>

              {/* Course carousel is reserved for a future landing-page iteration. */}
              {false && <CourseMarquee />}
            </Col>

            <Col lg={6} xl={6} className="neo-hero-art-col">
              <div className="hero-art-wrap">
                <img
                  src={heroStudent}
                  alt="Student holding an Eklav learning book"
                  className="hero-student-art"
                />
                <div className="hero-floating-card hero-card-interview">
                  <span className="hero-floating-icon hero-floating-blue"><AIMockInterviewIcon /></span>
                  <span className="hero-floating-copy">
                    <strong className="hero-typing-title hero-typing-interview">AI Mock Interview</strong>
                    <small>Practice with AI</small>
                  </span>
                </div>
                <div className="hero-floating-card hero-card-progress">
                  <span className="hero-progress-ring" aria-hidden="true"><span /></span>
                  <span className="hero-floating-copy">
                    <strong className="hero-typing-title hero-typing-progress">Course Progress</strong>
                    <small>Track your learning journey</small>
                    <span className="hero-progress-bar"><span /></span>
                  </span>
                </div>
                <div className="hero-floating-card hero-card-placement">
                  <span className="hero-floating-icon hero-floating-orange"><JobVacanciesIcon /></span>
                  <span className="hero-floating-copy">
                    <strong className="hero-typing-title hero-typing-placement">Placement Ready</strong>
                    <small>Explore career opportunities</small>
                  </span>
                </div>
                <div className="hero-floating-card hero-card-aptitude">
                  <span className="hero-floating-icon hero-floating-purple"><AptitudeIcon /></span>
                  <span className="hero-floating-copy">
                    <strong className="hero-typing-title hero-typing-aptitude">Aptitude Practice</strong>
                    <small>Build problem-solving skills</small>
                  </span>
                </div>
                <div className="hero-floating-card hero-card-speaking">
                  <span className="hero-floating-icon hero-floating-cyan"><JamIcon /></span>
                  <span className="hero-floating-copy">
                    <strong className="hero-typing-title hero-typing-speaking">English Speaking</strong>
                    <small>Improve communication</small>
                  </span>
                </div>
                <div className="hero-floating-card hero-card-code-challenge">
                  <span className="hero-floating-icon hero-floating-orange"><CodeAIIcon /></span>
                  <span className="hero-floating-copy">
                    <strong className="hero-typing-title hero-typing-code">Code Challenge</strong>
                    <small>Solve hands-on problems</small>
                  </span>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── CODE CHALLENGE ── */}
      <section className="code-challenge-section" aria-labelledby="code-challenge-title">
        <Container fluid className="px-4 px-xl-5">
          <div className="code-challenge-main">
            <div className="code-challenge-copy">
              <span className="code-challenge-badge" aria-label={codeChallengeLabel}>
                <span className="code-challenge-symbol" aria-hidden="true">&lt;/&gt;</span>
                <span className="code-challenge-typing" aria-hidden="true">
                  <span className="code-challenge-typed">
                    {codeChallengeLabel.slice(
                      0,
                      isDeletingChallengeLabel || challengeLabelLength === codeChallengeLabel.length
                        ? challengeLabelLength
                        : Math.max(0, challengeLabelLength - 1),
                    )}
                  </span>
                  {challengeLabelLength > 0 && challengeLabelLength < codeChallengeLabel.length && !isDeletingChallengeLabel && (
                    <span className="code-challenge-current">{codeChallengeLabel[challengeLabelLength - 1]}</span>
                  )}
                  <span className="code-challenge-cursor" />
                </span>
              </span>
              <h2 id="code-challenge-title">
                Practice. Solve. Improve.
                <span>Get Placement Ready.</span>
              </h2>
              <p className="code-challenge-description">
                A structured coding practice platform to sharpen your problem-solving skills and crack top company coding rounds.
              </p>

              <div className="code-challenge-features">
                <div><span><FaCode aria-hidden="true" /></span><strong>5000+<small>Coding Problems</small></strong></div>
                <div><span><FaLayerGroup aria-hidden="true" /></span><strong>Multiple<small>Topics &amp; Domains</small></strong></div>
                <div><span><FaChartLine aria-hidden="true" /></span><strong>Real-time<small>Code Execution</small></strong></div>
                <div><span><FaTrophy aria-hidden="true" /></span><strong>Company-wise<small>Practice Sets</small></strong></div>
                <div><span><FaTerminal aria-hidden="true" /></span><strong>Difficulty Levels<small>Easy, Medium, Hard</small></strong></div>
                <div><span><FaBolt aria-hidden="true" /></span><strong>Contests &amp;<small>Leaderboards</small></strong></div>
              </div>

              <button
                type="button"
                className="neo-cta-btn code-challenge-cta"
                onClick={() => navigate("/student/code-challenge")}
              >
                <span>Start Coding Now</span>
                <FaArrowRight className="neo-cta-icon" aria-hidden="true" />
              </button>
            </div>

            <div className="code-challenge-visual" aria-hidden="true">
              <div className="code-challenge-editor">
                <div className="code-challenge-editor-nav">
                  <span className="code-challenge-brand"><img src={logoLight} alt="Eklav" /></span>
                  <span className="is-active"><FaTerminal /> Practice</span>
                  <span>Contests</span>
                  <span>Leaderboard</span>
                  <span>Interview</span>
                </div>
                <div className="code-challenge-editor-content">
                  <div className="code-challenge-problem">
                    <h3>Two Sum <span>Easy</span></h3>
                    <p>Given an array of integers nums and an integer target, return the indices of the two numbers such that they add up to target.</p>
                    <strong>Example:</strong>
                    <pre>Input: nums = [2,7,11,15], target = 9{"\n"}Output: [0,1]</pre>
                  </div>
                  <CodeEditorDemo />
                </div>
              </div>
              <img src={codeChallengeStudent} alt="" className="code-challenge-student" />
              <div className="code-challenge-levels">
                <div><FaChartLine /><strong>Easy</strong><span>Build Basics</span></div>
                <div><FaChartLine /><strong>Medium</strong><span>Improve Logic</span></div>
                <div><FaChartLine /><strong>Hard</strong><span>Master DSA</span></div>
              </div>
            </div>
          </div>

          <div className="code-challenge-stats" aria-label="Coding challenge platform highlights">
            <div><span><FaCode aria-hidden="true" /></span><strong>5000+<small>Problems</small></strong></div>
            <div><span><FaUsers aria-hidden="true" /></span><strong>50+<small>Topics</small></strong></div>
            <div><span><FaTrophy aria-hidden="true" /></span><strong>Weekly<small>Coding Contests</small></strong></div>
            <div><span><FaChartLine aria-hidden="true" /></span><strong>Global<small>Leaderboard</small></strong></div>
            <div><span><FaBolt aria-hidden="true" /></span><strong>Company<small>Preparation</small></strong></div>
          </div>
        </Container>
      </section>

      {/* ── SOLAR SYSTEM ── */}
      <section className="neo-universe-section" aria-label="Explore the Eklav learning ecosystem">
        <ParticleCanvas />
        <div className="neo-grid-overlay" />
        <Container fluid className="px-4 px-xl-5" style={{ position: "relative", zIndex: 1 }}>
          <div className="neo-universe-layout">
            <div className="neo-universe-copy">
              <div className="neo-universe-badge">
                <span className="neo-badge-dot" />
                Explore Our Platform
              </div>
              <h2 className="neo-universe-title">
                Everything You Need to
                <br />
                Get <span>Placement Ready</span>
              </h2>
              <p className="neo-universe-description">
                From learning to practice, from mock interviews to real opportunities — Eklav brings everything together in one powerful platform.
              </p>
              <button
                className="neo-cta-btn neo-universe-cta"
                onClick={() => onStartJourneyClick ? onStartJourneyClick() : navigate("/auth/sign-in")}
              >
                <span>Start Your Journey</span>
                <FaArrowRight className="neo-cta-icon" />
              </button>
              <div className="neo-universe-stats">
                <div><strong>10K+</strong><span>Students Learning</span></div>
                <div><strong>200+</strong><span>Expert Courses</span></div>
                <div><strong>500+</strong><span>Practice Tests</span></div>
                <div><strong>100+</strong><span>Hiring Partners</span></div>
              </div>
            </div>

            <div className="neo-universe-frame">
            <div className="holo-display">

                {/* Radial glow backdrop */}
                <div className="holo-radial-glow" />

                {/* Solar system orbit SVG lines — all tilt=-10°, same plane perspective */}
                <svg className="universe-svg" viewBox="0 0 960 560" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="480" cy="246" rx="150" ry="70"  transform="rotate(-10, 480, 246)" fill="none" stroke="rgba(255,180,0,0.45)"   strokeWidth="1.2"/>
                  <ellipse cx="480" cy="246" rx="235" ry="110" transform="rotate(-10, 480, 246)" fill="none" stroke="rgba(255,122,0,0.35)"   strokeWidth="1"/>
                  <ellipse cx="480" cy="246" rx="320" ry="150" transform="rotate(-10, 480, 246)" fill="none" stroke="rgba(0,212,255,0.28)"   strokeWidth="1" strokeDasharray="6,4"/>
                  <ellipse cx="480" cy="246" rx="400" ry="188" transform="rotate(-10, 480, 246)" fill="none" stroke="rgba(168,85,247,0.22)"  strokeWidth="1"/>
                  <ellipse cx="480" cy="246" rx="445" ry="210" transform="rotate(-10, 480, 246)" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="3,7"/>
                </svg>

                {/* Orbit 1 — small inner planets */}
                <div className="univ-planet p-o1 p-o1-1 si-orange psz-sm"><TechCoursesIcon /><span className="sat-label"><span className="sat-title">Courses</span></span></div>
                <div className="univ-planet p-o1 p-o1-2 si-lime   psz-sm"><CodeAIIcon /><span className="sat-label"><span className="sat-title">Code<br />Practice</span></span></div>

                {/* Orbit 2 — medium planets */}
                <div className="univ-planet p-o2 p-o2-1 si-cyan   psz-md"><ATSCheckerIcon /><span className="sat-label"><span className="sat-title">ATS<br />Checker</span></span></div>
                <div className="univ-planet p-o2 p-o2-2 si-pink   psz-sm"><AIMockInterviewIcon /><span className="sat-label"><span className="sat-title">AI Mock<br />Interview</span></span></div>
                <div className="univ-planet p-o2 p-o2-3 si-yellow psz-md"><AssessmentIcon /><span className="sat-label"><span className="sat-title">Assessment</span></span></div>

                {/* Orbit 3 — larger planets */}
                <div className="univ-planet p-o3 p-o3-1 si-purple psz-lg"><StudyMaterialIcon /><span className="sat-label"><span className="sat-title">Study<br />Material</span></span></div>
                <div className="univ-planet p-o3 p-o3-2 si-red    psz-sm"><EmailPracticeIcon /><span className="sat-label"><span className="sat-title">Email</span></span></div>
                <div className="univ-planet p-o3 p-o3-3 si-sky    psz-md"><JamIcon /><span className="sat-label"><span className="sat-title">JAM</span></span></div>

                {/* Orbit 4 — outer largest planets, Jobs gets Saturn ring */}
                <div className="univ-planet p-o4 p-o4-1 si-teal   psz-lg"><ChittiRoboIcon /><span className="sat-label"><span className="sat-title">Chitti AI</span></span></div>
                <div className="univ-planet p-o4 p-o4-2 si-indigo psz-sm"><ResumeIcon /><span className="sat-label"><span className="sat-title">Resume</span></span></div>
                <div className="univ-planet p-o4 p-o4-3 si-green  psz-lg planet-saturn"><JobVacanciesIcon /><span className="sat-label"><span className="sat-title">Jobs</span></span></div>
                <div className="univ-planet p-o4 p-o4-4 si-amber  psz-md planet-ringed"><AptitudeIcon /><span className="sat-label"><span className="sat-title">Aptitude</span></span></div>

                {/* Central orb */}
                <div className="orb-center">
                  <div className="orb-atm orb-atm-1" />
                  <div className="orb-atm orb-atm-2" />
                  <div className="orb-atm orb-atm-3" />
                  <div className="orb-core">
                    <img src={logoLight} alt="Eklav" className="orb-logo" />
                  </div>
                </div>


              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Keep the platform capabilities section available for a later iteration. */}
      {false && (
      <section className="neo-features">
        <div className="neo-grid-overlay" style={{ opacity: 0.3 }} />
        <Container style={{ position: "relative", zIndex: 1 }}>
          <div className="neo-section-header">
            <div className="neo-section-badge">PLATFORM CAPABILITIES</div>
            <h2 className="neo-section-title">
              What Makes{" "}
              <span className="neo-gradient-text">{normalized}</span>{" "}
              Different
            </h2>
            <p className="neo-section-subtitle">
              Comprehensive learning ecosystem designed for your success
            </p>
          </div>

          <div className="cfl-scene">
            <div className="cfl-track">
              {([-2, -1, 0, 1, 2] as const).map((offset) => {
                const idx = ((featIdx + offset) % features.length + features.length) % features.length;
                const f = features[idx];
                const pos = offset < 0 ? `cfl-n${Math.abs(offset)}` : `cfl-${offset}`;
                return (
                  <div
                    key={offset}
                    className={`cfl-card ${pos}`}
                    style={{ "--card-color": f.color } as React.CSSProperties}
                    onClick={() => setFeatIdx(idx)}
                  >
                    <div className="cfl-card-top-line" />
                    <div className="glass-card-icon" style={{ color: f.color }}>{f.icon}</div>
                    <h3 className="glass-card-title">{f.title}</h3>
                    <p className="glass-card-desc">{f.description}</p>
                  </div>
                );
              })}
            </div>

            <button className="feat-nav feat-nav-prev" onClick={() => setFeatIdx(i => (i - 1 + features.length) % features.length)}>&#8249;</button>
            <button className="feat-nav feat-nav-next" onClick={() => setFeatIdx(i => (i + 1) % features.length)}>&#8250;</button>

            <div className="feat-dots">
              {features.map((_, i) => (
                <button key={i} className={`feat-dot${i === featIdx ? " active" : ""}`} onClick={() => setFeatIdx(i)} />
              ))}
            </div>
          </div>
        </Container>
      </section>
      )}

      <PublicCourseCatalog onCourseClick={onCourseClick} />

      {/* ── MISSION ── */}
      <section className="neo-mission">
        <Container style={{ position: "relative", zIndex: 1 }}>
          <div className="mission-glass-panel mission-stories-panel">
            <SuccessStoriesSection />

            <button
              className="neo-cta-btn"
              style={{ marginTop: "2.5rem" }}
              onClick={() => onStartJourneyClick ? onStartJourneyClick() : navigate("/auth/sign-in")}
            >
              <span>Begin Your Mission</span>
              <FaArrowRight className="neo-cta-icon" />
            </button>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default About;
