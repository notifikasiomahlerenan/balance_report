## Purpose

Capture decisions and follow-up ideas about **storage**, **sync**, and **monetization paths** for this app, based on our discussion.

---

## Current architecture (today)

- **Client**: Expo (React Native)
- **Backend**: **None in the cloud** — **SQLite on device** (`bukukas.db`); Expo Web uses an in-memory stub (not durable).
- **Receipts**: stored as **base64 text** in the local DB (`receiptBase64`)
- **Firebase**: **not included** in this app version (no SDK, no config, no dual backend switch).

### Historical note (older design)

Earlier iterations used Firebase Realtime Database (`expenses/{YYYY-MM}/{entryId}`, `persons/`). That path was removed from the codebase for this release to match a strict local-only / legal posture.

### Receipt storage method (important)

- The app captures/chooses an image and stores it as a **data URI** string:

```text
data:image/jpeg;base64,AAAA... (very long)
```

This is **not a pointer**; the image bytes are embedded (encoded as text).

---

## URI explained (simple)

URI = “address as text”. There are two meanings that matter:

### 1) Pointer URI (where data lives)

- `https://...` (internet)
- `file:///...` (device file)

The URI text stays short even if the image is big.

### 2) Data URI (data embedded in the string)

- `data:image/png;base64,...`

If the image is bigger, the **URI string gets longer**.

---

## Spark plan limits: why they matter

Firebase Spark (free tier) is limited by:

- **Stored data** (e.g., “1 GB stored”)
- **Monthly bandwidth** (e.g., “10 GB downloaded per month”)
- **Connections** (e.g., “100 simultaneous connections”)

Why receipts matter:

- Base64 expands size by about **~33%** vs raw bytes.
- A month view that includes receipts can become heavy on first load.

---

## “Erase” feature: does it help?

Yes, deleting old data can help with:

- **Storage limit** (stored GB)
- Potentially **bandwidth**, if users stop loading old months

But bandwidth can still be a problem even under 1 GB stored if devices frequently reload heavy months.

### Practical erase options (safe UX)

- **Remove receipt only** (keep entry row; set `receiptBase64 = null`)
- **Delete a month** (delete `expenses/{monthKey}`)
- **Delete entries older than N months**
- Always pair erase with **export/backup** (PDF is good for reports; JSON is better for backup/restore)

---

## Turn-key product goal (no server)

Your “turn-key” idea means:

- buyer installs the app
- app “just works”
- data is local and owned by the buyer
- no backend to maintain

### Best fit for that: local-first database

- **SQLite on-device** as the primary database
- Export/import for backup and device migration

This keeps the “1-file simplicity” where SQLite is strongest: **local, single-user, offline**.

---

## Can CSV be used for sync (no server)?

### CSV can store base64

Yes, base64 is text, so CSV can store it.

But it’s usually painful because:

- CSV becomes huge if receipts are included
- spreadsheet tools become slow/unusable
- you must handle quoting and ensure base64 has **no line breaks**

### CSV is great for reporting, not great for merging

CSV is a “table snapshot”. Snapshots are hard to merge safely when two devices edit at the same time.

### Better “no server sync-ish” pattern: append-only event log

If you want something closer to “near real-time” without a server, a better approach than full CSV snapshots is:

- write **append-only events** (add/edit/delete) to a shared file
- devices periodically pull/apply events into local SQLite

But you still need:

- conflict rules (two edits on same entry)
- stable IDs
- shared file transport (Drive/OneDrive/WhatsApp/etc.)

### Receipts in “no server sync”

Receipts are the hard part:

- CSV/event log should store a **receipt reference** (filename/hash), not the image content
- receipts stored as separate files (shared folder or export bundle)

---

## Monetization-friendly paths (future)

Monetization usually requires:

- **Auth** (user/team)
- **Multi-tenant model** (company/team separation)
- **Access control**
- **Billing hooks**
- Receipts as **files**, DB stores **URLs**, not base64

### Practical upgrade paths

1) **Keep Firebase for entries**, move receipts to real file storage, store only a URL.
2) **Supabase (Postgres + Storage + Auth)** for a “managed modern” backend.
3) **VPS + Postgres** if you want full control (more ops).

SQLite on a VPS can work at tiny scale, but it tends to be a dead-end once you need concurrency + reliability + multi-tenant.

---

## Suggested next “decision points”

- **Do we want the app to be single-device by default** (turn-key), with optional paid “team sync” later?
- If team sync is needed, do we prefer:
  - managed backend (Supabase/Firebase)
  - or self-hosted (VPS)
- For receipts long-term: do we want to keep base64 in DB, or move to file storage + URL?

---

## Before submitting to Google Play (AdMob path) — checklist

- **Privacy Policy URL exists and is public**
  - Stored in Play Console and linked inside the app
- **Support/contact method works**
  - Email address monitored
- **AdMob setup**
  - App created in AdMob
  - Banner ad unit created
  - Test ads validated (no policy violations; no self-clicking production ads)
- **Consent/privacy (if applicable)**
  - Google UMP integrated (when you turn on ads)
  - “Manage privacy / consent” entry point reachable in Settings
- **App Store listing basics**
  - App name, short description, screenshots, icon, feature graphic
  - Data safety form completed accurately (match **actual** stack: local DB vs cloud, receipts, ads)

---

## Reminder — if you ship **Firebase** again later

Update **both** the in-app policy (`screens/PrivacyPolicyScreen.tsx`) and any **public policy URL** to describe, at minimum:

- That data is stored/processed on **Google Firebase** (which products: Realtime Database, Storage, Auth, etc.).
- Whether **receipt images** are stored in the cloud and in what form (e.g. base64 in DB vs file URLs).
- **Sync** behavior (multi-device, who can read data) and **retention/deletion**.
- Re-check **Google Play Data safety** and **AdMob** disclosures so they match the new backend.

Until then, keep the policy aligned with **local-only** (SQLite / on-device) as now.

**Code:** persistence is `utils/db.ts` → `utils/db.sqlite.ts` only. Native: `expo-sqlite` (`bukukas.db`). Web: in-memory.

