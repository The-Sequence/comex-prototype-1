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
