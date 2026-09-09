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

let refreshPromise: Promise<string> | null = null

/**
 * Refresh the access token, collapsing concurrent callers onto one request.
 *
 * The refresh token rotates server-side, so a second concurrent call presents
 * one that has already been spent and fails. That matters because nothing
 * arrives alone: Home mounts the feed, two suggestion queries, the resume rail
 * and the nav badges at once, so an expired token produced five parallel
 * refreshes -- the first succeeded and the rest got 401, each calling
 * onAuthFailure and logging the user out mid-session.
 *
 * Everyone needing a refresh awaits the same promise, cleared once it settles
 * so the next expiry starts a fresh one.
 */
export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${import.meta.env.VITE_BACKEND_BASE_URL || ''}/api/auth/refresh`,
        {},
        { withCredentials: true },
      )
      .then((res) => {
        const newToken = res.data.access_token as string
        authCallbacks?.onTokenRefresh(newToken)
        return newToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

axiosPrivate.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._isRetry) {
      error.config._isRetry = true
      try {
        const newToken = await refreshAccessToken()
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
