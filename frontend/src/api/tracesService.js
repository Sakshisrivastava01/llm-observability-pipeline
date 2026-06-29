import apiClient from './client'

/**
 * Traces Service
 * Endpoints: /api/v1/traces
 */
export const tracesService = {
  /**
   * GET /api/v1/traces
   * Returns paginated trace records.
   * @param {Object} params - {
   *   page?: number, page_size?: number,
   *   model?: string[], start_date?: string, end_date?: string,
   *   min_latency_ms?: number, max_latency_ms?: number,
   *   min_hall_score?: number, max_hall_score?: number,
   *   finish_reason?: string
   * }
   * @returns {Promise<{ items: Trace[], total: number, page: number, page_size: number, pages: number }>}
   */
  getTraces(params = {}) {
    return apiClient.get('/traces', { params })
  },

  /**
   * GET /api/v1/traces/:id
   * Returns a single trace with full detail including hallucination score.
   */
  getTrace(id) {
    return apiClient.get(`/traces/${id}`)
  },

  /**
   * POST /api/v1/traces
   * Creates a new trace record (used by instrumentation layer).
   * @param {Object} payload
   */
  createTrace(payload) {
    return apiClient.post('/traces', payload)
  },

  /**
   * GET /api/v1/traces/export
   * Returns CSV export of filtered traces.
   */
  exportTraces(params = {}) {
    return apiClient.get('/traces/export', {
      params,
      responseType: 'blob',
    })
  },
}
