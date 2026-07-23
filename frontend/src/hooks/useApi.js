import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Generic async data fetching hook.
 * @param {Function} fetchFn - Async function that returns data
 * @param {Array} deps - Dependency array (re-fetches when changed)
 * @param {Object} options
 */
export function useApi(fetchFn, deps = [], options = {}) {
  const { immediate = true, onSuccess, onError, cacheKey } = options

  const [data, setData] = useState(() => {
    if (cacheKey) {
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) return JSON.parse(cached)
      } catch (e) {
        console.warn('Failed to parse cache for', cacheKey, e)
      }
    }
    return null
  })
  const [loading, setLoading] = useState(immediate && !data)
  const [error, setError] = useState(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchFn(...args)
      if (mountedRef.current) {
        setData(result)
        if (cacheKey && result) {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(result))
          } catch (e) {
            console.warn('Failed to save cache for', cacheKey, e)
          }
        }
        onSuccess?.(result)
      }
      return result
    } catch (err) {
      if (mountedRef.current) {
        setError(err)
        onError?.(err)
      }
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    if (immediate) execute()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute])

  return { data, loading, error, refetch: execute }
}

/**
 * Paginated data fetching hook.
 */
export function usePaginatedApi(fetchFn, params = {}, deps = []) {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(params.page_size || 20)

  const { data, loading, error, refetch } = useApi(
    () => fetchFn({ ...params, page, page_size: pageSize }),
    [page, ...deps]
  )

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    pages: data?.pages ?? 0,
    page,
    pageSize,
    loading,
    error,
    setPage,
    refetch,
  }
}
