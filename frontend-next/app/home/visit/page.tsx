'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

/* ======================
   Types
====================== */
type Visit = {
  id: number;
  patient_name: string;
  caregiver_name: string;
  visit_date: string; // ISO date
  visited_at: string;
  note: string;
};

/* ======================
   Visit Page
====================== */
export default function VisitPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const elderlyId = searchParams.get('elderly_id');

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    if (storedRole) setRole(storedRole);
  }, []);

  const fetchVisits = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `${API_BASE}/visits`;
      if (elderlyId) url += `?elderly_id=${elderlyId}`;
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setVisits(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch visits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, [elderlyId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {elderlyId && visits.length > 0
              ? `ประวัติการเยี่ยม - ${visits[0].patient_name}`
              : 'การเยี่ยมวันนี้'}
          </h1>
          <p className="text-slate-500 text-sm">
            {elderlyId ? 'แสดงเฉพาะรายการเยี่ยมของบุคคลนี้' : 'รายการบันทึกการเยี่ยมผู้รับการดูแล'}
          </p>
        </div>

        {role !== 'guardian' && (
          <button onClick={() => router.push('/home/visit/new')}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white
                            hover:bg-blue-700 transition shadow-lg"
          >
            + เพิ่มการเยี่ยม
          </button>
        )}
      </div>

      {/* Content */}
      {
        loading ? (
          <div className="flex justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : visits.length === 0 ? (
          <div className="bg-white p-12 rounded-xl border text-center text-slate-500 shadow-sm">
            <div className="text-4xl mb-3">📝</div>
            <p>ยังไม่มีข้อมูลการเยี่ยม</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 font-medium">
                <tr>
                  <th className="text-left px-6 py-4">ผู้รับการดูแล</th>
                  <th className="text-left px-6 py-4">วันที่เยี่ยม</th>
                  <th className="text-left px-6 py-4">รายละเอียด</th>
                  <th className="text-left px-6 py-4">ผู้บันทึก</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {visits.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{v.patient_name}</td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {formatDate(v.visited_at)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 max-w-md truncate">
                      {v.note || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {v.caregiver_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div >
  );
}
