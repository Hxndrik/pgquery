import MonacoEditor, { type OnMount } from '@monaco-editor/react'
import { useEffect, useRef } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import { useTabStore } from '../../stores/tabStore'
import { useSchemaStore } from '../../stores/schemaStore'
import type * as Monaco from 'monaco-editor'

interface EditorProps {
  tabId: string
  onRun: () => void
}

export function Editor({ tabId, onRun }: EditorProps) {
  const { theme } = useSettingsStore()
  const { tabs, updateSql } = useTabStore()
  const tab = tabs.find((t) => t.id === tabId)
  const completionProviderRef = useRef<{ dispose: () => void } | null>(null)

  useEffect(() => {
    return () => {
      completionProviderRef.current?.dispose()
    }
  }, [])

  const handleMount: OnMount = (editor, monaco) => {
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

    // Use getState() inside the closure so completions always see the latest schema without stale closure issues
    const getSchema = () => useSchemaStore.getState().schema

    const completionProvider = monaco.languages.registerCompletionItemProvider('sql', {
      provideCompletionItems: (model: Monaco.editor.ITextModel, position: Monaco.Position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        })

        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn,
        }

        const suggestions: Monaco.languages.CompletionItem[] = []
        const currentSchema = getSchema()

        if (!currentSchema?.schemas) {
          return { suggestions }
        }

        // Check context for table/column suggestions
        const fromMatch = textUntilPosition.match(/\bFROM\s+(\w+\.)?$/i)
        const joinMatch = textUntilPosition.match(/\bJOIN\s+(\w+\.)?$/i)
        const schemaPrefix = textUntilPosition.match(/\b(\w+)\.$/i)
        const selectMatch = textUntilPosition.match(/\bSELECT\s+(?:.*,\s*)?$/i)
        const whereMatch = textUntilPosition.match(/\bWHERE\s+(?:.*(?:AND|OR)\s+)?$/i)

        // Schema completions
        if (!schemaPrefix && (fromMatch || joinMatch)) {
          currentSchema.schemas.forEach((s) => {
            suggestions.push({
              label: s.name,
              kind: monaco.languages.CompletionItemKind.Module,
              insertText: s.name,
              range,
              detail: 'Schema',
              documentation: `${s.tables.length} tables`,
            })
          })
        }

        // Table completions
        if (schemaPrefix) {
          const schemaName = schemaPrefix[1]
          const schemaData = currentSchema.schemas.find((s) => s.name === schemaName)
          if (schemaData) {
            schemaData.tables.forEach((t) => {
              suggestions.push({
                label: t.name,
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: t.name,
                range,
                detail: `Table in ${schemaName}`,
                documentation: `${t.columns.length} columns`,
              })
            })
          }
        } else if (fromMatch || joinMatch) {
          currentSchema.schemas.forEach((s) => {
            s.tables.forEach((t) => {
              suggestions.push({
                label: `${s.name}.${t.name}`,
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: `${s.name}.${t.name}`,
                range,
                detail: 'Table',
                documentation: `${t.columns.length} columns`,
              })
            })
          })
        }

        // Column completions
        if (selectMatch || whereMatch || (!fromMatch && !joinMatch && !schemaPrefix)) {
          currentSchema.schemas.forEach((s) => {
            s.tables.forEach((t) => {
              t.columns.forEach((c) => {
                suggestions.push({
                  label: c.name,
                  kind: monaco.languages.CompletionItemKind.Field,
                  insertText: c.name,
                  range,
                  detail: c.type,
                  documentation: `${s.name}.${t.name}.${c.name}${c.isPrimary ? ' (PK)' : ''}${c.isUnique ? ' (Unique)' : ''}`,
                })
              })
            })
          })
        }

        return { suggestions }
      },
      triggerCharacters: ['.', ' '],
    })
    completionProviderRef.current = completionProvider

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
