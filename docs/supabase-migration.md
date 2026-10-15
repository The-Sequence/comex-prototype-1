# Moving prototype data to Supabase

Accounts already use V1's own Supabase project (`src/lib/db.js`). Feature data ported from
comex-frontend-v2 is kept in this browser's localStorage for now. Each feature below says how to
switch its store to Supabase. Never point V1 at V2's project.

## Volunteer opportunities and applications

Stores: `src/lib/opportunities.js` (posts) and `src/lib/applications.js` (applications).
Migration: `supabase/migrations/202610150110_volunteer_opportunities.sql` creates
`volunteer_opportunities` and `volunteer_applications` with V2's RLS (office writes, audience-scoped
reads, one Pending application per user and post, office-only decisions) and seeds the EcoWays post.

To switch:

1. Apply the migration to V1's project (`supabase db push`).
2. Replace the bodies of `createOpportunity`, `updateOpportunity` and `deleteOpportunity` with
   `supabase.from('volunteer_opportunities')` insert / update / `update({ is_deleted: true })`
   calls, mapping rows to the camelCase shape (`posted_at` → `postedAt`, `image_url` → `imageUrl`, …)
   and keeping the `{ success, data }` / `{ success: false, error }` returns. Set `posted_by_id` to
   the signed-in user's id.
3. Make `useOpportunities` load with `useAsyncList` (RLS already hides deleted and out-of-audience
   posts; keep `visibleOpportunities` for search and ordering) and refresh after each write.
4. Do the same for `applyToOpportunity` / `setApplicantStatus` (form answers go in `answers`,
   identity comes from `profiles`) and the application hooks.
5. The pure rules in `src/lib/opportunityRules.js` stay as client-side validation; the table checks
   and `can_see_volunteer_audience()` enforce the same limits server-side.
