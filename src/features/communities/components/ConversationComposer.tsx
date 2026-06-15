import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useCreateConversation } from '../hooks/useCreateConversation'
import type { ConversationCreate } from '@/types/communities'

interface ConversationComposerProps {
  communityId: string
  onSuccess?: (conversationId: string) => void
  onCancel?: () => void
}

interface FormValues {
  title: string
  body: string
  prompt_type: string
}

export function ConversationComposer({
  communityId,
  onSuccess,
  onCancel,
}: ConversationComposerProps) {
  const { mutate, isPending, isError } = useCreateConversation(communityId)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { title: '', body: '', prompt_type: '' } })

  const onSubmit = (values: FormValues) => {
    const payload: ConversationCreate = {
      title: values.title.trim(),
      body: values.body.trim(),
      prompt_type: values.prompt_type.trim() || undefined,
    }
    mutate(payload, {
      onSuccess: (conversation) => {
        reset()
        onSuccess?.(conversation.id)
      },
    })
  }

  return (
    <Card className="border-primary/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-foreground">Start a conversation</h4>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="conv-title">Title</Label>
            <Input
              id="conv-title"
              placeholder="What's on your mind?"
              {...register('title', {
                required: 'Title is required',
                minLength: { value: 3, message: 'At least 3 characters' },
                maxLength: { value: 120, message: 'Max 120 characters' },
              })}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="conv-body">Message</Label>
            <Textarea
              id="conv-body"
              placeholder="Share more details..."
              rows={4}
              {...register('body', {
                required: 'Message is required',
                maxLength: { value: 3000, message: 'Max 3000 characters' },
              })}
            />
            {errors.body && (
              <p className="text-xs text-destructive">{errors.body.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="conv-type">
              Type{' '}
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="conv-type"
              placeholder="e.g. question, story, tip..."
              {...register('prompt_type', { maxLength: { value: 50, message: 'Max 50 characters' } })}
            />
          </div>

          <div className="flex gap-2 pt-1">
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isPending} className="flex-1 rounded-full">
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Post'
              )}
            </Button>
          </div>
          {isError && (
            <p className="text-xs text-destructive text-center">
              Failed to post. Please try again.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
