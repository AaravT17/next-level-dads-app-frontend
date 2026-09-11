import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'
import logo from '@/assets/logo.png'
import { ROUTES } from '@/lib/routes'
import { toastError, toastSuccess } from '@/lib/toast'
import axiosPublic from '@/api/axiosPublic'
import { MIN_PASSWORD_LENGTH } from '@/config/constants'
import validator from 'validator'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import { isStrongPassword } from '@/utils/auth'

const Register = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password || !confirmPassword) {
      toastError('Missing fields', 'Please fill in all fields.')
      return
    }
    if (!validator.isEmail(trimmedEmail)) {
      toastError('Invalid email address', 'Please enter a valid email address.')
      return
    }
    if (password !== confirmPassword) {
      toastError('Passwords do not match', 'Please make sure both password fields match.')
      return
    }
    if (!isStrongPassword(password)) {
      toastError('Weak password', `Password must be at least ${MIN_PASSWORD_LENGTH} characters long and include uppercase letters, lowercase letters, numbers, and special characters.`)
      return
    }
    try {
      setIsLoading(true)
      const res = await axiosPublic.post(
        '/api/auth/register',
        {
          email: trimmedEmail,
          password,
        },
        {
          timeout: TIMEOUT_LENGTH_MS,
        },
      )
      toastSuccess('Registration successful', res.data.detail)
      navigate(ROUTES.LOGIN)
    } catch (err: any) {
      toastError('Registration failed', err.response?.data?.detail ||
          'Something went wrong. Please try again later.')
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
            className="w-48 h-auto"
          />
        </div>

        <Card className="shadow-md">
          <CardContent className="p-6 space-y-6">
            <h1 className="text-2xl font-heading font-semibold text-center text-foreground">
              Create Account
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
                  className="rounded-full"
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

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="text-label font-medium text-foreground"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="rounded-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full rounded-full font-semibold text-base shadow-md"
                disabled={isLoading}
              >
                Create Account
              </Button>
            </form>

            <p className="text-center text-body text-muted-foreground">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => navigate(ROUTES.LOGIN)}
                className="font-semibold text-primary hover:underline"
                disabled={isLoading}
              >
                Login
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Register
