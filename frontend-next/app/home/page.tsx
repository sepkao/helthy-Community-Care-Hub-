'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

interface DashboardStats {
  total_elderly: number;
  urgent_elderly: number;
  today_visits: number;
}

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (!token) {
      router.push('/login');
      return;
    }
    if (role) setUserRole(role);

    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE}/dashboard/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          if (data.success) {
            setStats(data.data);
          } else {
            setError('ไม่สามารถดึงข้อมูลได้');
          }
        } catch (e) {
          console.error('JSON Parse Error:', e);
          console.log('Raw Response:', text);
          setError('เกิดข้อผิดพลาดในการแปลงข้อมูล: ' + text.substring(0, 50));
        }
      } catch (err) {
        console.error(err);
        setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-10 w-10 text-blue-500" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">ภาพรวมการดูแล</h1>
          <p className="text-gray-500 mt-1">ยินดีต้อนรับกลับ, เข้าสู่ระบบการจัดการ Community CareHub</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 hidden md:block">
          <p className="text-sm text-gray-500">วันที่ปัจจุบัน</p>
          <p className="font-medium text-gray-800">
            {new Date().toLocaleDateString('th-TH', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Elderly Method */}
        <Link href="/home/list" className="block group">
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/20 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 transition-colors group-hover:bg-blue-100"></div>

            <div className="relative z-10">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                👥
              </div>
              <p className="text-gray-500 font-medium">ผู้สูงอายุในความดูแล</p>
              <h3 className="text-4xl font-bold text-gray-800 mt-2">
                {stats?.total_elderly || 0}
                <span className="text-lg font-normal text-gray-400 ml-2">คน</span>
              </h3>
            </div>

            <div className="mt-4 flex items-center gap-1 text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              ดูรายชื่อทั้งหมด <span>→</span>
            </div>
          </div>
        </Link>

        {/* Urgent Cases */}
        <Link href="/home/urgent" className="block group">
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/20 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full blur-3xl -mr-16 -mt-16 transition-colors group-hover:bg-orange-100"></div>

            <div className="relative z-10">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                ⚠️
              </div>
              <p className="text-gray-500 font-medium">เคสเฝ้าระวัง / เร่งด่วน</p>
              <h3 className="text-4xl font-bold text-gray-800 mt-2">
                {stats?.urgent_elderly || 0}
                <span className="text-lg font-normal text-gray-400 ml-2">เคส</span>
              </h3>
            </div>

            <div className="mt-4 flex items-center gap-1 text-orange-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              ดูเคสเร่งด่วน <span>→</span>
            </div>
          </div>
        </Link>

        {/* Today's Visits */}
        <Link href="/home/visit" className="block group">
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/20 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 transition-colors group-hover:bg-emerald-100"></div>

            <div className="relative z-10">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                📅
              </div>
              <p className="text-gray-500 font-medium">การเยี่ยมวันนี้</p>
              <h3 className="text-4xl font-bold text-gray-800 mt-2">
                {stats?.today_visits || 0}
                <span className="text-lg font-normal text-gray-400 ml-2">ครั้ง</span>
              </h3>
            </div>

            <div className="mt-4 flex items-center gap-1 text-emerald-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              ดูรายการเยี่ยม <span>→</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions (Optional, but makes the dashboard feel complete) */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-800 mb-4">เมนูด่วน</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/home/list" className="p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col items-center gap-2 text-center">
            <span className="text-3xl">🔍</span>
            <span className="font-medium text-gray-700">ค้นหาผู้สูงอายุ</span>
          </Link>

          {userRole !== 'guardian' && (
            <Link href="/home/list" className="p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col items-center gap-2 text-center">
              <span className="text-3xl">➕</span>
              <span className="font-medium text-gray-700">เพิ่มข้อมูลรายใหม่</span>
            </Link>
          )}

          {userRole !== 'guardian' && (
            <Link href="/home/visit/new" className="p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col items-center gap-2 text-center">
              <span className="text-3xl">📝</span>
              <span className="font-medium text-gray-700">บันทึกการเยี่ยม</span>
            </Link>
          )}

          <Link href="/home/visit" className="p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col items-center gap-2 text-center">
            <span className="text-3xl">📊</span>
            <span className="font-medium text-gray-700">ดูประวัติการเยี่ยม</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
