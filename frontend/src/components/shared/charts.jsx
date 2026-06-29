import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart,
  Radar, PolarGrid, PolarAngleAxis,
} from 'recharts'
import clsx from 'clsx'

// ─── Shared chart theme ───────────────────────────────────────────────────────
export const CHART_COLORS = {
  brand:   '#6470f3',
  cyan:    '#22d3ee',
  emerald: '#34d399',
  amber:   '#fbbf24',
  rose:    '#fb7185',
  violet:  '#a78bfa',
  slate:   '#64748b',
}

export const MODEL_COLORS = {
  'mistral':      CHART_COLORS.brand,
  'gpt-4o-mini':  CHART_COLORS.cyan,
  'gpt-4o':       CHART_COLORS.violet,
  'llama3':       CHART_COLORS.emerald,
  'default':      CHART_COLORS.slate,
}

export function modelColor(model) {
  return MODEL_COLORS[model?.toLowerCase()] || MODEL_COLORS.default
}

const TOOLTIP_STYLE = {
  backgroundColor: '#15151f',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '8px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  padding: '8px 12px',
}

const TOOLTIP_LABEL_STYLE = {
  color: '#94a3b8',
  fontSize: '11px',
  marginBottom: '4px',
}

const TOOLTIP_ITEM_STYLE = {
  color: '#e2e8f0',
  fontSize: '12px',
}

function ChartWrapper({ title, subtitle, action, height = 240, className, children }) {
  return (
    <div className={clsx('card p-5', className)}>
      {(title || action) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && <p className="text-sm font-semibold text-slate-200">{title}</p>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    </div>
  )
}

// ─── Area / Line Trend Chart ──────────────────────────────────────────────────
export function TrendChart({ data = [], series = [], xKey = 'date', title, subtitle, height = 220 }) {
  return (
    <ChartWrapper title={title} subtitle={subtitle} height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={s.color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey={xKey} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />}
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label || s.key}
            stroke={s.color}
            fill={`url(#grad-${s.key})`}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </AreaChart>
    </ChartWrapper>
  )
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
export function BarChartWidget({ data = [], series = [], xKey = 'model', title, subtitle, height = 220, stacked = false }) {
  return (
    <ChartWrapper title={title} subtitle={subtitle} height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />}
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label || s.key}
            fill={s.color}
            radius={[3, 3, 0, 0]}
            stackId={stacked ? 'stack' : undefined}
            maxBarSize={40}
          />
        ))}
      </BarChart>
    </ChartWrapper>
  )
}

// ─── Histogram / Distribution ─────────────────────────────────────────────────
export function HistogramChart({ data = [], dataKey = 'count', xKey = 'bucket', color = CHART_COLORS.brand, title, height = 180 }) {
  return (
    <ChartWrapper title={title} height={height}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey={dataKey} fill={color} radius={[2, 2, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ChartWrapper>
  )
}

// ─── Mini Sparkline ───────────────────────────────────────────────────────────
export function Sparkline({ data = [], dataKey = 'value', color = CHART_COLORS.brand, height = 40 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ─── Donut / Pie ──────────────────────────────────────────────────────────────
export function DonutChart({ data = [], title, height = 200 }) {
  const colors = Object.values(CHART_COLORS)
  return (
    <ChartWrapper title={title} height={height}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius="55%" outerRadius="75%"
          dataKey="value" nameKey="name" paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} stroke="none" />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
      </PieChart>
    </ChartWrapper>
  )
}
