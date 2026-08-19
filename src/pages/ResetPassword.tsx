import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff, XCircle } from 'lucide-react'
import logo from '@/assets/logo.png'
import { ROUTES } from '@/lib/routes'
import { toastError, toastSuccess } from '@/lib/toast'
import { MIN_PASSWORD_LENGTH } from '@/config/constants'
import { supabase } from '@/lib/supabase'
import { isStrongPassword } from '@/utils/auth'

const ResetPassword = () => {
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

  // Manually handle recovery tokens since detectSessionInUrl is disabled
  useEffect(() => {
    const initRecoverySession = async () => {
      const hash = window.location.hash
      const params = new URLSearchParams(hash.substring(1))

      // Check for error from Supabase (e.g., expired link)
      const error = params.get('error')

      if (error) {
        // Clear hash from URL
        window.history.replaceState({}, document.title, ROUTES.RESET_PASSWORD)
        setLinkError('This reset link is invalid or has expired. Please request a new password reset link.')
        return
      }

      if (!hash.includes('access_token')) {
        // No recovery tokens - user navigated here directly
        setLinkError('No reset link detected. Please request a password reset from the login page.')
        return
      }

      // Parse tokens from hash
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')

      // Clear hash from URL
      window.history.replaceState({}, document.title, ROUTES.RESET_PASSWORD)

      if (!access_token || !refresh_token) {
        setLinkError('Invalid reset link. Please request a new password reset link.')
        return
      }

      // Establish Supabase session with recovery tokens
      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      })

      if (sessionError) {
        setLinkError('This reset link is invalid or has expired. Please request a new password reset link.')
        return
      }

      setSessionReady(true)
    }

    initRecoverySession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return
    if (!newPassword || !confirmPassword) {
      toastError('Missing fields', 'Please fill in all fields.')
      return
    }
    if (newPassword !== confirmPassword) {
      toastError('Passwords do not match', 'Please make sure your passwords match.')
      return
    }
    if (!isStrongPassword(newPassword)) {
      toastError('Weak password', `Password must be at least ${MIN_PASSWORD_LENGTH} characters long and include uppercase letters, lowercase letters, numbers, and special characters.`)
      return
    }
    setIsLoading(true)
    try {
      let res: any = await supabase.auth.updateUser({
        password: newPassword,
      })
      if (res.error) {
        throw res.error
      }
      res = await supabase.auth.signOut()
      if (res.error) {
        throw res.error
      }
      window.history.replaceState({}, document.title, ROUTES.RESET_PASSWORD) // clear query params from URL
      toastSuccess('Password reset successful', 'Your password has been reset.')
      navigate(ROUTES.LOGIN)
    } catch (err: any) {
      toastError('Password reset failed', err.message || 'An error occurred while resetting your password.')
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
            {linkError ? (
              <div className="flex flex-col items-center space-y-4">
                <XCircle className="w-16 h-16 text-red-600" />
                <h1 className="text-2xl font-heading font-semibold text-center text-foreground">
                  Unable to Reset Password
                </h1>
                <p className="text-center text-muted-foreground">{linkError}</p>
                <Button
                  size="lg"
                  className="w-full rounded-md font-semibold text-base shadow-md"
                  onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
                >
                  Request New Link
                </Button>
                <p className="text-center text-body text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.LOGIN)}
                    className="font-semibold text-primary hover:underline"
                  >
                    Back to Login
                  </button>
                </p>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-heading font-semibold text-center text-foreground">
                  Reset Password
                </h1>

                <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label
                  htmlFor="newPassword"
                  className="text-label font-medium text-foreground"
                >
                  New Password
                </label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="rounded-md pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? (
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
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="rounded-md pr-10"
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
                className="w-full rounded-md font-semibold text-base shadow-md"
                disabled={isLoading || !sessionReady}
              >
                {sessionReady ? 'Reset Password' : 'Loading...'}
              </Button>
            </form>

            <p className="text-center text-body text-muted-foreground">
              <button
                type="button"
                onClick={() => navigate(ROUTES.LOGIN)}
                className="font-semibold text-primary hover:underline"
                disabled={isLoading}
              >
                Back to Login
              </button>
            </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ResetPassword
