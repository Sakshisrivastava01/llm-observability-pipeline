import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, SectionHeader, Divider } from '@/components/shared/ui'
import { Check, Eye, EyeOff } from 'lucide-react'
import { useAuthStore, useUIStore } from '@/store'

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-white/[0.04] last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${checked ? 'bg-brand-500' : 'bg-surface-400'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}

function SecretInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="form-input pr-9 w-64 text-xs"
      />
      <button
        onClick={() => setShow((s) => !s)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
      >
        {show ? <EyeOff size={13} /> : <Eye size={13} />}
      </button>
    </div>
  )
}

export default function Settings() {
  const [saved, setSaved] = useState(false)
  const [cfg, setCfg] = useState(() => {
    const local = localStorage.getItem('llm_center_settings')
    if (local) {
      try {
        return JSON.parse(local)
      } catch (e) {
        console.error(e)
      }
    }
    return {
      openaiKey: '',
      supabaseUrl: '',
      supabaseKey: '',
      slackWebhook: '',
      sendgridKey: '',
      regressionInterval: '15',
      hallucBatchSize: '5',
      alertEnabled: true,
      emailReportEnabled: false,
      prometheusEnabled: true,
      detectionThreshold: '0.05',
      regressionMinChange: '10',
    }
  })

  function set(key, val) {
    setCfg((c) => ({ ...c, [key]: val }))
  }

  const { isGuest } = useAuthStore()
  const { setAuthModalOpen } = useUIStore()

  function handleSave() {
    if (isGuest) {
      setAuthModalOpen(true)
      return
    }
    localStorage.setItem('llm_center_settings', JSON.stringify(cfg))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Layout title="Settings" subtitle="Pipeline configuration and API keys" showFilters={false}>
      <div className="max-w-3xl space-y-6">

        {/* API Keys */}
        <Card className="p-5">
          <SectionHeader title="API Keys" subtitle="Stored encrypted — never logged" />
          <div className="space-y-0">
            <SettingRow label="OpenAI API Key" description="Required for GPT-4o / GPT-4o-mini inference">
              <SecretInput value={cfg.openaiKey} onChange={(v) => set('openaiKey', v)} placeholder="sk-…" />
            </SettingRow>
            <SettingRow label="Supabase URL" description="Your Supabase project URL">
              <input value={cfg.supabaseUrl} onChange={(e) => set('supabaseUrl', e.target.value)}
                placeholder="https://xxx.supabase.co" className="form-input w-64 text-xs" />
            </SettingRow>
            <SettingRow label="Supabase Service Key">
              <SecretInput value={cfg.supabaseKey} onChange={(v) => set('supabaseKey', v)} placeholder="eyJ…" />
            </SettingRow>
            <SettingRow label="Slack Webhook URL" description="For regression alert notifications">
              <SecretInput value={cfg.slackWebhook} onChange={(v) => set('slackWebhook', v)} placeholder="https://hooks.slack.com/…" />
            </SettingRow>
            <SettingRow label="SendGrid API Key" description="For daily cost report emails">
              <SecretInput value={cfg.sendgridKey} onChange={(v) => set('sendgridKey', v)} placeholder="SG.…" />
            </SettingRow>
          </div>
        </Card>

        {/* Regression Detection */}
        <Card className="p-5">
          <SectionHeader title="Regression Detection" subtitle="Mann-Whitney U statistical test parameters" />
          <div className="space-y-0">
            <SettingRow label="Detection Interval" description="Minutes between regression checks">
              <div className="flex items-center gap-2">
                <input type="number" value={cfg.regressionInterval} onChange={(e) => set('regressionInterval', e.target.value)}
                  className="form-input w-20 text-xs" min="5" max="60" />
                <span className="text-xs text-slate-500">min</span>
              </div>
            </SettingRow>
            <SettingRow label="p-value Threshold" description="Flag if p < threshold (default 0.05)">
              <input type="number" value={cfg.detectionThreshold} onChange={(e) => set('detectionThreshold', e.target.value)}
                className="form-input w-24 text-xs" step="0.01" min="0" max="1" />
            </SettingRow>
            <SettingRow label="Min Relative Change" description="Minimum % change to trigger alert">
              <div className="flex items-center gap-2">
                <input type="number" value={cfg.regressionMinChange} onChange={(e) => set('regressionMinChange', e.target.value)}
                  className="form-input w-20 text-xs" />
                <span className="text-xs text-slate-500">%</span>
              </div>
            </SettingRow>
            <SettingRow label="Slack Alerts Enabled" description="Send alerts to Slack on regressions">
              <Toggle checked={cfg.alertEnabled} onChange={(v) => set('alertEnabled', v)} />
            </SettingRow>
            <SettingRow label="Daily Email Report" description="SendGrid digest email at midnight UTC">
              <Toggle checked={cfg.emailReportEnabled} onChange={(v) => set('emailReportEnabled', v)} />
            </SettingRow>
          </div>
        </Card>

        {/* Scorer Config */}
        <Card className="p-5">
          <SectionHeader title="Hallucination Scorer" subtitle="Ollama LLM-as-Judge configuration" />
          <div className="space-y-0">
            <SettingRow label="Async Batch Size" description="Semaphore concurrency limit for scoring">
              <input type="number" value={cfg.hallucBatchSize} onChange={(e) => set('hallucBatchSize', e.target.value)}
                className="form-input w-20 text-xs" min="1" max="20" />
            </SettingRow>
            <SettingRow label="Prometheus Metrics" description="Expose /metrics on port 8001">
              <Toggle checked={cfg.prometheusEnabled} onChange={(v) => set('prometheusEnabled', v)} />
            </SettingRow>
          </div>
        </Card>

        {/* Save */}
        <div className="flex justify-end">
          <button onClick={handleSave} className="btn-primary gap-2">
            {saved ? <><Check size={14} /> Saved!</> : 'Save Configuration'}
          </button>
        </div>
      </div>
    </Layout>
  )
}
