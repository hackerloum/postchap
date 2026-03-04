# VPS Panel (eVPS.net)

Personal panel for your eVPS.net VPS: list servers, power actions, backups, VNC.

## Setup

1. Copy env and set your eVPS API credentials (from [eVPS Profile](https://www.evps.net) → API KEY):

   ```bash
   cp .env.example .env.local
   # Edit .env.local: EVPS_API_USER=your_username  EVPS_API_KEY=your_key
   ```

2. Install and run:

   ```bash
   npm install
   npm run dev
   ```

   Panel runs at **http://localhost:3001**.

## Deploy

- Run on your VPS: `npm run build && npm run start` (port 3001), or use a process manager (pm2/systemd).
- Put behind nginx with HTTPS; optionally add HTTP basic auth so only you can access it.

## API used

- [eVPS.net API doc](https://www.evps.net/api/doc/) — auth via headers `X_API_USER` and `X_API_KEY`.
