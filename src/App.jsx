import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Staff from './pages/Staff'
import Attendance from './pages/Attendance'
import Academics from './pages/Academics'
import NoticeBoard from './pages/NoticeBoard'
import FeeStructure from './pages/FeeStructure'
import RecordPayment from './pages/RecordPayment'
import Dues from './pages/Dues'

function Gate({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="empty-state" style={{ paddingTop: 100 }}>Loading…</div>
  if (!session) return <Navigate to="/login" replace />
  return children
}

function RoleRoute({ allow, children }) {
  const { role } = useAuth()
  if (!allow.includes(role)) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  const { session } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<Gate><Layout /></Gate>}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<RoleRoute allow={['admin', 'accountant', 'teacher']}><Students /></RoleRoute>} />
        <Route path="staff" element={<RoleRoute allow={['admin', 'accountant', 'teacher']}><Staff /></RoleRoute>} />
        <Route path="attendance" element={<RoleRoute allow={['admin', 'teacher', 'parent']}><Attendance /></RoleRoute>} />
        <Route path="academics" element={<RoleRoute allow={['admin', 'teacher', 'parent']}><Academics /></RoleRoute>} />
        <Route path="notices" element={<RoleRoute allow={['admin', 'accountant', 'teacher', 'parent']}><NoticeBoard /></RoleRoute>} />
        <Route path="fee-structure" element={<RoleRoute allow={['admin']}><FeeStructure /></RoleRoute>} />
        <Route path="record-payment" element={<RoleRoute allow={['admin', 'accountant']}><RecordPayment /></RoleRoute>} />
        <Route path="dues" element={<Dues />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
