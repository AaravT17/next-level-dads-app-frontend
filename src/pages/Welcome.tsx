import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import logo from '@/assets/logo.png'
import { ROUTES } from '@/lib/routes'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/use-toast'
import { useEffect, useState } from 'react'
import axiosPublic from '@/api/axiosPublic'
import axiosPrivate, { setAccessToken } from '@/api/axiosPrivate'
import { useAuth } from '../contexts/AuthContext'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'

const Welcome = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const { setAuth } = useAuth()

  useEffect(() => {
    const handleOAuthCallback = async () => {
      if (isLoading) return

      const hash = window.location.hash
      if (!hash.includes('access_token')) return

      // Parse tokens from hash (format: #access_token=xxx&refresh_token=xxx&...)
      const params = new URLSearchParams(hash.substring(1))
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')

      if (!access_token || !refresh_token) {
        toast({
          title: 'Sign in failed',
          description: 'Invalid OAuth response.',
          variant: 'destructive',
        })
        return
      }

      setIsLoading(true)
      let accessToken: string | null = null
      try {
        const res = await axiosPublic.post(
          '/api/auth/oauth/session',
          { access_token, refresh_token },
          { timeout: TIMEOUT_LENGTH_MS },
        )

        // clear hash from URL
        window.history.replaceState({}, '', '/')

        accessToken = res.data.access_token
        setAccessToken(accessToken)

        // fetch user profile before committing auth state
        const userRes = await axiosPrivate.get('/api/users/me', {
          timeout: TIMEOUT_LENGTH_MS,
        })
        setAuth({
          user: {
            id: userRes.data.id,
            name: userRes.data.name,
            age: userRes.data.age,
            date_of_birth: userRes.data.date_of_birth,
            city: userRes.data.city,
            province: userRes.data.province,
            about: userRes.data.about,
            avatarUrl: userRes.data.avatar_url,
            interests: userRes.data.interests,
            children_age_ranges: userRes.data.children,
            isAdmin: userRes.data.is_admin ?? false,
            preferences: {
              marketing_emails_opt_in: userRes.data.preferences?.marketing_emails_opt_in ?? false,
            },
            legal_acceptances: {
              terms: userRes.data.legal_acceptances?.terms ?? false,
              privacy_policy: userRes.data.legal_acceptances?.privacy_policy ?? false,
            },
          },
          accessToken,
        })
        navigate(ROUTES.DISCOVER)
      } catch (err: any) {
        if (err.response?.status === 404) {
          // no profile yet — commit token so SetupRoute allows access
          setAuth({ user: null, accessToken })
          navigate(ROUTES.SETUP)
          return
        }
        setAccessToken(null)
        toast({
          title: 'Sign in failed',
          description: 'An error occurred during Google sign in.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    handleOAuthCallback()
  }, [])

  const handleGoogleOAuth = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${import.meta.env.VITE_FRONTEND_BASE_URL}`,
        },
      })
      if (error) {
        throw error
      }
    } catch (err) {
      toast({
        title: 'Sign in failed',
        description: 'An error occurred while signing in with Google.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#EFE8DC' }}
    >
      <div className="w-full max-w-md space-y-8 animate-fade-in text-center px-6">
        <div className="flex justify-center mt-12 mb-8">
          <img
            src={logo}
            alt="Next Level Dads"
            className="w-[95%] h-auto"
          />
        </div>

        <div className="space-y-3">
          <p
            className="text-2xl font-semibold"
            style={{ color: '#000000' }}
          >
            Empowering Fathers.
            <br />
            Building Community.
          </p>
        </div>

        <div className="pt-6 space-y-3">
          <Button
            size="lg"
            className="w-full rounded-full font-semibold text-base bg-accent text-white hover:shadow-lg transition-shadow"
            onClick={() => navigate(ROUTES.LOGIN)}
            disabled={isLoading}
          >
            <Mail className="w-5 h-5 mr-2" />
            Continue with Email
          </Button>

          <Button
            size="lg"
            className="w-full rounded-full font-semibold text-base bg-white hover:bg-white text-black border border-gray-300 hover:shadow-lg transition-shadow"
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
