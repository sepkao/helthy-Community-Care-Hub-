'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getItems } from '@/lib/api';

// 1. กำหนดโครงสร้างข้อมูลให้โปรแกรมรู้จัก
interface PatientItem {
  id: number;
  title: string;
  address: string;
  status: string;
}

export default function Home() {
  // 2. บอกโปรแกรมว่า useState ตัวนี้จะเก็บค่าเป็น PatientItem[] (รายการผู้ป่วย)
  const [items, setItems] = useState<PatientItem[]>([]);

  useEffect(() => {
    getItems()
      .then(setItems)
      .catch((err) => {
        console.error("เชื่อมต่อ Backend ไม่ได้: ", err);
        // ข้อมูลจำลองเมื่อดึงจาก Server ไม่สำเร็จ
        setItems([
          { id: 1, title: 'คุณตาสมศักดิ์ รักดี', address: '123 ม.4 หมู่บ้านอบอุ่น', status: 'ความดันสูง (วิกฤต)' },
          { id: 2, title: 'คุณยายสมศรี มีสุข', address: '45/1 ม.4 ซอยข้างวัด', status: 'รอการเยี่ยมบ้าน' }
        ]);
      });
  }, []);

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800">
      <aside className="w-64 bg-white border-r flex flex-col justify-between p-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-800 font-bold text-xl px-2 py-4">
            <span className="bg-blue-600 text-white p-1 rounded-md text-sm">🏘️</span> Care Hub
          </div>
          <nav className="mt-4 space-y-1">
            <NavItem icon="📊" label="ภาพรวม (Dashboard)" href="/" active />
            <NavItem icon="📝" label="บันทึกการเยี่ยม" href="/visit-form" />
            <NavItem icon="👥" label="รายชื่อผู้รับการดูแล" href="/patients" />
          </nav>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">ภาพรวมสถานการณ์ชุมชน</h1>
          <p className="text-slate-500 italic">ข้อมูลล่าสุดจาก อสม. ในพื้นที่</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard label="เคสเร่งด่วน" value="2" unit="คน" color="red" />
          <StatCard label="เฝ้าระวัง" value="1" unit="คน" color="yellow" />
          <StatCard label="เยี่ยมแล้ววันนี้" value="0" unit="ครั้ง" color="green" />
        </div>

        <section>
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800">
            <span className="text-red-500">⚠️</span> รายชื่อที่ต้องดูแลเร่งด่วน
          </h2>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-2xl border-l-8 border-red-500 flex justify-between items-center shadow-md">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{item.title}</h3>
                  <p className="text-slate-500 text-sm">🏠 {item.address}</p>
                  <p className="text-red-500 text-sm mt-1 font-semibold">🕒 {item.status}</p>
                </div>
                <Link href="/visit-form">
                  <button className="bg-red-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-red-600 shadow-lg transition-all active:scale-95">
                    บันทึกเยี่ยมด่วน
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

// ส่วนประกอบย่อย (Sub-components)
function NavItem({ icon, label, href, active = false }: { icon: string, label: string, href: string, active?: boolean }) {
  return (
    <Link href={href} className={`flex items-center gap-3 p-3 rounded-xl transition ${active ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function StatCard({ label, value, unit, color }: { label: string, value: string, unit: string, color: 'red' | 'yellow' | 'green' }) {
  const colors = { red: 'border-red-500 text-red-600', yellow: 'border-yellow-400 text-yellow-600', green: 'border-green-500 text-green-600' };
  return (
    <div className={`bg-white p-6 rounded-2xl border-b-4 ${colors[color]} shadow-sm`}>
      <p className="text-slate-500 text-sm mb-1">{label}</p>
      <div className="text-3xl font-bold">{value} <span className="text-sm font-normal text-slate-400">{unit}</span></div>
    </div>
  );
}