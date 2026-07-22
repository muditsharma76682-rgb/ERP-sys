import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const emptyForm = {
  full_name: '', designation: '', subject_specialization: '', contact_phone: '',
  email: '', qualification: '', date_of_joining: '', class_teacher_of: '',
}

export default function Staff() {
  const { role } = useAuth()
  const canEdit = role === 'admin'

  const [staff, setStaff] = useState([])
  const [classes, setClasses] = useState([])
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: s }, { data: c }] = await Promise.all([
      supabase.from('staff').select('*, classes(name, section)').order('full_name'),
      supabase.from('classes').select('*').order('name'),
    ])
    setStaff(s || [])
    setClasses(c || [])
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const { error } = await supabase.from('staff').insert({
      full_name: form.full_name,
      designation: form.designation,
      subject_specialization: form.subject_specialization || null,
      contact_phone: form.contact_phone || null,
      email: form.email || null,
      qualification: form.qualification || null,
      date_of_joining: form.date_of_joining || null,
      class_teacher_of: form.class_teacher_of || null,
    })
    setSaving(false)
    if (error) { setError(error.message); return }
    setForm(emptyForm)
    setShowForm(false)
    load()
  }

  async function toggleStatus(member) {
    const newStatus = member.status === 'active' ? 'inactive' : 'active'
    await supabase.from('staff').update({ status: newStatus }).eq('id', member.id)
    load()
  }

  const filtered = staff.filter(s =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.designation.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Register</span>
          <h2>Staff &amp; Teachers</h2>
        </div>
        {canEdit && (
          <button className="btn" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : '+ Add Staff'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          {error && <div className="alert error">{error}</div>}
          <form onSubmit={handleAdd}>
            <div className="form-row">
              <div className="field">
                <label>Full Name</label>
                <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
              </div>
              <div className="field">
                <label>Designation</label>
                <input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} placeholder="PGT Physics, Principal, Peon…" required />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Subject Specialization</label>
                <input value={form.subject_specialization} onChange={e => setForm({ ...form, subject_specialization: e.target.value })} />
              </div>
              <div className="field">
                <label>Class Teacher Of</label>
                <select value={form.class_teacher_of} onChange={e => setForm({ ...form, class_teacher_of: e.target.value })}>
                  <option value="">Not a class teacher</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Contact Phone</label>
                <input value={form.contact_phone} onChange={e => setForm({ ...form, contact_phone: e.target.value })} />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Qualification</label>
                <input value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} />
              </div>
              <div className="field">
                <label>Date of Joining</label>
                <input type="date" value={form.date_of_joining} onChange={e => setForm({ ...form, date_of_joining: e.target.value })} />
              </div>
            </div>
            <button className="btn" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Staff Member'}</button>
          </form>
        </div>
      )}

      <div className="toolbar">
        <input type="search" placeholder="Search by name or designation" value={search} onChange={e => setSearch(e.target.value)} />
        <span className="mono" style={{ color: 'var(--muted)', fontSize: 12.5 }}>{filtered.length} staff</span>
      </div>

      <table className="ledger">
        <thead>
          <tr>
            <th>Name</th>
            <th>Designation</th>
            <th>Specialization</th>
            <th>Class Teacher</th>
            <th>Contact</th>
            <th>Status</th>
            {canEdit && <th></th>}
          </tr>
        </thead>
        <tbody>
          {filtered.map(s => (
            <tr key={s.id}>
              <td>{s.full_name}</td>
              <td>{s.designation}</td>
              <td>{s.subject_specialization || '—'}</td>
              <td>{s.classes ? `${s.classes.name}${s.classes.section ? ' - ' + s.classes.section : ''}` : '—'}</td>
              <td className="mono">{s.contact_phone || s.email || '—'}</td>
              <td><span className={`badge ${s.status === 'active' ? 'paid' : 'due'}`}>{s.status}</span></td>
              {canEdit && (
                <td>
                  <button className="btn secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => toggleStatus(s)}>
                    {s.status === 'active' ? 'Deactivate' : 'Reactivate'}
                  </button>
                </td>
              )}
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr><td colSpan={canEdit ? 7 : 6}><div className="empty-state">No staff records found.</div></td></tr>
          )}
        </tbody>
      </table>
    </>
  )
}
