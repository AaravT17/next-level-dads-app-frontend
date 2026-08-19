import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES, dadDetail, groupsTab } from '@/lib/routes'
import { AuthProvider } from '@/contexts/AuthContext'
import { PublicRoute, ProtectedRoute, SetupRoute, AdminRoute } from '@/components/RouteWrappers'
import { AppLayout } from '@/components/layout/AppLayout'
import { LegacyRedirect } from '@/components/routing/LegacyRedirect'
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
import Chat from './pages/Chat'
import { ChatsLayout, ChatsEmptyPane } from './pages/chats/ChatsLayout'
import ChatManage from './pages/ChatManage'
import DadsPage from './pages/DadsPage'
import GroupsPage from './pages/GroupsPage'
import MyProfile from './pages/MyProfile'
import YouPage from './pages/YouPage'
import SettingsPage from './pages/SettingsPage'
import ProfileDetail from './pages/ProfileDetail'
import Connections from './pages/Connections'
import Requests from './pages/Requests'
import EventDetail from './pages/EventDetail'
import NotFound from './pages/NotFound'
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
              {/* Dads */}
              <Route path={ROUTES.DADS} element={<DadsPage />} />
              <Route path={ROUTES.DAD_DETAIL} element={<ProfileDetail />} />

              {/* Groups */}
              <Route path={ROUTES.GROUPS} element={<Navigate to={ROUTES.GROUPS_COMMUNITIES} replace />} />
              <Route path="/groups/:tab" element={<GroupsPage />} />
              <Route path={ROUTES.COMMUNITY_DETAIL} element={<CommunityDetailPage />} />
              <Route path={ROUTES.CONVERSATION_DETAIL} element={<ConversationDetailPage />} />
              <Route path={ROUTES.EVENT_DETAIL} element={<EventDetail />} />

              {/* Chats — list only on mobile, list + thread from lg */}
              <Route element={<ChatsLayout />}>
                <Route path={ROUTES.CHATS} element={<ChatsEmptyPane />} />
              </Route>

              {/* You */}
              <Route path={ROUTES.YOU} element={<YouPage />} />
              <Route path={ROUTES.YOU_EDIT} element={<MyProfile />} />
              <Route path={ROUTES.YOU_SETTINGS} element={<SettingsPage />} />
              <Route path={ROUTES.CONNECTIONS} element={<Connections />} />
              <Route path={ROUTES.REQUESTS} element={<Requests />} />
            </Route>

            {/*
              An open thread hides the bottom bar on mobile so the composer is
              not stacked on top of it. On desktop ChatsLayout still puts the
              conversation list alongside, and the side rail is unaffected.
            */}
            <Route element={<AppLayout variant="immersive" />}>
              <Route element={<ChatsLayout />}>
                <Route path={ROUTES.CHAT} element={<Chat />} />
              </Route>
              <Route path={ROUTES.CHAT_MANAGE} element={<ChatManage />} />
            </Route>
          </Route>

          {/* Admin */}
          <Route element={<AdminRoute />}>
            <Route element={<AppLayout variant="tabs" />}>
              <Route path={ROUTES.ADMIN} element={<AdminDashboardPage />} />
            </Route>
          </Route>

          {/*
            Retired URLs. Last in the list so a legacy pattern can never
            shadow a live route. Keep for two release cycles.
          */}
          <Route path="/discover" element={<LegacyRedirect to={() => ROUTES.DADS} />} />
          <Route path="/discover/dads" element={<LegacyRedirect to={() => ROUTES.DADS} />} />
          <Route path="/discover/dads/:id" element={<LegacyRedirect to={(p) => dadDetail(p.id!)} />} />
          <Route path="/profiles/:id" element={<LegacyRedirect to={(p) => dadDetail(p.id!)} />} />
          <Route
            path="/discover/communities"
            element={<LegacyRedirect to={() => groupsTab('communities', 'all')} />}
          />
          <Route
            path="/discover/events"
            element={<LegacyRedirect to={() => groupsTab('events', 'all')} />}
          />
          <Route
            path="/communities"
            element={<LegacyRedirect to={() => groupsTab('communities', 'all')} />}
          />
          <Route path="/match" element={<LegacyRedirect to={() => ROUTES.DADS} />} />
          <Route path="/profile" element={<LegacyRedirect to={() => ROUTES.YOU} />} />
          <Route path="/connections" element={<LegacyRedirect to={() => ROUTES.CONNECTIONS} />} />
          <Route path="/requests" element={<LegacyRedirect to={() => ROUTES.REQUESTS} />} />

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
