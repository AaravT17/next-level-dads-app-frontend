import { Button } from '@/components/ui/button'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { AppLogo } from '@/components/layout/AppLogo'
import { ROUTES } from '@/lib/routes'
import { supabaseAuth } from '@/lib/supabase'
import { toastError } from '@/lib/toast'
import { useEffect, useState } from 'react'
import axiosPublic from '@/api/axiosPublic'
import { setAccessToken } from '@/api/axiosPrivate'
import { fetchMe } from '@/api/me'
import { getErrorMessage } from '@/utils/errors'
import { loadProfile } from '@/lib/loadProfile'
import { useAuth } from '../contexts/useAuth'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'

const Welcome = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const { setAuth } = useAuth()
  const redirectTo = searchParams.get('redirectTo')
  const validRedirectTo = redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
    ? redirectTo
    : null

  // Runs once, against the OAuth fragment the provider redirected back with.
  //
  // The old `if (isLoading) return` guard was dead here: isLoading starts false
  // and the effect only runs at mount.
  //
  // What keeps it single-run is that this screen lives at exactly one path.
  // setAuth is memoised in AuthProvider, but navigate is *not* stable — under
  // <BrowserRouter> useNavigate carries locationPathname in its own dependency
  // array, so its identity changes whenever the path does. That never happens
  // while Welcome is mounted, and the replaceState below clears the fragment
  // without telling the router. Do not lift this effect onto a screen whose
  // path can change underneath it: a re-run would POST the same tokens to
  // /api/auth/oauth/session a second time.
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const hash = window.location.hash
      if (!hash.includes('access_token')) return

      // Read redirectTo from search params before replaceState clears the URL
      const oauthSearchParams = new URLSearchParams(window.location.search)
      const oauthRedirectTo = oauthSearchParams.get('redirectTo')
      const validOauthRedirectTo =
        oauthRedirectTo && oauthRedirectTo.startsWith('/') && !oauthRedirectTo.startsWith('//')
          ? oauthRedirectTo
          : null

      // Parse tokens from hash (format: #access_token=xxx&refresh_token=xxx&...)
      const params = new URLSearchParams(hash.substring(1))
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')

      if (!access_token || !refresh_token) {
        toastError('Sign in failed', 'Invalid OAuth response.')
        return
      }

      setIsLoading(true)
      let accessToken: string | null = null
      let role: string | null = null
      try {
        const res = await axiosPublic.post(
          '/api/auth/oauth/session',
          { access_token, refresh_token },
          { timeout: TIMEOUT_LENGTH_MS },
        )

        // clear hash from URL
        window.history.replaceState({}, '', '/')

        accessToken = res.data.access_token
        role = res.data.role ?? null
        setAccessToken(accessToken)

        // Fetch the profile before committing auth state. A ghost role has none to
        // fetch, and an account that has not been set up yet is sent to setup.
        const profile = await loadProfile(role, fetchMe)
        if (profile.kind === 'no-profile') {
          // commit the token so SetupRoute allows access
          setAuth({ user: null, accessToken, role })
          navigate(ROUTES.SETUP)
          return
        }
        setAuth({ user: profile.kind === 'member' ? profile.user : null, accessToken, role })
        navigate(validOauthRedirectTo ?? ROUTES.HOME_AFTER_AUTH)
      } catch (err) {
        setAccessToken(null)
        toastError(
          'Sign in failed',
          getErrorMessage(err, 'An error occurred during Google sign in.'),
        )
      } finally {
        setIsLoading(false)
      }
    }

    handleOAuthCallback()
  }, [navigate, setAuth])

  const handleGoogleOAuth = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const oauthRedirectUrl = new URL(`${import.meta.env.VITE_FRONTEND_BASE_URL}/`)
      if (validRedirectTo) {
        oauthRedirectUrl.searchParams.set('redirectTo', validRedirectTo)
      }
      const { error } = await supabaseAuth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: oauthRedirectUrl.toString(),
        },
      })
      if (error) {
        throw error
      }
    } catch {
      toastError('Sign in failed', 'An error occurred while signing in with Google.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
    >
      <div className="w-full max-w-md space-y-8 animate-fade-in text-center px-6">
        <div className="flex justify-center mt-12 mb-8">
          <AppLogo className="w-[95%] h-auto" />
        </div>

        <div className="space-y-3">
          <p
            className="text-2xl font-semibold text-foreground"
          >
            Empowering Fathers.
            <br />
            Building Community.
          </p>
        </div>

        <div className="pt-6 space-y-3">
          <Button
            size="lg"
            className="w-full rounded-md font-semibold text-base bg-accent text-white hover:shadow-lg transition-shadow"
            onClick={() =>
              navigate(
                validRedirectTo
                  ? `${ROUTES.LOGIN}?redirectTo=${encodeURIComponent(validRedirectTo)}`
                  : ROUTES.LOGIN,
              )
            }
            disabled={isLoading}
          >
            <Mail className="w-5 h-5 mr-2" />
            Continue with Email
          </Button>

          <Button
            size="lg"
            className="w-full rounded-md font-semibold text-base bg-white hover:bg-white text-black border border-gray-300 hover:shadow-lg transition-shadow"
            onClick={handleGoogleOAuth}
            disabled={isLoading}
          >
            <svg
              className="w-5 h-5 mr-2"
              viewBox="0 0 24 24"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Welcome
