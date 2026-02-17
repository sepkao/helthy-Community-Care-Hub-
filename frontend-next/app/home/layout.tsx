'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isHome = pathname === '/home';
  const isList = pathname.startsWith('/home/list');
  const isVisits = pathname.startsWith('/home/visit');
  const isUrgent = pathname.startsWith('/home/urgent');

  const navItems = [
    { href: '/home', label: 'ภาพรวม', icon: '📊', active: isHome },
    { href: '/home/list', label: 'รายชื่อผู้รับการดูแล', icon: '👥', active: isList },
    { href: '/home/urgent', label: 'เคสเร่งด่วน', icon: '⚠️', active: isUrgent },
  ];

  const [user, setUser] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');

    if (token) {
      try {
        // Decode JWT payload directly (base64url → JSON)
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const email = payload.email || 'User';
          const role = payload.role || storedRole || '-';
          setUser({ email, role });
          localStorage.setItem('role', role);
        }
      } catch {
        // Fallback to localStorage
        if (storedRole) setUser({ email: 'User', role: storedRole });
      }
    }
  }, []);

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-72 bg-gradient-to-b from-blue-600 via-blue-700 to-indigo-800 flex flex-col shadow-2xl">
        {/* Logo Section */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
              <Image src="/logo.svg" alt="Community CareHub Logo" width={40} height={40} className="object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Care Hub</h1>
              <p className="text-xs text-white/60">ระบบดูแลผู้สูงอายุ</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${item.active
                  ? 'bg-white text-blue-700 shadow-lg font-semibold'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              <span className={`text-xl ${item.active ? '' : 'opacity-80'}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.active && (
                <span className="ml-auto w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
            </Link>
          ))}
        </nav>

        {/* User Section & Logout */}
        <div className="p-4 border-t border-white/10">
          {/* User Info */}
          <div className="flex items-center gap-3 px-4 py-3 mb-3 bg-white/10 rounded-xl">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.email || 'Loading...'}</p>
              <p className="text-xs text-white/60 capitalize">{user?.role || '-'}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('role');
              window.location.href = '/login';
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-red-500/20 hover:text-red-200 rounded-xl transition-all duration-200"
          >
            <span className="text-xl">🚪</span>
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}


