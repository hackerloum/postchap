# Cron Jobs from the VPS

Cron jobs are **not** run by Vercel. The VPS triggers the same API routes at fixed times by calling your production URL with `CRON_SECRET`. The logic (Firebase, generation, Instagram) still runs on Vercel; only the scheduler runs on the VPS.

## Schedules (UTC)

| Schedule | Endpoint                | Purpose                          |
|----------|-------------------------|----------------------------------|
| Every 30 min (0,30 * * * *) | scheduled-generation | Poster generation; runs at :00 and :30 so user-chosen times (e.g. 07:00 or 07:30) are respected |
| 06:00 daily | occasion-alerts         | Upcoming occasions (future: email)    |
| Every 30 min (0,30 * * * *) | scheduled-posts         | Post due Instagram scheduled posts; runs every 30 min so user-chosen post times are respected |

## One-time setup on the VPS

### 1. Create `.env.cron` in the project root

On the VPS, in `/var/www/postchap/` (or your repo path), create a file named `.env.cron`:

```bash
nano .env.cron
```

Add (use your real values; do not commit this file):

```env
CRON_SECRET=your-same-secret-as-on-vercel-min-16-chars
BASE_URL=https://your-production-domain.com
```

- **CRON_SECRET** — Same value as in Vercel (Project → Settings → Environment Variables). At least 16 characters.
- **BASE_URL** — Your production app URL (e.g. `https://your-app.vercel.app` or your custom domain). No trailing slash.

Save and exit. Ensure the file is not in git (`.env.cron` is in `.gitignore`).

### 2. Make the script executable

```bash
chmod +x /var/www/postchap/scripts/trigger-cron.sh
```

### 3. Create the log file

```bash
touch /var/log/postchap-cron.log
```

### 4. Add crontab entries

```bash
crontab -e
```

Add these three lines (adjust the path if your repo is not at `/var/www/postchap`):

```cron
0,30 * * * * /var/www/postchap/scripts/trigger-cron.sh scheduled-generation >> /var/log/postchap-cron.log 2>&1
0 6 * * * /var/www/postchap/scripts/trigger-cron.sh occasion-alerts >> /var/log/postchap-cron.log 2>&1
0,30 * * * * /var/www/postchap/scripts/trigger-cron.sh scheduled-posts >> /var/log/postchap-cron.log 2>&1
```

- **scheduled-generation** and **scheduled-posts** run **every 30 minutes** (at :00 and :30) so user-chosen generate/post times are picked up within ~30 minutes.
- **occasion-alerts** runs once per day at 06:00 UTC.

## Logs

- **Cron output:** `/var/log/postchap-cron.log`
- View recent: `tail -100 /var/log/postchap-cron.log`

## Vercel

- **CRON_SECRET** must be set in Vercel (same value as in `.env.cron` on the VPS).
- The `crons` block has been removed from `vercel.json` so only the VPS triggers these endpoints; the API routes remain and are invoked by the script.
