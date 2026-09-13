import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Check, HandHeart, PartyPopper, Users } from 'lucide-react'
import { ROUTES } from '@/lib/routes'
import { useAuth } from '@/contexts/useAuth'

const highlights = [
  { icon: Users, title: 'Dads to connect with', copy: 'Matched on your stage, goals and interests.' },
  { icon: HandHeart, title: 'Communities to join', copy: 'Built around what you actually care about.' },
  { icon: PartyPopper, title: 'Things to do', copy: 'Meetups and events near you.' },
]

const OnboardingWelcome = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0]

  // Auto-redirect after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => navigate(ROUTES.HOME_AFTER_AUTH), 5000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md sm:max-w-lg md:max-w-2xl flex-col justify-center px-6 py-12">
        <div className="animate-fade-in space-y-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-lg bg-gradient-gold shadow-lg">
            <Check className="h-10 w-10 text-primary-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-semibold leading-tight text-foreground">
              You're in{firstName ? `, ${firstName}` : ''}.
            </h1>
            <p className="text-lg text-muted-foreground">Welcome to Next Level Dads.</p>
            <p className="pt-1 text-base font-medium text-foreground">Let's find your people.</p>
          </div>

          <div className="space-y-3 text-left">
            {highlights.map((h, i) => (
              <div
                key={h.title}
                className="flex animate-fade-in items-center gap-3 rounded-lg bg-card p-4 shadow-sm"
                style={{ animationDelay: `${150 + i * 120}ms`, animationFillMode: 'backwards' }}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <h.icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">{h.title}</span>
                  <span className="block text-xs text-muted-foreground">{h.copy}</span>
                </span>
              </div>
            ))}
          </div>

          <Button
            size="lg"
            className="w-full rounded-md bg-gradient-gold text-base font-semibold shadow-md"
            onClick={() => navigate(ROUTES.HOME_AFTER_AUTH)}
          >
            Start exploring
          </Button>
          <p className="text-xs text-muted-foreground">
            You can fine-tune your profile any time, no rush.
          </p>
        </div>
      </div>
    </div>
  )
}

export default OnboardingWelcome
