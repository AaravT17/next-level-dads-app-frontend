import { Calendar, MapPin, Users, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { formatEventDate, formatEventTime, formatPrice } from '@/utils/format'
import { Card, CardContent } from './ui/card'
import { toastError } from '@/lib/toast'
import { eventDetail } from '@/lib/routes'
import axiosPrivate from '@/api/axiosPrivate'
import type { Event } from '@/types/events'

const EventCard = ({
  id,
  name,
  description,
  type,
  starts_at,
  ends_at,
  location,
  price_cad,
  attendee_count,
  is_attending,
}: Event) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const handleCardClick = () => {
    navigate(eventDetail(id))
  }

  /**
   * Patch attendance in place rather than dropping the card from the list.
   * See CommunityCard for why: both scopes share one cache namespace now, so
   * removing the item would make it vanish as you click it.
   */
  const updateAttendanceInCache = (isAttending: boolean) => {
    queryClient.setQueriesData<InfiniteData<Event[]>>(
      { queryKey: ['events'] },
      (oldData) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map((page) =>
            page.map((event) =>
              event.id === id
                ? {
                    ...event,
                    is_attending: isAttending,
                    attendee_count: Math.max(
                      0,
                      event.attendee_count + (isAttending ? 1 : -1),
                    ),
                  }
                : event,
            ),
          ),
        }
      },
    )

    queryClient.invalidateQueries({ queryKey: ['events', 'joined'] })

    // Remove detail page cache so it fetches fresh on navigation
    queryClient.removeQueries({ queryKey: ['event', id] })
  }

  // POST /api/events/{id}/attendees - Register for event
  const registerForEvent = useMutation({
    mutationFn: () => axiosPrivate.post(`/api/events/${id}/attendees`),
    onSuccess: () => {
      updateAttendanceInCache(true)
    },
    onError: (err: AxiosError) => {
      if (err.response?.status === 403) {
        toastError('Paid Event', 'This is a paid event. Please register through the event page.')
      } else if (err.response?.status === 404) {
        toastError('Not Found', 'This event could not be found.')
      } else {
        toastError('Failed to register for event. Please try again.')
      }
    },
  })

  // DELETE /api/events/{id}/attendees - Unregister from event
  const unregisterFromEvent = useMutation({
    mutationFn: () => axiosPrivate.delete(`/api/events/${id}/attendees`),
    onSuccess: () => {
      updateAttendanceInCache(false)
    },
    onError: (err: AxiosError) => {
      toastError('Failed to unregister from event. Please try again.')
    },
  })

  const handleRegister = () => {
    registerForEvent.mutate()
  }

  const handleUnregister = () => {
    unregisterFromEvent.mutate()
  }

  return (
    <Card
      className="overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-6 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-subhead font-heading font-semibold text-foreground">
            {name}
          </h3>
          <Badge variant="outline" className="shrink-0">
            {type}
          </Badge>
        </div>

        {description && (
          <p className="text-body text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4 shrink-0" />
            <span>{formatEventDate(starts_at)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4 shrink-0" />
            <span>
              {formatEventTime(starts_at)}
              {ends_at && ` - ${formatEventTime(ends_at)}`}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0" />
            <span>{location}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-foreground">
              {formatPrice(price_cad)}
            </span>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span className="text-sm">{attendee_count} attending</span>
            </div>
          </div>

          <Button
            variant={is_attending ? 'outline' : 'default'}
            className="rounded-md"
            onClick={(e) => {
              e.stopPropagation()
              if (is_attending) {
                handleUnregister()
              } else {
                handleRegister()
              }
            }}
          >
            {is_attending ? 'Unregister' : 'Register'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default EventCard
