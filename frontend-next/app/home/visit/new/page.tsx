'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Elderly { id: number; full_name: string; }

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export default function NewVisitPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', animation: 'spin 0.75s linear infinite' }} /></div>}>
      <NewVisitContent />
    </Suspense>
  );
}

function NewVisitContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedId = searchParams.get('elderly_id');

  const [elderlyList, setElderlyList] = useState<Elderly[]>([]);
  const [selectedElderly, setSelectedElderly] = useState<string>(preSelectedId || '');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('low');
  const [note, setNote] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [bp, setBp] = useState('');
  const [pulse, setPulse] = useState('');
  const [temp, setTemp] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setVisitDate(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`);
  }, []);

  useEffect(() => {
    const role = localStorage.getItem('role');
    if (role === 'guardian') { router.push('/home'); return; }
    const fetchElderly = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/elderly`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) setElderlyList(data.data);
        else setError('ไม่สามารถดึงข้อมูลผู้สูงอายุได้');
      } catch { setError('เกิดข้อผิดพลาดในการเชื่อมต่อ'); }
      finally { setLoading(false); }
    };
    fetchElderly();
  }, [router]);

  const handleSubmit = async () => {
    setSubmitting(true); setShowConfirm(false);
    try {
      const token = localStorage.getItem('token');
      const vitals = [bp && `ความดัน: ${bp} mmHg`, pulse && `ชีพจร: ${pulse} bpm`, temp && `อุณหภูมิ: ${temp}°C`].filter(Boolean).join(' | ');
      const fullNote = [vitals, note].filter(Boolean).join('\n');
      const res = await fetch(`${API_BASE}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          elderly_id: parseInt(selectedElderly), urgency, note: fullNote,
          visited_at: visitDate ? new Date(visitDate).toISOString() : undefined,
        })
      });
      const data = await res.json();
      if (data.success) router.push('/home/visit');
      else setError(data.message || 'บันทึกไม่สำเร็จ');
    } catch { setError('เกิดข้อผิดพลาดในการบันทึก'); }
    finally { setSubmitting(false); }
  };

  const selectedName = elderlyList.find(e => String(e.id) === selectedElderly)?.full_name;
  const urgencyConfig = {
    low:    { label: 'เสี่ยงต่ำ 🟢', color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', text: '#065f46' },
    medium: { label: 'ปานกลาง 🟡',   color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
    high:   { label: 'สูง 🟠',          color: '#ef4444', bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
  }

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&family=DM+Serif+Display&display=swap');
    .nvp { font-family: 'Sarabun', sans-serif; max-width: 720px; margin: 0 auto; }

    .back-btn {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 13px; font-weight: 600; color: #64748b;
      cursor: pointer; margin-bottom: 20px;
      padding: 7px 14px; border-radius: 10px;
      border: 1.5px solid #e2e8f0; background: white; transition: all 0.15s;
    }
    .back-btn:hover { color: #3b82f6; border-color: #bfdbfe; background: #eff6ff; }

    .page-title { font-family: 'DM Serif Display', serif; font-size: 26px; color: #0f172a; letter-spacing: -0.02em; }
    .page-sub   { font-size: 13px; color: #94a3b8; margin-top: 4px; margin-bottom: 20px; }

    .card {
      background: rgba(255,255,255,0.88); backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.7); border-radius: 22px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06); overflow: hidden;
    }
    .sec { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
    .sec:last-child { border-bottom: none; }
    .sec-title {
      font-size: 11px; font-weight: 700; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.08em;
      margin-bottom: 14px; display: flex; align-items: center; gap: 7px;
    }
    .sec-num {
      width: 20px; height: 20px; border-radius: 6px;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: white; flex-shrink: 0;
    }

    .form-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 7px; }
    .form-group { margin-bottom: 14px; }
    .form-group:last-child { margin-bottom: 0; }
    .form-input, .form-select, .form-textarea {
      width: 100%; padding: 10px 14px; box-sizing: border-box;
      border: 1.5px solid #e2e8f0; border-radius: 11px;
      font-family: 'Sarabun', sans-serif; font-size: 14px; color: #1e293b;
      background: #f8fafc; outline: none; transition: all 0.15s;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus {
      border-color: #3b82f6; background: white; box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
    }
    .form-textarea { resize: none; }

    /* vitals */
    .vitals-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; min-width: 0; }
    .vital-box {
      background: #f8fafc; border: 1.5px solid #e2e8f0;
      border-radius: 12px; padding: 12px 12px; transition: all 0.15s;
      display: flex; flex-direction: column; gap: 8px; min-width: 0; overflow: hidden;
    }
    .vital-lbl { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.06em; }
    .vital-row { display: flex; align-items: center; gap: 6px; }
    .vital-input {
      flex: 1; min-width: 0; outline: none;
      font-family: 'Sarabun', sans-serif; font-size: 13px; font-weight: 600; color: #1e293b;
      padding: 6px 8px; border-radius: 8px; border: 1.5px solid #e2e8f0;
      background: white; transition: all 0.15s; width: 100%; box-sizing: border-box;
    }
    .vital-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.1); }
    .vital-input::-webkit-outer-spin-button,
    .vital-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .vital-input[type=number] { -moz-appearance: textfield; }
    .vital-unit { font-size: 11px; color: #94a3b8; font-weight: 600; white-space: nowrap; flex-shrink: 0; min-width: 0; }


    @media (max-width: 500px) {
      .vitals-grid { grid-template-columns: 1fr 1fr; }
    }

    /* urgency */
    .urg-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
    .urg-btn {
      padding: 14px 8px; border-radius: 13px; border: 1.5px solid #e2e8f0;
      background: white; cursor: pointer; transition: all 0.15s;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      font-family: 'Sarabun', sans-serif; font-size: 14px; font-weight: 600; color: #64748b;
    }
    .urg-dot { width: 12px; height: 12px; border-radius: 50%; }

    /* error */
    .err-box {
      background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px;
      padding: 11px 16px; margin-bottom: 16px; font-size: 13px; color: #dc2626;
      display: flex; align-items: center; gap: 8px;
    }

    /* submit */
    .btn-submit {
      width: 100%; padding: 13px; border-radius: 13px; border: none; cursor: pointer;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: white; font-family: 'Sarabun', sans-serif; font-size: 15px; font-weight: 700;
      box-shadow: 0 6px 20px rgba(59,130,246,0.28); transition: all 0.18s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(59,130,246,0.38); }
    .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }

    /* confirm modal */
    .overlay {
      position: fixed; inset: 0; z-index: 50;
      background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .modal {
      background: white; border-radius: 22px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.16);
      padding: 26px; width: 100%; max-width: 380px;
    }
    .modal-title { font-family: 'DM Serif Display', serif; font-size: 20px; color: #0f172a; margin-bottom: 4px; }
    .modal-sub   { font-size: 13px; color: #64748b; margin-bottom: 18px; }
    .summary {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 13px;
      padding: 14px 16px; margin-bottom: 18px; display: flex; flex-direction: column; gap: 9px;
    }
    .sum-row { display: flex; justify-content: space-between; align-items: center; }
    .sum-lbl { font-size: 12px; color: #94a3b8; font-weight: 600; }
    .sum-val { font-size: 13px; color: #1e293b; font-weight: 700; }
    .modal-btns { display: flex; gap: 10px; }
    .btn-back {
      flex: 1; padding: 11px; border-radius: 11px; border: 1.5px solid #e2e8f0;
      background: white; font-family: 'Sarabun', sans-serif;
      font-size: 14px; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.15s;
    }
    .btn-back:hover { background: #f1f5f9; }
    .btn-confirm {
      flex: 2; padding: 11px; border-radius: 11px; border: none;
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      font-family: 'Sarabun', sans-serif; font-size: 14px; font-weight: 700;
      color: white; cursor: pointer; transition: all 0.18s;
      box-shadow: 0 4px 14px rgba(59,130,246,0.28);
    }
    .btn-confirm:hover { transform: translateY(-1px); }

    .loading-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 0; }
    .spinner { width: 40px; height: 40px; border-radius: 50%; border: 3px solid #e2e8f0; border-top-color: #3b82f6; animation: spin 0.75s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
    .fadein { animation: fadein 0.2s ease both; }
  `

  if (loading) return (
    <><style>{css}</style>
      <div className="loading-wrap"><div className="spinner" /><span style={{ fontSize: 13, color: '#94a3b8' }}>กำลังโหลดข้อมูล...</span></div>
    </>
  )

  return (
    <div className="nvp">
      <style>{css}</style>

      <div className="back-btn" onClick={() => router.back()}>
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
        ย้อนกลับ
      </div>

      <div className="page-title">บันทึกการเยี่ยมบ้าน</div>
      <div className="page-sub">กรอกข้อมูลการเยี่ยมและประเมินอาการเบื้องต้น</div>

      {error && (
        <div className="err-box">
          <svg width="15" height="15" fill="currentColor" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <div className="card fadein">

        {/* 1 — ข้อมูลพื้นฐาน */}
        <div className="sec">
          <div className="sec-title"><span className="sec-num">1</span>ข้อมูลพื้นฐาน</div>
          <div className="form-group">
            <label className="form-label">ผู้รับการดูแล *</label>
            <select className="form-select" value={selectedElderly} onChange={e => setSelectedElderly(e.target.value)}>
              <option value="">-- เลือกผู้รับการดูแล --</option>
              {elderlyList.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">วันที่และเวลาที่เยี่ยม *</label>
            <input type="datetime-local" className="form-input" value={visitDate} onChange={e => setVisitDate(e.target.value)} />
          </div>
        </div>

        {/* 2 — Vital Signs */}
        <div className="sec">
          <div className="sec-title"><span className="sec-num">2</span>ค่าสัญญาณชีพ <span style={{ fontSize: 10, color: '#cbd5e1', fontWeight: 500, textTransform: 'none', letterSpacing: 0 }}>(ถ้ามี)</span></div>
          <div className="vitals-grid">
            <div className="vital-box">
              <div className="vital-lbl">🩸 ความดัน</div>
              <div className="vital-row">
                <input className="vital-input" type="text" placeholder="120/80" value={bp} onChange={e => setBp(e.target.value)} />
                <span className="vital-unit">mmHg</span>
              </div>
            </div>
            <div className="vital-box">
              <div className="vital-lbl">💓 ชีพจร</div>
              <div className="vital-row">
                <input className="vital-input" type="number" placeholder="72" value={pulse} onChange={e => setPulse(e.target.value)} />
                <span className="vital-unit">bpm</span>
              </div>
            </div>
            <div className="vital-box">
              <div className="vital-lbl">🌡️ อุณหภูมิ</div>
              <div className="vital-row">
                <input className="vital-input" type="number" step="0.1" placeholder="36.5" value={temp} onChange={e => setTemp(e.target.value)} />
                <span className="vital-unit">°C</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 — ความเร่งด่วน */}
        <div className="sec">
          <div className="sec-title"><span className="sec-num">3</span>ระดับความเสี่ยง *</div>
          <div className="urg-grid">
            {(['low', 'medium', 'high'] as const).map(u => {
              const cfg = urgencyConfig[u]; const on = urgency === u
              return (
                <button key={u} className="urg-btn"
                  style={on ? { borderColor: cfg.color, background: cfg.bg, color: cfg.text } : {}}
                  onClick={() => setUrgency(u)}>
                  <span className="urg-dot" style={{ background: on ? cfg.color : '#cbd5e1' }} />
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 4 — บันทึก */}
        <div className="sec">
          <div className="sec-title"><span className="sec-num">4</span>บันทึกรายละเอียด</div>
          <textarea className="form-textarea" rows={4}
            placeholder="อาการที่พบ, การรักษาที่ให้, คำแนะนำสำหรับผู้ดูแล..."
            value={note} onChange={e => setNote(e.target.value)} />
        </div>

        {/* SUBMIT */}
        <div style={{ padding: '18px 24px' }}>
          <button className="btn-submit" disabled={!selectedElderly || submitting} onClick={() => setShowConfirm(true)}>
            {submitting ? (
              <><div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', animation: 'spin 0.75s linear infinite' }} />กำลังบันทึก...</>
            ) : (
              <><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>บันทึกการเยี่ยม</>
            )}
          </button>
        </div>

      </div>

      {/* CONFIRM MODAL */}
      {showConfirm && (
        <div className="overlay">
          <div className="modal fadein">
            <div className="modal-title">ยืนยันการบันทึก?</div>
            <div className="modal-sub">ตรวจสอบข้อมูลก่อนบันทึก</div>
            <div className="summary">
              <div className="sum-row">
                <span className="sum-lbl">ผู้รับการดูแล</span>
                <span className="sum-val">{selectedName || '—'}</span>
              </div>
              <div className="sum-row">
                <span className="sum-lbl">วันที่เยี่ยม</span>
                <span className="sum-val" style={{ fontSize: 12 }}>
                  {visitDate ? new Date(visitDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              </div>
              <div className="sum-row">
                <span className="sum-lbl">ความเร่งด่วน</span>
                <span className="sum-val" style={{ color: urgencyConfig[urgency].color }}>● {urgencyConfig[urgency].label}</span>
              </div>
              {(bp || pulse || temp) && (
                <div className="sum-row">
                  <span className="sum-lbl">Vital Signs</span>
                  <span className="sum-val" style={{ fontSize: 12 }}>
                    {[bp && `BP ${bp}`, pulse && `💓 ${pulse}`, temp && `🌡️ ${temp}°C`].filter(Boolean).join(' · ')}
                  </span>
                </div>
              )}
            </div>
            <div className="modal-btns">
              <button className="btn-back" onClick={() => setShowConfirm(false)}>แก้ไข</button>
              <button className="btn-confirm" onClick={handleSubmit}>✓ ยืนยันบันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}