import { Loader2 } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import logo from '@/assets/logo.png'
import { useCommunities } from '../hooks/useCommunities'
import { CommunityGrid } from '../components/CommunityGrid'
import { EmptyState } from '../components/EmptyState'

const CommunitiesPage = () => {
  const { data: communities, isLoading, isError } = useCommunities()

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative bg-card border-b border-border px-6 py-5 flex items-center justify-center">
        <img src={logo} alt="Next Level Dads" className="h-10 absolute top-4 left-3" />
        <h1 className="text-2xl font-heading font-semibold text-foreground">
          Communities
        </h1>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        <div>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Find your people. Join communities built around what matters most to
            you as a dad.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Failed to load communities. Please try again.
            </p>
          </div>
        ) : !communities || communities.length === 0 ? (
          <EmptyState
            title="No communities yet"
            description="Check back soon — new communities are on the way."
          />
        ) : (
          <CommunityGrid communities={communities} />
        )}
      </div>

      <BottomNav />
    </div>
  )
}

export default CommunitiesPage
