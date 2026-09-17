import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { AppBar } from '@/components/layout/AppBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Check,
  Calendar as CalendarIcon,
  Pencil,
  Search,
  Trash2,
  Upload,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import avatarDefaultGrey from '@/assets/avatar-default-grey.png'
import { ROUTES } from '@/lib/routes'
import { useAuth } from '@/contexts/useAuth'
import axios from 'axios'
import axiosPrivate from '@/api/axiosPrivate'
import {
  TIMEOUT_LENGTH_MS,
  MAX_BIO_LENGTH,
  MAX_NAME_LENGTH,
  MAX_CITY_LENGTH,
  MAX_ICEBREAKER_ANSWER_LENGTH,
  MIN_INTERESTS,
  MAX_INTERESTS,
  MIN_ICEBREAKERS,
  MAX_ICEBREAKERS,
  STAGE_OPTIONS,
  PROVINCE_OPTIONS,
  INTEREST_DISPLAY_MAP,
  GOAL_OPTIONS,
  CONNECTION_STYLE_OPTIONS,
  MATCH_PRIORITY_OPTIONS,
  ICEBREAKER_PROMPTS,
} from '@/config/constants'
import { toastError, toastSuccess } from '@/lib/toast'
import { cn } from '@/lib/utils'
import type { InterestItem, IcebreakerEntry } from '@/types/users'

// ── Types ────────────────────────────────────────────────────────────

interface InterestOption {
  id: string
  slug: string
  name: string
}

interface FormState {
  name: string
  date_of_birth: string
  city: string
  province: string
  about: string
  children_age_ranges: string[]
  kid_count: number
  goals: string[]
  primary_goal: string
  connection_styles: string[]
  match_priorities: string[]
  interest_slugs: string[]
  icebreakers: IcebreakerEntry[]
}

// ── Helpers ──────────────────────────────────────────────────────────

const toggle = <T,>(list: T[], value: T, max?: number): T[] => {
  if (list.includes(value)) return list.filter((v) => v !== value)
  if (max && list.length >= max) return list
  return [...list, value]
}

/** Build the original form state from the current user object. */
function userToForm(user: {
  name: string
  date_of_birth: string | null
  city: string
  province: string
  about: string
  children_age_ranges: string[]
  kid_count: number | null
  goals: string[] | null
  primary_goal: string | null
  connection_styles: string[] | null
  match_priorities: string[] | null
  interests: InterestItem[]
  icebreakers: IcebreakerEntry[] | null
}): FormState {
  return {
    name: user.name,
    date_of_birth: user.date_of_birth ?? '',
    city: user.city,
    province: user.province,
    about: user.about,
    children_age_ranges: [...user.children_age_ranges],
    kid_count: user.kid_count ?? 0,
    goals: [...(user.goals ?? [])],
    primary_goal: user.primary_goal ?? '',
    connection_styles: [...(user.connection_styles ?? [])],
    match_priorities: [...(user.match_priorities ?? [])],
    interest_slugs: user.interests.map((i) => i.slug),
    icebreakers: (user.icebreakers ?? []).map((ib) => ({ ...ib })),
  }
}

/** Compare two values for diff purposes. Arrays are compared by sorted JSON. */
function valuesEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort())
  }
  return a === b
}

/** Compare icebreaker arrays (order-sensitive, content compared). */
function icebreakersEqual(a: IcebreakerEntry[], b: IcebreakerEntry[]): boolean {
  if (a.length !== b.length) return false
  return a.every(
    (entry, i) =>
      entry.prompt_slug === b[i].prompt_slug && entry.answer === b[i].answer,
  )
}

// ── Component ────────────────────────────────────────────────────────

const MyProfile = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, accessToken, setAuth } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Interest options from API
  const [interestOptions, setInterestOptions] = useState<InterestOption[]>([])
  const [interestQuery, setInterestQuery] = useState('')

  // Icebreaker editing
  const [editingIcebreakerIndex, setEditingIcebreakerIndex] = useState<number | null>(null)
  const [selectedPromptSlug, setSelectedPromptSlug] = useState<string | null>(null)
  const [icebreakerAnswer, setIcebreakerAnswer] = useState('')
  const [showPromptPicker, setShowPromptPicker] = useState(false)

  // Original state (snapshot at load time, used for diffing)
  const [original, setOriginal] = useState<FormState | null>(null)

  // Editing state
  const [form, setForm] = useState<FormState | null>(null)

  // Initialize form from user
  useEffect(() => {
    if (user) {
      const state = userToForm(user)
      setOriginal(state)
      setForm({ ...state, icebreakers: state.icebreakers.map((ib) => ({ ...ib })) })
    }
  }, [user])

  // Fetch interest options
  useEffect(() => {
    axiosPrivate
      .get<InterestOption[]>('/api/interests/', { timeout: TIMEOUT_LENGTH_MS })
      .then((res) => setInterestOptions(res.data))
      .catch(() => {})
  }, [])

  const slugToId = useMemo(() => {
    const map: Record<string, string> = {}
    for (const opt of interestOptions) map[opt.slug] = opt.id
    return map
  }, [interestOptions])

  const filteredInterests = useMemo(() => {
    const q = interestQuery.trim().toLowerCase()
    const opts = interestOptions.map((o) => ({
      ...o,
      display: INTEREST_DISPLAY_MAP[o.slug],
    }))
    if (!q) return opts
    return opts.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.display?.label.toLowerCase().includes(q),
    )
  }, [interestQuery, interestOptions])

  const usedPromptSlugs = useMemo(
    () => new Set(form?.icebreakers.map((ib) => ib.prompt_slug) ?? []),
    [form?.icebreakers],
  )

  // ── Diff builder ───────────────────────────────────────────────

  const buildPatch = (): Record<string, unknown> | null => {
    if (!form || !original) return null
    const patch: Record<string, unknown> = {}

    // Simple fields
    const simpleFields: (keyof FormState)[] = [
      'name',
      'date_of_birth',
      'city',
      'province',
      'about',
      'kid_count',
      'primary_goal',
    ]
    const trimmedFields = new Set(['name', 'city', 'about'])
    for (const key of simpleFields) {
      if (!valuesEqual(form[key], original[key])) {
        const val = form[key]
        patch[key] = trimmedFields.has(key) && typeof val === 'string' ? val.trim() : val
      }
    }

    // Array fields (compared as sets)
    const arrayFields: (keyof FormState)[] = [
      'children_age_ranges',
      'goals',
      'connection_styles',
      'match_priorities',
    ]
    for (const key of arrayFields) {
      if (!valuesEqual(form[key], original[key])) {
        patch[key] = form[key]
      }
    }

    // Interests: diff slugs, send UUIDs
    if (!valuesEqual(form.interest_slugs, original.interest_slugs)) {
      patch.interests = form.interest_slugs.map((slug) => slugToId[slug]).filter(Boolean)
    }

    // Icebreakers
    if (!icebreakersEqual(form.icebreakers, original.icebreakers)) {
      patch.icebreakers = form.icebreakers.map((ib) => ({
        prompt_slug: ib.prompt_slug,
        answer: ib.answer.trim(),
      }))
    }

    return Object.keys(patch).length > 0 ? patch : null
  }

  // ── Mutations ──────────────────────────────────────────────────

  const updateProfile = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      axiosPrivate.patch('/api/users/me', data, { timeout: TIMEOUT_LENGTH_MS }),
    onSuccess: (res) => {
      const data = res.data
      setAuth({
        user: {
          id: data.id,
          name: data.name,
          age: data.age,
          date_of_birth: data.date_of_birth,
          city: data.city,
          province: data.province,
          about: data.about,
          avatarUrl: data.avatar_url,
          interests: data.interests ?? [],
          children_age_ranges: data.children_age_ranges ?? [],
          kid_count: data.kid_count ?? null,
          goals: data.goals ?? null,
          primary_goal: data.primary_goal ?? null,
          connection_styles: data.connection_styles ?? null,
          match_priorities: data.match_priorities ?? null,
          icebreakers: data.icebreakers ?? null,
          isAdmin: user?.isAdmin ?? false,
          preferences: user?.preferences ?? { marketing_emails_opt_in: false },
          legal_acceptances: user?.legal_acceptances ?? { terms: false, privacy_policy: false },
          notificationState: {
            lastReadAt: data.notification_state?.last_read_at ?? null,
            lastClearedAt: data.notification_state?.last_cleared_at ?? null,
          },
        },
        accessToken,
      })
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      toastSuccess('Profile updated.')
      navigate(ROUTES.YOU)
    },
    onError: (error) => {
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail
        if (error.response?.status === 429) {
          toastError('Profile update limit reached. Please try again later.')
        } else if (typeof detail === 'string') {
          toastError(detail)
        } else {
          toastError('Failed to update profile. Please try again.')
        }
      } else {
        toastError('Failed to update profile. Please try again.')
      }
    },
    onSettled: () => setIsLoading(false),
  })

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData()
      fd.append('avatar', file)
      return axiosPrivate.put<{ avatar_url: string }>('/api/users/me/avatar', fd, {
        timeout: TIMEOUT_LENGTH_MS,
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: (res) => {
      if (user) setAuth({ user: { ...user, avatarUrl: res.data.avatar_url }, accessToken })
      setAvatarPreview(null)
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      toastSuccess('Photo updated.')
    },
    onError: (error) => {
      setAvatarPreview(null)
      toastError(
        axios.isAxiosError(error) && error.response?.status === 429
          ? 'Photo upload limit reached. Please try again later.'
          : 'Failed to upload photo. Please try again.',
      )
    },
    onSettled: () => setIsLoading(false),
  })

  const deleteAvatar = useMutation({
    mutationFn: () =>
      axiosPrivate.delete('/api/users/me/avatar', { timeout: TIMEOUT_LENGTH_MS }),
    onSuccess: () => {
      if (user) setAuth({ user: { ...user, avatarUrl: null }, accessToken })
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      toastSuccess('Photo removed.')
    },
    onError: () => toastError('Failed to remove photo. Please try again.'),
    onSettled: () => setIsLoading(false),
  })

  // ── Handlers ───────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
    setIsLoading(true)
    uploadAvatar.mutate(file)
    e.target.value = ''
  }

  const handleRemoveAvatar = () => {
    if (isLoading) return
    setIsLoading(true)
    deleteAvatar.mutate()
  }

  const handleSave = () => {
    if (!form) return
    const patch = buildPatch()
    if (!patch) {
      navigate(ROUTES.YOU)
      return
    }

    // Validate only fields that are being sent
    if ('date_of_birth' in patch) {
      const dobDate = new Date((patch.date_of_birth as string) + 'T00:00:00')
      const today = new Date()
      let age = today.getFullYear() - dobDate.getFullYear()
      if (
        today.getMonth() < dobDate.getMonth() ||
        (today.getMonth() === dobDate.getMonth() && today.getDate() < dobDate.getDate())
      ) {
        age--
      }
      if (age < 18) return toastError('You must be 18 or older.')
    }
    if ('name' in patch) {
      const v = (patch.name as string).trim()
      if (!v) return toastError('Name cannot be empty.')
      if (v.length > MAX_NAME_LENGTH)
        return toastError(`Name must be ${MAX_NAME_LENGTH} characters or less.`)
    }
    if ('city' in patch) {
      const v = (patch.city as string).trim()
      if (!v) return toastError('City cannot be empty.')
      if (v.length > MAX_CITY_LENGTH)
        return toastError(`City must be ${MAX_CITY_LENGTH} characters or less.`)
    }
    if ('about' in patch) {
      const v = (patch.about as string).trim()
      if (!v) return toastError('Bio cannot be empty.')
      if (v.length > MAX_BIO_LENGTH)
        return toastError(`Bio must be ${MAX_BIO_LENGTH} characters or less.`)
    }
    if ('interests' in patch) {
      const v = patch.interests as string[]
      if (v.length < MIN_INTERESTS)
        return toastError(`Please select at least ${MIN_INTERESTS} interests.`)
      if (v.length > MAX_INTERESTS)
        return toastError(`You can select at most ${MAX_INTERESTS} interests.`)
    }
    if ('goals' in patch) {
      const v = patch.goals as string[]
      if (v.length === 0) return toastError('Please select at least one goal.')
    }
    if ('primary_goal' in patch) {
      const v = patch.primary_goal as string
      if (!v) return toastError('Please select a primary goal.')
    }
    if ('connection_styles' in patch) {
      const v = patch.connection_styles as string[]
      if (v.length === 0) return toastError('Please select at least one connection style.')
    }
    if ('match_priorities' in patch) {
      const v = patch.match_priorities as string[]
      if (v.length === 0) return toastError('Please select at least one match priority.')
    }
    if ('icebreakers' in patch) {
      const v = patch.icebreakers as IcebreakerEntry[]
      if (v.length < MIN_ICEBREAKERS)
        return toastError(`Please provide at least ${MIN_ICEBREAKERS} icebreaker.`)
      if (v.length > MAX_ICEBREAKERS)
        return toastError(`You can have at most ${MAX_ICEBREAKERS} icebreakers.`)
      for (const ib of v) {
        if (!ib.answer.trim()) return toastError('Icebreaker answers cannot be empty.')
        if (ib.answer.length > MAX_ICEBREAKER_ANSWER_LENGTH)
          return toastError(
            `Icebreaker answers must be ${MAX_ICEBREAKER_ANSWER_LENGTH} characters or less.`,
          )
      }
    }
    if ('kid_count' in patch) {
      const v = patch.kid_count as number
      if (v < 0 || v >= 100) return toastError('Kid count must be between 0 and 99.')
    }

    setIsLoading(true)
    updateProfile.mutate(patch)
  }

  const handleCancel = () => {
    if (user) {
      const state = userToForm(user)
      setOriginal(state)
      setForm({ ...state, icebreakers: state.icebreakers.map((ib) => ({ ...ib })) })
    }
    navigate(ROUTES.YOU)
  }

  // Form field setters
  const set = (patch: Partial<FormState>) => setForm((f) => (f ? { ...f, ...patch } : f))

  // ── Icebreaker helpers ─────────────────────────────────────────

  const saveIcebreaker = () => {
    if (!form || !selectedPromptSlug || !icebreakerAnswer.trim()) return
    const entry: IcebreakerEntry = {
      prompt_slug: selectedPromptSlug,
      answer: icebreakerAnswer.trim(),
    }
    if (editingIcebreakerIndex !== null) {
      set({
        icebreakers: form.icebreakers.map((ib, i) =>
          i === editingIcebreakerIndex ? entry : ib,
        ),
      })
    } else {
      set({ icebreakers: [...form.icebreakers, entry] })
    }
    setSelectedPromptSlug(null)
    setIcebreakerAnswer('')
    setEditingIcebreakerIndex(null)
    setShowPromptPicker(false)
  }

  const removeIcebreaker = (index: number) => {
    if (!form) return
    set({ icebreakers: form.icebreakers.filter((_, i) => i !== index) })
  }

  const editIcebreaker = (index: number) => {
    if (!form) return
    const ib = form.icebreakers[index]
    setSelectedPromptSlug(ib.prompt_slug)
    setIcebreakerAnswer(ib.answer)
    setEditingIcebreakerIndex(index)
  }

  const cancelIcebreakerEdit = () => {
    setSelectedPromptSlug(null)
    setIcebreakerAnswer('')
    setEditingIcebreakerIndex(null)
  }

  // ── Guard ──────────────────────────────────────────────────────

  if (!user || !form) return null

  const displayAvatar = avatarPreview || user.avatarUrl || avatarDefaultGrey

  return (
    <>
      <AppBar title="Edit profile" leading="back" backTo={ROUTES.YOU} />

      <PageContainer className="space-y-6 animate-fade-in">
        {/* Avatar */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="h-32 w-32 overflow-hidden rounded-lg border-4 border-primary/20">
              <img
                src={displayAvatar}
                alt={user.name}
                className={cn('h-full w-full object-cover', isLoading && 'opacity-50')}
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-gray-500 text-white hover:bg-gray-600"
                  disabled={isLoading}
                >
                  <Pencil className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Photo
                </DropdownMenuItem>
                {user.avatarUrl && (
                  <DropdownMenuItem
                    onClick={handleRemoveAvatar}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove Photo
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Basic Info */}
        <section className="rounded-lg bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Basic Info
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                placeholder="Full name"
                value={form.name}
                maxLength={MAX_NAME_LENGTH}
                onChange={(e) => set({ name: e.target.value })}
                className="rounded-md"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>Date of birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start rounded-md font-normal"
                    disabled={isLoading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {form.date_of_birth ? (
                      format(parseISO(form.date_of_birth), 'MMMM d, yyyy')
                    ) : (
                      <span className="text-muted-foreground">Select your date of birth</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={
                      form.date_of_birth ? parseISO(form.date_of_birth) : undefined
                    }
                    onSelect={(date) =>
                      set({ date_of_birth: date ? format(date, 'yyyy-MM-dd') : '' })
                    }
                    disabled={(date) => date > new Date()}
                    captionLayout="dropdown"
                    fromYear={1900}
                    toYear={new Date().getFullYear()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="e.g. Toronto"
                  value={form.city}
                  maxLength={MAX_CITY_LENGTH}
                  onChange={(e) => set({ city: e.target.value })}
                  className="rounded-md"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="province">Province</Label>
                <Select
                  value={form.province}
                  onValueChange={(v) => set({ province: v })}
                  disabled={isLoading}
                >
                  <SelectTrigger id="province" className="rounded-md">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCE_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="about">About you</Label>
              <Textarea
                id="about"
                placeholder="Tell us a bit about yourself."
                value={form.about}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_BIO_LENGTH) set({ about: e.target.value })
                }}
                className="min-h-24 rounded-md"
                disabled={isLoading}
              />
              <p className="text-right text-xs text-muted-foreground">
                {form.about.length}/{MAX_BIO_LENGTH}
              </p>
            </div>
          </div>
        </section>

        {/* Kids */}
        <section className="rounded-lg bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Kids
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>How many kids do you have?</Label>
              <Input
                type="number"
                min={0}
                max={99}
                value={form.kid_count}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10)
                  if (!Number.isNaN(v) && v >= 0 && v < 100) set({ kid_count: v })
                  else if (e.target.value === '') set({ kid_count: 0 })
                }}
                className="w-24 rounded-md"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label>What stage are your kids at?</Label>
              <p className="text-xs text-muted-foreground">Select all that apply.</p>
              <div className="flex flex-wrap gap-2">
                {STAGE_OPTIONS.map((s) => {
                  const selected = form.children_age_ranges.includes(s.value)
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() =>
                        set({ children_age_ranges: toggle(form.children_age_ranges, s.value) })
                      }
                      disabled={isLoading}
                      className={cn(
                        'rounded-md border px-3 py-2 text-xs font-medium transition-all active:scale-[0.97]',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:border-primary/50',
                      )}
                    >
                      {s.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Goals & Matching */}
        <section className="rounded-lg bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Goals & Matching
          </h3>
          <div className="space-y-5">
            {/* Goals */}
            <div className="space-y-2">
              <Label>What are you hoping to find here?</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {GOAL_OPTIONS.map((g) => {
                  const selected = form.goals.includes(g.value)
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => {
                        const next = toggle(form.goals, g.value)
                        const updates: Partial<FormState> = { goals: next }
                        if (form.primary_goal && !next.includes(form.primary_goal)) {
                          updates.primary_goal = next.length === 1 ? next[0] : ''
                        }
                        if (next.length === 1) updates.primary_goal = next[0]
                        set(updates)
                      }}
                      disabled={isLoading}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md border p-3 text-left transition-all active:scale-[0.99]',
                        selected
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-background hover:border-primary/50',
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                          selected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/30',
                        )}
                      >
                        {selected && <Check className="h-2.5 w-2.5" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{g.label}</p>
                        <p className="text-xs text-muted-foreground">{g.hint}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Primary goal */}
            {form.goals.length > 1 && (
              <div className="space-y-2">
                <Label>What matters most right now?</Label>
                <div className="flex flex-wrap gap-2">
                  {form.goals.map((g) => {
                    const opt = GOAL_OPTIONS.find((o) => o.value === g)
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => set({ primary_goal: g })}
                        disabled={isLoading}
                        className={cn(
                          'rounded-md border px-3 py-2 text-xs font-semibold transition-all active:scale-[0.97]',
                          form.primary_goal === g
                            ? 'border-primary bg-gradient-gold text-primary-foreground'
                            : 'border-border bg-background text-foreground hover:border-primary/50',
                        )}
                      >
                        {opt?.label ?? g}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Connection styles */}
            <div className="space-y-2">
              <Label>What kind of connections are you after?</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {CONNECTION_STYLE_OPTIONS.map((c) => {
                  const selected = form.connection_styles.includes(c.value)
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() =>
                        set({ connection_styles: toggle(form.connection_styles, c.value) })
                      }
                      disabled={isLoading}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md border p-3 text-left transition-all active:scale-[0.99]',
                        selected
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-background hover:border-primary/50',
                      )}
                    >
                      <div
                        className={cn(
                          'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                          selected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-muted-foreground/30',
                        )}
                      >
                        {selected && <Check className="h-2.5 w-2.5" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{c.label}</p>
                        <p className="text-xs text-muted-foreground">{c.hint}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Match priorities */}
            <div className="space-y-2">
              <Label>What matters most when meeting another dad?</Label>
              <div className="flex flex-wrap gap-2">
                {MATCH_PRIORITY_OPTIONS.map((p) => {
                  const selected = form.match_priorities.includes(p.value)
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() =>
                        set({ match_priorities: toggle(form.match_priorities, p.value) })
                      }
                      disabled={isLoading}
                      className={cn(
                        'rounded-md border px-3.5 py-2 text-sm font-medium transition-all active:scale-[0.97]',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:border-primary/50',
                      )}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Interests */}
        <section className="rounded-lg bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Interests
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Choose {MIN_INTERESTS}-{MAX_INTERESTS}.
          </p>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={interestQuery}
              onChange={(e) => setInterestQuery(e.target.value)}
              placeholder="Search interests"
              className="rounded-md pl-9"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredInterests.map((opt) => {
              const selected = form.interest_slugs.includes(opt.slug)
              const atMax = form.interest_slugs.length >= MAX_INTERESTS
              const display = INTEREST_DISPLAY_MAP[opt.slug]
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isLoading || (!selected && atMax)}
                  onClick={() =>
                    set({
                      interest_slugs: toggle(form.interest_slugs, opt.slug, MAX_INTERESTS),
                    })
                  }
                  className={cn(
                    'flex flex-col items-center justify-center gap-1.5 rounded-lg border p-4 text-center transition-all active:scale-[0.97] disabled:opacity-40',
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-background hover:border-primary/50',
                  )}
                >
                  <span className="text-2xl">{display?.emoji ?? '✨'}</span>
                  <span className="text-sm font-medium text-foreground">{display?.label ?? opt.name}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* Icebreakers */}
        <section className="rounded-lg bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Icebreakers
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Add up to {MAX_ICEBREAKERS}.
          </p>

          {/* Saved icebreakers */}
          {form.icebreakers.length > 0 && (
            <div className="mb-3 space-y-2">
              {form.icebreakers.map((ib, i) => {
                const prompt = ICEBREAKER_PROMPTS.find((p) => p.slug === ib.prompt_slug)

                if (editingIcebreakerIndex === i) {
                  return (
                    <div
                      key={ib.prompt_slug}
                      className="animate-fade-in rounded-xl border-2 border-primary/30 bg-card p-5 shadow-md"
                    >
                      <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                        {prompt?.text ?? ib.prompt_slug}
                      </p>
                      <Textarea
                        autoFocus
                        value={icebreakerAnswer}
                        onChange={(e) => {
                          if (e.target.value.length <= MAX_ICEBREAKER_ANSWER_LENGTH)
                            setIcebreakerAnswer(e.target.value)
                        }}
                        placeholder="Your answer..."
                        className="mt-3 min-h-20 rounded-md border-border shadow-sm"
                        disabled={isLoading}
                      />
                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {icebreakerAnswer.length}/{MAX_ICEBREAKER_ANSWER_LENGTH}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-md text-xs text-muted-foreground"
                            onClick={cancelIcebreakerEdit}
                            disabled={isLoading}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="rounded-md"
                            onClick={saveIcebreaker}
                            disabled={isLoading || !icebreakerAnswer.trim()}
                          >
                            Update
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={ib.prompt_slug}
                    className="relative rounded-xl border-2 border-primary/30 bg-card px-6 py-5 shadow-lg"
                  >
                    <p className="text-sm font-semibold uppercase tracking-wider text-primary pr-16">
                      {prompt?.text ?? ib.prompt_slug}
                    </p>
                    <p className="mt-3 text-base leading-relaxed text-foreground whitespace-pre-line">{ib.answer}</p>
                    <div className="absolute top-4 right-4 flex gap-1.5">
                      <button type="button" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted" onClick={() => editIcebreaker(i)} disabled={isLoading}>
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-destructive hover:bg-destructive/10" onClick={() => removeIcebreaker(i)} disabled={isLoading}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Prompt picker */}
          {selectedPromptSlug === null && editingIcebreakerIndex === null && form.icebreakers.length < MAX_ICEBREAKERS && (
            <>
              {form.icebreakers.length > 0 && !showPromptPicker && (
                <Button
                  variant="outline"
                  className="w-full rounded-lg border-2 border-dashed py-6 text-sm font-semibold border-foreground text-foreground hover:border-primary hover:text-primary hover:bg-transparent dark:border-primary dark:text-primary dark:hover:border-foreground dark:hover:text-foreground dark:hover:bg-transparent"
                  onClick={() => setShowPromptPicker(true)}
                >
                  + Add another icebreaker
                </Button>
              )}
              {(showPromptPicker || form.icebreakers.length === 0) && (
                <div className="space-y-1">
                  {ICEBREAKER_PROMPTS.filter((p) => !usedPromptSlugs.has(p.slug)).map((p) => (
                    <button
                      key={p.slug}
                      type="button"
                      onClick={() => {
                        setSelectedPromptSlug(p.slug)
                        setIcebreakerAnswer('')
                        setEditingIcebreakerIndex(null)
                      }}
                      disabled={isLoading}
                      className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-left text-sm text-foreground transition-colors hover:border-primary/50 hover:bg-muted/30"
                    >
                      {p.text}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Answer editor (new prompts only — editing existing ones renders inline above) */}
          {selectedPromptSlug !== null && editingIcebreakerIndex === null && (
            <div className="animate-fade-in rounded-xl border-2 border-primary/30 bg-card p-5 shadow-md">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                {ICEBREAKER_PROMPTS.find((p) => p.slug === selectedPromptSlug)?.text}
              </p>
              <Textarea
                autoFocus
                value={icebreakerAnswer}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_ICEBREAKER_ANSWER_LENGTH)
                    setIcebreakerAnswer(e.target.value)
                }}
                placeholder="Your answer..."
                className="mt-3 min-h-20 rounded-md border-border shadow-sm"
                disabled={isLoading}
              />
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {icebreakerAnswer.length}/{MAX_ICEBREAKER_ANSWER_LENGTH}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-md text-xs text-muted-foreground"
                    onClick={cancelIcebreakerEdit}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="rounded-md"
                    onClick={saveIcebreaker}
                    disabled={isLoading || !icebreakerAnswer.trim()}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Action buttons */}
        <div className="space-y-2 pb-4">
          <Button
            className="w-full rounded-md bg-gradient-gold font-semibold"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button
            variant="outline"
            className="w-full rounded-md"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </PageContainer>
    </>
  )
}

export default MyProfile
