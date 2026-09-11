import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LogOut, Trash2 } from 'lucide-react'
import { AppBar } from '@/components/layout/AppBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAuth } from '@/contexts/AuthContext'
import { toastError } from '@/lib/toast'
import { ROUTES } from '@/lib/routes'
import axiosPrivate from '@/api/axiosPrivate'
import { TIMEOUT_LENGTH_MS } from '@/config/constants'

/**
 * Preferences, legal and account actions.
 *
 * Pulled out of the profile screen so the destructive controls — log out and
 * delete account — are not sitting directly beneath the edit form.
 */

const WEBSITE_BASE_URL = import.meta.env.VITE_WEBSITE_BASE_URL as string

const LEGAL_LINKS = [
  { href: '/terms', label: 'Terms and Conditions' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/community-guidelines', label: 'Community Guidelines' },
]

const SettingsPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, accessToken, setAuth } = useAuth()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)

  const updatePreferences = useMutation({
    mutationFn: (marketing_emails_opt_in: boolean) =>
      axiosPrivate.patch(
        '/api/users/me/preferences',
        { marketing_emails_opt_in },
        { timeout: TIMEOUT_LENGTH_MS },
      ),
    onSuccess: (_, marketing_emails_opt_in) => {
      if (user) {
        setAuth({
          user: { ...user, preferences: { marketing_emails_opt_in } },
          accessToken,
        })
      }
    },
    onError: () => {
      toastError('Failed to update preferences. Please try again.')
    },
  })

  const handleLogout = async () => {
    try {
      await axiosPrivate.post('/api/auth/logout', {}, { timeout: TIMEOUT_LENGTH_MS })
    } catch {
      // Log out locally even if the server call fails.
    } finally {
      queryClient.clear()
      setAuth({ user: null, accessToken: null })
      navigate(ROUTES.WELCOME)
    }
  }

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true)
    try {
      await axiosPrivate.delete('/api/users/me', { timeout: TIMEOUT_LENGTH_MS })
      queryClient.clear()
      setAuth({ user: null, accessToken: null })
      navigate(ROUTES.WELCOME)
    } catch {
      toastError('Failed to delete account. Please try again.')
      setShowDeleteDialog(false)
    } finally {
      setIsDeletingAccount(false)
    }
  }

  if (!user) return null

  return (
    <>
      <AppBar title="Settings" leading="back" backTo={ROUTES.YOU} />

      <PageContainer className="space-y-8 animate-fade-in">
        <section className="space-y-3">
          <h2 className="font-heading text-subhead text-foreground">Email</h2>
          <div className="flex items-center justify-between gap-4 rounded-lg bg-card p-4 shadow-sm">
            <label htmlFor="marketing-toggle" className="flex-1 text-body text-muted-foreground">
              Receive occasional emails about new features, events, and updates from Next Level
              Dads.
            </label>
            <Switch
              id="marketing-toggle"
              checked={user.preferences.marketing_emails_opt_in}
              disabled={updatePreferences.isPending}
              onCheckedChange={(checked) => updatePreferences.mutate(checked)}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-subhead text-foreground">Legal</h2>
          <ul role="list" className="overflow-hidden rounded-lg bg-card shadow-sm">
            {LEGAL_LINKS.map((link, i) => (
              <li key={link.href} className={i > 0 ? 'border-t border-border' : ''}>
                <a
                  href={`${WEBSITE_BASE_URL}${link.href}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3.5 text-label text-foreground transition-colors duration-fast hover:bg-muted/50"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-heading text-subhead text-foreground">Account</h2>
          <Button variant="outline" className="w-full rounded-full" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </Button>
          <Button
            variant="outline"
            className="w-full rounded-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete account
          </Button>
        </section>
      </PageContainer>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your account? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAccount}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingAccount ? 'Deleting...' : 'Delete account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default SettingsPage
