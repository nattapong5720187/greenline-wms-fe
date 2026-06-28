import axios from 'axios'
import Cookies from 'js-cookie'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 15000,
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Flag to prevent multiple simultaneous refresh calls
let isRefreshing = false
let refreshQueue = []

function processQueue(error, token = null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token)
  })
  refreshQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const data = error.response?.data

    // Log ทุก error ออก console เพื่อ debug (Chrome DevTools Preview อาจไม่แสดง body ของ Fastify)
    if (status && status !== 401) {
      console.error(
        `[API ${status}] ${original?.method?.toUpperCase()} ${original?.url}`,
        data ?? error.message,
      )
    }

    // Only handle 401 and avoid infinite loop on the refresh endpoint itself
    if (status !== 401 || original._retry || original.url?.includes('/auth/refresh')) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const refreshToken = Cookies.get('refresh_token')
      if (!refreshToken) throw new Error('No refresh token')

      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/refresh`,
        { refreshToken },
      )

      const newAccess = data.accessToken
      Cookies.set('access_token', newAccess, { secure: true, sameSite: 'Lax' })
      if (data.refreshToken) {
        Cookies.set('refresh_token', data.refreshToken, { secure: true, sameSite: 'Lax' })
      }

      processQueue(null, newAccess)
      original.headers.Authorization = `Bearer ${newAccess}`
      return api(original)
    } catch (refreshError) {
      processQueue(refreshError, null)
      // Clear session and redirect to login
      Cookies.remove('access_token')
      Cookies.remove('refresh_token')
      Cookies.remove('gl_user')
      window.location.hash = '#/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)

export default api
