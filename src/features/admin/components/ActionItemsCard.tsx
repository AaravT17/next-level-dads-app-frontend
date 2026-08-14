import { Link } from 'react-router-dom'
import { differenceInCalendarDays } from 'date-fns'
import { ArrowRight } from 'lucide-react'
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
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Action Items</CardTitle>
          <CardDescription>
            Items waiting for admin review.
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
                  <Badge variant="outline">
                    Application
                  </Badge>

                  <p className="font-medium">
                    {item.name}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <Badge variant="secondary">
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