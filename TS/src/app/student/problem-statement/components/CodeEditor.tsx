import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { java } from '@codemirror/lang-java'
import { cpp } from '@codemirror/lang-cpp'
import { python } from '@codemirror/lang-python'
import { go } from '@codemirror/lang-go'
import { php } from '@codemirror/lang-php'
import { rust } from '@codemirror/lang-rust'
import { Extension } from '@codemirror/state'

type Language =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'cpp'
  | 'c'
  | 'csharp'
  | 'php'
  | 'ruby'
  | 'go'
  | 'rust'

type Props = {
  language: Language
  value: string
  onChange: (value: string) => void
}

const languageExtensions: Record<Language, Extension | null> = {
  javascript: javascript(),
  typescript: javascript({ typescript: true }),
  python: python(),
  java: java(),
  cpp: cpp(),
  c: cpp(),
  csharp: null,
  php: php(),
  ruby: null,
  go: go(),
  rust: rust(),
}

const CodeEditor = ({ language, value, onChange }: Props) => {
  const extension = languageExtensions[language]

  return (
    <CodeMirror
      value={value}
      extensions={[
        ...(extension ? [extension] : []),
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