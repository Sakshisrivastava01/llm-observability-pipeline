import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { EmptyState, ErrorState, SkeletonTable } from './ui'
import { motion } from 'framer-motion'

/**
 * DataTable
 * @param {Array}    columns  - [{ key, label, render?, sortable?, width?, align? }]
 * @param {Array}    data     - row objects
 * @param {boolean}  loading
 * @param {Object}   error
 * @param {number}   total    - total records (for server-side pagination)
 * @param {number}   page
 * @param {number}   pageSize
 * @param {Function} onPageChange
 * @param {string}   emptyMessage
 */
export function DataTable({
  columns = [],
  data = [],
  loading = false,
  error = null,
  total,
  page = 1,
  pageSize = 20,
  onPageChange,
  emptyMessage = 'No records found',
  onRetry,
  onRowClick,
  className,
}) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey || !data.length) return data
    return [...data].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  const totalPages = total ? Math.ceil(total / pageSize) : 1

  if (loading) return <SkeletonTable rows={6} cols={columns.length} />
  if (error) return <ErrorState error={error} onRetry={onRetry} />
  if (!data.length) return <EmptyState title={emptyMessage} />

  return (
    <div className={clsx('flex flex-col', className)}>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={clsx(col.align === 'right' && 'text-right')}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 transition-colors font-semibold"
                    >
                      {col.label}
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
                      ) : (
                        <ChevronsUpDown size={12} className="opacity-30" />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <tr
                key={row.id || i}
                onClick={() => onRowClick?.(row)}
                className={clsx(
                  onRowClick && 'cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/[0.01] active:bg-slate-100/50 dark:active:bg-white/[0.03]'
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={clsx(col.align === 'right' && 'text-right')}>
                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-white/[0.06]">
          <p className="text-xs text-slate-500 font-semibold">
            {total ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}` : `Page ${page}`}
          </p>
          <div className="flex items-center gap-1.5">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="btn-ghost p-1.5 disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </motion.button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = page <= 3 ? i + 1 : page - 2 + i
              if (p < 1 || p > totalPages) return null
              return (
                <motion.button
                  key={p}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => onPageChange(p)}
                  className={clsx(
                    'w-7 h-7 rounded text-xs font-semibold transition-colors',
                    p === page
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/20'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                  )}
                >
                  {p}
                </motion.button>
              )
            })}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="btn-ghost p-1.5 disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  )
}
