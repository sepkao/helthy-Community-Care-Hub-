'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Elderly {
  id: number;
  full_name: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export default function NewVisitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedId = searchParams.get('elderly_id');

  const [elderlyList, setElderlyList] = useState<Elderly[]>([]);
  const [selectedElderly, setSelectedElderly] = useState<string>(preSelectedId || '');
  const [urgency, setUrgency] = useState<'green' | 'yellow' | 'red'>('green');
  const [note, setNote] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check Role
    const role = localStorage.getItem('role');
    if (role === 'guardian') {
      alert('รหัสผู้ใช้ของคุณ (Guardian) ไม่สามารถบันทึกการเยี่ยมได้');
      router.push('/home');
      return;
    }

    const fetchElderly = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/elderly`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setElderlyList(data.data);
        } else {
          setError('ไม่สามารถดึงข้อมูลผู้สูงอายุได้');
        }
      } catch (err) {
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchElderly();
  }, [router]);

  const handleSubmit = async () => {
    if (!selectedElderly) {
      alert('กรุณาเลือกผู้รับการดูแล');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/visits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          elderly_id: parseInt(selectedElderly),
          urgency,
          note
        })
      });

      const data = await res.json();
      if (data.success) {
        router.push('/home/visit');
      } else {
        alert(data.message || 'บันทึกไม่สำเร็จ');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
          onClick={() => router.back()}
        >
          ‹
        </button>
        <h1 className="text-xl font-bold text-gray-800">บันทึกการเยี่ยมบ้าน</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 space-y-6">
        {/* Select patient */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            เลือกผู้รับการดูแล
          </label>
          <select
            className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={selectedElderly}
            onChange={(e) => setSelectedElderly(e.target.value)}
          >
            <option value="">-- เลือกผู้รับการดูแล --</option>
            {elderlyList.map(e => (
              <option key={e.id} value={e.id}>{e.full_name}</option>
            ))}
          </select>
        </div>

        {/* Urgency */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-3">
            ประเมินระดับความเร่งด่วน <span className="text-red-500">*</span>
          </label>

          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setUrgency('green')}
              className={`border rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-200
                                ${urgency === 'green' ? 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-500 ring-offset-1' : 'border-gray-200 hover:bg-green-50/50 text-gray-600'}`}
            >
              <div className={`w-3 h-3 rounded-full ${urgency === 'green' ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="font-medium">ปกติ (Green)</span>
            </button>
            <button
              onClick={() => setUrgency('yellow')}
              className={`border rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-200
                                ${urgency === 'yellow' ? 'border-yellow-500 bg-yellow-50 text-yellow-700 ring-2 ring-yellow-500 ring-offset-1' : 'border-gray-200 hover:bg-yellow-50/50 text-gray-600'}`}
            >
              <div className={`w-3 h-3 rounded-full ${urgency === 'yellow' ? 'bg-yellow-500' : 'bg-gray-300'}`} />
              <span className="font-medium">เฝ้าระวัง (Yellow)</span>
            </button>
            <button
              onClick={() => setUrgency('red')}
              className={`border rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-200
                                ${urgency === 'red' ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-500 ring-offset-1' : 'border-gray-200 hover:bg-red-50/50 text-gray-600'}`}
            >
              <div className={`w-3 h-3 rounded-full ${urgency === 'red' ? 'bg-red-500' : 'bg-gray-300'}`} />
              <span className="font-medium">วิกฤต (Red)</span>
            </button>
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-2">
            บันทึกรายละเอียด
          </label>
          <textarea
            className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all h-32 resize-none"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="รายละเอียดอาการ, การวัดค่า vital signs, หรือหมายเหตุอื่นๆ..."
          />
        </div>

        {/* Submit */}
        <button
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'กำลังบันทึก...' : '📋 บันทึกข้อมูล'}
        </button>
      </div>
    </div>
  );
}
