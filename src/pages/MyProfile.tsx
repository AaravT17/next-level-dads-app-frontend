import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { AppBar } from '@/components/layout/AppBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import {} from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar as CalendarIcon, Pencil, Upload, Trash2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
} from '@/components/ui/alert-dialog'
import { ROUTES } from '@/lib/routes'
import { ProfileHero } from '@/features/profile/components/ProfileHero'
import {
  ProfileCard,
  ProfileSection,
} from '@/features/profile/components/ProfileSection'
import { useAuth } from '@/contexts/AuthContext'
import axios from 'axios'
import axiosPrivate from '@/api/axiosPrivate'
import {
  TIMEOUT_LENGTH_MS,
  INTEREST_OPTIONS,
  STAGE_OPTIONS,
  PROVINCE_OPTIONS,
} from '@/config/constants'
import { toastError, toastSuccess } from '@/lib/toast'

interface UserResponse {
  id: string
  name: string
  age: number | null
  date_of_birth: string | null
  city: string
  province: string
  about: string
  avatar_url: string | null
  interests: string[]
  children: string[]
}

const MyProfile = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, accessToken, setAuth } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // This route *is* the editor now; /you is the read-only hub.
  const [isLoading, setIsLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Custom interest state
  const [customInterest, setCustomInterest] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    date_of_birth: '',
    city: '',
    province: '',
    about: '',
    interests: [] as string[],
    children_age_ranges: [] as string[],
  })

  // Initialize form data when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        date_of_birth: user.date_of_birth ?? '',
        city: user.city,
        province: user.province,
        about: user.about,
        interests: [...user.interests],
        children_age_ranges: [...user.children_age_ranges],
      })
    }
  }, [user])

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: (data: {
      name: string
      date_of_birth: string
      city: string
      province: string
      about: string
      interests: string[]
      children_age_ranges: string[]
    }) =>
      axiosPrivate.patch<UserResponse>('/api/users/me', data, {
        timeout: TIMEOUT_LENGTH_MS,
      }),
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
          interests: data.interests,
          children_age_ranges: data.children,
          isAdmin: user?.isAdmin ?? false,
          preferences: user?.preferences ?? { marketing_emails_opt_in: false },
          legal_acceptances: user?.legal_acceptances ?? { terms: false, privacy_policy: false },
        },
        accessToken,
      })
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      setCustomInterest('')
      setShowCustomInput(false)
      toastSuccess('Profile updated successfully.')
      // This route is the editor; a successful save returns to the hub.
      navigate(ROUTES.YOU)
    },
    onError: (error) => {
      toastError(axios.isAxiosError(error) && error.response?.status === 429
          ? 'Profile update limit reached. Please try again later.'
          : 'Failed to update profile. Please try again.')
    },
    onSettled: () => {
      setIsLoading(false)
    },
  })

  // Upload avatar mutation
  const uploadAvatar = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append('avatar', file)
      return axiosPrivate.put<{ avatar_url: string }>(
        '/api/users/me/avatar',
        formData,
        {
          timeout: TIMEOUT_LENGTH_MS,
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      )
    },
    onSuccess: (res) => {
      if (user) {
        setAuth({
          user: { ...user, avatarUrl: res.data.avatar_url },
          accessToken,
        })
      }
      setAvatarPreview(null)
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      toastSuccess('Avatar updated successfully.')
    },
    onError: (error) => {
      setAvatarPreview(null)
      toastError(axios.isAxiosError(error) && error.response?.status === 429
          ? 'Avatar upload limit reached. Please try again later.'
          : 'Failed to upload avatar. Please try again.')
    },
    onSettled: () => {
      setIsLoading(false)
    },
  })

  // Delete avatar mutation
  const deleteAvatar = useMutation({
    mutationFn: () =>
      axiosPrivate.delete('/api/users/me/avatar', {
        timeout: TIMEOUT_LENGTH_MS,
      }),
    onSuccess: () => {
      if (user) {
        setAuth({
          user: { ...user, avatarUrl: null },
          accessToken,
        })
      }
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      toastSuccess('Avatar removed successfully.')
    },
    onError: () => {
      toastError('Failed to remove avatar. Please try again.')
    },
    onSettled: () => {
      setIsLoading(false)
    },
  })





  const handleAvatarClick = () => {
    if (!isLoading) {
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview immediately
    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)

    // Upload immediately
    setIsLoading(true)
    uploadAvatar.mutate(file)

    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleRemoveAvatar = () => {
    if (isLoading) return
    setIsLoading(true)
    deleteAvatar.mutate()
  }


  const handleCancel = () => {
    // Reset form to current user values
    if (user) {
      setFormData({
        name: user.name,
        date_of_birth: user.date_of_birth ?? '',
        city: user.city,
        province: user.province,
        about: user.about,
        interests: [...user.interests],
        children_age_ranges: [...user.children_age_ranges],
      })
    }
    setCustomInterest('')
    setShowCustomInput(false)
    navigate(ROUTES.YOU)
  }

  const handleAddCustomInterest = () => {
    const trimmed = customInterest.trim()
    if (!trimmed || formData.interests.includes(trimmed)) return
    setFormData((prev) => ({
      ...prev,
      interests: [...prev.interests, trimmed],
    }))
    setCustomInterest('')
    setShowCustomInput(false)
  }

  const handleSave = () => {
    const name = formData.name.trim()
    const city = formData.city.trim()
    const about = formData.about.trim()
    if (!name || !formData.date_of_birth || !city || !formData.province || !about || formData.children_age_ranges.length === 0) {
      toastError('Please fill out all required fields', 'Name, date of birth, city, province, about, and children\'s age are required.')
      return
    }
    setIsLoading(true)
    updateProfile.mutate({
      name,
      date_of_birth: formData.date_of_birth,
      city,
      province: formData.province,
      about,
      interests: formData.interests,
      children_age_ranges: formData.children_age_ranges,
    })
  }

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  const toggleStage = (stage: string) => {
    setFormData((prev) => ({
      ...prev,
      children_age_ranges: prev.children_age_ranges.includes(stage)
        ? prev.children_age_ranges.filter((s) => s !== stage)
        : [...prev.children_age_ranges, stage],
    }))
  }

  if (!user) {
    return null
  }

  // The uploaded preview wins while it is in flight; past that UserAvatar
  // falls back to initials, which is what every other avatar in the app does.
  const displayAvatar = avatarPreview || user.avatarUrl

  return (
    <>
      <AppBar title="Edit profile" leading="back" backTo={ROUTES.YOU} />

      <PageContainer className="space-y-6 animate-fade-in">
        <ProfileHero
          // The hero previews the draft, so the name above the form and the
          // name in it cannot disagree while you type. Falling back to the
          // saved name keeps the heading from emptying out when the field is
          // cleared. Age and location are omitted: both come from fields in
          // the form below, where they are already shown and editable.
          name={formData.name || user.name}
          avatarUrl={displayAvatar}
          isAvatarBusy={isLoading}
          avatarAction={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  aria-label="Change photo"
                  className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full shadow-md"
                  disabled={isLoading}
                >
                  <Pencil aria-hidden className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleAvatarClick}>
                  <Upload aria-hidden className="w-4 h-4 mr-2" />
                  Upload photo
                </DropdownMenuItem>
                {user.avatarUrl && (
                  <DropdownMenuItem
                    onClick={handleRemoveAvatar}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 aria-hidden className="w-4 h-4 mr-2" />
                    Remove photo
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <ProfileCard>
          <ProfileSection title="Name">
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Your name"
              className="rounded-lg"
              disabled={isLoading}
            />
          </ProfileSection>

          <ProfileSection title="Date of birth">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-lg font-normal"
                  disabled={isLoading}
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
                    setFormData((prev) => ({
                      ...prev,
                      date_of_birth: date ? format(date, 'yyyy-MM-dd') : '',
                    }))
                  }
                  disabled={(date) => date > new Date()}
                  captionLayout="dropdown"
                  fromYear={1900}
                  toYear={new Date().getFullYear()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </ProfileSection>

          <div className="grid grid-cols-2 gap-4">
            <ProfileSection title="City">
              <Input
                id="city"
                value={formData.city}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, city: e.target.value }))
                }
                placeholder="City"
                className="rounded-lg"
                disabled={isLoading}
              />
            </ProfileSection>
            <ProfileSection title="Province">
              <Select
                value={formData.province}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, province: value }))
                }
                disabled={isLoading}
              >
                <SelectTrigger
                  id="province"
                  className="rounded-lg"
                >
                  <SelectValue placeholder="Select" />
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
            </ProfileSection>
          </div>

          <ProfileSection title="About me">
            <Textarea
              value={formData.about}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, about: e.target.value }))
              }
              placeholder="Tell other dads about yourself..."
              className="rounded-lg min-h-32"
              disabled={isLoading}
            />
          </ProfileSection>

          <ProfileSection title="Children's age" hint="Select all that apply">
            <div className="flex flex-wrap gap-2">
              {STAGE_OPTIONS.map((stage) => (
                <Badge
                  key={stage.value}
                  variant={
                    formData.children_age_ranges.includes(stage.value)
                      ? 'default'
                      : 'soft'
                  }
                  className="cursor-pointer rounded-md"
                  onClick={() => !isLoading && toggleStage(stage.value)}
                >
                  {stage.label}
                </Badge>
              ))}
            </div>
          </ProfileSection>

          <ProfileSection title="Interests" hint="Pick any that fit, or add your own">
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => (
                <Badge
                  key={interest}
                  variant={
                    formData.interests.includes(interest) ? 'default' : 'soft'
                  }
                  className="cursor-pointer rounded-md"
                  onClick={() => !isLoading && toggleInterest(interest)}
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
                    className="cursor-pointer rounded-md bg-gradient-gold"
                    onClick={() => !isLoading && toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              {!showCustomInput ? (
                <Badge
                  variant="outline"
                  className="cursor-pointer rounded-md"
                  onClick={() => !isLoading && setShowCustomInput(true)}
                >
                  + Add your own
                </Badge>
              ) : (
                <div className="flex gap-2 w-full mt-2">
                  <Input
                    placeholder="Type your interest..."
                    value={customInterest}
                    onChange={(e) => setCustomInterest(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleAddCustomInterest()
                    }
                    className="rounded-lg"
                    autoFocus
                    disabled={isLoading}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddCustomInterest}
                    className="rounded-md"
                    disabled={
                      isLoading ||
                      !customInterest.trim() ||
                      formData.interests.includes(customInterest.trim())
                    }
                  >
                    Add
                  </Button>
                </div>
              )}
            </div>
          </ProfileSection>
        </ProfileCard>

        <div className="space-y-3">
          <Button
            className="w-full rounded-md"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Saving…' : 'Save changes'}
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
