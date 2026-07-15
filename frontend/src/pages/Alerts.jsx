import { useState, useMemo } from 'react'
import { CheckCircle2, AlertTriangle, Siren, TrendingUp } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, SectionHeader, SeverityBadge, KpiCard, ErrorState } from '@/components/shared/ui'
import { DataTable } from '@/components/shared/DataTable'
import { TrendChart, CHART_COLORS } from '@/components/shared/charts'
import { useApi } from '@/hooks/useApi'
import { alertsService } from '@/api/services'
import { useFilterStore } from '@/store'
import clsx from 'clsx'

function ResolveButton({ alertId, onResolve }) {
  const [resolving, setResolving] = useState(false)

  async function handleResolve() {
    setResolving(true)
    try {
      await alertsService.resolveAlert(alertId)
      onResolve?.()
    } catch (e) {
      console.error(e)
    } finally {
      setResolving(false)
    }
  }

  return (
    <button
      onClick={handleResolve}
      disabled={resolving}
      className="text-xs text-slate-500 hover:text-brand-300 transition-colors disabled:opacity-50"
    >
      {resolving ? 'Resolving…' : 'Resolve'}
    </button>
  )
}

export default function Alerts() {
  const { queryParams } = useFilterStore()
  const [severityFilter, setSeverityFilter] = useState('all')
  const [page, setPage] = useState(1)

  const params = {
    ...queryParams,
    page,
    page_size: 20,
    ...(severityFilter !== 'all' ? { severity: [severityFilter] } : {}),
  }

  const { data, loading, error, refetch } = useApi(
    () => alertsService.getAlerts(params),
    [JSON.stringify(params)]
  )

  const columns = useMemo(() => [
    { key: 'severity', label: 'Severity', width: '100px',
      render: (v) => <SeverityBadge severity={v} /> },
    { key: 'model', label: 'Model', width: '120px',
      render: (v) => <span className="font-mono text-xs text-brand-300">{v}</span> },
    { key: 'metric', label: 'Metric', width: '140px',
      render: (v) => <span className="text-xs">{v}</span> },
    { key: 'baseline_value', label: 'Baseline', sortable: true, align: 'right', width: '100px',
      render: (v, row) => <span className="text-slate-400 text-xs">{formatMetricVal(v, row.metric)}</span> },
    { key: 'current_value', label: 'Current', sortable: true, align: 'right', width: '100px',
      render: (v, row) => (
        <span className={clsx('text-xs font-medium', row.pct_change > 0 ? 'text-rose' : 'text-emerald')}>
          {formatMetricVal(v, row.metric)}
        </span>
      ),
    },
    { key: 'pct_change', label: 'Δ Change', sortable: true, align: 'right', width: '90px',
      render: (v) => (
        <span className={clsx('text-xs font-semibold', v > 0 ? 'text-rose' : 'text-emerald')}>
          {v > 0 ? '+' : ''}{v?.toFixed(1)}%
        </span>
      ),
    },
    { key: 'p_value', label: 'p-value', sortable: true, align: 'right', width: '90px',
      render: (v) => (
        <span className={clsx('font-mono text-xs', v < 0.05 ? 'text-amber' : 'text-slate-500')}>
          {v?.toFixed(4) ?? '—'}
        </span>
      ),
    },
    { key: 'created_at', label: 'Detected', width: '130px',
      render: (v) => <span className="text-xs text-slate-500">{v ? new Date(v).toLocaleString() : '—'}</span> },
    { key: 'id', label: '', width: '80px',
      render: (id, row) => !row.resolved ? (
        <ResolveButton alertId={id} onResolve={refetch} />
      ) : (
        <span className="text-xs text-emerald flex items-center gap-1 font-semibold">
          <CheckCircle2 size={13} className="text-emerald shrink-0" /> Resolved
        </span>
      ),
    },
  ], [refetch])

  function formatMetricVal(v, metric) {
    if (v == null) return '—'
    if (metric?.includes('latency')) return `${Math.round(v)}ms`
    if (metric?.includes('cost')) return `$${v.toFixed(5)}`
    if (metric?.includes('score')) return v.toFixed(2)
    if (metric?.includes('rate')) return `${(v * 100).toFixed(1)}%`
    return v.toFixed(3)
  }

  const SEVERITIES = ['all', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
  const severityColors = {
    CRITICAL: 'text-rose border-rose/30 bg-rose-dim/20',
    HIGH:     'text-amber border-amber/30 bg-amber-dim/20',
    MEDIUM:   'text-brand-300 border-brand-500/30 bg-brand-500/10',
    LOW:      'text-slate-400 border-white/10 bg-surface-500',
    all:      'text-slate-300 border-white/10 bg-surface-500',
  }

  const counts = data?.severity_counts ?? {}

  return (
    <Layout title="Regression Alerts" subtitle="Mann-Whitney U test (p < 0.05) — runs every 15 minutes">
      {/* Summary KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Critical" value={counts.CRITICAL ?? '—'} icon={Siren} iconColor="bg-rose-dim/40 text-rose" loading={loading} />
        <KpiCard title="High"     value={counts.HIGH ?? '—'}     icon={AlertTriangle} iconColor="bg-amber-dim/40 text-amber" loading={loading} />
        <KpiCard title="Medium"   value={counts.MEDIUM ?? '—'}   icon={TrendingUp} loading={loading} />
        <KpiCard title="Total Active" value={data?.total ?? '—'} loading={loading} />
      </div>

      <Card>
        <div className="p-4 border-b border-subtle">
          <SectionHeader
            title="Active Alerts"
            subtitle={data?.total ? `${data.total} unresolved alerts` : ''}
          />

          {/* Severity filter tabs */}
          <div className="flex gap-2 mt-2">
            {SEVERITIES.map((s) => (
              <button
                key={s}
                onClick={() => { setSeverityFilter(s); setPage(1) }}
                className={clsx(
                  'px-3 py-1 rounded-full text-xs font-medium border transition-all',
                  severityFilter === s
                    ? severityColors[s]
                    : 'text-slate-500 border-white/5 hover:text-slate-300'
                )}
              >
                {s === 'all' ? 'All' : s}
                {s !== 'all' && counts[s] ? ` (${counts[s]})` : ''}
              </button>
            ))}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={data?.items ?? []}
          loading={loading}
          error={error}
          total={data?.total}
          page={page}
          pageSize={20}
          onPageChange={setPage}
          onRetry={refetch}
          emptyMessage="No regression alerts — system looks healthy 🎉"
        />
      </Card>
    </Layout>
  )
}
