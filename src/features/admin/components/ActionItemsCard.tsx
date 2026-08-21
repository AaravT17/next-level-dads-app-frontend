import { Link } from 'react-router-dom'
import { differenceInCalendarDays } from 'date-fns'
import { ArrowRight, ClipboardCheck } from 'lucide-react'
import { OrganizationActionItem } from '@/features/organizations/types/organizations.ts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ROUTES, adminOrganizationDetail } from '@/lib/routes'


interface ActionItemsCardProps {
  actionItems: OrganizationActionItem[]
  isLoading: boolean
  isError: boolean
}

export function ActionItemsCard({
  actionItems,
  isLoading,
  isError,
}: ActionItemsCardProps) {
  const getWaitingDays = (createdAt: string) => {
    const days = differenceInCalendarDays(new Date(), new Date(createdAt))
    return `Waiting ${days} ${days === 1 ? 'day' : 'days'}`
  }

  return (
    <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="flex flex-row items-start justify-between bg-[hsl(var(--muted)/0.25)]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ClipboardCheck className="h-4 w-4 bg-foreground text-background" />
          </div>

          <CardTitle>Action Items</CardTitle>

          <CardDescription className="mt-1 flex items-center gap-2">
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-semibold text-accent-foreground">
              {actionItems.length}
            </span>
            
            <span>items pending review.</span>
          </CardDescription>
        </div>

        <Button variant="outline" asChild>
          <Link to={ROUTES.ADMIN_ORGANIZATIONS}>
            View all
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading && (
          <p className="px-6 py-4 text-sm text-muted-foreground">
            Loading action items...
          </p>
        )}

        {isError && (
          <p className="px-6 py-4 text-sm text-destructive">
            Could not load action items.
          </p>
        )}

        {!isLoading && !isError && actionItems.length === 0 && (
          <p className="px-6 py-4 text-sm text-muted-foreground">
            No items need review.
          </p>
        )}

        {!isLoading && !isError && actionItems.length > 0 && (
          <div>
            {actionItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-4 border-t px-6 py-4"
              >
                <div className="flex items-center gap-4">
                  <Badge variant="soft">
                    Application
                  </Badge>

                  <p className="font-medium">
                    {item.name}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <Badge variant="outline">
                    {getWaitingDays(item.created_at)}
                  </Badge>

                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    aria-label={`Review ${item.name}`}
                  >
                    <Link to={adminOrganizationDetail(item.id)}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}