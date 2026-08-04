import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminApi } from "../api/adminApi";
import type { OrganizationEvent } from "../types/admin";

export function OrganizationEventApprovalPage() {
    const { eventId } = useParams<{ eventId: string }>()
    const navigate = useNavigate()

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
                setEvent(data)
                setNotes(data.admin_notes?.text ?? '')
            })
            .catch(() => {
            setError('Failed to load organization event.')
            })
            .finally(() => {
                setLoading(false)
            })
    }, [eventId])
    
    
    setNotes('Example existing note')
  }, [])

    const submitDecision = async (status: 'pending' | 'approved' | 'denied') => {
        if (!eventId) return

        setSaving(true)
        setError(null)

        try {
            const result = await adminApi.decideOrganizationEvent(eventId, {
                status,
                admin_notes: notes.trim() ? notes.trim() : null,
            })

            setEvent((prev) =>
                prev
                    ?{
                        ...prev,
                        app_status: result.app_status,
                        admin_notes: result.admin_notes,
                    }
                    :prev,
        )

        if (result.admin_notes?.text) {
            setNotes(result.admin_notes.text)
        }
        } catch {
            setError('Failed to save decision.')
        } finally {
            setSaving(false)
        }
    }

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
                        <h1 className="text-center text-lg font-semibold">
                            Review Event Application
                        </h1>
                </div>
            </div>

            <div className="mx-auto max-w-3xl px-6 py-6">
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
                            className="min-h-28 w-full rounded-md border border-input bg-background px-3 p-2 text-sm"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add notes for this application..."
                            />
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={saving}
                                onClick={() => {
                                    submitDecision('pending')
                                }}
                            >
                                Save Notes
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
                                    submitDecision('denied')
                                }}
                            >
                                Deny
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}