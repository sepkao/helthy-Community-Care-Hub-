'use client';
import { useSearchParams } from 'next/navigation';
import { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import DateRangePicker from '@/components/DateRangePicker';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

type Visit = {
  id: number;
  patient_name: string;
  caregiver_name: string;
  visit_date: string;
  visited_at: string;
  note: string;
};

export default function VisitPage() {
  return (
    <Suspense fallback={<div style={{display:'flex',justifyContent:'center',padding:'64px 0'}}><div style={{width:40,height:40,borderRadius:'50%',border:'3px solid #e2e8f0',borderTopColor:'#16a34a',animation:'spin 0.75s linear infinite'}}/></div>}>
      <VisitContent />
    </Suspense>
  );
}

// ค่าเริ่มต้นของช่วงวันที่ — 30 วันล่าสุด (รูปแบบ YYYY-MM-DD)
const pad2 = (n: number) => String(n).padStart(2, '0');
const toISO = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const defaultDateTo = () => toISO(new Date());
const defaultDateFrom = () => { const d = new Date(); d.setDate(d.getDate() - 29); return toISO(d); };

function VisitContent() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(defaultDateFrom);
  const [dateTo, setDateTo]     = useState(defaultDateTo);
  const searchParams = useSearchParams();
  const elderlyId = searchParams.get('elderly_id');

  const fetchVisits = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `${API_BASE}/visits`;
      if (elderlyId) url += `?elderly_id=${elderlyId}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setVisits(data.data);
    } catch (error) {
      console.error('Failed to fetch visits:', error);
    } finally {
      setLoading(false);
    }
  }, [elderlyId]);

  useEffect(() => { fetchVisits(); }, [fetchVisits]);

  const toUTC = (d: string) => d.endsWith('Z') || d.includes('+') ? d : d + 'Z';
  const formatDate = (d: string) => new Date(toUTC(d)).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  // ── client-side date filter ──
  const filtered = useMemo(() => {
    return visits.filter(v => {
      const ts = new Date(toUTC(v.visited_at)).getTime()
      if (dateFrom) {
        const from = new Date(dateFrom + 'T00:00:00').getTime()
        if (ts < from) return false
      }
      if (dateTo) {
        const to = new Date(dateTo + 'T23:59:59').getTime()
        if (ts > to) return false
      }
      return true
    })
  }, [visits, dateFrom, dateTo])

  const pageTitle = elderlyId && visits.length > 0
    ? `Health Check History — ${visits[0].patient_name}`
    : "Today's Health Checks";
  const pageSub = elderlyId
    ? 'Showing health checks for this recipient only'
    : 'Daily health check records';

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    .vp { font-family: 'Inter', sans-serif; }

    /* TOOLBAR */
    .toolbar {
      background: #ffffff;
      border: 1px solid #e5e7eb; border-radius: 8px;
      padding: 20px 24px; margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .toolbar-top {
      display: flex; align-items: center; justify-content: space-between;
      gap: 16px; flex-wrap: wrap; margin-bottom: 16px;
    }
    .page-title {
      font-family: 'Inter', sans-serif; font-weight: 700;
      font-size: 24px; color: #000000; letter-spacing: -0.01em;
    }
    .page-sub { font-size: 13px; color: #6b7280; margin-top: 3px; }

    .btn-add {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: 12px; border: none; cursor: pointer;
      background: #16a34a;
      color: white; font-family: 'Inter', sans-serif;
      font-size: 14px; font-weight: 600;
      box-shadow: 0 4px 14px rgba(22,163,74,0.30); transition: all 0.18s;
    }
    .btn-add:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(22,163,74,0.40); }

    /* DATE FILTER ROW */
    .filter-row {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      padding-top: 16px; border-top: 1px solid #f1f5f9;
    }
    .filter-label {
      font-size: 12px; font-weight: 700; color: #6b7280;
      letter-spacing: 0.05em; white-space: nowrap;
    }

    /* filter result badge */
    .filter-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 12px; border-radius: 20px;
      background: #f0fdf4; border: 1px solid #bbf7d0;
      font-size: 12px; font-weight: 600; color: #16a34a;
    }

    /* TABLE WRAP */
    .table-wrap {
      background: #ffffff;
      border: 1px solid #e5e7eb; border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04); overflow: hidden;
    }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; }
    th {
      padding: 12px 20px; text-align: left;
      font-size: 11px; font-weight: 700; color: #6b7280;
      letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap;
    }
    tbody tr { border-bottom: 1px solid #f1f5f9; transition: background 0.12s; }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: rgba(22,163,74,0.03); }
    td { padding: 14px 20px; vertical-align: middle; }

    .td-patient { display: flex; align-items: center; gap: 11px; }
    .pt-avatar {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      background: #16a34a;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700; color: white;
    }
    .pt-name { font-size: 14px; font-weight: 600; color: #000000; }
    .td-date { font-size: 13px; color: #64748b; white-space: nowrap; }
    .td-note { font-size: 13px; color: #475569; max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .td-note.empty { color: #cbd5e1; font-style: italic; }
    .caregiver-pill {
      display: inline-flex; align-items: center; gap: 6px;
      background: #f1f5f9; border: 1px solid #e2e8f0;
      border-radius: 20px; padding: 4px 10px;
      font-size: 12px; font-weight: 600; color: #475569;
    }
    .caregiver-dot { width: 6px; height: 6px; border-radius: 50%; background: #16a34a; flex-shrink: 0; }

    .count-bar {
      padding: 12px 24px; border-top: 1px solid #f1f5f9;
      font-size: 13px; color: #6b7280; background: #fafbfc;
      display: flex; align-items: center; gap: 8px;
    }

    /* EMPTY */
    .empty-box { padding: 64px 24px; text-align: center; }
    .empty-title { font-size: 16px; font-weight: 700; color: #000000; margin-bottom: 5px; }
    .empty-sub   { font-size: 13px; color: #6b7280; }

    .loading-wrap { display: flex; justify-content: center; padding: 64px 0; }
    .spinner { width: 40px; height: 40px; border-radius: 50%; border: 3px solid #e2e8f0; border-top-color: #16a34a; animation: spin 0.75s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;

  return (
    <div className="vp">
      <style>{css}</style>

      {/* TOOLBAR */}
      <div className="toolbar">
        <div className="toolbar-top">
          <div>
            <div className="page-title">{pageTitle}</div>
            <div className="page-sub">{pageSub}</div>
          </div>
        </div>

        {/* DATE FILTER */}
        <div className="filter-row">
          <span className="filter-label">Date Range</span>

          <DateRangePicker
            startDate={dateFrom}
            endDate={dateTo}
            onRangeChange={(start, end) => { setDateFrom(toISO(start)); setDateTo(toISO(end)); }}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="table-wrap">
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-box">
            <div className="empty-title">{visits.length === 0 ? 'No health check records yet' : 'No health checks found in this date range'}</div>
            <div className="empty-sub">{visits.length === 0 ? 'Use "New Health Check" in the sidebar to start recording' : 'Try selecting a different date range'}</div>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Health Check Date</th>
                  <th>Details</th>
                  <th>Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <div className="td-patient">
                        <div className="pt-avatar">{v.patient_name.charAt(0)}</div>
                        <div className="pt-name">{v.patient_name}</div>
                      </div>
                    </td>
                    <td><span className="td-date">{formatDate(v.visited_at)}</span></td>
                    <td>
                      <span className={`td-note${!v.note ? ' empty' : ''}`}>
                        {v.note || 'No notes'}
                      </span>
                    </td>
                    <td>
                      <span className="caregiver-pill">
                        <span className="caregiver-dot" />
                        {v.caregiver_name}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="count-bar">
              <span className="filter-badge">Filtered</span>
              Showing {filtered.length} of {visits.length} records
            </div>
          </>
        )}
      </div>
    </div>
  );
}
