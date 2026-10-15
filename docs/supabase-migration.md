# Moving local stores to Supabase

## Messages

Today `src/lib/messages.js` keeps threads, messages, read markers and a small people directory in `localStorage` (`comex-messages`). The rules (who sees a thread, per-person unread, reusing an existing thread, search, recipients) are pure functions in `src/lib/messageThreads.js`, tested in `tests/messageThreads.test.mjs`.

Migration: `supabase/migrations/202610150010_messages.sql` creates `message_threads`, `messages` and `message_reads`, RLS mirroring V2 (creator, named recipient, the COMEX Office for `office` mail, a department's representatives for `dept:<code>` mail), `count_unread_threads()` and `list_contactable_users()`.

To switch:

1. Apply the migration to V1's own Supabase project (never V2's).
2. Rewrite the exports of `src/lib/messages.js` against `requireBackend()` from `src/lib/supabase.js`, keeping their `{ success, data }` / `{ success: false, error }` results:
   - `useMessages(user)`: select `message_threads` with `messages(*)` ordered by `last_message_at desc`, plus the caller's `message_reads`; convert rows to the store's shape (`created_by` → `createdBy`, `recipient` → `recipientId`, …) and map them with `mapThread`. Recipients: the `office` and `dept:` entries from `recipientsFor`, plus `rpc('list_contactable_users')`.
   - `sendMessage`: insert into `messages`, then update the thread's `preview` and `last_message_at`.
   - `startConversation`: find a thread with `created_by = me and recipient = them` or `created_by = them and recipient = me`; insert one if none, then send.
   - `markThreadRead`: upsert `message_reads (thread_id, user_id, last_read_at = now())`.
   - `useUnreadThreadCount`: `rpc('count_unread_threads')`.
   - `rememberPerson` is no longer needed; the directory comes from `profiles`.
3. Replace the `storage` / change-event listeners with a Realtime subscription on `messages` and `message_threads` so replies arrive without a refresh.
