import { AppBar } from '@/components/layout/AppBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { CommunityFeed } from '@/features/feed/components/CommunityFeed'

/**
 * Home: the cross-community feed, promoted out of the Groups tab bar into its
 * own destination.
 *
 * Groups is the communities themselves now; what people posted in them is the
 * thing you open the app for, so it gets the first slot in the nav rather than
 * a tab inside a section you have to reach first.
 */
const HomePage = () => (
  <>
    <AppBar title="Home" width="wide" />
    <PageContainer width="wide" className="animate-fade-in">
      <CommunityFeed />
    </PageContainer>
  </>
)

export default HomePage
