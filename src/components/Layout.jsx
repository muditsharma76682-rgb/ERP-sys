import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'

const NAV_BY_ROLE = {
  admin: [
    { to: '/', label: 'Overview', end: true },
    { to: '/students', label: 'Students' },
    { to: '/staff', label: 'Staff & Teachers' },
    { to: '/fee-structure', label: 'Fee Structure' },
    { to: '/record-payment', label: 'Record Payment' },
    { to: '/dues', label: 'Dues Register' },
  ],
  accountant: [
    { to: '/', label: 'Overview', end: true },
    { to: '/students', label: 'Students' },
    { to: '/staff', label: 'Staff & Teachers' },
    { to: '/record-payment', label: 'Record Payment' },
    { to: '/dues', label: 'Dues Register' },
  ],
  teacher: [
    { to: '/', label: 'Overview', end: true },
    { to: '/students', label: 'Students' },
    { to: '/staff', label: 'Staff & Teachers' },
    { to: '/dues', label: 'Dues Register' },
  ],
  parent: [
    { to: '/', label: 'Overview', end: true },
    { to: '/dues', label: "My Child's Fees" },
  ],
}

export default function Layout() {
  const { profile, role, signOut } = useAuth()
  const items = NAV_BY_ROLE[role] || []

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="eyebrow">Fee Ledger</span>
          <h1>Navyug Public School</h1>
        </div>
        <nav>
          {items.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => isActive ? 'active' : ''}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="who">{profile?.full_name || '—'}</div>
          <span className="role-tag">{role}</span>
          <button onClick={signOut}>Sign out</button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
