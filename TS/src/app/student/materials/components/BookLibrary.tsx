import { useState } from "react"
import { booksList } from "./data/booksList"
import {
  FaSearch, FaFilter, FaBook, FaStar, FaClock, FaBrain,
} from "react-icons/fa"
import { BsBookHalf } from "react-icons/bs"
import bookAloneImg from "@/assets/images/Bookalone.png"

interface Props {
  onSelectBook: (id: string) => void
}

const ORANGE = "#ff6b00"

// Reads the same --dash-* CSS vars StudentLayout sets for dark mode
// (light-mode values as fallback), so this page re-themes with the portal.
const PAGE_BG     = 'var(--dash-page-bg, #ffffff)'
const CARD_BG     = 'var(--dash-card-bg, #ffffff)'
const PAGE_BORDER = 'var(--dash-border, #e2e8f0)'
const PAGE_TEXT   = 'var(--dash-text, #0f172a)'
const PAGE_GRAY   = 'var(--dash-gray, #64748b)'

/* ── category + author metadata per book id ── */
const BOOK_META: Record<string, { category: string; author: string; catColor: string; catBg: string }> = {
  c:           { category: "Programming",    author: "Brian Kernighan",    catColor: "#3b82f6", catBg: "#eff6ff" },
  react:       { category: "Web Development",author: "Kirupa Chinnathambi", catColor: "#06b6d4", catBg: "#ecfeff" },
  python:      { category: "Programming",    author: "Mark Lutz",           catColor: "#3b82f6", catBg: "#eff6ff" },
  java:        { category: "Programming",    author: "Herbert Schildt",     catColor: "#3b82f6", catBg: "#eff6ff" },
  html:        { category: "Web Development",author: "Jon Duckett",         catColor: "#06b6d4", catBg: "#ecfeff" },
  css:         { category: "Web Development",author: "Eric Meyer",          catColor: "#06b6d4", catBg: "#ecfeff" },
  javascript:  { category: "Web Development",author: "Kyle Simpson",        catColor: "#06b6d4", catBg: "#ecfeff" },
  csharp:      { category: "Programming",    author: "Andrew Troelsen",     catColor: "#3b82f6", catBg: "#eff6ff" },
  dsa:         { category: "Computer Science",author:"Thomas H. Cormen",    catColor: "#8b5cf6", catBg: "#f5f3ff" },
  genAI:       { category: "AI / ML",        author: "Anthropic Research",  catColor: "#ec4899", catBg: "#fdf2f8" },
  datascience: { category: "Data Science",   author: "Wes McKinney",        catColor: "#10b981", catBg: "#f0fdf4" },
  prompt:      { category: "AI / ML",        author: "OpenAI Community",    catColor: "#ec4899", catBg: "#fdf2f8" },
  mysql:       { category: "Database",       author: "Paul DuBois",         catColor: "#f59e0b", catBg: "#fffbeb" },
  node:        { category: "Web Development",author: "Shelley Powers",      catColor: "#06b6d4", catBg: "#ecfeff" },
  mongoDB:     { category: "Database",       author: "Shannon Bradshaw",    catColor: "#f59e0b", catBg: "#fffbeb" },
  express:     { category: "Web Development",author: "Azat Mardanov",       catColor: "#06b6d4", catBg: "#ecfeff" },
}

const CATEGORIES = ["All", "Programming", "Web Development", "Data Science", "Computer Science", "AI / ML", "Database"]

const BookLibrary = ({ onSelectBook }: Props) => {
  const [activeCategory, setActiveCategory] = useState("All")
  const [search, setSearch] = useState("")

  const filtered = booksList.filter(book => {
    const meta = BOOK_META[book.id]
    const matchCat = activeCategory === "All" || meta?.category === activeCategory
    const matchSearch = book.title.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, padding: "0 0 40px" }}>

      {/* ── Hero Banner ── */}
      <div style={{
        margin: "20px 24px 20px",
        borderRadius: 20,
        background: "linear-gradient(120deg, #f3e8ff 0%, #e9d5ff 55%, #d8b4fe 100%)",
        border: "1px solid #e9d5ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 28px",
        position: "relative",
        overflow: "hidden",
        minHeight: 100,
      }}>
        {/* decorative blobs */}
        <div style={{ position: "absolute", top: -40, right: 260, width: 180, height: 180, borderRadius: "50%", background: "rgba(139,92,246,0.12)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -50, left: "35%", width: 140, height: 140, borderRadius: "50%", background: "rgba(139,92,246,0.08)", pointerEvents: "none" }} />

        {/* Left content */}
        <div style={{ position: "relative", zIndex: 2, maxWidth: "55%" }}>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: "#fff", boxShadow: "0 2px 12px rgba(139,92,246,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <BsBookHalf style={{ color: "#7c3aed", fontSize: 22 }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>Books</div>
          </div>

          {/* Subtitle */}
          <div style={{ fontSize: 13, color: "#4c1d95", lineHeight: 1.6, marginBottom: 18 }}>
            Explore our handpicked collection of books<br />and enhance your knowledge.
          </div>

          {/* Feature badges */}
          <div style={{ display: "flex", gap: 24 }}>
            {[
              { Icon: FaStar,  label: "Curated",      sub: "Expert recommended" },
              { Icon: FaClock, label: "Learn Anytime", sub: "Read at your pace" },
              { Icon: FaBrain, label: "Grow Smarter",  sub: "Knowledge for success" },
            ].map(f => (
              <div key={f.label} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.6)", border: "1px solid #c4b5fd", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <f.Icon style={{ color: "#7c3aed", fontSize: 13 }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1e1b4b" }}>{f.label}</div>
                  <div style={{ fontSize: 10, color: "#5b21b6" }}>{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: book illustration */}
        <img
          src={bookAloneImg}
          alt="Books illustration"
          style={{ height: 130, width: "auto", objectFit: "contain", position: "relative", zIndex: 2, flexShrink: 0 }}
        />
      </div>

      {/* ── Category Pills + Search/Filter ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "10px 24px 16px" }}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 8, width: "max-content" }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: "6px 18px", borderRadius: 22,
                  border: activeCategory === cat ? "none" : `1px solid ${PAGE_BORDER}`,
                  background: activeCategory === cat ? ORANGE : CARD_BG,
                  color: activeCategory === cat ? "#fff" : PAGE_TEXT,
                  cursor: "pointer", fontSize: 12.5,
                  fontWeight: activeCategory === cat ? 700 : 500,
                  whiteSpace: "nowrap", outline: "none",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 260, background: CARD_BG, borderRadius: 12, border: `1px solid ${PAGE_BORDER}`, display: "flex", alignItems: "center", gap: 8, padding: "9px 14px" }}>
            <FaSearch style={{ color: PAGE_GRAY, fontSize: 13, flexShrink: 0 }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search books..."
              style={{ border: "none", background: "none", outline: "none", fontSize: 13, color: PAGE_TEXT, width: "100%" }}
            />
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 7, background: CARD_BG, border: `1px solid ${PAGE_BORDER}`, borderRadius: 10, padding: "9px 16px", fontSize: 13, color: PAGE_TEXT, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
            <FaFilter style={{ fontSize: 12, color: PAGE_GRAY }} /> Filter
          </button>
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: PAGE_BORDER, margin: "0 24px 20px" }} />

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: PAGE_GRAY }}>
          <FaBook style={{ fontSize: 32, marginBottom: 12, color: "#cbd5e1" }} />
          <div style={{ fontWeight: 600 }}>No books found</div>
        </div>
      ) : (
        <div style={{ padding: "0 24px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {filtered.map((book: any) => {
            const meta = BOOK_META[book.id] ?? { category: "General", author: "Author", catColor: "#64748b", catBg: "#f8fafc" }
            return (
              <div
                key={book.id}
                style={{
                  background: CARD_BG,
                  borderRadius: 16,
                  border: `1px solid ${PAGE_BORDER}`,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition: "box-shadow 0.2s, transform 0.2s",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 28px rgba(0,0,0,0.12)"
                  ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"
                  ;(e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"
                }}
              >
                {/* Book cover */}
                <div style={{ height: 280, overflow: "hidden", background: PAGE_BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <img
                    src={book.image}
                    alt={book.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>

                {/* Info */}
                <div style={{ padding: "14px 14px 16px", display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: PAGE_TEXT, marginBottom: 4, lineHeight: 1.35 }}>
                    {book.title}
                  </div>
                  <div style={{ fontSize: 11, color: PAGE_GRAY, marginBottom: 10 }}>{meta.author}</div>

                  <div style={{ marginBottom: 12 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: meta.catColor, background: meta.catBg, borderRadius: 20, padding: "3px 10px" }}>
                      {meta.category}
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectBook(book.id)}
                    style={{
                      marginTop: "auto",
                      width: "100%",
                      background: CARD_BG,
                      color: ORANGE,
                      border: `1.5px solid ${ORANGE}`,
                      borderRadius: 10,
                      padding: "8px 0",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = ORANGE
                      ;(e.currentTarget as HTMLButtonElement).style.color = "#fff"
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = CARD_BG
                      ;(e.currentTarget as HTMLButtonElement).style.color = ORANGE
                    }}
                  >
                    <FaBook style={{ fontSize: 11 }} /> Open
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default BookLibrary
