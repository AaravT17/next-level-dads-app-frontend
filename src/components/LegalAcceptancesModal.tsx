import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/contexts/AuthContext'
import { useQueryClient } from '@tanstack/react-query'
import axiosPrivate from '@/api/axiosPrivate'
import { useToast } from '@/hooks/use-toast'

const WEBSITE_BASE_URL = import.meta.env.VITE_WEBSITE_BASE_URL as string

export function LegalAcceptancesModal() {
  const { user, accessToken, setAuth } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)

  const needsAcceptance =
    !!user &&
    (!user.legal_acceptances.terms || !user.legal_acceptances.privacy_policy)

  const handleAgree = async () => {
    setIsSubmitting(true)
    try {
      await axiosPrivate.post('/api/users/me/legal-acceptances')
      if (user) {
        setAuth({
          user: { ...user, legal_acceptances: { terms: true, privacy_policy: true } },
          accessToken,
        })
      }
      queryClient.invalidateQueries()
    } catch {
      toast({
        title: 'Something went wrong',
        description: 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={needsAcceptance}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        hideCloseButton
      >
        <DialogHeader>
          <DialogTitle>Updated Legal Agreements</DialogTitle>
          <DialogDescription>
            Please review and accept our Terms and Conditions and Privacy Policy
            to continue using Next Level Dads.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex items-start gap-3">
            <Checkbox
              id="modal-terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
              disabled={isSubmitting}
              className="mt-0.5"
            />
            <label htmlFor="modal-terms" className="text-sm leading-relaxed cursor-pointer">
              I agree to the{' '}
              <a
                href={`${WEBSITE_BASE_URL}/terms`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                Terms and Conditions
              </a>
            </label>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="modal-privacy"
              checked={agreedToPrivacy}
              onCheckedChange={(checked) => setAgreedToPrivacy(!!checked)}
              disabled={isSubmitting}
              className="mt-0.5"
            />
            <label htmlFor="modal-privacy" className="text-sm leading-relaxed cursor-pointer">
              I agree to the{' '}
              <a
                href={`${WEBSITE_BASE_URL}/privacy`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                Privacy Policy
              </a>
            </label>
          </div>
        </div>

        <Button
          onClick={handleAgree}
          disabled={isSubmitting || !agreedToTerms || !agreedToPrivacy}
          className="w-full"
        >
          {isSubmitting ? 'Saving...' : 'I agree'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
