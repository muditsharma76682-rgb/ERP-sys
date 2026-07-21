import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function Dues() {
  const { role } = useAuth()
  const isStaff = ['admin', 'accountant', 'teacher'].includes(role)
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('student_fee_dues').select('*').order('student_name').then(({ data }) => {
      setRows(data || [])
      setLoading(false)
    })
  }, [])

  const filtered = rows.filter(r =>
    !search ||
    r.student_name.toLowerCase().includes(search.toLowerCase()) ||
    r.admission_no.toLowerCase().includes(search.toLowerCase())
  )

  function statusBadge(balance) {
    if (balance <= 0) return <span className="badge paid">Paid</span>
    return <span className="badge due">Due</span>
  }

  if (loading) return <div className="empty-state">Loading…</div>

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Register</span>
          <h2>{isStaff ? 'Dues Register' : "My Child's Fees"}</h2>
        </div>
      </div>

      {isStaff && (
        <div className="toolbar">
          <input type="search" placeholder="Search by name or admission no." value={search} onChange={e => setSearch(e.target.value)} />
          <span className="mono" style={{ color: 'var(--muted)', fontSize: 12.5 }}>{filtered.length} records</span>
        </div>
      )}

      <table className="ledger">
        <thead>
          <tr>
            {isStaff && <th>Admission No.</th>}
            {isStaff && <th>Student</th>}
            <th>Fee Head</th>
            <th>Term</th>
            <th>Year</th>
            <th>Due</th>
            <th>Paid</th>
            <th>Balance</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r, i) => (
            <tr key={i}>
              {isStaff && <td className="mono">{r.admission_no}</td>}
              {isStaff && <td>{r.student_name}</td>}
              <td>{r.fee_head_name}</td>
              <td>{r.term}</td>
              <td className="mono">{r.academic_year}</td>
              <td className="num">₹{Number(r.amount_due).toLocaleString('en-IN')}</td>
              <td className="num">₹{Number(r.amount_paid).toLocaleString('en-IN')}</td>
              <td className="num">₹{Number(r.balance).toLocaleString('en-IN')}</td>
              <td>{statusBadge(Number(r.balance))}</td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={isStaff ? 8 : 6}><div className="empty-state">No fee records found.</div></td></tr>
          )}
        </tbody>
      </table>
    </>
  )
}
