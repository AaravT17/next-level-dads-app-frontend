
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { OrganizationDetail } from '../types/organizations'

interface ApplicationDetailSectionProps {
  application: OrganizationDetail

}

export function ApplicationDetailSection({ application }: ApplicationDetailSectionProps) {
    return (
         <section className="rounded-xl border bg-card p-6">

            <header className="mb-6">
                <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Partner Application</p>
                <h1 className="mt-1 text-2xl font-semibold">{application.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                Review the organization information submitted by the partner.
                </p>
            </header>

            <div className="space-y-6">
                <div className="space-y-2">
                    <Label>Organization name</Label>
                    <Input value={application.name} readOnly />
                </div>

                <div className="space-y-2">
                    <Label>Organization email</Label>
                    <Input value={application.email} readOnly />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>Organization phone</Label>
                        <Input value={application.phone ?? 'Not provided'} readOnly />
                    </div>

                    <div className="space-y-2">
                        <Label>Website</Label>
                        <Input value={application.website ?? 'Not provided'} readOnly
                        />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label>City</Label>
                        <Input value={application.city} readOnly />
                    </div>
                    <div className="space-y-2">
                        <Label>Province</Label>
                        <Input value={application.province} readOnly />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Tell us about your organization</Label>
                    <Textarea value={application.description} readOnly className="min-h-28 resize-none" />
                </div>

                <div className="border-t pt-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Contact name</Label>
                            <Input value={application.contact_name} readOnly />
                        </div>

                        <div className="space-y-2">
                            <Label>Contact title</Label>
                            <Input value={application.contact_title ?? 'Not provided'} readOnly />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Contact email</Label>
                                <Input value={application.contact_email} readOnly />
                            </div>
                            <div className="space-y-2">
                                <Label>Contact phone</Label>
                                <Input value={application.contact_phone ?? 'Not provided'} readOnly />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border-t pt-6">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>What are your primary goals?</Label>
                            <Textarea
                                value={application.application_answers.primary_goals ?? ''}
                                readOnly 
                                className="min-h-28 resize-none"/>
                        </div>
                        <div className="space-y-2">
                            <Label>Why do you want to partner with us?</Label>
                            <Textarea
                                value={application.application_answers.partnership_reason ?? ''}
                                readOnly
                                className="min-h-28 resize-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Estimated reach</Label>
                            <Input
                                value={application.application_answers.estimated_reach ?? 'Not provided'}
                                readOnly
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}