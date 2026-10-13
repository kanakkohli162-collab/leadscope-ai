# LeadScope AI – Frontend

React + Vite frontend for **LeadScope AI**, an AI-powered lead intelligence platform.

## Getting started

```bash
npm install          # 1. install dependencies
cp .env.example .env # 2. (optional) point the app at your backend
npm run dev          # 3. start dev server → http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Check code with ESLint |
| `npm run mock:generate` | Regenerate the 50 mock leads with Faker |

> **Login without the backend:** open DevTools → Console on the login page and run
> `localStorage.setItem('token', JSON.stringify('demo'))`, then go to `/dashboard`.

---

## Folder structure

```
frontend/
├── scripts/
│   ├── generate-mock-leads.mjs   # Faker script → src/mocks/data/leads.json
│   └── seed-leads.json           # the 6 original hand-written leads (kept as ids 1–6)
├── src/
│   ├── main.jsx                  # entry point: mounts <App /> inside <BrowserRouter>
│   ├── app/                      # app-level wiring (no business logic)
│   │   ├── App.jsx
│   │   └── router/
│   │       ├── AppRouter.jsx     # all routes, each page lazy-loaded
│   │       └── PrivateRoute.jsx  # redirects to /login when there's no token
│   ├── components/               # SHARED, feature-agnostic UI
│   │   ├── layout/               # AppLayout, Sidebar (collapsible), Topbar
│   │   └── ui/                   # StatCard, PriorityBadge, StatusBadge, ScoreCircle, PageLoader
│   ├── features/                 # one folder per business feature
│   │   ├── auth/pages/LoginPage.jsx
│   │   ├── dashboard/pages/DashboardPage.jsx
│   │   ├── leads/
│   │   │   ├── pages/            # LeadDiscovery, LeadDetails, AILeadAnalysis, MyLeads
│   │   │   ├── components/       # LeadCard, LeadNotFound
│   │   │   └── utils/leadStats.js# pure functions: counts, chart data, search matching
│   │   ├── chat/                 # the floating "Ask AI" assistant
│   │   │   ├── components/       # ChatWidget (button), ChatPanel (popup)
│   │   │   ├── hooks/useChat.js  # conversation state + logic
│   │   │   └── utils/chatEngine.js # answers questions from the lead data
│   │   ├── outreach/             # OutreachGeneratorPage + messageTemplates.js
│   │   ├── analytics/  reports/  saved-searches/  settings/
│   ├── services/                 # everything that talks HTTP
│   │   ├── apiClient.js          # one fetch wrapper (base URL, token, errors)
│   │   ├── authService.js        # login / register / session helpers
│   │   └── leadService.js        # lead endpoints
│   ├── mocks/                    # fake data used until the backend is connected
│   │   ├── index.js
│   │   └── data/leads.json       # GENERATED – 50 leads
│   ├── config/                   # env.js (API URL), navigation.js (routes, sidebar, titles)
│   ├── hooks/useLocalStorage.js  # reusable hooks not tied to one feature
│   ├── utils/storage.js          # safe localStorage wrapper
│   └── styles/index.css
├── eslint.config.js  jsconfig.json  vite.config.js  tailwind.config.js  .env.example
```

### Why "feature-based" folders?

The old layout grouped files by *type* (`pages/`, `components/`). That works for 10 files
but breaks down as the app grows: to change the chatbot you'd touch `pages/`, `data/` and
`components/`. Grouping by *feature* keeps everything for one feature in one folder, so:

- you can find, change or delete a feature in one place,
- teammates can work on different features without editing the same files,
- `components/` only holds truly shared pieces.

**Rule of thumb:** used by one feature → put it inside that feature. Used by two or more → `components/`, `hooks/` or `utils/`.

### The `@/` import alias

`import StatCard from '@/components/ui/StatCard'` instead of `'../../../components/ui/StatCard'`.
`@` means `src/`. It's configured in `vite.config.js` (for the build) and `jsconfig.json` (so VS Code autocompletes it).

---

## Performance decisions

| What | Why it helps |
|---|---|
| **Lazy-loaded routes** (`React.lazy` in `AppRouter.jsx`) | Each page is its own JS file, downloaded only when visited. The login page no longer downloads the whole app. |
| **Vendor chunks** (`manualChunks` in `vite.config.js`) | React, router, icons and charts are cached separately from app code; a redeploy doesn't force users to re-download React. |
| **Charts loaded only where used** | Recharts (~111 KB gzipped) is fetched only on Dashboard and Analytics, not on first load. |
| **Lazy Ask AI popup + prefetch on hover** | The chat window's code loads when first needed; hovering the button starts the download early, so the click feels instant. |
| **Faker runs at build time, not in the browser** | Faker is ~2 MB. Generating a JSON file once keeps it out of the user's bundle. |
| **Stats computed once at module level** | Mock data is static, so counts/chart data are calculated once instead of on every render. |
| **`memo`, `useMemo`, `useCallback`, `useDeferredValue`** | Skip unnecessary re-renders of the sidebar, cards and chat bubbles; keep typing in search smooth. |

---

## Features added in this restructure

### Ask AI – floating chat on every page
`features/chat/components/ChatWidget.jsx` is rendered once inside `AppLayout`, so the
bottom-right button appears on every logged-in page. The conversation is stored in the
`useChat` hook inside the widget, which stays mounted while you navigate, so **your chat
survives page changes and closing/reopening the popup**. Esc closes it, the ↺ button starts
over, a red badge shows unread replies, and on phones it opens full-screen.

To connect a real AI backend later, replace `getAIResponse()` in `chatEngine.js`; the UI doesn't change.

The old `/chatbot` page was removed (it now redirects to the dashboard) since the widget replaces it.

### Collapsible sidebar
- **Desktop:** the ⇤ button collapses it to icons only (hover an icon for its name). The choice is remembered across reloads.
- **Mobile/tablet:** the sidebar hides; the ☰ button in the top bar opens it as a drawer. It closes on link click, backdrop click or Esc.

### 50 mock leads
`scripts/generate-mock-leads.mjs` keeps the original 6 leads and generates 44 more with
[Faker](https://fakerjs.dev) (Indian locale). Score, priority, service gaps, AI reason and
recommended action are **derived from each lead's signals** (website, listing, rating), so
every lead is internally consistent. A fixed seed means the same 50 leads every time.
Dashboard and Analytics numbers are now calculated from this data.

---

## Routes

| Route | Page |
|---|---|
| `/login` | Login / Sign up / Forgot password |
| `/dashboard` | Dashboard |
| `/lead-discovery` | Lead Discovery |
| `/lead/:id` | Lead Details |
| `/ai-analysis/:id` | AI Lead Analysis |
| `/outreach` | Outreach Generator |
| `/my-leads` | My Leads (CRM) |
| `/analytics` | Analytics |
| `/export` | Export Reports |
| `/saved-searches` | Saved Searches |
| `/settings` | Settings |

## Tech stack
React 18 · Vite 5 · React Router 6 · Tailwind CSS 3 · Recharts · Lucide icons · Faker (dev only) · ESLint 9
