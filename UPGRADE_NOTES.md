## What this is

This folder (`expense-report-v2`) is a **separate copy** of the original project (`/home/user_hilman/projects/expense-report`) intended for upgrades/experiments without impacting the original.

## What was changed to keep it separate

- **No nested git repo**: the copied `.git/` was removed so this folder can live inside the current workspace cleanly.
- **No bundled dependencies**: the copied `node_modules/` was removed (fresh install is done per-folder).
- **Expo identifiers updated** (to avoid clashes on device):
  - `app.json`:
    - `expo.slug`: `expense-report-v2`
    - `expo.name`: `expense-report-v2`
    - `android.package`: `com.hilman.expensereport.v2`
  - `package.json`:
    - `name`: `expense-report-v2`

## How to run (v2 only)

```bash
cd /home/user_hilman/projects/balance-report/expense-report-v2
npm install
npm run start
```

## Notes (important)

- **EAS build project**: `app.json` still contains `extra.eas.projectId` copied from the original. If you plan to use EAS builds for v2, you should create a new EAS project and replace that `projectId` so v2 stays fully independent.
