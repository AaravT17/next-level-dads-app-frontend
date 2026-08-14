import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { InternalNote, OrganizationStatus } from '../types/organizations'
import { useAddInternalNote } from '../hooks/useAddInternalNote'

interface InternalNotesSectionProps {
  organizationId: string
  status: OrganizationStatus
  notes: InternalNote[]
  onDirtyChange?: (isDirty: boolean) => void
}

export function InternalNotesSection({
  organizationId,
  status,
  notes,
  onDirtyChange,
}: InternalNotesSectionProps) {
  const [draft, setDraft] = useState('')
  const canAddNotes = status === 'pending'
  const hasChanges = draft.trim().length > 0
  const { mutate: addInternalNote, isPending, isError, error } = useAddInternalNote()
  const handleSave = () => {
    const content = draft.trim()
    if (!content) {
      return
    }
    addInternalNote({organizationId, content},
      {onSuccess: () => {setDraft('')}}
    )
  }

  useEffect(() => {
    if (!canAddNotes) {
      onDirtyChange?.(false)
      return
    }
    onDirtyChange?.(hasChanges)
  }, [canAddNotes, hasChanges, onDirtyChange])

  return (
    <section className="space-y-4 rounded-lg border bg-card p-4">
      <div>
        <h2 className="text-lg font-semibold">Internal Notes</h2>
        <p className="text-sm text-muted-foreground">Visible only to NLD administrators.</p>
      </div>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No internal notes yet.</p>
        ) : (
          notes.map((note) => (
            <article
              key={note.id}
              className="rounded-md border p-3"
            >
              <p className="text-sm text-muted-foreground">
                {note.submitted_by_name ?? 'Admin'} ·{' '}
                {new Date(note.submitted_at).toLocaleString()}
              </p>

              <p className="mt-2 whitespace-pre-wrap">{note.content}</p>
            </article>
          ))
        )}
      </div>

      {canAddNotes && (
        <>
          <Textarea
            value={draft}
            onChange={(event) =>
              setDraft(event.target.value)
            }
            placeholder="Add a private review note..."
            rows={6}
          />

          <div className="flex gap-2">
            <Button
              type="button"
              disabled={!draft.trim()|| isPending}
              onClick={handleSave}
            >
              {isPending ? 'Saving...' : 'Save'}
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={!draft || isPending}
              onClick={() => setDraft('')}
            >
              Clear
            </Button>
          </div>

          {draft.trim() && (
            <p className="text-sm text-muted-foreground">This note has not been saved.</p>
          )}

          {isError && (
            <p className="text-sm text-destructive">
              {error instanceof Error
              ? error.message : 'Could not save the internal note.'}
            </p>
          )}
        </>
      )}
    </section>
  )
}    