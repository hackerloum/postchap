#!/usr/bin/env bash
# Trigger a single cron endpoint on the production app.
# Usage: trigger-cron.sh <scheduled-generation|scheduled-posts|occasion-alerts>
# Requires: .env.cron in project root with CRON_SECRET=... and optionally BASE_URL=...
# Crontab (UTC): scheduled-generation every 30 min so user times (e.g. 07:00 or 07:30) are respected
#   0,30 * * * * /var/www/postchap/scripts/trigger-cron.sh scheduled-generation >> /var/log/postchap-cron.log 2>&1
#   0 6 * * * /var/www/postchap/scripts/trigger-cron.sh occasion-alerts >> /var/log/postchap-cron.log 2>&1
#   0 8 * * * /var/www/postchap/scripts/trigger-cron.sh scheduled-posts >> /var/log/postchap-cron.log 2>&1

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env.cron"

VALID_ENDPOINTS="scheduled-generation scheduled-posts occasion-alerts"
ENDPOINT="${1:-}"

if [[ -z "$ENDPOINT" ]]; then
  echo "$(date -Iseconds) [trigger-cron] ERROR: Missing endpoint. Use one of: $VALID_ENDPOINTS"
  exit 1
fi

if [[ ! " $VALID_ENDPOINTS " =~ " $ENDPOINT " ]]; then
  echo "$(date -Iseconds) [trigger-cron] ERROR: Invalid endpoint '$ENDPOINT'. Use one of: $VALID_ENDPOINTS"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "$(date -Iseconds) [trigger-cron] ERROR: $ENV_FILE not found. Create it with CRON_SECRET=... and BASE_URL=..."
  exit 1
fi

# shellcheck source=/dev/null
source "$ENV_FILE"

if [[ -z "${CRON_SECRET:-}" ]] || [[ ${#CRON_SECRET} -lt 16 ]]; then
  echo "$(date -Iseconds) [trigger-cron] ERROR: CRON_SECRET missing or too short (min 16 chars) in $ENV_FILE"
  exit 1
fi

BASE_URL="${BASE_URL:-https://your-app.vercel.app}"
BASE_URL="${BASE_URL%/}"
URL="$BASE_URL/api/cron/$ENDPOINT"

echo "$(date -Iseconds) [trigger-cron] Calling $ENDPOINT ..."
HTTP_CODE=$(curl -sS -o /tmp/trigger-cron-response.txt -w "%{http_code}" \
  -H "Authorization: Bearer $CRON_SECRET" \
  "$URL")
CURL_EXIT=$?

if [[ $CURL_EXIT -ne 0 ]]; then
  echo "$(date -Iseconds) [trigger-cron] $ENDPOINT curl exit=$CURL_EXIT"
  exit $CURL_EXIT
fi

echo "$(date -Iseconds) [trigger-cron] $ENDPOINT HTTP $HTTP_CODE"
if [[ "$HTTP_CODE" -ge 400 ]]; then
  cat /tmp/trigger-cron-response.txt 2>/dev/null || true
  exit 1
fi

exit 0
