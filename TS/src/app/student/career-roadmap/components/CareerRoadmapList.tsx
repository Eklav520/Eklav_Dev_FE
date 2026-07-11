import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FaCode, FaLayerGroup, FaMobileAlt, FaApple, FaChartBar, FaRobot,
  FaServer, FaCloud, FaBrain, FaGamepad, FaUsers, FaCubes, FaSearch,
  FaBookmark, FaArrowRight, FaClipboardList, FaUserGraduate, FaBolt,
  FaCommentDots, FaProjectDiagram, FaSortAmountDown,
} from 'react-icons/fa'
import {
  SiJavascript, SiLinux, SiDocker, SiKubernetes, SiMongodb,
  SiReact, SiTypescript, SiGithub, SiOpenai,
} from 'react-icons/si'
import { BsBookmark, BsGrid, BsListUl, BsLightbulb, BsPerson, BsLockFill, BsGrid3X3Gap } from 'react-icons/bs'
import { careerRoadmaps, type CareerRoadmap } from '../data/roadmaps'
import { useAuthContext } from '@/context/useAuthContext'
import roadmapImg from '@/assets/images/roadmap.png'
import roadImg from '@/assets/images/road.png'

/* ── Icon + tag metadata per roadmap ── */
const ROAD_META: Record<string, { Icon: any; tags: string[] }> = {
  'web-developer':        { Icon: FaCode,          tags: ['HTML', 'CSS', 'JavaScript', 'React'] },
  'full-stack-developer': { Icon: FaLayerGroup,    tags: ['JavaScript', 'Node.js', 'React', 'MongoDB'] },
  'android-developer':    { Icon: FaMobileAlt,     tags: ['Kotlin', 'Android', 'Jetpack', 'Firebase'] },
  'ios-developer':        { Icon: FaApple,         tags: ['Swift', 'SwiftUI', 'iOS', 'Core Data'] },
  'data-scientist':       { Icon: FaChartBar,      tags: ['Python', 'Pandas', 'NumPy', 'ML'] },
  'ai-engineer':          { Icon: FaRobot,         tags: ['Python', 'LLMs', 'APIs', 'Prompt Eng.'] },
  'backend-developer':    { Icon: FaServer,        tags: ['Node.js', 'APIs', 'SQL', 'Auth'] },
  'devops-engineer':      { Icon: FaCloud,         tags: ['Docker', 'CI/CD', 'AWS', 'Linux'] },
  'machine-learning':     { Icon: FaBrain,         tags: ['Python', 'scikit-learn', 'TF', 'Keras'] },
  'deep-learning':        { Icon: FaBrain,         tags: ['PyTorch', 'CNN', 'RNN', 'TensorFlow'] },
  'developer-relations':  { Icon: FaUsers,         tags: ['DevRel', 'Content', 'Community', 'APIs'] },
  'engineering-manager':  { Icon: FaProjectDiagram,tags: ['Leadership', 'Planning', 'Agile', 'OKRs'] },
  'game-developer':       { Icon: FaGamepad,       tags: ['Unity', 'C#', 'Physics', 'UI'] },
  'ml-engineer':          { Icon: FaBrain,         tags: ['MLOps', 'Python', 'Deployment', 'Pipeline'] },
  'nlp-engineer':         { Icon: FaCommentDots,   tags: ['NLP', 'BERT', 'Transformers', 'spaCy'] },
  'product-manager':      { Icon: FaClipboardList, tags: ['Roadmapping', 'PRD', 'Metrics', 'OKRs'] },
  'linux':                { Icon: SiLinux,         tags: ['Shell', 'Bash', 'Permissions', 'Processes'] },
  'docker':               { Icon: SiDocker,        tags: ['Images', 'Containers', 'Compose', 'Registry'] },
  'kubernetes':           { Icon: SiKubernetes,    tags: ['Pods', 'Deployments', 'Helm', 'Services'] },
  'git-github':           { Icon: SiGithub,        tags: ['Git', 'Branching', 'PRs', 'Actions'] },
  'javascript':           { Icon: SiJavascript,    tags: ['ES6+', 'DOM', 'Async', 'APIs'] },
  'mongodb':              { Icon: SiMongodb,       tags: ['CRUD', 'Aggregation', 'Atlas', 'Schema'] },
  'react':                { Icon: SiReact,         tags: ['JSX', 'Hooks', 'Redux', 'Router'] },
  'typescript':           { Icon: SiTypescript,    tags: ['Types', 'Interfaces', 'Generics', 'Enums'] },
  'openai-apis':          { Icon: SiOpenai,        tags: ['ChatGPT', 'Embeddings', 'Functions', 'RAG'] },
  'claude-code':          { Icon: FaRobot,         tags: ['Claude', 'Agents', 'Tools', 'MCP'] },
  'vibe-coding':          { Icon: FaBolt,          tags: ['AI IDEs', 'Cursor', 'Copilot', 'Prompts'] },
}

const SORT_OPTIONS = ['Popular', 'Newest', 'Topics: Low to High', 'Topics: High to Low']

/* ── Card ── */
const RoadmapCard = ({ roadmap, isLocked }: { roadmap: CareerRoadmap; isLocked: boolean }) => {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState(false)
  const meta = ROAD_META[roadmap.id] ?? { Icon: FaCode, tags: [] }
  const { Icon } = meta
  const tags = meta.tags
  const extraCount = roadmap.totalTopics > tags.length ? roadmap.totalTopics - tags.length : 0

  return (
    <div
      onClick={() => { if (!isLocked) navigate(`/student/career-roadmap/${roadmap.id}`) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff', borderRadius: 16, overflow: 'hidden',
        border: `1px solid ${hovered && !isLocked ? roadmap.color + '55' : '#f1f5f9'}`,
        boxShadow: hovered && !isLocked ? `0 8px 28px ${roadmap.color}22` : '0 2px 10px rgba(0,0,0,0.05)',
        cursor: isLocked ? 'not-allowed' : 'pointer',
        display: 'flex', flexDirection: 'column',
        transition: 'all 0.2s',
        opacity: isLocked ? 0.65 : 1,
      }}
    >
      {/* Top color bar */}
      <div style={{ height: 4, background: roadmap.color }} />

      <div style={{ padding: '16px 16px 0' }}>
        {/* Icon row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: roadmap.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon style={{ color: roadmap.color, fontSize: 22 }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: roadmap.color, background: roadmap.color + '15', borderRadius: 6, padding: '3px 9px', letterSpacing: '0.6px' }}>
              {roadmap.type}
            </span>
            {isLocked
              ? <BsLockFill style={{ color: '#94a3b8', fontSize: 14 }} />
              : <BsBookmark style={{ color: '#94a3b8', fontSize: 14 }} />
            }
          </div>
        </div>

        {/* Title */}
        <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', marginBottom: 6, lineHeight: 1.3 }}>
          {roadmap.title}
        </div>

        {/* Description */}
        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, marginBottom: 14 }}>
          {roadmap.description}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#f1f5f9', marginBottom: 12 }} />

        {/* Topics + Difficulty */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b' }}>
            <FaClipboardList style={{ fontSize: 12, color: '#94a3b8' }} />
            {roadmap.totalTopics} Topics
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#64748b' }}>
            <FaUserGraduate style={{ fontSize: 12, color: '#94a3b8' }} />
            Beginner to Advanced
          </div>
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
          {tags.map(tag => (
            <span key={tag} style={{ fontSize: 11, fontWeight: 600, color: roadmap.color, background: roadmap.color + '12', borderRadius: 20, padding: '2px 9px' }}>
              {tag}
            </span>
          ))}
          {extraCount > 0 && (
            <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', background: '#f8fafc', borderRadius: 20, padding: '2px 9px', border: '1px solid #e2e8f0' }}>
              +{extraCount}
            </span>
          )}
        </div>
      </div>

      {/* Explore button */}
      <div style={{ padding: '0 16px 16px', marginTop: 'auto' }}>
        <button
          onClick={e => { e.stopPropagation(); if (!isLocked) navigate(`/student/career-roadmap/${roadmap.id}`) }}
          disabled={isLocked}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 10, border: 'none',
            background: isLocked ? '#e2e8f0' : roadmap.color,
            color: isLocked ? '#94a3b8' : '#fff',
            fontWeight: 700, fontSize: 13, cursor: isLocked ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'opacity 0.15s',
          }}
        >
          {isLocked ? <><BsLockFill style={{ fontSize: 12 }} /> Locked</> : <>Explore Roadmap <FaArrowRight style={{ fontSize: 11 }} /></>}
        </button>
      </div>
    </div>
  )
}

/* ── Main Page ── */
const CareerRoadmapList = () => {
  const { user } = useAuthContext()
  const isPending = user?.status?.toLowerCase() === 'pending'
  const freeRoadmapId = careerRoadmaps[0]?.id

  const [search, setSearch]         = useState('')
  const [activeType, setActiveType] = useState<'ALL' | 'ROLE' | 'SKILL'>('ALL')
  const [sortBy, setSortBy]         = useState('Popular')
  const [viewMode, setViewMode]     = useState<'grid' | 'list'>('grid')

  const filtered = careerRoadmaps.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
    const matchType   = activeType === 'ALL' || r.type === activeType
    return matchSearch && matchType
  })

  const roleRoadmaps  = filtered.filter(r => r.type === 'ROLE')
  const skillRoadmaps = filtered.filter(r => r.type === 'SKILL')

  const counts = {
    ALL:  careerRoadmaps.length,
    ROLE: careerRoadmaps.filter(r => r.type === 'ROLE').length,
    SKILL: careerRoadmaps.filter(r => r.type === 'SKILL').length,
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>

      {/* ── Hero Banner ── */}
      <div style={{
        background: 'linear-gradient(120deg, #fffbf5 0%, #fff5e8 60%, #ffecd4 100%)',
        borderBottom: '1px solid #fde8c8',
        padding: '40px 32px 0',
        position: 'relative', overflow: 'hidden',
        minHeight: 220,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        {/* Dot grid */}
        <div style={{ position: 'absolute', right: 0, left: '40%', top: 0, bottom: 0, opacity: 0.15, backgroundImage: 'radial-gradient(circle, #cc5500 1.5px, transparent 1.5px)', backgroundSize: '20px 20px', pointerEvents: 'none' }} />

        {/* Left content */}
        <div style={{ zIndex: 2, paddingBottom: 32, maxWidth: 520 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#ff6b00', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FaBolt style={{ fontSize: 12 }} /> Your Future, Structured
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 900, color: '#0f172a', margin: '0 0 10px', lineHeight: 1.1 }}>
            Career Roadmaps
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 24px', lineHeight: 1.6 }}>
            Choose your career path and follow a structured learning journey<br />designed by industry experts.
          </p>

          {/* Search bar */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden', maxWidth: 460 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', flex: 1 }}>
              <FaSearch style={{ color: '#94a3b8', fontSize: 14, flexShrink: 0 }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search roadmaps, skills, roles..."
                style={{ border: 'none', outline: 'none', fontSize: 13, color: '#374151', width: '100%', background: 'transparent' }}
              />
            </div>
            <button style={{ background: '#ff6b00', border: 'none', padding: '12px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FaSearch style={{ color: '#fff', fontSize: 14 }} />
            </button>
          </div>
          </div>

        {/* Center: Road illustration */}
        <img
          src={roadImg}
          alt="Road"
          style={{ height: 210, width: 'auto', objectFit: 'contain', alignSelf: 'flex-end', zIndex: 2, flexShrink: 0 }}
        />

        {/* Right: Boy illustration */}
        <img
          src={roadmapImg}
          alt="Career illustration"
          style={{ height: 200, width: 'auto', objectFit: 'contain', alignSelf: 'flex-end', zIndex: 2, flexShrink: 0 }}
        />
      </div>

      <div style={{ padding: '28px 32px 40px' }}>

        {/* ── Stats Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { value: `${counts.ALL}+`,  label: 'Career Roadmaps',     sub: 'Curated by Experts',    color: '#ff6b00', bg: '#fff7f0', Icon: FaClipboardList },
            { value: '150+', label: 'Courses & Resources',  sub: 'Handpicked for you',    color: '#22c55e', bg: '#f0fdf4', Icon: FaUserGraduate },
            { value: '500+', label: 'Skills to Master',     sub: 'Industry Relevant',     color: '#8b5cf6', bg: '#faf5ff', Icon: FaBolt },
            { value: '50K+', label: 'Learners on Track',    sub: 'Building their future', color: '#3b82f6', bg: '#eff6ff', Icon: FaUsers },
          ].map(({ value, label, sub, color, bg, Icon: StatIcon }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 14, border: '1px solid #f1f5f9', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <StatIcon style={{ color, fontSize: 20 }} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 3 }}>{label}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filter + Sort bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          {/* Type pills */}
          <div style={{ display: 'flex', gap: 8 }}>
            {([
              { key: 'ALL',  label: 'All Roadmaps', Icon: BsGrid3X3Gap },
              { key: 'ROLE', label: 'Role-Based',   Icon: BsPerson },
              { key: 'SKILL',label: 'Skill-Based',  Icon: BsLightbulb },
            ] as const).map(({ key, label, Icon: TabIcon }) => (
              <button
                key={key}
                onClick={() => setActiveType(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 16px', borderRadius: 22,
                  background: activeType === key ? '#ff6b00' : '#fff',
                  color: activeType === key ? '#fff' : '#374151',
                  border: activeType === key ? 'none' : '1px solid #e2e8f0',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  boxShadow: activeType === key ? '0 4px 14px rgba(255,107,0,0.3)' : '0 1px 4px rgba(0,0,0,0.05)',
                }}
              >
                <TabIcon style={{ fontSize: 13 }} />
                {label}
                <span style={{
                  fontSize: 11, fontWeight: 800, minWidth: 20, textAlign: 'center',
                  background: activeType === key ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                  color: activeType === key ? '#fff' : '#64748b',
                  borderRadius: 20, padding: '1px 7px',
                }}>
                  {counts[key]}
                </span>
              </button>
            ))}
          </div>

          {/* Sort + View */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '8px 14px' }}>
              <FaSortAmountDown style={{ color: '#94a3b8', fontSize: 13 }} />
              <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>Sort by:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{ border: 'none', outline: 'none', fontSize: 13, color: '#374151', fontWeight: 700, background: 'transparent', cursor: 'pointer' }}
              >
                {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 2 }}>
              {([['grid', BsGrid3X3Gap], ['list', BsListUl]] as const).map(([mode, ModeIcon]) => (
                <button key={mode} onClick={() => setViewMode(mode)} style={{ padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, background: viewMode === mode ? '#ff6b00' : '#fff', color: viewMode === mode ? '#fff' : '#94a3b8', cursor: 'pointer' }}>
                  <ModeIcon style={{ fontSize: 14 }} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pending notice */}
        {isPending && (
          <div style={{ background: '#fff7f0', border: '1px solid #fed7aa', borderRadius: 10, padding: '10px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
            <BsLockFill style={{ color: '#ff6b00', flexShrink: 0 }} />
            <span><strong style={{ color: '#ff6b00' }}>Trial access:</strong> You can explore <strong>1 roadmap</strong> for free. Enroll to unlock all.</span>
          </div>
        )}

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <FaSearch style={{ fontSize: 36, color: '#e2e8f0', marginBottom: 12 }} />
            <div style={{ fontWeight: 600, fontSize: 15 }}>No roadmaps found for "<strong style={{ color: '#0f172a' }}>{search}</strong>"</div>
          </div>
        ) : (
          <>
            {/* ── Role-Based Section ── */}
            {roleRoadmaps.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Popular Career Roadmaps</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>Discover the most in-demand career paths and start your journey today</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? 'repeat(4,1fr)' : '1fr', gap: 18 }}>
                  {roleRoadmaps.map(r => (
                    <RoadmapCard key={r.id} roadmap={r} isLocked={isPending && r.id !== freeRoadmapId} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Skill-Based Section ── */}
            {skillRoadmaps.length > 0 && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Skill-Based Roadmaps</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>Deep dive into a specific technology or skill</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? 'repeat(4,1fr)' : '1fr', gap: 18 }}>
                  {skillRoadmaps.map(r => (
                    <RoadmapCard key={r.id} roadmap={r} isLocked={isPending && r.id !== freeRoadmapId} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CareerRoadmapList
