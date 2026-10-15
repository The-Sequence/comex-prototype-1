# Moving local features to Supabase

## COMEX Forms

Today `src/lib/formStore.js` keeps three lists in localStorage: drafts
(`comex-form-drafts`), forms attached to project steps (`comex-form-attachments`)
and the office's replacement templates (`comex-form-templates`, PDFs as data URLs,
2 MB cap). The bundled blank PDFs stay in `public/forms` either way.

Migration: `supabase/migrations/202610150013_forms.sql` (V1's own project, not applied).

To switch:

1. Apply the migration. It adds `comex_form_versions`, `comex_form_drafts`,
   `comex_form_attachments`, the `publish_form_version` / `activate_form_version` /
   `revert_to_bundled_form` functions and a private `comex-forms` storage bucket.
2. In `formStore.js`, replace each function body with a Supabase call from
   `src/lib/supabase.js`, keeping the names and the `{ success, data }` /
   `{ success: false, error }` returns:
   - `saveDraft` → upsert into `comex_form_drafts` (`user_id`, `form_code`, `lang`, `fields`);
     `getDraft` / `listDrafts` / `removeDraft` → select / delete on the same table.
   - `attachFilledForm` → insert into `comex_form_attachments`; `listAttachedForms` /
     `detachFilledForm` → select / delete.
   - `publishFormVersion` → upload the file to `comex-forms/<form_code>/<lang>/<uuid>.pdf`,
     then `rpc('publish_form_version', …)`. `listFormVersions` / `getActiveVersion` →
     select, and swap `dataUrl` for a signed URL (`storage.from('comex-forms').createSignedUrl`).
   - `activateFormVersion` / `revertToBundledForm` → the matching RPCs.
3. The getters become async, so `FormsPage` and `FormDialogs` load them in an effect
   (or `useAsyncList`) instead of reading synchronously; `useFormStore` can listen to a
   Realtime channel on the three tables instead of the window event.
# Moving dashboard data from localStorage to Supabase

Each feature keeps its data in this browser's localStorage through a small store in `src/lib`.
Every store already returns V2's `{ success, data }` / `{ success: false, error }` contract, so
switching one to V1's Supabase project only changes the store, not the pages.

## Volunteer hours

- Store: `src/lib/volunteerHours.js` (localStorage keys `comex-volunteer-hours`, `comex-required-hours`).
- Rules (no storage, unit-tested): `src/lib/hoursRules.js`.
- Migration: `supabase/migrations/202610150110_volunteer_hours.sql` — tables `volunteer_hours` and
  `department_requirements`, the `is_hours_office()` helper, RLS (a volunteer reads only their own
  rows; the COMEX Head or Associate encodes; only the COMEX Head sets required hours) and the
  `fill_volunteer_hours_identity` trigger that copies name, department and role from `profiles`.

To switch:

1. Apply the migration to V1's own project (never V2's).
2. In `encodeVolunteerHours`, keep the `buildHourRecord` validation, then
   `insert({ user_id, full_name: '', project, volunteer_role, date: isoDate, time_in, time_out, hours, academic_year })`
   on `volunteer_hours` and map the returned row back to camelCase (`isoDate`, `date` via `formatHourDate`).
   The trigger fills the identity; a "Volunteer not found." error means the account is not approved.
3. In `saveRequiredHours`, `upsert` rows into `department_requirements` with `onConflict: 'department,academic_year'`.
   An RLS refusal (code `42501`, or fewer rows returned) is "Only the COMEX Head can change required hours."
4. Replace the `useStore` reads with `select` calls (filter by `academic_year`, and `user_id` for a member)
   and re-fetch on the same change event, or subscribe with Supabase Realtime.
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
