import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '@/lib/routes'
import { AuthProvider } from '@/contexts/AuthContext'
import { PublicRoute, ProtectedRoute, SetupRoute, AdminRoute } from '@/components/RouteWrappers'
import { ModerationNotifier } from '@/features/moderation/components/ModerationNotifier'

import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import ProfileSetup from './pages/ProfileSetup'
import Match from './pages/Match'
import Chats from './pages/Chats'
import Chat from './pages/Chat'
import Discover from './pages/Discover'
import Groups from './pages/Groups'
import Members from './pages/Members'
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
      <Sonner />
      <ModerationNotifier />
      <BrowserRouter>
        <Routes>
          {/* Public Routes - redirect to app if authenticated */}
          <Route
            path={ROUTES.WELCOME}
            element={<PublicRoute><Welcome /></PublicRoute>}
          />
          <Route
            path={ROUTES.LOGIN}
            element={<PublicRoute><Login /></PublicRoute>}
          />
          <Route
            path={ROUTES.REGISTER}
            element={<PublicRoute><Register /></PublicRoute>}
          />
          <Route
            path={ROUTES.FORGOT_PASSWORD}
            element={<PublicRoute><ForgotPassword /></PublicRoute>}
          />
          {/* Auth utility pages - always accessible regardless of auth state */}
          <Route
            path={ROUTES.RESET_PASSWORD}
            element={<ResetPassword />}
          />
          <Route
            path={ROUTES.VERIFY_EMAIL}
            element={<VerifyEmail />}
          />

          {/* Profile Setup - requires token but no user profile yet */}
          <Route
            path={ROUTES.SETUP}
            element={<SetupRoute><ProfileSetup /></SetupRoute>}
          />

          {/* Protected Routes - require full authentication */}
          <Route
            path={ROUTES.MATCH}
            element={<ProtectedRoute><Match /></ProtectedRoute>}
          />

          {/* Discover (tabbed) */}
          <Route
            path={ROUTES.DISCOVER}
            element={<ProtectedRoute><Navigate to={ROUTES.DISCOVER_DADS} replace /></ProtectedRoute>}
          />
          <Route
            path="/discover/dads/:id"
            element={<ProtectedRoute><ProfileDetail /></ProtectedRoute>}
          />
          <Route
            path="/discover/:tab"
            element={<ProtectedRoute><Discover /></ProtectedRoute>}
          />

          {/* Communities */}
          <Route
            path="/communities"
            element={<ProtectedRoute><CommunitiesPage /></ProtectedRoute>}
          />
          <Route
            path="/communities/:communityId"
            element={<ProtectedRoute><CommunityDetailPage /></ProtectedRoute>}
          />
          <Route
            path="/communities/:communityId/conversations/:conversationId"
            element={<ProtectedRoute><ConversationDetailPage /></ProtectedRoute>}
          />
          <Route
            path="/communities/:communityId/members"
            element={<ProtectedRoute><Members /></ProtectedRoute>}
          />

          {/* Events */}
          <Route
            path="/events/:eventId"
            element={<ProtectedRoute><EventDetail /></ProtectedRoute>}
          />

          {/* My Groups (tabbed) */}
          <Route
            path={ROUTES.GROUPS}
            element={<ProtectedRoute><Navigate to={ROUTES.GROUPS_COMMUNITIES} replace /></ProtectedRoute>}
          />
          <Route
            path="/groups/:tab"
            element={<ProtectedRoute><Groups /></ProtectedRoute>}
          />
          <Route
            path="/groups/:groupId/members"
            element={<ProtectedRoute><Members /></ProtectedRoute>}
          />

          {/* Chats */}
          <Route
            path={ROUTES.CHATS}
            element={<ProtectedRoute><Chats /></ProtectedRoute>}
          />
          <Route
            path="/chats/individual/:id"
            element={<ProtectedRoute><Chat /></ProtectedRoute>}
          />
          <Route
            path="/chats/group/:id"
            element={<ProtectedRoute><Chat /></ProtectedRoute>}
          />
          <Route
            path="/chats/community/:id"
            element={<ProtectedRoute><Chat /></ProtectedRoute>}
          />

          {/* Profile */}
          <Route
            path={ROUTES.PROFILE}
            element={<ProtectedRoute><MyProfile /></ProtectedRoute>}
          />
          <Route
            path="/profiles/:id"
            element={<ProtectedRoute><ProfileDetail /></ProtectedRoute>}
          />
          <Route
            path={ROUTES.CONNECTIONS}
            element={<ProtectedRoute><Connections /></ProtectedRoute>}
          />
          <Route
            path={ROUTES.REQUESTS}
            element={<ProtectedRoute><Requests /></ProtectedRoute>}
          />

          {/* Admin */}
          <Route
            path={ROUTES.ADMIN}
            element={<AdminRoute><AdminDashboardPage /></AdminRoute>}
          />

          {/* Catch-all */}
          <Route
            path="*"
            element={<NotFound />}
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  )
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </QueryClientProvider>
)

export default App
