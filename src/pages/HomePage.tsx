import { AppBar } from '@/components/layout/AppBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { CommunityFeed } from '@/features/feed/components/CommunityFeed'
import { ResumeRail } from '@/features/feed/components/ResumeRail'

/**
 * Home: what you were already part of, then what is new.
 *
 * The cross-community feed was promoted out of the Communities tab bar into
 * its own destination — what people posted is the thing you open the app for,
 * so it gets the first slot in the nav rather than a tab inside a section you
 * have to reach first.
 *
 * Above it sits the resume rail: threads you posted in or reacted to, which
 * are the ones you are most likely to have unfinished business with. It
 * renders nothing until you have some, so a new account still lands straight
 * on the feed.
 */
const HomePage = () => (
  <>
    <AppBar title="Home" width="wide" />
    <PageContainer width="wide" className="animate-fade-in">
      <div className="space-y-6">
        <ResumeRail />
        <CommunityFeed />
      </div>
    </PageContainer>
  </>
)

export default HomePage
