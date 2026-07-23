import { useMemo } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, SectionHeader, ProgressBar } from '@/components/shared/ui'
import { BarChartWidget, TrendChart, CHART_COLORS, modelColor } from '@/components/shared/charts'
import { useApi } from '@/hooks/useApi'
import { analyticsService } from '@/api/analyticsService'
import { modelsService } from '@/api/services'
import { useFilterStore } from '@/store'
import clsx from 'clsx'

function ScoreBar({ value, max = 5, label }) {
  const pct = (value / max) * 100
  const color = value <= 1.5 ? 'bg-emerald' : value <= 3 ? 'bg-amber' : 'bg-rose'
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-xs font-medium text-slate-300">{value?.toFixed(2)}</span>
      </div>
      <ProgressBar value={value} max={max} colorClass={color} />
    </div>
  )
}

function ModelCard({ model: m }) {
  if (!m) return null
  return (
    <Card className="p-5 space-y-4 card-hover">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: modelColor(m.model) }} />
        <h3 className="font-semibold text-slate-100 text-sm">{m.model}</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Calls', value: m.calls?.toLocaleString() ?? '—' },
          { label: 'Error Rate', value: m.error_rate != null ? `${(m.error_rate * 100).toFixed(1)}%` : '—',
            red: m.error_rate > 0.05 },
          { label: 'Avg Latency', value: m.avg_latency_ms != null ? `${Math.round(m.avg_latency_ms)}ms` : '—' },
          { label: 'p95 Latency', value: m.p95_latency_ms != null ? `${Math.round(m.p95_latency_ms)}ms` : '—',
            warn: m.p95_latency_ms > 1000 },
          { label: 'Cost / 1k tokens', value: m.cost_per_1k != null ? `$${m.cost_per_1k.toFixed(5)}` : '$0.00' },
          { label: 'Avg Tokens', value: m.avg_tokens?.toFixed(0) ?? '—' },
        ].map(({ label, value, red, warn }) => (
          <div key={label}>
            <p className="text-[10px] uppercase tracking-wider text-slate-600">{label}</p>
            <p className={clsx(
              'text-sm font-semibold mt-0.5',
              red ? 'text-rose' : warn ? 'text-amber' : 'text-slate-200'
            )}>{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2 pt-1">
        <ScoreBar value={m.avg_hall_score ?? 0} label="Hallucination Score (lower = better)" />
      </div>
    </Card>
  )
}

export default function ModelComparison() {
  const { queryParams } = useFilterStore()

  const { data: models, loading } = useApi(
    () => analyticsService.getModelComparison(queryParams),
    [JSON.stringify(queryParams)]
  )

  const series = useMemo(() => (models ?? []).map((m) => ({
    key: m.model, label: m.model, color: modelColor(m.model),
  })), [models])

  const latencyCompare = useMemo(() => [
    { key: 'avg_latency_ms', label: 'Avg Latency', color: CHART_COLORS.brand },
    { key: 'p95_latency_ms', label: 'p95 Latency', color: CHART_COLORS.rose },
  ], [])

  return (
    <Layout title="Model Comparison" subtitle="Side-by-side performance across all tracked models">
      {/* Cards */}
      <div className={clsx(
        'grid gap-4 mb-6',
        (models?.length ?? 0) <= 2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      )}>
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card p-5 space-y-3">
                <div className="skeleton h-5 w-24 rounded" />
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <div key={j} className="skeleton h-8 rounded" />
                  ))}
                </div>
              </div>
            ))
          : (models ?? []).map((m) => <ModelCard key={m.model} model={m} />)
        }
      </div>

      {/* Comparison charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarChartWidget
          data={models ?? []}
          series={latencyCompare}
          xKey="model"
          title="Latency Comparison"
          subtitle="Avg vs p95"
          height={220}
          loading={loading}
        />
        <BarChartWidget
          data={(models ?? []).map((m) => ({
            model: m.model,
            hall_score: m.avg_hall_score,
            error_rate: m.error_rate * 100,
          }))}
          series={[
            { key: 'hall_score', label: 'Hall. Score', color: CHART_COLORS.violet },
            { key: 'error_rate', label: 'Error Rate (%)', color: CHART_COLORS.rose },
          ]}
          xKey="model"
          title="Quality Metrics"
          subtitle="Hallucination score and error rate"
          height={220}
          loading={loading}
        />
      </div>
    </Layout>
  )
}
