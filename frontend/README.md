# Finance Tracker — Frontend

React + Vite + TypeScript PWA client for the Finance Tracker app.
Installable on a phone via "Add to Home Screen" — no app store needed.

## Setup

```bash
cd frontend
npm install
cp .env.example .env   # point VITE_API_BASE_URL at your backend if not localhost
```

## Run (dev)

```bash
npm run dev
```

Open the printed URL on desktop, or (since `server.host` is enabled) visit
`http://<your-computer's-LAN-IP>:5173` from a phone on the same Wi-Fi to
test the install-to-home-screen flow on a real device.

## Build for production

```bash
npm run build   # outputs to dist/, includes the PWA service worker + manifest
npm run preview # serve the production build locally to sanity-check it
```

## Project Layout

```
src/
├── api/           axios calls to the backend, one file per resource
├── components/    shared UI: nav bar, layout shell, route guard
├── context/        AuthContext — holds login state app-wide
├── pages/          one component per screen/route
├── types.ts         shared TypeScript types matching the backend schemas
├── App.tsx           route table
└── main.tsx           app entrypoint
```

## PWA / installability

Configured via `vite-plugin-pwa` in `vite.config.ts`:
- `public/icons/` — app icons (192px, 512px) used for the home-screen icon
- Auto-generated web manifest + service worker on build
- Works offline after first load (precached app shell)
