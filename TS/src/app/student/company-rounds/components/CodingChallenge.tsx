import React, { useState, useEffect, useRef } from 'react'
import { Button, Spinner, Badge, Dropdown, Alert } from 'react-bootstrap'
import Editor from '@monaco-editor/react'
import { Code2, Clock, ChevronLeft, Play, CheckCircle, XCircle, Pencil, ChevronDown, Terminal, FileCode, Zap } from 'lucide-react'
import { useAuthContext } from '@/context/useAuthContext'

// ================= TYPES =================
type Question = {
  _id: string
  title?: string
  description?: string
  input?: string
  output?: string | number
  order: number
}

type Round = {
  _id: string
  roundName: string
  roundType: string
  duration: number
  questionCount: number
  questions: Question[]
}

type Props = {
  round: Round
  companyName: string
  role: string
  onClose: () => void
}

// ================= LANGUAGE CONFIGURATION =================
const LANGUAGES = [
  { id: 'python', name: 'Python 3', icon: '🐍', monacoId: 'python', defaultCode: `def solve():
    # Write your solution here
    import sys
    data = sys.stdin.read().strip()
    if not data:
        return
    # Process input and print output
    print(data)

if __name__ == "__main__":
    solve()` },
  { id: 'javascript', name: 'JavaScript (Node.js)', icon: '🟨', monacoId: 'javascript', defaultCode: `function solve(input) {
    // Write your solution here
    console.log(input);
}

// Read input
process.stdin.on('data', data => {
    solve(data.toString().trim());
});` },
  { id: 'typescript', name: 'TypeScript', icon: '📘', monacoId: 'typescript', defaultCode: `function solve(input: string): void {
    // Write your solution here
    console.log(input);
}

// Read input
process.stdin.on('data', data => {
    solve(data.toString().trim());
});` },
  { id: 'java', name: 'Java', icon: '☕', monacoId: 'java', defaultCode: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        String input = sc.nextLine();
        System.out.println(input);
        sc.close();
    }
}` },
  { id: 'cpp', name: 'C++', icon: '⚡', monacoId: 'cpp', defaultCode: `#include <iostream>
#include <string>
using namespace std;

int main() {
    string input;
    getline(cin, input);
    cout << input << endl;
    return 0;
}` },
  { id: 'c', name: 'C', icon: '🔧', monacoId: 'c', defaultCode: `#include <stdio.h>
#include <string.h>

int main() {
    char input[1000];
    fgets(input, sizeof(input), stdin);
    printf("%s", input);
    return 0;
}` },
  { id: 'csharp', name: 'C#', icon: '🎯', monacoId: 'csharp', defaultCode: `using System;

class Program {
    static void Main() {
        string input = Console.ReadLine();
        Console.WriteLine(input);
    }
}` },
  { id: 'go', name: 'Go', icon: '🐹', monacoId: 'go', defaultCode: `package main

import (
    "bufio"
    "fmt"
    "os"
)

func main() {
    scanner := bufio.NewScanner(os.Stdin)
    scanner.Scan()
    input := scanner.Text()
    fmt.Println(input)
}` },
  { id: 'rust', name: 'Rust', icon: '🦀', monacoId: 'rust', defaultCode: `use std::io;

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    print!("{}", input);
}` },
  { id: 'php', name: 'PHP', icon: '🐘', monacoId: 'php', defaultCode: `<?php
$input = fgets(STDIN);
echo $input;
?>` },
  { id: 'ruby', name: 'Ruby', icon: '💎', monacoId: 'ruby', defaultCode: `def solve
    input = gets.chomp
    puts input
end

solve if __FILE__ == $0` },
]

// ================= MONACO EDITOR THEME =================
const EDITOR_THEME = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
    { token: 'keyword', foreground: '569CD6', fontStyle: 'bold' },
    { token: 'string', foreground: 'CE9178' },
    { token: 'number', foreground: 'B5CEA8' },
    { token: 'function', foreground: 'DCDCAA' },
    { token: 'operator', foreground: 'D4D4D4' },
    { token: 'class', foreground: '4EC9B0' },
  ],
  colors: {
    'editor.background': '#0F172A',
    'editor.foreground': '#E2E8F0',
    'editor.lineHighlightBackground': '#1E293B',
    'editorCursor.foreground': '#FF6B35',
    'editor.selectionBackground': '#FF6B3533',
    'editor.inactiveSelectionBackground': '#FF6B3522',
    'editor.lineNumber.foreground': '#64748B',
    'editor.lineNumber.activeForeground': '#FF6B35',
    'editor.gutterBackground': '#0F172A',
    'editorIndentGuide.background': '#334155',
    'editorIndentGuide.activeBackground': '#FF6B35',
  },
}

// ================= MAIN COMPONENT =================
const CodingChallenge: React.FC<Props> = ({ round, companyName, role, onClose }) => {
  const { user } = useAuthContext()
  const baseURL = import.meta.env.VITE_API_BASE_URL

  // Pick random question on mount
  const [question] = useState<Question>(() => {
    const qs = round.questions || []
    if (qs.length === 0) return null as any
    return qs[Math.floor(Math.random() * qs.length)]
  })

  const [code, setCode] = useState('')
  const [language, setLanguage] = useState(LANGUAGES[0])
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ passed: boolean; actualOutput: string; expectedOutput: string; stderr?: string } | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [terminalOutput, setTerminalOutput] = useState('')
  const [showTerminal, setShowTerminal] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Timer
  const [timeLeft, setTimeLeft] = useState(round.duration * 60)
  const [timerActive, setTimerActive] = useState(true)

  // Editor ref
  const editorRef = useRef<any>(null)

  // Initialize code with language default
  useEffect(() => {
    setCode(language.defaultCode)
  }, [language])

  // Timer effect
  useEffect(() => {
    if (!timerActive || timeLeft <= 0 || submitted) return
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(t)
          setTimerActive(false)
          setSubmitted(true)
          setError("⏰ Time's up! Your round has ended.")
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [timerActive, submitted])

  const formatTime = (s: number) => {
    const hours = Math.floor(s / 3600)
    const minutes = Math.floor((s % 3600) / 60)
    const seconds = s % 60
    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const handleRun = async () => {
    if (!question || !code.trim()) {
      setError('Please write your code before running')
      return
    }
    
    setIsRunning(true)
    setResult(null)
    setError(null)
    setTerminalOutput('Running code...\n')
    
    try {
      const payload = {
        language: language.id,
        code,
        stdin: question.input || ''
      }
      
      const res = await fetch(`${baseURL}/api/judge/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      const data = await res.json()
      const actualOutput = String(data?.stdout || '').trim()
      const expectedOutput = String(question.output || '').trim()
      const passed = actualOutput === expectedOutput
      
      setResult({ passed, actualOutput, expectedOutput, stderr: data?.stderr })
      
      setTerminalOutput(prev => 
        `${prev}✓ Execution completed\n\n📥 Input: ${question.input || '(empty)'}\n📤 Output: ${actualOutput || '(empty)'}\n🎯 Expected: ${expectedOutput}\n✅ Status: ${passed ? 'PASSED' : 'FAILED'}\n${data?.stderr ? `\n❌ Error: ${data.stderr}` : ''}`
      )
    } catch (err: any) {
      setError(err.message || 'Failed to run code')
      setTerminalOutput(prev => `${prev}❌ Error: ${err.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError('Please write your code before submitting')
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    
    try {
      const payload = {
        roundId: round._id,
        questionId: question._id,
        language: language.id,
        code,
        result: Boolean(result?.passed)
      }
      
      const res = await fetch(`${baseURL}/api/student/coding/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify(payload),
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Submission failed')
      
      setTimerActive(false)
      setSubmitted(true)
      setTerminalOutput(prev => `${prev}\n\n🎉 Solution submitted successfully!`)
    } catch (err: any) {
      setError(err.message || 'Failed to submit solution')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
    editor.focus()

    const stopClipboard = (event: any) => {
      event.preventDefault()
      event.stopPropagation?.()
      return false
    }

    const domNode = editor.getDomNode?.() || editor.getContainerDomNode?.()
    if (domNode) {
      domNode.addEventListener('copy', stopClipboard)
      domNode.addEventListener('paste', stopClipboard)
      domNode.addEventListener('cut', stopClipboard)
      domNode.addEventListener('contextmenu', stopClipboard)
    }

    editor.onKeyDown((e: any) => {
      const key = e.browserEvent?.key?.toLowerCase?.()
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'x', 'a'].includes(key)) {
        e.preventDefault()
        e.stopPropagation()
      }
    })
  }

  if (!question) {
    return (
      <div className="cc-empty">
        <FileCode size={48} />
        <p>No coding questions available for this round.</p>
        <Button onClick={onClose} className="cc-back-btn">
          <ChevronLeft size={16} /> Back
        </Button>
      </div>
    )
  }

  return (
    <div className="cc-container">
      {/* Header Bar */}
      <div className="cc-header">
        <div className="cc-header-left">
          <Button className="cc-back-btn" onClick={onClose}>
            <ChevronLeft size={16} /> Back
          </Button>
          <div className="cc-title-group">
            <span className="cc-company">{companyName} • {role}</span>
            <span className="cc-round-name">
              <Code2 size={14} /> {round.roundName}
            </span>
          </div>
        </div>
        <div className="cc-header-right">
          <Dropdown className="cc-language-dropdown">
            <Dropdown.Toggle variant="dark" className="cc-lang-toggle">
              <span className="lang-icon">{language.icon}</span> {language.name} <ChevronDown size={14} />
            </Dropdown.Toggle>
            <Dropdown.Menu className="cc-lang-menu">
              {LANGUAGES.map(lang => (
                <Dropdown.Item 
                  key={lang.id} 
                  onClick={() => setLanguage(lang)}
                  className={language.id === lang.id ? 'active' : ''}
                >
                  <span className="lang-icon">{lang.icon}</span> {lang.name}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
          <div className={`cc-timer ${timeLeft < 300 ? 'cc-timer-warn' : ''}`}>
            <Clock size={14} />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Body: Split Layout */}
      <div className="cc-body">
        {/* Left — Problem Statement */}
        <div className="cc-problem-panel">
          <div className="cc-problem-header">
            <h4 className="cc-problem-title">{question.title || 'Coding Challenge'}</h4>
            <Badge className="cc-difficulty-badge">
              <Zap size={10} /> Challenge
            </Badge>
          </div>
          
          <div className="cc-problem-description">
            <p className="cc-problem-desc">{question.description}</p>
          </div>

          <div className="cc-sample-section">
            <div className="cc-sample-header">
              <span className="cc-sample-icon">📥</span>
              <span className="cc-sample-label">Sample Input</span>
            </div>
            <pre className="cc-sample-code">{question.input || 'N/A'}</pre>
          </div>
          
          <div className="cc-sample-section">
            <div className="cc-sample-header">
              <span className="cc-sample-icon">📤</span>
              <span className="cc-sample-label">Expected Output</span>
            </div>
            <pre className="cc-sample-code">{String(question.output ?? 'N/A')}</pre>
          </div>

          {result && (
            <div className={`cc-result-panel ${result.passed ? 'cc-result-pass' : 'cc-result-fail'}`}>
              <div className="cc-result-header">
                {result.passed ? <CheckCircle size={16} /> : <XCircle size={16} />}
                <span>{result.passed ? 'Test Passed!' : 'Test Failed'}</span>
              </div>
              <div className="cc-result-content">
                <div className="cc-result-row">
                  <span>Your Output:</span>
                  <code>{result.actualOutput || '(empty)'}</code>
                </div>
                <div className="cc-result-row">
                  <span>Expected:</span>
                  <code>{result.expectedOutput}</code>
                </div>
                {result.stderr && (
                  <div className="cc-result-row cc-stderr">
                    <span>Error:</span>
                    <code>{result.stderr}</code>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right — Code Editor */}
        <div className="cc-editor-panel">
          <div className="cc-editor-header">
            <div className="cc-editor-title">
              <Pencil size={14} />
              <span>Solution Editor</span>
            </div>
            <button 
              className="cc-terminal-toggle"
              onClick={() => setShowTerminal(!showTerminal)}
            >
              <Terminal size={14} />
              {showTerminal ? 'Hide Terminal' : 'Show Terminal'}
            </button>
          </div>
          
          <div className="cc-editor-wrapper">
            <Editor
              height="100%"
              language={language.monacoId}
              value={code}
              onChange={(value) => setCode(value || '')}
              theme="coding-dark"
              onMount={handleEditorDidMount}
              beforeMount={(monaco) => monaco.editor.defineTheme('coding-dark', EDITOR_THEME)}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                lineNumbers: 'on',
                lineDecorationsWidth: 10,
                lineNumbersMinChars: 3,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                wordWrap: 'on',
                padding: { top: 12, bottom: 12 },
                renderLineHighlight: 'all',
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                formatOnPaste: true,
                formatOnType: true,
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                parameterHints: { enabled: true },
                bracketPairColorization: { enabled: true },
                renderWhitespace: 'selection',
                tabSize: 4,
                insertSpaces: true,
                contextmenu: false,
              }}
            />
          </div>

          {showTerminal && (
            <div className="cc-terminal">
              <div className="cc-terminal-header">
                <Terminal size={12} />
                <span>Terminal Output</span>
                <button 
                  className="cc-terminal-clear"
                  onClick={() => setTerminalOutput('')}
                >
                  Clear
                </button>
              </div>
              <div className="cc-terminal-content">
                <pre>{terminalOutput || 'Run your code to see output...'}</pre>
              </div>
            </div>
          )}

          <div className="cc-editor-actions">
            {error && (
              <Alert variant="danger" className="cc-error-alert">
                <XCircle size={14} /> {error}
              </Alert>
            )}
            <div className="cc-action-buttons">
              <Button 
                className="cc-run-btn" 
                onClick={handleRun} 
                disabled={isRunning || !code.trim() || submitted}
              >
                {isRunning ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <><Play size={14} /> Run Code</>
                )}
              </Button>
              <Button 
                className="cc-submit-btn" 
                onClick={handleSubmit} 
                disabled={submitted || isSubmitting || !code.trim()}
              >
                {isSubmitting ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <><CheckCircle size={14} /> Submit Solution</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Submitted Banner */}
      {submitted && (
        <div className="cc-submitted-banner">
          <div className="cc-submitted-content">
            {result?.passed ? (
              <>
                <CheckCircle size={20} />
                <span>🎉 Correct! Solution submitted successfully.</span>
              </>
            ) : timeLeft <= 0 ? (
              <>
                <Clock size={20} />
                <span>⏰ Time's up! Round has ended.</span>
              </>
            ) : (
              <>
                <FileCode size={20} />
                <span>📝 Solution submitted. Review your result on the left.</span>
              </>
            )}
          </div>
          <Button className="cc-close-btn" onClick={onClose}>
            Close Round
          </Button>
        </div>
      )}

      <style>{`
        .cc-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #0F172A;
          color: #E2E8F0;
          overflow: hidden;
        }

        /* Header */
        .cc-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1.5rem;
          background: #0A0F1A;
          border-bottom: 1px solid #1E293B;
          flex-shrink: 0;
        }

        .cc-header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .cc-back-btn {
          background: transparent;
          border: 1px solid #334155;
          color: #94A3B8;
          padding: 0.4rem 0.85rem;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .cc-back-btn:hover {
          border-color: #FF6B35;
          color: #FF6B35;
          background: rgba(255, 107, 53, 0.1);
        }

        .cc-title-group {
          display: flex;
          flex-direction: column;
        }

        .cc-company {
          font-size: 0.7rem;
          color: #64748B;
        }

        .cc-round-name {
          font-size: 0.85rem;
          color: #28A745;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .cc-header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        /* Language Dropdown */
        .cc-language-dropdown .cc-lang-toggle {
          background: #1E293B;
          border: 1px solid #334155;
          color: #E2E8F0;
          padding: 0.4rem 0.85rem;
          font-size: 0.85rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .cc-language-dropdown .cc-lang-toggle:hover {
          border-color: #FF6B35;
        }

        .cc-lang-menu {
          background: #1E293B;
          border: 1px solid #334155;
          max-height: 300px;
          overflow-y: auto;
        }

        .cc-lang-menu .dropdown-item {
          color: #E2E8F0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
        }

        .cc-lang-menu .dropdown-item:hover {
          background: #334155;
          color: #FF6B35;
        }

        .cc-lang-menu .dropdown-item.active {
          background: #FF6B35;
          color: #FFFFFF;
        }

        .lang-icon {
          font-size: 1rem;
        }

        /* Timer */
        .cc-timer {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(40, 167, 69, 0.1);
          border: 1px solid #28A745;
          color: #28A745;
          padding: 0.4rem 1rem;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 700;
          font-family: monospace;
        }

        .cc-timer.cc-timer-warn {
          background: rgba(220, 53, 69, 0.1);
          border-color: #DC3545;
          color: #DC3545;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        /* Body Split */
        .cc-body {
          display: flex;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        /* Problem Panel */
        .cc-problem-panel {
          width: 40%;
          min-width: 350px;
          padding: 1.5rem;
          border-right: 1px solid #1E293B;
          overflow-y: auto;
          background: #0A0F1A;
        }

        .cc-problem-panel::-webkit-scrollbar {
          width: 6px;
        }

        .cc-problem-panel::-webkit-scrollbar-track {
          background: #1E293B;
        }

        .cc-problem-panel::-webkit-scrollbar-thumb {
          background: #FF6B35;
          border-radius: 3px;
        }

        .cc-problem-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .cc-problem-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0;
        }

        .cc-difficulty-badge {
          background: rgba(255, 107, 53, 0.15);
          color: #FF6B35;
          border: 1px solid #FF6B35;
          font-size: 0.7rem;
          padding: 0.3rem 0.7rem;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .cc-problem-desc {
          font-size: 0.85rem;
          color: #CBD5E1;
          line-height: 1.7;
          margin-bottom: 1.5rem;
        }

        .cc-sample-section {
          margin-bottom: 1.25rem;
        }

        .cc-sample-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .cc-sample-icon {
          font-size: 0.85rem;
        }

        .cc-sample-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: #FF6B35;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .cc-sample-code {
          background: #0D1425;
          border: 1px solid #1E293B;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-size: 0.8rem;
          color: #FBBF24;
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
          font-family: 'Consolas', monospace;
        }

        /* Result Panel */
        .cc-result-panel {
          margin-top: 1.5rem;
          border-radius: 12px;
          overflow: hidden;
        }

        .cc-result-pass {
          background: rgba(40, 167, 69, 0.08);
          border: 1px solid #28A745;
        }

        .cc-result-fail {
          background: rgba(220, 53, 69, 0.08);
          border: 1px solid #DC3545;
        }

        .cc-result-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          font-weight: 700;
          font-size: 0.85rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .cc-result-pass .cc-result-header { color: #28A745; }
        .cc-result-fail .cc-result-header { color: #DC3545; }

        .cc-result-content {
          padding: 0.75rem 1rem;
        }

        .cc-result-row {
          display: flex;
          gap: 0.75rem;
          font-size: 0.75rem;
          color: #94A3B8;
          margin-bottom: 0.4rem;
        }

        .cc-result-row span { 
          min-width: 70px;
          color: #64748B;
        }
        
        .cc-result-row code { 
          color: #E2E8F0;
          font-family: monospace;
        }
        
        .cc-stderr code { 
          color: #FF6B6B;
        }

        /* Editor Panel */
        .cc-editor-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #0F172A;
          overflow: hidden;
        }

        .cc-editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.6rem 1rem;
          background: #0A0F1A;
          border-bottom: 1px solid #1E293B;
        }

        .cc-editor-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #FF6B35;
          font-weight: 600;
        }

        .cc-terminal-toggle {
          background: transparent;
          border: 1px solid #334155;
          color: #94A3B8;
          padding: 0.25rem 0.75rem;
          font-size: 0.7rem;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cc-terminal-toggle:hover {
          border-color: #FF6B35;
          color: #FF6B35;
        }

        .cc-editor-wrapper {
          flex: 1;
          min-height: 0;
        }

        /* Terminal */
        .cc-terminal {
          flex-shrink: 0;
          background: #0A0F1A;
          border-top: 1px solid #1E293B;
          display: flex;
          flex-direction: column;
        }

        .cc-terminal-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #0D1425;
          font-size: 0.7rem;
          color: #28A745;
          font-weight: 600;
        }

        .cc-terminal-clear {
          margin-left: auto;
          background: transparent;
          border: none;
          color: #64748B;
          font-size: 0.65rem;
          cursor: pointer;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }

        .cc-terminal-clear:hover {
          color: #FF6B35;
          background: rgba(255, 107, 53, 0.1);
        }

        .cc-terminal-content {
          max-height: 150px;
          overflow-y: auto;
          padding: 0.75rem 1rem;
          background: #0A0F1A;
        }

        .cc-terminal-content pre {
          margin: 0;
          font-size: 0.7rem;
          color: #94A3B8;
          font-family: 'Consolas', monospace;
          white-space: pre-wrap;
          word-wrap: break-word;
        }

        .cc-terminal-content::-webkit-scrollbar {
          width: 4px;
        }

        .cc-terminal-content::-webkit-scrollbar-track {
          background: #1E293B;
        }

        .cc-terminal-content::-webkit-scrollbar-thumb {
          background: #FF6B35;
        }

        /* Actions */
        .cc-editor-actions {
          flex-shrink: 0;
          padding: 0.75rem 1rem;
          background: #0A0F1A;
          border-top: 1px solid #1E293B;
        }

        .cc-error-alert {
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid #DC3545;
          color: #DC3545;
          font-size: 0.75rem;
          padding: 0.5rem 0.75rem;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .cc-action-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }

        .cc-run-btn {
          background: #1E293B;
          border: 1px solid #28A745;
          color: #28A745;
          padding: 0.5rem 1.25rem;
          font-size: 0.8rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .cc-run-btn:hover:not(:disabled) {
          background: rgba(40, 167, 69, 0.15);
          transform: translateY(-1px);
        }

        .cc-submit-btn {
          background: linear-gradient(135deg, #FF6B35 0%, #FF9A5C 100%);
          border: none;
          padding: 0.5rem 1.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }

        .cc-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
        }

        .cc-run-btn:disabled, .cc-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Submitted Banner */
        .cc-submitted-banner {
          flex-shrink: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1.5rem;
          background: #0A0F1A;
          border-top: 1px solid #1E293B;
          font-size: 0.85rem;
        }

        .cc-submitted-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #28A745;
        }

        .cc-close-btn {
          background: #1E293B;
          border: none;
          color: #E2E8F0;
          padding: 0.4rem 1rem;
          font-size: 0.8rem;
          border-radius: 8px;
        }

        .cc-close-btn:hover {
          background: #FF6B35;
          color: #FFFFFF;
        }

        /* Empty State */
        .cc-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 1rem;
          color: #64748B;
          background: #0F172A;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .cc-body {
            flex-direction: column;
          }
          
          .cc-problem-panel {
            width: 100%;
            min-width: auto;
            max-height: 40%;
            border-right: none;
            border-bottom: 1px solid #1E293B;
          }
          
          .cc-header {
            flex-direction: column;
            gap: 0.75rem;
            align-items: stretch;
          }
          
          .cc-header-left {
            justify-content: space-between;
          }
          
          .cc-header-right {
            justify-content: space-between;
          }
          
          .cc-action-buttons {
            flex-direction: column;
          }
          
          .cc-run-btn, .cc-submit-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}

export default CodingChallenge