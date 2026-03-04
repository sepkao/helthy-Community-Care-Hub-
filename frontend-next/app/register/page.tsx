'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE

function NetworkBackground() {
  const nodes: [number, number][] = [
    [80, 120], [260, 60], [480, 200], [640, 80],
    [380, 380], [160, 320], [560, 360], [720, 260],
  ]
  const edges: [number, number][] = [
    [0,1],[1,2],[2,3],[1,4],[4,5],[2,6],[6,7],[3,7],[5,0],[4,6],
  ]
  return (
    <svg id="net-bg" viewBox="0 0 800 500" fill="none" style={{
      position: 'fixed', inset: 0, width: '100%', height: '100%',
      opacity: 0.15, pointerEvents: 'none', zIndex: 0,
      transition: 'transform 0.4s ease',
    }}>
      {edges.map(([a, b], i) => (
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke="#3b82f6" strokeWidth="1" />
      ))}
      {nodes.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={i === 0 ? 5 : 3} fill="#3b82f6" />
      ))}
    </svg>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const cardRef = useRef<HTMLDivElement>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 16
      const y = (e.clientY / window.innerHeight - 0.5) * 16
      const bg = document.getElementById('net-bg')
      if (bg) bg.style.transform = `translate(${x}px, ${y}px)`
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  const onTiltMove = (e: React.MouseEvent) => {
    const card = cardRef.current
    if (!card) return
    const { left, top, width, height } = card.getBoundingClientRect()
    const rx = ((e.clientY - top - height / 2) / height) * 8
    const ry = ((e.clientX - left - width / 2) / width) * -8
    card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`
  }
  const onTiltLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)'
  }

  const pwMismatch = confirmPassword.length > 0 && password !== confirmPassword

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (password !== confirmPassword) { setError('รหัสผ่านไม่ตรงกัน กรุณากรอกใหม่'); return }
    if (password.length < 6) { setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.message || 'สมัครไม่สำเร็จ'); return }
      setSuccess('สมัครสำเร็จ! กำลังพาไปหน้าเข้าสู่ระบบ...')
      setTimeout(() => router.push('/login'), 1500)
    } catch {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setLoading(false)
    }
  }

  const EyeIcon = () => (
    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  )
  const EyeOffIcon = () => (
    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; font-family: 'Sarabun', sans-serif; }

    .pg {
      min-height: 100vh;
      background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 50%, #ecfeff 100%);
      display: flex; align-items: center; justify-content: center;
      padding: 24px; position: relative; overflow: hidden;
    }
    .blob { position: fixed; border-radius: 50%; pointer-events: none; z-index: 0; }
    .b1 { width: 480px; height: 480px; top: -120px; left: -100px;
          background: radial-gradient(circle, rgba(59,130,246,0.13) 0%, transparent 70%); }
    .b2 { width: 380px; height: 380px; bottom: -80px; right: -60px;
          background: radial-gradient(circle, rgba(6,182,212,0.11) 0%, transparent 70%); }

    }
    .r2 { animation-delay: 1.5s; }
    .r3 { animation-delay: 3s; }

    .tilt-outer {
      position: relative; z-index: 10;
      width: 420px; max-width: calc(100vw - 48px);
      perspective: 900px;
      animation: fadeUp 0.7s ease both;
    }
    .card {
      width: 100%;
      backdrop-filter: blur(24px);
      background: rgba(255,255,255,0.82);
      border: 1.5px solid rgba(255,255,255,0.8);
      border-radius: 28px;
      padding: 36px 36px 32px;
      box-shadow: 0 24px 64px rgba(59,130,246,0.13), 0 2px 0 rgba(255,255,255,0.9) inset;
      transform-style: preserve-3d;
      transition: transform 0.2s ease;
    }

    .brand { display: flex; align-items: center; justify-content: center; gap: 8px;
             margin-bottom: 24px; font-family: 'DM Serif Display', serif;
             font-size: 13px; color: #64748b; }
    .bdot  { width: 6px; height: 6px; border-radius: 50%; background: #3b82f6; }

    .hd { text-align: center; margin-bottom: 24px; }
    .ic {
      width: 56px; height: 56px; border-radius: 16px; margin: 0 auto 14px;
      background: linear-gradient(135deg, #10b981, #0ea5e9);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 24px rgba(16,185,129,0.3);
    }
    .ttl { font-family: 'DM Serif Display', serif; font-size: 26px; color: #1e293b; letter-spacing: -0.02em; }
    .sub { font-size: 13px; color: #94a3b8; margin-top: 4px; }

    .alert {
      border-radius: 12px; padding: 11px 14px; font-size: 13px;
      display: flex; align-items: center; gap: 8px; margin-bottom: 16px;
    }
    .alert-err { background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.2); color: #dc2626; }
    .alert-ok  { background: rgba(16,185,129,0.07); border: 1px solid rgba(16,185,129,0.25); color: #059669; }

    .fld { margin-bottom: 14px; }
    .lbl { display: block; font-size: 11px; font-weight: 700; color: #94a3b8;
           letter-spacing: 0.07em; text-transform: uppercase; margin-bottom: 7px; }
    .fw  { position: relative; }
    .inp {
      width: 100%; padding: 12px 16px;
      background: rgba(248,250,252,0.9); border: 1.5px solid rgba(226,232,240,0.9);
      border-radius: 12px; font-family: 'Sarabun', sans-serif;
      font-size: 14px; color: #1e293b; outline: none;
      transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
    }
    .inp::placeholder { color: #cbd5e1; }
    .inp:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); background: white; }
    .inp.pw { padding-right: 46px; }
    .inp.err { border-color: rgba(239,68,68,0.5); background: rgba(239,68,68,0.03); }
    .inp.err:focus { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.1); }
    .mismatch { font-size: 11px; color: #ef4444; margin-top: 5px; font-weight: 500; }

    .eye {
      position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; color: #cbd5e1;
      padding: 0; display: flex; align-items: center; transition: color 0.15s;
    }
    .eye:hover { color: #3b82f6; }

    /* strength bar */
    .strength-wrap { margin-top: 6px; display: flex; gap: 4px; }
    .strength-seg {
      height: 3px; flex: 1; border-radius: 2px;
      background: #e2e8f0; transition: background 0.3s;
    }

    .btn {
      width: 100%; padding: 13px; margin-top: 6px;
      background: linear-gradient(135deg, #10b981, #0ea5e9);
      color: white; font-family: 'Sarabun', sans-serif; font-size: 15px; font-weight: 700;
      border: none; border-radius: 14px; cursor: pointer;
      box-shadow: 0 6px 20px rgba(16,185,129,0.3);
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: transform 0.18s, box-shadow 0.18s, opacity 0.18s;
    }
    .btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 10px 28px rgba(16,185,129,0.4); }
    .btn:disabled { opacity: 0.55; cursor: not-allowed; }

    .spin {
      width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0;
      border: 2.5px solid rgba(255,255,255,0.3); border-top-color: white;
      animation: spin 0.7s linear infinite;
    }

    .ft { text-align: center; margin-top: 20px; font-size: 13px; color: #94a3b8; }
    .ft a { color: #3b82f6; font-weight: 600; text-decoration: none; }
    .ft a:hover { text-decoration: underline; }

    @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes ripple { 0% { width: 80px; height: 80px; opacity: 0.45; } 100% { width: 560px; height: 560px; opacity: 0; } }
    @keyframes spin { to { transform: rotate(360deg); } }
  `

  // password strength
  const getStrength = (pw: string) => {
    if (pw.length === 0) return 0
    if (pw.length < 6) return 1
    if (pw.length < 10) return 2
    return 3
  }
  const strength = getStrength(password)
  const strengthColors = ['#e2e8f0', '#ef4444', '#f59e0b', '#10b981']
  const strengthLabels = ['', 'อ่อนมาก', 'พอใช้', 'ดี']

  return (
    <>
      <style>{css}</style>
      <div className="pg">
        <div className="blob b1" />
        <div className="blob b2" />
        <NetworkBackground />
        <div className="rings">
          <div className="ring" /><div className="ring r2" /><div className="ring r3" />
        </div>

        <div className="tilt-outer" onMouseMove={onTiltMove} onMouseLeave={onTiltLeave}>
          <div ref={cardRef} className="card">

            <div className="brand">
              <span className="bdot" /> Community Care Hub <span className="bdot" />
            </div>

            <div className="hd">
              <div className="ic">
                <svg width="26" height="26" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <line x1="19" y1="8" x2="19" y2="14"/>
                  <line x1="22" y1="11" x2="16" y2="11"/>
                </svg>
              </div>
              <h1 className="ttl">สมัครสมาชิก</h1>
              <p className="sub">สร้างบัญชีใหม่สำหรับผู้ดูแล</p>
            </div>

            {error && (
              <div className="alert alert-err">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style={{flexShrink:0}}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                {error}
              </div>
            )}
            {success && (
              <div className="alert alert-ok">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style={{flexShrink:0}}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                {success}
              </div>
            )}

            <form onSubmit={handleRegister}>
              {/* Email */}
              <div className="fld">
                <label className="lbl">อีเมล</label>
                <div className="fw">
                  <input type="email" className="inp" placeholder="example@email.com"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>

              {/* Password */}
              <div className="fld">
                <label className="lbl">รหัสผ่าน</label>
                <div className="fw">
                  <input type={showPw ? 'text' : 'password'} className="inp pw"
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" className="eye" onClick={() => setShowPw(p => !p)}>
                    {showPw ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {/* Strength bar */}
                {password.length > 0 && (
                  <div>
                    <div className="strength-wrap">
                      {[1,2,3].map(i => (
                        <div key={i} className="strength-seg"
                          style={{ background: i <= strength ? strengthColors[strength] : '#e2e8f0' }} />
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: strengthColors[strength], marginTop: 4, fontWeight: 600 }}>
                      {strengthLabels[strength]}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="fld">
                <label className="lbl">ยืนยันรหัสผ่าน</label>
                <div className="fw">
                  <input type={showConfirm ? 'text' : 'password'}
                    className={`inp pw${pwMismatch ? ' err' : ''}`}
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                  <button type="button" className="eye" onClick={() => setShowConfirm(p => !p)}>
                    {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {pwMismatch && <p className="mismatch">รหัสผ่านไม่ตรงกัน</p>}
              </div>

              <button type="submit" className="btn" disabled={loading}>
                {loading ? <><div className="spin" />กำลังสมัคร...</> : 'สมัครสมาชิก →'}
              </button>
            </form>

            <p className="ft">
              มีบัญชีแล้ว?{' '}<Link href="/login">เข้าสู่ระบบ</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}