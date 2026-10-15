# Moving local stores to Supabase

Each feature below keeps its data in browser localStorage today. These sections explain how to switch each store to V1's own Supabase project (never V2's).

## Certificates

Store: `src/lib/certificates.js` (rules in `src/lib/certificateRules.js`, hours via `src/lib/certificateHours.js`).
Migration: `supabase/migrations/202610150108_certificates.sql` — `certificates`, `department_requirements`, the `signatures` bucket and their RLS. Not applied yet.

To switch:

1. Apply the migration to V1's Supabase project.
2. In `certificates.js`, replace the localStorage reads/writes with `supabase` calls (the client is in `src/lib/supabase.js`), keeping the `{ success, data }` / `{ success: false, error }` results:
   - `sendCertificate` → `upsert` into `certificates` with `onConflict: 'user_id,academic_year'`.
   - dispatch reads → `select user_id, dispatch_status, sent_at, signed, forced` filtered by `academic_year` (RLS already limits a volunteer to their own row).
   - `loadRequiredHours` / `saveRequiredHours` → `department_requirements`; an RLS denial comes back as error `42501` → "Only the COMEX Head can change required hours."
   - signatures → Storage bucket `signatures` at `<userId>/signature.png` (`upload` with `upsert: true`, `getPublicUrl`, `remove`).
3. The functions become async; make `useCertificateData` await `load()` and re-run after each write instead of listening for the storage event.
4. Point `setHourRecordSource` at the volunteer hours store/table so eligibility uses real hours (the default source returns sample records).
5. Optional: port V2's `notify_certificate_release` trigger once V1 has a notifications table.
