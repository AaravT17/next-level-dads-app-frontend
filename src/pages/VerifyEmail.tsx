import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import logo from '@/assets/logo.png'
import { ROUTES } from '@/lib/routes'

type VerificationState = 'loading' | 'success' | 'error'

const VerifyEmail = () => {
  const navigate = useNavigate()
  const [state, setState] = useState<VerificationState>('loading')
  const [countdown, setCountdown] = useState<number>(0)
  const [errorMessage, setErrorMessage] = useState<string>(
    'The verification link is invalid or has expired. Please try registering again.',
  )

  useEffect(() => {
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)

    const error = params.get('error')
    const errorDescription = params.get('error_description')
    const accessToken = params.get('access_token')
    const tokenType = params.get('token_type')
    const type = params.get('type')

    if (error) {
      setState('error')
      if (errorDescription) {
        setErrorMessage(decodeURIComponent(errorDescription.replace(/\+/g, ' ')))
      }
    } else if (
      accessToken &&
      tokenType === 'bearer' &&
      (type === 'signup' || type === 'email')
    ) {
      setState('success')
    } else {
      setState('error')
    }

    setCountdown(5)
    window.history.replaceState({}, document.title, ROUTES.VERIFY_EMAIL)
  }, [])

  useEffect(() => {
    if (state === 'loading' || countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          if (state === 'success') {
            navigate(ROUTES.LOGIN)
          } else {
            navigate(ROUTES.REGISTER)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [state, countdown, navigate])

  const handleManualRedirect = () => {
    if (state === 'success') {
      navigate(ROUTES.LOGIN)
    } else {
      navigate(ROUTES.REGISTER)
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
            {state === 'loading' && (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <h1 className="text-2xl font-heading font-semibold text-center text-foreground">
                  Verifying Email
                </h1>
                <p className="text-center text-muted-foreground">
                  Please wait while we verify your email address...
                </p>
              </div>
            )}

            {state === 'success' && (
              <div className="flex flex-col items-center space-y-4">
                <CheckCircle className="w-16 h-16 text-green-600" />
                <h1 className="text-2xl font-heading font-semibold text-center text-foreground">
                  Email Verified
                </h1>
                <p className="text-center text-muted-foreground">
                  Your email has been successfully verified. You can now log in
                  to your account.
                </p>
                <p className="text-center text-body text-muted-foreground">
                  Redirecting to login in {countdown} second
                  {countdown !== 1 ? 's' : ''}...
                </p>
                <Button
                  size="lg"
                  className="w-full rounded-full font-semibold text-base shadow-md"
                  onClick={handleManualRedirect}
                >
                  Go to Login
                </Button>
              </div>
            )}

            {state === 'error' && (
              <div className="flex flex-col items-center space-y-4">
                <XCircle className="w-16 h-16 text-red-600" />
                <h1 className="text-2xl font-heading font-semibold text-center text-foreground">
                  Verification Failed
                </h1>
                <p className="text-center text-muted-foreground">{errorMessage}</p>
                <p className="text-center text-body text-muted-foreground">
                  Redirecting to register in {countdown} second
                  {countdown !== 1 ? 's' : ''}...
                </p>
                <Button
                  size="lg"
                  className="w-full rounded-full font-semibold text-base shadow-md bg-destructive hover:bg-destructive/90"
                  onClick={handleManualRedirect}
                >
                  Go to Register
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default VerifyEmail
