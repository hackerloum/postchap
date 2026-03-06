# How Scheduled Poster Generation Works

## Overview

**Scheduled generation** lets Pro and Business users automatically create **one new poster per day** at a time they choose (e.g. 8:00 AM in their timezone). The system runs a **cron job** once per day; it finds all users whose schedule is “due” and runs poster generation for each of them.

---

## 1. Who Can Use It

- **Free plan:** `scheduledGeneration: false` — schedule is **not available** (API returns 403 if they try to enable it).
- **Pro and Business:** `scheduledGeneration: true` — they can enable daily generation and set time/timezone/brand kit.

Defined in `lib/plans.ts` under each plan’s `limits.scheduledGeneration`.

---

## 2. User Settings (Schedule Config)

Stored **per user** in Firestore: `schedules/{uid}`.

| Field         | Meaning |
|---------------|--------|
| `enabled`     | Whether daily generation is on. |
| `time`        | Daily run time in user’s timezone, **HH:mm** (e.g. `"08:00"`). Only 30‑minute slots are allowed (see `lib/schedule/timeSlots.ts`). |
| `timezone`    | IANA timezone (e.g. `"Africa/Lagos"`, `"Africa/Nairobi"`). Used to compute the next run in UTC. |
| `brandKitId`  | Which brand kit to use for the auto-generated poster. Required when `enabled` is true. |
| `notifyEmail` | Send an email when the poster is generated (optional; not implemented in cron yet). |
| `notifySms`   | Send SMS when the poster is generated (optional; not implemented in cron yet). |
| `nextRunAt`   | Firestore Timestamp — next time this user’s schedule is “due”. Set by API when user saves; updated by cron after each run. |
| `lastRunAt`   | Firestore Timestamp — last time the cron actually ran generation for this user. |

- **GET /api/schedule** — returns the current user’s schedule (or defaults: `enabled: false`, `time: "08:00"`, `timezone: "Africa/Lagos"`).
- **PATCH /api/schedule** — updates schedule. If `enabled` is true, the API checks plan (`scheduledGeneration`), validates `brandKitId`, snaps `time` to an allowed 30‑min slot, and computes `nextRunAt` from `time` + `timezone` via `lib/schedule/nextRunAt.ts`, then writes to `schedules/{uid}`.

So: **the schedule “works” by the user turning it on, picking a time and timezone and brand kit; the API stores that and sets `nextRunAt`.**

---

## 3. When Does Generation Actually Run? (Cron)

- **Vercel Cron** calls: **GET /api/cron/scheduled-generation**
- **Schedule (in `vercel.json`):** `"0 0 * * *"` → **once per day at midnight UTC**.

So every day at 00:00 UTC the cron runs. It does **not** run at each user’s local time; it runs once globally, then decides **which users are due** by comparing the current time to each user’s `nextRunAt`.

---

## 4. What the Cron Job Does

1. **Auth**  
   Verifies `Authorization: Bearer <CRON_SECRET>` (must set `CRON_SECRET` in Vercel env, ≥ 16 chars).

2. **Find due schedules**  
   - Query: `schedules` where `enabled == true`.  
   - For each doc, get `nextRunAt` (as ms).  
   - If `nextRunAt <= now` (or missing), the schedule is **due**.

3. **Cap work**  
   Sorts due users by `nextRunAt` and takes at most **30** in one run (`MAX_SCHEDULES_PER_RUN`). The rest are “skipped” and will be picked on the next day’s cron run (their `nextRunAt` is still in the past).

4. **For each due user (up to 30):**  
   - Read `brandKitId` from the schedule doc. If missing, skip and log.  
   - Call `runGenerationForUser(uid, brandKitId, null)` — same as manual “generate one poster” but with no recommendation/template/inspiration; copy is generated from the brand kit.  
   - On **success:**  
     - Set `lastRunAt = now`  
     - Set `nextRunAt` = **next day at the same local time** (using `getNextRunAfter()` and the user’s `time` + `timezone`).  
   - On **error:**  
     - Still set `nextRunAt` to the next day so the user gets another try tomorrow (no infinite retry in the same run).

5. **Response**  
   Returns JSON: `ok`, `due`, `processed`, `skipped`, and a `results` array per processed user (success/error).

So: **schedule “runs” once per day at midnight UTC; only users whose `nextRunAt` is in the past get a poster; after each run, their `nextRunAt` is moved to the next day at their chosen time.**

---

## 5. How “Next Run” Time Is Chosen

- **When the user saves schedule (PATCH /api/schedule):**  
  `nextRunAt = getNextRunAt(time, timezone)`  
  - Converts “today at `time` in `timezone`” to UTC.  
  - If that moment is already in the past, uses “tomorrow at `time`” in that timezone.

- **After cron runs:**  
  `nextRunAt = getNextRunAfter(now, time, timezone)`  
  - “Next calendar day at the same `time`” in the user’s `timezone`, converted to UTC.

So a user in Lagos who picks 08:00 will have their poster generated on the next day when the cron runs **after** 08:00 Lagos time has passed (because that’s when their `nextRunAt` becomes ≤ cron run time). Since the cron runs at 00:00 UTC only once per day, the **effective** run for that user will be the first midnight UTC that is **after** their 08:00 Lagos. So they get one poster per day, with the “run” aligned to the next midnight UTC after their chosen local time.

---

## 6. User Flow (UI)

- **Dashboard → Schedule** (or similar) loads **GET /api/schedule** and the list of brand kits.
- User can:
  - Toggle **Daily generation** on/off.
  - Choose **time** (dropdown of 30‑min slots, e.g. 08:00, 08:30, …).
  - Choose **timezone** (e.g. Africa/Lagos, Africa/Nairobi).
  - Select **brand kit** (required when enabled).
  - Optionally enable **notify by email/SMS** (UI only for now).
- On **Save**, the app calls **PATCH /api/schedule** with the form state. The API updates `schedules/{uid}` and sets `nextRunAt`; the UI can show “Next run: …” from the response.

If the user’s plan doesn’t allow scheduling, the PATCH returns 403 with `code: "SCHEDULE_NOT_AVAILABLE"` and the frontend can show an upgrade prompt.

---

## 7. Summary

| What | How |
|------|-----|
| **Who** | Pro and Business only (`limits.scheduledGeneration`). |
| **Where** | Firestore `schedules/{uid}`; API `GET/PATCH /api/schedule`. |
| **When** | Vercel cron once per day at **00:00 UTC** (`0 0 * * *`). |
| **Which users run** | All with `enabled === true` and `nextRunAt <= now` (capped at 30 per run). |
| **What runs** | `runGenerationForUser(uid, brandKitId, null)` → one poster per user per run. |
| **After run** | `lastRunAt` and `nextRunAt` updated (next run = next day at same local time). |

So in one sentence: **the schedule is a daily cron at midnight UTC that, for each user who has enabled it and whose next run time has passed, generates one poster with their chosen brand kit and then sets the next run to the next day at their chosen time.**

---

## 8. Auto-post to Instagram

Users can turn on **Auto-post to Instagram** and set a **post time** (and timezone). After each scheduled generation, if this is enabled and Instagram is connected, the new poster is added to `scheduled_instagram_posts` with `scheduledFor` = the **next** occurrence of the post time.

### Post time behaviour (important for users)

- The poster is posted at the **next** occurrence of the time you choose.
- **If you set the same time for generation and post** (e.g. both 7:00 PM), the poster is created at ~7:00 PM, so the “next” 7:00 PM is **the next day**. The post will go out **tomorrow** at 7:00 PM, not a few minutes after generation.
- **To post the same day**, set **post time after generation time** (e.g. generate 7:00 PM, post 7:30 PM). Then the “next” 7:30 PM is still today and the post goes out ~30 minutes after the poster is created.

The Schedule UI shows this in a tip box under the post time picker so users don’t assume “same time” means “post right after generation”.
