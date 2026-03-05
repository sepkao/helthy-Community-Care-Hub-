'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

interface DashboardStats {
  total_elderly: number;
  urgent_elderly: number;
  today_visits: number;
}

function NetworkBackground() {
  const nodes: [number, number][] = [
    [80, 120], [260, 60], [480, 200], [640, 80],
    [380, 380], [160, 320], [560, 360], [720, 260],
  ];
  const edges: [number, number][] = [
    [0,1],[1,2],[2,3],[1,4],[4,5],[2,6],[6,7],[3,7],[5,0],[4,6],
  ];
  return (
    <svg id="net-bg" viewBox="0 0 800 500" fill="none" style={{
      position: 'fixed', inset: 0, width: '100%', height: '100%',
      opacity: 0.1, pointerEvents: 'none', zIndex: 0,
      transition: 'transform 0.4s ease',
    }}>
      {edges.map(([a, b], i) => (
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke="#3b82f6" strokeWidth="1" />
      ))}
      {nodes.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={i === 0 ? 5 : 3} fill="#3b82f6" />
      ))}
    </svg>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 12;
      const y = (e.clientY / window.innerHeight - 0.5) * 12;
      const bg = document.getElementById('net-bg');
      if (bg) bg.style.transform = `translate(${x}px, ${y}px)`;
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role') || '';
    const email = localStorage.getItem('email') || '';
    if (!token) { router.push('/login'); return; }
    setUserRole(role);
    setUserEmail(email);

    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          if (data.success) setStats(data.data);
          else setError('ไม่สามารถดึงข้อมูลได้');
        } catch (e) {
          console.error('JSON Parse Error:', e);
          setError('เกิดข้อผิดพลาดในการแปลงข้อมูล');
        }
      } catch (err) {
        console.error(err);
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    router.push('/login');
  };

  const todayTh = new Date().toLocaleDateString('th-TH', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const roleLabel: Record<string, string> = {
    admin: 'ผู้ดูแลระบบ', caregiver: 'เจ้าหน้าที่ดูแล', guardian: 'ผู้ปกครอง',
  };

  const navItems = [
    { href: '/home',          label: 'ภาพรวม',              icon: '📊', active: true  },
    { href: '/home/list',     label: 'รายชื่อผู้รับการดูแล', icon: '👥', active: false },
    { href: '/home/urgent',   label: 'เคสเร่งด่วน',          icon: '⚠️', active: false },
    ...(userRole !== 'guardian' ? [
      { href: '/home/visit',     label: 'การเยี่ยม',       icon: '📅', active: false },
      { href: '/home/visit/new', label: 'บันทึกการเยี่ยม', icon: '📝', active: false },
    ] : []),
  ];

  const quickActions = [
    { href: '/home/list',      icon: '🔍', label: 'ค้นหาผู้สูงอายุ', cls: 'ai-blue',   show: true },
    { href: '/home/list',      icon: '➕', label: 'เพิ่มผู้สูงอายุ',  cls: 'ai-green',  show: userRole !== 'guardian' },
    { href: '/home/visit/new', icon: '📝', label: 'บันทึกการเยี่ยม', cls: 'ai-yellow', show: userRole !== 'guardian' },
    { href: '/home/visit',     icon: '📊', label: 'ประวัติการเยี่ยม', cls: 'ai-purple', show: true },
  ].filter(a => a.show);

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; font-family: 'Sarabun', sans-serif; }

    .app {
      display: flex; min-height: 100vh;
      background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 50%, #ecfeff 100%);
    }
    .blob { position: fixed; border-radius: 50%; pointer-events: none; z-index: 0; }
    .b1 { width: 500px; height: 500px; top: -140px; right: -100px;
          background: radial-gradient(circle, rgba(59,130,246,0.11) 0%, transparent 70%); }
    .b2 { width: 400px; height: 400px; bottom: -80px; left: -80px;
          background: radial-gradient(circle, rgba(6,182,212,0.09) 0%, transparent 70%); }

    /* SIDEBAR */
    .sidebar {
      width: 240px; flex-shrink: 0; position: fixed;
      top: 0; left: 0; bottom: 0; z-index: 40;
      backdrop-filter: blur(24px);
      background: rgba(255,255,255,0.78);
      border-right: 1.5px solid rgba(255,255,255,0.7);
      box-shadow: 4px 0 24px rgba(59,130,246,0.08);
      display: flex; flex-direction: column;
    }
    .sb-logo {
      padding: 24px 20px 20px;
      border-bottom: 1px solid rgba(226,232,240,0.6);
    }
    .sb-logo-icon {
      width: 40px; height: 40px; border-radius: 12px; margin-bottom: 10px;
      background: linear-gradient(135deg, #3b82f6, #0ea5e9);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
      box-shadow: 0 6px 16px rgba(59,130,246,0.3);
    }
    .sb-title { font-family: 'DM Serif Display', serif; font-size: 16px; color: #1e293b; }
    .sb-sub   { font-size: 11px; color: #94a3b8; margin-top: 2px; }

    .nav { flex: 1; padding: 14px 12px; display: flex; flex-direction: column; gap: 3px; overflow-y: auto; }
    .nav-sec { font-size: 10px; font-weight: 700; color: #cbd5e1;
               letter-spacing: 0.08em; text-transform: uppercase; padding: 10px 8px 5px; }
    .ni {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 12px; border-radius: 12px;
      font-size: 13px; font-weight: 500; color: #64748b;
      text-decoration: none; transition: all 0.15s;
    }
    .ni:hover { background: rgba(59,130,246,0.07); color: #3b82f6; }
    .ni.on    { background: rgba(59,130,246,0.1);  color: #3b82f6; font-weight: 700; }
    .ni-ic {
      width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; background: rgba(241,245,249,0.8);
      transition: background 0.15s;
    }
    .ni:hover .ni-ic { background: rgba(59,130,246,0.1); }
    .ni.on    .ni-ic  { background: rgba(59,130,246,0.12); }

    .sb-foot { padding: 14px; border-top: 1px solid rgba(226,232,240,0.6); }
    .uc {
      background: rgba(248,250,252,0.8); border: 1px solid rgba(226,232,240,0.6);
      border-radius: 14px; padding: 11px 12px;
      display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
    }
    .ua {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      background: linear-gradient(135deg, #3b82f6, #0ea5e9);
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700; color: white;
    }
    .ue { font-size: 12px; color: #1e293b; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ur { font-size: 11px; color: #94a3b8; margin-top: 1px; }
    .lout {
      width: 100%; padding: 9px 12px; border-radius: 11px; cursor: pointer;
      background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.15);
      color: #dc2626; font-family: 'Sarabun', sans-serif;
      font-size: 13px; font-weight: 600;
      display: flex; align-items: center; justify-content: center; gap: 7px;
      transition: background 0.15s;
    }
    .lout:hover { background: rgba(239,68,68,0.13); }

    /* MAIN */
    .main { margin-left: 240px; flex: 1; padding: 32px 36px; position: relative; z-index: 1; }

    .topbar {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 28px; gap: 16px; flex-wrap: wrap;
    }
    .ptitle { font-family: 'DM Serif Display', serif; font-size: 32px; color: #1e293b; letter-spacing: -0.02em; }
    .psub   { font-size: 13px; color: #94a3b8; margin-top: 4px; }
    .dbadge {
      backdrop-filter: blur(16px);
      background: rgba(255,255,255,0.75); border: 1.5px solid rgba(255,255,255,0.7);
      border-radius: 14px; padding: 10px 18px; text-align: right;
      box-shadow: 0 4px 16px rgba(59,130,246,0.08);
    }
    .dlabel { font-size: 10px; color: #94a3b8; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; }
    .dval   { font-size: 13px; font-weight: 700; color: #1e293b; margin-top: 2px; }

    .ebox {
      background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.2);
      border-radius: 14px; padding: 13px 18px; font-size: 13px; color: #dc2626;
      display: flex; align-items: center; gap: 8px; margin-bottom: 24px;
    }
    .lwrap { display: flex; align-items: center; justify-content: center; min-height: 300px; }
    .sring {
      width: 44px; height: 44px; border-radius: 50%;
      border: 3px solid rgba(59,130,246,0.15); border-top-color: #3b82f6;
      animation: spin 0.8s linear infinite;
    }

    /* STAT CARDS */
    .sgrid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 32px; }
    .sc {
      border-radius: 22px; padding: 24px 24px 20px;
      text-decoration: none; display: block;
      border: 1.5px solid rgba(255,255,255,0.45);
      position: relative; overflow: hidden;
      backdrop-filter: blur(16px);
      transition: transform 0.2s, box-shadow 0.2s;
      animation: fadeUp 0.6s ease both;
    }
    .sc:hover { transform: translateY(-4px); }
    .sc::before {
      content: ''; position: absolute; inset: 0;
      background: radial-gradient(circle at 80% 15%, rgba(255,255,255,0.18), transparent 55%);
    }
    .sc-b { background: linear-gradient(135deg,#3b82f6,#0ea5e9); box-shadow: 0 12px 36px rgba(59,130,246,0.3); animation-delay: 0s; }
    .sc-o { background: linear-gradient(135deg,#f97316,#ef4444); box-shadow: 0 12px 36px rgba(249,115,22,0.3); animation-delay: 0.08s; }
    .sc-g { background: linear-gradient(135deg,#10b981,#0ea5e9); box-shadow: 0 12px 36px rgba(16,185,129,0.3); animation-delay: 0.16s; }
    .slabel { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.78); letter-spacing: 0.03em; margin-bottom: 10px; position: relative; }
    .sicon {
      position: absolute; top: 20px; right: 20px;
      width: 40px; height: 40px; border-radius: 12px;
      background: rgba(255,255,255,0.18);
      display: flex; align-items: center; justify-content: center; font-size: 18px;
    }
    .snum  { font-family: 'DM Serif Display', serif; font-size: 48px; color: white; line-height: 1; letter-spacing: -0.02em; position: relative; }
    .sunit { font-size: 16px; color: rgba(255,255,255,0.72); margin-left: 8px; }
    .sfoot {
      margin-top: 16px; padding-top: 14px;
      border-top: 1px solid rgba(255,255,255,0.2);
      font-size: 12px; color: rgba(255,255,255,0.72);
      display: flex; align-items: center; gap: 6px; position: relative;
    }

    /* QUICK ACTIONS */
    .stitle { font-family: 'DM Serif Display', serif; font-size: 20px; color: #1e293b; margin-bottom: 14px; }
    .agrid  { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; }
    .ac {
      backdrop-filter: blur(16px);
      background: rgba(255,255,255,0.72);
      border: 1.5px solid rgba(255,255,255,0.7);
      border-radius: 18px; padding: 24px 16px;
      text-decoration: none;
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.04);
      transition: all 0.2s;
      animation: fadeUp 0.6s ease both;
    }
    .ac:hover {
      transform: translateY(-3px);
      box-shadow: 0 12px 32px rgba(59,130,246,0.12);
      border-color: rgba(59,130,246,0.25);
      background: rgba(255,255,255,0.92);
    }
    .aic {
      width: 52px; height: 52px; border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; transition: transform 0.2s;
    }
    .ac:hover .aic { transform: scale(1.1); }
    .ai-blue   { background: rgba(59,130,246,0.1); }
    .ai-green  { background: rgba(16,185,129,0.1); }
    .ai-yellow { background: rgba(245,158,11,0.1); }
    .ai-purple { background: rgba(139,92,246,0.1); }
    .alabel { font-size: 13px; font-weight: 600; color: #475569; }

    @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    @keyframes spin   { to { transform: rotate(360deg); } }
  `;

  return (
    <>
      <style>{css}</style>
      <NetworkBackground />
      <div className="blob b1" />
      <div className="blob b2" />

      <div className="app">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sb-logo">
            <div className="sb-logo-icon">🏥</div>
            <div className="sb-title">Care Hub</div>
            <div className="sb-sub">ระบบดูแลผู้สูงอายุ</div>
          </div>

          <nav className="nav">
            <div className="nav-sec">เมนูหลัก</div>
            {navItems.map(item => (
              <Link key={item.href + item.label} href={item.href} className={`ni${item.active ? ' on' : ''}`}>
                <span className="ni-ic">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="sb-foot">
            <div className="uc">
              <div className="ua">{userEmail ? userEmail[0].toUpperCase() : 'U'}</div>
              <div style={{minWidth: 0}}>
                <div className="ue">{userEmail || 'ผู้ใช้งาน'}</div>
                <div className="ur">{roleLabel[userRole] || userRole}</div>
              </div>
            </div>
            <button className="lout" onClick={handleLogout}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              ออกจากระบบ
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="main">
          <div className="topbar">
            <div>
              <h1 className="ptitle">ภาพรวมการดูแล</h1>
              <p className="psub">ระบบจัดการ Community Care Hub</p>
            </div>
            <div className="dbadge">
              <div className="dlabel">วันนี้</div>
              <div className="dval">{todayTh}</div>
            </div>
          </div>

          {error && (
            <div className="ebox">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20" style={{flexShrink:0}}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}

          {loading ? (
            <div className="lwrap"><div className="sring" /></div>
          ) : (
            <>
              <div className="sgrid">
                <Link href="/home/list" className="sc sc-b">
                  <div className="sicon">👥</div>
                  <div className="slabel">ผู้สูงอายุในความดูแล</div>
                  <div><span className="snum">{stats?.total_elderly ?? 0}</span><span className="sunit">คน</span></div>
                  <div className="sfoot">👥 ดูรายชื่อทั้งหมด →</div>
                </Link>
                <Link href="/home/urgent" className="sc sc-o">
                  <div className="sicon">⚠️</div>
                  <div className="slabel">เคสเฝ้าระวัง</div>
                  <div><span className="snum">{stats?.urgent_elderly ?? 0}</span><span className="sunit">เคส</span></div>
                  <div className="sfoot">⚠️ ตรวจสอบเคสด่วน →</div>
                </Link>
                <Link href="/home/visit" className="sc sc-g">
                  <div className="sicon">📅</div>
                  <div className="slabel">การเยี่ยมวันนี้</div>
                  <div><span className="snum">{stats?.today_visits ?? 0}</span><span className="sunit">ครั้ง</span></div>
                  <div className="sfoot">📅 ตารางเยี่ยมวันนี้ →</div>
                </Link>
              </div>

              <div>
                <h2 className="stitle">เมนูด่วน</h2>
                <div className="agrid">
                  {quickActions.map((a, i) => (
                    <Link key={i} href={a.href} className="ac" style={{animationDelay: `${0.1 + i * 0.06}s`}}>
                      <div className={`aic ${a.cls}`}>{a.icon}</div>
                      <span className="alabel">{a.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}