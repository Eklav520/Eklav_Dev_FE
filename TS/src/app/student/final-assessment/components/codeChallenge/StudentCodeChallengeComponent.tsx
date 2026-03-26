// StudentCodeChallengeComponent.tsx
import { useAuthContext } from '@/context/useAuthContext'
import React, { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'

/**
 * Behavior:
 * - No preview/description in parent when `hidePreview` is true.
 * - Parent can auto-open the modal via `startOpen`.
 * - Calls `onSubmitted` after successful submit (so parent can set "evaluation pending").
 * - Calls `onClose` when the modal is closed/cancelled.
 * - HARD GATE: challenge only starts if screen recording is granted & starts successfully.
 * - Violation detection: tab switching, new tab opening, fullscreen exit
 * - Auto-submit after 2 violations
 *
 * NOTE (iframes): if this runs inside an <iframe>, ensure:
 * <iframe allow="camera; microphone; display-capture; fullscreen" allowfullscreen ... />
 */

// --- types ---
type TestCase = {
  _id: string
  input: string
  expectedOutput: string
  points?: number
  matchType?: string
}

type TestSpec = {
  type?: string
  entry?: string
  command?: string
  timeoutSeconds?: number
  positiveTests?: TestCase[]
  negativeTests?: TestCase[]
}

type Challenge = {
  _id: string
  eventId?: string
  title: string
  slug?: string
  description: string
  timeLimitSeconds?: number
  maxScore?: number
  testSpec?: TestSpec
  createdAt?: string
  updatedAt?: string
}

type TestCaseResult = {
  name: string
  passed: boolean
  stdout: string
  expected?: string
  actual?: string
}

type JudgeResult = {
  success: boolean
  stdout: string
  stderr: string
  exitCode: number
  tests: TestCaseResult[]
}

type Language = { id: string; name: string }
type WebcamPosition = { right: number; bottom: number }

// --- constants ---
const LANGUAGES: Language[] = [
  { id: 'javascript', name: 'JavaScript (Node.js)' },
  { id: 'java', name: 'Java' },
  { id: 'cpp', name: 'C++ (GCC)' },
  { id: 'c', name: 'C (GCC)' },
  { id: 'python', name: 'Python 3' },
  { id: 'python2', name: 'Python 2' },
  { id: 'csharp', name: 'C# (.NET)' },
  { id: 'php', name: 'PHP' },
  { id: 'ruby', name: 'Ruby' },
  { id: 'swift', name: 'Swift' },
  { id: 'kotlin', name: 'Kotlin' },
  { id: 'go', name: 'Go' },
  { id: 'rust', name: 'Rust' },
  { id: 'typescript', name: 'TypeScript' },
  { id: 'bash', name: 'Bash' },
  { id: 'assembly', name: 'Assembly (NASM)' },
];

// --- utils: capability checks ---
function isCanvasCaptureSupported() {
  return typeof HTMLCanvasElement !== 'undefined' && typeof HTMLCanvasElement.prototype.captureStream === 'function'
}
function isMediaRecorderSupported() {
  return typeof window !== 'undefined' && 'MediaRecorder' in window
}

// --- simple challenge loader hook ---
function useChallengeLoader(baseURL: string, eventId: any) {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const { user } = useAuthContext();
  const token = user?.token;

  useEffect(() => {
    let mounted = true;
    console.log("EVENT ID:", eventId);

    (async () => {
      try {
        if (!eventId) return; // ✅ prevent empty API call

        const res = await fetch(
          `${baseURL}/api/events/${eventId}/codechallenges`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error(`Fetch failed ${res.status}`);

        const data = await res.json();
        console.log("API RESPONSE:", data);

        const arr: Challenge[] = data?.challenges || []; // ✅ FIX
        console.log("CHALLENGES ARRAY:", arr);

        if (!mounted) return;

        if (arr.length > 0) {
          setChallenge(arr[Math.floor(Math.random() * arr.length)]);
        } else {
          setChallenge({
            _id: "demo-1",
            title: "Demo challenge",
            description: "Write a function that reverses a string.",
            timeLimitSeconds: 15 * 60,
          });
        }
      } catch (e) {
        console.warn("fetch failed", e);

        if (!mounted) return;

        setChallenge({
          _id: "demo-1",
          title: "Demo challenge",
          description: "Write a function that reverses a string.",
          timeLimitSeconds: 15 * 60,
        });
      }
    })();

    return () => {
      mounted = false;
    };
  }, [baseURL, eventId, token]);

  return { challenge }
}

// --- recording hook ---
function useScreenRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const combinedStreamRef = useRef<MediaStream | null>(null)
  const screenVideoRef = useRef<HTMLVideoElement | null>(null)
  const camVideoRef = useRef<HTMLVideoElement | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  const stopRecordingAndCleanup = () => {
    try {
      const mr = mediaRecorderRef.current
      if (mr && mr.state !== 'inactive') mr.stop()
    } catch { }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    try {
      combinedStreamRef.current?.getTracks().forEach((t) => t.stop())
    } catch { }
    combinedStreamRef.current = null

    try {
      if (screenVideoRef.current && screenVideoRef.current.srcObject) {
        ; (screenVideoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop())
        screenVideoRef.current.srcObject = null
      }
    } catch { }

    try {
      if (camVideoRef.current && camVideoRef.current.srcObject) {
        ; (camVideoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop())
        camVideoRef.current.srcObject = null
      }
    } catch { }

    try {
      if (audioContextRef.current) audioContextRef.current.close()
    } catch { }
    audioContextRef.current = null
    recordedChunksRef.current = []
    mediaRecorderRef.current = null
  }

  // Promise version: waits for final chunk after .stop()
  const stopRecordingAndGetBlob = async (): Promise<Blob | null> => {
    try {
      const mr = mediaRecorderRef.current
      if (mr && mr.state !== 'inactive') {
        await new Promise<void>((resolve) => {
          try {
            mr.onstop = () => resolve()
            mr.stop()
          } catch {
            resolve()
          }
        })
      }
      const chunks = recordedChunksRef.current.slice()
      stopRecordingAndCleanup()
      if (!chunks || chunks.length === 0) return null
      return new Blob(chunks, { type: 'video/webm' })
    } catch (err) {
      console.error(err)
      stopRecordingAndCleanup()
      return null
    }
  }

  return {
    mediaRecorderRef,
    recordedChunksRef,
    combinedStreamRef,
    screenVideoRef,
    camVideoRef,
    animationFrameRef,
    audioContextRef,
    stopRecordingAndCleanup,
    stopRecordingAndGetBlob,
  }
}

// --- violation detection hook ---
function useViolationDetection(maxViolations: number = 2, onMaxViolations: () => void) {
  const [violations, setViolations] = useState(0)
  const [showViolationAlert, setShowViolationAlert] = useState(false)
  const violationTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!showViolationAlert) return

    // Hide violation alert after 3 seconds
    violationTimeoutRef.current = setTimeout(() => {
      setShowViolationAlert(false)
    }, 3000)

    return () => {
      if (violationTimeoutRef.current) {
        clearTimeout(violationTimeoutRef.current)
      }
    }
  }, [showViolationAlert])

  const addViolation = (reason: string) => {
    console.warn(`Violation detected: ${reason}`)
    const newViolations = violations + 1
    setViolations(newViolations)
    setShowViolationAlert(true)

    if (newViolations >= maxViolations) {
      onMaxViolations()
    }
  }

  const resetViolations = () => {
    setViolations(0)
    setShowViolationAlert(false)
    if (violationTimeoutRef.current) {
      clearTimeout(violationTimeoutRef.current)
      violationTimeoutRef.current = null
    }
  }

  return {
    violations,
    showViolationAlert,
    addViolation,
    resetViolations,
  }
}

// helper: unescape common sequences like "\n", "\t", "\r\n"
function unescapeText(s: unknown): string {
  if (s == null) return ''
  const str = String(s)
  return str
    .replace(/\\\\/g, '\\')
    .replace(/\\r\\n/g, '\r\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
}

const renderDescription = (text: string) => {
  const lines = text.split('\n')

  return lines.map((line, i) => {
    const isHeading = [
      'Input Format',
      'Output Format',
      'Constraints',
      'Example',
      'Input',
      'Output'
    ].includes(line.trim())

    if (isHeading) {
      return (
        <h4 key={i} style={{
          marginTop: 20,
          marginBottom: 8,
          color: '#93c5fd',
          fontSize: 15,
          fontWeight: 600,
        }}>
          {line}
        </h4>
      )
    }

    if (line.trim() === '') {
      return <div key={i} style={{ height: 8 }} />
    }

    // Code-like lines
    if (/^[a-zA-Z0-9 ]+$/.test(line) && line.length < 40) {
      return (
        <pre key={i} style={{
          background: '#020617',
          padding: '8px 12px',
          borderRadius: 6,
          color: '#e5e7eb',
          fontSize: 13,
          margin: '6px 0',
        }}>
          {line}
        </pre>
      )
    }

    return (
      <p key={i} style={{
        fontSize: 14,
        lineHeight: 1.6,
        color: '#d1d5db',
        margin: '6px 0',
      }}>
        {line}
      </p>
    )
  })
}


// small helper for date formatting (currently unused but kept)
function formatDate(iso?: string) {
  if (!iso) return '—'
  try {
    return new Date(String(iso)).toLocaleString()
  } catch {
    return String(iso)
  }
}

/* ---------- Violation Alert Component ---------- */
const ViolationAlert: React.FC<{ show: boolean; violations: number; maxViolations: number }> = ({ show, violations, maxViolations }) => {
  if (!show) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        background: 'linear-gradient(135deg, #ff6b6b, #ee5a52)',
        color: 'white',
        padding: '20px 30px',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(255, 107, 107, 0.4)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        textAlign: 'center',
        fontSize: '16px',
        fontWeight: '600',
        backdropFilter: 'blur(10px) saturate(120%)',
        animation: 'shake 0.5s ease-in-out',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <span style={{ fontSize: '24px' }}>⚠️</span>
        <span>Violation Detected!</span>
      </div>
      <div style={{ fontSize: '14px', opacity: 0.9 }}>
        {violations >= maxViolations
          ? 'Maximum violations reached! Submitting automatically...'
          : `Violation ${violations}/${maxViolations} - Stay in fullscreen mode and do not switch tabs.`}
      </div>
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(-50%) translateY(0); }
            25% { transform: translateX(-50%) translateY(-5px); }
            50% { transform: translateX(-50%) translateY(5px); }
            75% { transform: translateX(-50%) translateY(-5px); }
          }
        `}
      </style>
    </div>
  )
}

/* ---------- Left pane description ---------- */
const ChallengeDescription: React.FC<{ challenge: Challenge }> = ({ challenge }) => {
  const desc = String(challenge?.description ?? '').replace(/\\n/g, '\n')
  return (
    <div style={{ padding: 20, background: 'linear-gradient(180deg,#071125,#081827)', color: '#e6eef8', overflow: 'auto', height: '100%' }}>
      <h3 style={{ color: '#93c5fd', marginTop: 0, marginBottom: 10, fontSize: 18 }}>{challenge.title}</h3>
      <div style={{ fontSize: 13, color: '#d1d5db', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{desc}</div>
      <div
        style={{
          marginTop: 14,
          padding: 12,
          borderRadius: 8,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          fontSize: 12,
        }}>
        <ul style={{ marginTop: 10, paddingLeft: 18, color: '#cbd5e1' }}>
          <li>
            Screen sharing & recording is <strong>required</strong> to start.
          </li>
          <li>
            Use the editor to write your solution, then <em>Run tests</em>.
          </li>
          <li>
            You can press <em>Final Submit</em> at any time. Passing all tests is recommended but not required.
          </li>
          <li style={{ color: '#f87171' }}>
            <strong>Warning:</strong> Do not switch tabs or open new windows. Violations will result in auto-submission.
          </li>
        </ul>
      </div>
    </div>
  )
}

const DEFAULT_CODE: Record<string, string> = {
  javascript: `function main(input) {
  console.log(input);
}`,

  python: `def main():
    print(input())

if __name__ == "__main__":
    main()`,

  cpp: `#include <iostream>
using namespace std;

int main() {
    string s;
    cin >> s;
    cout << s;
}`,

  java: `import java.util.*;

public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    String s = sc.next();
    System.out.println(s);
  }
}`,

  c: `#include <stdio.h>

int main() {
    char s[100];
    scanf("%s", s);
    printf("%s", s);
}`,

  assembly: `section .text
global _start

_start:
    mov eax, 1
    int 0x80`,
};

const LanguageSelector: React.FC<{ language: string; onLanguageChange: (l: string) => void }> = ({ language, onLanguageChange }) => (
  <div style={{ padding: 20, position: 'relative' }}>
    <label style={{ display: 'block', marginBottom: 8, color: '#cbd5e1' }}>Select Language</label>
    <div style={{ position: 'relative' }}>
      <select
        value={language}
        onChange={(e) => onLanguageChange(e.target.value)}
        style={{
          width: '100%',
          padding: '10px 12px 10px 40px',
          borderRadius: 8,
          background: '#0f172a',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.2)',
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        {LANGUAGES.map((l) => (
          <option
            key={l.id}
            value={l.id}
            style={{
              background: '#0f172a',
              color: '#fff',
              padding: '12px',
              fontSize: '14px',
            }}>
            {l.name}
          </option>
        ))}
      </select>
      <div style={{
        position: 'absolute',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
        fontSize: '18px',
        color: '#60a5fa',
      }}>
        💬
      </div>
      <div style={{
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        pointerEvents: 'none',
        fontSize: '12px',
        color: '#94a3b8',
      }}>
        ▼
      </div>
    </div>
    <style>
      {`
        /* Global dropdown fixes */
        select, select:focus, select:hover {
          background-color: #0f172a !important;
          color: white !important;
        }
        
        select option {
          background-color: #0f172a !important;
          color: white !important;
          padding: 12px !important;
        }
        
        select option:checked,
        select option:hover,
        select option:focus {
          background-color: #1e293b !important;
          color: white !important;
        }
        
        /* Remove default dropdown arrow in IE */
        select::-ms-expand {
          display: none;
        }
        
        /* Firefox dropdown styling */
        @-moz-document url-prefix() {
          select {
            color: white !important;
            text-shadow: 0 0 0 white !important;
            background: #0f172a url("data:image/svg+xml;utf8,<svg fill='white' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>") no-repeat right 12px center !important;
          }
          select option {
            background: #0f172a !important;
            color: white !important;
          }
        }
        
        /* Safari/Chrome specific */
        @media not all and (min-resolution:.001dpcm) { 
          @supports (-webkit-appearance:none) {
            select {
              background: #0f172a !important;
              color: white !important;
            }
            select option {
              background: #0f172a !important;
              color: white !important;
            }
          }
        }
      `}
    </style>
  </div>
)

/* ---------- Enhanced CodeEditor with Monaco ---------- */
const CodeEditor: React.FC<{
  code: string
  onCodeChange: (c: string) => void
  timeLeft: number | null
  onRunTests: () => void
  onSubmit: () => void
  onCancel: () => void
  allPassed: boolean
  isRunning: boolean
  language: string
}> = ({ code, onCodeChange, timeLeft, onRunTests, onSubmit, onCancel, allPassed, isRunning, language }) => {

  // Map language IDs to Monaco editor language IDs
  const getMonacoLanguage = (lang: string) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'typescript': return 'typescript';
      case 'python': return 'python';
      case 'python2': return 'python';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      case 'c': return 'c';
      case 'csharp': return 'csharp';
      case 'go': return 'go';
      case 'rust': return 'rust';
      case 'php': return 'php';
      case 'ruby': return 'ruby';
      case 'swift': return 'swift';
      case 'kotlin': return 'kotlin';
      case 'bash': return 'shell';
      case 'assembly': return 'asm';
      default: return 'plaintext';
    }
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    // Focus the editor
    editor.focus();

    // Add useful shortcuts using monaco.KeyCode
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      onRunTests();
    });

    // Add Alt+Enter for submit
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.Enter, () => {
      onSubmit();
    });
  };

  const editorTheme = {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'function', foreground: 'DCDCAA' },
      { token: 'variable', foreground: '9CDCFE' },
      { token: 'type', foreground: '4EC9B0' },
      { token: 'operator', foreground: 'D4D4D4' },
      { token: 'delimiter', foreground: 'D4D4D4' },
      { token: 'identifier', foreground: '9CDCFE' },
    ],
    colors: {
      'editor.background': '#0f172a',
      'editor.foreground': '#e2e8f0',
      'editor.lineHighlightBackground': '#1e293b',
      'editorLineNumber.foreground': '#475569',
      'editorLineNumber.activeForeground': '#94a3b8',
      'editor.selectionBackground': '#334155',
      'editor.inactiveSelectionBackground': '#1e293b',
      'editorCursor.foreground': '#60a5fa',
      'editorWhitespace.foreground': '#475569',
      'editorIndentGuide.background': '#1e293b',
      'editorIndentGuide.activeBackground': '#334155',
      'editorBracketMatch.background': '#1e293b',
      'editorBracketMatch.border': '#60a5fa',
      'editorSuggestWidget.background': '#0f172a',
      'editorSuggestWidget.border': '#1e293b',
      'editorSuggestWidget.selectedBackground': '#1e293b',
      'editorWidget.background': '#0f172a',
      'editorWidget.border': '#1e293b',
      'scrollbar.shadow': '#000000',
      'scrollbarSlider.background': '#475569',
      'scrollbarSlider.hoverBackground': '#64748b',
      'scrollbarSlider.activeBackground': '#94a3b8',
    }
  };

  // Define theme for Monaco
  const defineTheme = (monaco: any) => {
    monaco.editor.defineTheme('custom-dark', editorTheme);
  };

  return (
    <div
      style={{
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.02)',
        height: '100%',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ color: '#e6eef8', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '20px' }}>💻</span>
          Write Your Code
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ color: '#bfcbd8', fontSize: 13, background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 6 }}>
            Language: <span style={{ color: '#60a5fa', fontWeight: 600 }}>{LANGUAGES.find(l => l.id === language)?.name || 'JavaScript'}</span>
          </div>
          <div style={{ color: '#bfcbd8', fontSize: 13, background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 6 }}>
            Time left:{' '}
            <span style={{ color: timeLeft && timeLeft < 300 ? '#f87171' : '#34d399', fontWeight: 600 }}>
              {timeLeft === null
                ? '--:--'
                : `${Math.floor(timeLeft / 60)
                  .toString()
                  .padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`}
            </span>
          </div>
        </div>
      </div>

      <div style={{
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.08)',
        background: '#0f172a'
      }}>
        <Editor
          height="100%"
          language={getMonacoLanguage(language)}
          value={code}
          onChange={(value) => onCodeChange(value || '')}
          onMount={handleEditorDidMount}
          theme="custom-dark"
          beforeMount={defineTheme}
          options={{
            minimap: {
              enabled: true,
              maxColumn: 80,
              renderCharacters: true,
              size: 'proportional'
            },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', 'Menlo', 'Monaco', 'Consolas', monospace",
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            readOnly: false,
            automaticLayout: true,
            wordWrap: 'on',
            wrappingIndent: 'indent',
            scrollbar: {
              vertical: 'visible',
              horizontal: 'visible',
              useShadows: false,
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: 'all',
            renderWhitespace: 'boundary',
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            bracketPairColorization: {
              enabled: true,
              independentColorPoolPerBracketType: true,
            },
            guides: {
              bracketPairs: 'active',
              bracketPairsHorizontal: 'active',
              highlightActiveBracketPair: true,
              indentation: true,
            },
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            tabCompletion: 'on',
            snippetSuggestions: 'inline',
            overviewRulerLanes: 3,
            folding: true,
            foldingHighlight: true,
            foldingStrategy: 'auto',
            showFoldingControls: 'mouseover',
            matchBrackets: 'always',
            renderIndentGuides: true,
            mouseWheelZoom: true,
            smoothScrolling: true,
            colorDecorators: true,
            contextmenu: true,
            formatOnPaste: true,
            formatOnType: true,
            links: true,
            wordBasedSuggestions: true,
            quickSuggestions: { other: true, comments: true, strings: true },
            parameterHints: { enabled: true, cycle: true },
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoSurround: 'brackets',
            dragAndDrop: true,
            accessibilitySupport: 'auto',
          }}
        />
      </div>

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onRunTests}
            disabled={isRunning}
            style={{
              padding: '10px 18px',
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              opacity: isRunning ? 0.7 : 1,
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(14, 165, 233, 0.25)',
            }}
            onMouseEnter={(e) => !isRunning && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => !isRunning && (e.currentTarget.style.transform = 'translateY(0)')}>
            {isRunning ? (
              <>
                <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                Running...
              </>
            ) : (
              <>
                <span>▶️</span>
                Run Tests
              </>
            )}
          </button>

          <button
            onClick={onSubmit}
            disabled={isRunning}
            title="Submit to admin (you can submit even if tests fail or you didn't run tests)"
            style={{
              padding: '10px 18px',
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              opacity: isRunning ? 0.7 : 1,
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
            }}
            onMouseEnter={(e) => !isRunning && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => !isRunning && (e.currentTarget.style.transform = 'translateY(0)')}>
            <span>🚀</span>
            Final Submit
          </button>

          <button
            onClick={onCancel}
            disabled={isRunning}
            style={{
              padding: '10px 18px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04))',
              color: '#e6eef8',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              fontWeight: 600,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              opacity: isRunning ? 0.7 : 1,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => !isRunning && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => !isRunning && (e.currentTarget.style.transform = 'translateY(0)')}>
            Cancel
          </button>
        </div>

        <div style={{
          color: allPassed ? '#34d399' : '#9fb1c8',
          fontSize: 14,
          fontWeight: 600,
          padding: '8px 14px',
          background: allPassed ? 'rgba(52, 211, 153, 0.1)' : 'rgba(255,255,255,0.03)',
          borderRadius: 8,
          border: allPassed ? '1px solid rgba(52, 211, 153, 0.2)' : '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          {allPassed ? '✅ All tests passed' : '⏳ No results / tests pending'}
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  )
}

const DraggableWebcam: React.FC<{
  camPreviewRef: React.RefObject<HTMLVideoElement>
  position: WebcamPosition
  onDragStart: (e: React.MouseEvent) => void
}> = ({ camPreviewRef, position, onDragStart }) => (
  <div style={{ position: 'absolute', right: position.right, bottom: position.bottom, zIndex: 30 }}>
    <video
      ref={camPreviewRef}
      autoPlay
      muted
      playsInline
      onMouseDown={onDragStart}
      style={{
        width: 160,
        height: 120,
        borderRadius: 8,
        background: '#000',
        cursor: 'move',
        border: '2px solid rgba(255,255,255,0.3)',
      }}
    />
  </div>
)

/* ---------- Optional preview panel (used only when hidePreview=false) ---------- */
const ChallengePanel: React.FC<{
  challenge: Challenge
  openModalAndStart: () => void
  onRunSample: (input: string, name?: string, expected?: string) => Promise<void>
}> = ({ challenge, openModalAndStart, onRunSample }) => {
  const spec = challenge.testSpec

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#fff' }}>{challenge.title}</h3>
          <div style={{ marginTop: 8, color: '#9ca3af', fontSize: 13, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {unescapeText(challenge.description)}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
          <button
            onClick={openModalAndStart}
            style={{
              padding: '8px 14px',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              boxShadow: '0 8px 20px rgba(37,99,235,0.12)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            Start Challenge
          </button>

          <div style={{ textAlign: 'right', color: '#9ca3af', fontSize: 12 }}>
            <div>
              Time limit: <strong style={{ color: '#cbd5e1' }}>{challenge.timeLimitSeconds ? `${challenge.timeLimitSeconds}s` : '—'}</strong>
            </div>
            <div style={{ marginTop: 6 }}>
              Max score: <strong style={{ color: '#cbd5e1' }}>{String(challenge.maxScore ?? '—')}</strong>
            </div>
          </div>
        </div>
      </div>

      {spec && (
        <div
          style={{
            marginTop: 16,
            borderRadius: 10,
            padding: 14,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.005))',
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#cfe1ff' }}>Test Spec</div>
            <div style={{ color: '#9ca3af', fontSize: 13 }}>{spec.type ?? '—'}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            {Array.isArray(spec.positiveTests) && spec.positiveTests.length > 0 && (
              <div>
                <div style={{ fontSize: 13, color: '#7dd3fc', marginBottom: 8, fontWeight: 700 }}>Positive Tests</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {spec.positiveTests.map((t) => (
                    <div
                      key={t._id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        alignItems: 'flex-start',
                        padding: 10,
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid rgba(255,255,255,0.03)',
                      }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>
                            points: <strong style={{ color: '#cbd5e1' }}>{t.points ?? '—'}</strong>
                          </div>
                        </div>

                        <div style={{ marginTop: 8, color: '#9ca3af', fontSize: 12 }}>Input:</div>
                        <pre
                          style={{
                            margin: '6px 0 0',
                            padding: 10,
                            borderRadius: 6,
                            background: '#0b1116',
                            color: '#dbeafe',
                            fontSize: 13,
                            whiteSpace: 'pre-wrap',
                          }}>
                          {unescapeText(t.input)}
                        </pre>

                        <div style={{ marginTop: 8, color: '#9ca3af', fontSize: 12 }}>Expected:</div>
                        <pre
                          style={{
                            margin: '6px 0 0',
                            padding: 10,
                            borderRadius: 6,
                            background: '#071221',
                            color: '#86efac',
                            fontSize: 13,
                            whiteSpace: 'pre-wrap',
                          }}>
                          {unescapeText(t.expectedOutput)}
                        </pre>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 110 }}>
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(unescapeText(t.input)).catch(() => { })
                          }}
                          title="Copy input"
                          style={{
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#0ea5e9',
                            color: '#fff',
                            cursor: 'pointer',
                          }}>
                          Copy Input
                        </button>

                        <button
                          onClick={() => onRunSample(unescapeText(t.input), `positive-${t._id}`, unescapeText(t.expectedOutput))}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#2563eb',
                            color: '#fff',
                            cursor: 'pointer',
                          }}>
                          Run Sample
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Array.isArray(spec.negativeTests) && spec.negativeTests.length > 0 && (
              <div>
                <div style={{ fontSize: 13, color: '#fca5a5', marginBottom: 8, fontWeight: 700 }}>Negative Tests</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {spec.negativeTests.map((t) => (
                    <div
                      key={t._id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        alignItems: 'flex-start',
                        padding: 10,
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid rgba(255,255,255,0.03)',
                      }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 12, color: '#9ca3af' }}>
                            points: <strong style={{ color: '#cbd5e1' }}>{t.points ?? '—'}</strong>
                          </div>
                        </div>

                        <div style={{ marginTop: 8, color: '#9ca3af', fontSize: 12 }}>Input:</div>
                        <pre
                          style={{
                            margin: '6px 0 0',
                            padding: 10,
                            borderRadius: 6,
                            background: '#0b1116',
                            color: '#ffdcdc',
                            fontSize: 13,
                            whiteSpace: 'pre-wrap',
                          }}>
                          {unescapeText(t.input)}
                        </pre>

                        <div style={{ marginTop: 8, color: '#9ca3af', fontSize: 12 }}>Expected:</div>
                        <pre
                          style={{
                            margin: '6px 0 0',
                            padding: 10,
                            borderRadius: 6,
                            background: '#071221',
                            color: '#ffb4b4',
                            fontSize: 13,
                            whiteSpace: 'pre-wrap',
                          }}>
                          {unescapeText(t.expectedOutput)}
                        </pre>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 110 }}>
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText(unescapeText(t.input)).catch(() => { })
                          }}
                          title="Copy input"
                          style={{
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#ef4444',
                            color: '#fff',
                            cursor: 'pointer',
                          }}>
                          Copy Input
                        </button>

                        <button
                          onClick={() => onRunSample(unescapeText(t.input), `negative-${t._id}`, unescapeText(t.expectedOutput))}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#b91c1c',
                            color: '#fff',
                            cursor: 'pointer',
                          }}>
                          Run Sample
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- OutputPanel ---------- */
const OutputPanel: React.FC<{
  statusMessage: string | null
  runningResult: JudgeResult | null
  showRawJson: boolean
  onToggleRawJson: () => void
  challenge: Challenge
  onRunSample: (input: string, name?: string, expected?: string) => Promise<void>
  onRunAllTests: () => Promise<void>
  isRunning: boolean
}> = ({ statusMessage, runningResult, showRawJson, onToggleRawJson, challenge, onRunSample, onRunAllTests, isRunning }) => {
  const total = runningResult?.tests?.length ?? 0
  const passed = runningResult?.tests?.filter((t) => t.passed).length ?? 0

  const renderTestCases = () => {
    if (!runningResult || !runningResult.tests || runningResult.tests.length === 0) {
      return null
    }

    return (
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 600, color: '#dbeafe', fontSize: 16 }}>Test Results</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>
            Passed <strong style={{ color: '#10b981' }}>{passed}</strong> / {total}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {runningResult.tests.map((test, index) => (
            <div
              key={index}
              style={{
                padding: 12,
                borderRadius: 8,
                background: test.passed ? 'rgba(34, 197, 94, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                border: `1px solid ${test.passed ? 'rgba(34, 197, 94, 0.18)' : 'rgba(239, 68, 68, 0.18)'}`,
              }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: test.passed ? '#10b981' : '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      color: 'white',
                    }}>
                    {test.passed ? '✓' : '✗'}
                  </div>
                  <span style={{ fontWeight: 600, color: test.passed ? '#10b981' : '#ef4444' }}>{test.name || `Test ${index + 1}`}</span>
                </div>

                {challenge.testSpec && (
                  <button
                    onClick={() => {
                      const allTests = [...(challenge.testSpec?.positiveTests ?? []), ...(challenge.testSpec?.negativeTests ?? [])]
                      const testCase = allTests[index]
                      if (testCase) {
                        onRunSample(testCase.input, test.name || `test-${index}`, testCase.expectedOutput)
                        return
                      }
                      onRunSample('', test.name || `test-${index}`)
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: 12,
                      borderRadius: 6,
                      border: 'none',
                      background: '#3b82f6',
                      color: '#fff',
                      cursor: 'pointer',
                    }}>
                    Run This Test
                  </button>
                )}
              </div>

              {test.stdout && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Output:</div>
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      background: 'rgba(0,0,0,0.3)',
                      padding: 8,
                      borderRadius: 4,
                      fontSize: 12,
                      margin: 0,
                    }}>
                    {test.stdout}
                  </pre>
                </div>
              )}

              {!test.passed && test.expected && test.actual && (
                <div style={{ fontSize: 12 }}>
                  <div style={{ color: '#9ca3af', marginBottom: 4 }}>Expected:</div>
                  <div style={{ color: '#10b981', background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 4 }}>{test.expected}</div>

                  <div style={{ color: '#9ca3af', marginBottom: 4, marginTop: 8 }}>Actual:</div>
                  <div style={{ color: '#ef4444', background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 4 }}>{test.actual}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderSampleTestsFromChallenge = () => {
    const spec = challenge.testSpec
    if (!spec) return null

    const pos: TestCase[] = Array.isArray(spec.positiveTests) ? spec.positiveTests : []
    const neg: TestCase[] = Array.isArray(spec.negativeTests) ? spec.negativeTests : []

    return (
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 600, color: '#dbeafe', fontSize: 16 }}>Sample Tests</div>
          <button
            onClick={onRunAllTests}
            disabled={isRunning}
            style={{
              padding: '8px 12px',
              fontSize: 14,
              borderRadius: 6,
              background: '#06b6d4',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}>
            {isRunning ? 'Running...' : 'Run All Tests'}
          </button>
        </div>

        {pos.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, color: '#93c5fd', marginBottom: 12, fontWeight: 600 }}>Positive Tests (Should Pass)</div>
            <div style={{ display: 'grid', gap: 12 }}>
              {pos.map((t, i) => (
                <div
                  key={`p-${i}`}
                  style={{
                    padding: 12,
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Input:</div>
                      <pre
                        style={{
                          whiteSpace: 'pre-wrap',
                          margin: 0,
                          padding: 8,
                          background: 'rgba(0,0,0,0.3)',
                          borderRadius: 4,
                          fontSize: 12,
                        }}>
                        {String(t.input).replace(/\\n/g, '\n')}
                      </pre>
                    </div>
                    <button
                      onClick={() => onRunSample(String(t.input), `positive-${i}`, String(t.expectedOutput))}
                      disabled={isRunning}
                      style={{
                        padding: '6px 12px',
                        fontSize: 12,
                        borderRadius: 6,
                        border: 'none',
                        background: '#0ea5e9',
                        color: '#fff',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}>
                      Run Test
                    </button>
                  </div>

                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Expected Output:</div>
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      margin: 0,
                      padding: 8,
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: 4,
                      fontSize: 12,
                      color: '#10b981',
                    }}>
                    {String(t.expectedOutput)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {neg.length > 0 && (
          <div>
            <div style={{ fontSize: 14, color: '#fca5a5', marginBottom: 12, fontWeight: 600 }}>Negative Tests (Should Fail)</div>
            <div style={{ display: 'grid', gap: 12 }}>
              {neg.map((t, i) => (
                <div
                  key={`n-${i}`}
                  style={{
                    padding: 12,
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Input:</div>
                      <pre
                        style={{
                          whiteSpace: 'pre-wrap',
                          margin: 0,
                          padding: 8,
                          background: 'rgba(0,0,0,0.3)',
                          borderRadius: 4,
                          fontSize: 12,
                        }}>
                        {String(t.input).replace(/\\n/g, '\n')}
                      </pre>
                    </div>
                    <button
                      onClick={() => onRunSample(String(t.input), `negative-${i}`, String(t.expectedOutput))}
                      disabled={isRunning}
                      style={{
                        padding: '6px 12px',
                        fontSize: 12,
                        borderRadius: 6,
                        border: 'none',
                        background: '#ef4444',
                        color: '#fff',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}>
                      Run Test
                    </button>
                  </div>

                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Expected Output:</div>
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      margin: 0,
                      padding: 8,
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: 4,
                      fontSize: 12,
                      color: '#ef4444',
                    }}>
                    {String(t.expectedOutput)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderMainOutput = () => {
    if (!runningResult) {
      return <div style={{ color: '#94a3af', textAlign: 'center', padding: 20 }}>No output yet — run tests to see results</div>
    }

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 16 }}>Execution Output</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                  navigator.clipboard.writeText(runningResult.stdout || '').catch(() => window.alert('Could not copy to clipboard'))
                } else {
                  try {
                    window.prompt('Copy output', runningResult.stdout || '')
                  } catch { }
                }
              }}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                borderRadius: 6,
                border: 'none',
                background: '#3b82f6',
                color: '#fff',
                cursor: 'pointer',
              }}>
              Copy Output
            </button>
            <button
              onClick={onToggleRawJson}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                borderRadius: 6,
                border: 'none',
                background: '#6b7280',
                color: '#fff',
                cursor: 'pointer',
              }}>
              {showRawJson ? 'Hide JSON' : 'View JSON'}
            </button>
          </div>
        </div>

        {!showRawJson ? (
          <>
            {runningResult.stdout && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 8 }}>Standard Output:</div>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    background: 'rgba(0,0,0,0.3)',
                    padding: 12,
                    borderRadius: 6,
                    fontSize: 13,
                    maxHeight: 200,
                    overflow: 'auto',
                  }}>
                  {runningResult.stdout || '(empty)'}
                </pre>
              </div>
            )}

            {runningResult.stderr && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, color: '#fb7185', marginBottom: 8 }}>Standard Error:</div>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    background: 'rgba(239,68,68,0.06)',
                    padding: 12,
                    borderRadius: 6,
                    fontSize: 13,
                    maxHeight: 200,
                    overflow: 'auto',
                    color: '#fca5a5',
                  }}>
                  {runningResult.stderr}
                </pre>
              </div>
            )}

            <div
              style={{
                padding: 12,
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 6,
                marginBottom: 16,
              }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Exit Code:</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{runningResult.exitCode}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Status:</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: runningResult.success ? '#10b981' : '#ef4444' }}>
                    {runningResult.success ? 'Success' : 'Failed'}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 12, color: '#9ca3af' }}>
                  Passed <strong style={{ color: '#10b981' }}>{passed}</strong> / {total}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ marginTop: 8 }}>
            <pre
              style={{
                maxHeight: 300,
                overflow: 'auto',
                background: 'rgba(0,0,0,0.5)',
                padding: 12,
                borderRadius: 6,
                fontSize: 12,
              }}>
              {JSON.stringify(runningResult, null, 2)}
            </pre>
          </div>
        )}

        {renderTestCases()}
      </div>
    )
  }

  return (
    <div
      style={{
        padding: 20,
        background: 'linear-gradient(180deg,#071122,#081122)',
        color: '#e6eef8',
        overflow: 'auto',
        height: '100%',
      }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#c7d2fe' }}>📥 Output & Results</div>
        {statusMessage && (
          <div
            style={{
              color: '#9ca3af',
              padding: 8,
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 6,
              marginTop: 8,
              fontSize: 14,
            }}>
            {statusMessage}
          </div>
        )}
      </div>

      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8,
          padding: 16,
          marginBottom: 20,
        }}>
        {renderMainOutput()}
      </div>

      {renderSampleTestsFromChallenge()}
    </div>
  )
}

/* ---------- Collapsible Output Panel ---------- */
const CollapsibleOutputPanel: React.FC<{
  statusMessage: string | null
  runningResult: JudgeResult | null
  showRawJson: boolean
  onToggleRawJson: () => void
  challenge: Challenge
  onRunSample: (input: string, name?: string, expected?: string) => Promise<void>
  onRunAllTests: () => Promise<void>
  isRunning: boolean
  isExpanded: boolean
  onToggleExpand: () => void
}> = ({ statusMessage, runningResult, showRawJson, onToggleRawJson, challenge, onRunSample, onRunAllTests, isRunning, isExpanded, onToggleExpand }) => {
  const total = runningResult?.tests?.length ?? 0
  const passed = runningResult?.tests?.filter((t) => t.passed).length ?? 0

  const renderMainOutput = () => {
    if (!runningResult) {
      return <div style={{ color: '#94a3af', textAlign: 'center', padding: 20 }}>No output yet — run tests to see results</div>
    }

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 16, color: '#dbeafe' }}>Execution Output</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                  navigator.clipboard.writeText(runningResult.stdout || '').catch(() => window.alert('Could not copy to clipboard'))
                } else {
                  try {
                    window.prompt('Copy output', runningResult.stdout || '')
                  } catch { }
                }
              }}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                borderRadius: 6,
                border: 'none',
                background: '#3b82f6',
                color: '#fff',
                cursor: 'pointer',
              }}>
              Copy Output
            </button>
            <button
              onClick={onToggleRawJson}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                borderRadius: 6,
                border: 'none',
                background: '#6b7280',
                color: '#fff',
                cursor: 'pointer',
              }}>
              {showRawJson ? 'Hide JSON' : 'View JSON'}
            </button>
          </div>
        </div>

        {!showRawJson ? (
          <>
            {runningResult.stdout && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 8 }}>Standard Output:</div>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    background: 'rgba(0,0,0,0.3)',
                    padding: 12,
                    borderRadius: 6,
                    fontSize: 13,
                    maxHeight: 150,
                    overflow: 'auto',
                  }}>
                  {runningResult.stdout || '(empty)'}
                </pre>
              </div>
            )}

            {runningResult.stderr && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 14, color: '#fb7185', marginBottom: 8 }}>Standard Error:</div>
                <pre
                  style={{
                    whiteSpace: 'pre-wrap',
                    background: 'rgba(239,68,68,0.06)',
                    padding: 12,
                    borderRadius: 6,
                    fontSize: 13,
                    maxHeight: 150,
                    overflow: 'auto',
                    color: '#fca5a5',
                  }}>
                  {runningResult.stderr}
                </pre>
              </div>
            )}

            <div
              style={{
                padding: 12,
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 6,
                marginBottom: 16,
              }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Exit Code:</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{runningResult.exitCode}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>Status:</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: runningResult.success ? '#10b981' : '#ef4444' }}>
                    {runningResult.success ? 'Success' : 'Failed'}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 12, color: '#9ca3af' }}>
                  Passed <strong style={{ color: '#10b981' }}>{passed}</strong> / {total}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ marginTop: 8 }}>
            <pre
              style={{
                maxHeight: 200,
                overflow: 'auto',
                background: 'rgba(0,0,0,0.5)',
                padding: 12,
                borderRadius: 6,
                fontSize: 12,
              }}>
              {JSON.stringify(runningResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    )
  }

  const renderTestCases = () => {
    if (!runningResult || !runningResult.tests || runningResult.tests.length === 0) {
      return null
    }

    return (
      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 600, color: '#dbeafe', fontSize: 16 }}>Test Results</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>
            Passed <strong style={{ color: '#10b981' }}>{passed}</strong> / {total}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {runningResult.tests.map((test, index) => (
            <div
              key={index}
              style={{
                padding: 12,
                borderRadius: 8,
                background: test.passed ? 'rgba(34, 197, 94, 0.06)' : 'rgba(239, 68, 68, 0.06)',
                border: `1px solid ${test.passed ? 'rgba(34, 197, 94, 0.18)' : 'rgba(239, 68, 68, 0.18)'}`,
              }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: test.passed ? '#10b981' : '#ef4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      color: 'white',
                    }}>
                    {test.passed ? '✓' : '✗'}
                  </div>
                  <span style={{ fontWeight: 600, color: test.passed ? '#10b981' : '#ef4444' }}>{test.name || `Test ${index + 1}`}</span>
                </div>

                {challenge.testSpec && (
                  <button
                    onClick={() => {
                      const allTests = [...(challenge.testSpec?.positiveTests ?? []), ...(challenge.testSpec?.negativeTests ?? [])]
                      const testCase = allTests[index]
                      if (testCase) {
                        onRunSample(testCase.input, test.name || `test-${index}`, testCase.expectedOutput)
                        return
                      }
                      onRunSample('', test.name || `test-${index}`)
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: 12,
                      borderRadius: 6,
                      border: 'none',
                      background: '#3b82f6',
                      color: '#fff',
                      cursor: 'pointer',
                    }}>
                    Run This Test
                  </button>
                )}
              </div>

              {test.stdout && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Output:</div>
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      background: 'rgba(0,0,0,0.3)',
                      padding: 8,
                      borderRadius: 4,
                      fontSize: 12,
                      margin: 0,
                    }}>
                    {test.stdout}
                  </pre>
                </div>
              )}

              {!test.passed && test.expected && test.actual && (
                <div style={{ fontSize: 12 }}>
                  <div style={{ color: '#9ca3af', marginBottom: 4 }}>Expected:</div>
                  <div style={{ color: '#10b981', background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 4 }}>{test.expected}</div>

                  <div style={{ color: '#9ca3af', marginBottom: 4, marginTop: 8 }}>Actual:</div>
                  <div style={{ color: '#ef4444', background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 4 }}>{test.actual}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!isExpanded) {
    return (
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(180deg,#071122,#081122)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        padding: '8px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
        zIndex: 10,
        boxShadow: '0 -4px 12px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontWeight: 600, color: '#c7d2fe', fontSize: 14 }}>
            Output {runningResult && (
              <span style={{ color: '#9ca3af', fontSize: 12 }}>
                ({passed}/{total} passed)
              </span>
            )}
          </div>
          {statusMessage && (
            <div style={{ color: '#9ca3af', fontSize: 12 }}>
              {statusMessage}
            </div>
          )}
        </div>
        <button
          onClick={onToggleExpand}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#60a5fa',
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}>
          <span>Expand</span>
          <span style={{ transform: 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
        </button>
      </div>
    )
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(180deg,#071122,#081122)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      height: '40vh',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 10,
      boxShadow: '0 -4px 12px rgba(0,0,0,0.3)',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: 'rgba(15,23,42,0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontWeight: 600, color: '#c7d2fe', fontSize: 16 }}>
            Output & Results
          </div>
          {statusMessage && (
            <div style={{ color: '#9ca3af', fontSize: 12 }}>
              {statusMessage}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {runningResult && (
            <div style={{ fontSize: 12, color: '#9ca3af' }}>
              Passed <strong style={{ color: '#10b981' }}>{passed}</strong> / {total}
            </div>
          )}
          <button
            onClick={onToggleExpand}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#60a5fa',
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
            <span>Collapse</span>
            <span style={{ transform: 'rotate(180deg)', transition: 'transform 0.2s' }}>▼</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: 16,
      }}>
        {runningResult ? (
          <>
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8,
              padding: 16,
              marginBottom: 20,
            }}>
              {renderMainOutput()}
              {renderTestCases()}
            </div>

            {/* Sample Tests Section */}
            {challenge.testSpec && (
              <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, color: '#dbeafe', fontSize: 16 }}>Sample Tests</div>
                  <button
                    onClick={onRunAllTests}
                    disabled={isRunning}
                    style={{
                      padding: '8px 12px',
                      fontSize: 14,
                      borderRadius: 6,
                      background: '#06b6d4',
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer',
                    }}>
                    {isRunning ? 'Running...' : 'Run All Tests'}
                  </button>
                </div>

                {Array.isArray(challenge.testSpec.positiveTests) && challenge.testSpec.positiveTests.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 14, color: '#93c5fd', marginBottom: 12, fontWeight: 600 }}>Positive Tests (Should Pass)</div>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {challenge.testSpec.positiveTests.slice(0, 2).map((t, i) => (
                        <div
                          key={`p-${i}`}
                          style={{
                            padding: 12,
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: 8,
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <div>
                              <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Input:</div>
                              <pre
                                style={{
                                  whiteSpace: 'pre-wrap',
                                  margin: 0,
                                  padding: 8,
                                  background: 'rgba(0,0,0,0.3)',
                                  borderRadius: 4,
                                  fontSize: 12,
                                }}>
                                {String(t.input).replace(/\\n/g, '\n')}
                              </pre>
                            </div>
                            <button
                              onClick={() => onRunSample(String(t.input), `positive-${i}`, String(t.expectedOutput))}
                              disabled={isRunning}
                              style={{
                                padding: '6px 12px',
                                fontSize: 12,
                                borderRadius: 6,
                                border: 'none',
                                background: '#0ea5e9',
                                color: '#fff',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}>
                              Run Test
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{ color: '#94a3af', textAlign: 'center', padding: 40 }}>
            No output yet — run tests to see results
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------- Main component ---------- */
export default function StudentCodeChallengeComponent({
  baseURL = (import.meta && (import.meta as any).env?.VITE_API_BASE_URL) || '',
  eventId,
  startOpen = false,
  hidePreview = false,
  onClose,
  onSubmitted,
  onChallengeResolved,
  authToken,
  studentId,
}: {
  baseURL?: string
  eventId?: string
  startOpen?: boolean
  hidePreview?: boolean
  onClose?: () => void
  onSubmitted?: (cid?: string) => void
  onChallengeResolved?: (cid: string) => void
  authToken?: string
  studentId?: string
}) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user } = useAuthContext()
  const { challenge } = useChallengeLoader(baseURL, eventId)

  const [modalOpen, setModalOpen] = useState(false)
  const [language, setLanguage] = useState(LANGUAGES[0].id)
  const [code, setCode] = useState('function main(){\n    console.log("Welcome")\n}')
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  const [runningResult, setRunningResult] = useState<JudgeResult | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [autoSubmitting, setAutoSubmitting] = useState(false)
  const [showRawJson, setShowRawJson] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [outputExpanded, setOutputExpanded] = useState(false)

  // webcam drag state
  const [dragging, setDragging] = useState(false)
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const [camPos, setCamPos] = useState<WebcamPosition>({ right: 20, bottom: 20 })
  const modalRef = useRef<HTMLDivElement | null>(null)
  const camPreviewRef = useRef<HTMLVideoElement | null>(null)
  const recordingPreviewRef = useRef<HTMLVideoElement | null>(null)
  const submittingRef = useRef(false)
  const [showOnlyProgramOutput, setShowOnlyProgramOutput] = useState(false)

  // recording
  const {
    mediaRecorderRef,
    recordedChunksRef,
    combinedStreamRef,
    screenVideoRef,
    camVideoRef,
    animationFrameRef,
    audioContextRef,
    stopRecordingAndCleanup,
    stopRecordingAndGetBlob,
  } = useScreenRecorder()

  // violation detection
  const { violations, showViolationAlert, addViolation, resetViolations } = useViolationDetection(2, () => {
    // Auto-submit when max violations reached
    setStatusMessage('Maximum violations reached! Auto-submitting...')
    handleFinalSubmit(true)
  })

  // Map language IDs to Monaco editor language IDs
  const getMonacoLanguage = (lang: string) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'python': return 'python';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'javascript';
    }
  };

  // Define editor theme
  const editorTheme = {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'function', foreground: 'DCDCAA' },
      { token: 'variable', foreground: '9CDCFE' },
      { token: 'type', foreground: '4EC9B0' },
      { token: 'operator', foreground: 'D4D4D4' },
      { token: 'delimiter', foreground: 'D4D4D4' },
      { token: 'identifier', foreground: '9CDCFE' },
    ],
    colors: {
      'editor.background': '#0f172a',
      'editor.foreground': '#e2e8f0',
      'editor.lineHighlightBackground': '#1e293b',
      'editorLineNumber.foreground': '#475569',
      'editorLineNumber.activeForeground': '#94a3b8',
      'editor.selectionBackground': '#334155',
      'editor.inactiveSelectionBackground': '#1e293b',
      'editorCursor.foreground': '#60a5fa',
      'editorWhitespace.foreground': '#475569',
      'editorIndentGuide.background': '#1e293b',
      'editorIndentGuide.activeBackground': '#334155',
      'editorBracketMatch.background': '#1e293b',
      'editorBracketMatch.border': '#60a5fa',
      'editorSuggestWidget.background': '#0f172a',
      'editorSuggestWidget.border': '#1e293b',
      'editorSuggestWidget.selectedBackground': '#1e293b',
      'editorWidget.background': '#0f172a',
      'editorWidget.border': '#1e293b',
      'scrollbar.shadow': '#000000',
      'scrollbarSlider.background': '#475569',
      'scrollbarSlider.hoverBackground': '#64748b',
      'scrollbarSlider.activeBackground': '#94a3b8',
    }
  };

  // Define theme for Monaco - THIS IS THE MISSING FUNCTION
  const defineTheme = (monaco: any) => {
    monaco.editor.defineTheme('custom-dark', editorTheme);
  };

  // Add editor mount handler for keyboard shortcuts
  const handleEditorDidMount = (editor: any, monaco: any) => {
    // Focus the editor
    editor.focus();

    // Add useful shortcuts using monaco.KeyCode
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      runAllTests();
    });

    // Add Alt+Enter for submit
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.Enter, () => {
      handleFinalSubmit(false);
    });
  };

  // --- Add the missing functions that were in CodeEditor component ---
  // These functions are needed for the editor in the modal
  const handleEditorDidMountModal = (editor: any, monaco: any) => {
    // Focus the editor
    editor.focus();

    // Add useful shortcuts using monaco.KeyCode
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      runAllTests();
    });

    // Add Alt+Enter for submit
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.Enter, () => {
      handleFinalSubmit(false);
    });
  };

  useEffect(() => {
    if (modalOpen && combinedStreamRef.current && recordingPreviewRef.current) {
      recordingPreviewRef.current.srcObject = combinedStreamRef.current
      recordingPreviewRef.current.muted = true
      recordingPreviewRef.current.play().catch(() => { })
    }
  }, [modalOpen])


  // Timer
  useEffect(() => {
    if (timeLeft === null) return
    if (timeLeft <= 0 && !autoSubmitting) {
      setAutoSubmitting(true)
      handleFinalSubmit(true)
      return
    }
    const id = window.setTimeout(() => setTimeLeft((s) => (s === null ? null : s - 1)), 1000)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, autoSubmitting])

  // ensure cleanup when modal closes
  useEffect(() => {
    if (!modalOpen) {
      try {
        stopRecordingAndCleanup()
        resetViolations()
        setOutputExpanded(false)
      } catch { }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen])

  // Violation detection: tab switching, visibility change, fullscreen exit
  useEffect(() => {
    if (!modalOpen) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        addViolation('Tab switched or minimized')
      }
    }

    const handleBlur = () => {
      // Check if blur was caused by switching tabs/windows
      setTimeout(() => {
        if (!document.hasFocus()) {
          addViolation('Window/tab lost focus')
        }
      }, 100)
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        addViolation('Fullscreen mode exited')
        // Try to re-enter fullscreen
        enterFullscreen()
      }
    }

    // Listen for keyboard shortcuts that might open new tabs
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect Ctrl+T (new tab), Ctrl+N (new window), etc.
      if ((e.ctrlKey || e.metaKey) && (e.key === 't' || e.key === 'n' || e.key === 'Tab')) {
        e.preventDefault()
        addViolation('Attempted to open new tab/window')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('blur', handleBlur)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('blur', handleBlur)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [modalOpen, addViolation])

  // Enter fullscreen function
  const enterFullscreen = async () => {
    try {
      const element = document.documentElement
      if (element.requestFullscreen) {
        await element.requestFullscreen()
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen()
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen()
      }
    } catch (err) {
      console.warn('Fullscreen error:', err)
    }
  }

  // Exit fullscreen function
  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen()
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen()
      }
    } catch (err) {
      console.warn('Exit fullscreen error:', err)
    }
  }

  // Modal-first, then try to start capture; revert if denied
  async function openModalAndStart() {
    if (!challenge) return

    // 1️⃣ Open modal first
    setModalOpen(true)

    // wait one paint so refs exist
    await new Promise((r) => requestAnimationFrame(r))

    // 2️⃣ Start recording AFTER modal renders
    const ok = await startScreenAndCamRecording()
    if (!ok) {
      setStatusMessage('Screen share permission is required.')
      setModalOpen(false)
      return
    }

    setTimeLeft(challenge.timeLimitSeconds ?? 30 * 60)
    setCamPos({ right: 20, bottom: 20 })
    resetViolations()
    setOutputExpanded(false)

    setTimeout(enterFullscreen, 300)
  }


  // auto-open when parent asks (also gated)
  useEffect(() => {
    if (startOpen && challenge && !modalOpen) {
      openModalAndStart()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startOpen, challenge])

  function closeModalAndCleanup() {
    try {
      stopRecordingAndCleanup()
      exitFullscreen()
      resetViolations()
      setOutputExpanded(false)
    } catch { }
    setModalOpen(false)
    onClose?.()
  }

  // --- recording with canvas PiP + robust fallback ---
  async function startScreenAndCamRecording(): Promise<boolean> {
    try {
      // Webcam first (preview only; audio off to avoid extra prompt)
      let camStream: MediaStream | null = null
      try {
        camStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: { ideal: 'user' } },
          audio: false,
        })
        const previewEl = camPreviewRef.current
        if (previewEl && camStream) {
          previewEl.srcObject = camStream
          previewEl.muted = true
          previewEl.playsInline = true
          previewEl.autoplay = true
          previewEl.onloadedmetadata = () => previewEl.play().catch(() => { })
        }
        if (!camStream.getVideoTracks().length) camStream = null
      } catch (camErr) {
        console.warn('Camera not available:', camErr)
        camStream = null
      }

      // Screen (system/tab audio allowed; may return none)
      const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { cursor: 'always' },
        audio: true,
      })

      // Detect environments that struggle with canvas mixing
      const canCanvas = isCanvasCaptureSupported()
      const canRecord = isMediaRecorderSupported()
      const UA = navigator.userAgent.toLowerCase()
      const isSafari = UA.includes('safari') && !UA.includes('chrome') && !UA.includes('chromium')
      const forceFallback = false

      if (forceFallback) {
        // === Fallback: record raw screen (+ optional cam) directly ===
        const direct = new MediaStream()
        screenStream.getTracks().forEach((t: MediaStreamTrack) => direct.addTrack(t))
        if (camStream) camStream.getVideoTracks().forEach((t) => direct.addTrack(t))

        let opts: MediaRecorderOptions = {}
        if (MediaRecorder.isTypeSupported?.('video/webm;codecs=vp9,opus')) opts.mimeType = 'video/webm;codecs=vp9,opus'
        else if (MediaRecorder.isTypeSupported?.('video/webm;codecs=vp8,opus')) opts.mimeType = 'video/webm;codecs=vp8,opus'
        else opts.mimeType = 'video/webm'

        const mr = new MediaRecorder(direct, opts)
        mediaRecorderRef.current = mr
        combinedStreamRef.current = direct
        recordedChunksRef.current = []
        mr.ondataavailable = (e) => e.data && e.data.size && recordedChunksRef.current.push(e.data)
        mr.start(1000)

        // End gracefully if share stops
        screenStream.getVideoTracks().forEach((t: any) => {
          t.onended = () => {
            setStatusMessage('Screen share ended.')
            stopRecordingAndCleanup()
            setModalOpen(false)
          }
        })

        return true
      }

      // === Preferred: canvas PiP mix ===
      let screenVideo = screenVideoRef.current
      if (!screenVideo) {
        screenVideo = document.createElement('video')
        screenVideo.autoplay = true
        screenVideo.muted = true
        screenVideo.playsInline = true
        screenVideoRef.current = screenVideo
      }
      screenVideo.srcObject = screenStream

      let camVideo = camVideoRef.current
      if (!camVideo) {
        camVideo = document.createElement('video')
        camVideo.autoplay = true
        camVideo.muted = true
        camVideo.playsInline = true
        camVideoRef.current = camVideo
      }
      if (camStream) camVideo.srcObject = camStream

      // Wait for metadata
      await Promise.all([
        new Promise<void>((resolve) => {
          if (!screenVideo) return resolve()
          if (screenVideo.readyState >= 1) return resolve()
          const onMeta = () => {
            screenVideo!.removeEventListener('loadedmetadata', onMeta)
            resolve()
          }
          screenVideo.addEventListener('loadedmetadata', onMeta)
          setTimeout(resolve, 800)
        }),
        new Promise<void>((resolve) => {
          if (!camVideo || !camStream) return resolve()
          if (camVideo.readyState >= 1) return resolve()
          const onMeta = () => {
            camVideo.removeEventListener('loadedmetadata', onMeta)
            resolve()
          }
          camVideo.addEventListener('loadedmetadata', onMeta)
          setTimeout(resolve, 800)
        }),
      ]).catch(() => { })

      const dpr = window.devicePixelRatio || 1
      const vw = screenVideo?.videoWidth || 1280
      const vh = screenVideo?.videoHeight || 720
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.floor(vw * dpr))
      canvas.height = Math.max(1, Math.floor(vh * dpr))
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        screenStream.getTracks().forEach((t: any) => t.stop())
        camStream?.getTracks().forEach((t) => t.stop())
        setStatusMessage('Canvas not available; cannot start recording.')
        return false
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const draw = () => {
        try {
          // draw screen first
          if (screenVideo?.videoWidth) {
            ctx.drawImage(screenVideo, 0, 0, canvas.width / dpr, canvas.height / dpr)
          } else {
            ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
          }
        } catch {
          ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr)
        }

        // ✅ overlay webcam in bottom-right
        if (camStream && camVideo?.videoWidth) {
          const pipW = Math.floor((canvas.width / dpr) * 0.22)
          const pipH = Math.floor((camVideo.videoHeight / camVideo.videoWidth) * pipW) || Math.floor(pipW * 0.75)
          const margin = 12
          const x = canvas.width / dpr - pipW - margin
          const y = canvas.height / dpr - pipH - margin

          ctx.fillStyle = 'rgba(0,0,0,0.35)'
          ctx.fillRect(x - 3, y - 3, pipW + 6, pipH + 6)

          try {
            ctx.drawImage(camVideo, x, y, pipW, pipH)
          } catch (err) {
            console.warn('Failed to draw cam frame:', err)
          }
        }

        animationFrameRef.current = requestAnimationFrame(draw)
      }
      draw()

      const canvasStream = (canvas as HTMLCanvasElement).captureStream(20)
      const out = new MediaStream()
      canvasStream.getVideoTracks().forEach((t) => out.addTrack(t))
      const screenAudio = screenStream.getAudioTracks()[0]
      if (screenAudio) out.addTrack(screenAudio)

      combinedStreamRef.current = out
      if (recordingPreviewRef.current) {
        recordingPreviewRef.current.srcObject = out
        recordingPreviewRef.current.muted = true
        recordingPreviewRef.current.playsInline = true
        recordingPreviewRef.current
          .play()
          .catch(() => console.warn('Recording preview autoplay blocked'))
      }

      recordedChunksRef.current = []

      let options: MediaRecorderOptions = {}
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) options.mimeType = 'video/webm;codecs=vp9,opus'
      else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) options.mimeType = 'video/webm;codecs=vp8,opus'
      else options.mimeType = 'video/webm'
      const mr = new MediaRecorder(out, options)
      mediaRecorderRef.current = mr
      mr.ondataavailable = (e) => e.data && e.data.size && recordedChunksRef.current.push(e.data)
      mr.start(1000)

      Promise.resolve(screenVideo?.play()).catch(() => { })
      if (camStream) Promise.resolve(camVideo?.play()).catch(() => { })

      screenStream.getVideoTracks().forEach((t: any) => {
        t.onended = () => {
          setStatusMessage('Screen share ended.')
          stopRecordingAndCleanup()
          setModalOpen(false)
        }
      })

      if (camStream) {
        setTimeout(() => {
          const w = camVideo?.videoWidth || 0
          const h = camVideo?.videoHeight || 0
          if (!w || !h) {
            console.warn('Webcam stream active but 0x0; likely blocked by browser/iframe policy.')
            setStatusMessage('Webcam preview unavailable — check browser permissions / iframe allow list.')
          }
        }, 1200)
      }

      return true
    } catch (err) {
      console.error('start capture failed', err)
      setStatusMessage('Screen share & camera required (triggered by a click; HTTPS/localhost needed).')
      return false
    }
  }

  // --- utility: check all tests passed ---
  function allTestsPassed(r: JudgeResult | null) {
    if (!r || !Array.isArray(r.tests) || r.tests.length === 0) return false
    return r.tests.every((t) => t.passed === true)
  }

  // --- Enhanced test runner with detailed comparison ---
  async function runAllTests() {
    setOutputExpanded(true);
    setShowOnlyProgramOutput(false);
    setShowRawJson(false)

    if (!challenge) {
      setStatusMessage('No challenge loaded');
      return;
    }
    if (!challenge) return
    setStatusMessage('Running tests...');
    setRunningResult(null);
    setShowRawJson(false);
    setIsRunning(true);

    try {
      // Get all test cases from the challenge
      const spec = challenge.testSpec;
      const allTestCases: Array<{ input: string; expected: string; name: string; isPositive: boolean }> = [];

      // Collect positive tests
      if (spec?.positiveTests) {
        spec.positiveTests.forEach((test, index) => {
          allTestCases.push({
            input: unescapeText(test.input),
            expected: unescapeText(test.expectedOutput),
            name: `Positive Test ${index + 1}`,
            isPositive: true
          });
        });
      }

      // Collect negative tests
      if (spec?.negativeTests) {
        spec.negativeTests.forEach((test, index) => {
          allTestCases.push({
            input: unescapeText(test.input),
            expected: unescapeText(test.expectedOutput),
            name: `Negative Test ${index + 1}`,
            isPositive: false
          });
        });
      }

      // If no test cases in spec, run a basic test
      if (allTestCases.length === 0) {
        setStatusMessage('No test cases defined for this challenge');
        setIsRunning(false);
        return;
      }

      const testResults: TestCaseResult[] = [];
      let passedCount = 0;

      // Run each test case
      for (const testCase of allTestCases) {
        try {
          const payload = {
            language,
            code,
            challengeId: challenge._id,
            stdin: testCase.input
          };

          const res = await fetch(`${baseURL}/api/judge/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            const body = await res.text().catch(() => '');
            testResults.push({
              name: testCase.name,
              passed: false,
              stdout: `Error: ${res.status} ${res.statusText}`,
              expected: testCase.expected,
              actual: 'Execution failed'
            });
            continue;
          }

          const text = await res.text();
          let actualOutput = '';
          let executionSuccess = true;

          try {
            const parsed = JSON.parse(text) as JudgeResult;
            actualOutput = parsed.stdout || '';
            executionSuccess = parsed.success;
          } catch {
            actualOutput = text;
          }

          // Clean and normalize outputs for comparison
          const cleanExpected = testCase.expected.trim();
          const cleanActual = actualOutput.trim();

          // Simple comparison (can be enhanced based on matchType)
          const passed = executionSuccess && cleanActual === cleanExpected;

          if (passed) passedCount++;

          testResults.push({
            name: testCase.name,
            passed,
            stdout: actualOutput,
            expected: cleanExpected,
            actual: cleanActual
          });

        } catch (err: any) {
          testResults.push({
            name: testCase.name,
            passed: false,
            stdout: `Error: ${err?.message || 'Unknown error'}`,
            expected: testCase.expected,
            actual: 'Test execution failed'
          });
        }
      }

      // Create final result
      const finalResult: JudgeResult = {
        success: passedCount === allTestCases.length,
        stdout: `Tests completed: ${passedCount}/${allTestCases.length} passed`,
        stderr: '',
        exitCode: passedCount === allTestCases.length ? 0 : 1,
        tests: testResults
      };

      setRunningResult(finalResult);
      setStatusMessage(`Tests completed: ${passedCount}/${allTestCases.length} passed`);

    } catch (err: any) {
      console.error('Test execution error:', err);
      setStatusMessage(`Failed to run tests: ${err?.message || 'Unknown error'}`);
      setRunningResult(null);
    } finally {
      setIsRunning(false);
    }
  }

  async function runProgramOnly() {
    setOutputExpanded(true)
    setShowOnlyProgramOutput(true)
    setShowRawJson(false)
    setIsRunning(true)
    setStatusMessage('Running program...')

    try {
      const payload = {
        language,
        code,
        challengeId: challenge?._id,
        stdin: '' // 👈 NO TEST INPUT
      }

      const res = await fetch(`${baseURL}/api/judge/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        setRunningResult({
          success: false,
          stdout: '',
          stderr: text || 'Execution failed',
          exitCode: 1,
          tests: [],
        })
        return
      }

      const text = await res.text()

      let parsed: JudgeResult

      try {
        parsed = JSON.parse(text) as JudgeResult
      } catch {
        parsed = {
          success: true,
          stdout: text,
          stderr: '',
          exitCode: 0,
          tests: [],
        }
      }

      // 👇 IMPORTANT: store ONLY program output
      setRunningResult((prev) => {
        const previousTests = prev?.tests ?? []

        return {
          success: parsed.success,
          stdout: parsed.stdout || '',
          stderr: parsed.stderr || '',
          exitCode: parsed.exitCode ?? 0,
          tests: previousTests,
        }
      })


      setStatusMessage('Program executed')

    } catch (err: any) {
      setRunningResult({
        success: false,
        stdout: '',
        stderr: err?.message || 'Execution error',
        exitCode: 1,
        tests: [],
      })
    } finally {
      setIsRunning(false)
    }
  }


  // --- Run a single test case ---
  async function runSingleSample(input: string, name?: string, expected?: string) {
    setStatusMessage(`Running test${name ? ` (${name})` : ''}...`);
    setIsRunning(true);

    try {
      const payload = {
        language,
        code,
        challengeId: challenge?._id,
        stdin: input
      };

      const res = await fetch(`${baseURL}/api/judge/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => '');
        setStatusMessage(`Test failed: ${res.status} ${res.statusText}`);
        setIsRunning(false);
        return;
      }

      const text = await res.text();
      let actualOutput = '';
      let executionSuccess = true;

      try {
        const parsed = JSON.parse(text) as JudgeResult;
        actualOutput = parsed.stdout || '';
        executionSuccess = parsed.success;
      } catch {
        actualOutput = text;
      }

      // If expected value provided, compare
      if (expected) {
        const cleanExpected = expected.trim();
        const cleanActual = actualOutput.trim();
        const passed = executionSuccess && cleanActual === cleanExpected;

        const testResult: JudgeResult = {
          success: passed,
          stdout: actualOutput,
          stderr: '',
          exitCode: passed ? 0 : 1,
          tests: [{
            name: name || 'Sample Test',
            passed,
            stdout: actualOutput,
            expected: cleanExpected,
            actual: cleanActual
          }]
        };

        setRunningResult(testResult);
        setStatusMessage(passed ? 'Test passed!' : 'Test failed');
      } else {
        setRunningResult({
          success: executionSuccess,
          stdout: actualOutput,
          stderr: '',
          exitCode: executionSuccess ? 0 : 1,
          tests: []
        });
        setStatusMessage('Test executed');
      }

    } catch (err: any) {
      setStatusMessage(`Test failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  }

  // --- Final submit (allowed anytime; auto-submit still happens on timeout) ---
  async function handleFinalSubmit(isAuto = false) {
    if (submittingRef.current) {
      console.warn('Submission already in progress – ignoring duplicate call')
      return
    }

    submittingRef.current = true   // 🔒 LOCK

    setStatusMessage('Submitting...')
    setIsRunning(true)

    try {
      const videoBlob = await stopRecordingAndGetBlob()

      const total = runningResult?.tests?.length ?? 0
      const passed = runningResult?.tests?.filter((t) => t.passed).length ?? 0
      const judgeJson = runningResult ? JSON.stringify(runningResult) : '{}'

      const fd = new FormData()
      fd.append('challengeId', challenge!._id)
      fd.append('language', language)
      fd.append('code', code)
      fd.append('autoSubmitted', String(isAuto))
      fd.append('testsPassed', String(passed))
      fd.append('testsTotal', String(total))
      fd.append('judgeResult', judgeJson)
      if (studentId) fd.append('studentId', studentId)
      if (videoBlob) fd.append('recording', videoBlob, `recording-${Date.now()}.webm`)

      const res = await fetch(`${baseURL}/api/challenges/submit`, {
        method: 'POST',
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        body: fd,
      })

      if (!res.ok) throw new Error('Submit failed')

      onSubmitted?.(challenge?._id)
      closeModalAndCleanup()
    } catch (err) {
      console.error(err)
    } finally {
      setIsRunning(false)
    }
  }


  // --- drag handlers for webcam preview ---
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging) return
      const modal = modalRef.current
      const preview = camPreviewRef.current
      if (!modal || !preview) return
      const rect = modal.getBoundingClientRect()
      const offset = dragOffsetRef.current
      const newLeft = e.clientX - rect.left - offset.x
      const newTop = e.clientY - rect.top - offset.y
      const previewW = preview.offsetWidth,
        previewH = preview.offsetHeight
      const clampedLeft = Math.min(rect.width - previewW - 8, Math.max(8, newLeft))
      const clampedTop = Math.min(rect.height - previewH - 8, Math.max(8, newTop))
      setCamPos({ right: Math.round(rect.width - (clampedLeft + previewW)), bottom: Math.round(rect.height - (clampedTop + previewH)) })
    }
    function onUp() {
      setDragging(false)
      document.body.style.userSelect = ''
    }
    if (dragging) {
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
      document.body.style.userSelect = 'none'
    }
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.userSelect = ''
    }
  }, [dragging])

  function onPreviewMouseDown(e: React.MouseEvent) {
    const preview = camPreviewRef.current
    const modal = modalRef.current
    if (!preview || !modal) return
    setDragging(true)
    const previewRect = preview.getBoundingClientRect()
    dragOffsetRef.current = { x: e.clientX - previewRect.left, y: e.clientY - previewRect.top }
    e.preventDefault()
  }

  // --- Render UI ---
  return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12, color: '#fff' }}>Code Challenge</h2>
      {!hidePreview &&
        !modalOpen &&
        (challenge ? (
          <ChallengePanel challenge={challenge} openModalAndStart={openModalAndStart} onRunSample={runSingleSample} />
        ) : (
          <div style={{ color: '#9ca3af', padding: 20, textAlign: 'center' }}>Loading challenge...</div>
        ))}
      {/* Modal */}
      {modalOpen && challenge && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(8,10,14,0.85)',
            backdropFilter: 'blur(8px) saturate(120%)',
            WebkitBackdropFilter: 'blur(8px) saturate(120%)',
            padding: 24,
          }}>
          <ViolationAlert show={showViolationAlert} violations={violations} maxViolations={2} />

          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            style={{
              width: '94vw',
              height: '90vh',
              maxWidth: '98vw',
              maxHeight: '98vh',
              borderRadius: 12,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 60px rgba(2,6,23,0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'linear-gradient(180deg, rgba(15,23,42,0.95), rgba(8,18,39,0.95))',
              position: 'relative',
            }}>

            {/* Top Header Bar - Like LeetCode */}
            <div style={{
              padding: '12px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(15,23,42,0.9)',
              flexShrink: 0,
            }}>
              {/* Left: Challenge title and status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <h3 style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 600,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span style={{ fontSize: '20px' }}>💻</span>
                  {challenge.title}
                </h3>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  fontSize: 14,
                  color: '#94a3b8'
                }}>
                  <div>
                    Time:{' '}
                    <span style={{
                      color: timeLeft && timeLeft < 300 ? '#f87171' : '#34d399',
                      fontWeight: 600
                    }}>
                      {timeLeft === null ? '--:--' :
                        `${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`
                      }
                    </span>
                  </div>
                  {runningResult && (
                    <div>
                      Passed:{' '}
                      <span style={{ color: '#10b981', fontWeight: 600 }}>
                        {runningResult.tests.filter(t => t.passed).length}/{runningResult.tests.length}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Language selector and action buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Language Selector */}
                <div style={{ position: 'relative', minWidth: 150 }}>
                  <select
                    value={language}
                    onChange={(e) => {
                      const selectedLang = e.target.value;
                      setLanguage(selectedLang);
                      setCode(DEFAULT_CODE[selectedLang] || "");
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 16px 8px 40px',
                      borderRadius: 6,
                      background: 'rgba(15, 23, 42, 0.9)',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.25)',
                      fontSize: 14,
                      fontWeight: 500,
                      appearance: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    }}
                  >
                    {LANGUAGES.map((l) => (
                      <option
                        key={l.id}
                        value={l.id}
                        style={{
                          background: '#0f172a',
                          color: '#fff',
                          padding: '12px',
                        }}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                  <span style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 16,
                    pointerEvents: 'none',
                  }}>
                    💬
                  </span>
                  <span style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 10,
                    color: '#94a3b8',
                    pointerEvents: 'none',
                  }}>
                    ▼
                  </span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={runAllTests}
                    disabled={isRunning}
                    style={{
                      padding: '8px 16px',
                      background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: isRunning ? 'not-allowed' : 'pointer',
                      opacity: isRunning ? 0.7 : 1,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {isRunning ? (
                      <>
                        <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                        Running...
                      </>
                    ) : (
                      <>
                        <span>▶️</span>
                        Run
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleFinalSubmit(false)}
                    disabled={isRunning}
                    style={{
                      padding: '8px 16px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: isRunning ? 'not-allowed' : 'pointer',
                      opacity: isRunning ? 0.7 : 1,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>🚀</span>
                    Submit
                  </button>

                  <button
                    onClick={closeModalAndCleanup}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#94a3b8',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 6,
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div style={{
              display: 'flex',
              flex: 1,
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Left Panel: Challenge Description */}
              <div style={{
                width: '40%',
                overflow: 'auto',
                padding: 20,
                background: 'linear-gradient(180deg, #071125, #081827)',
                borderRight: '1px solid rgba(255,255,255,0.1)',
              }}>
                <div style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#93c5fd',
                  marginBottom: 16,
                  paddingBottom: 12,
                  borderBottom: '1px solid rgba(255,255,255,0.1)'
                }}>
                  Description
                </div>
                <div style={{
                  color: '#d1d5db',
                  fontSize: 14,
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap'
                }}>
                  {renderDescription(unescapeText(challenge.description))}
                </div>

                {/* Sample test cases if available */}
                {challenge.testSpec && (
                  <div style={{ marginTop: 24 }}>
                    <div style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: '#93c5fd',
                      marginBottom: 12
                    }}>
                      Example Test Cases
                    </div>
                    {(challenge.testSpec.positiveTests || []).slice(0, 2).map((test, index) => (
                      <div key={index} style={{
                        marginBottom: 16,
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 8,
                        padding: 12,
                        border: '1px solid rgba(255,255,255,0.06)'
                      }}>
                        <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 4 }}>Input:</div>
                        <pre style={{
                          background: 'rgba(0,0,0,0.3)',
                          padding: 8,
                          borderRadius: 4,
                          fontSize: 13,
                          color: '#e2e8f0',
                          margin: 0,
                          overflow: 'auto'
                        }}>
                          {unescapeText(test.input)}
                        </pre>
                        <div style={{ fontSize: 14, color: '#9ca3af', marginBottom: 4, marginTop: 8 }}>Output:</div>
                        <pre style={{
                          background: 'rgba(0,0,0,0.3)',
                          padding: 8,
                          borderRadius: 4,
                          fontSize: 13,
                          color: '#86efac',
                          margin: 0,
                          overflow: 'auto'
                        }}>
                          {unescapeText(test.expectedOutput)}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Panel: Code Editor */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                {/* Editor */}
                <div style={{ flex: 1, minHeight: 0 }}>
                  <Editor
                    height="100%"
                    language={getMonacoLanguage(language)}
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    onMount={handleEditorDidMountModal}
                    theme="custom-dark"
                    beforeMount={defineTheme}
                    options={{
                      minimap: { enabled: true },
                      fontSize: 14,
                      fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace",
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      wordWrap: 'on',
                      padding: { top: 16, bottom: 16 },
                      renderLineHighlight: 'all',
                      cursorBlinking: 'smooth',
                      bracketPairColorization: { enabled: true },
                      readOnly: isRunning || submittingRef.current,
                    }}
                  />
                </div>

                {/* Draggable Webcam */}
                <DraggableWebcam
                  camPreviewRef={camPreviewRef}
                  position={camPos}
                  onDragStart={onPreviewMouseDown}
                />
              </div>
            </div>

            {/* Recording preview (canvas output) */}
            <video
              ref={recordingPreviewRef}
              autoPlay
              muted
              playsInline
              style={{
                position: 'absolute',
                top: 70,
                right: 16,
                width: 220,
                height: 140,
                background: '#000',
                borderRadius: 8,
                border: '2px solid #10b981',
                zIndex: 25,
              }}
            />


            {/* Collapsible Console/Terminal at Bottom */}
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.1)',
              background: 'linear-gradient(180deg, #071122, #081122)',
              height: outputExpanded ? '40vh' : '40px',
              transition: 'height 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
            }}>
              {/* Console Header */}
              <div style={{
                padding: '8px 16px',
                background: 'rgba(15,23,42,0.9)',
                borderBottom: outputExpanded ? '1px solid rgba(255,255,255,0.1)' : 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                height: 40,
                flexShrink: 0,
              }}
                onClick={() => {
                  setOutputExpanded(!outputExpanded)

                  // 👇 RESET CONSOLE MODE WHEN CLOSING
                  if (outputExpanded) {
                    setShowOnlyProgramOutput(false)
                    setShowRawJson(false)
                  }
                }}

              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#60a5fa', fontSize: 16 }}>🖥️</span>
                  <span style={{ color: '#cbd5e1', fontWeight: 600, fontSize: 14 }}>
                    Console
                    {runningResult && (
                      <span style={{ marginLeft: 8, color: '#94a3b8', fontSize: 13 }}>
                        ({runningResult.tests.filter(t => t.passed).length}/{runningResult.tests.length} tests passed)
                      </span>
                    )}
                  </span>
                  {statusMessage && (
                    <span style={{ color: '#94a3b8', fontSize: 13, marginLeft: 12 }}>
                      {statusMessage}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {outputExpanded && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowOnlyProgramOutput(false)
                          // if you are still toggling raw internally, keep this
                          setShowRawJson(false)
                        }}
                        style={{
                          padding: '4px 8px',
                          fontSize: 12,
                          background: 'rgba(255,255,255,0.05)',
                          color: '#94a3b8',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        View Results
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          runProgramOnly()   // ✅ THIS IS THE FIX
                        }}
                        style={{
                          padding: '4px 8px',
                          fontSize: 12,
                          background: 'rgba(15,23,42,0.8)',
                          color: '#60a5fa',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: 4,
                          cursor: 'pointer',
                        }}
                      >
                        Program Output
                      </button>


                    </>
                  )}
                  <span style={{
                    transform: `rotate(${outputExpanded ? '180deg' : '0deg'})`,
                    transition: 'transform 0.3s',
                    color: '#94a3b8',
                    fontSize: 12,
                  }}>
                    ▼
                  </span>
                </div>
              </div>

              {/* Console Content */}
              {outputExpanded && (
                <div
                  style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: 16,
                  }}
                >
                  {!runningResult ? (
                    <div
                      style={{
                        textAlign: 'center',
                        color: '#94a3b8',
                        padding: 40,
                        fontSize: 14,
                      }}
                    >
                      Click "Run" to execute your code and see results here
                    </div>
                  ) : showOnlyProgramOutput ? (
                    /* ================= PROGRAM OUTPUT ONLY ================= */
                    <pre
                      style={{
                        margin: 0,
                        padding: 12,
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: 6,
                        fontSize: 13,
                        color: '#e2e8f0',
                        whiteSpace: 'pre-wrap',
                        maxHeight: '100%',
                        overflow: 'auto',
                      }}
                    >
                      {runningResult.stdout || 'No output'}
                    </pre>
                  ) : showRawJson ? (
                    /* ================= RAW JSON VIEW ================= */
                    <pre
                      style={{
                        margin: 0,
                        padding: 12,
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: 6,
                        fontSize: 12,
                        color: '#e2e8f0',
                        overflow: 'auto',
                        maxHeight: '100%',
                      }}
                    >
                      {JSON.stringify(runningResult, null, 2)}
                    </pre>
                  ) : (
                    /* ================= NORMAL VIEW (Execution + Tests) ================= */
                    <>
                      {/* Execution Output */}
                      <div style={{ marginBottom: 16 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#cbd5e1',
                            marginBottom: 8,
                          }}
                        >
                          Execution Result
                        </div>

                        {runningResult.stdout && (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>
                              Output:
                            </div>
                            <pre
                              style={{
                                margin: 0,
                                padding: 8,
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: 4,
                                fontSize: 13,
                                color: '#e2e8f0',
                                whiteSpace: 'pre-wrap',
                                maxHeight: 120,
                                overflow: 'auto',
                              }}
                            >
                              {runningResult.stdout}
                            </pre>
                          </div>
                        )}

                        {runningResult.stderr && (
                          <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: 13, color: '#fca5a5', marginBottom: 4 }}>
                              Error:
                            </div>
                            <pre
                              style={{
                                margin: 0,
                                padding: 8,
                                background: 'rgba(239,68,68,0.1)',
                                borderRadius: 4,
                                fontSize: 13,
                                color: '#fca5a5',
                                whiteSpace: 'pre-wrap',
                                maxHeight: 120,
                                overflow: 'auto',
                              }}
                            >
                              {runningResult.stderr}
                            </pre>
                          </div>
                        )}
                      </div>

                      {/* Test Results */}
                      {runningResult.tests && runningResult.tests.length > 0 && (
                        <div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              color: '#cbd5e1',
                              marginBottom: 8,
                            }}
                          >
                            Test Results
                          </div>

                          <div style={{ display: 'grid', gap: 8 }}>
                            {runningResult.tests.map((test, index) => (
                              <div
                                key={index}
                                style={{
                                  padding: 12,
                                  background: test.passed
                                    ? 'rgba(34,197,94,0.1)'
                                    : 'rgba(239,68,68,0.1)',
                                  borderRadius: 6,
                                  border: `1px solid ${test.passed
                                    ? 'rgba(34,197,94,0.2)'
                                    : 'rgba(239,68,68,0.2)'
                                    }`,
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 8,
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: '50%',
                                      background: test.passed ? '#10b981' : '#ef4444',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: 12,
                                      color: 'white',
                                    }}
                                  >
                                    {test.passed ? '✓' : '✗'}
                                  </div>
                                  <span
                                    style={{
                                      fontWeight: 600,
                                      color: test.passed ? '#10b981' : '#ef4444',
                                      fontSize: 14,
                                    }}
                                  >
                                    {test.name || `Test Case ${index + 1}`}
                                  </span>
                                </div>

                                {!test.passed && test.expected && test.actual && (
                                  <div style={{ fontSize: 13 }}>
                                    <div
                                      style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: 12,
                                      }}
                                    >
                                      <div>
                                        <div style={{ color: '#94a3b8', marginBottom: 4 }}>
                                          Expected:
                                        </div>
                                        <div
                                          style={{
                                            color: '#10b981',
                                            background: 'rgba(0,0,0,0.3)',
                                            padding: 6,
                                            borderRadius: 4,
                                            fontSize: 12,
                                          }}
                                        >
                                          {test.expected}
                                        </div>
                                      </div>

                                      <div>
                                        <div style={{ color: '#94a3b8', marginBottom: 4 }}>
                                          Got:
                                        </div>
                                        <div
                                          style={{
                                            color: '#ef4444',
                                            background: 'rgba(0,0,0,0.3)',
                                            padding: 6,
                                            borderRadius: 4,
                                            fontSize: 12,
                                          }}
                                        >
                                          {test.actual}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

            </div>
          </div>
          {/* 🔒 SUBMITTING OVERLAY */}
          {(isRunning && submittingRef.current) && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 10000,
                background: 'rgba(2,6,23,0.75)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(6px)',
              }}
            >
              <div
                style={{
                  padding: 24,
                  borderRadius: 12,
                  background: '#020617',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                  textAlign: 'center',
                  color: '#e5e7eb',
                  minWidth: 220,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    border: '4px solid rgba(255,255,255,0.2)',
                    borderTopColor: '#22c55e',
                    borderRadius: '50%',
                    margin: '0 auto 16px',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <div style={{ fontWeight: 600 }}>Submitting…</div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                  Please don’t close the window
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}