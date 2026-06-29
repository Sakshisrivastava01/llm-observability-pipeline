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
      <Card>
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
          emptyMessage="No traces match the current filters"
        />
      </Card>
    </Layout>
  )
}
