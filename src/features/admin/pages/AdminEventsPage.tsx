import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { adminOrganizationEvent } from '@/lib/routes'
import { adminApi } from '../api/adminApi'
import type {
  AdminEventListItem,
  AdminEventsMetrics,
} from '../types/admin'

const REGIONS = [
  'All Regions',
  'Toronto, ON',
  'Vancouver, BC',
  'Calgary, AB',
  'Montreal, QC',
  'Ottawa, ON',
  'Halifax, NS',
  'Waterloo, ON',
  'Mississauga, ON',
  'Online/National',
] as const

const FORMATS = ['All Formats', 'Online', 'In Person', 'Hybrid'] as const

const CATEGORIES = [
  'All Categories',
  'Parenting',
  'Wellness',
  'Recreation',
  'Support Group',
  'Education',
  'Community Meetup',
] as const

const STATUSES = [
  'All Status',
  'Pending',
  'Approved',
  'Needs Changes',
] as const

const MOCK_METRICS: AdminEventsMetrics = {
  total_rsvps_active: 128,
  dads_attended_completed: 86,
  event_attendance_rate: 0.72,
  repeat_attendee_rate: 0.34,
}

const MOCK_EVENTS: AdminEventListItem[] = [
  {
    id: 'evt-1',
    name: 'Dad & Tot Playgroup',
    organization_name: 'North York Family Centre',
    event_date: '2026-08-20T10:00:00Z',
    rsvps: 24,
    attended: 18,
    attendance_rate: 0.75,
    status: 'pending',
    region: 'Toronto, ON',
    format: 'in_person',
    category: 'Parenting',
  },
  {
    id: 'evt-2',
    name: 'Online Wellness Circle',
    organization_name: 'West Coast Dads',
    event_date: '2026-08-22T18:00:00Z',
    rsvps: 40,
    attended: 31,
    attendance_rate: 0.78,
    status: 'approved',
    region: 'Online/National',
    format: 'online',
    category: 'Wellness',
  },
  {
    id: 'evt-3',
    name: 'Community Soccer Meetup',
    organization_name: 'Calgary Fathers Network',
    event_date: '2026-08-25T17:30:00Z',
    rsvps: 16,
    attended: 9,
    attendance_rate: 0.56,
    status: 'needs_changes',
    region: 'Calgary, AB',
    format: 'hybrid',
    category: 'Recreation',
  },
]

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString()
}

function statusButtonClass(status: string) {
  const s = status.toLowerCase().split('_').join(' ')

  if (s.includes('approved')) {
    return 'border-green-600 bg-green-100 text-green-800 hover:bg-green-200'
  }
  if (s.includes('denied') || s.includes('rejected')) {
    return 'border-red-600 bg-red-100 text-red-800 hover:bg-red-200'
  }
  if (s.includes('pending')) {
    return 'border-yellow-500 bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
  }
  if (s.includes('needs')) {
    return 'border-orange-600 bg-orange-100 text-orange-800 hover:bg-orange-200'
  }

  return ''
}

export function AdminEventsPage() {
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('All Regions')
  const [organization, setOrganization] = useState('All Organizations')
  const [format, setFormat] = useState('All Formats')
  const [category, setCategory] = useState('All Categories')
  const [status, setStatus] = useState('All Status')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState(MOCK_METRICS) 
  const [events, setEvents] = useState(MOCK_EVENTS)

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    adminApi
      .getAdminEvents()
      .then((data) => {
        if (cancelled) return
        setMetrics(data.metrics)
        setEvents(data.events)
      })
      .catch(() => {
        if (cancelled) return
        setError('Failed to load events from API. Showing mock data.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])


  const organizations = useMemo(() => {
    const names = events.map((e) => e.organization_name)
    return ['All Organizations', ...Array.from(new Set(names))]
  }, [events])

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        !search ||
        event.name.toLowerCase().includes(search.toLowerCase()) ||
        event.organization_name.toLowerCase().includes(search.toLowerCase())

      const matchesRegion =
        region === 'All Regions' || event.region === region

      const matchesOrganization =
        organization === 'All Organizations' ||
        event.organization_name === organization

      const matchesFormat =
        format === 'All Formats' ||
        event.format?.split('_').join(' ').toLowerCase() ===
          format.toLowerCase()

      const matchesCategory =
        category === 'All Categories' || event.category === category

      const matchesStatus =
        status === 'All Status' ||
        event.status.split('_').join(' ').toLowerCase() ===
          status.toLowerCase()

      return (
        matchesSearch &&
        matchesRegion &&
        matchesOrganization &&
        matchesFormat &&
        matchesCategory &&
        matchesStatus
      )
    })
  }, [events, search, region, organization, format, category, status])

  return (
      <div className="mx-auto max-w-6xl space-y-6 px-6 py-6">
        <h1 className=' text-5xl font-semibold'>Events</h1>
        {loading && <p className='text-sm text-muted-foreground'>Loading events...</p>}
        {error && <p className='text-sm text-destructive'>{error}</p>}

        {/* Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Total RSVPs (Active Events)
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {metrics.total_rsvps_active}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Dads Attended (Completed)
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {metrics.dads_attended_completed}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Event Attendance Rate
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatPercent(metrics.event_attendance_rate)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Repeat Attendee Rate
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {formatPercent(metrics.repeat_attendee_rate)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Search Events</h2>
          <div className="flex flex-wrap gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm"
                    placeholder="Search events..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
               </div>

            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              {REGIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            >
              {organizations.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              {FORMATS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">RSVPs</th>
                <th className="px-4 py-3 font-medium">Attended</th>
                <th className="px-4 py-3 font-medium">Rate</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id} className="border-b border-border">
                    <td className="px-4 py-3">
                    <div className="font-medium">{event.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                        {[event.region, event.format?.split('_').join(' '), event.category]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                    </td>
                    <td className="px-4 py-3">{event.organization_name}</td>
                    <td className="px-4 py-3">{formatDate(event.event_date)}</td>
                    <td className="px-4 py-3">{event.rsvps}</td>
                    <td className="px-4 py-3">
                    {event.attended > 0 ? event.attended : '—'}
                    </td>
                    <td className="px-4 py-3">
                    {event.attendance_rate > 0
                        ? formatPercent(event.attendance_rate)
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className={statusButtonClass(event.status)}
                        onClick={() => navigate(adminOrganizationEvent(event.id))}
                    >
                        {(() => {
                            const label = 
                                event.status === 'rejected'
                                ?'denied'
                                : event.status.split('_').join(' ')
                                return label.charAt(0).toUpperCase() + label.slice(1)
                        })()}
                    </Button>
                    </td>
                </tr>
              ))}
              {filteredEvents.length === 0 && (
                <tr>
                  <td
                    className="px-4 py-6 text-center text-muted-foreground"
                    colSpan={7}
                  >
                    No events match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
    </div>
  )
}