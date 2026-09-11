import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'
import logo from '@/assets/logo.png'
import { ROUTES } from '@/lib/routes'
import axiosPublic from '@/api/axiosPublic'
import axiosPrivate, { setAccessToken } from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import { useAuth } from '../contexts/AuthContext'
import { isValidEmail } from '@/utils/auth'
import { toastError, toastSuccess } from '@/lib/toast'
import { getErrorMessage, isHttpStatus } from '@/utils/errors'

const Login = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { setAuth } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      toastError('Missing fields', 'Please fill in all fields.')
      return
    }
    if (!isValidEmail(trimmedEmail)) {
      toastError('Invalid email address', 'Please enter a valid email address.')
      return
    }
    setIsLoading(true)
    let accessToken: string | null = null
    try {
      const res = await axiosPublic.post(
        '/api/auth/login',
        { email: trimmedEmail, password },
        { timeout: TIMEOUT_LENGTH_MS },
      )
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
      toastSuccess('Login successful', 'Welcome back!')
      navigate(ROUTES.HOME_AFTER_AUTH)
    } catch (err) {
      if (isHttpStatus(err, 404)) {
        // user exists but profile not set up — commit token so SetupRoute allows access
        setAuth({ user: null, accessToken })
        navigate(ROUTES.SETUP)
        return
      }
      setAccessToken(null)
      toastError(
        'Login failed',
        getErrorMessage(err, 'An error occurred while logging in. Please try again.'),
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
    >
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="flex justify-center">
          <img
            src={logo}
            alt="Next Level Dads"
            className="app-logo w-48 h-auto"
          />
        </div>

        <Card className="shadow-md">
          <CardContent className="p-6 space-y-6">
            <h1 className="text-2xl font-heading font-semibold text-center text-foreground">
              Login
            </h1>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-label font-medium text-foreground"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-md"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-label font-medium text-foreground"
                >
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-md pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
                  className="text-sm text-muted-foreground hover:underline"
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full rounded-md font-semibold text-base shadow-md"
                disabled={isLoading}
              >
                Login
              </Button>
            </form>

            <p className="text-center text-body text-muted-foreground">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate(ROUTES.REGISTER)}
                className="font-semibold text-primary hover:underline"
                disabled={isLoading}
              >
                Register
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Login
