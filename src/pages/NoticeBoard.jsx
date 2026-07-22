import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function NoticeBoard() {
  const { role, session } = useAuth()
  const canPost = ['admin', 'teacher'].includes(role)

  const [notices, setNotices] = useState([])
  const [classes, setClasses] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', target_class_id: '', expiry_date: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: n }, { data: c }] = await Promise.all([
      supabase.from('notices').select('*, classes(name, section)').order('publish_date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('classes').select('*').order('name'),
    ])
    setNotices(n || [])
    setClasses(c || [])
  }

  async function handlePost(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const { error } = await supabase.from('notices').insert({
      title: form.title,
      content: form.content,
      target_class_id: form.target_class_id || null,
      expiry_date: form.expiry_date || null,
      posted_by: session.user.id,
    })
    setSaving(false)
    if (error) { setError(error.message); return }
    setForm({ title: '', content: '', target_class_id: '', expiry_date: '' })
    setShowForm(false)
    load()
  }

  async function handleDelete(id) {
    await supabase.from('notices').delete().eq('id', id)
    load()
  }

  const today = new Date().toISOString().slice(0, 10)
  const active = notices.filter(n => !n.expiry_date || n.expiry_date >= today)
  const expired = notices.filter(n => n.expiry_date && n.expiry_date < today)

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Communication</span>
          <h2>Notice Board</h2>
        </div>
        {canPost && (
          <button className="btn" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : '+ Post Notice'}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          {error && <div className="alert error">{error}</div>}
          <form onSubmit={handlePost}>
            <div className="field">
              <label>Title</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="field">
              <label>Content</label>
              <textarea rows={4} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required />
            </div>
            <div className="form-row">
              <div className="field">
                <label>Audience</label>
                <select value={form.target_class_id} onChange={e => setForm({ ...form, target_class_id: e.target.value })}>
                  <option value="">All Classes</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''} only</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Expiry Date (optional)</label>
                <input type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} />
              </div>
            </div>
            <button className="btn" type="submit" disabled={saving}>{saving ? 'Posting…' : 'Post Notice'}</button>
          </form>
        </div>
      )}

      {active.length === 0 && <div className="empty-state">No notices posted yet.</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {active.map(n => (
          <div key={n.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontSize: 18 }}>{n.title}</h3>
                <div className="mono" style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                  {n.publish_date} · {n.classes ? `${n.classes.name}${n.classes.section ? ' - ' + n.classes.section : ''}` : 'All Classes'}
                  {n.expiry_date ? ` · Expires ${n.expiry_date}` : ''}
                </div>
              </div>
              {canPost && (role === 'admin' || n.posted_by === session.user.id) && (
                <button className="btn secondary" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => handleDelete(n.id)}>Delete</button>
              )}
            </div>
            <p style={{ marginTop: 12, marginBottom: 0, fontSize: 13.5, lineHeight: 1.6 }}>{n.content}</p>
          </div>
        ))}
      </div>

      {expired.length > 0 && (
        <details style={{ marginTop: 28 }}>
          <summary style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: 13 }}>Show {expired.length} expired notice(s)</summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
            {expired.map(n => (
              <div key={n.id} className="card" style={{ opacity: 0.6 }}>
                <h3 style={{ margin: '0 0 4px', fontFamily: 'var(--font-display)', fontSize: 18 }}>{n.title}</h3>
                <div className="mono" style={{ fontSize: 11.5, color: 'var(--muted)' }}>{n.publish_date} · Expired {n.expiry_date}</div>
                <p style={{ marginTop: 12, marginBottom: 0, fontSize: 13.5, lineHeight: 1.6 }}>{n.content}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </>
  )
}
