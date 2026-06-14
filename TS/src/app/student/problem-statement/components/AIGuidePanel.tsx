import { useState, useEffect, useRef, useCallback } from 'react'
import mermaid from 'mermaid'
import { useAuthContext } from '@/context/useAuthContext'

/* ── Types ─────────────────────────────────────────────── */
interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  problem: string
  problemTitle: string
  language: string
  getCode: () => string   // live ref — always reads current editor value
}

/* ── Message renderer — parses ```code``` blocks ───────── */
function renderMessage(content: string) {
  const parts = content.split(/(```[\w]*\n[\s\S]*?```)/g)
  return parts.map((part, i) => {
    const match = part.match(/```([\w]*)\n([\s\S]*?)```/)
    if (match) {
      return (
        <pre key={i} style={{
          background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: 6,
          padding: '10px 12px', margin: '8px 0 0', fontSize: '0.78rem',
          color: '#e2e8f0', overflowX: 'auto', whiteSpace: 'pre' as const,
          fontFamily: '"Fira Code", "Cascadia Code", monospace',
        }}>
          {match[1] && (
            <span style={{ display: 'block', fontSize: '0.65rem', color: '#555', marginBottom: 6 }}>
              {match[1]}
            </span>
          )}
          {match[2].trimEnd()}
        </pre>
      )
    }
    return part ? <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span> : null
  })
}

/* ── Mermaid renderer ───────────────────────────────────── */
mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' })

let _mermaidId = 0
const renderMermaid = async (code: string): Promise<string> => {
  const id = `mermaid-${++_mermaidId}`
  try {
    const { svg } = await mermaid.render(id, code)
    return svg
  } catch {
    return ''
  }
}

/* ── Styles ─────────────────────────────────────────────── */
const S = {
  root: {
    display: 'flex', flexDirection: 'column' as const,
    height: '100%', background: '#0f0f0f', color: '#e5e7eb',
  },
  subTabBar: {
    display: 'flex', borderBottom: '1px solid #1e1e1e', flexShrink: 0,
  },
  subTab: (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '8px 0', fontSize: '0.78rem', fontWeight: active ? 700 : 500,
    color: active ? '#ff7a00' : '#555', background: 'none', border: 'none',
    borderBottom: active ? '2px solid #ff7a00' : '2px solid transparent',
    cursor: 'pointer', transition: 'all 0.15s',
  }),
  /* Chat */
  messages: {
    flex: 1, overflowY: 'auto' as const, padding: '12px 14px', display: 'flex',
    flexDirection: 'column' as const, gap: 10,
  },
  bubble: (role: 'user' | 'assistant'): React.CSSProperties => ({
    maxWidth: '85%',
    alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
    background: role === 'user' ? '#ff7a00' : '#1a1a1a',
    color: role === 'user' ? '#fff' : '#d1d5db',
    border: role === 'assistant' ? '1px solid #2a2a2a' : 'none',
    borderRadius: role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
    padding: '9px 13px', fontSize: '0.82rem', lineHeight: 1.55,
  }),
  roleLabel: (role: 'user' | 'assistant'): React.CSSProperties => ({
    fontSize: '0.65rem', color: '#444', marginBottom: 3,
    textAlign: role === 'user' ? 'right' : 'left' as const,
  }),
  hintRow: {
    display: 'flex', gap: 6, padding: '8px 14px', borderTop: '1px solid #1a1a1a',
    flexShrink: 0,
  },
  hintBtn: (active: boolean): React.CSSProperties => ({
    flex: 1, fontSize: '0.72rem', padding: '5px 0', borderRadius: 6, cursor: 'pointer',
    border: `1px solid ${active ? '#ff7a00' : '#2a2a2a'}`,
    background: active ? 'rgba(255,122,0,0.12)' : '#111',
    color: active ? '#ff7a00' : '#555', fontWeight: active ? 700 : 400,
    transition: 'all 0.15s',
  }),
  inputRow: {
    display: 'flex', gap: 8, padding: '10px 14px',
    borderTop: '1px solid #1a1a1a', flexShrink: 0,
  },
  input: {
    flex: 1, background: '#1a1a1a', border: '1px solid #2a2a2a',
    borderRadius: 8, color: '#e5e7eb', padding: '8px 12px',
    fontSize: '0.83rem', resize: 'none' as const, outline: 'none',
    fontFamily: 'inherit',
  },
  sendBtn: (disabled: boolean): React.CSSProperties => ({
    background: disabled ? '#2a2a2a' : '#ff7a00', border: 'none',
    borderRadius: 8, color: disabled ? '#444' : '#fff',
    padding: '0 16px', cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '0.82rem', fontWeight: 600, flexShrink: 0,
    transition: 'all 0.15s',
  }),
  /* Flowchart */
  flowchartWrap: {
    flex: 1, overflowY: 'auto' as const, padding: 16,
    display: 'flex', flexDirection: 'column' as const, gap: 12,
  },
  genBtn: {
    background: '#ff7a00', border: 'none', borderRadius: 8,
    color: '#fff', padding: '9px 20px', fontSize: '0.83rem',
    fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' as const,
  },
  svgWrap: {
    background: '#111', border: '1px solid #222', borderRadius: 10,
    padding: 16, overflowX: 'auto' as const,
  },
  empty: {
    flex: 1, display: 'flex', flexDirection: 'column' as const,
    alignItems: 'center', justifyContent: 'center', gap: 10,
    color: '#444', fontSize: '0.82rem', textAlign: 'center' as const,
  },
}

/* ── Component ──────────────────────────────────────────── */
export default function AIGuidePanel({ problem, problemTitle, language, getCode }: Props) {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  const [subTab, setSubTab] = useState<'chat' | 'flowchart'>('chat')

  /* Chat state */
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi! I'm your AI coding mentor for "${problemTitle}" 👋\n\nI won't give you the answer — but I'll guide you step by step with questions and hints.\n\nTry writing some code first, then ask me anything. You can also request a hint (Level 1 → 3) when you're stuck.`,
    },
  ])
  const [input, setInput] = useState('')
  const [hintLevel, setHintLevel] = useState<0 | 1 | 2 | 3>(0)
  const [chatLoading, setChatLoading] = useState(false)
  const msgEndRef = useRef<HTMLDivElement>(null)

  /* Flowchart state */
  const [flowSvg, setFlowSvg] = useState('')
  const [flowLoading, setFlowLoading] = useState(false)
  const [flowError, setFlowError] = useState('')

  /* Auto-scroll chat */
  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, chatLoading])

  /* Send chat message */
  const sendMessage = useCallback(async (customContent?: string) => {
    const text = (customContent ?? input).trim()
    if (!text && hintLevel === 0) return

    const userMsg: Message = {
      role: 'user',
      content: hintLevel > 0
        ? `${text ? text + '\n\n' : ''}[Requesting Hint Level ${hintLevel}]`
        : text,
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setChatLoading(true)

    try {
      const res = await fetch(`${baseURL}/api/aiEvaluate/guide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          problem,
          language,
          code: getCode(),
          hintLevel,
          messages: messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || 'Sorry, I could not respond.' }])
      setHintLevel(0)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Please try again.' }])
    } finally {
      setChatLoading(false)
    }
  }, [input, hintLevel, messages, problem, language, getCode, baseURL, user?.token])

  /* Keyboard submit */
  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  /* Generate flowchart */
  const generateFlowchart = async () => {
    setFlowLoading(true)
    setFlowError('')
    setFlowSvg('')
    try {
      const res = await fetch(`${baseURL}/api/aiEvaluate/flowchart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ problem, title: problemTitle }),
      })
      const data = await res.json()
      if (!data.mermaid) throw new Error('No flowchart returned')
      const svg = await renderMermaid(data.mermaid)
      if (!svg) throw new Error('Could not render flowchart')
      setFlowSvg(svg)
    } catch (err: any) {
      setFlowError(err.message || 'Failed to generate flowchart')
    } finally {
      setFlowLoading(false)
    }
  }

  /* Auto-generate flowchart when tab opens for first time */
  const flowGenerated = useRef(false)
  useEffect(() => {
    if (subTab === 'flowchart' && !flowGenerated.current && !flowSvg) {
      flowGenerated.current = true
      generateFlowchart()
    }
  }, [subTab])

  return (
    <div style={S.root}>
      {/* Sub-tab bar */}
      <div style={S.subTabBar}>
        <button style={S.subTab(subTab === 'chat')} onClick={() => setSubTab('chat')}>
          💬 Chat Mentor
        </button>
        <button style={S.subTab(subTab === 'flowchart')} onClick={() => setSubTab('flowchart')}>
          🔀 Algorithm Flow
        </button>
      </div>

      {/* ── CHAT ── */}
      {subTab === 'chat' && (
        <>
          {/* Messages */}
          <div style={S.messages}>
            {messages.map((m, i) => (
              <div key={i}>
                <div style={S.roleLabel(m.role)}>
                  {m.role === 'assistant' ? '🤖 AI Mentor' : '👤 You'}
                </div>
                <div style={S.bubble(m.role)}>
                  {m.role === 'assistant' ? renderMessage(m.content) : m.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div>
                <div style={S.roleLabel('assistant')}>🤖 AI Mentor</div>
                <div style={{ ...S.bubble('assistant'), color: '#555' }}>
                  <span className="spinner-border spinner-border-sm me-2" style={{ width: 12, height: 12, borderWidth: 2 }} />
                  Thinking…
                </div>
              </div>
            )}
            <div ref={msgEndRef} />
          </div>

          {/* Hint level row */}
          <div style={S.hintRow}>
            <span style={{ fontSize: '0.7rem', color: '#444', alignSelf: 'center', flexShrink: 0 }}>Hint:</span>
            {([1, 2, 3] as const).map(lvl => (
              <button
                key={lvl}
                style={S.hintBtn(hintLevel === lvl)}
                onClick={() => setHintLevel(hintLevel === lvl ? 0 : lvl)}
              >
                {lvl === 1 ? '💡 Concept' : lvl === 2 ? '🧭 Approach' : '📝 Pseudocode'}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={S.inputRow}>
            <textarea
              rows={2}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={hintLevel > 0 ? `Hint Level ${hintLevel} selected — press Send or add a question…` : 'Ask a question about your code… (Enter to send)'}
              style={S.input}
              disabled={chatLoading}
            />
            <button
              style={S.sendBtn(chatLoading || (!input.trim() && hintLevel === 0))}
              disabled={chatLoading || (!input.trim() && hintLevel === 0)}
              onClick={() => sendMessage()}
            >
              Send
            </button>
          </div>
        </>
      )}

      {/* ── FLOWCHART ── */}
      {subTab === 'flowchart' && (
        <div style={S.flowchartWrap}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#d1d5db' }}>Algorithm Flowchart</div>
              <div style={{ fontSize: '0.7rem', color: '#555', marginTop: 2 }}>
                Shows the logical approach — not the code solution
              </div>
            </div>
            <button style={S.genBtn} onClick={generateFlowchart} disabled={flowLoading}>
              {flowLoading
                ? <><span className="spinner-border spinner-border-sm me-1" style={{ width: 12, height: 12, borderWidth: 2 }} />Generating…</>
                : '↻ Regenerate'}
            </button>
          </div>

          {flowLoading && (
            <div style={S.empty}>
              <span className="spinner-border" style={{ width: 28, height: 28, borderWidth: 3, color: '#ff7a00' }} />
              <span>Generating flowchart for "{problemTitle}"…</span>
            </div>
          )}

          {flowError && !flowLoading && (
            <div style={{ ...S.empty, color: '#ef4444' }}>
              <span>⚠ {flowError}</span>
              <button style={{ ...S.genBtn, marginTop: 8 }} onClick={generateFlowchart}>Try again</button>
            </div>
          )}

          {!flowLoading && !flowError && flowSvg && (
            <div
              style={S.svgWrap}
              dangerouslySetInnerHTML={{ __html: flowSvg }}
            />
          )}

          {!flowLoading && !flowError && !flowSvg && (
            <div style={S.empty}>
              <span style={{ fontSize: '2rem' }}>🔀</span>
              <span>Click "Generate" to see the algorithm flowchart</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
