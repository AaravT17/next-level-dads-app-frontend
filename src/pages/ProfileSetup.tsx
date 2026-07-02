import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, CalendarIcon } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ROUTES } from '@/lib/routes'
import {
  MAX_BIO_LENGTH,
  TIMEOUT_LENGTH_MS,
  INTEREST_OPTIONS,
  STAGE_OPTIONS,
  PROVINCE_OPTIONS,
} from '@/config/constants'
import axiosPrivate from '@/api/axiosPrivate'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/use-toast'

const ProfileSetup = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const { accessToken, setAuth } = useAuth()
  const [step, setStep] = useState(1)
  const totalSteps = 5

  const [formData, setFormData] = useState({
    name: '',
    date_of_birth: '',
    city: '',
    province: '',
    about: '',
    interests: [] as string[],
    stages: [] as string[],
  })

  const [customInterest, setCustomInterest] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [confirmedAge, setConfirmedAge] = useState(false)
  const [marketingOptIn, setMarketingOptIn] = useState(false)

  const WEBSITE_BASE_URL = import.meta.env.VITE_WEBSITE_BASE_URL as string

  const toggleInterest = (interest: string) => {
    if (loading) return
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  const toggleStage = (stage: string) => {
    if (loading) return
    setFormData((prev) => ({
      ...prev,
      stages: prev.stages.includes(stage)
        ? prev.stages.filter((s) => s !== stage)
        : [...prev.stages, stage],
    }))
  }

  const handleAddCustomInterest = () => {
    if (loading) return
    const trimmed = customInterest.trim()
    if (!trimmed || formData.interests.includes(trimmed)) return
    setFormData((prev) => ({
      ...prev,
      interests: [...prev.interests, trimmed],
    }))
    setCustomInterest('')
    setShowCustomInput(false)
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (loading) return
    const file = e.target.files?.[0] ?? null
    if (!file) return // user cancelled, keep existing selection

    // revoke old preview URL
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview)
    }

    setAvatar(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleNext = () => {
    if (loading) return
    if (step >= totalSteps) return
    if (step === 1) {
      const name = formData.name.trim()
      const city = formData.city.trim()
      if (!name || !formData.date_of_birth || !city || !formData.province) {
        toast({
          title: 'Please fill out all required fields',
          description: 'Name, date of birth, city, and province are required.',
          variant: 'destructive',
        })
        return
      }
    } else if (step === 2) {
      const about = formData.about.trim()
      if (!about) {
        toast({
          title: 'Please fill out the about section',
          description: 'Tell us a bit about yourself.',
          variant: 'destructive',
        })
        return
      }
      if (formData.stages.length === 0) {
        toast({
          title: "Please select at least one children's age range",
          description: 'This helps us connect you with similar dads.',
          variant: 'destructive',
        })
        return
      }
    }
    // no required fields on step 3
    setStep(step + 1)
  }

  const handleBack = async () => {
    if (loading) return
    if (step > 1) {
      setStep(step - 1)
    } else {
      // if we're at step 1, treat back as a cancel and log the user out
      try {
        await axiosPrivate.post(
          '/api/auth/logout',
          {},
          {
            timeout: TIMEOUT_LENGTH_MS,
          },
        )
      } catch {
        // logout locally even if server call fails
      } finally {
        setAuth({ user: null, accessToken: null })
        navigate(ROUTES.WELCOME)
      }
    }
  }

  const handleSubmit = async () => {
    if (loading) return
    if (!agreedToTerms || !confirmedAge) {
      toast({
        title: 'Please accept all required agreements',
        description: 'You must agree to the Terms and Conditions, Privacy Policy, and confirm your age.',
        variant: 'destructive',
      })
      return
    }
    const profileData = new FormData()
    profileData.append('name', formData.name)
    profileData.append('date_of_birth', formData.date_of_birth)
    profileData.append('city', formData.city)
    profileData.append('province', formData.province)
    profileData.append('about', formData.about)
    formData.interests.forEach((i) => profileData.append('interests', i))
    formData.stages.forEach((stage) =>
      profileData.append('children_age_ranges', stage),
    )
    if (avatar) {
      profileData.append('avatar', avatar)
    }
    profileData.append('accepted_terms', 'true')
    profileData.append('accepted_privacy_policy', 'true')
    profileData.append('marketing_emails_opt_in', String(marketingOptIn))

    try {
      setLoading(true)
      const res = await axiosPrivate.post('/api/users/', profileData, {
        timeout: TIMEOUT_LENGTH_MS,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      setAuth({
        user: {
          id: res.data.id,
          name: res.data.name,
          age: res.data.age,
          date_of_birth: res.data.date_of_birth,
          city: res.data.city,
          province: res.data.province,
          about: res.data.about,
          avatarUrl: res.data.avatar_url,
          interests: res.data.interests,
          children_age_ranges: res.data.children,
          isAdmin: res.data.is_admin ?? false,
          preferences: {
            marketing_emails_opt_in: res.data.preferences?.marketing_emails_opt_in ?? marketingOptIn,
          },
          legal_acceptances: {
            terms: true,
            privacy_policy: true,
          },
        },
        accessToken,
      })
      navigate(ROUTES.DISCOVER)
    } catch (err: any) {
      toast({
        title: 'Profile creation failed',
        description:
          err.response?.data?.detail ||
          'Failed to create profile. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const progress = (step / totalSteps) * 100

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card border-b border-border">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handleBack}
              className="text-muted-foreground"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <span className="text-sm font-medium text-muted-foreground">
              Step {step} of {totalSteps}
            </span>
            {/* <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(ROUTES.DISCOVER_DADS)}
              className="text-muted-foreground hover:text-foreground"
              disabled={loading}
            >
              Skip
            </Button> */}
          </div>
          <Progress
            value={progress}
            className="h-2"
          />
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-8 space-y-6 animate-fade-in">
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-heading font-semibold text-foreground">
                Tell us about yourself
              </h2>
              <p className="text-muted-foreground">
                Let's start with the basics
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="rounded-lg"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start rounded-lg font-normal"
                      disabled={loading}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {formData.date_of_birth ? (
                        format(parseISO(formData.date_of_birth), 'MMMM d, yyyy')
                      ) : (
                        <span className="text-muted-foreground">Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date_of_birth ? parseISO(formData.date_of_birth) : undefined}
                      onSelect={(date) =>
                        setFormData({
                          ...formData,
                          date_of_birth: date ? format(date, 'yyyy-MM-dd') : '',
                        })
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

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Your city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="rounded-lg"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="province">Province</Label>
                <Select
                  value={formData.province}
                  onValueChange={(value) =>
                    setFormData({ ...formData, province: value })
                  }
                  disabled={loading}
                >
                  <SelectTrigger
                    id="province"
                    className="rounded-lg"
                  >
                    <SelectValue placeholder="Select your province" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCE_OPTIONS.map((province) => (
                      <SelectItem
                        key={province.value}
                        value={province.value}
                      >
                        {province.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-heading font-semibold text-foreground">
                Share your story
              </h2>
              <p className="text-muted-foreground">
                Help others get to know you
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="about">About You</Label>
                <Textarea
                  id="about"
                  placeholder="Love hiking with my kids and exploring new coffee shops."
                  value={formData.about}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_BIO_LENGTH) {
                      setFormData({ ...formData, about: e.target.value })
                    }
                  }}
                  className="rounded-lg min-h-32"
                  maxLength={MAX_BIO_LENGTH}
                  required
                  disabled={loading}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {formData.about.length}/{MAX_BIO_LENGTH}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Children's Age (Select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {STAGE_OPTIONS.map((stage) => (
                    <Badge
                      key={stage.value}
                      variant={
                        formData.stages.includes(stage.value)
                          ? 'default'
                          : 'soft'
                      }
                      className="cursor-pointer rounded-full"
                      onClick={() => toggleStage(stage.value)}
                    >
                      {stage.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-heading font-semibold text-foreground">
                Your interests
              </h2>
              <p className="text-muted-foreground">
                Select what you enjoy doing
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => (
                <Badge
                  key={interest}
                  variant={
                    formData.interests.includes(interest) ? 'default' : 'soft'
                  }
                  className="cursor-pointer rounded-full"
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </Badge>
              ))}
              {formData.interests
                .filter((i) => !INTEREST_OPTIONS.includes(i))
                .map((interest) => (
                  <Badge
                    key={interest}
                    variant="default"
                    className="cursor-pointer rounded-full bg-gradient-gold"
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              {!showCustomInput ? (
                <Badge
                  variant="outline"
                  className="cursor-pointer rounded-full"
                  onClick={() => {
                    if (loading) return
                    setShowCustomInput(true)
                  }}
                >
                  + Add your own
                </Badge>
              ) : (
                <div className="flex gap-2 w-full">
                  <Input
                    placeholder="Type your interest..."
                    value={customInterest}
                    onChange={(e) => setCustomInterest(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleAddCustomInterest()
                    }
                    className="rounded-lg"
                    autoFocus
                    disabled={loading}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddCustomInterest}
                    className="rounded-full"
                    disabled={
                      loading ||
                      !customInterest.trim() ||
                      formData.interests.includes(customInterest.trim())
                    }
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-heading font-semibold text-foreground">
                Add a Photo (Optional)
              </h2>
              <p className="text-muted-foreground">
                Help other dads recognize you
              </p>
            </div>

            <div className="flex flex-col items-center space-y-4">
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-muted-foreground text-sm">
                    No photo
                  </span>
                )}
              </div>
              <input
                type="file"
                accept=".png,.jpg,.jpeg"
                id="avatar-upload"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={loading}
              />
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() =>
                  document.getElementById('avatar-upload')?.click()
                }
                disabled={loading}
              >
                Upload Photo
              </Button>
              {avatarPreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => {
                    // revoke old preview URL
                    if (avatarPreview) {
                      URL.revokeObjectURL(avatarPreview)
                    }
                    setAvatar(null)
                    setAvatarPreview(null)
                    // reset input so the same file can be selected again
                    const input = document.getElementById(
                      'avatar-upload',
                    ) as HTMLInputElement
                    if (input) input.value = ''
                  }}
                  disabled={loading}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-heading font-semibold text-foreground">
                One last step
              </h2>
              <p className="text-muted-foreground">
                Please review and accept the following before creating your profile.
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(!!checked)}
                  disabled={loading}
                  className="mt-0.5"
                />
                <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                  I agree to the{' '}
                  <a
                    href={`${WEBSITE_BASE_URL}/terms`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4"
                  >
                    Terms and Conditions
                  </a>{' '}
                  and{' '}
                  <a
                    href={`${WEBSITE_BASE_URL}/privacy`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4"
                  >
                    Privacy Policy
                  </a>
                  . <span className="text-destructive">*</span>
                </label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="age"
                  checked={confirmedAge}
                  onCheckedChange={(checked) => setConfirmedAge(!!checked)}
                  disabled={loading}
                  className="mt-0.5"
                />
                <label htmlFor="age" className="text-sm leading-relaxed cursor-pointer">
                  I confirm I am 18 years of age or older.{' '}
                  <span className="text-destructive">*</span>
                </label>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="marketing"
                  checked={marketingOptIn}
                  onCheckedChange={(checked) => setMarketingOptIn(!!checked)}
                  disabled={loading}
                  className="mt-0.5"
                />
                <label htmlFor="marketing" className="text-sm leading-relaxed cursor-pointer text-muted-foreground">
                  I'd like to receive occasional emails about new features, events, and updates from Next Level Dads. I can unsubscribe at any time.
                </label>
              </div>
            </div>
          </div>
        )}

        <Button
          size="lg"
          className="w-full rounded-full bg-gradient-gold font-semibold"
          onClick={step < totalSteps ? handleNext : handleSubmit}
          disabled={loading}
        >
          {step === totalSteps ? 'Complete Profile' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}

export default ProfileSetup
