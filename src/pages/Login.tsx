import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'
import logo from '@/assets/logo.png'
import { ROUTES } from '@/lib/routes'
import axiosPublic from '@/api/axiosPublic'
import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import { useAuth } from '../contexts/AuthContext'
import validator from 'validator'
import { useToast } from '@/components/ui/use-toast'

const Login = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
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
      toast({
        title: 'Missing fields',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      })
      return
    }
    if (!validator.isEmail(trimmedEmail)) {
      toast({
        title: 'Invalid email address',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      })
      return
    }
    setIsLoading(true)
    try {
      const res = await axiosPublic.post(
        '/api/auth/login',
        { email: trimmedEmail, password },
        { timeout: TIMEOUT_LENGTH_MS },
      )
      const accessToken = res.data.access_token
      setAuth({ user: null, accessToken }) // user profile data will be fetched in a separate call after this

      // fetch user profile
      const userRes = await axiosPrivate.get('/api/users/me', {
        timeout: TIMEOUT_LENGTH_MS,
      })
      setAuth({
        user: {
          id: userRes.data.id,
          name: userRes.data.name,
          age: userRes.data.age,
          city: userRes.data.city,
          province: userRes.data.province,
          about: userRes.data.about,
          avatarUrl: userRes.data.avatar_url,
          interests: userRes.data.interests,
          children_age_ranges: userRes.data.children,
          isAdmin: userRes.data.is_admin ?? false,
        },
        accessToken,
      })
      toast({
        title: 'Login successful',
        description: 'Welcome back!',
      })
      navigate(ROUTES.DISCOVER)
    } catch (err: any) {
      if (err.response?.status === 404) {
        // user exists but profile not set up
        navigate(ROUTES.SETUP)
        return
      }
      toast({
        title: 'Login failed',
        description:
          err.response?.data?.detail ||
          'An error occurred while logging in. Please try again.',
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
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="flex justify-center">
          <img
            src={logo}
            alt="Next Level Dads"
            className="w-48 h-auto"
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
                  className="text-sm font-medium text-foreground"
                >
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-full"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
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
                    className="rounded-full pr-10"
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
                className="w-full rounded-full font-semibold text-base shadow-md"
                style={{ backgroundColor: '#D8A24A' }}
                disabled={isLoading}
              >
                Login
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate(ROUTES.REGISTER)}
                className="font-semibold hover:underline"
                style={{ color: '#D8A24A' }}
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
