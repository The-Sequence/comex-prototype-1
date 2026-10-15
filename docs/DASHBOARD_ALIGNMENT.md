# Dashboard alignment

2026-10-14. Target: `The-Sequence/comex-app-1`, based on remote commit `d708f0a`. Compared with current source and visible role dashboards in `/Users/apple/WebstormProjects/comex-frontend-v2`. The user approved keeping the original layout while adding the current dashboard navigation and controls as static elements. The user subsequently requested an earned-hours display that does not imply a 60-hour cap.

The original checkout at `/Users/apple/Desktop/comex app 1` had older uncommitted owner changes in `src/config/navigation.js`, `src/lib/db.js` and `src/config/usersAndRoles.js`. Work was isolated in `/Users/apple/Desktop/comex-app-dashboard-work`; those original changes were neither edited nor included in these commits. Claude confirmed that he was not editing this repository. Its local README is excluded from Git, so this tracked report documents the new dashboard dashboard.

## Latest owner-requested adjustments

Force release, Help and Documentation have been removed from every dashboard, including the header Help icon and support routes. Display buttons, icon controls, tabs, department headers and placeholder selectors are enabled and keyboard-focusable, but clicking them runs no feature action. Search, message, date and time fields accept local typing without filtering, sending or saving. Sidebar navigation and the original Sprint 1 account features retain their existing behavior. The comparison and initial verification below describe the earlier alignment; these follow-up requirements supersede its support-page and Force release entries.

Follow-up browser verification covered all 16 display pages across the four actors: no disabled dashboard buttons, read-only fields or removed controls remained. Typing an unmatched search did not filter records; clicking search/filter controls did not navigate; Send did not add a message; certificate Preview/Send/selectors did not alter content. Independent review found no actionable issues.

## Comparison

| Area | Current application reference | Change |
|---|---|---|
| Shared shell | Layout components and navigation config | Preserve navy sidebar, old header, identity and yellow-button styling. Add static Search, Help, Notifications and account controls; add Help/Documentation pages. |
| Office Home | AdminHome | Add search, New opportunity, post options/Edit/Delete, applicant action, like/share controls and attention actions around the existing poster. |
| Office projects | AdminProjects | Add search and academic-year/department controls above the old department panels and New/Ongoing/Done strip. |
| Office volunteer hours | AdminVolunteerHours | Keep old encode form and records tables; add static filters, required-hours control, Save record and View records. |
| Office certificates | AdminCertificates | Add static search, department/status controls, signature control, Preview and Force release; retain Send and the old certificate table. |
| Volunteer Home | Observed Student/Faculty/ASP volunteer dashboards | Add search and attention actions to the old opportunity-feed layout. |
| Volunteer hours | Current display and owner's follow-up | Replace the filled 50% bar and 30/60 footer with earned hours, a separate minimum requirement and hours needed to meet that minimum. Explicitly show that earned hours continue accumulating. |
| Volunteer certificates | Volunteer certificate page | Keep old table; show static Preview and Download actions. |
| Representative | RepresentativeDashboard, UserProjects | Land on Engagements, followed by COMEX Forms. Keep old project table; add search/filters and static Create Project Proposal/View Status. |
| Approver | DirectorDashboard | Show Endorsement Queue and Engagements. Keep old department panels; add search/filter, Review, Endorse and Request revision. Approver engagement view has no Create action. |
| COMEX Forms | Forms | Keep old stage panels and metadata; add static Preview, Download blank, Fill form and office-only Edit template. |
| Messages | Current messaging controls | Preserve old Inbox/conversation; add static conversation search, New message and attachment control. Send remains inert. |
| Account lists | AdminUsers, AdminApprovalRequests | Add static user/registration search and Pending/Rejected labels. Existing account decisions and existing account behavior are untouched. |

Placeholder data, old panels, large table layouts, form catalogue and inert tabs remain dashboard fixtures. This is not a later-sprint implementation or a workflow-step migration. No Supabase client, network calls, upload/export logic or new persistence was added. Sidebar links, mobile menu, login/logout and existing Sprint 1 account flows retain their original behavior.

## Role navigation

| Actor | Pages |
|---|---|
| COMEX Head | Users, Pending Approvals, Home, Projects, Volunteer hours, Certificates, COMEX Forms, Messages, Help, Documentation |
| Volunteer | Home, Volunteer hours, Certificates, Messages, Help, Documentation |
| COMEX Representative | Engagements, COMEX Forms, Messages, Help, Documentation |
| Approver | Endorsement Queue, Engagements, Messages, Help, Documentation |

## Verification

- Baseline: existing 9 tests passed, oxlint reported 0 warnings/errors and Vite build succeeded.
- Lint and build passed after each dashboard commit group. Final tests/lint/build are also run before pushing.
- Visible browser inspection at `http://localhost:5193`: 26 role/page combinations across all four actors. All non-account dashboard buttons were inert; no page-wide horizontal overflow at 1440 px.
- Confirmed all four local logins route to the correct dashboards. Approver navigation to Forms returned to Endorsement Queue; Representative forms had no Edit template action.
- Forced click on New opportunity left page contents and URL unchanged. Every added action has no handler; search fields are read-only.
- Inspected earned-hours desktop and phone renders at 1440×900 and 375×812. Header also fits at 320 px without page-wide horizontal overflow. Record tables retain their own horizontal scrolling.
- Independent read-only code review found no actionable issues in the dashboard changes or the earned-hours follow-up. No live account decisions, emails or database changes were performed.

## Limits

Placeholder numbers are fixed. The hours view communicates an uncapped total; it does not calculate or persist hours. Later-sprint controls intentionally do nothing. The new Rejected label is a static dashboard element. Existing Sprint 1 account-flow logic was not rewritten or exercised through final approve/reject actions during verification.
