import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function Academics() {
  const { role, session } = useAuth()
  const isStaff = ['admin', 'teacher'].includes(role)
  return isStaff ? <StaffAcademics session={session} /> : <ParentResults />
}

function StaffAcademics({ session }) {
  const [subjects, setSubjects] = useState([])
  const [classes, setClasses] = useState([])
  const [exams, setExams] = useState([])

  const [subjectName, setSubjectName] = useState('')
  const [examForm, setExamForm] = useState({ name: '', class_id: '', term: '', academic_year: '2026-27', exam_date: '' })

  const [selectedExam, setSelectedExam] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [students, setStudents] = useState([])
  const [marks, setMarks] = useState({}) // student_id -> { marks_obtained, max_marks }
  const [loadingResults, setLoadingResults] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { loadBase() }, [])

  async function loadBase() {
    const [{ data: subs }, { data: cls }, { data: ex }] = await Promise.all([
      supabase.from('subjects').select('*').order('name'),
      supabase.from('classes').select('*').order('name'),
      supabase.from('exams').select('*, classes(name, section)').order('exam_date', { ascending: false }),
    ])
    setSubjects(subs || [])
    setClasses(cls || [])
    setExams(ex || [])
  }

  async function addSubject(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.from('subjects').insert({ name: subjectName })
    if (error) return setError(error.message)
    setSubjectName('')
    loadBase()
  }

  async function addExam(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.from('exams').insert({ ...examForm, exam_date: examForm.exam_date || null })
    if (error) return setError(error.message)
    setExamForm({ ...examForm, name: '', exam_date: '' })
    loadBase()
  }

  useEffect(() => {
    if (selectedExam && selectedSubject) loadResultsEntry()
    else { setStudents([]); setMarks({}) }
    // eslint-disable-next-line
  }, [selectedExam, selectedSubject])

  async function loadResultsEntry() {
    setLoadingResults(true)
    setSavedMsg('')
    const exam = exams.find(e => e.id === selectedExam)
    if (!exam) { setLoadingResults(false); return }
    const [{ data: studentRows }, { data: existing }] = await Promise.all([
      supabase.from('students').select('id, full_name, admission_no').eq('class_id', exam.class_id).eq('status', 'active').order('full_name'),
      supabase.from('exam_results').select('*').eq('exam_id', selectedExam).eq('subject_id', selectedSubject),
    ])
    setStudents(studentRows || [])
    const initial = {}
    ;(studentRows || []).forEach(s => { initial[s.id] = { marks_obtained: '', max_marks: '100' } })
    ;(existing || []).forEach(r => { initial[r.student_id] = { marks_obtained: String(r.marks_obtained), max_marks: String(r.max_marks) } })
    setMarks(initial)
    setLoadingResults(false)
  }

  function updateMark(studentId, field, value) {
    setMarks(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }))
  }

  async function saveResults() {
    setSavedMsg('')
    const rows = students
      .filter(s => marks[s.id]?.marks_obtained !== '')
      .map(s => ({
        exam_id: selectedExam,
        student_id: s.id,
        subject_id: selectedSubject,
        marks_obtained: Number(marks[s.id].marks_obtained),
        max_marks: Number(marks[s.id].max_marks || 100),
        entered_by: session.user.id,
      }))
    if (rows.length === 0) return
    const { error } = await supabase.from('exam_results').upsert(rows, { onConflict: 'exam_id,student_id,subject_id' })
    if (!error) setSavedMsg('Results saved.')
  }

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Academics</span>
          <h2>Exams &amp; Results</h2>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Add Subject</h3>
          <form onSubmit={addSubject}>
            <div className="field">
              <label>Subject Name</label>
              <input value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="Mathematics" required />
            </div>
            <button className="btn" type="submit">Add Subject</button>
          </form>
          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {subjects.map(s => <span key={s.id} className="badge partial">{s.name}</span>)}
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Create Exam</h3>
          <form onSubmit={addExam}>
            <div className="field">
              <label>Exam Name</label>
              <input value={examForm.name} onChange={e => setExamForm({ ...examForm, name: e.target.value })} placeholder="Mid Term" required />
            </div>
            <div className="form-row">
              <div className="field">
                <label>Class</label>
                <select value={examForm.class_id} onChange={e => setExamForm({ ...examForm, class_id: e.target.value })} required>
                  <option value="">Select class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Term</label>
                <input value={examForm.term} onChange={e => setExamForm({ ...examForm, term: e.target.value })} placeholder="Term 1" required />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Academic Year</label>
                <input value={examForm.academic_year} onChange={e => setExamForm({ ...examForm, academic_year: e.target.value })} required />
              </div>
              <div className="field">
                <label>Exam Date</label>
                <input type="date" value={examForm.exam_date} onChange={e => setExamForm({ ...examForm, exam_date: e.target.value })} />
              </div>
            </div>
            <button className="btn" type="submit">Create Exam</button>
          </form>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Enter Results</h3>
        <div className="form-row">
          <div className="field">
            <label>Exam</label>
            <select value={selectedExam} onChange={e => setSelectedExam(e.target.value)}>
              <option value="">Select exam</option>
              {exams.map(ex => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} — {ex.classes?.name}{ex.classes?.section ? ` - ${ex.classes.section}` : ''} ({ex.term}, {ex.academic_year})
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Subject</label>
            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
              <option value="">Select subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        {loadingResults && <div className="empty-state">Loading students…</div>}

        {!loadingResults && students.length > 0 && (
          <>
            <table className="ledger">
              <thead>
                <tr><th>Admission No.</th><th>Name</th><th>Marks Obtained</th><th>Max Marks</th></tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <td className="mono">{s.admission_no}</td>
                    <td>{s.full_name}</td>
                    <td>
                      <input type="number" min="0" style={{ width: 90 }}
                        value={marks[s.id]?.marks_obtained ?? ''}
                        onChange={e => updateMark(s.id, 'marks_obtained', e.target.value)} />
                    </td>
                    <td>
                      <input type="number" min="1" style={{ width: 90 }}
                        value={marks[s.id]?.max_marks ?? '100'}
                        onChange={e => updateMark(s.id, 'max_marks', e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="btn" onClick={saveResults}>Save Results</button>
              {savedMsg && <span style={{ color: 'var(--green)', fontSize: 13.5 }}>{savedMsg}</span>}
            </div>
          </>
        )}
      </div>
    </>
  )
}

function ParentResults() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('exam_results')
      .select('*, exams(name, term, academic_year), subjects(name)')
      .then(({ data }) => {
        setResults(data || [])
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="empty-state">Loading…</div>

  const byExam = {}
  results.forEach(r => {
    const key = r.exams ? `${r.exams.name} — ${r.exams.term} (${r.exams.academic_year})` : 'Exam'
    if (!byExam[key]) byExam[key] = []
    byExam[key].push(r)
  })

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Academics</span>
          <h2>Exam Results</h2>
        </div>
      </div>

      {Object.keys(byExam).length === 0 && <div className="empty-state">No results published yet.</div>}

      {Object.entries(byExam).map(([examLabel, rows]) => (
        <div key={examLabel} className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)', fontSize: 18 }}>{examLabel}</h3>
          <table className="ledger">
            <thead><tr><th>Subject</th><th>Marks</th><th>Max</th><th>%</th></tr></thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>{r.subjects?.name}</td>
                  <td className="num">{r.marks_obtained}</td>
                  <td className="num">{r.max_marks}</td>
                  <td className="num">{((r.marks_obtained / r.max_marks) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </>
  )
}
