import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Check,
  Lock,
  Pencil,
  Search,
  Trash2,
  UserRound,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { ROUTES } from '@/lib/routes'
import {
  MAX_BIO_LENGTH,
  MAX_NAME_LENGTH,
  MAX_CITY_LENGTH,
  MAX_ICEBREAKER_ANSWER_LENGTH,
  MIN_INTERESTS,
  MAX_INTERESTS,
  MIN_ICEBREAKERS,
  MAX_ICEBREAKERS,
  TIMEOUT_LENGTH_MS,
  STAGE_OPTIONS,
  PROVINCE_OPTIONS,
  INTEREST_DISPLAY_MAP,
  GOAL_OPTIONS,
  CONNECTION_STYLE_OPTIONS,
  MATCH_PRIORITY_OPTIONS,
  ICEBREAKER_PROMPTS,
} from '@/config/constants'
import axiosPrivate from '@/api/axiosPrivate'
import { useAuth } from '@/contexts/AuthContext'
import { toastError, toastSuccess } from '@/lib/toast'
import { getErrorMessage } from '@/utils/errors'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────

interface InterestOption {
  id: string
  slug: string
  name: string
}

interface IcebreakerDraft {
  prompt_slug: string
  answer: string
}

type StepId =
  | 'basics'
  | 'stages'
  | 'goals'
  | 'connections'
  | 'interests'
  | 'icebreakers'
  | 'photo'
  | 'consent'

const STEPS: StepId[] = [
  'basics',
  'stages',
  'goals',
  'connections',
  'interests',
  'icebreakers',
  'photo',
  'consent',
]

// ── Helpers ──────────────────────────────────────────────────────────

const toggle = <T,>(list: T[], value: T, max?: number): T[] => {
  if (list.includes(value)) return list.filter((v) => v !== value)
  if (max && list.length >= max) return list
  return [...list, value]
}

const ageFromDob = (dob: string): number | null => {
  if (!dob) return null
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age >= 0 && age < 120 ? age : null
}

// ── Component ────────────────────────────────────────────────────────

const ProfileSetup = () => {
  const navigate = useNavigate()
  const { accessToken, setAuth } = useAuth()
  const [loading, setLoading] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const WEBSITE_BASE_URL = import.meta.env.VITE_WEBSITE_BASE_URL as string

  // Form state
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [about, setAbout] = useState('')

  const [stages, setStages] = useState<string[]>([])
  const [kidCount, setKidCount] = useState<number>(0)

  const [goals, setGoals] = useState<string[]>([])
  const [primaryGoal, setPrimaryGoal] = useState<string | null>(null)

  const [connectionStyles, setConnectionStyles] = useState<string[]>([])
  const [matchPriorities, setMatchPriorities] = useState<string[]>([])

  const [selectedInterestIds, setSelectedInterestIds] = useState<string[]>([])
  const [interestOptions, setInterestOptions] = useState<InterestOption[]>([])
  const [interestQuery, setInterestQuery] = useState('')

  const [icebreakers, setIcebreakers] = useState<IcebreakerDraft[]>([])
  const [editingIcebreakerIndex, setEditingIcebreakerIndex] = useState<number | null>(null)
  const [selectedPromptSlug, setSelectedPromptSlug] = useState<string | null>(null)
  const [icebreakerAnswer, setIcebreakerAnswer] = useState('')
  const [showPromptPicker, setShowPromptPicker] = useState(true)

  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false)
  const [confirmedAge, setConfirmedAge] = useState(false)
  const [marketingOptIn, setMarketingOptIn] = useState(false)

  const step = STEPS[stepIndex]
  const totalSteps = STEPS.length
  const age = ageFromDob(dob)

  // Fetch interest options (id + slug + name) on mount
  useEffect(() => {
    axiosPrivate
      .get<InterestOption[]>('/api/interests/', { timeout: TIMEOUT_LENGTH_MS })
      .then((res) => setInterestOptions(res.data))
      .catch(() => {})
  }, [])

  // Build a slug→id map for submission
  const slugToId = useMemo(() => {
    const map: Record<string, string> = {}
    for (const opt of interestOptions) {
      map[opt.slug] = opt.id
    }
    return map
  }, [interestOptions])

  // Interest filtering
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

  // Used icebreaker slugs (can't pick the same prompt twice)
  const usedPromptSlugs = useMemo(
    () => new Set(icebreakers.map((ib) => ib.prompt_slug)),
    [icebreakers],
  )

  // ── Validation ───────────────────────────────────────────────────

  /** Returns null if valid, or an error message string. */
  const validateStep = (): string | null => {
    switch (step) {
      case 'basics': {
        const n = name.trim()
        if (!n) return 'Name cannot be empty.'
        if (n.length > MAX_NAME_LENGTH) return `Name must be ${MAX_NAME_LENGTH} characters or less.`
        if (!dob) return 'Date of birth is required.'
        const dobDate = new Date(dob + 'T00:00:00')
        const today = new Date()
        let age = today.getFullYear() - dobDate.getFullYear()
        if (
          today.getMonth() < dobDate.getMonth() ||
          (today.getMonth() === dobDate.getMonth() && today.getDate() < dobDate.getDate())
        ) {
          age--
        }
        if (age < 18) return 'You must be 18 or older.'
        const c = city.trim()
        if (!c) return 'City cannot be empty.'
        if (c.length > MAX_CITY_LENGTH) return `City must be ${MAX_CITY_LENGTH} characters or less.`
        if (!province) return 'Province is required.'
        const a = about.trim()
        if (!a) return 'Bio cannot be empty.'
        if (a.length > MAX_BIO_LENGTH) return `Bio must be ${MAX_BIO_LENGTH} characters or less.`
        return null
      }
      case 'stages': {
        if (kidCount < 0 || kidCount >= 100) return 'Kid count must be between 0 and 99.'
        return null // stages optional
      }
      case 'goals': {
        if (goals.length === 0) return 'Please select at least one goal.'
        if (goals.length > 1 && !primaryGoal) return 'Please select a primary goal.'
        return null
      }
      case 'connections':
        if (connectionStyles.length === 0) return 'Please select at least one connection style.'
        if (matchPriorities.length === 0) return 'Please select at least one match priority.'
        return null
      case 'interests':
        if (selectedInterestIds.length < MIN_INTERESTS)
          return `Please select at least ${MIN_INTERESTS} interests.`
        if (selectedInterestIds.length > MAX_INTERESTS)
          return `You can select at most ${MAX_INTERESTS} interests.`
        return null
      case 'icebreakers': {
        if (icebreakers.length < MIN_ICEBREAKERS)
          return `Please add at least ${MIN_ICEBREAKERS} icebreaker.`
        if (icebreakers.length > MAX_ICEBREAKERS)
          return `You can have at most ${MAX_ICEBREAKERS} icebreakers.`
        for (const ib of icebreakers) {
          if (!ib.answer.trim()) return 'Icebreaker answers cannot be empty.'
          if (ib.answer.length > MAX_ICEBREAKER_ANSWER_LENGTH)
            return `Icebreaker answers must be ${MAX_ICEBREAKER_ANSWER_LENGTH} characters or less.`
        }
        return null
      }
      case 'consent':
        if (!agreedToTerms) return 'You must agree to the Terms & Conditions.'
        if (!agreedToPrivacy) return 'You must acknowledge the Privacy Policy.'
        if (!confirmedAge) return 'You must confirm you are 18 or older.'
        return null
      default:
        return null
    }
  }

  /** Controls button disabled state — checks fields are filled, but not business rules like 18+. */
  const isStepFilled = (): boolean => {
    switch (step) {
      case 'basics':
        return !!name.trim() && !!dob && !!city.trim() && !!province && !!about.trim()
      case 'stages':
        return true
      case 'goals':
        return goals.length > 0 && (goals.length === 1 || !!primaryGoal)
      case 'connections':
        return connectionStyles.length > 0 && matchPriorities.length > 0
      case 'interests':
        return selectedInterestIds.length >= MIN_INTERESTS
      case 'icebreakers':
        return icebreakers.length >= MIN_ICEBREAKERS && icebreakers.every((ib) => !!ib.answer.trim())
      case 'consent':
        return agreedToTerms && agreedToPrivacy && confirmedAge
      default:
        return true
    }
  }

  // ── Navigation ───────────────────────────────────────────────────

  const goNext = () => {
    if (loading || stepIndex >= STEPS.length - 1) return
    const error = validateStep()
    if (error) {
      toastError(error)
      return
    }
    // Auto-set primary goal if only one selected
    if (step === 'goals' && goals.length === 1) {
      setPrimaryGoal(goals[0])
    }
    setStepIndex(stepIndex + 1)
    window.scrollTo({ top: 0 })
  }

  const goBack = async () => {
    if (loading) return
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1)
      window.scrollTo({ top: 0 })
    } else {
      try {
        await axiosPrivate.post('/api/auth/logout', {}, { timeout: TIMEOUT_LENGTH_MS })
      } catch {
        // logout locally even if server call fails
      } finally {
        setAuth({ user: null, accessToken: null })
        navigate(ROUTES.WELCOME)
      }
    }
  }

  const isSkippable = step === 'photo'

  // ── Submit ───────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (loading) return

    // Final consent validation
    const error = validateStep()
    if (error) {
      toastError(error)
      return
    }

    // Resolve interest UUIDs from selected slugs
    const interestUuids = selectedInterestIds
      .map((slug) => slugToId[slug])
      .filter(Boolean)

    const effectivePrimaryGoal = goals.length === 1 ? goals[0] : primaryGoal

    const body = {
      name: name.trim(),
      date_of_birth: dob,
      city: city.trim(),
      province,
      about: about.trim(),
      interests: interestUuids,
      children_age_ranges: stages,
      kid_count: kidCount,
      goals,
      primary_goal: effectivePrimaryGoal,
      connection_styles: connectionStyles,
      match_priorities: matchPriorities,
      icebreakers: icebreakers.map((ib) => ({
        prompt_slug: ib.prompt_slug,
        answer: ib.answer.trim(),
      })),
      accepted_terms: true,
      accepted_privacy_policy: true,
      marketing_emails_opt_in: marketingOptIn,
    }

    try {
      setLoading(true)

      // Step 1: Create profile (JSON)
      const res = await axiosPrivate.post('/api/users/', body, {
        timeout: TIMEOUT_LENGTH_MS,
      })

      let avatarUrl = res.data.avatar_url

      // Step 2: Upload avatar if selected (failure doesn't block)
      if (avatar) {
        try {
          const avatarData = new FormData()
          avatarData.append('avatar', avatar)
          const avatarRes = await axiosPrivate.put('/api/users/me/avatar', avatarData, {
            timeout: TIMEOUT_LENGTH_MS,
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          avatarUrl = avatarRes.data.avatar_url
        } catch {
          toastError('Photo upload failed', 'No worries, you can add one later from your profile.')
        }
      }

      // Hydrate auth state once at the end
      setAuth({
        user: {
          id: res.data.id,
          name: res.data.name,
          age: res.data.age,
          date_of_birth: res.data.date_of_birth,
          city: res.data.city,
          province: res.data.province,
          about: res.data.about,
          avatarUrl,
          interests: res.data.interests ?? [],
          children_age_ranges: res.data.children_age_ranges ?? [],
          kid_count: res.data.kid_count ?? null,
          goals: res.data.goals ?? null,
          primary_goal: res.data.primary_goal ?? null,
          connection_styles: res.data.connection_styles ?? null,
          match_priorities: res.data.match_priorities ?? null,
          icebreakers: res.data.icebreakers ?? null,
          isAdmin: res.data.is_admin ?? false,
          preferences: {
            marketing_emails_opt_in:
              res.data.preferences?.marketing_emails_opt_in ?? marketingOptIn,
          },
          legal_acceptances: { terms: true, privacy_policy: true },
        },
        accessToken,
      })

      // setAuth triggers SetupRoute redirect to welcome screen
    } catch (err: unknown) {
      toastError(
        'Profile creation failed',
        getErrorMessage(err, 'Failed to create profile. Please try again.'),
      )
    } finally {
      setLoading(false)
    }
  }

  // ── Photo handling ───────────────────────────────────────────────

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatar(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  // ── Icebreaker helpers ───────────────────────────────────────────

  const saveIcebreaker = () => {
    if (!selectedPromptSlug || !icebreakerAnswer.trim()) return
    const entry: IcebreakerDraft = {
      prompt_slug: selectedPromptSlug,
      answer: icebreakerAnswer.trim(),
    }
    if (editingIcebreakerIndex !== null) {
      setIcebreakers((prev) =>
        prev.map((ib, i) => (i === editingIcebreakerIndex ? entry : ib)),
      )
    } else {
      setIcebreakers((prev) => [...prev, entry])
    }
    setSelectedPromptSlug(null)
    setIcebreakerAnswer('')
    setEditingIcebreakerIndex(null)
    setShowPromptPicker(false)
  }

  const removeIcebreaker = (index: number) => {
    setIcebreakers((prev) => prev.filter((_, i) => i !== index))
  }

  const editIcebreaker = (index: number) => {
    const ib = icebreakers[index]
    setSelectedPromptSlug(ib.prompt_slug)
    setIcebreakerAnswer(ib.answer)
    setEditingIcebreakerIndex(index)
  }

  const cancelIcebreakerEdit = () => {
    setSelectedPromptSlug(null)
    setIcebreakerAnswer('')
    setEditingIcebreakerIndex(null)
    setShowPromptPicker(false)
  }


  // ── Progress ───────────────────────────────────────────────────

  const progress = (stepIndex / totalSteps) * 100

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-card">
        <div className="mx-auto max-w-md sm:max-w-lg md:max-w-2xl px-6 py-3">
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={goBack}
              aria-label="Back"
              className="-ml-1 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
              disabled={loading}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            {isSkippable ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={goNext}
                className="text-muted-foreground hover:text-foreground"
                disabled={loading}
              >
                Skip
              </Button>
            ) : (
              <div className="w-12" />
            )}
          </div>
          <Progress
            value={progress}
            className="h-1.5"
          />
        </div>
      </div>

      <div
        key={step}
        className="mx-auto max-w-md sm:max-w-lg md:max-w-2xl animate-fade-in space-y-6 px-6 py-7"
      >
        {/* 1. Basics */}
        {step === 'basics' && (
          <>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Let's start here
              </p>
              <h2 className="font-heading text-2xl font-semibold text-foreground">
                First, the basics
              </h2>
              <p className="text-sm text-muted-foreground">
                Just enough for other dads to know who they're talking to, and
                for us to find dads close to you.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Your name</Label>
                <Input
                  id="name"
                  placeholder="Full name"
                  maxLength={MAX_NAME_LENGTH}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-md border-border shadow-sm"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dob">Date of birth</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start rounded-md font-normal px-3 border-border shadow-sm"
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-1.5 h-4 w-4 text-muted-foreground" />
                      {dob ? (
                        format(parseISO(dob), 'MMMM d, yyyy')
                      ) : (
                        <span className="text-muted-foreground">
                          Select your date of birth
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={dob ? parseISO(dob) : undefined}
                      onSelect={(date) =>
                        setDob(date ? format(date, 'yyyy-MM-dd') : '')
                      }
                      disabled={(date) => date > new Date()}
                      captionLayout="dropdown"
                      fromYear={1900}
                      toYear={new Date().getFullYear()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Lock className="mt-0.5 h-3 w-3 shrink-0" />
                  Your birthday stays private. Other dads only see your age.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="e.g. Toronto"
                    maxLength={MAX_CITY_LENGTH}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="rounded-md border-border shadow-sm"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province">Province</Label>
                  <Select
                    value={province}
                    onValueChange={setProvince}
                    disabled={loading}
                  >
                    <SelectTrigger
                      id="province"
                      className="rounded-md border-border shadow-sm"
                    >
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCE_OPTIONS.map((p) => (
                        <SelectItem
                          key={p.value}
                          value={p.value}
                        >
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
                  value={about}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_BIO_LENGTH)
                      setAbout(e.target.value)
                  }}
                  className="min-h-24 rounded-md border-border shadow-sm"
                  disabled={loading}
                />
                <p className="text-right text-xs text-muted-foreground">
                  {about.length}/{MAX_BIO_LENGTH}
                </p>
              </div>
            </div>
          </>
        )}

        {/* 2. Stages + kid count */}
        {step === 'stages' && (
          <>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Dad life
              </p>
              <h2 className="font-heading text-2xl font-semibold text-foreground">
                Where are you at in dad life?
              </h2>
              <p className="text-sm text-muted-foreground">
                We'll point you toward dads navigating similar stages.
              </p>
            </div>

            <div className="space-y-2">
              <Label>How many kids do you have?</Label>
              <Input
                type="number"
                min={0}
                max={99}
                value={kidCount}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10)
                  if (!Number.isNaN(v) && v >= 0 && v < 100) setKidCount(v)
                  else if (e.target.value === '') setKidCount(0)
                }}
                className="w-24 rounded-md border-border shadow-sm"
                disabled={loading}
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">
                What stage are your kids at?
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Select all that apply.
              </p>
              <div className="flex flex-wrap gap-2">
                {STAGE_OPTIONS.map((s) => {
                  const selected = stages.includes(s.value)
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setStages(toggle(stages, s.value))}
                      disabled={loading}
                      className={cn(
                        'rounded-md border px-3.5 py-2.5 text-sm font-medium transition-all active:scale-[0.97]',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-border bg-card text-foreground hover:border-primary/50',
                      )}
                    >
                      {s.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* 3. Goals */}
        {step === 'goals' && (
          <>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Looking for
              </p>
              <h2 className="font-heading text-2xl font-semibold text-foreground">
                What are you hoping to find here?
              </h2>
              <p className="text-sm text-muted-foreground">
                Everyone joins for something a little different. Pick everything
                that sounds like you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {GOAL_OPTIONS.map((g) => {
                const selected = goals.includes(g.value)
                return (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => {
                      const next = toggle(goals, g.value)
                      setGoals(next)
                      if (primaryGoal && !next.includes(primaryGoal))
                        setPrimaryGoal(null)
                    }}
                    disabled={loading}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-all active:scale-[0.99]',
                      selected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-card hover:border-primary/50',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30',
                      )}
                    >
                      {selected && <Check className="h-3 w-3" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {g.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{g.hint}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {goals.length > 1 && (
              <div className="animate-fade-in space-y-3 rounded-lg bg-card p-5 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    What matters most right now?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    We'll lead with this when recommending dads, communities and
                    events.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {goals.map((g) => {
                    const opt = GOAL_OPTIONS.find((o) => o.value === g)
                    const active = primaryGoal === g
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setPrimaryGoal(g)}
                        disabled={loading}
                        className={cn(
                          'rounded-md border px-3 py-2 text-xs font-semibold transition-all active:scale-[0.97]',
                          active
                            ? 'border-primary bg-gradient-gold text-primary-foreground shadow-sm'
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
          </>
        )}

        {/* 4. Connection styles + match priorities */}
        {step === 'connections' && (
          <>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Looking for
              </p>
              <h2 className="font-heading text-2xl font-semibold text-foreground">
                What kind of connections are you after?
              </h2>
              <p className="text-sm text-muted-foreground">
                Two dads can both want friends and mean totally different
                things. We'll introduce you to dads looking for something
                similar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {CONNECTION_STYLE_OPTIONS.map((c) => {
                const selected = connectionStyles.includes(c.value)
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() =>
                      setConnectionStyles(toggle(connectionStyles, c.value))
                    }
                    disabled={loading}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-all active:scale-[0.99]',
                      selected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-card hover:border-primary/50',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/30',
                      )}
                    >
                      {selected && <Check className="h-3 w-3" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {c.label}
                      </p>
                      <p className="text-xs text-muted-foreground">{c.hint}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            <div>
              <p className="text-sm font-semibold text-foreground">
                What matters most when meeting another dad?
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                We'll weight your recommendations around these.
              </p>
              <div className="flex flex-wrap gap-2">
                {MATCH_PRIORITY_OPTIONS.map((p) => {
                  const selected = matchPriorities.includes(p.value)
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() =>
                        setMatchPriorities(toggle(matchPriorities, p.value))
                      }
                      disabled={loading}
                      className={cn(
                        'rounded-md border px-4 py-2.5 text-sm font-medium transition-all active:scale-[0.97]',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-border bg-card text-foreground hover:border-primary/50',
                      )}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* 6. Interests */}
        {step === 'interests' && (
          <>
            <div>
              <div className="space-y-1 mb-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Your vibe
                </p>
                <h2 className="font-heading text-2xl font-semibold text-foreground">
                  What are you into?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Choose {MIN_INTERESTS}-{MAX_INTERESTS}.
                </p>
              </div>

              <div className="sticky top-[5.5rem] z-[5] -mx-1 bg-background px-1 pt-2 pb-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={interestQuery}
                    onChange={(e) => setInterestQuery(e.target.value)}
                    placeholder="Search interests"
                    className="rounded-md pl-9"
                    disabled={loading}
                  />
                </div>
                <div className="mt-1.5 mb-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{selectedInterestIds.length} selected</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredInterests.map((opt) => {
                const selected = selectedInterestIds.includes(opt.slug)
                const atMax = selectedInterestIds.length >= MAX_INTERESTS
                const display = INTEREST_DISPLAY_MAP[opt.slug]
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={loading || (!selected && atMax)}
                    onClick={() =>
                      setSelectedInterestIds(
                        toggle(selectedInterestIds, opt.slug, MAX_INTERESTS),
                      )
                    }
                    className={cn(
                      'flex flex-col items-center justify-center gap-1.5 rounded-lg border p-4 text-center transition-all active:scale-[0.97] disabled:opacity-40',
                      selected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border bg-card hover:border-primary/50',
                    )}
                  >
                    <span className="text-2xl">{display?.emoji ?? '✨'}</span>
                    <span className="text-sm font-medium text-foreground">
                      {display?.label ?? opt.name}
                    </span>
                  </button>
                )
              })}
              </div>
              {filteredInterests.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nothing matches "{interestQuery}".
                </p>
              )}
            </div>
          </>
        )}

        {/* 7. Icebreakers */}
        {step === 'icebreakers' && (
          <>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Your vibe
              </p>
              <h2 className="font-heading text-2xl font-semibold text-foreground">
                Give dads something to start with
              </h2>
              <p className="text-sm text-muted-foreground">
                You can add up to {MAX_ICEBREAKERS}.
              </p>
            </div>

            {/* Saved icebreakers */}
            {icebreakers.length > 0 && (
              <div className="space-y-3">
                {icebreakers.map((ib, i) => {
                  const prompt = ICEBREAKER_PROMPTS.find(
                    (p) => p.slug === ib.prompt_slug,
                  )
                  const isEditing = editingIcebreakerIndex === i

                  if (isEditing) {
                    return (
                      <div
                        key={ib.prompt_slug}
                        className="animate-fade-in rounded-xl border-2 border-primary/30 bg-card p-5 shadow-md"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                          {prompt?.text ?? ib.prompt_slug}
                        </p>
                        <Textarea
                          autoFocus
                          value={icebreakerAnswer}
                          onChange={(e) => {
                            if (e.target.value.length <= MAX_ICEBREAKER_ANSWER_LENGTH)
                              setIcebreakerAnswer(e.target.value)
                          }}
                          placeholder="Keep it short and real..."
                          className="mt-3 min-h-24 rounded-md border-border shadow-sm"
                          disabled={loading}
                        />
                        <div className="mt-3 flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {icebreakerAnswer.length}/{MAX_ICEBREAKER_ANSWER_LENGTH}
                          </p>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-muted-foreground"
                              onClick={cancelIcebreakerEdit}
                              disabled={loading}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="rounded-md"
                              onClick={saveIcebreaker}
                              disabled={loading || !icebreakerAnswer.trim()}
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
                      <div className="absolute top-4 right-4 flex gap-1.5">
                        <button
                          type="button"
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
                          onClick={() => editIcebreaker(i)}
                          disabled={loading}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeIcebreaker(i)}
                          disabled={loading}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-semibold uppercase tracking-wider text-primary pr-16">
                        {prompt?.text ?? ib.prompt_slug}
                      </p>
                      <p className="mt-3 text-base leading-relaxed text-foreground whitespace-pre-line">
                        {ib.answer}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Add another button — shown when there are saved icebreakers, picker is hidden, and not at max */}
            {icebreakers.length > 0 &&
              icebreakers.length < MAX_ICEBREAKERS &&
              !showPromptPicker &&
              editingIcebreakerIndex === null && (
                <Button
                  variant="outline"
                  className="w-full rounded-lg border-2 border-dashed border-primary/40 py-6 text-sm font-semibold text-primary hover:border-primary hover:bg-primary/5"
                  onClick={() => setShowPromptPicker(true)}
                  disabled={loading}
                >
                  + Add another icebreaker
                </Button>
              )}

            {/* Prompt picker — shown on first visit (no icebreakers) or when "Add another" is clicked */}
            {selectedPromptSlug === null &&
              editingIcebreakerIndex === null &&
              icebreakers.length < MAX_ICEBREAKERS &&
              (icebreakers.length === 0 || showPromptPicker) && (
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    Pick a prompt
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {ICEBREAKER_PROMPTS.filter(
                      (p) => !usedPromptSlugs.has(p.slug),
                    ).map((p) => (
                      <button
                        key={p.slug}
                        type="button"
                        onClick={() => {
                          setSelectedPromptSlug(p.slug)
                          setIcebreakerAnswer('')
                          setEditingIcebreakerIndex(null)
                        }}
                        disabled={loading}
                        className="w-full rounded-lg border border-border bg-card px-4 py-3 text-left text-sm text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
                      >
                        {p.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {/* New answer editor — shown when a prompt is picked (not editing existing) */}
            {selectedPromptSlug !== null && editingIcebreakerIndex === null && (
              <div className="animate-fade-in rounded-xl border-2 border-primary/30 bg-card p-5 shadow-md">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {
                    ICEBREAKER_PROMPTS.find(
                      (p) => p.slug === selectedPromptSlug,
                    )?.text
                  }
                </p>
                <Textarea
                  autoFocus
                  value={icebreakerAnswer}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_ICEBREAKER_ANSWER_LENGTH)
                      setIcebreakerAnswer(e.target.value)
                  }}
                  placeholder="Keep it short and real..."
                  className="mt-3 min-h-24 rounded-md border-border shadow-sm"
                  disabled={loading}
                />
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {icebreakerAnswer.length}/{MAX_ICEBREAKER_ANSWER_LENGTH}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground"
                      onClick={cancelIcebreakerEdit}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-md"
                      onClick={saveIcebreaker}
                      disabled={loading || !icebreakerAnswer.trim()}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* 8. Photo */}
        {step === 'photo' && (
          <>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Finishing up
              </p>
              <h2 className="font-heading text-2xl font-semibold text-foreground">
                Put a face to the name
              </h2>
              <p className="text-sm text-muted-foreground">
                Say cheese!
              </p>
            </div>

            <div className="flex flex-col items-center gap-5 rounded-lg bg-card p-7 shadow-sm">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="group relative h-36 w-36 overflow-hidden rounded-full border-4 border-primary/20 bg-muted/50 transition-all hover:border-primary/40 active:scale-[0.97]"
                disabled={loading}
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Your profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
                    <UserRound className="h-9 w-9" />
                    <span className="text-xs font-medium">Add photo</span>
                  </span>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".png,.jpg,.jpeg"
                className="hidden"
                onChange={handlePhoto}
                disabled={loading}
              />
              <Button
                variant="outline"
                className="rounded-md border-2 border-primary text-foreground"
                onClick={() => fileRef.current?.click()}
                disabled={loading}
              >
                {avatarPreview ? 'Choose a different photo' : 'Upload a photo'}
              </Button>
              {avatarPreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => {
                    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
                    setAvatar(null)
                    setAvatarPreview(null)
                    if (fileRef.current) fileRef.current.value = ''
                  }}
                  disabled={loading}
                >
                  Remove
                </Button>
              )}
            </div>
          </>
        )}

        {/* 9. Consent */}
        {step === 'consent' && (
          <>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Finishing up
              </p>
              <h2 className="font-heading text-2xl font-semibold text-foreground">
                Last quick thing
              </h2>
              <p className="text-sm text-muted-foreground">
                Keeping Next Level Dads a safe, respectful space for everyone.
              </p>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg bg-card p-5 shadow-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Required
                </p>
                <div className="space-y-4">
                  <label className="flex cursor-pointer items-start gap-3">
                    <Checkbox
                      checked={agreedToTerms}
                      onCheckedChange={(v) => setAgreedToTerms(v === true)}
                      className="mt-0.5"
                      disabled={loading}
                    />
                    <span className="text-sm leading-relaxed text-foreground">
                      I agree to the{' '}
                      <a
                        href={`${WEBSITE_BASE_URL}/terms`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-primary underline underline-offset-4"
                      >
                        Terms &amp; Conditions
                      </a>{' '}
                      and{' '}
                      <a
                        href={`${WEBSITE_BASE_URL}/privacy`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-primary underline underline-offset-4"
                      >
                        Privacy Policy
                      </a>
                      .
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3">
                    <Checkbox
                      checked={agreedToPrivacy}
                      onCheckedChange={(v) => setAgreedToPrivacy(v === true)}
                      className="mt-0.5"
                      disabled={loading}
                    />
                    <span className="text-sm leading-relaxed text-foreground">
                      I acknowledge the{' '}
                      <a
                        href={`${WEBSITE_BASE_URL}/privacy`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-primary underline underline-offset-4"
                      >
                        Privacy Policy
                      </a>
                      .
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3">
                    <Checkbox
                      checked={confirmedAge}
                      onCheckedChange={(v) => setConfirmedAge(v === true)}
                      className="mt-0.5"
                      disabled={loading}
                    />
                    <span className="text-sm leading-relaxed text-foreground">
                      I confirm I'm 18 years or older.
                    </span>
                  </label>
                </div>
              </div>

              <div className="rounded-lg bg-card p-5 shadow-sm">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Optional
                </p>
                <label className="flex cursor-pointer items-start gap-3">
                  <Checkbox
                    checked={marketingOptIn}
                    onCheckedChange={(v) => setMarketingOptIn(v === true)}
                    className="mt-0.5"
                    disabled={loading}
                  />
                  <span className="text-sm leading-relaxed text-foreground">
                    Email me about new events, communities and product updates.
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      Unsubscribe any time. Never required.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sticky footer CTA */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background px-6 py-4">
        <div className="mx-auto max-w-md sm:max-w-lg md:max-w-2xl space-y-2">
          <Button
            size="lg"
            disabled={loading || !isStepFilled()}
            className="w-full rounded-md bg-gradient-gold text-base font-semibold shadow-md disabled:opacity-40"
            onClick={step === 'consent' ? handleSubmit : goNext}
          >
            {loading
              ? 'Creating profile...'
              : step === 'consent'
                ? 'Join Next Level Dads'
                : 'Continue'}
          </Button>
          {step === 'interests' &&
            selectedInterestIds.length < MIN_INTERESTS && (
              <p className="text-center text-xs text-muted-foreground">
                Pick at least {MIN_INTERESTS} so we can find common ground.
              </p>
            )}
        </div>
      </div>
    </div>
  )
}

export default ProfileSetup
