# Admin VPS metrics (eVPS API)

The **Server Metrics** panel on the Admin → Terminal page shows live data from your eVPS.net account when configured.

## How it works

- **API route:** `GET /api/admin/vps-info` (superadmin only, session cookie).
- **Backend** calls [eVPS API](https://www.evps.net/api/doc/) with your credentials and returns normalized CPU, RAM, disk, bandwidth, uptime, and VM status.
- **Terminal page** polls this route every 60 seconds when connected and displays the values in the right panel.

## Environment variables (Vercel / server)

Set these in your project (e.g. Vercel → Settings → Environment Variables). **Never commit real values.**

| Variable        | Required | Description |
|-----------------|----------|-------------|
| `EVPS_API_USER` | Yes      | Your eVPS.net login username |
| `EVPS_API_KEY`  | Yes      | API key from eVPS Profile → API KEY |
| `EVPS_VPS_ID`   | No       | VPS ID (e.g. `131387`). If unset, the first VPS in the account is used. |

## Auth

- Only users with **superadmin** role can open the Terminal page and see the metrics.
- The API key is used only on the server; it is never sent to the browser.
