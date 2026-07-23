import { useState, useCallback, useEffect } from 'react'
import { Download, Search, X } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, SectionHeader, StatusBadge } from '@/components/shared/ui'
import { DataTable } from '@/components/shared/DataTable'
import { useFilterStore, useAuthStore, useUIStore } from '@/store'
import { tracesService } from '@/api/tracesService'
import { useApi } from '@/hooks/useApi'

const COLUMNS = [
  {
    key: 'run_id',
    label: 'Run ID',
    sortable: false,
    width: '160px',
    render: (v) => (
      <span className="font-mono text-xs text-brand-500 truncate block max-w-[140px]" title={v}>
        {v}
      </span>
    ),
  },
  { key: 'model', label: 'Model', sortable: true, width: '120px',
    render: (v) => <span className="font-mono text-xs">{v}</span> },
  { key: 'latency_ms', label: 'Latency', sortable: true, align: 'right', width: '100px',
    render: (v) => (
      <span className={v > 1000 ? 'text-amber' : v > 500 ? 'text-brand-500' : 'text-emerald'}>
        {v != null ? `${Math.round(v)}ms` : '—'}
      </span>
    ),
  },
  { key: 'total_tokens', label: 'Tokens', sortable: true, align: 'right', width: '90px',
    render: (v) => <span className="text-slate-400">{v?.toLocaleString() ?? '—'}</span> },
  { key: 'cost_usd', label: 'Cost', sortable: true, align: 'right', width: '90px',
    render: (v) => (
      <span className="font-mono text-xs">
        {v != null ? (v === 0 ? '$0.00' : `$${v.toFixed(4)}`) : '—'}
      </span>
    ),
  },
  { key: 'hall_score', label: 'Hall. Score', sortable: true, align: 'right', width: '100px',
    render: (v) => <span className="text-xs">{v != null ? v.toFixed(1) : '—'}</span> },
  { key: 'status', label: 'Status', width: '80px',
    render: (_, row) => {
      const score = row.hall_score
      const status = score == null ? '—' : score <= 1.5 ? 'OK' : score <= 3.0 ? 'WARN' : 'HIGH'
      return <StatusBadge status={status} />
    }
  },
  { key: 'finish_reason', label: 'Finish', width: '90px',
    render: (v) => <span className="text-xs text-slate-500">{v ?? '—'}</span> },
  { key: 'created_at', label: 'Time', sortable: true, width: '140px',
    render: (v) => (
      <span className="text-xs text-slate-500">
        {v ? new Date(v).toLocaleString() : '—'}
      </span>
    ),
  },
]

export default function TraceExplorer() {
  const { queryParams } = useFilterStore()
  const [selectedTraceId, setSelectedTraceId] = useState(null)
  const [localFilters, setLocalFilters] = useState({
    search: '',
    minLatency: '',
    maxLatency: '',
    minScore: '',
    maxScore: '',
  })
  const [page, setPage] = useState(1)

  const buildParams = useCallback(() => ({
    ...queryParams,
    page,
    page_size: 25,
    ...(localFilters.search     ? { search: localFilters.search }                     : {}),
    ...(localFilters.minLatency ? { min_latency_ms: Number(localFilters.minLatency) } : {}),
    ...(localFilters.maxLatency ? { max_latency_ms: Number(localFilters.maxLatency) } : {}),
    ...(localFilters.minScore   ? { min_hall_score: Number(localFilters.minScore) }   : {}),
    ...(localFilters.maxScore   ? { max_hall_score: Number(localFilters.maxScore) }   : {}),
  }), [queryParams, page, localFilters])

  const { data, loading, error, refetch } = useApi(
    () => tracesService.getTraces(buildParams()),
    [JSON.stringify(buildParams())]
  )

  const { isGuest } = useAuthStore()
  const { setAuthModalOpen } = useUIStore()

  async function handleExport() {
    if (isGuest) {
      setAuthModalOpen(true)
      return
    }
    try {
      const blob = await tracesService.exportTraces(buildParams())
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `traces-export-${new Date().toISOString().slice(0,10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Export failed', e)
    }
  }

  return (
    <Layout title="Trace Explorer" subtitle="Inspect every LLM call with full detail">
      <div className="flex flex-col lg:flex-row gap-6 relative items-start">
        <Card className="flex-1 w-full overflow-hidden">
          <div className="p-4 border-b border-subtle">
            <SectionHeader
              title="All Traces"
              subtitle={data?.total ? `${data.total.toLocaleString()} records` : ''}
              action={
                <button onClick={handleExport} className="btn-outline text-xs gap-1.5">
                  <Download size={13} />
                  Export CSV
                </button>
              }
            />

            {/* Local filters */}
            <div className="flex flex-wrap gap-3 mt-3">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={localFilters.search}
                  onChange={(e) => setLocalFilters((f) => ({ ...f, search: e.target.value }))}
                  placeholder="Search run ID…"
                  className="form-input pl-7 h-8 text-xs w-48"
                />
              </div>
              <input
                value={localFilters.minLatency}
                onChange={(e) => setLocalFilters((f) => ({ ...f, minLatency: e.target.value }))}
                placeholder="Min latency (ms)"
                type="number"
                className="form-input h-8 text-xs w-36"
              />
              <input
                value={localFilters.maxLatency}
                onChange={(e) => setLocalFilters((f) => ({ ...f, maxLatency: e.target.value }))}
                placeholder="Max latency (ms)"
                type="number"
                className="form-input h-8 text-xs w-36"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Score</span>
                <input
                  value={localFilters.minScore}
                  onChange={(e) => setLocalFilters((f) => ({ ...f, minScore: e.target.value }))}
                  placeholder="0"
                  type="number" min="0" max="5" step="0.1"
                  className="form-input h-8 text-xs w-16"
                />
                <span className="text-slate-600">–</span>
                <input
                  value={localFilters.maxScore}
                  onChange={(e) => setLocalFilters((f) => ({ ...f, maxScore: e.target.value }))}
                  placeholder="5"
                  type="number" min="0" max="5" step="0.1"
                  className="form-input h-8 text-xs w-16"
                />
              </div>
              <button
                onClick={() => { setLocalFilters({ search: '', minLatency: '', maxLatency: '', minScore: '', maxScore: '' }); setPage(1) }}
                className="btn-ghost p-1.5 text-xs"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          <DataTable
            columns={COLUMNS}
            data={data?.items ?? []}
            loading={loading}
            error={error}
            total={data?.total}
            page={page}
            pageSize={25}
            onPageChange={setPage}
            onRetry={refetch}
            onRowClick={(row) => setSelectedTraceId(row.run_id)}
            selectedRowId={selectedTraceId}
            emptyMessage="No traces match the current filters"
          />
        </Card>

        {selectedTraceId && (
          <TraceDetailDrawer
            traceId={selectedTraceId}
            onClose={() => setSelectedTraceId(null)}
          />
        )}
      </div>
    </Layout>
  )
}

function CollapsibleSection({ title, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-t border-subtle pt-4 first:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-[10px] uppercase font-extrabold text-slate-500 tracking-widest hover:text-slate-700 dark:hover:text-slate-300 transition-colors focus:outline-none select-none"
      >
        <span className="flex items-center gap-2">
          {title} {count !== undefined && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[9px] text-slate-400">{count}</span>}
        </span>
        <span className="text-[9px] font-bold text-brand-500">{open ? 'Collapse' : 'Expand'}</span>
      </button>
      {open && <div className="mt-3 space-y-3">{children}</div>}
    </div>
  )
}

function formatHighlightedJson(data) {
  if (data == null) return <span className="text-slate-400 font-mono text-[11px]">Empty</span>
  const str = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  const lines = str.split('\n')
  return (
    <code className="block select-text">
      {lines.map((line, i) => {
        const keyMatch = line.match(/^(\s*)"([^"]+)":/)
        if (keyMatch) {
          const indent = keyMatch[1]
          const key = keyMatch[2]
          const rest = line.substring(keyMatch[0].length)
          return (
            <div key={i} className="leading-5">
              <span className="text-slate-400">{indent}</span>
              <span className="text-brand-500 font-semibold">{"\"" + key + "\""}</span>:
              <span className="text-slate-800 dark:text-slate-200">{rest}</span>
            </div>
          )
        }
        return <div key={i} className="leading-5 text-slate-800 dark:text-slate-200">{line}</div>
      })}
    </code>
  )
}

function formatHighlightedOutput(data) {
  if (data == null) return <span className="text-slate-400 font-mono text-[11px]">Empty</span>
  const str = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
  const lines = str.split('\n')
  return (
    <code className="block select-text">
      {lines.map((line, i) => {
        const keyMatch = line.match(/^(\s*)"([^"]+)":/)
        if (keyMatch) {
          const indent = keyMatch[1]
          const key = keyMatch[2]
          const rest = line.substring(keyMatch[0].length)
          return (
            <div key={i} className="leading-5">
              <span className="text-slate-400">{indent}</span>
              <span className="text-brand-500 font-semibold">{"\"" + key + "\""}</span>:
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">{"\"" + rest.replace(/^ "|\s*"$/g, '') + "\""}</span>
            </div>
          )
        }
        return <div key={i} className="leading-5 text-emerald-700 dark:text-emerald-400 font-medium">{line}</div>
      })}
    </code>
  )
}

function TraceDetailDrawer({ traceId, onClose }) {
  const { data: trace, loading, error } = useApi(
    () => tracesService.getTrace(traceId),
    [traceId]
  )

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const parentStart = trace ? new Date(trace.start_time).getTime() : 0
  const parentEnd = trace ? new Date(trace.end_time).getTime() : 0
  const parentDuration = Math.max(1, parentEnd - parentStart)

  return (
    <div className="w-full lg:w-[440px] shrink-0 border-l border-subtle self-stretch flex flex-col backdrop-blur-md bg-white/95 dark:bg-[rgba(11,17,32,0.85)] shadow-2xl relative animate-slide-in overflow-hidden lg:rounded-l-2xl">
      {/* Sticky Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-subtle bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-20 shrink-0">
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Trace Details</h3>
          <p className="text-[10px] font-mono text-slate-500 mt-0.5">{traceId}</p>
        </div>
        <button onClick={onClose} className="btn-ghost p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
          <X size={15} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {loading && (
          <div className="flex flex-col justify-center items-center py-12 gap-2 text-slate-500 text-xs">
            <div className="skeleton h-4 w-28 rounded" />
            <div className="skeleton h-24 w-full rounded" />
            <div className="skeleton h-24 w-full rounded" />
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-12 text-xs text-rose font-medium">
            {error.message || 'Failed to load details'}
          </div>
        )}

        {trace && (
          <div className="space-y-5 text-xs">
            {/* Overview */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Name</span>
                <p className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">{trace.name || 'inference_pipeline'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Latency</span>
                <p className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">{parentDuration}ms</p>
              </div>
            </div>

            {/* Prompt */}
            <CollapsibleSection title="Prompt (Input)">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-subtle font-mono text-[11px] max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {formatHighlightedJson(trace.input_data?.prompt || trace.input_data)}
              </div>
            </CollapsibleSection>

            {/* Response */}
            <CollapsibleSection title="Response (Output)">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-subtle font-mono text-[11px] max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {formatHighlightedOutput(trace.output_data?.response || trace.output_data)}
              </div>
            </CollapsibleSection>

            {/* Spans */}
            {trace.spans && trace.spans.length > 0 && (
              <CollapsibleSection title="Spans" count={trace.spans.length}>
                <div className="space-y-3">
                  {trace.spans.map((span) => {
                    const spanStart = new Date(span.start_time || trace.start_time).getTime()
                    const spanEnd = new Date(span.end_time || trace.end_time).getTime()
                    const spanDuration = Math.max(1, spanEnd - spanStart)
                    const relativeStartPct = Math.min(90, ((spanStart - parentStart) / parentDuration) * 100)
                    const widthPct = Math.min(100 - relativeStartPct, (spanDuration / parentDuration) * 100)

                    return (
                      <div key={span.span_id} className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-subtle space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="font-semibold text-slate-800 dark:text-slate-300">{span.name}</span>
                          <span className="text-brand-500 font-bold">{span.model_name}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <span>Tokens: {span.total_tokens}</span>
                          <span>Cost: ${span.cost?.toFixed(4)}</span>
                        </div>
                        {/* Latency timeline bar */}
                        <div className="space-y-1">
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full relative overflow-hidden">
                            <div
                              className="absolute h-full bg-brand-500 rounded-full"
                              style={{ left: `${relativeStartPct}%`, width: `${widthPct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                            <span>+{Math.round(spanStart - parentStart)}ms</span>
                            <span>{spanDuration}ms</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CollapsibleSection>
            )}

            {/* Evaluations */}
            {trace.evaluations && trace.evaluations.length > 0 && (
              <CollapsibleSection title="Evaluations" count={trace.evaluations.length}>
                <div className="space-y-2">
                  {trace.evaluations.map((ev) => {
                    const val = ev.metric_value
                    const status = val >= 4.0 ? 'HIGH' : val >= 2.5 ? 'WARN' : 'SUCCESS'
                    return (
                      <div key={ev.id || ev.metric_name} className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-subtle flex items-center justify-between">
                        <div>
                          <span className="capitalize font-bold text-slate-700 dark:text-slate-300">{ev.metric_name}</span>
                          {ev.feedback && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 italic">
                              Feedback: {ev.feedback}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="font-semibold text-slate-600 dark:text-slate-400 text-[10px]">{val?.toFixed(2)}</span>
                          <StatusBadge status={status} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CollapsibleSection>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
