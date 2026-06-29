import apiClient from './client'

/**
 * Analytics Service
 * Endpoints: /api/v1/analytics/*
 */
export const analyticsService = {
  /**
   * GET /api/v1/analytics/kpis
   * Returns top-level KPI metrics for the overview page.
   * @param {Object} params - { model?: string[], start_date?: string, end_date?: string }
   * @returns {Promise<{
   *   total_calls: number, total_calls_change_pct: number,
   *   avg_latency_ms: number, avg_latency_change_pct: number,
   *   total_cost_usd: number, total_cost_change_pct: number,
   *   avg_hall_score: number, avg_hall_score_change: number
   * }>}
   */
  getKPIs(params = {}) {
    return apiClient.get('/analytics/kpis', { params })
  },

  /**
   * GET /api/v1/analytics/trends
   * Returns daily aggregated metrics for trend charts.
   * @param {Object} params - { model?: string[], days?: number }
   * @returns {Promise<Array<{ date: string, calls: number, avg_latency_ms: number, cost_usd: number, avg_hall_score: number }>>}
   */
  getTrends(params = {}) {
    return apiClient.get('/analytics/trends', { params })
  },

  /**
   * GET /api/v1/analytics/model-comparison
   * Returns per-model performance breakdown.
   * @returns {Promise<Array<{ model: string, calls: number, avg_latency_ms: number, p95_latency_ms: number, cost_usd: number, error_rate: number, avg_hall_score: number }>>}
   */
  getModelComparison(params = {}) {
    return apiClient.get('/analytics/model-comparison', { params })
  },

  /**
   * GET /api/v1/analytics/latency-distribution
   * Returns histogram buckets for latency distribution chart.
   */
  getLatencyDistribution(params = {}) {
    return apiClient.get('/analytics/latency-distribution', { params })
  },

  /**
   * GET /api/v1/analytics/advanced
   * Returns extended analytics including cost breakdown, token efficiency, etc.
   */
  getAdvanced(params = {}) {
    return apiClient.get('/analytics/advanced', { params })
  },
}
