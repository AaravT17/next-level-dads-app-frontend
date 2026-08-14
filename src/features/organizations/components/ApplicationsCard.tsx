import type { ApplicationRow } from '../types/organizations'
import { useNavigate } from 'react-router-dom'
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { adminOrganizationDetail } from '@/lib/routes'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { differenceInCalendarDays } from 'date-fns'

interface ApplicationsCardProps {
    applications: ApplicationRow[],
    isLoading: boolean,
    isError: boolean,
}

export function ApplicationsCard({
    applications,
    isLoading,
    isError,
}: ApplicationsCardProps) {
    const [showRejected, setShowRejected] = useState(false)
    const navigate = useNavigate()
    const pendingApplications = applications.filter(
        (application) => application.status === 'pending'
    )
    const rejectedApplications = applications.filter(
        (application) => application.status === 'rejected'
    )

    const handleApplicationClick = (applicationId: string) => {
        navigate(adminOrganizationDetail(applicationId))
    }

    const getInitials = (name: string) =>
        name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()

    const getWaitingDays = (createdAt: string) => {
        const days = differenceInCalendarDays(new Date(), new Date(createdAt))
        return `Waiting ${days} ${days === 1 ? 'day' : 'days'}`
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Applications</CardTitle>
                    <CardDescription>Review organization applications awaiting admin action.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Loading applications...</p>
                </CardContent>
            </Card>
        )
    }

    if (isError) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Applications</CardTitle>
                    <CardDescription>Review organization applications awaiting admin action.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Unable to load applications.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Applications</CardTitle>
                <CardDescription>Review pending and rejected organization applications.</CardDescription>
            </CardHeader>

            <CardContent className="p-0">
                {applications.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-muted-foreground">
                        No applications found.
                    </p>
            ) : (
              <>
                {/* Pending Applications */}
                <section>
                    <div className="border-y px-6 py-3">
                        <h3 className="text-sm font-medium">Pending ({pendingApplications.length})</h3>
                    </div>

                    {pendingApplications.length === 0 ? (
                        <p className="px-6 py-4 text-sm text-muted-foreground">No pending applications.</p>
                    ) : (
                        <div>
                            {pendingApplications.map((application) => (
                                <button
                                    key={application.id}
                                    type="button"
                                    onClick={() => handleApplicationClick(application.id)}
                                    className="flex w-full items-center justify-between border-b px-6 py-4 text-left hover:bg-accent"
                                >
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarFallback>
                                                {getInitials(application.name)}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{application.name}</p>
                                            <Badge variant="outline">
                                                {getWaitingDays(application.created_at)}
                                            </Badge>
                                        </div>

                                        <p className="text-sm text-muted-foreground">{application.city}, {application.province}</p>
                                        <p className="text-sm text-muted-foreground">Contact: {application.contact_name}</p>

                                        {application.last_internal_note && (
                                            <p className="mt-2 text-sm text-muted-foreground">
                                                {application.last_internal_note.submitted_by_name ??
                                                'Admin'}
                                                : {application.last_internal_note.content}
                                            </p>
                                        )}
                                    </div>

                                    <span className="text-sm text-muted-foreground">Review</span>
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                {/* Rejected Applications */}
                <section>
                    <div className="border-t">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowRejected((previous) => !previous)}
                            className="flex h-auto w-full justify-between rounded-none px-6 py-3"
                        >
                            <span className="text-sm font-medium">
                                Rejected ({rejectedApplications.length})
                            </span>

                            <span className="text-sm text-muted-foreground">
                                {showRejected ? 'Hide' : 'Show'}
                            </span>
                        </Button>
                    </div>

                    {showRejected && (
                        <>
                            {rejectedApplications.length === 0 ? (
                                <p className="px-6 py-4 text-sm text-muted-foreground">No rejected applications.</p>
                            ) : (
                                <div>
                                    {rejectedApplications.map((application) => (
                                        <button
                                            key={application.id}
                                            type="button"
                                            onClick={() =>
                                                handleApplicationClick(application.id)
                                            }
                                            className="flex w-full items-center justify-between border-t px-6 py-4 text-left hover:bg-accent"
                                        >
                                            <div className="flex items-center gap-4">

                                                <Avatar>
                                                    <AvatarFallback>
                                                        {getInitials(application.name)}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium">{application.name}</p>
                                                </div>

                                                <p className="text-sm text-muted-foreground">{application.city}, {application.province}</p>
                                                <p className="text-sm text-muted-foreground">Contact: {application.contact_name}</p>
                                            </div>

                                            <span className="text-sm text-muted-foreground">View</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </section>
              </>
            )}
            </CardContent>
        </Card>
    )
}