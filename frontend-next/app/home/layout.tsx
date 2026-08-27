'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { LayoutGrid, Users, Calendar, FileText, LogOut } from 'lucide-react';

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

  // ── sidebar ยืดหดได้ (collapsed state ค้างไว้ให้ผู้ใช้คนเดิม) ──
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved === '1') setCollapsed(true);
  }, []);
  const toggleCollapsed = () => {
    setCollapsed(prev => {
      localStorage.setItem('sidebarCollapsed', prev ? '0' : '1');
      return !prev;
    });
  };

  const isHome     = pathname === '/home';
  const isList     = pathname.startsWith('/home/list');
  const isNewVisit = pathname === '/home/visit/new' || pathname.startsWith('/home/visit/new/');
  const isVisits   = pathname.startsWith('/home/visit') && !isNewVisit;

  const roleLabel: Record<string, string> = {
    admin: 'Administrator', caregiver: 'Caregiver', guardian: 'Guardian',
  };

  const navItems = [
    { href: '/home',        label: 'Dashboard',    active: isHome,   Icon: LayoutGrid as (typeof LayoutGrid | undefined) },
    { href: '/home/list',   label: 'Care Patient',  active: isList,   Icon: Users as (typeof LayoutGrid | undefined) },
    ...(user?.role !== 'guardian' ? [
      { href: '/home/visit',     label: 'Health Check History', active: isVisits,   Icon: Calendar as (typeof LayoutGrid | undefined) },
      { href: '/home/visit/new', label: 'New Health Check',     active: isNewVisit, Icon: FileText as (typeof LayoutGrid | undefined) },
    ] : []),
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/login');
  };

  const initial = (s: string) => s.trim().charAt(0).toUpperCase() || '?';

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; font-family: 'Inter', sans-serif; }

    .layout {
      display: flex; height: 100vh;
      background: #ffffff;
      overflow: hidden; position: relative;
    }

    /* ── SIDEBAR — ยืดหดได้, พื้นขาว ตัวหนังสือเขียว ── */
    .sidebar {
      width: ${collapsed ? '76px' : '240px'};
      flex-shrink: 0; height: 100vh;
      position: relative; z-index: 40;
      background: #ffffff;
      border-right: 1.5px solid #e5e7eb;
      box-shadow: 2px 0 10px rgba(0,0,0,0.03);
      display: flex; flex-direction: column;
      transition: width 0.2s ease;
    }

    .sb-toggle {
      position: absolute; top: 24px; right: -13px; z-index: 50;
      width: 26px; height: 26px; border-radius: 50%;
      background: #ffffff; border: 1.5px solid #bbf7d0; color: #15803d;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px; line-height: 1; cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      transition: background 0.15s;
    }
    .sb-toggle:hover { background: #f0fdf4; }

    .sb-logo {
      padding: ${collapsed ? '26px 0 20px' : '26px 22px 20px'};
      border-bottom: 1px solid #e5e7eb;
      text-align: ${collapsed ? 'center' : 'left'};
    }
    .sb-title { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 20px; color: #166534; letter-spacing: -0.01em; }
    .sb-sub   { font-size: 11px; color: #16a34a; margin-top: 3px; letter-spacing: 0.02em; }

    .nav { flex: 1; padding: 16px ${collapsed ? '10px' : '12px'}; display: flex; flex-direction: column; gap: 3px; overflow-y: auto; overflow-x: hidden; }
    .nav-sec {
      font-size: 10px; font-weight: 700; color: #4d7c0f;
      letter-spacing: 0.1em; text-transform: uppercase; padding: 10px 10px 6px;
      white-space: nowrap; overflow: hidden;
    }
    .ni {
      display: flex; align-items: center; gap: 9px;
      padding: 11px 14px; border-radius: 12px;
      font-size: 14px; font-weight: 500; color: #15803d;
      text-decoration: none; transition: all 0.15s;
      white-space: nowrap; overflow: hidden;
      justify-content: ${collapsed ? 'center' : 'flex-start'};
    }
    .ni svg { flex-shrink: 0; }
    .ni:hover { background: #f0fdf4; color: #14532d; }
    .ni.on    { background: #dcfce7; color: #14532d; font-weight: 700; }
    .ni-wrap { position: relative; }
    .ni-indicator {
      position: absolute; top: 4px; bottom: 4px;
      right: -${collapsed ? '10' : '12'}px;
      width: 4px; background: #22c55e; border-radius: 4px 0 0 4px;
    }
    .ni-avatar {
      width: 30px; height: 30px; border-radius: 9px; flex-shrink: 0;
      background: #dcfce7; color: #15803d; font-weight: 700; font-size: 13px;
      display: flex; align-items: center; justify-content: center;
    }

    .sb-foot { padding: 14px; border-top: 1px solid #e5e7eb; }
    .uc {
      background: #ffffff; border: 1px solid #e5e7eb;
      border-radius: 10px; padding: 8px 8px 8px 10px;
      display: flex; align-items: center; gap: 8px; justify-content: space-between;
    }
    .ue { font-size: 11px; color: #14532d; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ur { font-size: 10px; color: #6b7280; margin-top: 1px; text-transform: capitalize; }
    .lout-icon {
      flex-shrink: 0; width: 28px; height: 28px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      background: #fef2f2; border: 1px solid #fecaca; color: #dc2626;
      cursor: pointer; transition: background 0.15s;
    }
    .lout-icon:hover { background: #fee2e2; }

    /* ── MAIN ── */
    .main-wrap {
      flex: 1; overflow-y: auto;
      position: relative; z-index: 1;
      background: #ffffff;
    }
    .main-inner { padding: 32px 36px; }
  `;

  return (
    <>
      <style>{css}</style>

      <div className="layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <button className="sb-toggle" onClick={toggleCollapsed} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? '›' : '‹'}
          </button>

          <div className="sb-logo">
            <div className="sb-title">{collapsed ? 'CH' : 'Care Hub'}</div>
            {!collapsed && <div className="sb-sub">Elderly Care System</div>}
          </div>

          <nav className="nav">
            {!collapsed && <div className="nav-sec">Main Menu</div>}
            {navItems.map(item => (
              <div key={item.href + item.label} className="ni-wrap">
                <Link href={item.href} className={`ni${item.active ? ' on' : ''}`} title={collapsed ? item.label : undefined}>
                  {collapsed
                    ? <span className="ni-avatar">{initial(item.label)}</span>
                    : <>{item.Icon && <item.Icon size={16} strokeWidth={1.9} />}{item.label}</>}
                </Link>
                {item.active && <span className="ni-indicator" />}
              </div>
            ))}
          </nav>

          <div className="sb-foot">
            {collapsed ? (
              <button className="lout-icon" onClick={handleLogout} title="Log out" style={{ margin: '0 auto', display: 'flex' }}>
                <LogOut size={15} strokeWidth={1.8} />
              </button>
            ) : (
              <div className="uc">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="ue">{user?.email || 'User'}</div>
                  <div className="ur">{roleLabel[user?.role || ''] || user?.role || '-'}</div>
                </div>
                <button className="lout-icon" onClick={handleLogout} title="Log out">
                  <LogOut size={15} strokeWidth={1.8} />
                </button>
              </div>
            )}
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
