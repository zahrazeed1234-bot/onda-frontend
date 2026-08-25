import axios from 'axios'
import { toast } from 'react-toastify'

const API_BASE = '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
})

api.interceptors.request.use(
  (config) => {
    const access = localStorage.getItem('access_token')
    if (access) {
      config.headers.Authorization = `Bearer ${access}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

let refreshPromise = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error?.config
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (!refresh) {
        logoutUser()
        return Promise.reject(error)
      }
      if (!refreshPromise) {
        refreshPromise = axios.post(`${API_BASE}/auth/token/refresh/`, { refresh })
      }
      try {
        const { data } = await refreshPromise
        localStorage.setItem('access_token', data.access)
        if (data.refresh) localStorage.setItem('refresh_token', data.refresh)
        original.headers.Authorization = `Bearer ${data.access}`
        return api.request(original)
      } catch {
        logoutUser()
        return Promise.reject(error)
      } finally {
        refreshPromise = null
      }
    }
    if (error.response?.status >= 400 && !original?.silent) {
      const detail = error.response?.data?.detail
      if (detail && typeof detail === 'string') {
        toast.error(detail)
      } else if (error.response?.data) {
        const messages = Object.entries(error.response.data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' ; ')
        if (messages) toast.error(messages.slice(0, 200))
      }
    }
    return Promise.reject(error)
  },
)

export function logoutUser() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('user_info')
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

export function apiErrorHandler(error, fallback = 'Erreur serveur') {
  const detail = error?.response?.data?.detail
  return typeof detail === 'string' ? detail : fallback
}

export default api
