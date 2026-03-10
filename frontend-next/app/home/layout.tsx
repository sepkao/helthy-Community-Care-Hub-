'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSyncExternalStore } from 'react';

// อ่าน user จาก localStorage token ผ่าน useSyncExternalStore (ไม่ต้องใช้ useEffect + setState เลย)
const emptySubscribe = () => () => {};

// Cache the last snapshot to avoid React infinite loops
let cachedSnapshot: { email: string; role: string } | null = null;
let lastToken: string | null = null;
let lastStoredRole: string | null = null;

function getUserSnapshot(): { email: string; role: string } | null {
  const token = localStorage.getItem('token');
  const storedRole = localStorage.getItem('role');

  // Return cached snapshot if nothing has changed
  if (token === lastToken && storedRole === lastStoredRole && cachedSnapshot !== undefined) {
    return cachedSnapshot;
  }

  // Update last tracked values
  lastToken = token;
  lastStoredRole = storedRole;

  if (!token) {
    cachedSnapshot = null;
    return cachedSnapshot;
  }

  let email = 'User';
  let role = storedRole || '-';

  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      email = payload.email || 'User';
      role = payload.role || storedRole || '-';
      
      // Only setItem if it has genuinely changed to avoid recursive updates
      if (role !== storedRole) {
        localStorage.setItem('role', role);
      }
    }
  } catch {
    // token parsing failed, use defaults
  }

  cachedSnapshot = { email, role };
  return cachedSnapshot;
}

const serverSnapshotInstance: { email: string; role: string } | null = null;
function getServerSnapshot(): { email: string; role: string } | null {
  return serverSnapshotInstance; // SSR: ไม่มี localStorage
}

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const user = useSyncExternalStore(emptySubscribe, getUserSnapshot, getServerSnapshot);

  const isHome   = pathname === '/home';
  const isList   = pathname.startsWith('/home/list');
  const isVisits = pathname.startsWith('/home/visit');

  const roleLabel: Record<string, string> = {
    admin: 'ผู้ดูแลระบบ', caregiver: 'เจ้าหน้าที่ดูแล', guardian: 'ผู้ปกครอง',
  };

  const navItems = [
    { href: '/home',        label: 'ภาพรวม',               icon: '📊', active: isHome   },
    { href: '/home/list',   label: 'รายชื่อผู้รับการดูแล',  icon: '👥', active: isList   },
    ...(user?.role !== 'guardian' ? [
      { href: '/home/visit',     label: 'ประวัติการเยี่ยม',        icon: '📅', active: isVisits },
      { href: '/home/visit/new', label: 'บันทึกการเยี่ยม',  icon: '📝', active: false    },
    ] : []),
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/login');
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; font-family: 'Sarabun', sans-serif; }

    .layout {
      display: flex; height: 100vh;
      background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 50%, #ecfeff 100%);
      overflow: hidden; position: relative;
    }

    /* bg blobs */
    .blob { position: fixed; border-radius: 50%; pointer-events: none; z-index: 0; }
    .b1 { width: 500px; height: 500px; top: -140px; right: -100px;
          background: radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%); }
    .b2 { width: 400px; height: 400px; bottom: -80px; left: 160px;
          background: radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%); }

    /* ── SIDEBAR ── */
    .sidebar {
      width: 240px; flex-shrink: 0; height: 100vh;
      position: relative; z-index: 40;
      backdrop-filter: blur(24px);
      background: #000435;
      border-right: 1.5px solid rgba(255,255,255,0.65);
      box-shadow: 4px 0 28px rgba(59,130,246,0.08);
      display: flex; flex-direction: column;
    }

    .sb-logo {
      padding: 22px 20px 18px;
      border-bottom: 1px solid rgba(226,232,240,0.7);
      display: flex; align-items: center; gap: 12px;
    }
    .sb-icon {
      width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0;
      background: linear-gradient(135deg, #3b82f6, #0ea5e9);
      display: flex; align-items: center; justify-content: center;
    }
    .sb-title { font-family: 'DM Serif Display', serif; font-size: 16px; color: #f5f5f5ff; }
    .sb-sub   { font-size: 11px; color: #94a3b8; margin-top: 1px; }

    .nav { flex: 1; padding: 14px 12px; display: flex; flex-direction: column; gap: 3px; overflow-y: auto; }
    .nav-sec {
      font-size: 10px; font-weight: 700; color: #cbd5e1;
      letter-spacing: 0.08em; text-transform: uppercase; padding: 10px 8px 5px;
    }
    .ni {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 12px; border-radius: 12px;
      font-size: 13px; font-weight: 500; color: #64748b;
      text-decoration: none; transition: all 0.15s;
    }
    .ni:hover { background: rgba(59,130,246,0.07); color: #3b82f6; }
    .ni.on    { background: rgba(59,130,246,0.10); color: #2563eb; font-weight: 700; }
    .ni-ic {
      width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 15px; background: rgba(241,245,249,0.9);
      transition: background 0.15s;
    }
    .ni:hover .ni-ic { background: rgba(59,130,246,0.10); }
    .ni.on    .ni-ic  { background: rgba(59,130,246,0.14); }
    .ni-dot {
      margin-left: auto; width: 7px; height: 7px; border-radius: 50%;
      background: #3b82f6; flex-shrink: 0;
    }

    .sb-foot { padding: 14px; border-top: 1px solid rgba(226,232,240,0.7); }
    .uc {
      background: rgba(248,250,252,0.9); border: 1px solid rgba(226,232,240,0.7);
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
    .ur { font-size: 11px; color: #5e656eff; margin-top: 1px; }
    .lout {
      width: 100%; padding: 9px 12px; border-radius: 11px; cursor: pointer;
      background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.15);
      color: #dc2626; font-family: 'Sarabun', sans-serif;
      font-size: 13px; font-weight: 600;
      display: flex; align-items: center; justify-content: center; gap: 7px;
      transition: background 0.15s;
    }
    .lout:hover { background: rgba(239,68,68,0.13); }

    /* ── MAIN ── */
    .main-wrap {
      flex: 1; overflow-y: auto;
      position: relative; z-index: 1;
    }
    .main-inner { padding: 32px 36px; }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="blob b1" />
      <div className="blob b2" />

      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sb-logo">
            <div className="sb-icon">🏥</div>
            <div>
              <div className="sb-title">Care Hub</div>
              <div className="sb-sub">ระบบดูแลผู้สูงอายุ</div>
            </div>
          </div>

          <nav className="nav">
            <div className="nav-sec">เมนูหลัก</div>
            {navItems.map(item => (
              <Link key={item.href + item.label} href={item.href} className={`ni${item.active ? ' on' : ''}`}>
                <span className="ni-ic">{item.icon}</span>
                {item.label}
                {item.active && <span className="ni-dot" />}
              </Link>
            ))}
          </nav>

          <div className="sb-foot">
            <div className="uc">
              <div className="ua">{user?.email ? user.email[0].toUpperCase() : 'U'}</div>
              <div style={{minWidth: 0}}>
                <div className="ue">{user?.email || 'ผู้ใช้งาน'}</div>
                <div className="ur">{roleLabel[user?.role || ''] || user?.role || '-'}</div>
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

        {/* MAIN CONTENT — children จาก page.tsx */}
        <div className="main-wrap">
          <div className="main-inner">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}