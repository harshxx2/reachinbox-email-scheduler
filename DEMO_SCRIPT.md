# ReachInbox Assignment — 5-Minute Demo Script

## 0:00–0:30 Login
- Open the frontend.
- Use Google Login.
- Show the logged-in dashboard header: name, email, avatar, logout.

## 0:30–1:30 Compose + Schedule
- Open Compose New Email.
- Enter subject/body.
- Upload a small CSV/TXT lead file.
- Show detected email count.
- Pick a future start time.
- Set delay = 2 seconds.
- Set hourly limit = 3.
- Schedule.

## 1:30–2:20 Scheduled/Sent
- Show Scheduled Emails.
- Wait for jobs to run.
- Show Sent Emails and sent status/time.
- Optionally open an Ethereal preview URL from the worker log.

## 2:20–3:40 Restart test
- Schedule a future batch.
- Stop the worker.
- Confirm future scheduled rows still exist.
- Restart the worker.
- Show the same delayed jobs executing after restart.

## 3:40–4:40 Rate limit
- Schedule 5–10 recipients with hourly limit = 2 or 3.
- Explain that jobs beyond the current quota are delayed to the next UTC-hour window rather than dropped.
- Point out the 2-second distributed send spacing.

## 4:40–5:00 Architecture
Show:
- `backend/src/services/queue.service.ts`
- `backend/src/services/rate-limit.service.ts`
- `backend/src/services/reconciliation.service.ts`
- `backend/src/workers/email.worker.ts`
- `backend/prisma/schema.prisma`
- `frontend/src/components/`

Say: "Scheduling is handled by BullMQ delayed jobs backed by Redis. PostgreSQL is the source of truth. Redis-backed quota and spacing work across multiple workers. No cron job is used."
