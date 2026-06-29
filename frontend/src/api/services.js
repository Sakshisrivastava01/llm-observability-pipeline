import apiClient from './client'

/**
 * Alerts Service
 * Endpoints: /api/v1/alerts
 */
export const alertsService = {
  /**
   * GET /api/v1/alerts
   * Returns regression alerts, optionally filtered.
   * @param {Object} params - { model?: string[], severity?: string[], resolved?: boolean, page?: number }
   */
  getAlerts(params = {}) {
    return apiClient.get('/alerts', { params })
  },

  /**
   * GET /api/v1/alerts/:id
   */
  getAlert(id) {
    return apiClient.get(`/alerts/${id}`)
  },

  /**
   * PATCH /api/v1/alerts/:id/resolve
   */
  resolveAlert(id) {
    return apiClient.patch(`/alerts/${id}/resolve`)
  },
}

/**
 * Evaluations Service
 * Endpoints: /api/v1/evaluations
 */
export const evaluationsService = {
  /**
   * GET /api/v1/evaluations
   * Returns evaluation run history.
   */
  getEvaluations(params = {}) {
    return apiClient.get('/evaluations', { params })
  },

  /**
   * GET /api/v1/evaluations/hallucination-scores
   * Returns per-model hallucination score distributions.
   */
  getHallucinationScores(params = {}) {
    return apiClient.get('/evaluations/hallucination-scores', { params })
  },

  /**
   * GET /api/v1/evaluations/hallucination-trend
   * Returns hallucination score trend over time.
   */
  getHallucinationTrend(params = {}) {
    return apiClient.get('/evaluations/hallucination-trend', { params })
  },

  /**
   * GET /api/v1/evaluations/worst-responses
   * Returns top N worst-scoring trace responses.
   */
  getWorstResponses(params = { limit: 10 }) {
    return apiClient.get('/evaluations/worst-responses', { params })
  },
}

/**
 * Models Service
 * Endpoints: /api/v1/models
 */
export const modelsService = {
  /**
   * GET /api/v1/models
   * Returns list of available/tracked models.
   */
  getModels() {
    return apiClient.get('/models')
  },

  /**
   * GET /api/v1/models/:model/metrics
   */
  getModelMetrics(model, params = {}) {
    return apiClient.get(`/models/${encodeURIComponent(model)}/metrics`, { params })
  },
}

/**
 * Auth Service
 */
export const authService = {
  /**
   * POST /api/v1/auth/login
   */
  login(credentials) {
    return apiClient.post('/auth/login', credentials)
  },

  /**
   * POST /api/v1/auth/logout
   */
  logout() {
    return apiClient.post('/auth/logout')
  },

  /**
   * GET /api/v1/auth/me
   */
  getMe() {
    return apiClient.get('/auth/me')
  },
}
