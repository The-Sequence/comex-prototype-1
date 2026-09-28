import { useState } from 'react'
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, LogOut, Menu } from 'lucide-react'
import logoWhite from '../assets/comex-logo-white.png'
import { useAuth } from '../context/AuthContext'
import { allowedPaths, dashboardPathFor, navFor } from '../config/navigation'
import { initials } from '../lib/format'

/**
 * Sidebar + top bar shell from the Figma dashboard frames (7–18).
 * Also acts as the route guard: signed-out visitors go to the login page,
 * and a role can only open the pages listed in its own sidebar.
 */
export default function AppLayout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!user) return <Navigate to="/login" replace />
  const nav = navFor(user)
  const [, base, page] = pathname.split('/')
  if (`/${base}` !== nav.base || !allowedPaths(user).includes(page)) {
    return <Navigate to={dashboardPathFor(user)} replace />
  }

  const logout = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-white">
      {menuOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setMenuOpen(false)} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-sidebar text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <img src={logoWhite} alt="NU Fairview Community Extension Office" className="mx-6 mt-6 mb-8 h-12 w-auto self-start" />
        <nav className="flex-1 space-y-4 overflow-y-auto">
          {nav.sections.map((section) => (
            <div key={section.heading}>
              <p className="px-6 pb-1 text-[15px] text-white/75">{section.heading}</p>
              {section.items.map(({ path, label, icon: Icon }) => (
                <NavLink
                  key={path}
                  to={`${nav.base}/${path}`}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `mx-1 flex items-center gap-3 rounded-xl px-5 py-2 text-[17px] transition ${
                      isActive
                        ? 'bg-gradient-to-r from-white/35 to-white/5 shadow-md ring-1 ring-white/30'
                        : 'hover:bg-white/10'
                    }`
                  }
                >
                  <Icon className="size-5" /> {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <button onClick={logout} className="m-6 flex items-center gap-2 text-[17px] hover:text-gold">
          <LogOut className="size-5" /> Log out
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-4 px-4 py-3 md:px-6">
          <button className="lg:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu className="size-6" />
          </button>
          <span className="relative ml-auto rounded-lg border border-gray-800 p-2 shadow-md" aria-label="Notifications">
            <Bell className="size-6" />
            <span className="absolute bottom-0 right-1 text-[10px] font-bold text-red-600">1</span>
          </span>
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full bg-navy text-sm font-bold text-gold">
              {initials(user.fullName)}
            </span>
            <div className="hidden leading-tight sm:block">
              <p className="font-medium">{user.fullName}</p>
              <p className="text-sm text-gray-600">{user.role}</p>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden px-4 pb-10 pt-4 md:px-6">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  )
}
