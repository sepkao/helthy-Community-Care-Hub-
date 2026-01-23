'use client';

import { useEffect, useState } from 'react';

/* ======================
   Types
====================== */
type Visit = {
  id: number;
  patient_name: string;
  visit_date: string; // ISO date
  note?: string;
  status: 'done' | 'pending';
};

/* ======================
   Visit Page
====================== */
export default function VisitPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔧 mock data (เปลี่ยนเป็นเรียก API ทีหลัง)
    setTimeout(() => {
      setVisits([
        {
          id: 1,
          patient_name: 'นายสมชาย ใจดี',
          visit_date: '2026-01-23',
          status: 'pending',
        },
        {
          id: 2,
          patient_name: 'นางสาวสุดา สุขใจ',
          visit_date: '2026-01-23',
          status: 'done',
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">การเยี่ยมวันนี้</h1>
          <p className="text-slate-500 text-sm">
            รายการบันทึกการเยี่ยมผู้รับการดูแล
          </p>
        </div>

        <button
          className="px-4 py-2 rounded-lg bg-blue-600 text-white
                     hover:bg-blue-700 transition"
        >
          + เพิ่มการเยี่ยม
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <p className="text-slate-500">กำลังโหลดข้อมูล...</p>
      ) : visits.length === 0 ? (
        <div className="bg-white p-6 rounded-xl border text-center text-slate-500">
          ยังไม่มีข้อมูลการเยี่ยมวันนี้
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3">ผู้รับการดูแล</th>
                <th className="text-left px-4 py-3">วันที่เยี่ยม</th>
                <th className="text-left px-4 py-3">สถานะ</th>
                <th className="px-4 py-3 text-right">จัดการ</th>
              </tr>
            </thead>

            <tbody>
              {visits.map((v) => (
                <tr key={v.id} className="border-t">
                  <td className="px-4 py-3">{v.patient_name}</td>
                  <td className="px-4 py-3">{v.visit_date}</td>
                  <td className="px-4 py-3">
                    {v.status === 'done' ? (
                      <span className="text-green-600 font-medium">
                        ✔ เสร็จแล้ว
                      </span>
                    ) : (
                      <span className="text-yellow-600 font-medium">
                        ⏳ รอดำเนินการ
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-blue-600 hover:underline">
                      ดูรายละเอียด
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
