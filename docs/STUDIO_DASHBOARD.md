# ArtMaster Studio — Dashboard Overview & Flows

This document describes how the Studio dashboard looks and all user flows for agencies and designers.

---

## 1. Layout & Navigation

### 1.1 Global layout

- **Background:** `bg-bg-base` (dark).
- **Header:** Sticky top bar with:
  - ArtMaster logo + “STUDIO” badge.
  - **Desktop:** Top nav links (Overview, Clients, Generate, Posters, Usage, Team, Settings).
  - **Plan badge:** e.g. “STARTER STUDIO” / “PRO STUDIO” / “AGENCY STUDIO”.
  - **“My Brand”:** Link to main ArtMaster dashboard (`/dashboard`).
  - **Avatar:** Click opens dropdown → Studio settings, Switch to My Brand, Sign out (redirects to `/studio/login`).
- **Main content:** Full-width area below header; bottom padding on mobile for the bottom nav.
- **Mobile:** Bottom tab bar with Home, Clients, Generate, Posters, and **More** (opens sheet: Usage, Team, Settings, Upgrade, My Brand, Sign out).

### 1.2 Routes that bypass layout

These routes render **without** the Studio nav and without requiring an agency:

- `/studio/login` — Studio sign-in.
- `/studio/signup` — Studio sign-up.
- `/studio/onboarding` — Create agency (first-time).
- `/studio/join` — Accept team invite (token in URL).
- `/studio/portal/[clientId]` — Client portal (token in URL).

All other `/studio/*` routes require:

1. Valid session → else redirect to `/studio/login`.
2. User has an agency (owner or active team member) → else redirect to `/studio/onboarding`.

---

## 2. Screen-by-Screen

### 2.1 Overview (`/studio`)

**Purpose:** Home dashboard after login.

**Layout:**

- **Header row**
  - Title: “Studio” + subtitle “Manage clients, generate posters, track approvals.”
  - Buttons: “Add client” (secondary), “Generate” (primary, info color).
- **Stats grid (4 cards)**
  - Active clients (count).
  - Posters this month (e.g. “12” with “of 100” if limited).
  - Est. AI cost this month (e.g. “$0.66”).
  - Plan name (Starter / Pro / Agency) + “Upgrade →” link to `/studio/billing`.
- **Usage bar**
  - “Poster quota” with progress bar (info / warning / error by %).
  - If ≥80% used, warning text + link to upgrade.
- **Two columns (or stacked on small screens)**
  - **Active clients**
    - List of up to 6 clients: name, industry, posters this month / monthly quota.
    - “View all →” to `/studio/clients`.
    - Empty state: “No clients yet” + “Add client” CTA.
  - **Upcoming occasions**
    - Up to 5 alerts: occasion title, client name, “Today” / “Xd” badge, “Generate poster →” link to create with client + occasion pre-filled.
    - “View all →” to `/studio/occasions`.
    - Empty: “No upcoming occasions in the next 7 days.”

**Data:** `GET /api/studio/clients?status=active`, `GET /api/studio/usage`, `GET /api/studio/occasions?days=7`.

---

### 2.2 Clients list (`/studio/clients`)

**Purpose:** List and filter all agency clients.

- **Header:** “Clients” + actions (e.g. Add client, filters if present).
- **List:** Cards or rows per client: name, contact, industry, status, poster usage, link to client detail.
- **Filters:** e.g. by status (active / archived).
- **Empty state:** CTA to add first client → `/studio/clients/new`.

**Flow:** List → click client → `/studio/clients/[clientId]`.

---

### 2.3 New client (`/studio/clients/new`)

**Purpose:** Add a client to the agency.

- Form: client name, contact (email, phone), industry, location, status, monthly poster quota, tags, notes.
- Submit → `POST /api/studio/clients` → redirect to client detail or list.

**Permission:** Owner or Manager (else 403).

---

### 2.4 Client detail (`/studio/clients/[clientId]`)

**Purpose:** Single client overview.

- **Header:** Client name + actions (Edit, etc.).
- **Stats:** Posters this month, quota, maybe approval rate.
- **Sections:**
  - Brand kits (list + “Add brand kit” → `/studio/clients/[clientId]/brand-kits/new`).
  - Recent posters (thumbnails + link to full posters list filtered by client).
  - Internal notes.
- **Links:** Edit client → `/studio/clients/[clientId]/edit`.

---

### 2.5 Edit client (`/studio/clients/[clientId]/edit`)

**Purpose:** Edit client details and portal access.

- Form: same fields as new client + portal toggle, portal brand name, generate/copy portal link.
- Submit → `PATCH /api/studio/clients/[clientId]`.

---

### 2.6 New brand kit (`/studio/clients/[clientId]/brand-kits/new`)

**Purpose:** Add a brand kit for this client.

- Uses shared **BrandKitWizard** in Studio mode (submit to Studio API).
- Submit → `POST /api/studio/clients/[clientId]/brand-kits` → redirect to client detail or kit edit.

---

### 2.7 Edit brand kit (`/studio/clients/[clientId]/brand-kits/[kitId]/edit`)

**Purpose:** Edit existing client brand kit.

- Same wizard, pre-filled; submit → `PATCH /api/studio/clients/[clientId]/brand-kits/[kitId]`.

---

### 2.8 Create poster (`/studio/create`)

**Purpose:** Generate one poster for a client.

- **Steps:** Select client → select brand kit (for that client) → select format (e.g. Instagram square) → select occasion (or freeform).
- **Submit:** `POST /api/studio/generate` with `clientId`, `brandKitId`, `platformFormatId`, `occasion` (optional).
- **Result:** New poster created under `studio_agencies/{agencyId}/clients/{clientId}/posters`; poster usage incremented; user sees success and can open poster or go to list.

**Permission:** Designer role or above; quota enforced (agency monthly limit).

---

### 2.9 Posters list (`/studio/posters`)

**Purpose:** View and manage all agency posters.

- **Filters:** By client, by approval status (pending / approved / revision_requested).
- **List:** Thumbnail, client name, headline, status, date; click → detail or modal.
- **Actions:** Approve, Request revision (with comment); updates via `PATCH /api/studio/posters/[posterId]` (approval status + history).

---

### 2.10 Usage (`/studio/usage`)

**Purpose:** Agency and per-client usage and cost.

- **Agency:** Plan, posters used this month, limit, % used, estimated AI cost.
- **Per client:** Table or cards with client name, posters this month, quota, estimated cost.
- **Links:** Upgrade → `/studio/billing`.

**Data:** `GET /api/studio/usage`.

---

### 2.11 Team (`/studio/team`)

**Purpose:** Manage team members and invites.

- **List:** Current members with role, email, assigned clients (if applicable).
- **Actions:** Invite (email + role) → `POST /api/studio/team` (sends invite link `/studio/join?token=...`); Edit role / assigned clients → `PATCH /api/studio/team/[memberId]`; Remove → `DELETE /api/studio/team/[memberId]`.
- **Roles:** Owner, Manager, Designer, Reviewer, Intern (ranked; owner can remove others, not self).

**Permission:** Manager+ to invite/edit; only Owner can remove members.

---

### 2.12 Occasions (`/studio/occasions`)

**Purpose:** Upcoming occasions for all clients or one client.

- **Optional filter:** `?clientId=...`.
- **List:** Occasion name, client, type (global / client-specific), days until, date; “Generate poster →” deep link to create with that client + occasion.

**Data:** `GET /api/studio/occasions?days=14&clientId=...`.

---

### 2.13 Settings (`/studio/settings`)

**Purpose:** Agency and portal branding.

- **Agency:** Agency/studio name; plan name + **Upgrade** link → `/studio/billing`.
- **Client portal branding (Agency plan):** Portal brand name, logo URL, accent color, hide “Powered by ArtMaster”, custom subdomain.
- Submit → `PATCH /api/studio/agency`.

**Permission:** Owner for billing-sensitive; agency name/portal settings as per product rules.

---

### 2.14 Billing (`/studio/billing`)

**Purpose:** View plan and upgrade.

- **Current plan:** e.g. Starter $29/mo.
- **Cards:** Starter, Pro, Agency with features and “Upgrade to X” (links to `/studio/billing#upgrade` so user stays in Studio).
- No redirect to main site login; all links stay under `/studio`.

---

### 2.15 Onboarding (`/studio/onboarding`)

**Purpose:** First-time agency creation (no nav).

- Form: Agency name, maybe plan (default Starter).
- Submit → `POST /api/studio/agency` (creates `studio_agencies` doc + owner in `team` + `studio_user_agency` lookup) → redirect to `/studio`.

---

### 2.16 Join (`/studio/join`)

**Purpose:** Accept team invite (no nav).

- URL: `/studio/join?token=...`.
- **GET** validates token via invite lookup; shows agency name, inviter, role.
- User signs in (or is already signed in); **Accept** → `POST /api/studio/invites` (adds user to team, sets `studio_user_agency`) → redirect to `/studio`.

---

### 2.17 Client portal (`/studio/portal/[clientId]`)

**Purpose:** Client-facing view (no Studio nav).

- Access: URL with token (e.g. `?token=...` or header). No Studio login.
- **Layout:** Minimal; can use agency white-label (name, logo, accent) if Agency plan.
- **Content:** List of that client’s posters; actions: Approve, Request revision (with comment).
- **APIs:** `GET /api/studio/portal/posters`, `PATCH /api/studio/portal/posters/[posterId]` (with portal token auth).

---

### 2.18 Studio login (`/studio/login`)

**Purpose:** Sign in to Studio only.

- Email/password + Google; after session creation redirect to `/studio` (layout then sends to onboarding if no agency).
- Links: “Sign up for Studio” → `/studio/signup`, “Forgot password?” → `/reset-password`.

---

### 2.19 Studio signup (`/studio/signup`)

**Purpose:** Create a Studio account (separate from main ArtMaster signup).

- Name, email, password (+ strength), Google; after session redirect to `/studio` → onboarding if no agency.
- Links: “Sign in” → `/studio/login`.

---

## 3. Flows (Summary)

### 3.1 Auth & entry

| Flow | Steps |
|------|--------|
| **First-time Studio signup** | Landing “Sign up for Studio” → `/studio/signup` → create account → redirect `/studio` → no agency → redirect `/studio/onboarding` → create agency → redirect `/studio` (Overview). |
| **Returning Studio login** | `/studio/login` → sign in → redirect `/studio` → has agency → Overview. |
| **Open Studio (logged out)** | Any `/studio/*` (except bypass) → no session → redirect `/studio/login`. |
| **Open Studio (logged in, no agency)** | `/studio` → layout sees no agency → redirect `/studio/onboarding`. |
| **Sign out from Studio** | Nav “Sign out” → `/api/auth/logout?returnTo=/studio/login` → cookie cleared → redirect `/studio/login`. |

### 3.2 Client & brand kit

| Flow | Steps |
|------|--------|
| **Add client** | Overview or Clients → “Add client” → `/studio/clients/new` → submit → client created → detail or list. |
| **Add brand kit** | Client detail → “Add brand kit” → `/studio/clients/[clientId]/brand-kits/new` → wizard → submit → kit created. |
| **Edit client** | Client detail → Edit → `/studio/clients/[clientId]/edit` → save. |
| **Edit brand kit** | Client detail → kit → Edit → `/studio/clients/[clientId]/brand-kits/[kitId]/edit` → save. |

### 3.3 Generate & approve

| Flow | Steps |
|------|--------|
| **Generate one poster** | Overview “Generate” or nav “Generate” → `/studio/create` → choose client, kit, format, occasion → submit → poster created; quota incremented. |
| **Approve / request revision (agency)** | Posters list → select poster → Approve or Request revision (comment) → `PATCH /api/studio/posters/[posterId]`. |
| **Client approves (portal)** | Client opens portal link with token → `/studio/portal/[clientId]` → list posters → Approve or Request revision → `PATCH /api/studio/portal/posters/[posterId]`. |

### 3.4 Team

| Flow | Steps |
|------|--------|
| **Invite member** | Team → Invite → email + role → invite created; copy link `/studio/join?token=...`. |
| **Accept invite** | Open link → `/studio/join` → sign in if needed → Accept → added to team → redirect `/studio`. |
| **Change role / assigned clients** | Team → member → Edit → PATCH. |
| **Remove member** | Team → member → Remove (Owner only). |

### 3.5 Upgrade & settings

| Flow | Steps |
|------|--------|
| **Upgrade plan** | Settings “Upgrade” or Billing “Upgrade to X” → `/studio/billing` (stays in Studio; no redirect to main login). |
| **Save agency/portal settings** | Settings → edit name, portal branding (if Agency plan) → Save → PATCH agency. |
| **Enable client portal** | Edit client → enable portal, generate/copy link → client uses link with token. |

---

## 4. Roles & Permissions (Reference)

| Role | Generate | Manage clients | Manage team | Approve posters | Billing / owner-only |
|------|----------|----------------|--------------|------------------|----------------------|
| Owner | ✓ | ✓ | ✓ | ✓ | ✓ (only owner) |
| Manager | ✓ | ✓ | ✓ (invite/edit) | ✓ | — |
| Designer | ✓ | Assigned only | — | — | — |
| Reviewer | — | Assigned only | — | ✓ | — |
| Intern | — | Assigned only | — | — | — |

---

## 5. Data & APIs (Reference)

- **Agency:** `GET/POST/PATCH /api/studio/agency`
- **Clients:** `GET/POST /api/studio/clients`, `GET/PATCH/DELETE /api/studio/clients/[clientId]`
- **Brand kits:** `GET/POST /api/studio/clients/[clientId]/brand-kits`, `GET/PATCH/DELETE .../brand-kits/[kitId]`
- **Generate:** `POST /api/studio/generate`; bulk: `POST /api/studio/generate/bulk`
- **Posters:** `GET /api/studio/posters`, `GET/PATCH /api/studio/posters/[posterId]`
- **Usage:** `GET /api/studio/usage`
- **Team:** `GET/POST /api/studio/team`, `PATCH/DELETE /api/studio/team/[memberId]`
- **Invites:** `GET/POST /api/studio/invites` (validate token, accept)
- **Occasions:** `GET /api/studio/occasions`
- **Portal:** `GET /api/studio/portal/posters`, `PATCH /api/studio/portal/posters/[posterId]`
- **Reports:** `GET /api/studio/clients/[clientId]/report`
- **Publish:** `POST /api/studio/clients/[clientId]/publish` (Pro/Agency)
- **Referrals:** `POST /api/studio/referrals`

---

## 6. Plan limits (Reference)

| Plan | Clients | Posters/mo | Team | Portal | White-label |
|------|---------|------------|------|--------|-------------|
| Starter | 5 | 100 | 1 | ✓ | — |
| Pro | 20 | 500 | 5 | ✓ | — |
| Agency | Unlimited | Unlimited | Unlimited | ✓ | ✓ |

Quota is enforced on `POST /api/studio/generate`; exceeding returns 429.

---

*Last updated to match the current Studio dashboard and flows in the codebase.*
