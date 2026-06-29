import { useMemo } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, SectionHeader, StatRow } from '@/components/shared/ui'
import { TrendChart, BarChartWidget, DonutChart, CHART_COLORS, modelColor } from '@/components/shared/charts'
import { useApi } from '@/hooks/useApi'
import { analyticsService } from '@/api/analyticsService'
import { useFilterStore } from '@/store'

export default function Analytics() {
  const { queryParams } = useFilterStore()

  const { data: advanced, loading } = useApi(
    () => analyticsService.getAdvanced(queryParams),
    [JSON.stringify(queryParams)]
  )

  const { data: models } = useApi(
    () => analyticsService.getModelComparison(queryParams),
    [JSON.stringify(queryParams)]
  )

  const { data: trends } = useApi(
    () => analyticsService.getTrends(queryParams),
    [JSON.stringify(queryParams)]
  )

  const costSeries = useMemo(() => [
    { key: 'cost_usd', label: 'Cost (USD)', color: CHART_COLORS.emerald },
  ], [])

  const latencyPercentiles = useMemo(() => [
    { key: 'p50_latency_ms', label: 'p50', color: CHART_COLORS.brand },
    { key: 'p95_latency_ms', label: 'p95', color: CHART_COLORS.amber },
    { key: 'p99_latency_ms', label: 'p99', color: CHART_COLORS.rose },
  ], [])

  const tokenSeries = useMemo(() => [
    { key: 'prompt_tokens',     label: 'Prompt',     color: CHART_COLORS.brand },
    { key: 'completion_tokens', label: 'Completion', color: CHART_COLORS.cyan },
  ], [])

  const modelDonutData = useMemo(() =>
    (models ?? []).map((m) => ({ name: m.model, value: m.calls })),
  [models])

  return (
    <Layout title="Analytics" subtitle="Deep-dive cost, latency, and token efficiency">
      {/* Cost + Latency Percentiles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <TrendChart
          data={trends ?? []}
          series={costSeries}
          xKey="date"
          title="Cost Over Time (USD)"
          height={200}
        />
        <BarChartWidget
          data={models ?? []}
          series={latencyPercentiles}
          xKey="model"
          title="Latency Percentiles by Model"
          height={200}
        />
      </div>

      {/* Token + Model Share */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <TrendChart
          data={trends ?? []}
          series={tokenSeries}
          xKey="date"
          title="Token Usage Over Time"
          height={200}
        />
        <DonutChart
          data={modelDonutData}
          title="Call Share by Model"
          height={200}
        />
      </div>

      {/* Per-model stats table */}
      <Card className="p-5">
        <SectionHeader
          title="Per-Model Performance Summary"
          subtitle="Aggregated over selected date range"
        />
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                {['Model', 'Calls', 'Avg Latency', 'p95 Latency', 'Cost / 1k', 'Error Rate', 'Avg Hall. Score'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j}><div className="skeleton h-3 rounded w-16" /></td>
                      ))}
                    </tr>
                  ))
                : (models ?? []).map((m) => (
                    <tr key={m.model}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: modelColor(m.model) }} />
                          <span className="font-mono text-xs text-brand-300">{m.model}</span>
                        </div>
                      </td>
                      <td>{m.calls?.toLocaleString() ?? '—'}</td>
                      <td>{m.avg_latency_ms != null ? `${Math.round(m.avg_latency_ms)}ms` : '—'}</td>
                      <td className={m.p95_latency_ms > 1000 ? 'text-amber' : ''}>
                        {m.p95_latency_ms != null ? `${Math.round(m.p95_latency_ms)}ms` : '—'}
                      </td>
                      <td className="font-mono text-xs">
                        {m.cost_per_1k != null ? `$${m.cost_per_1k.toFixed(4)}` : '$0.00'}
                      </td>
                      <td className={m.error_rate > 0.05 ? 'text-rose' : 'text-emerald'}>
                        {m.error_rate != null ? `${(m.error_rate * 100).toFixed(1)}%` : '—'}
                      </td>
                      <td className={m.avg_hall_score >= 3 ? 'text-amber' : 'text-emerald'}>
                        {m.avg_hall_score?.toFixed(2) ?? '—'}
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </Card>
    </Layout>
  )
}
