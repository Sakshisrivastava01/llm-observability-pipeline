import { useMemo, useState, useEffect } from 'react'
import { Activity, DollarSign, Zap, Brain, TrendingUp } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { KpiCard, SectionHeader, Card, ErrorState } from '@/components/shared/ui'
import { TrendChart, BarChartWidget, HistogramChart, CHART_COLORS } from '@/components/shared/charts'
import { useApi } from '@/hooks/useApi'
import { analyticsService } from '@/api/analyticsService'
import { useFilterStore } from '@/store'

function formatLatency(ms) {
  if (ms == null) return '—'
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`
}

function formatCost(usd) {
  if (usd == null) return '—'
  return usd === 0 ? '$0.00' : `$${usd.toFixed(4)}`
}

function formatNumber(n) {
  if (n == null) return '—'
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

export default function Overview() {
  const { queryParams } = useFilterStore()
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshKey((k) => k + 1)
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const { data: kpis, loading: kpisLoading, error: kpisError, refetch: refetchKpis } =
    useApi(() => analyticsService.getKPIs(queryParams), [JSON.stringify(queryParams), refreshKey])

  const { data: trends, loading: trendsLoading } =
    useApi(() => analyticsService.getTrends(queryParams), [JSON.stringify(queryParams), refreshKey])

  const { data: models, loading: modelsLoading } =
    useApi(() => analyticsService.getModelComparison(queryParams), [JSON.stringify(queryParams), refreshKey])

  const { data: latDist, loading: latDistLoading } =
    useApi(() => analyticsService.getLatencyDistribution(queryParams), [JSON.stringify(queryParams), refreshKey])

  const trendSeries = useMemo(() => [
    { key: 'calls', label: 'Calls', color: CHART_COLORS.brand },
  ], [])

  const latencySeries = useMemo(() => [
    { key: 'avg_latency_ms', label: 'Avg Latency (ms)', color: CHART_COLORS.cyan },
  ], [])

  const modelCallsSeries = useMemo(() => [
    { key: 'calls', label: 'Calls', color: CHART_COLORS.brand },
    { key: 'avg_latency_ms', label: 'Avg Latency (ms)', color: CHART_COLORS.cyan },
  ], [])

  return (
    <Layout
      title="Overview"
      subtitle="System-wide LLM performance at a glance"
    >
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="Total Calls"
          value={formatNumber(kpis?.total_calls)}
          change={kpis?.total_calls_change_pct}
          icon={Activity}
          loading={kpisLoading}
        />
        <KpiCard
          title="Avg Latency"
          value={formatLatency(kpis?.avg_latency_ms)}
          change={kpis?.avg_latency_change_pct}
          changeLabel="vs yesterday"
          icon={Zap}
          iconColor="bg-cyan-dim/40 text-cyan"
          loading={kpisLoading}
        />
        <KpiCard
          title="Total Cost"
          value={formatCost(kpis?.total_cost_usd)}
          change={kpis?.total_cost_change_pct}
          icon={DollarSign}
          iconColor="bg-emerald-dim/40 text-emerald"
          loading={kpisLoading}
        />
        <KpiCard
          title="Hall. Score"
          value={kpis?.avg_hall_score != null ? `${kpis.avg_hall_score.toFixed(1)}/5` : '—'}
          change={kpis?.avg_hall_score_change}
          changeLabel="change"
          icon={Brain}
          iconColor="bg-violet-dim/40 text-violet"
          loading={kpisLoading}
        />
      </div>

      {kpisError && (
        <ErrorState error={kpisError} onRetry={refetchKpis} className="mb-4" />
      )}

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <TrendChart
          data={trends ?? []}
          series={trendSeries}
          xKey="date"
          title="Call Volume — 7-day trend"
          height={200}
        />
        <TrendChart
          data={trends ?? []}
          series={latencySeries}
          xKey="date"
          title="Avg Latency — 7-day trend"
          height={200}
        />
      </div>

      {/* Model + Latency Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <BarChartWidget
          data={models ?? []}
          series={modelCallsSeries}
          xKey="model"
          title="Model Comparison"
          subtitle="Calls and avg latency per model"
          height={200}
        />
        <HistogramChart
          data={latDist ?? []}
          dataKey="count"
          xKey="bucket"
          color={CHART_COLORS.violet}
          title="Latency Distribution (ms)"
          height={200}
        />
      </div>

      {/* Recent Activity Summary */}
      <RecentActivity queryParams={queryParams} refreshKey={refreshKey} />
    </Layout>
  )
}

function RecentActivity({ queryParams, refreshKey }) {
  const { data, loading, error } = useApi(
    () => analyticsService.getAdvanced(queryParams),
    [JSON.stringify(queryParams), refreshKey]
  )

  return (
    <Card className="p-5">
      <SectionHeader
        title="Recent Regression Alerts"
        subtitle="Active alerts from the last 24 hours"
        action={
          <a href="/alerts" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
            View all →
          </a>
        }
      />

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="skeleton h-4 w-20 rounded" />
              <div className="skeleton h-4 flex-1 rounded" />
              <div className="skeleton h-4 w-16 rounded" />
            </div>
          ))}
        </div>
      )}

      {error && <ErrorState error={error} />}

      {!loading && !error && (
        <div className="space-y-2">
          {(data?.recent_alerts ?? []).length === 0 && (
            <p className="text-sm text-slate-500 py-4 text-center">No active alerts 🎉</p>
          )}
          {(data?.recent_alerts ?? []).map((alert, i) => (
            <AlertRow key={i} alert={alert} />
          ))}
        </div>
      )}
    </Card>
  )
}

function AlertRow({ alert }) {
  const severityColors = {
    CRITICAL: 'text-rose',
    HIGH:     'text-amber',
    MEDIUM:   'text-brand-300',
    LOW:      'text-slate-400',
  }
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
      <span className={`text-xs font-semibold w-16 shrink-0 ${severityColors[alert.severity] || 'text-slate-400'}`}>
        {alert.severity}
      </span>
      <span className="text-xs font-mono text-brand-300 w-24 shrink-0">{alert.model}</span>
      <span className="text-xs text-slate-400 flex-1 truncate">
        {alert.metric} — {alert.pct_change > 0 ? '+' : ''}{alert.pct_change?.toFixed(1)}% vs baseline
      </span>
      <span className="text-[10px] text-slate-600">
        {alert.created_at ? new Date(alert.created_at).toLocaleTimeString() : ''}
      </span>
    </div>
  )
}
