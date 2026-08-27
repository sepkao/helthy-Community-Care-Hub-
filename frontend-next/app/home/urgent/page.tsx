'use client';

import { useEffect, useState } from 'react';

type Patient = {
  id: number;
  name: string;
  age: number | null;
  risk_level: 'LOW' | 'HIGH' | 'NORMAL';
};

export default function UrgentPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // mock data (replace with API call later)
    setTimeout(() => {
      setPatients([
        { id: 1, name: 'John Smith', age: 68, risk_level: 'LOW' },
        { id: 2, name: 'Suda Sukjai', age: 74, risk_level: 'HIGH' },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    .up { font-family: 'Inter', sans-serif; }
    .page-title { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 24px; color: #000000; letter-spacing: -0.01em; }
    .page-sub   { font-size: 13px; color: #6b7280; margin-top: 3px; margin-bottom: 20px; }

    .table-wrap {
      background: #ffffff;
      border: 1px solid #e5e7eb; border-radius: 8px;
      overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; }
    th { padding: 12px 20px; text-align: left; font-size: 11px; font-weight: 700; color: #6b7280; letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap; }
    tbody tr { border-bottom: 1px solid #f1f5f9; }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: rgba(22,163,74,0.03); }
    td { padding: 14px 20px; font-size: 14px; color: #000000; }

    .risk-pill { display: inline-flex; align-items: center; gap: 6px; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .risk-dot { width: 7px; height: 7px; border-radius: 50%; }
    .loading-wrap { display: flex; justify-content: center; padding: 64px 0; }
    .spinner { width: 40px; height: 40px; border-radius: 50%; border: 3px solid #e2e8f0; border-top-color: #16a34a; animation: spin 0.75s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;

  const riskStyle: Record<Patient['risk_level'], { label: string; dot: string; bg: string; text: string }> = {
    LOW:    { label: 'Low',    dot: '#10b981', bg: '#ecfdf5', text: '#065f46' },
    NORMAL: { label: 'Normal', dot: '#64748b', bg: '#f1f5f9', text: '#475569' },
    HIGH:   { label: 'High',   dot: '#f97316', bg: '#fff7ed', text: '#9a3412' },
  };

  return (
    <div className="up">
      <style>{css}</style>

      <div>
        <h1 className="page-title">Urgent Recipients</h1>
        <p className="page-sub">High-risk recipients requiring attention</p>
      </div>

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Age</th>
                <th>Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => {
                const r = riskStyle[p.risk_level];
                return (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.age ?? '-'}</td>
                    <td>
                      <span className="risk-pill" style={{ background: r.bg, color: r.text }}>
                        <span className="risk-dot" style={{ background: r.dot }} />
                        {r.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
