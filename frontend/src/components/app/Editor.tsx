import MonacoEditor, { type OnMount } from '@monaco-editor/react'
import { useSettingsStore } from '../../stores/settingsStore'
import { useTabStore } from '../../stores/tabStore'

interface EditorProps {
  tabId: string
  onRun: () => void
}

export function Editor({ tabId, onRun }: EditorProps) {
  const { theme } = useSettingsStore()
  const { tabs, updateSql } = useTabStore()
  const tab = tabs.find((t) => t.id === tabId)

  const handleMount: OnMount = (editor, monaco) => {
    // Register dark theme
    monaco.editor.defineTheme('pgquery-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'a78bfa', fontStyle: 'bold' },
        { token: 'string', foreground: '4ade80' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'comment', foreground: '6b6b78', fontStyle: 'italic' },
      ],
      colors: {
        'editor.background': '#0c0e14',
        'editor.foreground': '#f0f0f2',
        'editor.lineHighlightBackground': '#13151e',
        'editorLineNumber.foreground': '#44445a',
        'editorLineNumber.activeForeground': '#b3b3bb',
        'editor.selectionBackground': '#a78bfa33',
        'editorCursor.foreground': '#a78bfa',
        'editor.inactiveSelectionBackground': '#a78bfa1a',
      },
    })

    // Register light theme
    monaco.editor.defineTheme('pgquery-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '7c5cbf', fontStyle: 'bold' },
        { token: 'string', foreground: '16a34a' },
        { token: 'number', foreground: 'd97706' },
        { token: 'comment', foreground: '9a9a96', fontStyle: 'italic' },
      ],
      colors: {
        'editor.background': '#f5f5f3',
        'editor.foreground': '#111110',
        'editor.lineHighlightBackground': '#eeeee9',
        'editorLineNumber.foreground': '#c4c4bf',
        'editorLineNumber.activeForeground': '#6b6b68',
      },
    })

    monaco.editor.setTheme(theme === 'dark' ? 'pgquery-dark' : 'pgquery-light')

    // Ctrl+Enter to run
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, onRun)
  }

  return (
    <MonacoEditor
      height="100%"
      language="sql"
      theme={theme === 'dark' ? 'pgquery-dark' : 'pgquery-light'}
      value={tab?.sql ?? ''}
      onChange={(val) => updateSql(tabId, val ?? '')}
      onMount={handleMount}
      options={{
        minimap: { enabled: false },
        wordWrap: 'on',
        lineNumbers: 'on',
        folding: true,
        fontSize: 13,
        fontFamily: '"JetBrains Mono", monospace',
        fontLigatures: true,
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        renderLineHighlight: 'line',
        bracketPairColorization: { enabled: true },
        padding: { top: 12, bottom: 12 },
        tabSize: 2,
      }}
    />
  )
}
