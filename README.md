# HabitFlow

## Logo
<img src="./public/logo.svg" alt="HabitFlow logo" width="64" />

HabitFlow is a cross-platform habit tracker and analytics dashboard built with Next.js, MongoDB, and a time-series log model.

## Screenshots
| Dashboard | AI Insights |
|---|---|
| ![Dashboard](./public/screenshots/dashboard.svg) | ![AI Insights](./public/screenshots/ai-insights.svg) |

## Features
- Habit tracking matrix (rows = habits, columns = days)
- Streak calculation from completed day history
- Success rate + progress analytics per habit (monthly)
- Monthly performance chart with multiple lines (one line per habit)
- Auth with Clerk (Google/Gmail + Clerk session)
- Dark/Light mode
- Habit edit + delete actions
- AI Weekly Insights card (rule-based fallback if OpenAI key is not set)
- Quick routine seeding button (adds a full Morning/Afternoon/Evening/Night pack in one click)
- Mobile UX improvements: auto-scroll to current day column, collapsible habits list panel

## Tech Stack
- Next.js (App Router)
- MongoDB + Mongoose
- Tailwind CSS + shadcn/ui
- Redux Toolkit + redux-persist (dashboard state persistence)
- Recharts / Chart.js (analytics)
- Clerk (authentication)
- OpenAI (optional, for AI Insights)

## Architecture
See [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Installation
1. Install dependencies:
   ```bash
   npm ci
   ```
2. Configure environment variables:
   - Copy `.env.example` to `.env` and fill in values
3. Start the dev server:
   ```bash
   npm run dev
   ```
4. Open the app at `http://localhost:3000`.

## Windows (Desktop) Install
If you’re using the Electron build:
1. Download the Windows installer:
   - GitHub Releases (direct): `https://github.com/RaghavOG/HabbitFlow/releases/download/v1.0.0/HabitFlow.Setup.1.0.0.exe`
2. Run the installer.
3. If Windows SmartScreen shows a warning, click **More info → Run anyway** (expected for unsigned builds).
4. Launch HabitFlow from the Start Menu.

## Android (Add to Home Screen)
1. Open the web app in **Chrome**.
2. Tap the **⋮** menu.
3. Tap **Install app** (or **Add to Home screen**).
4. Open HabitFlow from your home screen (it runs like an app).

## iPhone (Add to Home Screen)
1. Open the web app in **Safari**.
2. Tap the **Share** button.
3. Tap **Add to Home Screen**.
4. Open HabitFlow from your home screen.

## Env Variables
Required:
- `MONGODB_URI` - MongoDB connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk frontend key
- `CLERK_SECRET_KEY` - Clerk backend secret
- `CLERK_WEBHOOK_SECRET` - Clerk webhook signing secret

Optional:
- `OPENAI_API_KEY` - enables real AI insights; when missing, the UI uses deterministic fallback insights
- `OPENAI_MODEL` - OpenAI model name (defaults to `gpt-4o-mini`)

Full list in [`./.env.example`](./.env.example).

## API
Documentation: [`docs/api.md`](./docs/api.md).

## Roadmap
- Reminders
- Offline sync
- Export data
- PWA service worker wiring
- Improved desktop (Electron) packaging/UX

## License
MIT (see [`LICENSE`](./LICENSE)).
