import axios from 'axios'
import { AuthCallbacks } from '../types/auth'

const axiosPrivate = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_BASE_URL || '',
  withCredentials: true,
})

let accessToken: string | null = null

let authCallbacks: AuthCallbacks | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export function getAuthCallbacks(): AuthCallbacks | null {
  return authCallbacks
}

export function registerAuthCallbacks(callbacks: AuthCallbacks) {
  authCallbacks = callbacks
}

axiosPrivate.interceptors.request.use((config) => {
  if (!config.headers['Authorization'] && accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`
  }
  return config
})

axiosPrivate.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._isRetry) {
      error.config._isRetry = true
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_BACKEND_BASE_URL || ''}/api/auth/refresh`,
          {},
          { withCredentials: true },
        )
        const newToken = res.data.access_token
        authCallbacks?.onTokenRefresh(newToken)
        error.config.headers['Authorization'] = `Bearer ${newToken}`
        return axiosPrivate(error.config)
      } catch {
        authCallbacks?.onAuthFailure()
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  },
)

export default axiosPrivate
