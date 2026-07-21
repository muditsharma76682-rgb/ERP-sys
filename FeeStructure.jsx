import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function FeeStructure() {
  const [classes, setClasses] = useState([])
  const [feeHeads, setFeeHeads] = useState([])
  const [structures, setStructures] = useState([])
  const [error, setError] = useState('')

  const [classForm, setClassForm] = useState({ name: '', section: '', academic_year: '2026-27' })
  const [headForm, setHeadForm] = useState({ name: '' })
  const [structForm, setStructForm] = useState({ class_id: '', fee_head_id: '', term: '', academic_year: '2026-27', amount: '', due_date: '' })

  useEffect(() => { load() }, [])

  async function load() {
    const [{ data: c }, { data: h }, { data: s }] = await Promise.all([
      supabase.from('classes').select('*').order('name'),
      supabase.from('fee_heads').select('*').order('name'),
      supabase.from('fee_structures').select('*, classes(name, section), fee_heads(name)').order('academic_year', { ascending: false }),
    ])
    setClasses(c || [])
    setFeeHeads(h || [])
    setStructures(s || [])
  }

  async function addClass(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.from('classes').insert(classForm)
    if (error) return setError(error.message)
    setClassForm({ name: '', section: '', academic_year: classForm.academic_year })
    load()
  }

  async function addHead(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.from('fee_heads').insert(headForm)
    if (error) return setError(error.message)
    setHeadForm({ name: '' })
    load()
  }

  async function addStructure(e) {
    e.preventDefault()
    setError('')
    const { error } = await supabase.from('fee_structures').insert({
      ...structForm,
      amount: Number(structForm.amount),
      due_date: structForm.due_date || null,
    })
    if (error) return setError(error.message)
    setStructForm({ ...structForm, term: '', amount: '', due_date: '' })
    load()
  }

  return (
    <>
      <div className="page-header">
        <div>
          <span className="eyebrow">Configuration</span>
          <h2>Fee Structure</h2>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Add Class</h3>
          <form onSubmit={addClass}>
            <div className="form-row">
              <div className="field">
                <label>Class Name</label>
                <input value={classForm.name} onChange={e => setClassForm({ ...classForm, name: e.target.value })} placeholder="Class 6" required />
              </div>
              <div className="field">
                <label>Section</label>
                <input value={classForm.section} onChange={e => setClassForm({ ...classForm, section: e.target.value })} placeholder="A" />
              </div>
            </div>
            <div className="field">
              <label>Academic Year</label>
              <input value={classForm.academic_year} onChange={e => setClassForm({ ...classForm, academic_year: e.target.value })} required />
            </div>
            <button className="btn" type="submit">Add Class</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Add Fee Head</h3>
          <form onSubmit={addHead}>
            <div className="field">
              <label>Name</label>
              <input value={headForm.name} onChange={e => setHeadForm({ name: e.target.value })} placeholder="Tuition Fee" required />
            </div>
            <button className="btn" type="submit">Add Fee Head</button>
          </form>
          <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {feeHeads.map(h => (
              <span key={h.id} className="badge partial">{h.name}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 28 }}>
        <h3 style={{ marginTop: 0, fontFamily: 'var(--font-display)' }}>Set Fee Amount</h3>
        <form onSubmit={addStructure}>
          <div className="form-row">
            <div className="field">
              <label>Class</label>
              <select value={structForm.class_id} onChange={e => setStructForm({ ...structForm, class_id: e.target.value })} required>
                <option value="">Select class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.section ? ` - ${c.section}` : ''}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Fee Head</label>
              <select value={structForm.fee_head_id} onChange={e => setStructForm({ ...structForm, fee_head_id: e.target.value })} required>
                <option value="">Select fee head</option>
                {feeHeads.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Term</label>
              <input value={structForm.term} onChange={e => setStructForm({ ...structForm, term: e.target.value })} placeholder="Term 1" required />
            </div>
            <div className="field">
              <label>Academic Year</label>
              <input value={structForm.academic_year} onChange={e => setStructForm({ ...structForm, academic_year: e.target.value })} required />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Amount (₹)</label>
              <input type="number" min="0" value={structForm.amount} onChange={e => setStructForm({ ...structForm, amount: e.target.value })} required />
            </div>
            <div className="field">
              <label>Due Date</label>
              <input type="date" value={structForm.due_date} onChange={e => setStructForm({ ...structForm, due_date: e.target.value })} />
            </div>
          </div>
          <button className="btn" type="submit">Save Fee Amount</button>
        </form>
      </div>

      <table className="ledger">
        <thead>
          <tr>
            <th>Class</th><th>Fee Head</th><th>Term</th><th>Year</th><th>Due Date</th><th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {structures.map(s => (
            <tr key={s.id}>
              <td>{s.classes?.name}{s.classes?.section ? ` - ${s.classes.section}` : ''}</td>
              <td>{s.fee_heads?.name}</td>
              <td>{s.term}</td>
              <td className="mono">{s.academic_year}</td>
              <td className="mono">{s.due_date || '—'}</td>
              <td className="num">₹{Number(s.amount).toLocaleString('en-IN')}</td>
            </tr>
          ))}
          {structures.length === 0 && <tr><td colSpan={6}><div className="empty-state">No fee structures set yet.</div></td></tr>}
        </tbody>
      </table>
    </>
  )
}
