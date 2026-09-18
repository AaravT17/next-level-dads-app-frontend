import { toast } from 'sonner'

/**
 * The app's toast API.
 *
 * Two toast systems used to run side by side — the shadcn one in the older
 * pages and sonner in the feature modules — so a single user flow could
 * surface failures in two different visual styles. Sonner won because every
 * newer surface already used it.
 *
 * Callers pass a message, not a `{ title, description, variant }` object, so
 * the generic "Error" titles that carried no information simply disappear.
 */

export function toastError(message: string, description?: string): void {
  toast.error(message, description ? { description } : undefined)
}

export function toastSuccess(message: string, description?: string): void {
  toast.success(message, description ? { description } : undefined)
}

export function toastInfo(message: string, description?: string): void {
  toast(message, description ? { description } : undefined)
}
