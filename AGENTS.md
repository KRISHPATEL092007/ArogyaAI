# ArogyaAI

A full-stack app where patients submit medical cases (symptoms + optional
PDF report) and doctors see them shortlisted by urgency. React frontend,
Python/Flask + SQLite backend, kept as two independent processes joined by
a dev proxy.

## Tech Stack

- **Frontend**: React 18 + React Router 6 (SPA) + Vite + TailwindCSS
- **Backend**: Python 3 + Flask + SQLite — see `backend/README.md` for the
  full API reference, schema, and how the urgency/triage logic works
- **UI**: Radix UI + TailwindCSS + Lucide React icons
- **Testing**: Vitest (frontend)

## Project Structure

```
client/                   # React SPA frontend
├── pages/                # Route components (Home.jsx, Index.jsx = patient login, ...)
├── components/ui/        # Pre-built UI component library (shadcn-style)
├── lib/urgency.js         # Maps a triage level to a Badge variant
├── App.jsx                # SPA routing setup
└── global.css            # TailwindCSS theming and global styles

shared/api.js              # Frontend fetch helper: auth token storage, JSON
                           # requests, configurable API base URL

backend/                   # Flask API + SQLite — see backend/README.md
├── app.py                 # App factory, blueprint registration, error handlers
├── db.py                   # SQLite connection + schema
├── auth_utils.py            # Password hashing + JWT
├── decorators.py             # @require_auth() route guard
├── triage.py                # Rule-based urgency/keyword classifier
└── routes/                  # auth.py, patients.py, doctors.py, records.py
```

## Running it

Two processes, two terminals:

```bash
# Terminal 1
cd backend && pip install -r requirements.txt && python app.py   # :5000

# Terminal 2
npm install && npm run dev                                        # :8080
```

Vite (`:8080`) proxies every `/api/*` request to Flask (`:5000`) — see the
`server.proxy` block in `vite.config.js`. The browser only ever talks to
`:8080` in dev, so there's nothing cross-origin to worry about.

## SPA Routing System

Routes are defined in `client/App.jsx` using `react-router-dom`. Protected
pages (anything under a signed-in patient/doctor) are wrapped in
`<RequireAuth role="patient">` or `<RequireAuth role="doctor">`
(`client/components/RequireAuth.jsx`), which redirects to the matching
login page if the person isn't signed in with that role.

```jsx
<Route
  path="/user-home"
  element={
    <RequireAuth role="patient">
      <UserHome />
    </RequireAuth>
  }
/>
```

## Styling System

- **Primary**: TailwindCSS utility classes
- **Theme and design tokens**: `client/global.css` + `tailwind.config.js`
- **UI components**: `client/components/ui/`
- **Utility**: `cn()` combines `clsx` + `tailwind-merge` for conditional classes

```jsx
className={cn(
  "base-classes",
  { "conditional-class": condition },
  props.className, // user overrides
)}
```

## Talking to the backend

`shared/api.js` exports:

- `api.get/post/put/patch(path, body)` — JSON requests, auth header attached automatically
- `getToken() / setAuth(token, role) / clearAuth() / isAuthenticated() / getRole()`
- `reportUrl(recordId)` — builds a downloadable link to a record's PDF, with the token as a query param (for plain `<a href>`)

File uploads (creating a medical record with a PDF) use a raw
`fetch(...)` with `FormData` instead, in `client/pages/CreateMedicalRecord.jsx`,
since that request isn't JSON.

Path aliases: `@shared/*` → `shared/`, `@/*` → `client/`.

## Adding a new API route

1. Add the endpoint to the relevant blueprint in `backend/routes/` (or a
   new blueprint, registered in `backend/app.py`).
2. Decorate it with `@require_auth()`, `@require_auth("patient")`, or
   `@require_auth("doctor")` as appropriate.
3. Call it from the frontend via `api.get/post/put/patch("/your-path", body)`.

## Adding a new page

1. Create the component in `client/pages/MyPage.jsx`.
2. Add a route in `client/App.jsx` (wrap in `<RequireAuth>` if it needs a signed-in user).

## Adding a theme color

Open `client/global.css` and `tailwind.config.js` and add the new token in
both places.

## Production notes

- `npm run build` builds the static frontend to `dist/spa`.
- The Flask backend is a separate process — deploy it behind a real WSGI
  server (gunicorn, etc.), not `python app.py`'s dev server. See the
  "Configuration" section of `backend/README.md` for env vars, and set
  `VITE_API_BASE_URL` on the frontend if the two are on different origins.
