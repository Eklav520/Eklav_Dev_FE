import React, { useEffect, useState, useRef } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { java } from '@codemirror/lang-java'
import { python } from '@codemirror/lang-python'
import { cpp } from '@codemirror/lang-cpp'

import { dracula } from '@uiw/codemirror-theme-dracula'
import { githubLight } from '@uiw/codemirror-theme-github'

interface CodeEditorProps {
  language: string
  code: string
  setCode: (value: string) => void
}

export default function CodeEditor({ language, code, setCode }: CodeEditorProps) {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light')
  const editorRef = useRef<any>(null)

  useEffect(() => {
    const html = document.querySelector('html')
    const observer = new MutationObserver(() => {
      const theme = html?.getAttribute('data-bs-theme')
      setThemeMode(theme === 'dark' ? 'dark' : 'light')
    })

    if (html) {
      observer.observe(html, { attributes: true, attributeFilter: ['data-bs-theme'] })
      const initialTheme = html.getAttribute('data-bs-theme')
      setThemeMode(initialTheme === 'dark' ? 'dark' : 'light')
    }

    return () => observer.disconnect()
  }, [])

  const getExtension = () => {
    switch (language) {
      case 'javascript': return [javascript()]
      case 'java': return [java()]
      case 'python': return [python()]
      case 'cpp': return [cpp()]
      default: return []
    }
  }

  // -----------------------------
  // 🚫 Disable copy/paste/cut here
  // -----------------------------
  const disableCopyPaste = (editor: any) => {
    if (!editor) return

    const dom = editor.dom

    // Disable right-click context menu
    dom.addEventListener("contextmenu", (e: any) => e.preventDefault())

    // Disable copy, paste, cut via keyboard
    dom.addEventListener("keydown", (e: any) => {
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase()
        if (["c", "v", "x"].includes(key)) {
          e.preventDefault()
        }
      }
    })

    // Disable mouse paste
    dom.addEventListener("paste", (e: any) => e.preventDefault())
    dom.addEventListener("copy", (e: any) => e.preventDefault())
    dom.addEventListener("cut", (e: any) => e.preventDefault())
  }

  const editorTheme = themeMode === 'dark' ? githubLight : dracula

  return (
    <CodeMirror
      value={code}
      height="400px"
      extensions={getExtension()}
      theme={editorTheme}
      onChange={(value) => setCode(value)}
      onCreateEditor={(editor) => {
        editorRef.current = editor
        disableCopyPaste(editor) // 🚫 Apply restrictions here
      }}
    />
  )
}
