import { lazy, Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import PrivacyGate from './components/PrivacyGate'
import { AuthProvider } from './context/AuthContext'
import { useDocumentTitle } from './lib/useDocumentTitle'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import EnterCode from './pages/EnterCode'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import { RegistrationSuccess, ResetSuccess } from './pages/StatusPages'

/* The dashboards load as their own chunks: the account screens open without
 * them, and a signed-in user only downloads the pages their role opens. */
const AppLayout = lazy(() => import('./components/AppLayout'))
const Users = lazy(() => import('./pages/admin/Users'))
const PendingApprovals = lazy(() => import('./pages/admin/PendingApprovals'))
const FormsPage = lazy(() => import('./pages/dashboards/FormsPage'))
const adminPage = (name) => lazy(() => import('./pages/dashboards/AdminPages').then((m) => ({ default: m[name] })))
const certificatePage = (name) => lazy(() => import('./pages/dashboards/CertificatePages').then((m) => ({ default: m[name] })))
const memberPage = (name) => lazy(() => import('./pages/dashboards/MemberPages').then((m) => ({ default: m[name] })))
const AdminHome = adminPage('AdminHome')
const AdminProjects = adminPage('AdminProjects')
const hoursPage = (name) => lazy(() => import('./pages/dashboards/HoursPages').then((m) => ({ default: m[name] })))
const AdminVolunteerHours = hoursPage('AdminVolunteerHours')
const AdminCertificates = certificatePage('AdminCertificates')
const MyCertificates = certificatePage('MyCertificates')
const MemberHome = memberPage('MemberHome')
const MyProjects = memberPage('MyProjects')
const MyVolunteerHours = hoursPage('MyVolunteerHours')
const Endorsements = memberPage('Endorsements')
const messagePage = (name) => lazy(() => import('./pages/dashboards/MessagePages').then((m) => ({ default: m[name] })))
const AdminMessages = messagePage('AdminMessages')
const MemberMessages = messagePage('MemberMessages')

/* Browser-tab titles for the account screens. Dashboard pages take theirs
 * from the sidebar label (see AppLayout). */
const ACCOUNT_TITLES = {
  '/login': 'Log in',
  '/signup': 'Create Account',
  '/verify-email': 'Verify Email',
  '/registration-success': 'Registration Successful',
  '/forgot-password': 'Forgot Password',
  '/reset-code': 'Enter Verification Code',
  '/reset-password': 'Reset Password',
  '/reset-success': 'Password Reset',
}

function AccountTitle() {
  const { pathname } = useLocation()
  const title = ACCOUNT_TITLES[pathname]
  return title ? <DocumentTitle title={title} /> : null
}

function DocumentTitle({ title }) {
  useDocumentTitle(title)
  return null
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AccountTitle />
        {/* Blank while a dashboard chunk loads; it is small and local. */}
        <Suspense fallback={null}>
          <Routes>
            {/* Sprint 1 account flows (Frames 1–6) */}
            <Route element={<PrivacyGate />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/verify-email" element={<EnterCode purpose="verify" />} />
              <Route path="/registration-success" element={<RegistrationSuccess />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-code" element={<EnterCode purpose="reset" />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/reset-success" element={<ResetSuccess />} />
            </Route>

            {/* COMEX Head (Frames 7–12 + COMEX Forms). Users and Pending Approvals work; the rest is display only. */}
            <Route path="/admin" element={<AppLayout />}>
              <Route path="users" element={<Users />} />
              <Route path="approvals" element={<PendingApprovals />} />
              <Route path="home" element={<AdminHome />} />
              <Route path="projects" element={<AdminProjects />} />
              <Route path="volunteer-hours" element={<AdminVolunteerHours />} />
              <Route path="certificates" element={<AdminCertificates />} />
              <Route path="forms" element={<FormsPage />} />
              <Route path="messages" element={<AdminMessages />} />
            </Route>

            {/* Volunteer, COMEX Representative and Approver (Frames 14–17). Display only.
                AppLayout only lets each role open the pages in its own sidebar. */}
            <Route path="/app" element={<AppLayout />}>
              <Route path="home" element={<MemberHome />} />
              <Route path="projects" element={<MyProjects />} />
              <Route path="volunteer-hours" element={<MyVolunteerHours />} />
              <Route path="certificates" element={<MyCertificates />} />
              <Route path="endorsements" element={<Endorsements />} />
              <Route path="forms" element={<FormsPage />} />
              <Route path="messages" element={<MemberMessages />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </AuthProvider>
  )
}
