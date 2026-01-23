'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

  const base =
    'flex items-center gap-3 px-4 py-2 rounded-lg transition';

  const active =
    'bg-blue-600 text-white font-semibold';

  const inactive =
    'text-slate-600 hover:bg-slate-100';

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r p-4 flex flex-col">
        <div>
          <h2 className="font-bold text-xl mb-6 flex items-center gap-2">
            🏥 Care Hub
          </h2>

          <nav className="space-y-1">
            <Link
              href="/home"
              className={`${base} ${isHome ? active : inactive}`}
            >
              📊 <span>ภาพรวม</span>
            </Link>

            <Link
              href="/home/list"
              className={`${base} ${isList ? active : inactive}`}
            >
              👥 <span>รายชื่อผู้รับการดูแล</span>
            </Link>

            <Link
              href="/home/visit"
              className={`${base} ${isVisits ? active : inactive}`}
            >
              📝 <span>บันทึกการเยี่ยม</span>
            </Link>

            <Link
              href="/home/urgent"
              className={`${base} ${isUrgent ? active : inactive}`}
            >
              ⚠️ <span>เคสเร่งด่วน</span>
            </Link>
          </nav>
        </div>

        {/* Footer sidebar (optional) */}
        <div className="mt-auto pt-4 border-t">
          <button
            onClick={() => {
              localStorage.removeItem('login');
              window.location.href = '/login';
            }}
            className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            🚪 ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
