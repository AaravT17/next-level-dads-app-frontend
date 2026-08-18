import { AppBar } from '@/components/layout/AppBar'
import { PageContainer } from '@/components/layout/PageContainer'
import { QueryState } from '@/components/feedback/QueryState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { CommunityListSkeleton } from '@/components/feedback/skeletons/CardSkeletons'
import { useCommunities } from '../hooks/useCommunities'
import { CommunityGrid } from '../components/CommunityGrid'

const CommunitiesPage = () => {
  const query = useCommunities()

  return (
    <>
      <AppBar title="Communities" />

      <PageContainer className="space-y-6 animate-fade-in">
        <p className="text-body text-muted-foreground">
          Find your people. Join communities built around what matters most to you as a dad.
        </p>

        <QueryState
          query={query}
          noun="communities"
          skeleton={<CommunityListSkeleton />}
          empty={
            <EmptyState
              title="No communities yet"
              description="Check back soon — new communities are on the way."
            />
          }
        >
          {(communities) => <CommunityGrid communities={communities} />}
        </QueryState>
      </PageContainer>
    </>
  )
}

export default CommunitiesPage
