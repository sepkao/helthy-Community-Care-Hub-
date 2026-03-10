'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo, Suspense } from 'react';

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
    <Suspense fallback={<div style={{display:'flex',justifyContent:'center',padding:'64px 0'}}><div style={{width:40,height:40,borderRadius:'50%',border:'3px solid #e2e8f0',borderTopColor:'#3b82f6',animation:'spin 0.75s linear infinite'}}/></div>}>
      <VisitContent />
    </Suspense>
  );
}

function VisitContent() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const elderlyId = searchParams.get('elderly_id');

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    if (storedRole) setRole(storedRole);
  }, []);

  const fetchVisits = async () => {
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
  };

  useEffect(() => { fetchVisits(); }, [elderlyId]);

  const toUTC = (d: string) => d.endsWith('Z') || d.includes('+') ? d : d + 'Z';
  const formatDate = (d: string) => new Date(toUTC(d)).toLocaleDateString('th-TH', {
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

  const clearFilter = () => { setDateFrom(''); setDateTo(''); }

  const hasFilter = dateFrom || dateTo

  const pageTitle = elderlyId && visits.length > 0
    ? `ประวัติการเยี่ยม — ${visits[0].patient_name}`
    : 'การเยี่ยมวันนี้';
  const pageSub = elderlyId
    ? 'แสดงเฉพาะรายการเยี่ยมของบุคคลนี้'
    : 'รายการบันทึกการเยี่ยมผู้รับการดูแล';

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&family=DM+Serif+Display&display=swap');
    .vp { font-family: 'Sarabun', sans-serif; }

    /* TOOLBAR */
    .toolbar {
      background: rgba(255,255,255,0.85); backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.7); border-radius: 20px;
      padding: 20px 24px; margin-bottom: 16px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.05);
    }
    .toolbar-top {
      display: flex; align-items: center; justify-content: space-between;
      gap: 16px; flex-wrap: wrap; margin-bottom: 16px;
    }
    .page-title {
      font-family: 'DM Serif Display', serif;
      font-size: 22px; color: #0f172a; letter-spacing: -0.01em;
      display: flex; align-items: center; gap: 10px;
    }
    .title-icon {
      width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      display: flex; align-items: center; justify-content: center; font-size: 18px;
    }
    .page-sub { font-size: 13px; color: #94a3b8; margin-top: 3px; }

    .btn-add {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 20px; border-radius: 12px; border: none; cursor: pointer;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: white; font-family: 'Sarabun', sans-serif;
      font-size: 14px; font-weight: 600;
      box-shadow: 0 4px 14px rgba(59,130,246,0.30); transition: all 0.18s;
    }
    .btn-add:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(59,130,246,0.40); }

    /* DATE FILTER ROW */
    .filter-row {
      display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
      padding-top: 16px; border-top: 1px solid #f1f5f9;
    }
    .filter-label {
      font-size: 12px; font-weight: 700; color: #94a3b8;
      letter-spacing: 0.05em; white-space: nowrap;
    }
    .date-group {
      display: flex; align-items: center; gap: 8px;
      background: #f8fafc; border: 1.5px solid #e2e8f0;
      border-radius: 12px; padding: 6px 12px;
      transition: border-color 0.15s;
    }
    .date-group:focus-within { border-color: #3b82f6; background: white; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
    .date-sep { font-size: 12px; color: #94a3b8; font-weight: 600; }
    .date-input {
      border: none; background: none; outline: none;
      font-family: 'Sarabun', sans-serif; font-size: 13px;
      color: #1e293b; cursor: pointer;
    }
    .date-input::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }

    /* quick presets */
    .preset-group { display: flex; gap: 6px; }
    .preset-btn {
      padding: 6px 12px; border-radius: 20px; border: 1.5px solid #e2e8f0;
      background: white; font-family: 'Sarabun', sans-serif;
      font-size: 12px; font-weight: 600; color: #64748b;
      cursor: pointer; transition: all 0.15s; white-space: nowrap;
    }
    .preset-btn:hover { background: #eff6ff; border-color: #bfdbfe; color: #3b82f6; }
    .preset-btn.on  { background: #eff6ff; border-color: #bfdbfe; color: #3b82f6; }

    .btn-clear {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 6px 12px; border-radius: 20px;
      border: 1.5px solid #fecaca; background: #fef2f2;
      font-family: 'Sarabun', sans-serif; font-size: 12px; font-weight: 600;
      color: #ef4444; cursor: pointer; transition: all 0.15s;
    }
    .btn-clear:hover { background: #fee2e2; }

    /* filter result badge */
    .filter-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 12px; border-radius: 20px;
      background: #eff6ff; border: 1px solid #bfdbfe;
      font-size: 12px; font-weight: 600; color: #3b82f6;
    }

    /* TABLE WRAP */
    .table-wrap {
      background: rgba(255,255,255,0.85); backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.7); border-radius: 20px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.05); overflow: hidden;
    }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; }
    th {
      padding: 12px 20px; text-align: left;
      font-size: 11px; font-weight: 700; color: #94a3b8;
      letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap;
    }
    tbody tr { border-bottom: 1px solid #f1f5f9; transition: background 0.12s; }
    tbody tr:last-child { border-bottom: none; }
    tbody tr:hover { background: rgba(59,130,246,0.03); }
    td { padding: 14px 20px; vertical-align: middle; }

    .td-patient { display: flex; align-items: center; gap: 11px; }
    .pt-avatar {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700; color: white;
    }
    .pt-name { font-size: 14px; font-weight: 600; color: #1e293b; }
    .td-date { font-size: 13px; color: #64748b; white-space: nowrap; }
    .td-note { font-size: 13px; color: #475569; max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .td-note.empty { color: #cbd5e1; font-style: italic; }
    .caregiver-pill {
      display: inline-flex; align-items: center; gap: 6px;
      background: #f1f5f9; border: 1px solid #e2e8f0;
      border-radius: 20px; padding: 4px 10px;
      font-size: 12px; font-weight: 600; color: #475569;
    }
    .caregiver-dot { width: 6px; height: 6px; border-radius: 50%; background: #3b82f6; flex-shrink: 0; }

    .count-bar {
      padding: 12px 24px; border-top: 1px solid #f1f5f9;
      font-size: 13px; color: #94a3b8; background: #fafbfc;
      display: flex; align-items: center; gap: 8px;
    }

    /* EMPTY */
    .empty-box { padding: 64px 24px; text-align: center; }
    .empty-icon {
      width: 60px; height: 60px; border-radius: 18px;
      background: #f1f5f9; margin: 0 auto 14px;
      display: flex; align-items: center; justify-content: center; font-size: 26px;
    }
    .empty-title { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 5px; }
    .empty-sub   { font-size: 13px; color: #94a3b8; }

    .loading-wrap { display: flex; justify-content: center; padding: 64px 0; }
    .spinner { width: 40px; height: 40px; border-radius: 50%; border: 3px solid #e2e8f0; border-top-color: #3b82f6; animation: spin 0.75s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;

  // preset helpers
  const setPreset = (type: 'today' | 'week' | 'month') => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
    const today = fmt(now)
    if (type === 'today') { setDateFrom(today); setDateTo(today) }
    if (type === 'week') {
      const mon = new Date(now); mon.setDate(now.getDate() - now.getDay() + 1)
      setDateFrom(fmt(mon)); setDateTo(today)
    }
    if (type === 'month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1)
      setDateFrom(fmt(first)); setDateTo(today)
    }
  }

  const isPreset = (type: 'today' | 'week' | 'month') => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
    const today = fmt(now)
    if (type === 'today') return dateFrom === today && dateTo === today

    if (type === 'month') {
      const first = fmt(new Date(now.getFullYear(), now.getMonth(), 1))
      return dateFrom === first && dateTo === today
    }
    return false
  }

  return (
    <div className="vp">
      <style>{css}</style>

      {/* TOOLBAR */}
      <div className="toolbar">
        <div className="toolbar-top">
          <div>
            <div className="page-title">
              <span className="title-icon">📅</span>
              {pageTitle}
            </div>
            <div className="page-sub">{pageSub}</div>
          </div>
          {role !== 'guardian' && (
            <button className="btn-add" onClick={() => router.push('/home/visit/new')}>
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              เพิ่มการเยี่ยม
            </button>
          )}
        </div>

        {/* DATE FILTER */}
        <div className="filter-row">
          <span className="filter-label">📆 ช่วงวันที่</span>

          <div className="date-group">
            <input
              type="date" className="date-input"
              value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            />
            <span className="date-sep">—</span>
            <input
              type="date" className="date-input"
              value={dateTo} onChange={e => setDateTo(e.target.value)}
            />
          </div>

          <div className="preset-group">
            <button className={`preset-btn${isPreset('today') ? ' on' : ''}`} onClick={() => setPreset('today')}>วันนี้</button>
            <button className={`preset-btn${isPreset('month') ? ' on' : ''}`} onClick={() => setPreset('month')}>เดือนนี้</button>
          </div>

          {hasFilter && (
            <button className="btn-clear" onClick={clearFilter}>
              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="table-wrap">
        {loading ? (
          <div className="loading-wrap"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-box">
            <div className="empty-icon">{hasFilter ? '🔍' : '📝'}</div>
            <div className="empty-title">{hasFilter ? 'ไม่พบรายการในช่วงวันที่นี้' : 'ยังไม่มีข้อมูลการเยี่ยม'}</div>
            <div className="empty-sub">{hasFilter ? 'ลองเปลี่ยนช่วงวันที่หรือล้างตัวกรอง' : 'กดปุ่ม "เพิ่มการเยี่ยม" เพื่อเริ่มบันทึก'}</div>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>ผู้รับการดูแล</th>
                  <th>วันที่เยี่ยม</th>
                  <th>รายละเอียด</th>
                  <th>ผู้บันทึก</th>
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
                        {v.note || 'ไม่มีบันทึก'}
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
              {hasFilter && (
                <span className="filter-badge">
                  🔍 กรองแล้ว
                </span>
              )}
              แสดง {filtered.length} จาก {visits.length} รายการ
            </div>
          </>
        )}
      </div>
    </div>
  );
}