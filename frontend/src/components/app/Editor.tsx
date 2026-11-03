import MonacoEditor, { type OnMount } from '@monaco-editor/react'
import { useEffect, useRef } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import { useTabStore } from '../../stores/tabStore'
import { useSchemaStore } from '../../stores/schemaStore'
import type * as Monaco from 'monaco-editor'
import { EDITOR_DARK, EDITOR_LIGHT, type EditorPalette } from '../../brand/colors'

const hex = (c: string) => c.replace('#', '')

// Ink on paper: bold keywords, italic functions, highlighter selection.
// The SQL tokenizer emits *.sql token names, so both forms get a rule.
function monacoTheme(base: 'vs' | 'vs-dark', p: EditorPalette): Monaco.editor.IStandaloneThemeData {
  return {
    base,
    inherit: true,
    rules: [
      { token: 'keyword', foreground: hex(p.keyword), fontStyle: 'bold' },
      { token: 'predefined', foreground: hex(p.fn), fontStyle: 'italic' },
      { token: 'predefined.sql', foreground: hex(p.fn), fontStyle: 'italic' },
      { token: 'operator', foreground: hex(p.fn) },
      { token: 'operator.sql', foreground: hex(p.operator), fontStyle: 'bold' }, // JOIN, AND, IN, LIKE …
      { token: 'string', foreground: hex(p.string) },
      { token: 'string.sql', foreground: hex(p.string) },
      { token: 'number', foreground: hex(p.number) },
      { token: 'number.sql', foreground: hex(p.number) },
      { token: 'comment', foreground: hex(p.comment), fontStyle: 'italic' },
      { token: 'delimiter', foreground: hex(p.foreground) },
      { token: 'delimiter.parenthesis.sql', foreground: hex(p.foreground) },
    ],
    colors: {
      'editor.background': p.background,
      'editor.foreground': p.foreground,
      'editor.lineHighlightBackground': p.lineHighlight,
      'editorLineNumber.foreground': p.lineNumber,
      'editorLineNumber.activeForeground': p.lineNumberActive,
      'editor.selectionBackground': p.selection,
      'editor.inactiveSelectionBackground': p.selectionInactive,
      'editorCursor.foreground': p.cursor,
      // Matching-bracket colors default to blue/yellow/purple; keep them in the palette.
      'editorBracketHighlight.foreground1': p.foreground,
      'editorBracketHighlight.foreground2': p.foreground,
      'editorBracketHighlight.foreground3': p.foreground,
      'editorBracketMatch.border': p.foreground,
      'editorBracketMatch.background': p.selectionInactive,
    },
  }
}

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
    monaco.editor.defineTheme('pgquery-dark', monacoTheme('vs-dark', EDITOR_DARK))
    monaco.editor.defineTheme('pgquery-light', monacoTheme('vs', EDITOR_LIGHT))

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
        // Rainbow brackets would add colors outside the palette.
        bracketPairColorization: { enabled: false },
        fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
        fontLigatures: true,
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        renderLineHighlight: 'line',
        padding: { top: 12, bottom: 12 },
        tabSize: 2,
      }}
    />
  )
}
