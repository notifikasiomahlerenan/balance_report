# AGENT_CONTEXT.md
> Read this first. Stable ground truth for all agent sessions on this project.
> Last updated: April 2026

---

## 1. Project Identity

- **App name:** expense-report-v2
- **Purpose:** Internal mobile app for expense tracking — multi-user entry, monthly table, optional receipt photo, PDF export
- **Platform:** Expo (React Native), Android primary, tested via Expo Go
- **Language:** TypeScript

---

## 2. File Locations

| What | Path |
|------|------|
| **Active project (use this)** | `/home/user_hilman/projects/balance-report` (repo root) |
| Source project (do not edit while upgrading v2) | `/home/user_hilman/projects/expense-report` |
| Old project copy (backup, do not edit) | `/mnt/d/projects/expense-report` |

The project was migrated from `/mnt/d/` to `/home/user_hilman/projects/` for WSL2 native filesystem performance (9P bridge penalty eliminated).

### Git branches

| Branch | Purpose |
|--------|---------|
| `master` | **SQLite-only** — shippable, zero Firebase code. Privacy-safe for Play Store. |
| `firebase-backend` | Preserves dual-backend work (SQLite + Firebase RTDB). Use as starting point when building the cloud-sync product variant. |

---

## 3. Architecture

### Key Files
| File | Role |
|------|------|
| `App.tsx` | Navigation setup (Home + Entry stack) |
| `screens/HomeScreen.tsx` | Main table: month filter, IDR total, receipt indicator, PDF export |
| `screens/EntryScreen.tsx` | Add/edit form + camera capture + save/update/delete |
| `utils/db.ts` | Re-exports persistence API from `utils/db.sqlite.ts` |
| `utils/db.sqlite.ts` | On-device SQLite (native) + in-memory fallback (Expo Web) |
| `patches/expo+54.0.33.patch` | **patch-package:** (1) `async-require/hmr.ts` — early return when `window.location` is undefined on native. (2) `async-require/setup.ts` — web-only HMR requires. Fixes Expo Go dev crash: web HMR touched `window.location.protocol` while RN sets `window = global` without `location`. |
| `utils/format.ts` | IDR and date formatters |
| `types/index.ts` | Expense type definition |

### Data Model
```typescript
type Expense = {
  id: string;
  date: string;           // YYYY-MM-DD
  person: string;         // reporter name
  description: string;
  credit: number;
  debit: number;
  receiptBase64: string | null;  // data:image/jpeg;base64,... or null
  createdAt: number;
  updatedAt: number;
};
```

### Backend / persistence
- **SQLite only (this release):** `bukukas.db` on device; receipts as base64 text in DB row. **No cloud sync, no Firebase SDK or config in the app bundle.**
- **Expo Web** uses an in-memory store (not durable).
- **No authentication** (internal-style app).

### Navigation
- 2 screens only: Home ↔ Entry (add/edit). No deeper nesting.

---

## 4. Decisions Already Made (Do Not Re-debate)

| Decision | Rationale |
|----------|-----------|
| Local SQLite (expo-sqlite) | Data stays on device; aligns with privacy policy and Play listing |
| Base64 receipts in SQLite row | Avoids separate file sync; acceptable at small scale |
| Free text Person field | No user management overhead; anyone enters with any name |
| PDF export = text only | Simplicity; no image embedding needed |
| Expo Go (not bare workflow) | No custom native build required for current feature set |

---

## 5. Known Trade-offs

- Base64 in DB increases row size per entry (~50–200KB per receipt); acceptable for small volume
- In-memory web store is not durable across refreshes

---

## 6. Environment

| Item | Detail |
|------|--------|
| Machine | ThinkPad T14 Gen 3 AMD |
| OS | Windows 11 + WSL2 (Ubuntu) |
| Shell | bash in WSL2 |
| Node | via nvm inside WSL2 |
| IDE | Cursor on Windows, connected to WSL2 via Remote-WSL |
| Antivirus | Bitdefender — may need exclusions for wsl.exe, node.exe, .vhdx |

---

## 7. Suggested Next Steps (Backlog)

1. Create `AGENT_CONTEXT.md` — **done (this file)**
2. Apply `.wslconfig` memory/CPU tuning (`C:\Users\USER\.wslconfig`)
3. Set inotify limit: `echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p`
4. Add Bitdefender exclusions for WSL processes and `.vhdx`
5. Set `EXPO_USE_FAST_RESOLVER=1` in `~/.bashrc` or `~/.profile`
6. Add image compression/resizing before base64 encoding (reduce DB payload)
7. Add max image payload validation
8. JSON import/export for offline backup

---

## 8. Cloud / third-party (this release)

- **No Firebase or other remote database** shipped in the app. Third-party processing called out in the in-app privacy text is mainly **Google AdMob** when ads are enabled.

---

## 9. Branch switching — agent prompts

Two product variants exist as separate branches. **Never mix Firebase code into master.** Each branch ships as a distinct binary with its own privacy policy and Play Store listing.

### Switch to Firebase backend (for development/testing)

> **Prompt to paste into a new agent chat:**
>
> I need to work on the Firebase cloud-sync variant of this app.
>
> 1. Read `AGENT_CONTEXT.md` first.
> 2. Run `git stash` if there are uncommitted changes, then `git checkout firebase-backend`.
> 3. Run `npm install` (this branch requires the `firebase` package).
> 4. Confirm: `constants/firebase.ts`, `constants/dataBackend.ts`, and `utils/db.firebase.ts` all exist.
> 5. The backend switch is in `constants/dataBackend.ts` — set `DATA_BACKEND` to `'firebase'` to use Firebase RTDB, or `'sqlite'` for local.
>
> **IMPORTANT:** Any commits on this branch must NOT be merged into `master`. The `master` branch is the SQLite-only, privacy-safe product. Firebase code in master is a legal liability.
>
> When done, run `git checkout master && npm install` to return to the clean SQLite build.

### Switch back to SQLite-only (shippable product)

> **Prompt to paste into a new agent chat:**
>
> Switch back to the SQLite-only shippable version.
>
> 1. Read `AGENT_CONTEXT.md` first.
> 2. Run `git checkout master`.
> 3. Run `npm install` to ensure no Firebase packages are in `node_modules`.
> 4. Verify: `constants/firebase.ts`, `constants/dataBackend.ts`, and `utils/db.firebase.ts` must NOT exist. If any of these files exist, something is wrong — stop and report.
> 5. Verify: `package.json` must NOT list `firebase` in dependencies.
>
> This branch is the Play Store build. The privacy policy says all data stays on device. The binary must match that claim — zero Firebase SDK, config, or cloud code.

### Guard rail for any agent working on `master`

> **Add to any prompt when working on master:**
>
> You are on the `master` branch. This is the SQLite-only, local-data-only product.
> **Do NOT add firebase, @firebase/*, or any cloud database dependency.**
> **Do NOT create files that import from firebase or connect to remote databases.**
> **Do NOT add any code that transmits user transaction data off-device.**
> The in-app privacy policy promises data stays on the phone. Violating this is a legal and regulatory risk.
