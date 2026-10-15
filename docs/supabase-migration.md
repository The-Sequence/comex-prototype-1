# Moving dashboard data to Supabase

Each feature below keeps its data in this browser's localStorage for now. Every
store already returns V2's `{ success, data }` / `{ success: false, error }`
shape, so switching a store to Supabase changes only that store's module.
Migrations live in `supabase/migrations/` and are not applied yet.

## Projects (Community Engagements)

Store: `src/lib/projects.js` (rules in `src/lib/projectRules.js`, workflow in
`src/config/comexProcess.js`). Migration: `202610150020_projects.sql`.

| localStorage (`comex-projects`) | Supabase |
| --- | --- |
| project object | `community_engagements` row |
| `steps[n]` (status, feedback) | `project_steps` row (generated for all 15 steps by trigger) |
| `steps[n].approval` | latest `endorsements` row for the step |
| `steps[n].files[]` | `step_files` rows (`file_path` in the `engagement-files` bucket, or `link`) |
| `history[]` | `step_events` rows (written by trigger) |

To switch:

1. Apply the migration to V1's own Supabase project (never V2's).
2. In `projects.js`, replace each write with its server call, keeping the return shape:
   - `createProject` → `insert` into `community_engagements` (RLS limits a Representative to their department).
   - `updateProjectDetails` → `update` of `title`, `objectives`, `engagement_type`.
   - `attachStepFile` → upload to `engagement-files` at `<project id>/step-<n>/<form>-<uuid>-<name>`, then `rpc('record_step_file', …)`; pass `target_link` instead for a pasted link. Change `toAttachment()` to keep the `File` so it can be uploaded.
   - `reviewStep` → `rpc('review_engagement_step', …)`; `resubmitStep` → `rpc('resubmit_engagement_step', …)`.
   - `withdrawProject` → `rpc('withdraw_engagement')`, then remove the returned `paths` from storage.
3. Replace `read()` with a select of `community_engagements` plus its `project_steps`, `endorsements`, `step_files` and `step_events`, mapped to the shape above (signed URLs for files). Keep `useAllProjects()` as the single reader, and re-fetch on a Realtime change instead of the `comex-projects-change` event.
4. `visibleTo()` and `canReviewStep()` stay as UI hints; the policies and functions in the migration are what enforce them.

COMEX Forms (v1-forms) can attach a filled form to a step by calling `attachStepFile(projectId, stepId, formCode, { fileName, link }, user)`.
