
import type { ActivePartnerRow } from '../types/organizations'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { adminChatByOrganization } from '@/lib/routes'

interface ActivePartnersCardProps {
    activePartners: ActivePartnerRow[],
    isLoading: boolean,
    isError: boolean,
}

export function ActivePartnersCard({
    activePartners,
    isLoading,
    isError,
}: ActivePartnersCardProps) {
    const navigate = useNavigate()
    const handleMessage = (partnerId: string) => {
        navigate(adminChatByOrganization(partnerId))
    }

    const getInitials = (name: string) =>
        name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()

    const formatPartnerSince = (approvedAt: string) =>
        format(new Date(approvedAt), 'MMM yyyy')

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Active Partners</CardTitle>
                    <CardDescription>Trusted organizations contributing to the community.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Loading active partners...</p>
                </CardContent>
            </Card>
        )
    }

    if (isError) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Active Partners</CardTitle>
                    <CardDescription>Trusted organizations contributing to the community.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Unable to load active partners.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Active Partners</CardTitle>
                <CardDescription>Trusted organizations contributing to the community.</CardDescription>
            </CardHeader>

            <CardContent className="p-0">
                {activePartners.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-muted-foreground">
                        No active partners found.
                    </p>
                ) : (
                  <>
                    {/* Column headings */}
                    <div className="grid grid-cols-[2fr_1fr_auto_1fr] items-center gap-6 border-y px-6 py-3 text-sm font-medium text-muted-foreground">
                      <span>Organization</span>
                      <span>Region</span>
                      <span />
                      <span>Partner Since</span>
                    </div>

                    {/* Partner rows */}
                    {activePartners.map((partner) => (
                        <div
                            key={partner.id}
                            className="grid grid-cols-[2fr_1fr_auto_1fr] items-center gap-6 border-b px-6 py-4">
                            
                            {/* Organization */}
                            <div className="flex items-center gap-4">
                              <Avatar>
                                  <AvatarFallback>
                                      {getInitials(partner.name)}
                                  </AvatarFallback>
                              </Avatar>
                              <div>
                                  <p className="font-medium">{partner.name}</p>
                                  <p className="text-sm text-muted-foreground">Contact: {partner.contact_name}</p>  
                              </div>
                            </div>
                            {/* Region */}
                            <p className="text-sm text-muted-foreground">{partner.city}, {partner.province}</p>

                            {/* Message */}
                            <Button
                                variant="outline"
                                onClick={() => handleMessage(partner.id)}
                              >
                                Message
                            </Button>

                            {/* Partner Since */}
                            <p className="text-sm text-muted-foreground" >
                                {formatPartnerSince(partner.approved_at)}
                            </p>
                        </div>
                    ))}
                  </>
                )}
            </CardContent>
        </Card>
    )
}