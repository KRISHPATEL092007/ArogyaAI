# ArogyaAI

A platform where patients submit their medical problems (symptoms +
optional PDF report) and doctors see them **shortlisted by urgency**
instead of a plain list — cutting down the time it takes to triage and
diagnose.

- **Frontend:** React + Vite + Tailwind (in `client/`)
- **Backend:** Python + Flask + SQLite (in `backend/`) — see
  **[`backend/README.md`](backend/README.md)** for the full API
  reference and how the auto-triage/shortlisting works.

## Quick start

**Terminal 1 — backend:**

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Runs on http://localhost:5000.

**Terminal 2 — frontend:**

```bash
npm install
npm run dev
```

Runs on http://localhost:8080 and proxies `/api/*` to the Flask backend
above. Open http://localhost:8080 in your browser.

The backend ships with a pre-seeded database (`backend/data/arogya.db`)
containing a demo patient and doctor, so you can log in immediately
without registering:

| Role    | Login fields                                                       | Password   |
|---------|-----------------------------------------------------------------------|------------|
| Patient | ABHA No. `12-3456-7890-1234`, username `asha_demo`                       | `demo1234` |
| Doctor  | Name `Dr. Priya Mehta`, License No. `MCI-DEMO-1001`                      | `demo1234` |

Log in as the doctor to see 4 sample cases already shortlisted by
urgency. (Delete the `.db` file to start fresh, or register your own
accounts — either works.)

## Try it out

**Fastest path:** just log in with the demo accounts above — the doctor
dashboard already has 4 sample cases shortlisted by urgency, one already
reviewed.

**Or walk through it fresh:**

1. Go to **Register** → create a patient account (ABHA number, username,
   password) → fill in the profile form.
2. From the patient dashboard, click **New Medical Record**, describe a
   symptom (try "severe chest pain and difficulty breathing" for a High
   priority case, or "mild headache for two days" for Low), optionally
   attach a PDF, and submit.
3. Open a second browser/incognito window, register a **doctor** account,
   and log in. The doctor's dashboard shows the case shortlisted by
   urgency, with tags like "Chest pain" pulled straight from the
   description.
4. Click into a case to see the full patient detail, download the
   attached PDF, and submit a diagnosis + notes — the patient will see it
   marked "Reviewed" next time they check their records.

## Project structure

```
client/            React app (pages, components, routing)
shared/api.js       Frontend fetch helper (auth token, JSON, base URL)
backend/            Flask API + SQLite (see backend/README.md)
vite.config.js      Dev server + proxy (/api/* → localhost:5000)
```
