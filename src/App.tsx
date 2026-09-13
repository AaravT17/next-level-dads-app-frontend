import { Suspense, lazy } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from 'next-themes'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/lib/queryClient'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ROUTES, dadDetail, groups, events } from '@/lib/routes'
import { THEMES, DEFAULT_THEME, THEME_STORAGE_KEY } from '@/lib/theme'
import { AuthProvider } from '@/contexts/AuthProvider'
import { PublicRoute, ProtectedRoute, SetupRoute, AdminRoute } from '@/components/RouteWrappers'
import { AppLayout } from '@/components/layout/AppLayout'
import { CenteredSpinner } from '@/components/feedback/Spinner'
import { LegacyRedirect } from '@/components/routing/LegacyRedirect'
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary'
import { ModerationNotifier } from '@/features/moderation/components/ModerationNotifier'
import { LegalAcceptancesModal } from '@/components/LegalAcceptancesModal'
import { ChatProvider } from '@/contexts/ChatProvider'

// Welcome and NotFound stay eager: Welcome is what a logged-out visitor lands
// on, so putting it behind a chunk boundary would trade a smaller bundle for a
// spinner on first paint. Everything else is split, because none of it is
// reachable until the user has navigated somewhere.
import Welcome from './pages/Welcome'
import NotFound from './pages/NotFound'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'))
const OnboardingWelcome = lazy(() => import('./pages/OnboardingWelcome'))
const Chat = lazy(() => import('./pages/Chat'))
// Named exports need mapping to a default for React.lazy.
const ChatsLayout = lazy(() =>
  import('./pages/chats/ChatsLayout').then((m) => ({ default: m.ChatsLayout })),
)
const ChatsEmptyPane = lazy(() =>
  import('./pages/chats/ChatsLayout').then((m) => ({ default: m.ChatsEmptyPane })),
)
const ChatManage = lazy(() => import('./pages/ChatManage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const ResumePage = lazy(() => import('./pages/ResumePage'))
const DadsPage = lazy(() => import('./pages/DadsPage'))
const GroupsPage = lazy(() => import('./pages/GroupsPage'))
const EventsPage = lazy(() => import('./pages/EventsPage'))
const MyProfile = lazy(() => import('./pages/MyProfile'))
const YouPage = lazy(() => import('./pages/YouPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const ProfileDetail = lazy(() => import('./pages/ProfileDetail'))
const Connections = lazy(() => import('./pages/Connections'))
const Requests = lazy(() => import('./pages/Requests'))
const EventDetail = lazy(() => import('./pages/EventDetail'))
const CommunityDetailPage = lazy(() => import('./features/communities/pages/CommunityDetailPage'))
const ConversationDetailPage = lazy(
  () => import('./features/communities/pages/ConversationDetailPage'),
)
const AdminDashboardPage = lazy(() =>
  import('./features/admin/pages/AdminDashboardPage').then((m) => ({
    default: m.AdminDashboardPage,
  })),
)

const AppContent = () => {
  return (
    <TooltipProvider>
      <Toaster />
      <ModerationNotifier />
      <LegalAcceptancesModal />
      <BrowserRouter>
        {/*
          Covers the routes rendered outside AppLayout (auth, setup, 404).
          Routes inside it have their own boundary, so the shell survives a
          chunk load there instead of being replaced by this fallback.
        */}
        <Suspense fallback={<CenteredSpinner />}>
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
            <Route path={ROUTES.ONBOARDING_WELCOME} element={<OnboardingWelcome />} />
            <Route element={<AppLayout />}>
              {/* Home — the cross-community feed, and the resume set on its own page */}
              <Route path={ROUTES.HOME} element={<HomePage />} />
              <Route path={ROUTES.HOME_RESUME} element={<ResumePage />} />

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
        </Suspense>
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
