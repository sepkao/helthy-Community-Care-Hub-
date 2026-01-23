'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getItems } from '@/lib/api';

export default function UserHomePage() { // เปลี่ยนชื่อให้สื่อความหมาย
  const [items, setItems] = useState([]);

  useEffect(() => {
    // เพิ่มการดักจับ Error เพื่อไม่ให้หน้าเว็บขาว
    getItems()
      .then(setItems)
      .catch(err => console.error("โหลดข้อมูลไม่สำเร็จ:", err));
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
            <NavItem icon="📊" label="ภาพรวม (Dashboard)" href="/" />
            <NavItem icon="👥" label="รายชื่อผู้รับการดูแล" href="/patients" />
            {/* เชื่อมไปยังหน้าที่คุณสร้างไว้  */}
            <NavItem icon="📝" label="บันทึกการเยี่ยม" href="/visit-form" />
            <NavItem icon="⚠️" label="เคสเร่งด่วน" href="/urgent-cases" />
            <NavItem icon="👤" label="จัดการผู้ใช้งาน" href="/users" />
          </nav>
        </div>
        <div className="border-t pt-4 text-center">
           <button className="text-red-500 hover:bg-red-50 w-full py-2 rounded-lg">ออกจากระบบ</button>
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
          <StatCard label="ผู้รับการดูแลทั้งหมด" value={items ? items.length : 0} unit="คน" />
          <StatCard label="เคสเร่งด่วน (สีแดง)" value="2" unit="ต้องเยี่ยมด่วน" color="red" dot />
          <StatCard label="เฝ้าระวัง (สีเหลือง)" value="1" unit="ติดตามอาการ" color="yellow" />
          <StatCard label="การเยี่ยมวันนี้" value="0" unit="ครั้ง" color="green" />
        </div>

        {/* 4. Urgent List [cite: 41] */}
        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="text-red-500">⚠️</span> รายชื่อที่ต้องดูแลเร่งด่วน
          </h2>

          <div className="space-y-4">
            {items && items.length > 0 ? (
              items.map((item: any) => (
                <div key={item.id} className="bg-white p-5 rounded-2xl border-2 border-red-500 flex justify-between items-center shadow-sm">
                  <div>
                    <h3 className="font-bold text-lg">{item.title || 'ไม่ระบุชื่อ'}</h3>
                    <p className="text-slate-500 text-sm">🏠 {item.address || 'บ้านเลขที่ 00/0'}</p>
                    <p className="text-red-500 text-sm mt-1 font-medium">🕒 {item.status || 'อาการวิกฤต'} [cite: 40]</p>
                  </div>
                  <Link href="/visit-form">
                    <button className="bg-red-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-red-600 transition shadow-lg shadow-red-100">
                      บันทึกเยี่ยมด่วน
                    </button>
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-10 italic">ไม่มีรายการที่ต้องดูแลเร่งด่วน</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

// --- ส่วนประกอบย่อย ---
function NavItem({ icon, label, href }: { icon: string, label: string, href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-3 rounded-xl text-slate-600 hover:bg-slate-100 transition">
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function StatCard({ label, value, unit, color = 'blue', dot = false }: any) {
  const colors: any = { blue: 'border-slate-100', red: 'border-red-500', yellow: 'border-yellow-400', green: 'border-green-500' };
  const textColors: any = { blue: 'text-slate-800', red: 'text-red-500', yellow: 'text-yellow-600', green: 'text-green-600' };
  return (
    <div className={`bg-white p-6 rounded-2xl border-2 ${colors[color]} shadow-sm relative`}>
      {dot && <div className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>}
      <p className="text-slate-500 text-sm mb-2">{label}</p>
      <div className={`text-4xl font-bold mb-2 ${textColors[color]}`}>{value}</div>
      <span className="bg-slate-50 text-slate-500 text-xs px-2 py-1 rounded border border-slate-100">{unit}</span>
    </div>
  );
}