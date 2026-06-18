import { useState } from 'react'
import { Card } from 'react-bootstrap'
import PageMetaData from '@/components/PageMetaData'
import Bookmark from './components/Bookmark'
import DailyExam from './components/DailyExam'

type Tab = 'practice' | 'daily'

const TABS: { key: Tab; icon: string; label: string; desc: string; accent: string }[] = [
  { key: 'daily',    icon: '🗓️', label: 'Daily Exam',    desc: 'One exam per day · Tracked progress', accent: '#ff7a00' },
  { key: 'practice', icon: '📚', label: 'Practice Quiz', desc: 'Topic-wise · Unlimited attempts',       accent: '#6366f1' },
]

const Aptitude = () => {
  const [tab, setTab] = useState<Tab>('daily')

  return (
    <>
      <PageMetaData title="Aptitude Preparation" />

      {/* ── Page header ── */}
      <div style={{ marginBottom: 28 }}>
        <h4 style={{ color: '#f0f0f0', fontWeight: 800, fontSize: 22, margin: 0, marginBottom: 4 }}>
          Aptitude Preparation
        </h4>
        <p style={{ color: '#555', fontSize: 13, margin: 0 }}>
          Sharpen your aptitude skills with daily exams and topic-wise practice quizzes.
        </p>
      </div>

      {/* ── Tab cards ── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
        {TABS.map(t => {
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: '1 1 200px', minWidth: 180, maxWidth: 280,
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '16px 20px',
                background: active ? `${t.accent}12` : '#0e0e16',
                border: `1.5px solid ${active ? t.accent : '#1e1e28'}`,
                borderRadius: 14,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                boxShadow: active ? `0 4px 20px ${t.accent}20` : 'none',
                outline: 'none',
              }}
            >
              {/* Icon box */}
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: active ? `${t.accent}22` : '#151520',
                border: `1px solid ${active ? `${t.accent}44` : '#2a2a38'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>
                {t.icon}
              </div>

              {/* Text */}
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: active ? '#f0f0f0' : '#888', marginBottom: 3 }}>
                  {t.label}
                </div>
                <div style={{ fontSize: 11, color: active ? `${t.accent}cc` : '#444', lineHeight: 1.4 }}>
                  {t.desc}
                </div>
              </div>

              {/* Active indicator dot */}
              {active && (
                <div style={{
                  marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%',
                  background: t.accent, flexShrink: 0,
                  boxShadow: `0 0 8px ${t.accent}`,
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* ── Divider with label ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ height: 1, flex: 1, background: '#1e1e28' }} />
        <span style={{ fontSize: 11, color: '#333', textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: 700 }}>
          {TABS.find(t => t.key === tab)?.label}
        </span>
        <div style={{ height: 1, flex: 1, background: '#1e1e28' }} />
      </div>

      {tab === 'daily' ? (
        <Card className="bg-transparent border-0">
          <Card.Body className="p-0">
            <DailyExam />
          </Card.Body>
        </Card>
      ) : (
        <Card className="bg-transparent border rounded-4">
          <Bookmark />
        </Card>
      )}
    </>
  )
}

export default Aptitude
