import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const STATUSES = [
  { value: 'present', label: 'Present', cls: 'paid' },
  { value: 'absent', label: 'Absent', cls: 'due' },
  { value: 'leave', label: 'Leave', cls: 'partial' },
  { value: 'half_day', label: 'Half Day', cls: 'partial' },
]

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function Attendance() {
  const { role, session } = useAuth()
  const isStaff = ['admin', 'accountant', 'teacher'].includes(role)

  return isStaff ? <StaffAttendance session={session} /> : <ParentAttendance />
}

function StaffAttendance({ session }) {
  const [classes, setClasses] = useState([])
  const [classId, setClassId] = useState('')
  const [date, setDate] = useState(todayStr())
  const [students, setStudents] = useState([])
  const [marks, setMarks] = useState({}) // student_id -> status
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')

  useEffect(() => {
    supabase.from('classes').select('*').order('name').then(({ data }) => setClasses(data || []))
  }, [])

  useEffect(() => {
    if (classId) loadStudents()
    else { setStudents([]); setMarks({}) }
    // eslint-disable-next-line
  }, [classId, date])

  async function loadStudents() {
    setLoading(true)
    setSavedMsg('')
    const [{ data: studentRows }, { data: existing }] = await Promise.all([
      supabase.from('students').select('id, full_name, admission_no').eq('class_id', classId).eq('status', 'active').order('full_name'),
      supabase.from('attendance').select('student_id, status').eq('class_id', classId).eq('date', date),
    ])
    setStudents(studentRows || [])
    const initial = {}
    ;(studentRows || []).forEach(s => { initial[s.id] = 'present' })
    ;(existing || []).forEach(a => { initial[a.student_id] = a.status })
    setMarks(initial)
    setLoading(false)
  }

  function setMark(studentId, status) {
    setMarks(prev => ({ ...prev, [studentId]: status }))
  }

  function markAll(status) {
    const next = {}
    students.forEach(s => { next[s.id] = status })
    setMarks(next)
  }

  async function handleSave() {
    setSaving(true)
    setSavedMsg('')
    const rows = students.map(s => ({
      student_id: s.id,
      class_id: classId,
      date,
      status: marks[s.id] || 'present',
      marked_by: session.user.id,
    }))
    const { error } = await supabase.from('attendance').upsert(rows, { onConflict: 'student_id,date' })
    setSaving(false)
    if (!error) setSavedMsg('Attendance saved.')
  }

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Register</span>
          <h2>Attendance</h2>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="form-row">
          <div className="field">
            <label>Class</label>
            <select value={classId} onChange={e => setClassId(e.target.value)}>
              <option value="">Select class</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} max={todayStr()} />
          </div>
        </div>
      </div>

      {loading && <div className="empty-state">Loading students…</div>}

      {!loading && classId && students.length > 0 && (
        <>
          <div className="toolbar">
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn secondary" onClick={() => markAll('present')}>Mark all Present</button>
              <button className="btn secondary" onClick={() => markAll('absent')}>Mark all Absent</button>
            </div>
            <span className="mono" style={{ color: 'var(--muted)', fontSize: 12.5 }}>{students.length} students</span>
          </div>

          <table className="ledger">
            <thead>
              <tr>
                <th>Admission No.</th>
                <th>Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map(s => (
                <tr key={s.id}>
                  <td className="mono">{s.admission_no}</td>
                  <td>{s.full_name}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {STATUSES.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setMark(s.id, opt.value)}
                          className={`badge ${opt.cls}`}
                          style={{
                            cursor: 'pointer',
                            border: marks[s.id] === opt.value ? '2px solid var(--ink)' : '2px solid transparent',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Attendance'}
            </button>
            {savedMsg && <span style={{ color: 'var(--green)', fontSize: 13.5 }}>{savedMsg}</span>}
          </div>
        </>
      )}

      {!loading && classId && students.length === 0 && (
        <div className="empty-state">No active students in this class.</div>
      )}
    </>
  )
}

function ParentAttendance() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('attendance')
      .select('*, students(full_name)')
      .order('date', { ascending: false })
      .limit(60)
      .then(({ data }) => {
        setRecords(data || [])
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="empty-state">Loading…</div>

  const presentCount = records.filter(r => r.status === 'present').length
  const absentCount = records.filter(r => r.status === 'absent').length
  const childName = records[0]?.students?.full_name

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Register</span>
          <h2>{childName ? `${childName}'s Attendance` : 'Attendance'}</h2>
        </div>
      </div>

      <div className="card-grid">
        <div className="card stat-card positive">
          <div className="stat-label">Present (last 60 records)</div>
          <div className="stat-value">{presentCount}</div>
        </div>
        <div className="card stat-card accent">
          <div className="stat-label">Absent (last 60 records)</div>
          <div className="stat-value">{absentCount}</div>
        </div>
      </div>

      <table className="ledger">
        <thead>
          <tr><th>Date</th><th>Status</th></tr>
        </thead>
        <tbody>
          {records.map(r => (
            <tr key={r.id}>
              <td className="mono">{r.date}</td>
              <td>
                <span className={`badge ${r.status === 'present' ? 'paid' : r.status === 'absent' ? 'due' : 'partial'}`}>
                  {r.status.replace('_', ' ')}
                </span>
              </td>
            </tr>
          ))}
          {records.length === 0 && (
            <tr><td colSpan={2}><div className="empty-state">No attendance records yet.</div></td></tr>
          )}
        </tbody>
      </table>
    </>
  )
}
