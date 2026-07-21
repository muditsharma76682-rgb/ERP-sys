export default function Receipt({ data, onClose }) {
  if (!data) return null

  return (
    <div className="receipt-overlay">
      <div className="receipt-toolbar no-print">
        <button className="btn secondary" onClick={onClose}>Close</button>
        <button className="btn" onClick={() => window.print()}>Print</button>
      </div>
      <div className="receipt-print-area">
        <div className="receipt-paper">
          <div className="receipt-header">
            <h2>Navyug Public School</h2>
            <div className="receipt-sub">Hamidpur, Aligarh</div>
            <div className="receipt-title">Fee Receipt</div>
          </div>

          <div className="ledger-row">
            <span className="label">Receipt No.</span>
            <span className="fill"></span>
            <span className="value receipt-no">{data.receipt_no}</span>
          </div>
          <div className="ledger-row">
            <span className="label">Date</span>
            <span className="fill"></span>
            <span className="value">{data.payment_date}</span>
          </div>
          <div className="ledger-row">
            <span className="label">Student Name</span>
            <span className="fill"></span>
            <span className="value">{data.student_name}</span>
          </div>
          <div className="ledger-row">
            <span className="label">Admission No.</span>
            <span className="fill"></span>
            <span className="value">{data.admission_no}</span>
          </div>
          <div className="ledger-row">
            <span className="label">Class</span>
            <span className="fill"></span>
            <span className="value">{data.class_name || '—'}</span>
          </div>
          <div className="ledger-row">
            <span className="label">Fee Head</span>
            <span className="fill"></span>
            <span className="value">{data.fee_head_name}</span>
          </div>
          <div className="ledger-row">
            <span className="label">Term</span>
            <span className="fill"></span>
            <span className="value">{data.term} ({data.academic_year})</span>
          </div>
          <div className="ledger-row">
            <span className="label">Payment Mode</span>
            <span className="fill"></span>
            <span className="value" style={{ textTransform: 'capitalize' }}>{data.payment_mode}</span>
          </div>
          {data.remarks && (
            <div className="ledger-row">
              <span className="label">Remarks</span>
              <span className="fill"></span>
              <span className="value">{data.remarks}</span>
            </div>
          )}

          <div className="receipt-amount">
            <span>Amount Paid</span>
            <span className="receipt-amount-value">₹{Number(data.amount).toLocaleString('en-IN')}</span>
          </div>

          <div className="receipt-footer">
            <div className="receipt-signature">
              <div className="sig-line"></div>
              <div className="sig-label">Received By</div>
            </div>
            <div className="receipt-signature">
              <div className="sig-line"></div>
              <div className="sig-label">Authorized Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
