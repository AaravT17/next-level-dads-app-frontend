import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { TIMEOUT_LENGTH_MS } from '@/config/constants'
import { ScopedCollectionPage } from './collections/ScopedCollectionPage'

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

  const handleOpenChange = (open: boolean) => {
    setIsCreateOpen(open)
    if (!open) {
      setNewName('')
      setNewDescription('')
    }
  }

  const createCommunity = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      axiosPrivate.post<{ id: string }>('/api/communities/', data, {
        timeout: TIMEOUT_LENGTH_MS,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['communities'] })
      handleOpenChange(false)
      navigate(communityDetail(res.data.id))
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
