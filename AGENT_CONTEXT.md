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
| **Active project (use this)** | `/home/user_hilman/projects/balance-report/expense-report-v2` |
| Source project (do not edit while upgrading v2) | `/home/user_hilman/projects/expense-report` |
| Old project copy (backup, do not edit) | `/mnt/d/projects/expense-report` |

The project was migrated from `/mnt/d/` to `/home/user_hilman/projects/` for WSL2 native filesystem performance (9P bridge penalty eliminated).

---

## 3. Architecture

### Key Files
| File | Role |
|------|------|
| `App.tsx` | Navigation setup (Home + Entry stack) |
| `screens/HomeScreen.tsx` | Main table: month filter, IDR total, receipt indicator, PDF export |
| `screens/EntryScreen.tsx` | Add/edit form + camera capture + save/update/delete |
| `utils/db.ts` | Persistence router (`constants/dataBackend.ts`: `firebase` \| `sqlite`) |
| `utils/db.firebase.ts` | Firebase Realtime DB implementation |
| `utils/db.sqlite.ts` | On-device SQLite (native) + in-memory fallback (Expo Web) |
| `constants/dataBackend.ts` | `DATA_BACKEND` switch (default: `sqlite`) |
| `patches/expo+54.0.33.patch` | **patch-package:** (1) `async-require/hmr.ts` — early return when `window.location` is undefined on native. (2) `async-require/setup.ts` — web-only HMR requires. Fixes Expo Go dev crash: web HMR touched `window.location.protocol` while RN sets `window = global` without `location`. Unrelated to SQLite vs Firebase. |
| `utils/format.ts` | IDR and date formatters |
| `types/index.ts` | Expense type definition |
| `constants/firebase.ts` | Firebase config and initialization |

### Data Model
```typescript
type Expense = {
  id: string;
  date: string;           // YYYY-MM-DD
  person: string;         // free text, no fixed user list
  place: string;
  description: string;
  amount: number;         // IDR, integer
  receiptBase64: string | null;  // data:image/jpeg;base64,... or null
}
```

### Backend / persistence
- **Default: SQLite** (`DATA_BACKEND = 'sqlite'` in `constants/dataBackend.ts`) — `bukukas.db` on device; receipts as base64 text in DB row. **Expo Web** uses an in-memory store (not durable).
- **Optional: Firebase** — set `DATA_BACKEND` to `'firebase'` for the previous Realtime Database sync (`expenses/{YYYY-MM}/{id}`, `persons/`). Same `utils/db.ts` API.
- **No authentication** in either mode (internal-style app).

### Navigation
- 2 screens only: Home ↔ Entry (add/edit). No deeper nesting.

---

## 4. Decisions Already Made (Do Not Re-debate)

| Decision | Rationale |
|----------|-----------|
| Firebase Realtime DB (not Supabase, not SQLite) | Multi-device sync, minimal setup, free tier sufficient |
| No Firebase Storage | Spark plan restriction; base64 in DB is acceptable at this scale |
| Base64 receipts in DB | Avoids two-vendor split; cross-device visibility without object storage |
| Free text Person field | No user management overhead; anyone enters with any name |
| PDF export = text only | Simplicity; no image embedding needed |
| Expo Go (not bare workflow) | No custom native build required for current feature set |

---

## 5. Known Trade-offs

- Base64 in Realtime DB increases payload size per entry (~50–200KB per receipt)
- Acceptable for small team; move to Firebase Storage (Blaze plan) if scale increases
- Legacy entries created before base64 migration may have no receipt field

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
9. Migration utility for legacy entries without `receiptBase64`
10. Move to Firebase Storage (Blaze) if project scales

---

## 8. Firebase Project

- **Project ID:** `expense-report-aab42`
- **Realtime DB URL:** `https://expense-report-aab42-default-rtdb.asia-southeast1.firebasedatabase.app`
- **Region:** asia-southeast1 (Singapore)
- **Plan:** Spark (free) — Storage not available
