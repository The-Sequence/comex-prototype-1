import { Award, CircleDashed, Clock, FileCheck2, FileText, Home, Mail, MessageCircle, UserRound } from 'lucide-react'
import { roleGroup } from '../lib/db'

/*
 * Sidebar for each role group, following the Figma frames:
 *   admin      -> Frames 7–12 (Admin), plus COMEX Forms
 *   volunteer  -> Frames 14, 16, 16.5, 17 (User)
 *   rep        -> Frames 14, 15, 17 (User, with Projects), plus COMEX Forms
 *   approver   -> endorsement requests (Approve Endorsement Request use case)
 * COMEX Forms goes to the two actors linked to "Access COMEX Forms" in the
 * use case diagram: the COMEX Head and the COMEX Representative.
 */
const HOME = { path: 'home', label: 'Home', icon: Home }
const PROJECTS = { path: 'projects', label: 'Projects', icon: Mail }
const HOURS = { path: 'volunteer-hours', label: 'Volunteer hours', icon: Clock }
const CERTIFICATES = { path: 'certificates', label: 'Certificates', icon: Award }
const FORMS = { path: 'forms', label: 'COMEX Forms', icon: FileText }
const COMMUNICATION = {
  heading: 'Communication',
  items: [{ path: 'messages', label: 'Messages', icon: MessageCircle }],
}

export const NAVIGATION = {
  admin: {
    base: '/admin',
    sections: [
      {
        heading: 'Main',
        items: [
          { path: 'users', label: 'Users', icon: UserRound },
          { path: 'approvals', label: 'Pending Approvals', icon: CircleDashed },
        ],
      },
      { heading: 'Core Features', items: [HOME, PROJECTS, HOURS, CERTIFICATES, FORMS] },
      COMMUNICATION,
    ],
  },
  volunteer: {
    base: '/app',
    sections: [{ heading: 'Core Features', items: [HOME, HOURS, CERTIFICATES] }, COMMUNICATION],
  },
  rep: {
    base: '/app',
    sections: [{ heading: 'Core Features', items: [HOME, PROJECTS, FORMS] }, COMMUNICATION],
  },
  approver: {
    base: '/app',
    sections: [
      { heading: 'Core Features', items: [{ path: 'endorsements', label: 'Endorsements', icon: FileCheck2 }] },
      COMMUNICATION,
    ],
  },
}

export function navFor(user) {
  return NAVIGATION[roleGroup(user.role)]
}

/** Pages this user's role may open, as sub-paths of its base. */
export function allowedPaths(user) {
  return navFor(user).sections.flatMap((section) => section.items.map((item) => item.path))
}

/** Where a role lands right after signing in: the first item in its sidebar. */
export function dashboardPathFor(user) {
  const nav = navFor(user)
  return `${nav.base}/${nav.sections[0].items[0].path}`
}
