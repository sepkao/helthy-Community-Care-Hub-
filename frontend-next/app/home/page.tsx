'use client';

import { useEffect, useState } from 'react';
import { getPatients } from '@/lib/api';

/* ======================
   Types
====================== */
type Patient = {
  id: number;
  name: string;
  age: number;
  risk_level: 'urgent' | 'watch' | 'normal';
};

/* ======================
   Card Component
====================== */
function Card({
  title,
  value,
  color = 'blue',
}: {
  title: string;
  value: string;
  color?: 'blue' | 'red' | 'yellow' | 'green';
}) {
  const map = {
    blue: 'border-slate-200',
    red: 'border-red-500',
    yellow: 'border-yellow-400',
    green: 'border-green-500',
  };

  return (
    <div className={`bg-white p-6 rounded-xl border-2 ${map[color]}`}>
      <p className="text-slate-500 text-sm">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}

/* ======================
   Home Page (Dashboard)
====================== */
export default function HomePage() {
  const [patients, setPatients] = useState<Patient[]>([]);

  useEffect(() => {
    getPatients().then(setPatients);
  }, []);

  // Dashboard calculation
  const total = patients.length;
  const urgent = patients.filter(p => p.risk_level === 'urgent').length;
  const watch = patients.filter(p => p.risk_level === 'watch').length;

  return (
    <>
      <h1 className="text-2xl font-bold mb-4">
        ภาพรวมสถานการณ์ชุมชน
      </h1>

      <p className="text-slate-500 mb-6">
        ยินดีต้อนรับ, Admin User
      </p>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card
          title="ผู้รับการดูแลทั้งหมด"
          value={String(total)}
        />
        <Card
          title="เคสเร่งด่วน"
          value={String(urgent)}
          color="red"
        />
        <Card
          title="เฝ้าระวัง"
          value={String(watch)}
          color="yellow"
        />
        <Card
          title="การเยี่ยมวันนี้"
          value="0"
          color="green"
        />
      </div>
    </>
  );
}
