import { useRef, useState, useEffect, type ChangeEvent } from 'react'
import { Loader2, Pencil, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CommunityImage } from '@/components/CommunityImage'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toastError } from '@/lib/toast'
import { COMMUNITY_PHOTO_EDITING_ENABLED } from '@/config/constants'
import {
  useDeleteCommunityImage,
  useUpdateCommunityImage,
} from '../hooks/useCommunityImage'

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg']
const MAX_BYTES = 5 * 1024 * 1024

export interface CommunityPhotoEditorProps {
  communityId: string
  imageUrl: string | null
  /**
   * Whether this viewer would be allowed to edit -- admins only.
   *
   * Necessary but not sufficient: COMMUNITY_PHOTO_EDITING_ENABLED gates it as
   * well, and is currently off for everyone.
   */
  canEdit: boolean
}

/**
 * The community's photo on its own page.
 *
 * Editing is switched off for every user right now, so this usually renders as
 * a plain photo. The edit path is kept whole rather than deleted: the caller
 * still passes real admin permission, and flipping
 * COMMUNITY_PHOTO_EDITING_ENABLED restores the control with no other change.
 *
 * When editing is on, the picked file is shown immediately from a local object
 * URL so the change reads as instant, then replaced by the stored URL once the
 * upload lands. The preview is dropped on failure, which puts the previous
 * photo straight back.
 */
export function CommunityPhotoEditor({
  communityId,
  imageUrl,
  canEdit,
}: CommunityPhotoEditorProps) {
  const showEditControl = COMMUNITY_PHOTO_EDITING_ENABLED && canEdit
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const upload = useUpdateCommunityImage(communityId)
  const remove = useDeleteCommunityImage(communityId)
  const isBusy = upload.isPending || remove.isPending

  // Object URLs are a manual allocation: without this every pick leaks one for
  // as long as the page is open.
  useEffect(() => {
    if (!preview) return
    return () => URL.revokeObjectURL(preview)
  }, [preview])

  // The refetched URL is the signal that the upload is really visible, so the
  // local preview steps aside only once it changes. The stored URL carries a
  // cache-busting stamp, so it always does.
  useEffect(() => {
    setPreview(null)
  }, [imageUrl])

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset first so picking the same file twice still fires a change event.
    e.target.value = ''
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      return toastError('Please choose a PNG or JPG image.')
    }
    if (file.size > MAX_BYTES) {
      return toastError('That image is larger than 5MB. Please choose a smaller one.')
    }

    setPreview(URL.createObjectURL(file))
    // Cleared on failure only. onSettled also fired on success, dropping the
    // preview before the invalidated detail query had refetched -- so `src`
    // fell back to the stale URL for a beat and the photo appeared to revert.
    upload.mutate(file, { onError: () => setPreview(null) })
  }

  return (
    <div className="relative w-fit">
      <CommunityImage
        src={preview ?? imageUrl}
        size={96}
        className="rounded-xl border border-border"
        iconClassName="w-9 h-9"
      />

      {isBusy && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/60">
          <Loader2 aria-hidden className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="sr-only">Updating community photo</span>
        </div>
      )}

      {showEditControl && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="secondary"
                aria-label="Change community photo"
                disabled={isBusy}
                className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full shadow-sm"
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                {imageUrl ? 'Replace photo' : 'Upload photo'}
              </DropdownMenuItem>
              {imageUrl && (
                <DropdownMenuItem
                  onClick={() => remove.mutate()}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove photo
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            className="hidden"
            onChange={handleFileChange}
          />
        </>
      )}
    </div>
  )
}
