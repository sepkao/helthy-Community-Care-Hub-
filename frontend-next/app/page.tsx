'use client';

import { useEffect, useState } from 'react';
// สมมติว่า getItems ดึงข้อมูลรายชื่อผู้ป่วย/ผู้รับการดูแล
import { getItems } from '@/lib/api';

export default function Home() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    getItems().then(setItems);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* 1. Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col justify-between p-4">
        <div>
          <div className="flex items-center gap-2 text-blue-800 font-bold text-xl px-2 py-4">
            <span className="bg-blue-600 text-white p-1 rounded-md text-sm">🏘️</span> Care Hub
          </div>
          <nav className="mt-4 space-y-1">
            <NavItem icon="📊" label="ภาพรวม (Dashboard)" active />
            <NavItem icon="👥" label="รายชื่อผู้รับการดูแล" />
            <NavItem icon="📝" label="บันทึกการเยี่ยม" />
            <NavItem icon="⚠️" label="เคสเร่งด่วน" />
            <NavItem icon="👤" label="จัดการผู้ใช้งาน" />
          </nav>
        </div>
        <div className="border-t pt-4">
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">👤</div>
            <div>
              <p className="text-sm font-bold">Admin User</p>
              <p className="text-xs text-slate-500">ผู้ดูแลระบบ</p>
            </div>
          </div>
          <button className="w-full py-2 border border-red-100 text-red-500 rounded-lg hover:bg-red-50 transition">
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* 2. Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold">ภาพรวมสถานการณ์ชุมชน</h1>
          <p className="text-slate-500">ยินดีต้อนรับ, Admin User</p>
        </header>

        {/* 3. Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <StatCard label="ผู้รับการดูแลทั้งหมด" value={items.length} unit="คน" />
          <StatCard label="เคสเร่งด่วน (สีแดง)" value="2" unit="ต้องเยี่ยมด่วน" color="red" dot />
          <StatCard label="เฝ้าระวัง (สีเหลือง)" value="1" unit="ติดตามอาการ" color="yellow" />
          <StatCard label="การเยี่ยมวันนี้" value="0" unit="ครั้ง" color="green" />
        </div>

        {/* 4. Urgent List */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span className="text-red-500">⚠️</span> รายชื่อที่ต้องดูแลเร่งด่วน
            </h2>
            <button className="text-blue-600 text-sm font-medium hover:underline">ดูทั้งหมด</button>
          </div>

          <div className="space-y-4">
            {/* วนลูปแสดงข้อมูลจาก items API */}
            {items.map((item: any) => (
              <div 
                key={item.id} 
                className="bg-white p-5 rounded-2xl border-2 border-red-500 flex justify-between items-center shadow-sm hover:shadow-md transition"
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-bold text-lg">{item.title || 'ไม่ระบุชื่อ'}</h3>
                    <span className="bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded-full border border-red-100">
                      ⚠️ เร่งด่วน (วิกฤต)
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm">🏠 {item.address || 'บ้านเลขที่ 00/0'}</p>
                  <p className="text-red-500 text-sm mt-1 font-medium">🕒 {item.status || 'อาการเฝ้าระวัง'}</p>
                </div>
                <button className="bg-red-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-red-600 transition shadow-lg shadow-red-100">
                  บันทึกเยี่ยมด่วน
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

// --- Sub-components (เพื่อความเป็นระเบียบ) ---

function NavItem({ icon, label, active = false }: { icon: string, label: string, active?: boolean }) {
  return (
    <a href="#" className={`flex items-center gap-3 p-3 rounded-xl transition ${active ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-100'}`}>
      <span>{icon}</span> {label}
    </a>
  );
}

function StatCard({ label, value, unit, color = 'blue', dot = false }: any) {
  const colors: any = {
    blue: 'border-slate-100',
    red: 'border-red-500',
    yellow: 'border-yellow-400',
    green: 'border-green-500',
  };
  const textColors: any = {
    blue: 'text-slate-800',
    red: 'text-red-500',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
  };

  return (
    <div className={`bg-white p-6 rounded-2xl border-2 ${colors[color]} shadow-sm relative`}>
      {dot && <div className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>}
      <p className="text-slate-500 text-sm mb-2">{label}</p>
      <div className={`text-4xl font-bold mb-2 ${textColors[color]}`}>{value}</div>
      <span className="bg-slate-50 text-slate-500 text-xs px-2 py-1 rounded border border-slate-100">{unit}</span>
    </div>
  );
}