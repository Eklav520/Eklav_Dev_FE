import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { python } from '@codemirror/lang-python'
import { rust } from '@codemirror/lang-rust'
import { go } from '@codemirror/lang-go'
import { php } from '@codemirror/lang-php'
import { Extension } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'

type Language =
  | 'cpp'
  | 'java'
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'python3'
  | 'c'
  | 'csharp'
  | 'go'
  | 'kotlin'
  | 'swift'
  | 'rust'
  | 'ruby'
  | 'php'
  | 'dart'
  | 'scala'

type Props = {
  language: Language
  value: string
  onChange: (value: string) => void
}

const languageExtensions: Record<Language, Extension | null> = {
  cpp: cpp(),
  c: cpp(),
  java: java(),
  javascript: javascript(),
  typescript: javascript({ typescript: true }),
  python: python(),
  python3: python(),
  go: go(),
  rust: rust(),
  php: php(),

  csharp: null,
  kotlin: null,
  swift: null,
  ruby: null,
  dart: null,
  scala: null,
}

const CodeEditor = ({ language, value, onChange }: Props) => {
  const extension = languageExtensions[language]

  /* 🚫 Disable copy / paste / cut / select all */
  const blockShortcuts = keymap.of([
    { key: 'Mod-c', run: () => true },
    { key: 'Mod-v', run: () => true },
    { key: 'Mod-x', run: () => true },
    { key: 'Mod-a', run: () => true },
  ])

  /* 🚫 Disable right-click + clipboard events */
  const blockDomEvents = EditorView.domEventHandlers({
    paste: (event) => {
      event.preventDefault()
      return true
    },
    copy: (event) => {
      event.preventDefault()
      return true
    },
    cut: (event) => {
      event.preventDefault()
      return true
    },
    contextmenu: (event) => {
      event.preventDefault()
      return true
    },
  })

  return (
    <CodeMirror
      value={value}
      extensions={[
        ...(extension ? [extension] : []),
        blockShortcuts,
        blockDomEvents,
      ]}
      onChange={onChange}
      height="100%"
      basicSetup={{
        lineNumbers: true,
        highlightActiveLine: true,
        highlightActiveLineGutter: true,
        bracketMatching: true,
        closeBrackets: true,
      }}
      style={{
        height: '100%',
        backgroundColor: '#fff',
        border: '1px solid #ddd',
        borderRadius: '6px',
      }}
    />
  )
}

export default CodeEditor