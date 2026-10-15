# Sprint 1 live accounts

The dashboards keep their original layout. Signup, email verification, password recovery, account decisions and role routing use a dedicated Supabase project. Later-sprint dashboard controls are not active yet.

## Project

- Organization: Algovista (Free).
- Project: COMEX Sprint 1.
- Reference: `ihswqpgvrcnofrnccwbs`.
- Region: Singapore (`ap-southeast-1`).
- The real COMEX project `wwoaeohoinciirnrnlvl` is not used. The frontend refuses that URL.

Run `npm ci`, then `npm run dev`. Public project configuration is in `src/config/backend.js`; no private credentials are required to run the frontend. Optional `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` environment variables override it. Never put a service-role or Resend key in a VITE variable.

## Seeded accounts

All four accounts are email-confirmed and approved. Their password is held by the project owner and is not stored in the repository.

| Account | Role | Landing page |
| --- | --- | --- |
| head@comex.com | COMEX Head | Users |
| volunteer@comex.com | Volunteer | Home |
| comexrep@comex.com | COMEX Representative | Engagements |
| approver@comex.com | Approver | Endorsement Queue |

Self-service registration offers Student, ASP, Faculty and COMEX Representative. The first three route as volunteers after approval. Privileged roles can only be provisioned by an administrator.

## Auth and email configuration

- Confirm email and new-user signup: enabled. Anonymous sign-in: disabled.
- Email OTP: eight digits, 600-second expiry.
- Password policy: at least eight characters, uppercase, lowercase and digit.
- Custom SMTP: Resend, `smtp.resend.com:465`, username `resend`, sender `noreply@algovista.dev`.
- Signup/reset templates use `{{ .Token }}`. Tracked copies are in `supabase/email-templates`.
- Edge Function: `send-decision-email`; server secret `RESEND_API_KEY`. Optional `MAIL_FROM` overrides the verified sender.
- The function validates the bearer token with Supabase Auth, requires a password-authenticated approved Head, and obtains recipient/content from saved audit records. Gateway legacy JWT checking is disabled because the function performs this verification itself.

Migrations are in `supabase/migrations`. Apply only to this project. For future provisioning, `scripts/seed-actors.mjs` uses the Auth Admin API, needs server-only `SUPABASE_SERVICE_ROLE_KEY` and `COMEX_ACCOUNT_PASSWORD`, and preserves existing actors.

## Account decisions

Profiles are protected by RLS. Users can read their own profile; an approved, password-authenticated Head can review registrations. Clients cannot insert, update or delete profiles or audit records directly.

The decision RPC checks Head access, verified email and pending state, locks the registration, saves the decision and appends an audit record. Duplicate decisions and self-decisions are rejected. Rejections can include a note up to 500 characters.

Email delivery is separate from the saved decision. The function claims a queued message atomically and uses its decision ID as the Resend idempotency key. A failure leaves the decision saved and exposes Retry. The Head's Email notifications list survives reloads; stale sending claims can be retried after five minutes. There is no background delivery worker: unsent notifications require a Head retry.

## Verification and recovery

The UI never accepts a fabricated code. Unknown-email reset requests follow the same neutral flow. Recovery sessions cannot enter dashboards, even in another tab; both the UI and Head database/email permissions require a password authentication method. Password updates use a verified recovery session, then clear that session.

Privacy acknowledgement is versioned, uses the COMEX logo and links to Republic Act No. 10173. It identifies Supabase, Resend and Singapore storage, and states no retention period or contact that the office has not set.

## Checks

- `npm test`
- `npm run lint`
- `npm run build`
- `node --env-file=.env.local scripts/verify-live-accounts.mjs` (project authentication and RLS checks)

The live test script uses only publishable access, validates all four roles, checks anonymous restrictions, blocked direct edits, forbidden decisions/emails and wrong-password rejection. It signs out only its own sessions.
