import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from 'next-themes'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ROUTES, dadDetail, groups, events } from '@/lib/routes'
import { THEMES, DEFAULT_THEME, THEME_STORAGE_KEY } from '@/lib/theme'
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
import HomePage from './pages/HomePage'
import DadsPage from './pages/DadsPage'
import GroupsPage from './pages/GroupsPage'
import EventsPage from './pages/EventsPage'
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
            <Route element={<AppLayout />}>
              {/* Home — the cross-community feed */}
              <Route path={ROUTES.HOME} element={<HomePage />} />

              {/* Dads */}
              <Route path={ROUTES.DADS} element={<DadsPage />} />
              <Route path={ROUTES.DAD_DETAIL} element={<ProfileDetail />} />

              {/* Groups — the communities themselves */}
              <Route path={ROUTES.GROUPS} element={<GroupsPage />} />
              <Route path={ROUTES.COMMUNITY_DETAIL} element={<CommunityDetailPage />} />
              <Route path={ROUTES.CONVERSATION_DETAIL} element={<ConversationDetailPage />} />

              {/* Events */}
              <Route path={ROUTES.EVENTS} element={<EventsPage />} />
              <Route path={ROUTES.EVENT_DETAIL} element={<EventDetail />} />

              {/* Chats — list only on mobile, list + thread from lg */}
              <Route element={<ChatsLayout />}>
                <Route path={ROUTES.CHATS} element={<ChatsEmptyPane />} />
                <Route path={ROUTES.CHAT} element={<Chat />} />
              </Route>
              <Route path={ROUTES.CHAT_MANAGE} element={<ChatManage />} />

              {/* You */}
              <Route path={ROUTES.YOU} element={<YouPage />} />
              <Route path={ROUTES.YOU_EDIT} element={<MyProfile />} />
              <Route path={ROUTES.YOU_SETTINGS} element={<SettingsPage />} />
              <Route path={ROUTES.CONNECTIONS} element={<Connections />} />
              <Route path={ROUTES.REQUESTS} element={<Requests />} />
            </Route>
          </Route>

          {/* Admin */}
          <Route element={<AdminRoute />}>
            <Route element={<AppLayout />}>
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
            element={<LegacyRedirect to={() => groups('all')} />}
          />
          <Route path="/discover/events" element={<LegacyRedirect to={() => events('all')} />} />
          <Route path="/communities" element={<LegacyRedirect to={() => groups('all')} />} />
          {/* Events were a tab inside Groups until they became their own destination. */}
          <Route path="/groups/events" element={<LegacyRedirect to={() => events()} />} />
          {/* Groups' two tabs became Home (the feed) and Groups itself. */}
          <Route path="/groups/feed" element={<LegacyRedirect to={() => ROUTES.HOME} />} />
          <Route path="/groups/communities" element={<LegacyRedirect to={() => groups()} />} />
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
    {/*
      Themes are a class on <html>. next-themes writes it before first paint,
      so there is no flash of the default palette. Stored locally only — no
      backend involved.
    */}
    <ThemeProvider
      attribute="class"
      themes={[...THEMES]}
      defaultTheme={DEFAULT_THEME}
      storageKey={THEME_STORAGE_KEY}
      enableSystem={false}
      disableTransitionOnChange
    >
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ChatProvider>
          <AppContent />
        </ChatProvider>
      </AuthProvider>
    </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>
)

export default App
