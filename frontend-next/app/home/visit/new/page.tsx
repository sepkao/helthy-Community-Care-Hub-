'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ItemMenuList from '@/components/ItemMenuList';
import DateTimePicker from '@/components/DateTimePicker';

interface Elderly { id: number; full_name: string; }

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export default function NewVisitPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#16a34a', animation: 'spin 0.75s linear infinite' }} /></div>}>
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
  const [note, setNote] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [bp, setBp] = useState('');
  const [pulse, setPulse] = useState('');
  const [temp, setTemp] = useState('');
  const [resp, setResp] = useState('');       // อัตราการหายใจ
  const [spo2, setSpo2] = useState('');       // ออกซิเจนปลายนิ้ว
  const [sugar, setSugar] = useState('');     // น้ำตาลในเลือด
  const [weight, setWeight] = useState('');   // น้ำหนัก
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
        else setError('Unable to load recipients');
      } catch { setError('Connection error'); }
      finally { setLoading(false); }
    };
    fetchElderly();
  }, [router]);

  const handleSubmit = async () => {
    setSubmitting(true); setShowConfirm(false);
    try {
      const token = localStorage.getItem('token');
      const vitals = [
        bp && `BP: ${bp} mmHg`,
        pulse && `Pulse: ${pulse} bpm`,
        temp && `Temp: ${temp}°C`,
        resp && `Resp: ${resp} /min`,
        spo2 && `SpO2: ${spo2}%`,
        sugar && `Blood sugar: ${sugar} mg/dL`,
        weight && `Weight: ${weight} kg`,
      ].filter(Boolean).join(' | ');
      const fullNote = [vitals, note].filter(Boolean).join('\n');
      const res = await fetch(`${API_BASE}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          elderly_id: parseInt(selectedElderly), note: fullNote,
          visited_at: visitDate ? new Date(visitDate).toISOString() : undefined,
        })
      });
      const data = await res.json();
      if (data.success) router.push('/home/visit');
      else setError(data.message || 'Failed to save');
    } catch { setError('Error while saving'); }
    finally { setSubmitting(false); }
  };

  const selectedName = elderlyList.find(e => String(e.id) === selectedElderly)?.full_name;

  // ป้องกันชื่อซ้ำ — ต่อท้าย #id เฉพาะรายชื่อที่ซ้ำกัน เพื่อให้เลือกได้ถูกคนแม้ชื่อเหมือนกัน
  const nameCounts = elderlyList.reduce((acc, e) => { acc[e.full_name] = (acc[e.full_name] || 0) + 1; return acc; }, {} as Record<string, number>);
  const elderlyOption = (e: Elderly) => nameCounts[e.full_name] > 1 ? `${e.full_name} (#${e.id})` : e.full_name;
  const selectedOption = elderlyList.find(e => String(e.id) === selectedElderly);

  // ── input sanitizers: ตัวเลขเท่านั้น ──
  const onlyInt = (s: string) => s.replace(/[^\d]/g, '');
  const onlyDecimal = (s: string) => {
    const v = s.replace(/[^\d.]/g, '');
    const parts = v.split('.');
    return parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : v;
  };
  const onlyBP = (s: string) => {
    const v = s.replace(/[^\d/]/g, '');
    const parts = v.split('/');
    return parts.length > 2 ? parts[0] + '/' + parts.slice(1).join('') : v;
  };

  // Daily Vital Signs บังคับกรอกครบทุกช่อง (Detailed Notes ไม่บังคับ)
  const vitalsFilled = !!(bp && pulse && temp && resp && spo2 && sugar && weight);
  const canSave = !!selectedElderly && !!visitDate && vitalsFilled;

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    .nvp { font-family: 'Inter', sans-serif; max-width: 720px; margin: 0 auto; }

    .back-btn {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 13px; font-weight: 600; color: #64748b;
      cursor: pointer; margin-bottom: 20px;
      padding: 7px 14px; border-radius: 10px;
      border: 1.5px solid #e2e8f0; background: white; transition: all 0.15s;
    }
    .back-btn:hover { color: #16a34a; border-color: #bbf7d0; background: #f0fdf4; }

    .page-title { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 26px; color: #000000; letter-spacing: -0.02em; }
    .page-sub   { font-size: 13px; color: #6b7280; margin-top: 4px; margin-bottom: 20px; }

    .card {
      background: #ffffff;
      border: 1px solid #e5e7eb; border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04); overflow: hidden;
    }
    .sec { padding: 20px 24px; border-bottom: 1px solid #f1f5f9; }
    .sec:last-child { border-bottom: none; }
    .sec-title {
      font-size: 11px; font-weight: 700; color: #6b7280;
      text-transform: uppercase; letter-spacing: 0.08em;
      margin-bottom: 14px; display: flex; align-items: center; gap: 7px;
    }
    .sec-num {
      width: 20px; height: 20px; border-radius: 6px;
      background: #16a34a;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 11px; font-weight: 700; color: white; flex-shrink: 0;
    }

    .form-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 7px; }
    .form-group { margin-bottom: 14px; }
    .form-group:last-child { margin-bottom: 0; }
    .form-input, .form-select, .form-textarea {
      width: 100%; padding: 10px 14px; box-sizing: border-box;
      border: 1.5px solid #e2e8f0; border-radius: 11px;
      font-family: 'Inter', sans-serif; font-size: 14px; color: #000000;
      background: #f8fafc; outline: none; transition: all 0.15s;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus {
      border-color: #16a34a; background: white; box-shadow: 0 0 0 3px rgba(22,163,74,0.1);
    }
    .form-textarea { resize: none; }

    /* vitals */
    .vitals-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; min-width: 0; }
    .vital-box {
      background: #f8fafc; border: 1.5px solid #e2e8f0;
      border-radius: 12px; padding: 12px 12px; transition: all 0.15s;
      display: flex; flex-direction: column; gap: 8px; min-width: 0; overflow: hidden;
    }
    .vital-lbl { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; }
    .vital-row { display: flex; align-items: center; gap: 6px; }
    .vital-input {
      flex: 1; min-width: 0; outline: none;
      font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; color: #000000;
      padding: 6px 8px; border-radius: 8px; border: 1.5px solid #e2e8f0;
      background: white; transition: all 0.15s; width: 100%; box-sizing: border-box;
    }
    .vital-input:focus { border-color: #16a34a; box-shadow: 0 0 0 2px rgba(22,163,74,0.1); }
    .vital-input::-webkit-outer-spin-button,
    .vital-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .vital-input[type=number] { -moz-appearance: textfield; }
    .vital-unit { font-size: 11px; color: #6b7280; font-weight: 600; white-space: nowrap; flex-shrink: 0; min-width: 0; }


    @media (max-width: 500px) {
      .vitals-grid { grid-template-columns: 1fr 1fr; }
    }

    /* urgency */
    .urg-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; }
    .urg-btn {
      padding: 14px 8px; border-radius: 13px; border: 1.5px solid #e2e8f0;
      background: white; cursor: pointer; transition: all 0.15s;
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; color: #64748b;
    }
    .urg-dot { width: 12px; height: 12px; border-radius: 50%; }

    /* error */
    .err-box {
      background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px;
      padding: 11px 16px; margin-bottom: 16px; font-size: 13px; color: #dc2626;
    }

    /* submit */
    .btn-submit {
      width: 100%; padding: 13px; border-radius: 13px; border: none; cursor: pointer;
      background: #16a34a;
      color: white; font-family: 'Inter', sans-serif; font-size: 15px; font-weight: 700;
      box-shadow: 0 6px 20px rgba(22,163,74,0.28); transition: all 0.18s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(22,163,74,0.38); }
    .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }

    /* confirm modal */
    .overlay {
      position: fixed; inset: 0; z-index: 50;
      background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; padding: 20px;
    }
    .modal {
      background: white; border-radius: 8px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.16);
      padding: 26px; width: 100%; max-width: 380px;
    }
    .modal-title { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 20px; color: #000000; margin-bottom: 4px; }
    .modal-sub   { font-size: 13px; color: #64748b; margin-bottom: 18px; }
    .summary {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 13px;
      padding: 14px 16px; margin-bottom: 18px; display: flex; flex-direction: column; gap: 9px;
    }
    .sum-row { display: flex; justify-content: space-between; align-items: center; }
    .sum-lbl { font-size: 12px; color: #6b7280; font-weight: 600; }
    .sum-val { font-size: 13px; color: #000000; font-weight: 700; }
    .modal-btns { display: flex; gap: 10px; }
    .btn-back {
      flex: 1; padding: 11px; border-radius: 11px; border: 1.5px solid #e2e8f0;
      background: white; font-family: 'Inter', sans-serif;
      font-size: 14px; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.15s;
    }
    .btn-back:hover { background: #f1f5f9; }
    .btn-confirm {
      flex: 2; padding: 11px; border-radius: 11px; border: none;
      background: #16a34a;
      font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700;
      color: white; cursor: pointer; transition: all 0.18s;
      box-shadow: 0 4px 14px rgba(22,163,74,0.28);
    }
    .btn-confirm:hover { transform: translateY(-1px); }

    .loading-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px 0; }
    .spinner { width: 40px; height: 40px; border-radius: 50%; border: 3px solid #e2e8f0; border-top-color: #16a34a; animation: spin 0.75s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadein { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
    .fadein { animation: fadein 0.2s ease both; }
  `

  if (loading) return (
    <><style>{css}</style>
      <div className="loading-wrap"><div className="spinner" /><span style={{ fontSize: 13, color: '#6b7280' }}>Loading data...</span></div>
    </>
  )

  return (
    <div className="nvp">
      <style>{css}</style>

      <div className="back-btn" onClick={() => router.back()}>
        ← Back
      </div>

      <div className="page-title">Daily Health Check</div>
      <div className="page-sub">Daily health check for the recipient</div>

      {error && (
        <div className="err-box">
          {error}
        </div>
      )}

      <div className="card fadein">

        {/* 1 — Basic info */}
        <div className="sec">
          <div className="sec-title"><span className="sec-num">1</span>Basic Information</div>
          <div className="form-group">
            <label className="form-label">Recipient *</label>
            <ItemMenuList
              mode="dropdown"
              fullWidth
              placeholder="-- Select recipient --"
              items={elderlyList.map(elderlyOption)}
              activeItem={selectedOption ? elderlyOption(selectedOption) : ''}
              onSelect={(option) => {
                const found = elderlyList.find(e => elderlyOption(e) === option);
                if (found) setSelectedElderly(String(found.id));
              }}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Health Check Date & Time *</label>
            <DateTimePicker
              fullWidth
              value={visitDate}
              onChange={(d) => {
                const pad = (n: number) => String(n).padStart(2, '0');
                setVisitDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
              }}
            />
          </div>
        </div>

        {/* 2 — Daily Vital Signs */}
        <div className="sec">
          <div className="sec-title"><span className="sec-num">2</span>Daily Vital Signs <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>(all required, numbers only)</span></div>
          <div className="vitals-grid">
            <div className="vital-box">
              <div className="vital-lbl">Blood Pressure *</div>
              <div className="vital-row">
                <input className="vital-input" type="text" inputMode="numeric" placeholder="120/80" value={bp} onChange={e => setBp(onlyBP(e.target.value))} />
                <span className="vital-unit">mmHg</span>
              </div>
            </div>
            <div className="vital-box">
              <div className="vital-lbl">Pulse *</div>
              <div className="vital-row">
                <input className="vital-input" type="text" inputMode="numeric" placeholder="72" value={pulse} onChange={e => setPulse(onlyInt(e.target.value))} />
                <span className="vital-unit">bpm</span>
              </div>
            </div>
            <div className="vital-box">
              <div className="vital-lbl">Temperature *</div>
              <div className="vital-row">
                <input className="vital-input" type="text" inputMode="decimal" placeholder="36.5" value={temp} onChange={e => setTemp(onlyDecimal(e.target.value))} />
                <span className="vital-unit">°C</span>
              </div>
            </div>
            <div className="vital-box">
              <div className="vital-lbl">Respiratory Rate *</div>
              <div className="vital-row">
                <input className="vital-input" type="text" inputMode="numeric" placeholder="18" value={resp} onChange={e => setResp(onlyInt(e.target.value))} />
                <span className="vital-unit">/min</span>
              </div>
            </div>
            <div className="vital-box">
              <div className="vital-lbl">Oxygen (SpO2) *</div>
              <div className="vital-row">
                <input className="vital-input" type="text" inputMode="numeric" placeholder="98" value={spo2} onChange={e => setSpo2(onlyInt(e.target.value))} />
                <span className="vital-unit">%</span>
              </div>
            </div>
            <div className="vital-box">
              <div className="vital-lbl">Blood Sugar *</div>
              <div className="vital-row">
                <input className="vital-input" type="text" inputMode="numeric" placeholder="110" value={sugar} onChange={e => setSugar(onlyInt(e.target.value))} />
                <span className="vital-unit">mg/dL</span>
              </div>
            </div>
            <div className="vital-box">
              <div className="vital-lbl">Weight *</div>
              <div className="vital-row">
                <input className="vital-input" type="text" inputMode="decimal" placeholder="60" value={weight} onChange={e => setWeight(onlyDecimal(e.target.value))} />
                <span className="vital-unit">kg</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3 — Notes */}
        <div className="sec">
          <div className="sec-title"><span className="sec-num">3</span>Detailed Notes</div>
          <textarea className="form-textarea" rows={4}
            placeholder="Observed symptoms, treatment provided, recommendations for caregivers..."
            value={note} onChange={e => setNote(e.target.value)} />
        </div>

        {/* SUBMIT */}
        <div style={{ padding: '18px 24px' }}>
          <button className="btn-submit" disabled={!canSave || submitting} onClick={() => setShowConfirm(true)}>
            {submitting ? (
              <><div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #e5e7eb', borderTopColor: 'white', animation: 'spin 0.75s linear infinite' }} />Saving...</>
            ) : (
              <>Save Health Check</>
            )}
          </button>
        </div>

      </div>

      {/* CONFIRM MODAL */}
      {showConfirm && (
        <div className="overlay">
          <div className="modal fadein">
            <div className="modal-title">Confirm Save?</div>
            <div className="modal-sub">Review the details before saving</div>
            <div className="summary">
              <div className="sum-row">
                <span className="sum-lbl">Recipient</span>
                <span className="sum-val">{selectedName || '—'}</span>
              </div>
              <div className="sum-row">
                <span className="sum-lbl">Health Check Date</span>
                <span className="sum-val" style={{ fontSize: 12 }}>
                  {visitDate ? new Date(visitDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
              </div>
              {(bp || pulse || temp || resp || spo2 || sugar || weight) && (
                <div className="sum-row">
                  <span className="sum-lbl">Vital Signs</span>
                  <span className="sum-val" style={{ fontSize: 12 }}>
                    {[bp && `BP ${bp}`, pulse && `Pulse ${pulse}`, temp && `Temp ${temp}°C`, resp && `Resp ${resp}`, spo2 && `SpO2 ${spo2}%`, sugar && `Sugar ${sugar}`, weight && `Wt ${weight}kg`].filter(Boolean).join(' · ')}
                  </span>
                </div>
              )}
            </div>
            <div className="modal-btns">
              <button className="btn-back" onClick={() => setShowConfirm(false)}>Edit</button>
              <button className="btn-confirm" onClick={handleSubmit}>Confirm Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
