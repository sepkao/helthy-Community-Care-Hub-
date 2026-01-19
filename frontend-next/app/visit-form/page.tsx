'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function VisitForm() {
  const [healthStatus, setHealthStatus] = useState('')
  const [gps, setGps] = useState<{lat: number, lng: number} | null>(null)

  const getlocation = () => {
    navigator.geolocation.getCurrentPosition((pos) => {
      setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude })
    })
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 flex flex-col items-center">
      {/* เพิ่ม text-slate-800 เพื่อให้เห็นตัวหนังสือชัดเจน */}
      <div className="w-full max-w-md bg-white shadow-2xl rounded-[2rem] p-8 border border-slate-200 text-slate-800">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-blue-900">บันทึกการเยี่ยมบ้าน</h2>
            <p className="text-slate-400 text-sm">กรุณากรอกข้อมูลให้ครบถ้วน</p>
          </div>
          <Link href="/" className="bg-slate-100 p-2 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all">✕</Link>
        </div>

        {/* 1. Checklist อาการด่วน */}
        <div className="mb-8">
          <p className="font-bold text-slate-800 mb-4">🩺 อาการโดยรวม</p>
          <div className="grid grid-cols-2 gap-4">
            {['ปกติ', 'ผิดปกติ', 'ความดันสูง', 'ทานยาครบ'].map((item) => (
              <button 
                key={item}
                onClick={() => setHealthStatus(item)}
                className={`p-4 rounded-2xl font-bold transition-all border-2 ${healthStatus === item ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200'}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <button className="w-full p-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-blue-700 transition-all active:scale-95">
          ยืนยันการส่งข้อมูล
        </button>
      </div>
    </div>
  )
}