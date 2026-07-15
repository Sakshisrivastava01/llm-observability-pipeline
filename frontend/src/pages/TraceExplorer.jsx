import { useState, useCallback } from 'react'
import { Download, Search, X } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, SectionHeader, Badge, SeverityBadge } from '@/components/shared/ui'
import { DataTable } from '@/components/shared/DataTable'
import { useFilterStore } from '@/store'
import { tracesService } from '@/api/tracesService'
import { useApi } from '@/hooks/useApi'

function statusBadge(score) {
  if (score == null) return <Badge variant="default">—</Badge>
  if (score <= 1.5) return <Badge variant="ok">OK</Badge>
  if (score <= 3.0) return <Badge variant="medium">WARN</Badge>
  return <Badge variant="high">HIGH</Badge>
}

const COLUMNS = [
  {
    key: 'run_id',
    label: 'Run ID',
    sortable: false,
    width: '160px',
    render: (v) => (
      <span className="font-mono text-xs text-brand-300 truncate block max-w-[140px]" title={v}>
        {v}
      </span>
    ),
  },
  { key: 'model', label: 'Model', sortable: true, width: '120px',
    render: (v) => <span className="font-mono text-xs">{v}</span> },
  { key: 'latency_ms', label: 'Latency', sortable: true, align: 'right', width: '100px',
    render: (v) => (
      <span className={v > 1000 ? 'text-amber' : v > 500 ? 'text-brand-300' : 'text-emerald'}>
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
    render: (_, row) => statusBadge(row.hall_score) },
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

  async function handleExport() {
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

function TraceDetailDrawer({ traceId, onClose }) {
  const { data: trace, loading, error } = useApi(
    () => tracesService.getTrace(traceId),
    [traceId]
  )

  return (
    <Card className="w-full lg:w-96 shrink-0 p-5 self-stretch flex flex-col gap-4 border-l border-white/[0.08] bg-surface-800 animate-slide-in">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">Trace Details</h3>
          <p className="text-[10px] font-mono text-slate-500 mt-0.5">{traceId}</p>
        </div>
        <button onClick={onClose} className="btn-ghost p-1">
          <X size={14} />
        </button>
      </div>

      {loading && (
        <div className="flex-1 flex flex-col justify-center items-center py-12 gap-2 text-slate-500 text-xs">
          <div className="skeleton h-4 w-28 rounded" />
          <div className="skeleton h-24 w-full rounded" />
          <div className="skeleton h-24 w-full rounded" />
        </div>
      )}

      {error && (
        <div className="flex-1 flex items-center justify-center py-12 text-xs text-rose">
          {error.message || 'Failed to load details'}
        </div>
      )}

      {trace && (
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Name</span>
            <p className="text-slate-300 font-medium mt-0.5">{trace.name || 'inference_pipeline'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Start Time</span>
              <p className="text-slate-400 mt-0.5">{new Date(trace.start_time).toLocaleTimeString()}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">End Time</span>
              <p className="text-slate-400 mt-0.5">{new Date(trace.end_time).toLocaleTimeString()}</p>
            </div>
          </div>

          <div className="border-t border-white/[0.04] pt-3">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Prompt (Input)</span>
            <div className="mt-1 p-2 bg-surface-900 rounded font-mono text-[11px] text-slate-300 max-h-40 overflow-y-auto break-words whitespace-pre-wrap">
              {trace.input_data?.prompt || JSON.stringify(trace.input_data, null, 2)}
            </div>
          </div>

          <div className="border-t border-white/[0.04] pt-3">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Response (Output)</span>
            <div className="mt-1 p-2 bg-surface-900 rounded font-mono text-[11px] text-emerald-400/90 max-h-40 overflow-y-auto break-words whitespace-pre-wrap">
              {trace.output_data?.response || JSON.stringify(trace.output_data, null, 2)}
            </div>
          </div>

          {trace.spans && trace.spans.length > 0 && (
            <div className="border-t border-white/[0.04] pt-3">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Spans ({trace.spans.length})</span>
              <div className="space-y-2 mt-1">
                {trace.spans.map((span) => (
                  <div key={span.span_id} className="p-2 bg-white/[0.02] rounded border border-white/[0.04]">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>{span.name}</span>
                      <span className="text-brand-300">{span.model_name}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1">
                      <span>Tokens: {span.total_tokens}</span>
                      <span>Cost: ${span.cost?.toFixed(4)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {trace.evaluations && trace.evaluations.length > 0 && (
            <div className="border-t border-white/[0.04] pt-3">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Evaluations ({trace.evaluations.length})</span>
              <div className="space-y-2 mt-1">
                {trace.evaluations.map((ev) => (
                  <div key={ev.id || ev.metric_name} className="p-2 bg-white/[0.02] rounded border border-white/[0.04]">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span className="capitalize">{ev.metric_name}</span>
                      <span className="font-semibold text-brand-300">{ev.metric_value?.toFixed(2)}</span>
                    </div>
                    {ev.feedback && (
                      <p className="text-[10px] text-slate-500 mt-1 italic">Feedback: {ev.feedback}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
