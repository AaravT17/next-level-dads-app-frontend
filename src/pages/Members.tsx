import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ArrowLeft, MessageCircle, Plus, Search, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import avatarDefaultGrey from '@/assets/avatar-default-grey.png'
import { profileDetail } from '@/lib/routes'
import { getStageDisplayLabel } from '@/utils/users'

interface Member {
  id: string
  name: string
  age: number
  location: string
  bio: string
  childrenAges: string
  stages: string[]
  interests: string[]
  avatar: string
}

interface ParentGroup {
  title: string
  type: string
  description: string
  members: Member[]
}

// Data sources (empty for pure UI shell)
const communitiesData: Record<string, ParentGroup> = {}
const privateGroupsData: Record<string, ParentGroup> = {}

// Available connections for adding members (empty for pure UI shell)
const availableConnections: Array<{ id: string; name: string; avatar: string }> = []

const Members = () => {
  const navigate = useNavigate()
  const { communityId, groupId } = useParams<{ communityId?: string; groupId?: string }>()
  const { toast } = useToast()

  // Derive configuration from route params
  const parentType: 'group' | 'community' = groupId ? 'group' : 'community'
  const parentId = groupId || communityId || ''
  const canAddMembers = parentType === 'group'

  // State for add member dialog (only used when canAddMembers is true)
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  // Get parent data based on type
  const parentData: ParentGroup = parentType === 'group'
    ? privateGroupsData[parentId] || { title: 'Sample Private Group', type: 'Support', description: 'This is a sample private group description.', members: [] }
    : communitiesData[parentId] || { title: 'Sample Community', type: 'Community', description: 'This is a sample community description.', members: [] }

  // Filter connections for add member dialog
  const existingMemberIds: string[] = []
  const filteredConnections: Array<{ id: string; name: string; avatar: string }> = []

  const handleConnect = (memberId: string, name: string) => {}

  const handleMemberClick = (memberId: string) => {}

  const handleBack = () => {}

  const toggleMemberSelection = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    )
  }

  const handleAddMembers = () => {
    if (selectedMembers.length > 0) {
      const names = selectedMembers
        .map((id) => availableConnections.find((c) => c.id === id)?.name)
        .filter(Boolean)
        .join(', ')

      toast({
        title: 'Members added!',
        description: `${names} ${selectedMembers.length === 1 ? 'has' : 'have'} been added to the group.`,
      })
      setSelectedMembers([])
      setIsAddMemberOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card border-b border-border">
        <div className="max-w-md mx-auto px-6 py-4">
          <button
            onClick={handleBack}
            className="text-muted-foreground mb-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="mb-4">
            <h1 className="text-2xl font-heading font-semibold text-foreground mb-2">
              {parentData.title}
            </h1>
            <Badge
              variant="soft"
              className="rounded-full mb-3"
            >
              {parentData.type}
            </Badge>
            <p className="text-muted-foreground">{parentData.description}</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-semibold text-foreground">
            Members ({parentData.members.length})
          </h2>

          {canAddMembers && (
            <Dialog
              open={isAddMemberOpen}
              onOpenChange={setIsAddMemberOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  style={{ borderColor: '#D8A24A', color: '#D8A24A' }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Add Members</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search connections..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 rounded-full"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {filteredConnections.length > 0 ? (
                      filteredConnections.map((connection) => (
                        <div
                          key={connection.id}
                          onClick={() => toggleMemberSelection(connection.id)}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedMembers.includes(connection.id)
                              ? 'bg-primary/10 border border-primary'
                              : 'bg-muted/50 hover:bg-muted'
                          }`}
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarImage
                              src={connection.avatar}
                              alt={connection.name}
                            />
                            <AvatarFallback>{connection.name[0]}</AvatarFallback>
                          </Avatar>
                          <span className="flex-1 font-medium">
                            {connection.name}
                          </span>
                          {selectedMembers.includes(connection.id) && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        No connections available to add
                      </p>
                    )}
                  </div>

                  {selectedMembers.length > 0 && (
                    <Button
                      onClick={handleAddMembers}
                      className="w-full rounded-full"
                      style={{ backgroundColor: '#D8A24A' }}
                    >
                      Add {selectedMembers.length} Member
                      {selectedMembers.length > 1 ? 's' : ''}
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="space-y-3">
          {parentData.members.map((member) => (
            <Card
              key={member.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleMemberClick(member.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4 mb-3">
                  <Avatar className="w-12 h-12 shrink-0">
                    <AvatarImage
                      src={member.avatar}
                      alt={member.name}
                    />
                    <AvatarFallback>{member.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">
                      {member.name}, {member.age ?? '—'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {member.childrenAges}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {member.bio}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleConnect(member.id, member.name)
                    }}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Children's Age:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {member.stages.map((stage) => (
                        <Badge
                          key={stage}
                          variant="soft"
                          className="rounded-full text-xs"
                        >
                          {getStageDisplayLabel(stage)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Interests:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {member.interests.map((interest) => (
                        <Badge
                          key={interest}
                          variant="soft"
                          className="rounded-full text-xs"
                        >
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Members
