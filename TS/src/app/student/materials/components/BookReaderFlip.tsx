import HTMLFlipBook from "react-pageflip";
import { Chapter, Page } from "./data/reactBook";
import { useState, useRef, useEffect } from "react";
import "./BookReaderFlip.css";

interface PageChangeEvent {
    data: number;
}

interface Props {
    book: any;
    onBack: () => void;
}

type BookPage =
    | { type: "front-cover" }
    | { type: "title"; id: string; chapterIndex: number; title: string; description: string }
    | { type: "content"; id: string; side: "left" | "right"; chapterIndex: number; chapterTitle: string; chapterDescription?: string; pageData: Page }
    | { type: "interview" }
    | { type: "back-cover" };

const BookReaderFlip = ({ book, onBack }: Props) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [dimensions, setDimensions] = useState({ width: 700, height: 560 });
    const [menuOpen, setMenuOpen] = useState(false);
    const flipBookRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [quizAnswers, setQuizAnswers] = useState<{
        [pageId: string]: {
            [questionIndex: number]: number;
        };
    }>({});

    const [expandedQuestions, setExpandedQuestions] = useState<{
        [key: string]: boolean;
    }>({});

    const chapters: Chapter[] = book.chapters;

    const handleQuizAnswer = (
        pageId: string,
        questionIndex: number,
        selectedIndex: number,
        e: React.MouseEvent
    ) => {
       // e.stopPropagation(); // Prevent event from bubbling up to the flip book
        setQuizAnswers((prev) => ({
            ...prev,
            [pageId]: {
                ...prev[pageId],
                [questionIndex]: selectedIndex,
            },
        }));
    };

    const toggleQuestionExpand = (questionKey: string, e: React.MouseEvent) => {
       // e.stopPropagation(); // Stop event propagation
        setExpandedQuestions(prev => ({
            ...prev,
            [questionKey]: !prev[questionKey]
        }));
    };

    const getYouTubeVideoId = (url: string) => {
        if (!url) return null;
        const patterns = [
            /youtu\.be\/([^#&?]{11})/,
            /youtube\.com\/embed\/([^#&?]{11})/,
            /youtube\.com\/watch\?v=([^#&?]{11})/,
            /youtube\.com\/shorts\/([^#&?]{11})/
        ];
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    };

    // Calculate responsive dimensions with menu awareness
    useEffect(() => {
        const calculateDimensions = () => {
            if (containerRef.current) {
                const containerWidth = containerRef.current.clientWidth;
                const containerHeight = containerRef.current.clientHeight;

                let menuWidth = 320;
                if (window.innerWidth <= 480) {
                    menuWidth = 240;
                } else if (window.innerWidth <= 768) {
                    menuWidth = 280;
                }

                const menuOffset = menuOpen ? menuWidth : 0;
                const availableWidth = Math.max(containerWidth - menuOffset - 40, 400); // Subtract padding

                // Calculate dimensions based on available space
                let width = Math.min(800, availableWidth * 0.9);
                let height = width * 0.8; // Wide aspect ratio

                // Ensure height doesn't exceed container
               // Reserve space for top + bottom breathing gap
                const maxBookHeight = containerHeight * 0.83; // 👈 change this value

                if (height > maxBookHeight) {
                    height = maxBookHeight;
                    width = height * 1.25;
                }

                if (width > availableWidth) {
                    width = availableWidth;
                    height = width * 0.75;
                }

                setDimensions({ width, height });
            }
        };

        calculateDimensions();
        const timeoutId = setTimeout(calculateDimensions, 50);
        window.addEventListener('resize', calculateDimensions);

        return () => {
            window.removeEventListener('resize', calculateDimensions);
            clearTimeout(timeoutId);
        };
    }, [menuOpen]);

    // Create book pages
    const bookPages: BookPage[] = [
        { type: "front-cover" },
        ...chapters.flatMap((chapter, chapterIndex) => [
            {
                type: "title" as const,
                id: `title-${chapter.id}`,
                chapterIndex,
                title: chapter.title,
                description: chapter.description,
            },
            ...chapter.pages.flatMap((page) => {
                const pagesArray = [];
                pagesArray.push({
                    type: "content" as const,
                    id: `${page.id}-left`,
                    side: "left" as const,
                    chapterIndex,
                    chapterTitle: chapter.title,
                    chapterDescription: chapter.description,
                    pageData: page,
                });
                if (page.videoUrl || page.quiz || page.keyPoints) {
                    pagesArray.push({
                        type: "content" as const,
                        id: `${page.id}-right`,
                        side: "right" as const,
                        chapterIndex,
                        chapterTitle: chapter.title,
                        pageData: page,
                    });
                }
                return pagesArray;
            })
        ]),
        ...(book.interviewQuestions?.length
            ? [{ type: "interview" as const }]
            : []),
        { type: "back-cover" },
    ];

    const handlePageChange = (e: PageChangeEvent) => {
        setCurrentPage(e.data);
    };

    const handlePrevPage = () => flipBookRef.current?.pageFlip().flipPrev();
    const handleNextPage = () => flipBookRef.current?.pageFlip().flipNext();

    const goToPage = (pageIndex: number) => {
        if (flipBookRef.current) {
            flipBookRef.current.pageFlip().flip(pageIndex);
            setMenuOpen(false);
        }
    };

    const renderQuiz = (page: BookPage & { type: "content" }) => {
        if (!page.pageData.quiz) return null;

        const quizzes = Array.isArray(page.pageData.quiz)
            ? page.pageData.quiz
            : [page.pageData.quiz];

        return (
            <div
  className="quiz-section"
  onMouseDownCapture={(e) => e.stopPropagation()}
  onTouchStartCapture={(e) => e.stopPropagation()}
  onPointerDownCapture={(e) => e.stopPropagation()}
>
                <h6 className="quiz-section-title">📝 Knowledge Check</h6>
                {quizzes.map((quizItem, qIndex) => {
                    const questionKey = `${page.id}-q${qIndex}`;
                    const isExpanded = expandedQuestions[questionKey] !== false;
                    const selected = quizAnswers[page.id]?.[qIndex];

                    return (
                        <div key={qIndex} className="quiz-question-block">
                            <div
                                className="quiz-question-header"
                                onClick={(e) => toggleQuestionExpand(questionKey, e)}
                            >
                                <span className="quiz-question-number">Q{qIndex + 1}</span>
                                <p className="quiz-question">
                                    {quizItem.question}
                                </p>
                                <span className="expand-icon">
                                    {isExpanded ? '▼' : '▶'}
                                </span>
                            </div>

                            {isExpanded && (
                                <div className="quiz-options">
                                    {quizItem.options.map((opt: any, optIndex: any) => {
                                        const isSelected = selected === optIndex;
                                        const isCorrect = quizItem.correctAnswer === optIndex;
                                        const showResult = selected !== undefined;

                                        return (
                                            <button
                                                key={optIndex}
                                                className={`quiz-option 
                ${isSelected ? "selected" : ""}
                ${showResult && isCorrect ? "correct" : ""}
                ${showResult && isSelected && !isCorrect ? "wrong" : ""}
            `}
                                                onMouseDownCapture={(e) => e.stopPropagation()}
onClick={(e) => {
  handleQuizAnswer(
    page.id,
    qIndex,
    optIndex,
    e
  );
}}

                                                disabled={showResult}
                                            >
                                                <span className="option-letter">
                                                    {String.fromCharCode(65 + optIndex)}.
                                                </span>
                                                <span className="option-text">{opt}</span>
                                                {showResult && isSelected && (
                                                    <span className="result-icon">
                                                        {isCorrect ? '✓' : '✗'}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}

                                    {selected !== undefined && (
                                        <div className={`quiz-result ${selected === quizItem.correctAnswer ? 'correct' : 'wrong'}`}>
                                            <div className="result-icon-large">
                                                {selected === quizItem.correctAnswer ? '✅' : '❌'}
                                            </div>
                                            <div className="result-message">
                                                {selected === quizItem.correctAnswer
                                                    ? "Correct! Well done."
                                                    : `Incorrect. The correct answer is: ${quizItem.options[quizItem.correctAnswer]}`}
                                            </div>
                                            {quizItem.explanation && (
                                                <div className="quiz-explanation">
                                                    <strong>Explanation:</strong> {quizItem.explanation}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderContentWithHeadings = (content: string) => {
        if (!content) return null;

        const lines = content.split('\n');

        return lines.map((line, index) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return <br key={index} />;

            // Check for "Key Concepts:" style headings (word followed by colon)
            if (trimmedLine.match(/^[A-Za-z\s]+:$/)) {
                return (
                    <h6 key={index} className="content-heading-colon">
                        {trimmedLine}
                    </h6>
                );
            }

            // Check for numbered headings like "1. Multiple Contexts - Separate concerns"
            else if (trimmedLine.match(/^\d+\.\s.+/)) {
                return (
                    <h6 key={index} className="content-heading-numbered">
                        {trimmedLine}
                    </h6>
                );
            }

            // Check for bold markdown syntax (**text**)
            else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                const headingText = trimmedLine.replace(/\*\*/g, '');
                return (
                    <h6 key={index} className="content-heading-bold">
                        {headingText}
                    </h6>
                );
            }

            // Check for lines that end with colon (like "Performance Considerations:")
            else if (trimmedLine.endsWith(':')) {
                return (
                    <h6 key={index} className="content-heading-colon">
                        {trimmedLine}
                    </h6>
                );
            }

            // Regular paragraph
            else {
                return <p key={index} className="content-paragraph">{line}</p>;
            }
        });
    };

    const renderVideo = (url: string, title?: string) => {
        const videoId = getYouTubeVideoId(url);
        if (!videoId) return null;

        return (
            <div className="video-container">
                <div className="video-wrapper">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?controls=1&autoplay=0&rel=0`}
                        title="Video tutorial"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                        allowFullScreen
                        loading="lazy"
                    ></iframe>
                </div>
                <div className="video-caption">
                    <span className="video-badge">📺 VIDEO TUTORIAL</span>
                    <span className="video-title">{title || "Watch to learn more"}</span>
                </div>
            </div>
        );
    };

    const renderKeyPoints = (points?: string[]) => {
        if (!points || points.length === 0) return null;

        return (
            <div className="key-points">
                <h6 className="key-points-title">🎯 Key Points</h6>
                <ul className="key-points-list">
                    {points.map((point, index) => (
                        <li key={index} className="key-point-item">
                            <span className="point-bullet">•</span>
                            <span className="point-text">{point}</span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    const renderCode = (code?: string) => {
        if (!code) return null;

        return (
            <div className="code-container">
                <div className="code-header">
                    <span className="code-language">JSX</span>
                    <button
                        className="copy-button"
                        onClick={() => navigator.clipboard.writeText(code)}
                    >
                        📋 Copy
                    </button>
                </div>
                <pre className="code-block">
                    <code>{code}</code>
                </pre>
            </div>
        );
    };

    return (
        <div className="book-reader-container" ref={containerRef}>
            {/* Right Side Menu */}
            <div className={`book-menu ${menuOpen ? 'open' : ''}`}>
                <button
                    className="menu-toggle"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    {menuOpen ? '→' : '←'}
                </button>

                <div className="menu-content">
                    <button className="close-btn" onClick={onBack}>
                        <span>✕</span> Close Book
                    </button>

                    <div className="book-info-mini">
                        <h3>{book.title}</h3>
                        <p className="author">by {book.author}</p>
                    </div>

                    <div className="menu-section">
                        <h4>📚 Chapters</h4>
                        <ul className="chapter-list">
                            {chapters.map((chapter, idx) => {
                                let pageNum = 1;
                                for (let i = 0; i < idx; i++) {
                                    pageNum += 1 + (chapters[i].pages.length *
                                        (chapters[i].pages.some(p => p.videoUrl || p.quiz || p.keyPoints) ? 2 : 1));
                                }
                                return (
                                    <li key={chapter.id}>
                                        <button onClick={() => goToPage(pageNum)}>
                                            <span className="chapter-number">{idx + 1}</span>
                                            <div className="chapter-info">
                                                <span className="chapter-title">{chapter.title}</span>
                                                <span className="chapter-pages">
                                                    {chapter.pages.length} {chapter.pages.length === 1 ? 'page' : 'pages'}
                                                </span>
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <div className="menu-section">
                        <h4>📊 Progress</h4>
                        <div className="progress-stats">
                            <div className="stat-item">
                                <span className="stat-label">Current Page:</span>
                                <span className="stat-value">{currentPage + 1} / {bookPages.length}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Chapters:</span>
                                <span className="stat-value">{chapters.length}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Quiz Questions:</span>
                                <span className="stat-value">
                                    {chapters.reduce((acc, ch) =>
                                        acc + ch.pages.reduce((pAcc, p) =>
                                            pAcc + (p.quiz ? (Array.isArray(p.quiz) ? p.quiz.length : 1) : 0), 0), 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="book-wrapper">
                <HTMLFlipBook
                    ref={flipBookRef}
                    width={dimensions.width}
                    height={dimensions.height}
                    size="fixed"
                    minWidth={400}
                    maxWidth={1200}
                    minHeight={300}
                    maxHeight={900}
                    showCover={true}
                    startPage={0}
                    drawShadow={true}
                    flippingTime={800}
                    usePortrait={false}
                    startZIndex={0}
                    autoSize={true}
                    maxShadowOpacity={0.5}
                    mobileScrollSupport={true}
                    clickEventForward={true}
                    disableFlipByClick={false}
                    useMouseEvents={true}
                    swipeDistance={30}
                    showPageCorners={true}

                    className="book-shadow"
                    style={{}}
                    onFlip={handlePageChange}
                >
                    {bookPages.map((page, index) => {
                        const pageNumber = index + 1;

                        if (page.type === "front-cover") {
                            return (
                                <div className="book-cover front-cover" key="front-cover">
                                    <div className="cover-content">
                                        <div className="cover-decoration">
                                            <span className="cover-badge">📖</span>
                                        </div>
                                        <h1>{book.title}</h1>
                                        <h2>{book.subtitle}</h2>
                                        <div className="cover-author">
                                            <span>by</span>
                                            <strong>{book.author}</strong>
                                        </div>
                                        <div className="cover-footer">
                                            <span>✦ Complete Guide ✦</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        if (page.type === "title") {
                            return (
                                <div className="page title-page" key={page.id}>
                                    <div className="title-content">
                                        <span className="chapter-badge">Chapter {page.chapterIndex + 1}</span>
                                        <h2>{page.title}</h2>
                                        <div className="title-decoration"></div>
                                        <p>{page.description}</p>
                                    </div>
                                    <div className="page-number">{pageNumber}</div>
                                </div>
                            );
                        }

                        if (page.type === "content") {
                            return (
                                <div
                                    className={`page content-page ${page.side}-page`}
                                    key={page.id}
                                >
                                    <div className="page-header">
                                        <div className="header-left">
                                            <span className="chapter-indicator">
                                                Ch {page.chapterIndex + 1}
                                            </span>
                                            <h4>{page.pageData.title}</h4>
                                        </div>
                                        <span className="page-number-badge">{pageNumber}</span>
                                    </div>

                                    <div className="page-content-wrapper">
                                        {page.side === "left" && (
                                            <>
                                                <h5>{page.pageData.title}</h5>
                                                <div className="content-text">
                                                    {renderContentWithHeadings(page.pageData.content)}
                                                </div>

                                                {page.pageData.keyPoints && renderKeyPoints(page.pageData.keyPoints)}
                                                {page.pageData.exampleCode && renderCode(page.pageData.exampleCode)}
                                            </>
                                        )}

                                        {page.side === "right" && (
                                            <>
                                                {page.pageData.videoUrl && renderVideo(
                                                    page.pageData.videoUrl,
                                                    page.pageData.title
                                                )}
                                                {page.pageData.quiz && renderQuiz(page)}
                                            </>
                                        )}
                                    </div>

                                    <div className="page-footer">
                                        <span className="footer-left">{page.chapterTitle}</span>
                                        <span className="footer-right">React Mastery</span>
                                    </div>
                                </div>
                            );
                        }

                        if (page.type === "interview") {
                            return (
                                <div className="page interview-page" key="interview">
                                    <div className="interview-header">
                                        <span className="interview-badge">💼</span>
                                        <h2>Interview Questions</h2>
                                        <p className="interview-subtitle">
                                            {book.interviewQuestions.length} questions to ace your React interview
                                        </p>
                                    </div>

                                    <div className="interview-list">
                                        {book.interviewQuestions.map((item: any, index: number) => (
                                            <div key={index} className="interview-item">
                                                <div className="interview-question">
                                                    <span className="q-number">Q{index + 1}</span>
                                                    <h5>{item.question}</h5>
                                                    {item.difficulty && (
                                                        <span className={`difficulty-badge ${item.difficulty}`}>
                                                            {item.difficulty}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="interview-answer">
                                                    <span className="answer-label">Answer:</span>
                                                    <p>{item.answer}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="page-number">{pageNumber}</div>
                                </div>
                            );
                        }

                        if (page.type === "back-cover") {
                            return (
                                <div className="book-cover back-cover" key="back-cover">
                                    <div className="cover-content">
                                        <div className="back-cover-content">
                                            <h3>Congratulations!</h3>
                                            <p>You've completed</p>
                                            <h2>{book.title}</h2>
                                            <div className="book-summary">
                                                <div className="summary-item">
                                                    <span className="summary-number">{chapters.length}</span>
                                                    <span className="summary-label">Chapters</span>
                                                </div>
                                                <div className="summary-item">
                                                    <span className="summary-number">
                                                        {chapters.reduce((acc, ch) => acc + ch.pages.length, 0)}
                                                    </span>
                                                    <span className="summary-label">Topics</span>
                                                </div>
                                                <div className="summary-item">
                                                    <span className="summary-number">
                                                        {book.interviewQuestions?.length || 0}
                                                    </span>
                                                    <span className="summary-label">Interview Qs</span>
                                                </div>
                                            </div>
                                            <p className="farewell-message">
                                                Keep building, keep learning! 🚀
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        return null;
                    })}
                </HTMLFlipBook>

                <div className="book-controls">
                    <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 0}
                        className="control-btn prev-btn"
                    >
                        <span className="btn-icon">←</span>
                        <span className="btn-text">Previous</span>
                    </button>
                    <div className="page-indicator-container">
                        <span className="page-indicator">
                            Page {currentPage + 1} <span className="of-text">of</span> {bookPages.length}
                        </span>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${((currentPage + 1) / bookPages.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === bookPages.length - 1}
                        className="control-btn next-btn"
                    >
                        <span className="btn-text">Next</span>
                        <span className="btn-icon">→</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookReaderFlip;