import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { ImagePlus, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CommunityImage } from '@/components/CommunityImage'
import { communitiesApi } from '@/features/communities/api/communitiesApi'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toastError } from '@/lib/toast'
import { communityDetail } from '@/lib/routes'
import axiosPrivate from '@/api/axiosPrivate'
import { COMMUNITY_PHOTO_EDITING_ENABLED, TIMEOUT_LENGTH_MS } from '@/config/constants'
import { ScopedCollectionPage } from './collections/ScopedCollectionPage'

const ACCEPTED_PHOTO_TYPES = ['image/png', 'image/jpeg', 'image/jpg']
const MAX_PHOTO_BYTES = 5 * 1024 * 1024

/**
 * Communities.
 *
 * The cross-community feed used to be the first of two tabs here; it is Home
 * now, so this is a single list like Events — same shape, one kind of thing.
 *
 * The route is still /groups: renaming the section's label is a UI change, and
 * moving the URL would break every link anyone has already shared.
 */
const GroupsPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  // The preview is a manual allocation; without this each pick leaks one.
  useEffect(() => {
    if (!photoPreview) return
    return () => URL.revokeObjectURL(photoPreview)
  }, [photoPreview])

  const clearPhoto = () => {
    setPhoto(null)
    setPhotoPreview(null)
  }

  const handleOpenChange = (open: boolean) => {
    setIsCreateOpen(open)
    if (!open) {
      setNewName('')
      setNewDescription('')
      clearPhoto()
    }
  }

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    // Reset first so re-picking the same file still fires a change event.
    e.target.value = ''
    if (!file) return

    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
      return toastError('Please choose a PNG or JPG image.')
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return toastError('That image is larger than 5MB. Please choose a smaller one.')
    }

    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const createCommunity = useMutation({
    /**
     * Create, then attach the photo.
     *
     * `photo` is always null while COMMUNITY_PHOTO_EDITING_ENABLED is off,
     * since the picker that sets it is the only way in -- the upload branch is
     * kept so re-enabling the flag needs no change here.
     *
     * The upload is keyed by community id, so it cannot happen until the row
     * exists. A failed upload is deliberately not a failed creation: the
     * community is real and its admin can add the photo from its own page, so
     * the error is surfaced and the navigation still happens.
     */
    mutationFn: async (data: { name: string; description?: string; photo: File | null }) => {
      const res = await axiosPrivate.post<{ id: string }>(
        '/api/communities/',
        { name: data.name, description: data.description },
        { timeout: TIMEOUT_LENGTH_MS },
      )
      if (data.photo) {
        try {
          await communitiesApi.updateCommunityImage(res.data.id, data.photo)
        } catch {
          toastError('Community created, but the photo failed to upload. You can add it here.')
        }
      }
      return res.data.id
    },
    onSuccess: (communityId) => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
      handleOpenChange(false)
      navigate(communityDetail(communityId))
    },
    onError: (error) => {
      toastError(
        axios.isAxiosError(error) && error.response?.status === 429
          ? 'Community creation limit reached. Please try again later.'
          : 'Failed to create community. Please try again.',
      )
    },
  })

  const createCommunityAction = (
    <Dialog open={isCreateOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto shrink-0 rounded-md border-primary">
          <Plus className="w-4 h-4 mr-2" />
          Create Community
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Create Community</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {COMMUNITY_PHOTO_EDITING_ENABLED && (
            <div className="flex items-center gap-3">
              <CommunityImage
                src={photoPreview}
                size={64}
                iconClassName="w-6 h-6"
              />
              <div className="flex flex-col items-start gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-md gap-1.5"
                  onClick={() => photoInputRef.current?.click()}
                >
                  <ImagePlus aria-hidden className="w-4 h-4" />
                  {photo ? 'Change photo' : 'Add a photo'}
                </Button>
                {photo && (
                  <button
                    type="button"
                    onClick={clearPhoto}
                    className="flex items-center gap-1 text-caption text-muted-foreground hover:text-foreground"
                  >
                    <X aria-hidden className="w-3 h-3" />
                    Remove
                  </button>
              )}
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept={ACCEPTED_PHOTO_TYPES.join(',')}
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
          )}
          <div>
            <label htmlFor="community-name" className="text-label text-foreground">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="community-name"
              placeholder="Community name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={100}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="community-description" className="text-label text-foreground">
              Description
            </label>
            <Textarea
              id="community-description"
              placeholder="What is this community about?"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              maxLength={500}
              className="mt-1 min-h-24"
            />
          </div>
          <Button
            className="w-full rounded-md"
            disabled={!newName.trim() || createCommunity.isPending}
            onClick={() =>
              createCommunity.mutate({
                name: newName.trim(),
                description: newDescription.trim() || undefined,
                photo,
              })
            }
          >
            {createCommunity.isPending ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <ScopedCollectionPage kind="communities" title="Communities" action={createCommunityAction} />
  )
}

export default GroupsPage
