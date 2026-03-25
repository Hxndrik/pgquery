import { useState, useEffect, useCallback } from 'react'
import { RowForm } from './RowForm'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { BulkActionsBar } from './BulkActionsBar'
import { EmptyState } from '../EmptyState'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { EditIcon, TrashIcon, PlusIcon, ChevronIcon, TableGridIcon, SearchIcon } from '../../icons'
import { executeQuery } from '../../../lib/api'
import type { SchemaColumn } from '../../../lib/api'
import { toast } from 'sonner'
import { isNumericType } from '../../../lib/typeUtils'

interface TableDataViewProps {
  connectionUrl: string
  schemaName: string
  tableName: string
  columns: SchemaColumn[]
}

const PAGE_SIZE = 100

function quote(id: string) {
  return `"${id.replace(/"/g, '""')}"`
}

function CellValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="italic text-[var(--fg-faint)]">NULL</span>
  }
  const str = String(value)
  if (str.length > 120) return <>{str.slice(0, 120)}<span className="text-[var(--fg-faint)]">…</span></>
  return <>{str}</>
}

export function TableDataView({ connectionUrl, schemaName, tableName, columns }: TableDataViewProps) {
  const [rows, setRows] = useState<unknown[][]>([])
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null)
  const [editFocusColumn, setEditFocusColumn] = useState<string | undefined>(undefined)
  
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [selectAllMode, setSelectAllMode] = useState(false)
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<'single' | 'bulk' | null>(null)
  const [singleDeleteRow, setSingleDeleteRow] = useState<Record<string, unknown> | null>(null)

  const pkCol = columns.find((c) => c.isPrimary)
  const tableRef = `${quote(schemaName)}.${quote(tableName)}`

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const offset = page * PAGE_SIZE
    
    let query: string
    let params: unknown[] = []
    
    if (searchQuery.trim()) {
      const whereClauses = columns.map((col) => `${quote(col.name)}::text ILIKE $1`).join(' OR ')
      
      query = `SELECT * FROM ${tableRef} WHERE ${whereClauses} LIMIT ${PAGE_SIZE} OFFSET ${offset}`
      params = [`%${searchQuery.trim()}%`]
    } else {
      query = `SELECT * FROM ${tableRef} LIMIT ${PAGE_SIZE} OFFSET ${offset}`
    }
    
    const result = await executeQuery(connectionUrl, query, params)
    if (result.success) {
      setRows(result.data.rows)
      setError(null)
    } else {
      setError(result.error.error)
    }
    setLoading(false)
  }, [connectionUrl, tableRef, page, searchQuery, columns])

  const loadCount = useCallback(async () => {
    let query: string
    let params: unknown[] = []
    
    if (searchQuery.trim()) {
      const whereClauses = columns.map((col) => `${quote(col.name)}::text ILIKE $1`).join(' OR ')
      
      query = `SELECT COUNT(*)::int AS count FROM ${tableRef} WHERE ${whereClauses}`
      params = [`%${searchQuery.trim()}%`]
    } else {
      query = `SELECT COUNT(*)::int AS count FROM ${tableRef}`
    }
    
    const result = await executeQuery(connectionUrl, query, params)
    if (result.success && result.data.rows[0]) {
      setTotalCount(Number(result.data.rows[0][0]))
    }
  }, [connectionUrl, tableRef, searchQuery, columns])

  useEffect(() => {
    Promise.all([loadData(), loadCount()])
  }, [loadData, loadCount])

  useEffect(() => {
    setPage(0)
    setTotalCount(null)
    setRows([])
    setSelectedRows(new Set())
    setSelectAllMode(false)
    setLastSelectedIndex(null)
    setSearchQuery('')
  }, [schemaName, tableName])

  useEffect(() => {
    if (!selectAllMode) {
      setSelectedRows(new Set())
      setLastSelectedIndex(null)
    }
  }, [page, selectAllMode])

  function rowToMap(row: unknown[]): Record<string, unknown> {
    const m: Record<string, unknown> = {}
    columns.forEach((col, i) => { m[col.name] = row[i] })
    return m
  }

  const getSelectedPKs = (): unknown[] => {
    if (!pkCol) return []
    if (selectAllMode) {
      // All except unselected
      const unselectedPKs = Array.from(selectedRows).map(idx => rows[idx]?.[columns.findIndex(c => c.isPrimary)])
      return rows.map(row => row[columns.findIndex(c => c.isPrimary)]).filter(pk => !unselectedPKs.includes(pk))
    } else {
      // Only selected
      return Array.from(selectedRows).map(idx => rows[idx]?.[columns.findIndex(c => c.isPrimary)]).filter(Boolean)
    }
  }

  const getSelectionCount = (): number => {
    if (selectAllMode && totalCount !== null) {
      return totalCount - selectedRows.size
    }
    return selectedRows.size
  }

  const toggleSelectAll = () => {
    if (selectAllMode) {
      // Deselect all
      setSelectAllMode(false)
      setSelectedRows(new Set())
    } else {
      // Select all
      setSelectAllMode(true)
      setSelectedRows(new Set()) // Empty set means "all except none"
    }
    setLastSelectedIndex(null)
  }

  const toggleRowSelection = (rowIndex: number, ctrlKey: boolean, shiftKey: boolean) => {
    if (shiftKey && lastSelectedIndex !== null) {
      // Range selection
      const start = Math.min(lastSelectedIndex, rowIndex)
      const end = Math.max(lastSelectedIndex, rowIndex)
      const newSelected = new Set(selectedRows)
      
      for (let i = start; i <= end; i++) {
        if (selectAllMode) {
          newSelected.delete(i) // In "all" mode, we remove from exclusions
        } else {
          newSelected.add(i)
        }
      }
      setSelectedRows(newSelected)
    } else if (ctrlKey) {
      // Toggle single
      const newSelected = new Set(selectedRows)
      if (newSelected.has(rowIndex)) {
        newSelected.delete(rowIndex)
      } else {
        newSelected.add(rowIndex)
      }
      setSelectedRows(newSelected)
      setLastSelectedIndex(rowIndex)
    } else {
      // Single select (replace)
      if (selectAllMode) {
        // In "all" mode, clicking without ctrl/shift deselects all and selects one
        setSelectAllMode(false)
        setSelectedRows(new Set([rowIndex]))
      } else {
        setSelectedRows(new Set([rowIndex]))
      }
      setLastSelectedIndex(rowIndex)
    }
  }

  const isRowSelected = (rowIndex: number): boolean => {
    if (selectAllMode) {
      return !selectedRows.has(rowIndex) // Inverted: selected unless in exclusion set
    }
    return selectedRows.has(rowIndex)
  }

  const clearSelection = () => {
    setSelectedRows(new Set())
    setSelectAllMode(false)
    setLastSelectedIndex(null)
  }

  const handleAdd = async (values: Record<string, string | null>) => {
    const cols = Object.keys(values).filter((k) => values[k] !== null || columns.find(c => c.name === k && !c.nullable) === undefined)
    const colList = cols.map(quote).join(', ')
    const paramList = cols.map((_, i) => `$${i + 1}`).join(', ')
    const params = cols.map((k) => values[k])
    const result = await executeQuery(
      connectionUrl,
      `INSERT INTO ${tableRef} (${colList}) VALUES (${paramList})`,
      params
    )
    if (result.success) {
      toast.success('Row added')
      setAddOpen(false)
      loadData()
      loadCount()
    } else {
      toast.error(result.error.error)
    }
  }

  const handleEdit = async (values: Record<string, string | null>) => {
    if (!pkCol) return
    
    const selectionCount = getSelectionCount()
    
    if (selectionCount > 1 || selectAllMode) {
      // Bulk edit
      const pks = getSelectedPKs()
      if (pks.length === 0) {
        toast.error('No rows selected')
        return
      }

      const entries = Object.entries(values).filter(([, v]) => v !== null && v !== '')
      if (entries.length === 0) {
        toast.error('No fields to update')
        return
      }

      const setClauses = entries.map(([k], i) => `${quote(k)} = $${i + 1}`).join(', ')
      const params = [...entries.map(([, v]) => v), ...pks]
      const placeholders = pks.map((_, i) => `$${entries.length + i + 1}`).join(', ')

      const result = await executeQuery(
        connectionUrl,
        `UPDATE ${tableRef} SET ${setClauses} WHERE ${quote(pkCol.name)} IN (${placeholders})`,
        params
      )
      
      if (result.success) {
        toast.success(`Updated ${pks.length} rows`)
        setEditRow(null)
        clearSelection()
        loadData()
      } else {
        toast.error(result.error.error)
      }
    } else {
      // Single edit
      if (!editRow) return
      const pkVal = editRow[pkCol.name]
      const entries = Object.entries(values)
      const setClauses = entries.map(([k], i) => `${quote(k)} = $${i + 1}`).join(', ')
      const params = [...entries.map(([, v]) => v), pkVal]
      const result = await executeQuery(
        connectionUrl,
        `UPDATE ${tableRef} SET ${setClauses} WHERE ${quote(pkCol.name)} = $${entries.length + 1}`,
        params
      )
      if (result.success) {
        toast.success('Row updated')
        setEditRow(null)
        setEditFocusColumn(undefined)
        loadData()
      } else {
        toast.error(result.error.error)
      }
    }
  }

  const handleDelete = async () => {
    if (!pkCol) {
      toast.error('Cannot delete: no primary key found')
      return
    }

    if (deleteTarget === 'single' && singleDeleteRow) {
      const pkVal = singleDeleteRow[pkCol.name]
      const result = await executeQuery(
        connectionUrl,
        `DELETE FROM ${tableRef} WHERE ${quote(pkCol.name)} = $1`,
        [pkVal]
      )
      if (result.success) {
        toast.success('Row deleted')
        setDeleteModalOpen(false)
        setSingleDeleteRow(null)
        setDeleteTarget(null)
        loadData()
        loadCount()
      } else {
        toast.error(result.error.error)
      }
    } else if (deleteTarget === 'bulk') {
      const pks = getSelectedPKs()
      if (pks.length === 0) {
        toast.error('No rows selected')
        return
      }

      const placeholders = pks.map((_, i) => `$${i + 1}`).join(', ')
      const result = await executeQuery(
        connectionUrl,
        `DELETE FROM ${tableRef} WHERE ${quote(pkCol.name)} IN (${placeholders})`,
        pks
      )
      
      if (result.success) {
        toast.success(`Deleted ${pks.length} rows`)
        setDeleteModalOpen(false)
        setDeleteTarget(null)
        clearSelection()
        loadData()
        loadCount()
      } else {
        toast.error(result.error.error)
      }
    }
  }

  const handleBulkEdit = () => {
    if (getSelectionCount() === 0) {
      toast.error('No rows selected')
      return
    }
    // Open edit modal with first selected row's data as initial values
    const firstSelectedIdx = selectAllMode ? 0 : Array.from(selectedRows)[0]
    const firstRow = rows[firstSelectedIdx]
    if (firstRow) {
      setEditRow(rowToMap(firstRow))
      setEditFocusColumn(undefined)
    }
  }

  const handleBulkDelete = () => {
    if (getSelectionCount() === 0) {
      toast.error('No rows selected')
      return
    }
    setDeleteTarget('bulk')
    setDeleteModalOpen(true)
  }

  const handleCellDoubleClick = (rowIndex: number, columnName: string) => {
    const row = rows[rowIndex]
    if (row) {
      setEditRow(rowToMap(row))
      setEditFocusColumn(columnName)
    }
  }

  const totalPages = totalCount !== null ? Math.ceil(totalCount / PAGE_SIZE) : null
  const selectionCount = getSelectionCount()
  const hasSelection = selectionCount > 0

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2.5 border-b border-[var(--border)] bg-[var(--bg-raised)] flex items-center gap-2 shrink-0">
        <span className="text-[var(--fg-subtle)] opacity-70 shrink-0">
          <TableGridIcon size={14} />
        </span>
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <span className="text-[11px] font-mono text-[var(--fg-muted)] truncate">{schemaName}</span>
          <span className="text-[11px] text-[var(--fg-faint)] shrink-0">/</span>
          <span className="text-[11px] font-mono font-semibold text-[var(--fg)] truncate">{tableName}</span>
        </div>
        {totalCount !== null && (
          <span className="text-[10px] text-[var(--fg-faint)] shrink-0">
            {totalCount.toLocaleString()}
          </span>
        )}
      </div>

      <div className="px-2.5 py-2 border-b border-[var(--border)] bg-[var(--bg-raised)] shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search all columns…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(0) // Reset to first page on search
              }}
              icon={<SearchIcon size={13} />}
              className="text-[12px] py-1.5"
            />
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5 shrink-0">
            <PlusIcon size={12} />
            Add
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-[var(--error-bg)] border-b border-[var(--border)] text-[12px] text-[var(--error)] font-mono">
          {error}
        </div>
      )}

      {!error && rows.length === 0 && !loading && (
        <EmptyState title="No rows" description="This table is empty" hint="" />
      )}

      {!error && rows.length > 0 && (
        <div className="flex-1 overflow-auto relative">
          {loading && (
            <div className="absolute top-2 right-2 z-20 px-2 py-1 bg-[var(--bg-card)] border border-[var(--border)] rounded text-[10px] text-[var(--fg-subtle)] shadow-sm">
              Loading…
            </div>
          )}
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="bg-[var(--bg-raised)] sticky top-0 z-10">
                <th className="px-2 py-2 border-b border-r border-[var(--border)] w-10 shrink-0">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectAllMode}
                      onChange={toggleSelectAll}
                      className="accent-[var(--accent)] w-3.5 h-3.5 cursor-pointer"
                      title="Select all rows"
                    />
                  </div>
                </th>
                {columns.map((col) => (
                  <th
                    key={col.name}
                    className={`
                      px-3 py-2 border-b border-r border-[var(--border)] whitespace-nowrap
                      text-[10px] font-semibold uppercase tracking-[0.3px] text-[var(--fg-subtle)] text-left
                      ${isNumericType(col.type) ? 'text-right' : ''}
                    `}
                  >
                    <div className={`flex items-center gap-1.5 ${isNumericType(col.type) ? 'justify-end' : ''}`}>
                      {col.isPrimary && <span className="text-[9px] font-bold text-[var(--warning)]">PK</span>}
                      <span>{col.name}</span>
                      <span className="text-[var(--fg-faint)] font-mono font-normal normal-case tracking-normal text-[9px]">{col.type}</span>
                    </div>
                  </th>
                ))}
                {/* Action column */}
                <th className="px-2 py-2 border-b border-[var(--border)] w-20 shrink-0 text-[10px] font-semibold uppercase tracking-[0.3px] text-[var(--fg-subtle)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => {
                const rowMap = rowToMap(row)
                const selected = isRowSelected(ri)
                return (
                  <tr
                    key={ri}
                    className={`border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors group ${selected ? 'bg-[var(--accent-bg)]' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="px-2 py-1.5 border-r border-[var(--border)] w-10">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => {}}
                          onClick={(e) => {
                            if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                              e.stopPropagation()
                            }
                            toggleRowSelection(ri, e.ctrlKey || e.metaKey, e.shiftKey)
                          }}
                          className="accent-[var(--accent)] w-3.5 h-3.5 cursor-pointer"
                        />
                      </div>
                    </td>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`
                          px-3 py-2 border-r border-[var(--border)] whitespace-nowrap max-w-[300px] truncate cursor-pointer
                          ${isNumericType(columns[ci]?.type ?? '') ? 'text-right font-mono' : ''}
                          ${cell === null ? 'text-[var(--fg-faint)]' : 'text-[var(--fg)]'}
                        `}
                        onDoubleClick={() => handleCellDoubleClick(ri, columns[ci]?.name ?? '')}
                      >
                        <CellValue value={cell} />
                      </td>
                    ))}
                    {/* Actions */}
                    <td className="px-2 py-1.5 border-[var(--border)] w-20">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditRow(rowMap)
                            setEditFocusColumn(undefined)
                          }}
                          className="p-1 text-[var(--fg-subtle)] hover:text-[var(--accent)] rounded hover:bg-[var(--accent-bg)] transition-colors"
                          title="Edit row"
                        >
                          <EditIcon size={13} />
                        </button>
                        <button
                          onClick={() => {
                            setSingleDeleteRow(rowMap)
                            setDeleteTarget('single')
                            setDeleteModalOpen(true)
                          }}
                          className="p-1 text-[var(--fg-subtle)] hover:text-[var(--error)] rounded hover:bg-[var(--error-bg)] transition-colors"
                          title="Delete row"
                        >
                          <TrashIcon size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination or Bulk Actions Bar */}
      {hasSelection ? (
        <BulkActionsBar
          selectedCount={selectionCount}
          isAllSelected={selectAllMode}
          totalCount={totalCount}
          onEdit={handleBulkEdit}
          onDelete={handleBulkDelete}
          onClear={clearSelection}
        />
      ) : (
        totalPages !== null && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-raised)] border-t border-[var(--border)] shrink-0">
            <span className="text-[11px] text-[var(--fg-subtle)]">
              Page {page + 1} of {totalPages} · {rows.length} shown
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 0}
                className="gap-1"
              >
                <ChevronIcon size={12} direction="left" />
                Prev
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages - 1}
                className="gap-1"
              >
                Next
                <ChevronIcon size={12} direction="right" />
              </Button>
            </div>
          </div>
        )
      )}

      {/* Add row modal */}
      <RowForm
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
        columns={columns}
        mode="add"
      />

      {/* Edit row modal */}
      {editRow && (
        <RowForm
          open={true}
          onClose={() => {
            setEditRow(null)
            setEditFocusColumn(undefined)
          }}
          onSubmit={handleEdit}
          columns={columns}
          initial={editRow}
          mode="edit"
          focusColumn={editFocusColumn}
          bulkCount={selectionCount > 1 ? selectionCount : undefined}
          isAllSelected={selectAllMode}
          totalCount={totalCount}
        />
      )}

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false)
          setDeleteTarget(null)
          setSingleDeleteRow(null)
        }}
        onConfirm={handleDelete}
        count={deleteTarget === 'bulk' ? selectionCount : 1}
        isAll={selectAllMode && deleteTarget === 'bulk'}
        totalCount={totalCount ?? undefined}
      />
    </div>
  )
}
