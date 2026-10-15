/* Messages pages (Frames 12 and 17). Both roles share the working inbox;
 * the office's copy marks unread conversations with the "New" badge. */
import { useOutletContext } from 'react-router-dom'
import { PageTitle } from '../../components/Showcase'
import { MessagesPanel } from '../../components/Messages'

/** Frame 12 — Messages. */
export function AdminMessages() {
  const { user } = useOutletContext()
  return (
    <>
      <PageTitle>Messages</PageTitle>
      <MessagesPanel user={user} showNewBadge />
    </>
  )
}

/** Frame 17 — Messages. */
export function MemberMessages() {
  const { user } = useOutletContext()
  return (
    <>
      <PageTitle>Messages</PageTitle>
      <MessagesPanel user={user} />
    </>
  )
}
