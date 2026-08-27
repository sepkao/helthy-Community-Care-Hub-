'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

/* ── Network Background ── */
function NetworkBackground() {
  const nodes: [number, number][] = [
    [80, 120], [260, 60], [480, 200], [640, 80],
    [380, 380], [160, 320], [560, 360], [720, 260],
  ]
  const edges: [number, number][] = [
    [0,1],[1,2],[2,3],[1,4],[4,5],[2,6],[6,7],[3,7],[5,0],[4,6],
  ]
  return (
    <svg
      id="network-bg"
      style={{
        position: 'fixed', inset: 0, width: '100%', height: '100%',
        opacity: 0.15, pointerEvents: 'none', zIndex: 0,
        transition: 'transform 0.4s ease',
      }}
      viewBox="0 0 800 500" fill="none"
    >
      {edges.map(([a, b], i) => (
        <line key={i}
          x1={nodes[a][0]} y1={nodes[a][1]}
          x2={nodes[b][0]} y2={nodes[b][1]}
          stroke="#16a34a" strokeWidth="1"
        />
      ))}
      {nodes.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={i === 0 ? 5 : 3} fill="#16a34a" />
      ))}
    </svg>
  )
}

/* ── Tilt Card ── */
function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const onMove = (e: React.MouseEvent) => {
    const card = ref.current
    if (!card) return
    const { left, top, width, height } = card.getBoundingClientRect()
    const rx = ((e.clientY - top - height / 2) / height) * 8
    const ry = ((e.clientX - left - width / 2) / width) * -8
    card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`
  }
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = 'rotateX(0deg) rotateY(0deg)'
  }
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ transformStyle: 'preserve-3d', transition: 'transform 0.2s ease', width: '100%' }}>
      {children}
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  /* Parallax */
  useEffect(() => {
    const move = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 16
      const y = (e.clientY / window.innerHeight - 0.5) * 16
      const bg = document.getElementById('network-bg')
      if (bg) bg.style.transform = `translate(${x}px, ${y}px)`
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE}/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }
      )
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'เข้าสู่ระบบไม่สำเร็จ')
        return
      }
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.user.role)
      router.push('/home')
    } catch {
      setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          font-family: 'Sarabun', sans-serif;
          min-height: 100vh;  
          width: 100%;
          background: #f0fdf4;
          display: flex; align-items: center; justify-content: center;
          padding: 24px; position: relative; overflow: hidden;
        }

        /* Blobs */
        .blob {
          position: fixed; border-radius: 50%; pointer-events: none; z-index: 0;
        }
        .blob-1 {
          width: 500px; height: 500px; top: -120px; left: -120px;
          background: radial-gradient(circle, rgba(22,163,74,0.13) 0%, transparent 70%);
        }
        .blob-2 {
          width: 400px; height: 400px; bottom: -80px; right: -80px;
          background: radial-gradient(circle, rgba(34,197,94,0.11) 0%, transparent 70%);
        }



        /* Card */
        .login-card {
          position: relative; z-index: 10;
          width: 100%; max-width: 420px;
          backdrop-filter: blur(24px);
          background: rgba(255,255,255,0.78);
          border: 1.5px solid rgba(255,255,255,0.75);
          border-radius: 28px;
          padding: 40px 36px 36px;
          box-shadow: 0 24px 64px rgba(22,163,74,0.13), 0 2px 0 rgba(255,255,255,0.9) inset;
          animation: fadeUp 0.7s ease both;
        }

        /* Header */
        .card-header { text-align: center; margin-bottom: 28px; }
        .card-icon-wrap {
          width: 56px; height: 56px; border-radius: 16px; margin: 0 auto 14px;
          background: #16a34a;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 24px rgba(22,163,74,0.35);
        }
        .card-title {
          font-family: 'DM Serif Display', serif;
          font-size: 26px; color: #1e293b; letter-spacing: -0.02em;
        }
        .card-sub { font-size: 13px; color: #94a3b8; margin-top: 4px; }

        /* Error */
        .error-box {
          background: rgba(239,68,68,0.07);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 12px; padding: 11px 14px;
          font-size: 13px; color: #dc2626;
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 18px;
          animation: fadeUp 0.3s ease both;
        }

        /* Field */
        .field { margin-bottom: 16px; }
        .field-label {
          display: block; font-size: 12px; font-weight: 700;
          color: #64748b; letter-spacing: 0.05em; text-transform: uppercase;
          margin-bottom: 7px;
        }
        .field-wrap { position: relative; }
        .field-input {
          width: 100%; padding: 12px 16px;
          background: rgba(248,250,252,0.8);
          border: 1.5px solid rgba(226,232,240,0.8);
          border-radius: 12px; font-family: 'Sarabun', sans-serif;
          font-size: 14px; color: #1e293b;
          outline: none; transition: border-color 0.18s, box-shadow 0.18s;
        }
        .field-input::placeholder { color: #cbd5e1; }
        .field-input:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 3px rgba(22,163,74,0.12);
          background: white;
        }
        .field-input.has-toggle { padding-right: 48px; }
        .toggle-pw {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: #94a3b8;
          padding: 0; display: flex; align-items: center;
          transition: color 0.15s;
        }
        .toggle-pw:hover { color: #16a34a; }

        /* Submit */
        .submit-btn {
          width: 100%; padding: 13px;
          background: #16a34a;
          color: white; font-family: 'Sarabun', sans-serif;
          font-size: 15px; font-weight: 700;
          border: none; border-radius: 14px; cursor: pointer;
          box-shadow: 0 6px 20px rgba(22,163,74,0.35);
          transition: transform 0.18s, box-shadow 0.18s, opacity 0.18s;
          margin-top: 8px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 28px rgba(22,163,74,0.45);
        }
        .submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        /* Spinner */
        .spinner {
          width: 18px; height: 18px; border-radius: 50%;
          border: 2.5px solid rgba(255,255,255,0.35);
          border-top-color: white;
          animation: spin 0.7s linear infinite;
        }

        /* Footer */
        .card-footer {
          text-align: center; margin-top: 22px;
          font-size: 13px; color: #94a3b8;
        }
        .card-footer a {
          color: #16a34a; font-weight: 600; text-decoration: none;
          transition: color 0.15s;
        }
        .card-footer a:hover { color: #1d4ed8; text-decoration: underline; }

        /* Brand strip */
        .brand-strip {
          display: flex; align-items: center; justify-content: center;
          gap: 8px; margin-bottom: 28px;
          font-family: 'DM Serif Display', serif;
          font-size: 14px; color: #64748b; letter-spacing: 0.01em;
        }
        .brand-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #16a34a;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ripple {
          0%   { width: 60px;  height: 60px;  opacity: 0.5; }
          100% { width: 800px; height: 800px; opacity: 0; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .back-link {
          position: absolute; top: 20px; left: 20px; z-index: 20;
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 14px; border-radius: 10px;
          background: rgba(255,255,255,0.8); border: 1px solid rgba(255,255,255,0.7);
          color: #15803d; font-family: 'Sarabun', sans-serif;
          font-size: 13px; font-weight: 600; text-decoration: none;
          transition: background 0.15s, transform 0.15s;
        }
        .back-link:hover { background: rgba(255,255,255,0.95); transform: translateX(-2px); }
      `}</style>

      <div className="login-root">
        {/* Layers */}
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <NetworkBackground />
        <div className="pulse-wrap">
        </div>

        <Link href="/" className="back-link">← กลับหน้าแรก</Link>

        {/* Card */}
        <TiltCard>
          <div className="login-card" style={{ margin: '0 auto' }}>

            {/* Brand */}
            <div className="brand-strip">
              <span className="brand-dot" />
              Community Care Hub
              <span className="brand-dot" />
            </div>

            {/* Header */}
            <div className="card-header">
              <div className="card-icon-wrap">
                <svg width="26" height="26" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h1 className="card-title">เข้าสู่ระบบ</h1>
              <p className="card-sub">ยินดีต้อนรับกลับมา</p>
            </div>

            {/* Error */}
            {error && (
              <div className="error-box">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin}>
              <div className="field">
                <label className="field-label">อีเมล</label>
                <div className="field-wrap">
                  <input
                    type="email"
                    className="field-input"
                    placeholder="example@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">รหัสผ่าน</label>
                <div className="field-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="field-input has-toggle"
                    placeholder="กรอกรหัสผ่าน"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-pw"
                    onClick={() => setShowPassword(p => !p)}
                    aria-label="toggle password"
                  >
                    {showPassword ? (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? (
                  <><div className="spinner" /> กำลังเข้าสู่ระบบ...</>
                ) : 'เข้าสู่ระบบ →'}
              </button>
            </form>

            <p className="card-footer">
              ยังไม่มีบัญชี?{' '}
              <Link href="/register">สมัครสมาชิก</Link>
            </p>
          </div>
        </TiltCard>
      </div>
    </>
  )
}