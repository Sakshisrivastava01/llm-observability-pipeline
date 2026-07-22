import axios from 'axios'
import { useUIStore } from '@/store'

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

// Request interceptor — attach auth token if present
apiClient.interceptors.request.use(
  (config) => {
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

    // 503 Auto-retry (up to 3 times, waiting 10 seconds between attempts)
    if (error.response?.status === 503 && config) {
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
