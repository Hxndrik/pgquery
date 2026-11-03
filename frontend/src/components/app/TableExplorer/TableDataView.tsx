import { useState, useEffect, useCallback } from 'react'
import { RowForm } from './RowForm'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { DropTableModal } from './DropTableModal'
import { Pagination } from './Pagination'
import { BulkActionsBar } from './BulkActionsBar'
import { EmptyState } from '../EmptyState'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { EditIcon, TrashIcon, PlusIcon, TableGridIcon, SearchIcon } from '../../icons'
import { executeQuery } from '../../../lib/api'
import type { SchemaColumn } from '../../../lib/api'
import { useSchemaStore } from '../../../stores/schemaStore'
import { toast } from 'sonner'
import { friendlyError } from '../../../lib/errors'
import { isNumericType } from '../../../lib/typeUtils'
import { CellValue } from '../ResultsTable'

interface TableDataViewProps {
  connectionUrl: string
  schemaName: string
  tableName: string
  columns: SchemaColumn[]
  onTableDropped?: () => void
}

const DEFAULT_PAGE_SIZE = 100
// Cells show 120 characters; longer values are cut by the proxy and loaded in
// full when the row is opened for editing.
const CELL_LIMIT = 4096
const PAGE_SIZE_STORAGE_KEY = 'pgquery-table-page-size'

type SortDir = 'asc' | 'desc' | null

function quote(id: string) {
  return `"${id.replace(/"/g, '""')}"`
}

function SortIndicator({ dir }: { dir: SortDir }) {
  return (
    <span className="inline-flex flex-col leading-none ml-0.5 -my-0.5" aria-hidden="true">
      <svg
        width="8"
        height="5"
        viewBox="0 0 8 5"
        className={dir === 'asc' ? 'text-[var(--accent-text)]' : 'text-[var(--fg-faint)] opacity-50'}
      >
        <path d="M1 4 L4 1 L7 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
      <svg
        width="8"
        height="5"
        viewBox="0 0 8 5"
        className={dir === 'desc' ? 'text-[var(--accent-text)]' : 'text-[var(--fg-faint)] opacity-50'}
        style={{ marginTop: '1px' }}
      >
        <path d="M1 1 L4 4 L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </span>
  )
}

function buildWhereClause(columns: SchemaColumn[], searchQuery: string, param = 1): { where: string; params: unknown[] } | null {
  const trimmed = searchQuery.trim()
  if (!trimmed) return null
  const where = columns.map((col) => `${quote(col.name)}::text ILIKE $${param}`).join(' OR ')
  return { where: `(${where})`, params: [`%${trimmed}%`] }
}

export function TableDataView({ connectionUrl, schemaName, tableName, columns, onTableDropped }: TableDataViewProps) {
  // Values as Postgres prints them (text mode), so keys and edits stay exact.
  const [rows, setRows] = useState<unknown[][]>([])
  const [cutSizes, setCutSizes] = useState<Map<string, number>>(new Map())
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState<number>(() => {
    const stored = Number(localStorage.getItem(PAGE_SIZE_STORAGE_KEY))
    return Number.isFinite(stored) && stored > 0 ? stored : DEFAULT_PAGE_SIZE
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null)
  const [editFocusColumn, setEditFocusColumn] = useState<string | undefined>(undefined)

  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [selectAllMode, setSelectAllMode] = useState(false)
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<'single' | 'bulk' | null>(null)
  const [singleDeleteRow, setSingleDeleteRow] = useState<Record<string, unknown> | null>(null)

  const [dropOpen, setDropOpen] = useState(false)
  const [dropping, setDropping] = useState(false)

  const loadSchema = useSchemaStore((s) => s.loadSchema)

  const pkCols = columns.filter((c) => c.isPrimary)
  const pkIdxs = pkCols.map((c) => columns.indexOf(c))
  const hasPk = pkCols.length > 0
  const tableRef = `${quote(schemaName)}.${quote(tableName)}`

  const rowPk = (row: unknown[]) => pkIdxs.map((i) => row[i])
  const mapPk = (m: Record<string, unknown>) => pkCols.map((c) => m[c.name])

  /** `pk IN (…)` for these primary keys (one value per key column), params numbered from `start`. */
  const pkIn = (keys: unknown[][], start: number): { sql: string; params: unknown[] } => {
    const single = pkCols.length === 1
    const target = single ? quote(pkCols[0].name) : `(${pkCols.map((c) => quote(c.name)).join(', ')})`
    let n = start
    const tuples = keys.map((k) => {
      const ph = k.map(() => `$${n++}`)
      return single ? ph[0] : `(${ph.join(', ')})`
    })
    return { sql: `${target} IN (${tuples.join(', ')})`, params: keys.flat() }
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(0)
    localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(size))
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    const offset = page * pageSize
    const clause = buildWhereClause(columns, searchQuery)
    const where = clause ? ` WHERE ${clause.where}` : ''
    // Without an explicit sort, order by the primary key: Postgres returns
    // rows in no fixed order, and an edited row would otherwise jump to the end.
    const pkCols = columns.filter((c) => c.isPrimary).map((c) => quote(c.name))
    const orderBy =
      sortColumn && sortDir && columns.some((c) => c.name === sortColumn)
        ? ` ORDER BY ${quote(sortColumn)} ${sortDir === 'asc' ? 'ASC' : 'DESC'} NULLS LAST`
        : pkCols.length > 0
          ? ` ORDER BY ${pkCols.join(', ')}`
          : ''
    const query = `SELECT * FROM ${tableRef}${where}${orderBy} LIMIT ${pageSize} OFFSET ${offset}`
    const result = await executeQuery(connectionUrl, query, clause?.params ?? [], { text: true, cellLimit: CELL_LIMIT })
    if (result.success) {
      setRows(result.data.rows)
      setCutSizes(new Map((result.data.cut ?? []).map((c) => [`${c.row}:${c.col}`, c.size])))
      setError(null)
    } else {
      setError(result.error.error)
    }
    setLoading(false)
  }, [connectionUrl, tableRef, page, pageSize, searchQuery, columns, sortColumn, sortDir])

  const loadCount = useCallback(async () => {
    const clause = buildWhereClause(columns, searchQuery)
    const query = clause
      ? `SELECT COUNT(*)::int AS count FROM ${tableRef} WHERE ${clause.where}`
      : `SELECT COUNT(*)::int AS count FROM ${tableRef}`
    const result = await executeQuery(connectionUrl, query, clause?.params ?? [])
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
    setSortColumn(null)
    setSortDir(null)
  }, [schemaName, tableName])

  const handleSort = (colName: string) => {
    // 3-way cycle: off → desc → asc → off
    if (sortColumn !== colName) {
      setSortColumn(colName)
      setSortDir('desc')
    } else if (sortDir === 'desc') {
      setSortDir('asc')
    } else {
      setSortColumn(null)
      setSortDir(null)
    }
    setPage(0)
  }

  // Selection holds row indexes on this page (in select-all mode: the rows
  // unticked), so it can't carry over to another page or search.
  useEffect(() => {
    setSelectedRows(new Set())
    setLastSelectedIndex(null)
  }, [page, searchQuery])

  function rowToMap(row: unknown[]): Record<string, unknown> {
    const m: Record<string, unknown> = {}
    columns.forEach((col, i) => { m[col.name] = row[i] })
    return m
  }

  /**
   * WHERE for the selection: the ticked rows, or in select-all mode every row
   * matching the search (on all pages) except the unticked ones.
   */
  const selectionWhere = (start: number): { sql: string; params: unknown[] } | null => {
    const picked = Array.from(selectedRows).map((i) => rows[i]).filter(Boolean).map(rowPk)
    if (!selectAllMode) return picked.length > 0 ? pkIn(picked, start) : null
    const parts: string[] = []
    const params: unknown[] = []
    const clause = buildWhereClause(columns, searchQuery, start)
    if (clause) {
      parts.push(clause.where)
      params.push(...clause.params)
      start += clause.params.length
    }
    if (picked.length > 0) {
      const excluded = pkIn(picked, start)
      parts.push(`NOT (${excluded.sql})`)
      params.push(...excluded.params)
    }
    return { sql: parts.length > 0 ? parts.join(' AND ') : 'TRUE', params }
  }

  /** The row as a column → value map; loads it in full first if a value was cut. */
  const fullRow = async (rowIndex: number): Promise<Record<string, unknown> | null> => {
    const row = rows[rowIndex]
    if (!row) return null
    const isCut = columns.some((_, ci) => cutSizes.has(`${rowIndex}:${ci}`))
    if (!isCut || !hasPk) return rowToMap(row)
    const where = pkIn([rowPk(row)], 1)
    const result = await executeQuery(connectionUrl, `SELECT * FROM ${tableRef} WHERE ${where.sql}`, where.params, { text: true })
    if (!result.success || !result.data.rows[0]) {
      toast.error(result.success ? 'The row no longer exists' : friendlyError(result.error))
      return null
    }
    return rowToMap(result.data.rows[0])
  }

  const openEdit = async (rowIndex: number, focusColumn?: string) => {
    const values = await fullRow(rowIndex)
    if (!values) return
    setEditRow(values)
    setEditFocusColumn(focusColumn)
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
      // Toggle single without clearing others
      const newSelected = new Set(selectedRows)
      if (newSelected.has(rowIndex)) newSelected.delete(rowIndex)
      else newSelected.add(rowIndex)
      setSelectedRows(newSelected)
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

  // Values are Postgres text (or null): sent as text parameters, Postgres
  // parses them with each column type's own input function.
  const handleAdd = async (values: Record<string, string | null>) => {
    const cols = Object.keys(values) // only the fields the user filled in; the rest get defaults
    const colList = cols.map(quote).join(', ')
    const paramList = cols.map((_, i) => `$${i + 1}`).join(', ')
    const params = cols.map((k) => values[k])
    const result = await executeQuery(
      connectionUrl,
      cols.length > 0
        ? `INSERT INTO ${tableRef} (${colList}) VALUES (${paramList})`
        : `INSERT INTO ${tableRef} DEFAULT VALUES`,
      params
    )
    if (result.success) {
      toast.success('Row added')
      setAddOpen(false)
      loadData()
      loadCount()
    } else {
      toast.error(friendlyError(result.error))
    }
  }

  const handleEdit = async (values: Record<string, string | null>) => {
    if (!hasPk || !editRow) {
      toast.error('Cannot edit: this table has no primary key')
      return
    }
    // Only changed fields arrive, so untouched values are never rewritten.
    const entries = Object.entries(values)
    if (entries.length === 0) {
      setEditRow(null)
      return
    }
    const selectionCount = getSelectionCount()
    const bulk = selectionCount > 1 || selectAllMode
    const setClauses = entries.map(([k], i) => `${quote(k)} = $${i + 1}`).join(', ')
    const where = bulk ? selectionWhere(entries.length + 1) : pkIn([mapPk(editRow)], entries.length + 1)
    if (!where) {
      toast.error('No rows selected')
      return
    }
    const result = await executeQuery(
      connectionUrl,
      `UPDATE ${tableRef} SET ${setClauses} WHERE ${where.sql}`,
      [...entries.map(([, v]) => v), ...where.params]
    )
    if (result.success) {
      toast.success(bulk ? `Updated ${selectionCount.toLocaleString()} rows` : 'Row updated')
      setEditRow(null)
      setEditFocusColumn(undefined)
      if (bulk) clearSelection()
      loadData()
    } else {
      toast.error(friendlyError(result.error))
    }
  }

  const handleDelete = async () => {
    if (!hasPk) {
      toast.error('Cannot delete: no primary key found')
      return
    }

    const bulk = deleteTarget === 'bulk'
    const where = bulk ? selectionWhere(1) : singleDeleteRow ? pkIn([mapPk(singleDeleteRow)], 1) : null
    if (!where) {
      toast.error('No rows selected')
      return
    }
    const count = getSelectionCount()
    const result = await executeQuery(connectionUrl, `DELETE FROM ${tableRef} WHERE ${where.sql}`, where.params)
    if (result.success) {
      toast.success(bulk ? `Deleted ${count.toLocaleString()} rows` : 'Row deleted')
      setDeleteModalOpen(false)
      setDeleteTarget(null)
      setSingleDeleteRow(null)
      if (bulk) clearSelection()
      loadData()
      loadCount()
    } else {
      toast.error(friendlyError(result.error))
    }
  }

  const handleBulkEdit = () => {
    if (getSelectionCount() === 0) {
      toast.error('No rows selected')
      return
    }
    // Open edit modal with first selected row's data as initial values
    const firstSelectedIdx = selectAllMode ? rows.findIndex((_, i) => !selectedRows.has(i)) : Array.from(selectedRows)[0]
    openEdit(firstSelectedIdx === -1 ? 0 : firstSelectedIdx)
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
    openEdit(rowIndex, columnName)
  }

  const handleDropTable = async (cascade: boolean) => {
    setDropping(true)
    const sql = `DROP TABLE ${tableRef}${cascade ? ' CASCADE' : ''}`
    const result = await executeQuery(connectionUrl, sql)
    setDropping(false)
    if (result.success) {
      toast.success(`Dropped ${schemaName}.${tableName}`)
      setDropOpen(false)
      loadSchema(connectionUrl)
      onTableDropped?.()
    } else {
      toast.error(friendlyError(result.error))
    }
  }

  const selectionCount = getSelectionCount()
  const hasSelection = selectionCount > 0
  // "All N rows" only while nothing is unticked; otherwise the labels give the real count.
  const allSelected = selectAllMode && selectedRows.size === 0

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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDropOpen(true)}
            className="gap-1.5 shrink-0 text-[var(--fg-subtle)] hover:text-[var(--error)] hover:bg-[var(--error-bg)]"
            title={`Drop table ${schemaName}.${tableName}`}
          >
            <TrashIcon size={12} />
            Drop
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
        <div className="flex-1 overflow-auto relative bg-[var(--bg)]">
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
                {columns.map((col) => {
                  const active = sortColumn === col.name
                  const dir = active ? sortDir : null
                  const ariaSort = active
                    ? sortDir === 'asc' ? 'ascending' : sortDir === 'desc' ? 'descending' : 'none'
                    : 'none'
                  return (
                    <th
                      key={col.name}
                      aria-sort={ariaSort}
                      onClick={() => handleSort(col.name)}
                      title={
                        active
                          ? sortDir === 'desc'
                            ? 'Sorted descending — click for ascending'
                            : 'Sorted ascending — click to clear'
                          : 'Click to sort descending'
                      }
                      className={`
                        px-3 py-2 border-b border-r border-[var(--border)] whitespace-nowrap
                        text-[10px] font-semibold uppercase tracking-[0.3px] text-left
                        ${active ? 'text-[var(--fg)] bg-[var(--bg-hover)]' : 'text-[var(--fg-subtle)]'}
                        cursor-pointer hover:bg-[var(--bg-hover)] hover:text-[var(--fg)] transition-colors select-none
                        ${isNumericType(col.type) ? 'text-right' : ''}
                      `}
                    >
                      <div className={`flex items-center gap-1.5 ${isNumericType(col.type) ? 'justify-end' : ''}`}>
                        {col.isPrimary && <span className="text-[9px] font-bold px-1 rounded-sm bg-[var(--accent)] text-[var(--accent-fg)]">PK</span>}
                        <span>{col.name}</span>
                        <span className="text-[var(--fg-faint)] font-mono font-normal normal-case tracking-normal text-[9px]">{col.type}</span>
                        <SortIndicator dir={dir} />
                      </div>
                    </th>
                  )
                })}
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
                        <CellValue value={cell} maxLength={120} cutSize={cutSizes.get(`${ri}:${ci}`)} />
                      </td>
                    ))}
                    {/* Actions */}
                    <td className="px-2 py-1.5 border-[var(--border)] w-20">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(ri)}
                          className="p-1 text-[var(--fg-subtle)] hover:text-[var(--accent-text)] rounded hover:bg-[var(--accent-bg)] transition-colors"
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
          isAllSelected={allSelected}
          totalCount={totalCount}
          onEdit={handleBulkEdit}
          onDelete={handleBulkDelete}
          onClear={clearSelection}
        />
      ) : (
        (totalCount ?? 0) > 0 && (
          <Pagination
            page={page}
            pageSize={pageSize}
            totalCount={totalCount}
            rowsShown={rows.length}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
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
          isAllSelected={allSelected}
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
        isAll={allSelected && deleteTarget === 'bulk'}
        totalCount={totalCount ?? undefined}
      />

      {/* Drop table modal */}
      <DropTableModal
        open={dropOpen}
        schemaName={schemaName}
        tableName={tableName}
        loading={dropping}
        onClose={() => setDropOpen(false)}
        onConfirm={handleDropTable}
      />
    </div>
  )
}
