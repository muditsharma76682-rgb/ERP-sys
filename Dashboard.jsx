import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

function currency(n) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)
}

export default function Dashboard() {
  const { profile, role } = useAuth()
  const isStaff = ['admin', 'accountant', 'teacher'].includes(role)

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [dues, setDues] = useState([])

  useEffect(() => {
    if (isStaff) loadStaffStats()
    else loadParentStats()
    // eslint-disable-next-line
  }, [role])

  async function loadStaffStats() {
    setLoading(true)
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    const startStr = startOfMonth.toISOString().slice(0, 10)

    const [{ count: studentCount }, { data: monthTx }, { data: duesRows }] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('fee_transactions').select('amount').gte('payment_date', startStr),
      supabase.from('student_fee_dues').select('balance'),
    ])

    const collectedThisMonth = (monthTx || []).reduce((sum, t) => sum + Number(t.amount), 0)
    const totalOutstanding = (duesRows || []).reduce((sum, d) => sum + Math.max(Number(d.balance), 0), 0)

    setStats({ studentCount: studentCount || 0, collectedThisMonth, totalOutstanding })
    setLoading(false)
  }

  async function loadParentStats() {
    setLoading(true)
    const { data } = await supabase.from('student_fee_dues').select('*')
    setDues(data || [])
    setLoading(false)
  }

  if (loading) return <div className="empty-state">Loading…</div>

  if (isStaff) {
    return (
      <>
        <div className="page-header">
          <div>
            <span className="eyebrow">Overview</span>
            <h2>Welcome, {profile?.full_name?.split(' ')[0] || 'there'}</h2>
          </div>
        </div>
        <div className="card-grid">
          <div className="card stat-card">
            <div className="stat-label">Active Students</div>
            <div className="stat-value">{stats.studentCount}</div>
          </div>
          <div className="card stat-card positive">
            <div className="stat-label">Collected This Month</div>
            <div className="stat-value">{currency(stats.collectedThisMonth)}</div>
          </div>
          <div className="card stat-card accent">
            <div className="stat-label">Total Outstanding</div>
            <div className="stat-value">{currency(stats.totalOutstanding)}</div>
          </div>
        </div>
      </>
    )
  }

  // Parent view
  const totalDue = dues.reduce((s, d) => s + Math.max(Number(d.balance), 0), 0)
  const childName = dues[0]?.student_name

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Overview</span>
          <h2>{childName || 'Your child'}'s fee summary</h2>
        </div>
      </div>
      <div className="card-grid">
        <div className={`card stat-card ${totalDue > 0 ? 'accent' : 'positive'}`}>
          <div className="stat-label">Outstanding Balance</div>
          <div className="stat-value">{currency(totalDue)}</div>
        </div>
      </div>
      {dues.length === 0 && <div className="empty-state">No fee records found yet.</div>}
    </>
  )
}
