import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import BottomNav from '@/components/BottomNav'
import { Button } from '@/components/ui/button'
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
import {
  Edit,
  MapPin,
  Calendar,
  LogOut,
  Share2,
  Pencil,
  Upload,
  Trash2,
  Shield,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import avatarDefaultGrey from '@/assets/avatar-default-grey.png'
import logo from '@/assets/logo.png'
import { ROUTES } from '@/lib/routes'
import { useAuth } from '@/contexts/AuthContext'
import axiosPrivate from '@/api/axiosPrivate'
import {
  TIMEOUT_LENGTH_MS,
  INTEREST_OPTIONS,
  STAGE_OPTIONS,
  PROVINCE_OPTIONS,
} from '@/config/constants'
interface UserStats {
  connections: number
  requests: number
  communities_joined: number
  events_registered_for: number
}
import { getStageDisplayLabel } from '@/utils/users'
import { useToast } from '@/hooks/use-toast'

interface UserResponse {
  id: string
  name: string
  age: number
  city: string
  province: string
  about: string
  avatar_url: string | null
  interests: string[]
  children: string[]
}

async function fetchUserStats(): Promise<UserStats> {
  const res = await axiosPrivate.get<UserStats>('/api/users/me/stats', {
    timeout: TIMEOUT_LENGTH_MS,
  })
  return res.data
}

const MyProfile = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, accessToken, setAuth } = useAuth()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Custom interest state
  const [customInterest, setCustomInterest] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    age: '',
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
        age: String(user.age),
        city: user.city,
        province: user.province,
        about: user.about,
        interests: [...user.interests],
        children_age_ranges: [...user.children_age_ranges],
      })
    }
  }, [user])

  const {
    data: userStats = {
      connections: 0,
      requests: 0,
      communities_joined: 0,
      events_registered_for: 0,
    },
  } = useQuery({
    queryKey: ['user', 'stats'],
    queryFn: fetchUserStats,
    staleTime: 0,
  })

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: (data: {
      name: string
      age: number
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
          city: data.city,
          province: data.province,
          about: data.about,
          avatarUrl: data.avatar_url || '',
          interests: data.interests,
          children_age_ranges: data.children,
        },
        accessToken,
      })
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      setCustomInterest('')
      setShowCustomInput(false)
      setIsEditing(false)
      toast({
        title: 'Success',
        description: 'Profile updated successfully.',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      })
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
      toast({
        title: 'Success',
        description: 'Avatar updated successfully.',
      })
    },
    onError: () => {
      setAvatarPreview(null)
      toast({
        title: 'Error',
        description: 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
      })
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
          user: { ...user, avatarUrl: '' },
          accessToken,
        })
      }
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      toast({
        title: 'Success',
        description: 'Avatar removed successfully.',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to remove avatar. Please try again.',
        variant: 'destructive',
      })
    },
    onSettled: () => {
      setIsLoading(false)
    },
  })

  const handleShareProfile = async () => {}

  const handleLogout = async () => {
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
      queryClient.clear()
      setAuth({ user: null, accessToken: null })
      navigate(ROUTES.WELCOME)
    }
  }

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

  const handleEditClick = () => {
    if (user) {
      setFormData({
        name: user.name,
        age: String(user.age),
        city: user.city,
        province: user.province,
        about: user.about,
        interests: [...user.interests],
        children_age_ranges: [...user.children_age_ranges],
      })
    }
    setIsEditing(true)
  }

  const handleCancel = () => {
    // Reset form to current user values
    if (user) {
      setFormData({
        name: user.name,
        age: String(user.age),
        city: user.city,
        province: user.province,
        about: user.about,
        interests: [...user.interests],
        children_age_ranges: [...user.children_age_ranges],
      })
    }
    setCustomInterest('')
    setShowCustomInput(false)
    setIsEditing(false)
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
    setIsLoading(true)
    updateProfile.mutate({
      name: formData.name,
      age: parseInt(formData.age, 10),
      city: formData.city,
      province: formData.province,
      about: formData.about,
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

  // Determine which avatar to display
  const displayAvatar = avatarPreview || user.avatarUrl || avatarDefaultGrey

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card border-b border-border px-6 py-5 relative">
        <img
          src={logo}
          alt="Next Level Dads"
          className="h-10 absolute top-4 left-3"
        />

        <div className="flex items-center justify-center h-full">
          <h1 className="text-2xl font-heading font-semibold text-foreground">
            Profile
          </h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-8 space-y-6 animate-fade-in">
        {/* Avatar section - always interactive */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-32 h-32 rounded-lg overflow-hidden border-4 border-primary/20">
              <img
                src={displayAvatar}
                alt={user.name}
                className={`w-full h-full object-cover ${isLoading ? 'opacity-50' : ''}`}
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 rounded-full w-10 h-10 bg-gray-500 hover:bg-gray-600 text-white"
                  disabled={isLoading}
                >
                  <Pencil className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleAvatarClick}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </DropdownMenuItem>
                {user.avatarUrl && (
                  <DropdownMenuItem
                    onClick={handleRemoveAvatar}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Photo
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* View mode: Name/location outside card */}
          {!isEditing && (
            <>
              <div>
                <h2 className="text-2xl font-heading font-semibold text-foreground">
                  {user.name}, {user.age}
                </h2>
                <div className="flex items-center justify-center gap-1 text-muted-foreground mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {user.city}, {user.province}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 w-full max-w-sm">
                <Button
                  variant="outline"
                  className="flex-1 rounded-full border-2 border-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={() => navigate(ROUTES.CONNECTIONS)}
                >
                  Connections
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 rounded-full border-2 border-primary hover:bg-primary hover:text-primary-foreground relative"
                  onClick={() => navigate(ROUTES.REQUESTS)}
                >
                  Requests
                  {userStats.requests > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
                      {userStats.requests}
                    </span>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>

        {/* View mode: My Activity card */}
        {!isEditing && (
          <div className="bg-card rounded-lg p-6 shadow-md">
            <h3 className="font-semibold text-foreground mb-4">My Activity</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-heading font-semibold text-primary">
                  {userStats.connections}
                </p>
                <p className="text-sm text-muted-foreground">Connections</p>
              </div>
              <div>
                <p className="text-2xl font-heading font-semibold text-primary">
                  {userStats.communities_joined}
                </p>
                <p className="text-sm text-muted-foreground">Communities</p>
              </div>
              <div>
                <p className="text-2xl font-heading font-semibold text-primary">
                  {userStats.events_registered_for}
                </p>
                <p className="text-sm text-muted-foreground">Events</p>
              </div>
            </div>
          </div>
        )}

        {/* Edit mode: All fields in one card */}
        {isEditing ? (
          <div className="bg-card rounded-lg p-6 space-y-6 shadow-md">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Name</h3>
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
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Age</h3>
              <Input
                id="age"
                type="number"
                min={0}
                value={formData.age}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, age: e.target.value }))
                }
                placeholder="Your age"
                className="rounded-lg"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-foreground mb-2">City</h3>
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
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Province</h3>
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
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">About Me</h3>
              <Textarea
                value={formData.about}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, about: e.target.value }))
                }
                placeholder="Tell other dads about yourself..."
                className="rounded-lg min-h-32"
                disabled={isLoading}
              />
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Children's Age
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Select all that apply
              </p>
              <div className="flex flex-wrap gap-2">
                {STAGE_OPTIONS.map((stage) => (
                  <Badge
                    key={stage.value}
                    variant={
                      formData.children_age_ranges.includes(stage.value)
                        ? 'default'
                        : 'soft'
                    }
                    className="cursor-pointer rounded-full"
                    onClick={() => !isLoading && toggleStage(stage.value)}
                  >
                    {stage.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Interests</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Select your interests
              </p>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => (
                  <Badge
                    key={interest}
                    variant={
                      formData.interests.includes(interest) ? 'default' : 'soft'
                    }
                    className="cursor-pointer rounded-full"
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
                      className="cursor-pointer rounded-full bg-gradient-gold"
                      onClick={() => !isLoading && toggleInterest(interest)}
                    >
                      {interest}
                    </Badge>
                  ))}
                {!showCustomInput ? (
                  <Badge
                    variant="outline"
                    className="cursor-pointer rounded-full"
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
                      className="rounded-full"
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
            </div>
          </div>
        ) : (
          /* View mode: About/Children/Interests card */
          <div className="bg-card rounded-lg p-6 space-y-4 shadow-md">
            <div>
              <h3 className="font-semibold text-foreground mb-2">About Me</h3>
              <p className="text-muted-foreground leading-relaxed">
                {user.about}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Children's Age
              </h3>
              <div className="flex flex-wrap gap-2">
                {user.children_age_ranges.map((stage) => (
                  <Badge
                    key={stage}
                    variant="soft"
                    className="rounded-full"
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    {getStageDisplayLabel(stage)}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((interest) => (
                  <Badge
                    key={interest}
                    variant="soft"
                    className="rounded-full"
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {isEditing ? (
          <>
            <Button
              className="w-full rounded-full"
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              className="w-full rounded-full border-2 border-primary hover:bg-primary hover:text-primary-foreground"
              onClick={handleEditClick}
              disabled={isLoading}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>

            {/* <Button
              variant="outline"
              className="w-full rounded-full border-2 border-primary hover:bg-primary hover:text-primary-foreground"
              onClick={handleShareProfile}
              disabled={isLoading}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Profile
            </Button> */}

            {user?.isAdmin && (
              <Button
                variant="outline"
                className="w-full rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => navigate(ROUTES.ADMIN)}
              >
                <Shield className="w-4 h-4 mr-2" />
                Moderation Dashboard
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full rounded-full border-2 border-destructive text-destructive hover:bg-primary hover:text-primary-foreground hover:border-primary"
              onClick={handleLogout}
              disabled={isLoading}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

export default MyProfile
