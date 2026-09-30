# ReachInbox Email Scheduler

A production-oriented full-stack email scheduling system built for the ReachInbox assignment.

## Stack

- Backend: TypeScript, Express.js, Prisma, PostgreSQL
- Queue: BullMQ backed by Redis
- SMTP: Nodemailer + Ethereal Email
- Auth: Google OAuth 2.0 + Redis-backed sessions
- Frontend: React, TypeScript, Vite, Tailwind CSS
- Infra: Docker Compose for PostgreSQL + Redis

## Architecture

```text
React dashboard
      |
      | REST + cookie session
      v
Express API -------------------- PostgreSQL
      |                              |
      | enqueue delayed jobs         | source of truth
      v                              |
BullMQ ---------------------------> email state
      |
      v
Email worker(s)
      |
      +---- Redis distributed throttle + hourly quota
      |
      v
Ethereal SMTP
```

PostgreSQL is the source of truth for users, campaigns, emails and sender identities. Ethereal credentials stay in environment configuration and are never persisted in PostgreSQL. BullMQ stores pending delayed jobs in Redis. The worker uses the database state machine (`SCHEDULED -> PROCESSING -> SENT/FAILED`) to make processing idempotent at the application level.

## Scheduling and restart behavior

The API creates one PostgreSQL row per recipient and one BullMQ delayed job per email. The queue job contains only the stable database `emailId`.

Redis is configured with AOF persistence in Docker. BullMQ persists delayed jobs in Redis, so a backend or worker restart does not require recreating jobs. On restart the worker reconnects to the same queue and continues from the persisted job state.

The backend scheduler and worker do not use cron, OS schedulers, or Node cron libraries. The frontend may poll the API for dashboard freshness, but that polling is not used to trigger email sends.

### Important delivery semantics

SMTP itself cannot provide a universal exactly-once delivery guarantee because a process can fail after the provider accepts a message but before PostgreSQL records `SENT`. To minimize duplicate sends, the worker first atomically claims the email row with `SCHEDULED -> PROCESSING`, and any retried job that sees `SENT` becomes a no-op. This gives strong application-level idempotency while documenting the unavoidable SMTP boundary.

## Concurrency, spacing, and hourly quotas

Worker concurrency is configurable with `WORKER_CONCURRENCY`. Failed SMTP jobs use `MAX_JOB_ATTEMPTS` with exponential backoff; exhausted rows become `FAILED` and are excluded from startup reconciliation.

Each campaign can specify a minimum delay between sends. The worker reserves a distributed global send slot through a Redis lock/lease before sending. The last-send timestamp is held in Redis, which prevents multiple workers from ignoring the minimum spacing.

Hourly quotas are per sender and implemented with a Redis Lua script. A sender has a key of the form:

`rate:sender:{senderId}:{UTC-hour}`

The reservation script increments the counter only when quota remains. When quota is exhausted, the job is moved back to the waiting state with a delay until the next UTC hour. Jobs are not dropped.

This is deliberately a Redis-backed distributed mechanism rather than an in-memory counter so multiple worker processes and instances share the same quota.

### Example under load

With 1,000 emails scheduled for approximately 10:00, `HOURLY_LIMIT=100`, and a 2-second minimum delay, the first available jobs consume the current sender quota. The remaining jobs are delayed toward 11:00 rather than discarded. Workers continue processing subsequent hour windows from the same durable queue.

## Multiple Ethereal senders

Configure a JSON array in `ETHEREAL_SENDERS_JSON`:

```json
[
  {"email":"sender-one@example.com","username":"ethereal-user-1","password":"ethereal-pass-1"},
  {"email":"sender-two@example.com","username":"ethereal-user-2","password":"ethereal-pass-2"}
]
```

The backend upserts only those sender identities at startup; usernames/passwords remain in environment configuration. If a campaign does not specify a sender, recipients are assigned to the configured pool in round-robin fashion. A future campaign can also pass `senderId` explicitly.

## Google OAuth setup

1. Create OAuth credentials in Google Cloud Console.
2. Add an authorized JavaScript origin for the frontend, e.g. `http://localhost:5173`.
3. Add an authorized redirect URI for the backend, e.g. `http://localhost:5000/api/auth/google/callback`.
4. Put the client ID and secret in `backend/.env`.

No mocked login is implemented.

## Ethereal setup

Create one or more Ethereal accounts at https://ethereal.email/ and place their credentials in `ETHEREAL_SENDERS_JSON`.

The worker uses Nodemailer SMTP. Ethereal does not deliver mail to real inboxes; use the Ethereal preview URL returned by Nodemailer for verification.

## Local setup

### 1. Start PostgreSQL and Redis

```bash
docker compose up -d
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the backend

```bash
cp backend/.env.example backend/.env
```

Fill in Google OAuth, Ethereal, Redis and database settings.

### 4. Create the Prisma client and database schema

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 5. Start API, worker and frontend

```bash
npm run dev
```

Frontend: `http://localhost:5173`
API: `http://localhost:5000`

## Useful API routes

- `GET /api/health`
- `GET /api/auth/me`
- `GET /api/auth/google`
- `POST /api/auth/logout`
- `POST /api/emails/schedule`
- `GET /api/emails/scheduled`
- `GET /api/emails/sent`
- `GET /api/emails/:id`

## Demo flow

1. Login with Google.
2. Compose an email, upload a CSV/TXT lead file, select start time, spacing and hourly quota.
3. Schedule the campaign.
4. Show scheduled rows.
5. Wait for jobs to move to Sent.
6. Schedule future jobs, stop the worker, restart it, and show that the delayed jobs remain durable.
7. Use a small hourly limit such as 2 or 3 to demonstrate rescheduling instead of dropping jobs.

## Assignment checklist

### Backend

- [x] Express + TypeScript
- [x] Relational persistence with PostgreSQL
- [x] BullMQ delayed scheduling
- [x] Redis persistence
- [x] Configurable worker concurrency
- [x] Minimum send delay
- [x] Distributed hourly rate limiting
- [x] Multiple Ethereal senders
- [x] Idempotent database state transitions
- [x] Restart-safe delayed jobs
- [x] No cron jobs
- [x] Retry/backoff with terminal failure state

### Frontend

- [x] Real Google OAuth flow
- [x] User name/email/avatar in header
- [x] Logout
- [x] Scheduled/Sent tabs
- [x] Compose flow
- [x] CSV/TXT parsing and detected-recipient count
- [x] Start time / delay / hourly limit
- [x] Loading and empty states
- [x] Error/toast feedback
- [x] Reusable TypeScript components
- [x] Tailwind styling

## Assumptions / trade-offs

- PostgreSQL stores the authoritative email lifecycle state.
- Redis is the durable queue and distributed coordination layer.
- Per-sender quota is used because multiple senders are explicitly required.
- SMTP exactly-once delivery is not claimed; the README documents the external-system boundary.
- The schedule API accepts an idempotency key so client retries do not create a second campaign.
- The UI uses periodic refresh for table data rather than websockets, which keeps the assignment simpler while preserving correctness.

## GitHub submission

Create a **private** repository and push this directory as the repository root. After the repository is created, add the required collaborators in GitHub:

- `Mitrajit`
- `Yadav036`

GitHub steps: **Repository → Settings → Collaborators → Add people**. Search each username exactly as provided by the assignment and grant the requested access.

### Suggested repository setup

```bash
git init
git add .
git commit -m "feat: implement ReachInbox email scheduler"
git branch -M main
git remote add origin <YOUR_PRIVATE_REPOSITORY_URL>
git push -u origin main
```

Do **not** commit `backend/.env`, Google credentials, Ethereal passwords, or any generated secret. `.gitignore` already excludes `.env` files.

## Five-minute demo script

Use this as the recording checklist so the video directly covers the evaluator's requested evidence.

### 0:00–0:30 — Login

- Open `http://localhost:5173`.
- Click **Continue with Google**.
- Complete Google login.
- Show the dashboard header with name, email, avatar, and logout.

### 0:30–1:30 — Schedule a campaign

- Click **Compose New Email**.
- Enter a subject and body.
- Upload a CSV/TXT file containing a few test addresses.
- Show the detected recipient count.
- Set a start time 20–30 seconds in the future.
- Set a small delay such as 2 seconds.
- Set a small hourly limit such as 3.
- Click **Schedule**.

### 1:30–2:20 — Scheduled and Sent views

- Open **Scheduled Emails** and show the rows, subject, recipient, scheduled time, and status.
- Wait for the first messages to send.
- Open **Sent Emails** and show sent time and status.
- For Ethereal validation, inspect the preview URL printed by the backend worker after successful delivery.

### 2:20–3:40 — Restart persistence

- Schedule another small batch for a time at least 30–60 seconds in the future.
- Stop the **worker** and/or backend process.
- Keep PostgreSQL and Redis running.
- Start the worker/backend again with `npm run dev` (or restart the individual process).
- Refresh the dashboard.
- Show that the future scheduled records are still present.
- Show that the delayed BullMQ jobs continue executing after the restart.

### 3:40–4:40 — Rate limiting and delay

- Use 5–10 recipients.
- Configure an hourly limit of `2` or `3` and a 2-second minimum send delay.
- Show that messages are not dropped when the hourly quota is reached.
- Explain that the remaining jobs are delayed until the next available UTC-hour quota window.

### 4:40–5:00 — Architecture

Briefly show the repository and point out:

- `backend/src/services/queue.service.ts`
- `backend/src/services/rate-limit.service.ts`
- `backend/src/services/reconciliation.service.ts`
- `backend/src/workers/email.worker.ts`
- `backend/prisma/schema.prisma`
- `frontend/src/components/`

State that no cron job or polling loop is responsible for sending email; BullMQ delayed jobs are the scheduler.

## Submission checklist

- [ ] Private GitHub repository created
- [ ] `Mitrajit` added as collaborator
- [ ] `Yadav036` added as collaborator
- [ ] README included and reviewed
- [ ] Google OAuth credentials configured for the demo environment
- [ ] Ethereal sender accounts configured
- [ ] PostgreSQL and Redis running
- [ ] Backend + BullMQ worker started
- [ ] Frontend started
- [ ] Demo video recorded, maximum 5 minutes
- [ ] Video link included in the submission form
- [ ] GitHub repository link included in the submission form
- [ ] Any assumptions/trade-offs mentioned in the README

### Form submission fields

Use the final private GitHub repository URL and the demo-video URL in the ClickUp submission form. The assignment form is:

`https://forms.clickup.com/9005062261/f/8cbwp3n-8876/6NNNJ92DV93PQTAYST`
