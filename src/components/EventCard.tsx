import { Calendar, MapPin, Users, Clock } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { formatEventDate, formatEventTime, formatPrice } from '@/utils/format'
import { Card, CardContent } from './ui/card'
import { useToast } from '@/hooks/use-toast'
import { eventDetail } from '@/lib/routes'
import axiosPrivate from '@/api/axiosPrivate'
import type { Event } from '@/types/events'

type ListContext = 'discover' | 'groups'

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
  const location_ = useLocation()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Determine which list context we're in based on route
  const getListContext = (): ListContext => {
    const { pathname } = location_
    if (pathname.startsWith('/groups')) return 'groups'
    return 'discover'
  }

  const listContext = getListContext()

  const handleCardClick = () => {
    navigate(eventDetail(id))
  }

  // Update attendance status in current list's cache only (from card)
  const updateAttendanceInCache = (isAttending: boolean) => {
    if (listContext === 'discover') {
      // Remove from discover cache (user just registered)
      queryClient.setQueriesData<InfiniteData<Event[]>>(
        { queryKey: ['discover', 'events'] },
        (oldData) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            pages: oldData.pages.map((page) =>
              page.filter((event) => event.id !== id),
            ),
          }
        },
      )
    } else {
      // Remove from groups cache (user just unregistered)
      queryClient.setQueriesData<InfiniteData<Event[]>>(
        { queryKey: ['groups', 'events'] },
        (oldData) => {
          if (!oldData) return oldData
          return {
            ...oldData,
            pages: oldData.pages.map((page) =>
              page.filter((event) => event.id !== id),
            ),
          }
        },
      )
    }

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
        toast({
          title: 'Paid Event',
          description: 'This is a paid event. Please register through the event page.',
          variant: 'destructive',
        })
      } else if (err.response?.status === 404) {
        toast({
          title: 'Not Found',
          description: 'This event could not be found.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Error',
          description: 'Failed to register for event. Please try again.',
          variant: 'destructive',
        })
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
      toast({
        title: 'Error',
        description: 'Failed to unregister from event. Please try again.',
        variant: 'destructive',
      })
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
          <h3 className="text-lg font-heading font-semibold text-foreground">
            {name}
          </h3>
          <Badge variant="outline" className="shrink-0">
            {type}
          </Badge>
        </div>

        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
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
            className="rounded-full"
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
