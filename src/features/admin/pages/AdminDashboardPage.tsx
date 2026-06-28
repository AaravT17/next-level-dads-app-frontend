import { useState } from 'react'
import { ArrowLeft, FileText, MessageSquare, Shield, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ReportsTab } from '../components/ReportsTab'

type DashboardTab = 'posts' | 'messages' | 'users'

const TABS: { id: DashboardTab; label: string; icon: React.ElementType }[] = [
  { id: 'posts', label: 'Posts', icon: FileText },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'users', label: 'Users', icon: User },
]

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const [active, setActive] = useState<DashboardTab>('posts')

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card px-6 py-5">
        <div className="mx-auto grid max-w-3xl grid-cols-[auto_1fr] items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="flex items-center justify-center gap-3 text-center">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">Moderation Center</h1>
          </div>
        </div>
      </div>

      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-6">
          <nav className="flex justify-center gap-1" aria-label="Admin sections">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActive(id)}
                className={cn(
                  'flex min-w-28 items-center justify-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                  active === id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-6">
        <ReportsTab queue={active} />
      </div>
    </div>
  )
}
