'use client';

import { useEffect, useState } from 'react';

type Patient = {
  id: number;
  name: string;
  age: number | null;
  risk_level: 'LOW' | 'HIGH' | 'NORMAL';
};



export default function UrgentPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
    useEffect(() => {
    // 🔧 mock data (เปลี่ยนเป็นเรียก API ทีหลัง
    setTimeout(() => {
      setPatients([
        { id: 1, name: 'นายสมชาย ใจดี', age: 68, risk_level: 'LOW' },
        { id: 2, name: 'นางสาวสุดา สุขใจ', age: 74, risk_level: 'HIGH' },
        ]);
        setLoading(false);
    }, 500);
    }, []);
    return (
    <div >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
        <div>
            <h1 className="text-2xl font-bold">ผู้รับการดูแลเร่งด่วน</h1>
            <p className="text-slate-500 text-sm">
            รายการผู้รับการดูแลที่มีความเสี่ยงสูง
            </p>

        </div>
    </div>
        {loading ? (
        <p>กำลังโหลดข้อมูล...</p>
        ) : (
        <table className="w-full table-auto border-collapse border-1 border-black rounded-xl"> 
            <thead>
            <tr className="bg-slate-50">
                <th className="p-3 text-left border border-black rounded-xl overflow-hidden">ชื่อ</th>
                <th className="p-3 border border-black rounded-xl overflow-hidden  ">อายุ</th>
                <th className="p-3 border border-black rounded-xl overflow-hidden ">ระดับความเสี่ยง</th>
            </tr>
            </thead>
            <tbody>
            {patients.map((p) => (
                <tr key={p.id} className="border-t">
                <td className="p-3  border border-black ">{p.name}</td>
                <td className="p-3  border border-black text-center">{p.age ?? '-'}</td>
                <td className="p-3  border border-black text-center">{p.risk_level}</td>     
                </tr>
            ))}
            </tbody>
        </table>
        )}
    </div>
    );
}