import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { java } from '@codemirror/lang-java';

interface CodeEditorProps {
  language: string; // e.g., 'javascript', 'java'
  code: string;
  setCode: (value: string) => void;
}

export default function CodeEditor({ language, code, setCode }: CodeEditorProps) {
  // Decide language extension dynamically
  const extensions = language === 'java' ? [java()] : [javascript()];

  return (
    <CodeMirror
      value={code}
      height="400px"
      extensions={extensions}
      onChange={(value) => setCode(value)}
      theme="dark"
    />
  );
}
