import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatEventDate, formatEventTime, formatPrice, mailtoHref, telHref } from '@/utils/format'
import { Card, CardContent } from '@/components/ui/card'
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  User,
  Mail,
  Phone,
} from 'lucide-react'
import { AppBar } from '@/components/layout/AppBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { CenteredSpinner } from '@/components/feedback/Spinner'
import { EmptyState } from '@/components/feedback/EmptyState'
import { toastError } from '@/lib/toast'
import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import type { Event } from '@/types/events'

async function fetchEvent(id: string): Promise<Event> {
  const res = await axiosPrivate.get<Event>(`/api/events/${id}`, {
    timeout: TIMEOUT_LENGTH_MS,
  })
  return res.data
}

const EventDetail = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const {
    data: event,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => fetchEvent(eventId!),
    enabled: !!eventId,
    staleTime: 0, // Always fresh fetch
  })

  // Update list caches when event is fetched
  const updateEventInLists = (event: Event) => {
    // One namespace now: patch the row in place instead of removing it from
    // whichever list the viewer was not looking at.
    queryClient.setQueriesData<InfiniteData<Event[]>>(
      { queryKey: ['events'] },
      (oldData) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map((page) =>
            page.map((e) => (e.id === eventId ? { ...e, ...event } : e)),
          ),
        }
      },
    )

    // The joined list genuinely changes membership, so let it refetch.
    queryClient.invalidateQueries({ queryKey: ['events', 'joined'] })
  }

  // Update list caches when event is fetched
  useEffect(() => {
    if (event) {
      updateEventInLists(event)
    }
  }, [event])

  const handleBack = () => {
    navigate(-1)
  }

  // Update attendance status in all caches (from detail page)
  const updateAttendanceInCache = (isAttending: boolean) => {
    const countDelta = isAttending ? 1 : -1

    // Update event cache (is_attending, attendee_count)
    queryClient.setQueryData<Event>(['event', eventId], (oldData) => {
      if (!oldData) return oldData
      return {
        ...oldData,
        is_attending: isAttending,
        attendee_count: oldData.attendee_count + countDelta,
      }
    })

    // One namespace: patch in place so the card stays where the viewer
    // found it and only its button changes.
    queryClient.setQueriesData<InfiniteData<Event[]>>(
      { queryKey: ['events'] },
      (oldData) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          pages: oldData.pages.map((page) =>
            page.map((e) =>
              e.id === eventId
                ? {
                    ...e,
                    is_attending: isAttending,
                    attendee_count: e.attendee_count + countDelta,
                  }
                : e,
            ),
          ),
        }
      },
    )

    queryClient.invalidateQueries({ queryKey: ['events', 'joined'] })
  }

  // POST /api/events/{id}/attendees - Register for event
  const registerForEvent = useMutation({
    mutationFn: () => axiosPrivate.post(`/api/events/${eventId}/attendees`),
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
    mutationFn: () => axiosPrivate.delete(`/api/events/${eventId}/attendees`),
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

  const getHostDisplay = () => {
    if (!event) return null
    if (event.hosted_by_org_name) return event.hosted_by_org_name
    if (event.hosted_by_user_id) return 'A community member'
    if (event.hosted_by_community_id) return 'Community event'
    return null
  }

  if (isLoading) {
    return (
      <>
        <AppBar title="Event Details" leading="back" onBack={handleBack} />
        <PageContainer>
          <CenteredSpinner label="Loading event" />
        </PageContainer>
      </>
    )
  }

  if (isError || !event) {
    return (
      <>
        <AppBar title="Event Not Found" leading="back" onBack={handleBack} />
        <PageContainer>
          <EmptyState
            title="This event could not be found."
            description="It may have been removed or the link may be out of date."
            action={{ label: 'Go back', onClick: handleBack }}
          />
        </PageContainer>
      </>
    )
  }

  const hostDisplay = getHostDisplay()

  return (
    <>
      <AppBar title="Event Details" leading="back" onBack={handleBack} />

      <PageContainer className="animate-fade-in">
        <Card className="overflow-hidden shadow-lg">
          <CardContent className="p-6 space-y-6">
            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-xl font-heading font-bold text-foreground">
                  {event.name}
                </h2>
                <Badge
                  variant="outline"
                  className="shrink-0"
                >
                  {event.type}
                </Badge>
              </div>

              {event.description && (
                <p className="text-muted-foreground">{event.description}</p>
              )}
            </div>

            {/* Event Details */}
            <div className="space-y-3 py-4 border-y border-border">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-caption text-muted-foreground">Date</p>
                  <p className="text-body font-medium text-foreground">
                    {formatEventDate(event.starts_at)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-caption text-muted-foreground">Time</p>
                  <p className="text-body font-medium text-foreground">
                    {formatEventTime(event.starts_at)}
                    {event.ends_at && ` - ${formatEventTime(event.ends_at)}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-caption text-muted-foreground">Location</p>
                  <p className="text-body font-medium text-foreground">
                    {event.location}
                  </p>
                </div>
              </div>

              {hostDisplay && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-primary mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-caption text-muted-foreground">Hosted by</p>
                    <p className="text-body font-medium text-foreground">
                      {hostDisplay}
                    </p>
                    {(event.contact_email || event.contact_phone) && (
                      <div className="pt-1 space-y-1">
                        {event.contact_email && (
                          <a
                            href={mailtoHref(event.contact_email)}
                            className="flex items-center gap-2 text-caption text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            {event.contact_email}
                          </a>
                        )}
                        {event.contact_phone && (
                          <a
                            href={telHref(event.contact_phone)}
                            className="flex items-center gap-2 text-caption text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {event.contact_phone}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Price and Attendance */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {formatPrice(event.price_cad)}
                </p>
                <p className="text-caption text-muted-foreground">Entry fee</p>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-5 h-5" />
                <span className="text-sm">{event.attendee_count} attending</span>
              </div>
            </div>

            {/* Registration Status */}
            {event.is_attending && (
              <div className="bg-primary/10 rounded-lg p-4 text-center">
                <p className="text-body font-medium text-primary">
                  You're registered for this event
                </p>
              </div>
            )}

            {/* Action Button */}
            <Button
              className="w-full rounded-md"
              variant={event.is_attending ? 'outline' : 'default'}
              size="lg"
              onClick={event.is_attending ? handleUnregister : handleRegister}
            >
              {event.is_attending ? 'Unregister from Event' : 'Register for Event'}
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    </>
  )
}

export default EventDetail
