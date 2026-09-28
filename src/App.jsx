import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import EnterCode from './pages/EnterCode'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import { RegistrationSuccess, ResetSuccess } from './pages/StatusPages'
import Users from './pages/admin/Users'
import PendingApprovals from './pages/admin/PendingApprovals'
import {
  AdminCertificates,
  AdminHome,
  AdminMessages,
  AdminProjects,
  AdminVolunteerHours,
} from './pages/dashboards/AdminPages'
import FormsPage from './pages/dashboards/FormsPage'
import {
  Endorsements,
  MemberHome,
  MemberMessages,
  MyCertificates,
  MyProjects,
  MyVolunteerHours,
} from './pages/dashboards/MemberPages'

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Sprint 1 account flows (Frames 1–6) */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify-email" element={<EnterCode purpose="verify" />} />
          <Route path="/registration-success" element={<RegistrationSuccess />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-code" element={<EnterCode purpose="reset" />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reset-success" element={<ResetSuccess />} />

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
      </HashRouter>
    </AuthProvider>
  )
}
