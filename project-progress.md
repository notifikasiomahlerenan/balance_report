# Expense Report App - Project Progress

## Current Status

- Platform: Expo (React Native), tested via Expo Go on Android.
- Core flow works: create, edit, delete expense entries.
- Main table works: month navigation, clear receipt indicator, total amount in IDR.
- PDF export works (text-only report for selected month).
- Data backend works for text entries: Firebase Realtime Database.
- Receipt flow now works without Firebase Storage:
  - Receipt image is captured on phone camera.
  - Stored as `data:image/jpeg;base64,...` string in Firebase Realtime Database.
  - Visible across devices because image data is embedded in each entry.

## Implemented Architecture

- UI:
  - `Home` screen: table + total + month filter + PDF button.
  - `Entry` screen: add/edit form + optional camera receipt.
- Data model:
  - `types/index.ts` uses `receiptBase64: string | null`.
- Backend:
  - Firebase Realtime DB for all data (`expenses/{YYYY-MM}/{id}` and `persons`).
  - No Firebase Storage dependency.

## Key Files

- `App.tsx` - navigation setup (Home + Entry).
- `screens/HomeScreen.tsx` - main table, total, month switch, receipt preview, PDF export.
- `screens/EntryScreen.tsx` - form input + camera capture + save/update/delete.
- `utils/db.ts` - Firebase Realtime DB CRUD helpers.
- `types/index.ts` - expense type including `receiptBase64`.

## Main Bug Journey (Receipt Errors)

### Problem observed

- Repeated runtime photo errors around base64 handling, including:
  - `storage/unknown` (when Firebase Storage was still in path).
  - `Cannot read property 'base64' of undefined`.
  - `Cannot read property 'Base64' of undefined`.

### Final working fix

- Removed dependence on Firebase Storage (Spark limitation for this project setup).
- In `EntryScreen`:
  - First attempt uses `asset.base64` from `expo-image-picker`.
  - Fallback converts `asset.uri` to data URI using `fetch -> blob -> FileReader.readAsDataURL`.
- Avoided unstable runtime path relying on `FileSystem.EncodingType.Base64`.

## Lessons Learned

1. **Expo Go runtime differences matter.**
   - API behaviors can differ by SDK/runtime version.
   - Defensive coding around optional fields (`result.assets?.[0]`, `asset.base64`) is essential.

2. **One-vendor architecture reduces failure surface.**
   - For this project stage, Firebase Realtime DB alone is simpler than split storage.

3. **Fallback strategy is critical for camera payloads.**
   - `base64: true` may still return missing base64 in some environments.
   - A URI-to-dataURI fallback makes the flow more robust.

4. **Cache/reload confusion can mask real code state.**
   - Full reload / cache clear is often needed after iterative runtime fixes.

5. **Start with resilient data contracts.**
   - Storing receipt as nullable field with clear semantics (`receiptBase64 | null`) keeps UI logic simple.

## Risks / Trade-offs

- Storing base64 inside Realtime DB increases data size per entry.
- Acceptable for small-team usage, but at larger scale should move to object storage.
- Existing entries created before base64 migration may have no receipt data.

## Suggested Next Steps

1. Add a small migration/cleanup utility for legacy receipt fields if needed.
2. Add compression/resizing tuning to reduce payload size further.
3. Add import/export JSON backup for deliberate offline transfer.
4. Add basic validation limits (e.g., max image payload size).
5. If project scales, move receipts to Firebase Storage (Blaze) and keep text in Realtime DB.

## Handoff Note

- App is currently in working state for the stated objective:
  - local camera capture,
  - optional receipt,
  - monthly table + total,
  - edit/delete,
  - PDF text export.
