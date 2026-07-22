import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import Receipt from '../components/Receipt'

export default function RecordPayment() {
  const { session } = useAuth()
  const [students, setStudents] = useState([])
  const [feeHeads, setFeeHeads] = useState([])
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [form, setForm] = useState({ fee_head_id: '', term: '', academic_year: '2026-27', amount: '', payment_mode: 'cash', remarks: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [receipt, setReceipt] = useState(null)
  const [showReceipt, setShowReceipt] = useState(false)

  useEffect(() => {
    supabase.from('students').select('*, classes(name, section)').order('full_name').then(({ data }) => setStudents(data || []))
    supabase.from('fee_heads').select('*').order('name').then(({ data }) => setFeeHeads(data || []))
  }, [])

  const filtered = search.length < 1 ? [] : students.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.admission_no.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const { data, error } = await supabase.from('fee_transactions').insert({
      student_id: selectedStudent.id,
      fee_head_id: form.fee_head_id,
      term: form.term,
      academic_year: form.academic_year,
      amount: Number(form.amount),
      payment_mode: form.payment_mode,
      remarks: form.remarks || null,
      recorded_by: session.user.id,
    }).select().single()
    setSaving(false)
    if (error) { setError(error.message); return }
    const feeHead = feeHeads.find(h => h.id === form.fee_head_id)
    setReceipt({
      ...data,
      student_name: selectedStudent.full_name,
      admission_no: selectedStudent.admission_no,
      class_name: selectedStudent.classes ? `${selectedStudent.classes.name}${selectedStudent.classes.section ? ' - ' + selectedStudent.classes.section : ''}` : '',
      fee_head_name: feeHead?.name || '',
    })
    setForm({ fee_head_id: '', term: '', academic_year: form.academic_year, amount: '', payment_mode: 'cash', remarks: '' })
  }

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Collections</span>
          <h2>Record Payment</h2>
        </div>
      </div>

      {!selectedStudent ? (
        <div className="card">
          <div className="field">
            <label>Search Student</label>
            <input type="search" placeholder="Name or admission no." value={search} onChange={e => setSearch(e.target.value)} autoFocus />
          </div>
          {filtered.length > 0 && (
            <table className="ledger">
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => { setSelectedStudent(s); setReceipt(null) }}>
                    <td className="mono">{s.admission_no}</td>
                    <td>{s.full_name}</td>
                    <td>{s.classes ? `${s.classes.name}${s.classes.section ? ' - ' + s.classes.section : ''}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="card" style={{ maxWidth: 560 }}>
          <div className="ledger-row">
            <span className="label">Student</span>
            <span className="fill"></span>
            <span className="value">{selectedStudent.full_name} ({selectedStudent.admission_no})</span>
          </div>
          <button className="btn secondary" style={{ margin: '14px 0' }} onClick={() => { setSelectedStudent(null); setReceipt(null) }}>Change student</button>

          {error && <div className="alert error">{error}</div>}

          {receipt ? (
            <div className="alert success">
              Payment recorded — Receipt <span className="receipt-no">{receipt.receipt_no}</span> for ₹{Number(receipt.amount).toLocaleString('en-IN')}.
              <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                <button className="btn" onClick={() => setShowReceipt(true)}>Print Receipt</button>
                <button className="btn secondary" onClick={() => setReceipt(null)}>Record another payment</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="field">
                  <label>Fee Head</label>
                  <select value={form.fee_head_id} onChange={e => setForm({ ...form, fee_head_id: e.target.value })} required>
                    <option value="">Select</option>
                    {feeHeads.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Term</label>
                  <input value={form.term} onChange={e => setForm({ ...form, term: e.target.value })} placeholder="Term 1" required />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Academic Year</label>
                  <input value={form.academic_year} onChange={e => setForm({ ...form, academic_year: e.target.value })} required />
                </div>
                <div className="field">
                  <label>Amount (₹)</label>
                  <input type="number" min="1" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Payment Mode</label>
                  <select value={form.payment_mode} onChange={e => setForm({ ...form, payment_mode: e.target.value })}>
                    <option value="cash">Cash</option>
                    <option value="cheque">Cheque</option>
                    <option value="online">Online</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>
                <div className="field">
                  <label>Remarks</label>
                  <input value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} />
                </div>
              </div>
              <button className="btn" type="submit" disabled={saving}>{saving ? 'Recording…' : 'Record Payment'}</button>
            </form>
          )}
        </div>
      )}

      {showReceipt && <Receipt data={receipt} onClose={() => setShowReceipt(false)} />}
    </>
  )
}
