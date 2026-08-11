import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { adminApi } from "../api/adminApi";
import type { OrganizationEvent, OrganizationEventAdminNotes } from "../types/admin";

function parseAdminNotes(value: unknown): OrganizationEventAdminNotes | null {
  if (!value) return null
  if (typeof value === 'object') {
    return value as OrganizationEventAdminNotes
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as OrganizationEventAdminNotes
    } catch {
      return null
    }
  }
  return null
}

export function OrganizationEventApprovalPage() {
    const { eventId } = useParams<{ eventId: string }>()

    const [event, setEvent] = useState<OrganizationEvent | null>(null)
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
  if (!eventId) return

  setLoading(true)
  setError(null)

  adminApi
    .getOrganizationEvent(eventId)
    .then((data) => {
      const notesObj = parseAdminNotes(data.admin_notes)
      setEvent({
        ...data,
        admin_notes: notesObj,
      })
      setNotes(notesObj?.text ?? '')
    })
    .catch(() => {
      setError('Failed to load organization event.')
    })
    .finally(() => {
      setLoading(false)
    })
}, [eventId])
    
    

    const submitDecision = async (status: 'pending' | 'approved' | 'rejected') => {
  if (!eventId) return

  setSaving(true)
  setError(null)

  try {
    const result = await adminApi.decideOrganizationEvent(eventId, {
      status,
      admin_notes: notes.trim() ? notes.trim() : null,
    })

    const notesObj = parseAdminNotes(result.admin_notes)

    setEvent((prev) =>
      prev
        ? {
            ...prev,
            app_status: result.app_status,
            admin_notes: notesObj,
          }
        : prev,
    )
    setNotes(notesObj?.text ?? '')
  } catch {
    setError('Failed to save decision.')
  } finally {
    setSaving(false)
  }
}

    return (
        <div className="mx-auto max-w-3xl space-y-4 px-6 py-6">
            <h1 className="text-5xl font-semibold">Review Event Application</h1>

            {loading && <p>Loading...</p>}
            {error && <p className="text-destructive">{error}</p>}

            {!loading && !error && event && (
            <div className="space-y-4">
                <div>
                <h2 className="text-xl font-semibold">{event.name}</h2>
                <p className="text-sm text-muted-foreground">
                    Status: {event.app_status}
                </p>
                </div>

                <p>{event.description}</p>

                <div className="grid gap-2 text-sm">
                <p><span className="font-medium">Type:</span> {event.type}</p>
                <p><span className="font-medium">Starts:</span> {event.starts_at}</p>
                <p><span className="font-medium">Ends:</span> {event.ends_at}</p>
                <p><span className="font-medium">Location:</span> {event.location}</p>
                <p><span className="font-medium">Email:</span> {event.contact_email ?? '-'}</p>
                <p><span className="font-medium">Phone:</span> {event.contact_phone ?? '-'}</p>
                <p><span className="font-medium">Price:</span> {event.price_cad ?? '-'}</p>
                </div>

                <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="admin-notes">
                    Admin Notes
                </label>
                <textarea
                    id="admin-notes"
                    className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add notes for this application..."
                />
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={saving || !event}
                        onClick={() => {
                            const currentStatus =
                                event?.app_status === 'approved' ||
                                event?.app_status === 'rejected' ||
                                event?.app_status === 'pending'
                                ? event.app_status
                                : 'pending'

                            submitDecision(currentStatus)
                        }}
                    >
                        Save Notes
                    </Button>
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={saving}
                        onClick={() => submitDecision('pending')}
                        >
                            Return to Pending
                        </Button>
                    <Button
                        type="button"
                        disabled={saving}
                        onClick={() => {
                            submitDecision('approved')
                        }}
                    >
                        Approve
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={saving}
                        onClick={() => {
                            submitDecision('rejected')
                        }}
                    >
                        Deny
                    </Button>
                </div>
            </div>
        )}
        </div>
    )
}