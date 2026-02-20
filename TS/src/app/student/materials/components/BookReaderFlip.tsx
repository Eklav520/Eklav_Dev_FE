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



    const chapters: Chapter[] = book.chapters;

    const handleQuizAnswer = (
        pageId: string,
        questionIndex: number,
        selectedIndex: number
    ) => {
        setQuizAnswers((prev) => ({
            ...prev,
            [pageId]: {
                ...prev[pageId],
                [questionIndex]: selectedIndex,
            },
        }));
    };



    const getYouTubeVideoId = (url: string) => {
        if (!url) return null;
        // Handle different YouTube URL formats
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

                // Get menu width based on screen size (match CSS)
                let menuWidth = 320; // Default
                if (window.innerWidth <= 480) {
                    menuWidth = 240;
                } else if (window.innerWidth <= 768) {
                    menuWidth = 280;
                }

                // Adjust available width based on menu state
                const menuOffset = menuOpen ? menuWidth : 0;
                const availableWidth = Math.max(containerWidth - menuOffset - 40, 400); // Subtract padding

                // Calculate dimensions based on available space
                let width = Math.min(800, availableWidth * 0.9);
                let height = width * 0.8; // Wide aspect ratio

                // Ensure height doesn't exceed container
                if (height > containerHeight * 0.8) {
                    height = containerHeight * 0.8;
                    width = height * 1.25;
                }

                // Final safety check - ensure width fits
                if (width > availableWidth) {
                    width = availableWidth;
                    height = width * 0.8;
                }

                setDimensions({ width, height });
            }
        };

        calculateDimensions();

        // Small delay for smooth transition when menu toggles
        const timeoutId = setTimeout(calculateDimensions, 50);

        window.addEventListener('resize', calculateDimensions);

        return () => {
            window.removeEventListener('resize', calculateDimensions);
            clearTimeout(timeoutId);
        };
    }, [menuOpen]); // Recalculate when menu opens/closes

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

                // Always add left page
                pagesArray.push({
                    type: "content" as const,
                    id: `${page.id}-left`,
                    side: "left" as const,
                    chapterIndex,
                    chapterTitle: chapter.title,
                    chapterDescription: chapter.description,
                    pageData: page,
                });

                // Add right page ONLY if needed
                if (page.videoUrl || page.quiz) {
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

        // Add Interview page if exists
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
                        ✕ Close Book
                    </button>

                    <div className="menu-section">
                        <h4>Chapters</h4>
                        <ul className="chapter-list">
                            {chapters.map((chapter, idx) => (
                                <li key={chapter.id}>
                                    <button onClick={() => {
                                        // Calculate page number for chapter start
                                        let pageNum = 1; // Start after cover
                                        for (let i = 0; i < idx; i++) {
                                            pageNum += 1 + (chapters[i].pages.length * 2);
                                        }
                                        goToPage(pageNum);
                                    }}>
                                        <span className="chapter-number">{idx + 1}</span>
                                        <span className="chapter-title">{chapter.title}</span>
                                    </button>
                                </li>
                            ))}
                        </ul>
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
                    minHeight={320}
                    maxHeight={960}
                    showCover={true}
                    startPage={0}
                    drawShadow={true}
                    flippingTime={800}
                    usePortrait={false}
                    startZIndex={0}
                    autoSize={true}
                    maxShadowOpacity={0.7}
                    mobileScrollSupport={true}
                    clickEventForward={true}
                    useMouseEvents={true}
                    swipeDistance={30}
                    showPageCorners={true}
                    disableFlipByClick={false}
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
                                        <h1>{book.title}</h1>
                                        <h3>{book.subtitle}</h3>
                                        <p>{book.author}</p>
                                    </div>
                                </div>
                            );
                        }

                        if (page.type === "title") {
                            return (
                                <div className="page title-page" key={page.id}>
                                    <h2>Chapter {page.chapterIndex + 1}</h2>
                                    <h3>{page.title}</h3>
                                    <p>{page.description}</p>
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
                                        <h4>{page.chapterTitle}</h4>
                                        <span className="page-number-badge">{pageNumber}</span>
                                    </div>

                                    <div className="page-content-wrapper">
                                        {page.side === "left" && (
                                            <>
                                                <h5>{page.pageData.title}</h5>
                                                <p>{page.pageData.content}</p>

                                                {page.pageData.exampleCode && (
                                                    <div className="example-under-title">
                                                        <h6>Example</h6>
                                                        <pre className="code-block">
                                                            <code>{page.pageData.exampleCode}</code>
                                                        </pre>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {page.side === "right" && (
                                            <>
                                                {page.pageData.videoUrl && (
                                                    <div className="video-embed-container">
                                                        <div className="video-embed">
                                                            <iframe
                                                                src={`https://www.youtube.com/embed/${getYouTubeVideoId(page.pageData.videoUrl)}?controls=1&autoplay=0&rel=0`}
                                                                title="Video tutorial"
                                                                frameBorder="0"
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                                                                allowFullScreen
                                                                loading="lazy"
                                                            ></iframe>
                                                            {/* Optional fallback link */}
                                                            <a
                                                                href={page.pageData.videoUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="video-fallback"
                                                            >
                                                                Watch on YouTube.com
                                                            </a>
                                                        </div>
                                                        <div className="video-caption">
                                                            <h6>📺 VIDEO TUTORIAL</h6>
                                                            <p>{page.pageData.title || "Understanding JSX"}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {page.pageData.quiz && (
                                                    <div className="quiz-section">
                                                        {(Array.isArray(page.pageData.quiz)
                                                            ? page.pageData.quiz
                                                            : [page.pageData.quiz]
                                                        ).map((quizItem, qIndex) => {
                                                            const selected =
                                                                quizAnswers[page.id]?.[qIndex];

                                                            return (
                                                                <div key={qIndex} className="quiz-question-block">
                                                                    <p className="quiz-question">
                                                                        {qIndex + 1}. {quizItem.question}
                                                                    </p>

                                                                    <div className="quiz-options">
                                                                        {quizItem.options.map((opt: any, optIndex: any) => {
                                                                            const isSelected = selected === optIndex;
                                                                            const isCorrect =
                                                                                quizItem.correctAnswer === optIndex;
                                                                            const showResult = selected !== undefined;

                                                                            return (
                                                                                <button
                                                                                    key={optIndex}
                                                                                    className={`quiz-option 
                                    ${isSelected ? "selected" : ""}
                                    ${showResult && isCorrect ? "correct" : ""}
                                    ${showResult && isSelected && !isCorrect ? "wrong" : ""}
                                `}
                                                                                    onClick={() =>
                                                                                        handleQuizAnswer(
                                                                                            page.id,
                                                                                            qIndex,
                                                                                            optIndex
                                                                                        )
                                                                                    }
                                                                                    disabled={showResult}
                                                                                >
                                                                                    {opt}
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>

                                                                    {selected !== undefined && (
                                                                        <div className="quiz-result">
                                                                            {selected === quizItem.correctAnswer
                                                                                ? "✅ Correct Answer!"
                                                                                : "❌ Wrong Answer"}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}


                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        }

                        if (page.type === "interview") {
                            return (
                                <div className="page interview-page" key="interview">
                                    <div className="interview-title">
                                        <h2>Interview Questions</h2>
                                    </div>


                                    <div className="page-content-wrapper">
                                        {book.interviewQuestions.map((item: any, index: number) => (
                                            <div key={index} className="interview-question-block">
                                                <h5>{index + 1}. {item.question}</h5>
                                                <p>{item.answer}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        }


                        if (page.type === "back-cover") {
                            return (
                                <div className="book-cover back-cover" key="back-cover">
                                    <div className="cover-content">
                                        <h2>Happy Learning!</h2>
                                        <p>You've completed {book.title}</p>
                                    </div>
                                </div>
                            );
                        }

                        return null;
                    })}
                </HTMLFlipBook>

                {/* Add back the book controls */}
                <div className="book-controls">
                    <button
                        onClick={handlePrevPage}
                        disabled={currentPage === 0}
                        className="control-btn prev-btn"
                    >
                        ← Previous
                    </button>
                    <span className="page-indicator">
                        Page {currentPage + 1} of {bookPages.length}
                    </span>
                    <button
                        onClick={handleNextPage}
                        disabled={currentPage === bookPages.length - 1}
                        className="control-btn next-btn"
                    >
                        Next →
                    </button>
                </div>

            </div>
        </div>
    );
};

export default BookReaderFlip;