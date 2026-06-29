import { useMemo } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, SectionHeader, ErrorState, LoadingOverlay } from '@/components/shared/ui'
import { TrendChart, HistogramChart, CHART_COLORS, modelColor } from '@/components/shared/charts'
import { DataTable } from '@/components/shared/DataTable'
import { useApi } from '@/hooks/useApi'
import { evaluationsService } from '@/api/services'
import { useFilterStore } from '@/store'

const WORST_COLUMNS = [
  { key: 'run_id',  label: 'Run ID', width: '150px',
    render: (v) => <span className="font-mono text-xs text-brand-300">{v?.slice(0, 12)}…</span> },
  { key: 'model',   label: 'Model',  width: '120px',
    render: (v) => <span className="font-mono text-xs">{v}</span> },
  { key: 'score',   label: 'Score',  sortable: true, align: 'right', width: '80px',
    render: (v) => (
      <span className={v >= 4 ? 'text-rose font-semibold' : v >= 3 ? 'text-amber' : 'text-slate-300'}>
        {v?.toFixed(1) ?? '—'}
      </span>
    ),
  },
  { key: 'reasoning', label: 'Reasoning',
    render: (v) => <span className="text-xs text-slate-400 line-clamp-2">{v ?? '—'}</span> },
  { key: 'judge_model', label: 'Judge', width: '100px',
    render: (v) => <span className="text-xs text-slate-500 font-mono">{v}</span> },
  { key: 'created_at', label: 'Time', width: '130px',
    render: (v) => <span className="text-xs text-slate-500">{v ? new Date(v).toLocaleDateString() : '—'}</span> },
]

const EVAL_RUN_COLUMNS = [
  { key: 'dataset',    label: 'Dataset',    width: '120px' },
  { key: 'judge_model', label: 'Judge Model', width: '120px',
    render: (v) => <span className="font-mono text-xs">{v}</span> },
  { key: 'f1_score',   label: 'F1',    sortable: true, align: 'right', width: '80px',
    render: (v) => <span className={v >= 0.75 ? 'text-emerald' : 'text-rose'}>{v?.toFixed(3) ?? '—'}</span> },
  { key: 'precision',  label: 'Precision', sortable: true, align: 'right', width: '90px',
    render: (v) => <span>{v?.toFixed(3) ?? '—'}</span> },
  { key: 'recall',     label: 'Recall',    sortable: true, align: 'right', width: '80px',
    render: (v) => <span>{v?.toFixed(3) ?? '—'}</span> },
  { key: 'threshold',  label: 'Threshold', align: 'right', width: '90px',
    render: (v) => <span className="text-slate-400">{v ?? '—'}</span> },
  { key: 'run_date',   label: 'Run Date',  width: '120px',
    render: (v) => <span className="text-xs text-slate-500">{v ? new Date(v).toLocaleDateString() : '—'}</span> },
]

export default function Evaluation() {
  const { queryParams } = useFilterStore()

  const { data: scores,  loading: scoresLoading,  error: scoresError }  =
    useApi(() => evaluationsService.getHallucinationScores(queryParams),  [JSON.stringify(queryParams)])
  const { data: trend,   loading: trendLoading,   error: trendError   }  =
    useApi(() => evaluationsService.getHallucinationTrend(queryParams),   [JSON.stringify(queryParams)])
  const { data: worst,   loading: worstLoading,   error: worstError   }  =
    useApi(() => evaluationsService.getWorstResponses({ limit: 10, ...queryParams }), [JSON.stringify(queryParams)])
  const { data: evalRuns, loading: evalLoading }  =
    useApi(() => evaluationsService.getEvaluations(), [])

  const trendSeries = useMemo(() => [
    { key: 'avg_score', label: 'Avg Hallucination Score', color: CHART_COLORS.rose },
  ], [])

  return (
    <Layout title="Hallucination Analysis" subtitle="LLM-as-Judge scoring with Ollama/Mistral">
      {/* Distribution + Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <HistogramChart
          data={scores ?? []}
          dataKey="count"
          xKey="score_bucket"
          color={CHART_COLORS.violet}
          title="Score Distribution (0–5)"
          height={220}
        />
        <TrendChart
          data={trend ?? []}
          series={trendSeries}
          xKey="date"
          title="Score Trend Over Time"
          height={220}
        />
      </div>

      {/* Worst Responses */}
      <Card className="mb-6">
        <div className="p-4 border-b border-subtle">
          <SectionHeader
            title="Worst Responses"
            subtitle="Top 10 highest hallucination scores"
          />
        </div>
        <DataTable
          columns={WORST_COLUMNS}
          data={worst ?? []}
          loading={worstLoading}
          error={worstError}
          emptyMessage="No scored responses found"
        />
      </Card>

      {/* Evaluation Runs */}
      <Card>
        <div className="p-4 border-b border-subtle">
          <SectionHeader
            title="Evaluation Run History"
            subtitle="SQuAD v2 benchmark results — CI gate: F1 ≥ 0.75"
          />
        </div>
        <DataTable
          columns={EVAL_RUN_COLUMNS}
          data={evalRuns?.items ?? evalRuns ?? []}
          loading={evalLoading}
          emptyMessage="No evaluation runs recorded yet"
        />
      </Card>
    </Layout>
  )
}
