# Next Level Dads Frontend

React frontend for Next Level Dads, a community app for dads to find people, groups, events, conversations, and private chats.

The app is no longer the default Lovable shell. It now has a real app layout, authenticated routes, Supabase auth, API-backed communities/events/dads/chats, moderation surfaces, themes, CI, and unit tests.

## Stack

- React 18
- TypeScript
- Vite
- React Router
- TanStack Query
- Axios
- Supabase Auth
- Tailwind CSS
- Radix UI primitives
- shadcn-style local UI components
- Sonner toasts
- Vitest
- ESLint

## Main Features

- Auth and onboarding: register, login, OAuth session handoff, password reset, email verification, profile setup, consent gates.
- Home: cross-community feed, "get back into it" rail, suggested dads, suggested events.
- Dads: browse dads, view profiles, connect with request notes.
- Groups: browse/join communities, community conversations, replies, likes, membership-aware actions.
- Events: browse events and view event details.
- Chats: chat inbox, two-pane desktop thread view, group chat management, realtime WebSocket updates.
- Communities: invite connections into communities through chats, render shared community cards, optional community photo editor path.
- Moderation: report content/users, display moderation notifications, block banned users from composers.
- Admin: reports, bans, and filtered-message review surfaces.
- UI system: responsive app shell, bottom nav, side nav, theme picker, shared loading/error/empty states, route-level code splitting.

## Local Setup

Install dependencies:

```sh
npm ci
```

Create a local environment file:

```sh
cp .env.example .env
```

Fill in the Supabase and app URLs in `.env`.

Run the dev server:

```sh
npm run dev
```

The current branch's Vite config uses port `5173`. The backend CORS setting must allow the same origin through `FRONTEND_BASE_URL`. If you switch the frontend back to `3000`, update the backend env to match.

The Vite dev server proxies `/api` to `http://localhost:8000`, so the backend should be running locally for authenticated app flows.

## Environment Variables

See `.env.example` for the full list.

Required for local development:

- `VITE_ENV`: usually `development`.
- `VITE_FRONTEND_BASE_URL`: the browser origin for this app.
- `VITE_BACKEND_BASE_URL`: the API origin, usually `http://localhost:8000`.
- `VITE_WEBSITE_BASE_URL`: the marketing/public website origin.
- `VITE_SUPABASE_URL`: Supabase project URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key.

Only variables prefixed with `VITE_` are exposed to browser code.

## Scripts

```sh
npm run dev          # Start Vite
npm run build        # Production build
npm run build:dev    # Development-mode build
npm run preview      # Preview the production build
npm run typecheck    # TypeScript project check
npm run lint         # ESLint
npm test             # Run Vitest once
npm run test:watch   # Watch-mode Vitest
```

## CI

GitHub Actions runs on pull requests and pushes to `main`:

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

The lint step is part of the design-system guard rail. Raw hex colors and token bypasses are expected to fail CI.

## Project Structure

```text
src/
  api/                 shared API client pieces
  components/          shared app, layout, media, feedback, and UI components
  config/              frontend constants and feature flags
  contexts/            auth and chat providers
  features/            domain features: admin, communities, connections, feed, moderation
  hooks/               shared React hooks
  lib/                 routes, theme, query client, Supabase auth client, toast helpers
  pages/               route-level page components
  types/               shared TypeScript response/domain types
  utils/               formatting, auth, and error helpers
```

Routes are centralized in `src/lib/routes.ts`. The app is organized around objects: Home, Dads, Groups, Events, Chats, and You.

## Backend Pairing

Several frontend features require matching backend changes to be deployed first:

- Cross-community feed requires `GET /api/conversations`.
- Home resume rail requires `GET /api/users/me/conversations`.
- Request notes require backend connection-note support.
- Community invites require `POST /api/communities/{id}/invites`.
- Community photos require `PUT` and `DELETE /api/communities/{id}/image`.
- WebSocket auth changes must land with the backend WebSocket subprotocol handshake.

For stacked PR notes and merge ordering, see `../pr-notes/stacked-prs.md` from the workspace root.

## Notes

- `COMMUNITY_PHOTO_EDITING_ENABLED` is currently `false`; existing photos still render, but the editor UI is hidden.
- Supabase is used for auth only in the frontend. API data flows through the FastAPI backend.
- The app uses route-level code splitting to keep the initial payload smaller.
- Current unit tests are pure logic tests; component tests would need a DOM test setup.

