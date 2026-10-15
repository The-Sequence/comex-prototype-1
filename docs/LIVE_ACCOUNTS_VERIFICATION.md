# Live verification — 15 October 2026

Verified against the dedicated Sprint 1 project, not the main COMEX database.

| Requirement | Evidence |
| --- | --- |
| Four requested actors | All four authenticate with their assigned role and reach the expected dashboard. |
| Real signup | Owner-authorized Gmail test account created through Supabase Auth API; verification email received in Gmail. |
| Real code validation | Incorrect code rejected in the browser; emailed eight-digit code accepted. |
| Approval gate | Verified pending account denied application login. Rejected account denied application login. Approved account opens Volunteer Home. |
| Rejection without note | Head UI saves a rejection; generic notification received in Gmail. |
| Rejection with note | Head UI saves the office-visit verification note; exact note received in Gmail. |
| Approval | Head UI saves approval; approval email received in Gmail; browser login succeeds. |
| Password recovery | Reset requested from the browser, real code verified in the browser, recovery form displayed. A second real code was consumed through the Auth API to update the password. Old password rejected, requested new password accepted by API and browser. |
| Recovery isolation | A second tab sharing the recovery session redirects from a dashboard URL to Login. |
| Email failure | Initial missing function secret produced a saved decision plus an honest failure/Retry result. After configuration, delivery succeeded. |
| Persistent retry | A controlled replay of the prior failed notification remained visible after reload; Head UI retry completed. Provider idempotency prevented a duplicate message. |
| Final state | Test account approved; three decision audit rows retained; all three notification statuses sent. |
| RLS | Anonymous profile reads denied; non-Heads see only their own profile; direct profile writes and unauthorized decisions/emails denied. |
| Layout | Original sidebar, tables and navy/yellow design retained. No Force release, Help or Documentation controls. Later-sprint actions are inactive. |

The same test account was restored to pending with server-only test setup between rejection scenarios and final approval. No account or audit history was deleted.

Password creation and update were tested through authorized backend APIs. New-password GUI entry/submission was not exercised; the browser covered code verification, recovery form rendering, login, decisions and routing. The reset-success screen was captured after API success. Validation and input behavior have separate automated tests.

Screenshots live in the owner's local `COMEX-Sprint-1-Screenshots` folder. Personal email screenshots and consumed codes are not committed to the repository.
