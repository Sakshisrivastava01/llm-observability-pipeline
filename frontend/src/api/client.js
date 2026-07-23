import axios from 'axios'
import { useUIStore, useAuthStore } from '@/store'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: {
    indexes: null,
  },
})

function getGuestMockResponse(config) {
  const url = config.url || ''
  
  if (url.includes('/health')) {
    return { status: 'healthy' }
  }
  
  if (url.includes('/analytics/kpis')) {
    return {
      total_calls: 14250,
      total_calls_change_pct: 12.4,
      avg_latency_ms: 324,
      avg_latency_change_pct: -4.2,
      total_cost_usd: 12.48,
      total_cost_change_pct: 8.1,
      avg_hall_score: 1.24,
      avg_hall_score_change: -0.15
    }
  }
  
  if (url.includes('/analytics/trends')) {
    return [
      { date: '2026-07-16', calls: 1200, avg_latency_ms: 310, cost_usd: 1.12, avg_hall_score: 1.1, prompt_tokens: 120000, completion_tokens: 80000 },
      { date: '2026-07-17', calls: 1500, avg_latency_ms: 340, cost_usd: 1.45, avg_hall_score: 1.3, prompt_tokens: 150000, completion_tokens: 110000 },
      { date: '2026-07-18', calls: 1800, avg_latency_ms: 320, cost_usd: 1.62, avg_hall_score: 1.25, prompt_tokens: 180000, completion_tokens: 130000 },
      { date: '2026-07-19', calls: 1400, avg_latency_ms: 290, cost_usd: 1.28, avg_hall_score: 1.2, prompt_tokens: 140000, completion_tokens: 95000 },
      { date: '2026-07-20', calls: 2100, avg_latency_ms: 330, cost_usd: 1.95, avg_hall_score: 1.4, prompt_tokens: 210000, completion_tokens: 155000 },
      { date: '2026-07-21', calls: 2400, avg_latency_ms: 305, cost_usd: 2.15, avg_hall_score: 1.15, prompt_tokens: 240000, completion_tokens: 170000 },
      { date: '2026-07-22', calls: 2850, avg_latency_ms: 315, cost_usd: 2.56, avg_hall_score: 1.24, prompt_tokens: 285000, completion_tokens: 195000 }
    ]
  }
  
  if (url.includes('/analytics/model-comparison')) {
    return [
      { model: 'gpt-4o-mini', calls: 8200, avg_latency_ms: 280, p95_latency_ms: 650, p50_latency_ms: 220, p99_latency_ms: 980, cost_usd: 7.45, cost_per_1k: 0.00015, error_rate: 0.012, avg_hall_score: 1.05, avg_tokens: 340 },
      { model: 'mistral', calls: 4100, avg_latency_ms: 420, p95_latency_ms: 980, p50_latency_ms: 350, p99_latency_ms: 1420, cost_usd: 3.82, cost_per_1k: 0.00025, error_rate: 0.035, avg_hall_score: 1.48, avg_tokens: 580 },
      { model: 'llama3', calls: 1950, avg_latency_ms: 190, p95_latency_ms: 420, p50_latency_ms: 150, p99_latency_ms: 680, cost_usd: 1.21, cost_per_1k: 0.00008, error_rate: 0.008, avg_hall_score: 1.12, avg_tokens: 420 }
    ]
  }
  
  if (url.includes('/analytics/latency-distribution')) {
    return [
      { bucket: 100, count: 2400 },
      { bucket: 200, count: 5200 },
      { bucket: 300, count: 3800 },
      { bucket: 400, count: 1800 },
      { bucket: 500, count: 650 },
      { bucket: 1000, count: 320 },
      { bucket: 2000, count: 80 }
    ]
  }
  
  if (url.includes('/analytics/advanced')) {
    return {
      recent_alerts: [
        { severity: 'MEDIUM', model: 'gpt-4o-mini', metric: 'latency_p95', pct_change: 14.5, created_at: new Date().toISOString() },
        { severity: 'HIGH', model: 'mistral', metric: 'error_rate', pct_change: 22.4, created_at: new Date(Date.now() - 3600000).toISOString() }
      ],
      total_tokens: 1284500,
      avg_prompt_tokens: 450,
      avg_completion_tokens: 280
    }
  }
  
  if (url.includes('/traces/export')) {
    const csvContent = 'run_id,model,latency_ms,total_tokens,cost_usd,hall_score\ntrace-1,gpt-4o-mini,320,450,0.000067,1.2\ntrace-2,mistral,520,680,0.00017,2.4'
    return new Blob([csvContent], { type: 'text/csv' })
  }
  
  if (url.match(/\/traces\/[a-zA-Z0-9-]+$/)) {
    const id = url.split('/').pop()
    return {
      run_id: id,
      model: 'gpt-4o-mini',
      latency_ms: 320,
      total_tokens: 450,
      cost_usd: 0.000067,
      hall_score: 1.2,
      name: 'inference_pipeline',
      start_time: new Date(Date.now() - 10000).toISOString(),
      end_time: new Date().toISOString(),
      input_data: { prompt: 'Identify potential regressions in the model\'s output compared to baseline ratings.' },
      output_data: { response: 'No significant regressions detected. Average quality remains within the standard threshold.' },
      spans: [
        { span_id: 'span-1', name: 'prompt_template', model_name: 'system', total_tokens: 50, cost: 0.0 },
        { span_id: 'span-2', name: 'llm_call', model_name: 'gpt-4o-mini', total_tokens: 400, cost: 0.000067 }
      ],
      evaluations: [
        { id: 'eval-1', metric_name: 'hallucination', metric_value: 1.2, feedback: 'Coherent output, aligned with context.' }
      ]
    }
  }
  
  if (url.includes('/traces')) {
    return {
      items: [
        { run_id: 'trace-91f82b8c-5221-432d-944a-e4566c3a63f1', model: 'gpt-4o-mini', latency_ms: 320, total_tokens: 450, cost_usd: 0.000067, hall_score: 1.2, status: 'OK', finish_reason: 'stop', created_at: new Date().toISOString() },
        { run_id: 'trace-82a17f8b-1132-482a-821f-f123d456a78b', model: 'mistral', latency_ms: 520, total_tokens: 680, cost_usd: 0.00017, hall_score: 2.4, status: 'WARN', finish_reason: 'stop', created_at: new Date(Date.now() - 120000).toISOString() },
        { run_id: 'trace-731b8f8c-291e-4cb2-bb8a-e999c1a5b88c', model: 'llama3', latency_ms: 180, total_tokens: 320, cost_usd: 0.000025, hall_score: 0.8, status: 'OK', finish_reason: 'stop', created_at: new Date(Date.now() - 360000).toISOString() },
        { run_id: 'trace-642c8d7e-821f-4ef2-990a-a821e2c1c3f2', model: 'gpt-4o-mini', latency_ms: 1250, total_tokens: 1450, cost_usd: 0.000217, hall_score: 4.1, status: 'HIGH', finish_reason: 'length', created_at: new Date(Date.now() - 720000).toISOString() },
        { run_id: 'trace-531e2f8c-293d-4c3e-bb4a-a431c2a5d99c', model: 'mistral', latency_ms: 440, total_tokens: 580, cost_usd: 0.000145, hall_score: 1.8, status: 'OK', finish_reason: 'stop', created_at: new Date(Date.now() - 1000000).toISOString() }
      ],
      total: 5, page: 1, page_size: 25, pages: 1
    }
  }
  
  if (url.includes('/evaluations/hallucination-scores')) {
    return [
      { score_bucket: '0-1', count: 420 },
      { score_bucket: '1-2', count: 280 },
      { score_bucket: '2-3', count: 150 },
      { score_bucket: '3-4', count: 60 },
      { score_bucket: '4-5', count: 20 }
    ]
  }
  
  if (url.includes('/evaluations/hallucination-trend')) {
    return [
      { date: '2026-07-16', avg_score: 1.15 },
      { date: '2026-07-17', avg_score: 1.22 },
      { date: '2026-07-18', avg_score: 1.08 },
      { date: '2026-07-19', avg_score: 1.31 },
      { date: '2026-07-20', avg_score: 1.24 },
      { date: '2026-07-21', avg_score: 1.18 },
      { date: '2026-07-22', avg_score: 1.24 }
    ]
  }
  
  if (url.includes('/evaluations/worst-responses')) {
    return [
      { run_id: 'trace-642c8d7e-821f-4ef2-990a-a821e2c1c3f2', model: 'gpt-4o-mini', score: 4.1, reasoning: 'Output deviates from provided ground-truth reference materials regarding the historical census dates.', judge_model: 'mistral', created_at: new Date().toISOString() },
      { run_id: 'trace-772b8f8c-291e-4cb2-bb8a-e999c1a5b88c', model: 'mistral', score: 3.8, reasoning: 'Judge flagged hallucinated names in the response payload.', judge_model: 'mistral', created_at: new Date(Date.now() - 360000).toISOString() }
    ]
  }
  
  if (url.includes('/evaluations')) {
    return {
      items: [
        { dataset: 'squad_v2_validation', judge_model: 'mistral', f1_score: 0.812, precision: 0.840, recall: 0.786, threshold: 2.5, run_date: '2026-07-21T23:50:00Z' },
        { dataset: 'squad_v2_validation', judge_model: 'mistral', f1_score: 0.795, precision: 0.825, recall: 0.768, threshold: 2.5, run_date: '2026-07-20T23:50:00Z' }
      ]
    }
  }
  
  if (url.includes('/alerts')) {
    return {
      items: [
        { id: 'alert-1', severity: 'HIGH', model: 'gpt-4o-mini', metric: 'latency_p95', baseline_value: 450.0, current_value: 680.0, pct_change: 51.1, p_value: 0.012, resolved: false, created_at: new Date().toISOString() },
        { id: 'alert-2', severity: 'CRITICAL', model: 'mistral', metric: 'error_rate', baseline_value: 0.015, current_value: 0.082, pct_change: 446.6, p_value: 0.003, resolved: false, created_at: new Date(Date.now() - 360000).toISOString() }
      ],
      total: 2,
      severity_counts: { CRITICAL: 1, HIGH: 1, MEDIUM: 0, LOW: 0 }
    }
  }
  
  if (url.includes('/models')) {
    return ['gpt-4o-mini', 'mistral', 'llama3']
  }
}

// Request interceptor — attach auth token if present
apiClient.interceptors.request.use(
  (config) => {
    try {
      const isGuest = useAuthStore.getState().isGuest
      if (isGuest && !config.url.includes('/auth/login') && !config.url.includes('/auth/register')) {
        const mockResponse = getGuestMockResponse(config)
        if (mockResponse) {
          return Promise.resolve({
            data: mockResponse,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          })
        }
      }
    } catch (e) {
      console.warn('Guest intercept error', e)
    }

    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const config = error.config
    const isAuth = config?.url?.includes('/auth') || config?.url?.includes('/login')

    // 503 Auto-retry (up to 3 times, waiting 10 seconds between attempts)
    if (error.response?.status === 503 && config && !isAuth) {
      if (!config._retry) {
        config._retry = true
        config._retryCount = 1
      } else {
        config._retryCount += 1
      }

      if (config._retryCount <= 3) {
        console.log(`Service unavailable (503). Retrying in 10s (attempt ${config._retryCount}/3)...`)
        try {
          useUIStore.getState().addNotification({
            title: 'Service Waking Up',
            message: `Observability database starting up. Retrying attempt ${config._retryCount}/3...`,
            type: 'info'
          })
        } catch (e) {
          console.warn(e)
        }
        await new Promise((resolve) => setTimeout(resolve, 10000))
        return apiClient(config)
      }
    }

    let message = 'An unexpected error occurred'
    if (error.response?.status === 503) {
      message = 'Service starting up, retrying in 10s...'
    } else if (error.response?.status === 404) {
      message = `Endpoint not found: ${config?.url || 'unknown endpoint'}`
    } else if (error.message === 'Network Error' || !error.response) {
      message = 'Backend is waking up, please wait...'
    } else {
      message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred'
    }

    const normalised = {
      status: error.response?.status,
      message,
      original: error,
    }

    // Redirect to login on 401
    if (error.response?.status === 401) {
      console.error('401 Unauthorized', error.response);
      return Promise.reject(error)
    }

    // Dispatch error notification to the drawer
    try {
      useUIStore.getState().addNotification({
        title: error.response?.status === 503 ? 'Service Starting' : 'API Connection Error',
        message: message,
        type: 'error'
      })
    } catch (e) {
      console.warn(e)
    }

    return Promise.reject(normalised)
  }
)

export default apiClient
