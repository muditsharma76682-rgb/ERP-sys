import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function Students() {
  const { role } = useAuth()
  const canEdit = ['admin', 'accountant'].includes(role)

  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ admission_no: '', full_name: '', class_id: '', contact_phone: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: s }, { data: c }] = await Promise.all([
      supabase.from('students').select('*, classes(name, section)').order('full_name'),
      supabase.from('classes').select('*').order('name'),
    ])
    setStudents(s || [])
    setClasses(c || [])
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const { error } = await supabase.from('students').insert({
      admission_no: form.admission_no,
      full_name: form.full_name,
      class_id: form.class_id || null,
      contact_phone: form.contact_phone || null,
    })
    setSaving(false)
    if (error) { setError(error.message); return }
    setForm({ admission_no: '', full_name: '', class_id: '', contact_phone: '' })
    setShowForm(false)
    load()
  }

  const filtered = students.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.admission_no.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Register</span>
          <h2>Students</h2>
        </div>
        {canEdit && (
          <button className="btn" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : '+ Add Student'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          {error && <div className="alert error">{error}</div>}
          <form onSubmit={handleAdd}>
            <div className="form-row">
              <div className="field">
                <label>Admission No.</label>
                <input value={form.admission_no} onChange={e => setForm({ ...form, admission_no: e.target.value })} required />
              </div>
              <div className="field">
                <label>Full Name</label>
                <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Class</label>
                <select value={form.class_id} onChange={e => setForm({ ...form, class_id: e.target.value })}>
                  <option value="">Select class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Contact Phone</label>
                <input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} />
              </div>
            </div>
            <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Student'}</button>
          </form>
        </div>
      )}

      <div className="toolbar">
        <input type="search" placeholder="Search by name or admission no." value={search} onChange={e => setSearch(e.target.value)} />
        <span className="mono" style={{ color: 'var(--muted)', fontSize: 12.5 }}>{filtered.length} students</span>
      </div>

      <table className="ledger">
        <thead>
          <tr>
            <th>Admission No.</th>
            <th>Name</th>
            <th>Class</th>
            <th>Contact</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(s => (
            <tr key={s.id}>
              <td className="mono">{s.admission_no}</td>
              <td>{s.full_name}</td>
              <td>{s.classes ? `${s.classes.name}${s.classes.section ? ' - ' + s.classes.section : ''}` : '—'}</td>
              <td className="mono">{s.contact_phone || '—'}</td>
              <td><span className={`badge ${s.status === 'active' ? 'paid' : 'due'}`}>{s.status}</span></td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={5}><div className="empty-state">No students found.</div></td></tr>
          )}
        </tbody>
      </table>
    </>
  )
}
