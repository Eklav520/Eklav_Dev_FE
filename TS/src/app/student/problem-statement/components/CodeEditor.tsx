import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { python } from '@codemirror/lang-python'
import { rust } from '@codemirror/lang-rust'
import { go } from '@codemirror/lang-go'
import { php } from '@codemirror/lang-php'
import { sql } from '@codemirror/lang-sql'
import { Extension } from '@codemirror/state'

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

  // fallback
  csharp: null,
  kotlin: null,
  swift: null,
  ruby: null,
  dart: null,
  scala: null,
}

const CodeEditor = ({ language, value, onChange }: Props) => {
  const extension = languageExtensions[language]

  return (
    <CodeMirror
      value={value}
      extensions={extension ? [extension] : []}
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
        backgroundColor: '#fff', // ✅ force white
        border: '1px solid #ddd',
        borderRadius: '6px',
      }}
    />
  )
}

export default CodeEditor
