import { useState } from 'react'
import { FileText, MessageSquare, Shield, User } from 'lucide-react'
import { AppBar } from '@/components/layout/AppBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { cn } from '@/lib/utils'
import { ReportsTab } from '../components/ReportsTab'

type DashboardTab = 'posts' | 'messages' | 'users'

const TABS: { id: DashboardTab; label: string; icon: React.ElementType }[] = [
  { id: 'posts', label: 'Posts', icon: FileText },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'users', label: 'Users', icon: User },
]

export function AdminDashboardPage() {
  const [active, setActive] = useState<DashboardTab>('posts')

  return (
    <>
      <AppBar
        title="Moderation Center"
        leading="back"
        actions={<Shield aria-hidden className="h-5 w-5 text-primary" />}
      />

      <div className="shrink-0 border-b border-border bg-card">
        <nav className="flex justify-center gap-1" aria-label="Admin sections">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              aria-current={active === id ? 'page' : undefined}
              className={cn(
                'flex min-w-24 items-center justify-center gap-1.5 border-b-2 px-4 py-3 text-label transition-colors',
                active === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon aria-hidden className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <PageContainer className="animate-fade-in">
        <ReportsTab queue={active} />
      </PageContainer>
    </>
  )
}
