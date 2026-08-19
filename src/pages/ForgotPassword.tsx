import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import logo from '@/assets/logo.png'
import { ROUTES } from '@/lib/routes'
import { toastError, toastSuccess } from '@/lib/toast'
import validator from 'validator'
import { supabase } from '@/lib/supabase'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      toastError('Missing email', 'Please enter your email address.')
      return
    }
    if (!validator.isEmail(trimmedEmail)) {
      toastError('Invalid email address', 'Please enter a valid email address.')
      return
    }
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        trimmedEmail,
        {
          redirectTo: `${import.meta.env.VITE_FRONTEND_BASE_URL}${ROUTES.RESET_PASSWORD}`,
        },
      )
      if (error) {
        throw error
      }
      toastSuccess('Reset link sent', 'Please check your email for the password reset link.')
    } catch (err: any) {
      toastError(err.message || 'An error occurred while sending the reset link.')
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
              Forgot Password
            </h1>

            <p className="text-body text-muted-foreground">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>

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

              <Button
                type="submit"
                size="lg"
                className="w-full rounded-md font-semibold text-base shadow-md"
                disabled={isLoading}
              >
                Send Reset Link
              </Button>
            </form>

            <p className="text-center text-body text-muted-foreground">
              Remember your password?{' '}
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

export default ForgotPassword
