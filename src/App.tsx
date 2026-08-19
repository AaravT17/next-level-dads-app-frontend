import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '@/lib/routes'
import { AuthProvider } from '@/contexts/AuthContext'
import { PublicRoute, ProtectedRoute, SetupRoute, AdminRoute } from '@/components/RouteWrappers'
import { AppLayout } from '@/components/layout/AppLayout'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { ModerationNotifier } from '@/features/moderation/components/ModerationNotifier'
import { LegalAcceptancesModal } from '@/components/LegalAcceptancesModal'
import { ChatProvider } from '@/contexts/ChatContext'

import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import ProfileSetup from './pages/ProfileSetup'
import Chats from './pages/Chats'
import Chat from './pages/Chat'
import ChatManage from './pages/ChatManage'
import Discover from './pages/Discover'
import Groups from './pages/Groups'
import MyProfile from './pages/MyProfile'
import ProfileDetail from './pages/ProfileDetail'
import Connections from './pages/Connections'
import Requests from './pages/Requests'
import EventDetail from './pages/EventDetail'
import NotFound from './pages/NotFound'
import CommunitiesPage from './features/communities/pages/CommunitiesPage'
import CommunityDetailPage from './features/communities/pages/CommunityDetailPage'
import ConversationDetailPage from './features/communities/pages/ConversationDetailPage'
import { AdminDashboardPage } from './features/admin/pages/AdminDashboardPage'

const AppContent = () => {
  return (
    <TooltipProvider>
      <Toaster />
      <ModerationNotifier />
      <LegalAcceptancesModal />
      <BrowserRouter>
        <Routes>
          {/* Public - redirect to the app if already authenticated */}
          <Route element={<PublicRoute />}>
            <Route path={ROUTES.WELCOME} element={<Welcome />} />
            <Route path={ROUTES.LOGIN} element={<Login />} />
            <Route path={ROUTES.REGISTER} element={<Register />} />
            <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
          </Route>

          {/* Auth utilities - reachable in any auth state */}
          <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
          <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmail />} />

          {/* Setup - has a token but no profile yet */}
          <Route element={<SetupRoute />}>
            <Route path={ROUTES.SETUP} element={<ProfileSetup />} />
          </Route>

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            {/* Standard screens, with primary navigation */}
            <Route element={<AppLayout variant="tabs" />}>
              <Route path={ROUTES.DISCOVER} element={<Navigate to={ROUTES.DISCOVER_DADS} replace />} />
              <Route path="/discover/dads/:id" element={<ProfileDetail />} />
              <Route path="/discover/:tab" element={<Discover />} />

              <Route path="/communities" element={<CommunitiesPage />} />
              <Route path="/communities/:communityId" element={<CommunityDetailPage />} />
              <Route
                path="/communities/:communityId/conversations/:conversationId"
                element={<ConversationDetailPage />}
              />

              <Route path="/events/:eventId" element={<EventDetail />} />

              <Route path={ROUTES.GROUPS} element={<Navigate to={ROUTES.GROUPS_COMMUNITIES} replace />} />
              <Route path="/groups/:tab" element={<Groups />} />

              <Route path={ROUTES.CHATS} element={<Chats />} />

              <Route path={ROUTES.PROFILE} element={<MyProfile />} />
              <Route path="/profiles/:id" element={<ProfileDetail />} />
              <Route path={ROUTES.CONNECTIONS} element={<Connections />} />
              <Route path={ROUTES.REQUESTS} element={<Requests />} />
            </Route>

            {/* Full-height screens that own their chrome */}
            <Route element={<AppLayout variant="immersive" />}>
              <Route path="/chats/:id" element={<Chat />} />
              <Route path="/chats/:id/manage" element={<ChatManage />} />
            </Route>
          </Route>

          {/* Admin */}
          <Route element={<AdminRoute />}>
            <Route element={<AppLayout variant="tabs" />}>
              <Route path={ROUTES.ADMIN} element={<AdminDashboardPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  )
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ChatProvider>
          <AppContent />
        </ChatProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
)

export default App
