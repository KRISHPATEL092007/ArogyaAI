# ArogyaAI backend (Python / Flask + SQLite)

The API that powers the ArogyaAI React app: patients submit symptoms (with
an optional PDF report), the backend automatically triages them by urgency,
and doctors see a shortlisted, urgency-sorted queue instead of a plain
list — so the diagnosis process consumes less time.

## Stack

- **Flask** — HTTP routes, blueprints
- **SQLite** (Python's built-in `sqlite3`) — one file database, zero setup
- **PyJWT** — auth tokens
- **Werkzeug's `generate_password_hash`/`check_password_hash`** — password
  hashing (already ships with Flask, so no extra native dependency like
  `bcrypt`)
- **python-dotenv** — loads `backend/.env`

No native/C-extension packages are required, so `pip install` should never
need a compiler.

## Setup

```bash
cd backend
python -m venv venv          # optional but recommended
source venv/bin/activate      # Windows: venv\Scripts\activate

python app.py
```

The server starts on **http://localhost:5000**. A ready-to-use SQLite
database already ships at `backend/data/arogya.db`, pre-seeded with a
demo patient, a demo doctor, and a few sample cases at different urgency
levels (see "Demo accounts" below) — so there's something to look at
immediately, with no registration required.

If you'd rather start from a blank slate, just delete
`backend/data/arogya.db` — a fresh, empty one is created automatically
the next time you run `python app.py`. To get the demo data back (or
re-seed after a reset), run:

```bash
python seed_data.py
```

## Demo accounts

| Role    | Login fields                                                                 | Password   |
|---------|--------------------------------------------------------------------------------|------------|
| Patient | ABHA No. `12-3456-7890-1234`, username `asha_demo`                              | `demo1234` |
| Doctor  | Name `Dr. Priya Mehta`, License No. `MCI-DEMO-1001`                             | `demo1234` |

Log in as the doctor to see the demo patient's 4 sample cases already
shortlisted by urgency (two High, one Medium, one Low/already-reviewed).

Then, in a **second terminal**, from the project root:

```bash
npm install
npm run dev
```

The React app runs on http://localhost:8080 and Vite proxies every
`/api/*` call straight to the Flask server (see `vite.config.js`). Open
http://localhost:8080 and use the app normally — register a patient,
submit a case, register a doctor, and watch it show up shortlisted.

## Configuration

All config lives in `backend/.env` (already included with sane defaults):

| Variable      | Purpose                                   | Default   |
|----------------|--------------------------------------------|-----------|
| `JWT_SECRET`   | Signing key for auth tokens                | dev placeholder — **change before deploying** |
| `PORT`         | Port the Flask dev server listens on       | `5000`    |
| `FLASK_DEBUG`  | Enables debug mode / auto-reload           | `1`       |

If you change `PORT`, also update the proxy target in `vite.config.js`.

## Project layout

```
backend/
  app.py              # Flask app factory, blueprint registration, error handlers
  db.py               # SQLite connection + schema (patients, doctors, medical_records)
  auth_utils.py        # password hashing + JWT sign/verify
  decorators.py         # @require_auth() route guard (role-based)
  triage.py            # rule-based urgency/keyword classifier (the "shortlisting" logic)
  routes/
    auth.py            # register / login (patient + doctor)
    patients.py         # patient profile get/update
    doctors.py          # doctor profile get/update
    records.py          # create record (+ file upload), list mine, doctor shortlist,
                         # record detail, PDF download, mark-reviewed
  seed_data.py         # populates data/arogya.db with demo accounts + sample cases
  data/                # arogya.db lives here — ships pre-seeded, see "Demo accounts" above
  uploads/             # uploaded PDF reports (created automatically, gitignored)
```

## How the "shortlisting" works

`triage.py` scans the patient's free-text symptom description (plus how
long they've had it) for clinically-relevant keywords — chest pain,
breathing difficulty, high fever, blood in stool/vomit, and ~30 others —
each carrying a severity weight. It sums the weights into a score, maps
the score to **High / Medium / Low**, and extracts up to 5 short tags
(e.g. "Chest pain", "Breathing difficulty") for the doctor's dashboard
card. Recent/sudden onset ("since this morning") nudges the score up a
little; a long-standing complaint ("for 2 years") nudges it down.

This is intentionally a transparent, offline, rule-based classifier (not a
black-box ML/LLM call) — it's fast, free, explainable to a judge, and has
no external dependency to fail during a demo. `GET /api/records` (the
doctor's queue) sorts by `pending` first, then `urgency_score` descending,
then newest first — that ordering *is* the shortlist.

## API reference

All endpoints are prefixed with `/api`. Authenticated endpoints expect
`Authorization: Bearer <token>` (the PDF download route also accepts
`?token=` as a query param, since a plain `<a href>` can't set headers).

### Auth

| Method | Path                        | Body                                              | Notes                    |
|--------|------------------------------|----------------------------------------------------|---------------------------|
| POST   | `/auth/register/patient`    | `name, abhaNumber, username, password`             | Returns `{ token, patient }` |
| POST   | `/auth/register/doctor`     | `name, licenseNumber, password`                    | Returns `{ token, doctor }`  |
| POST   | `/auth/login/patient`       | `abhaNumber, username, password`                   |                            |
| POST   | `/auth/login/doctor`        | `name, licenseNumber, password`                    |                            |

### Patients / Doctors

| Method | Path             | Auth    | Notes                          |
|--------|-------------------|---------|----------------------------------|
| GET    | `/patients/me`    | patient | Current profile                 |
| PUT    | `/patients/me`    | patient | Update profile (marks it complete) |
| GET    | `/doctors/me`     | doctor  | Current profile                 |
| PUT    | `/doctors/me`     | doctor  | Update profile (marks it complete) |

### Medical records

| Method | Path                          | Auth           | Notes                                             |
|--------|--------------------------------|----------------|-----------------------------------------------------|
| POST   | `/records`                    | patient        | `multipart/form-data`: `symptoms`, `duration`, optional `report` (PDF, ≤10MB). Triage runs automatically. |
| GET    | `/records/mine`               | patient        | The patient's own records, newest first             |
| GET    | `/records?status=pending`     | doctor         | The shortlist. `status` is optional (`pending`/`reviewed`), sorted pending-first then by urgency |
| GET    | `/records/<id>`                | patient/doctor | Full detail (patient can only view their own)       |
| GET    | `/records/<id>/report`         | patient/doctor | Downloads the attached PDF                          |
| PATCH  | `/records/<id>/review`         | doctor         | Body: `diagnosis`, `doctorNotes`, `status` — marks reviewed |

### Health check

`GET /api/ping` → `{ "message": "ping pong" }`

## Notes for judges / graders

- **Manually tested end-to-end** during development: registration,
  duplicate-account rejection, login (correct + wrong password),
  unauthenticated access, profile updates, record creation with and
  without a PDF, urgency scoring/sorting, cross-patient access control
  (403), PDF upload/download byte-for-byte integrity, non-PDF rejection,
  malformed-token handling, and the full doctor review workflow.
- SQLite is used for simplicity and zero external setup, which fits a
  hackathon demo well. If you outgrow a single file, swapping `db.py`'s
  `sqlite3` calls for `psycopg2`/PostgreSQL is a small, contained change —
  every query goes through `get_db()` in that one file.
