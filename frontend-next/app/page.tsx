'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white  ">
        {/* 🔹 INNER TOP BAR (ติดบนสุดของหน้า) */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur shadow-sm ">
        <div className="w-full px-6 md:px-12 lg:px-20 mx-auto">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-lg font-bold text-slate-800">
              Community Care Hub
            </h1>

            <Link href="/login" className="inline-block bg-blue-600 text-white px-5 py-1 rounded-2xl text-lg font-medium hover:bg-blue-700 transition"
            >
              เข้าสู่ระบบผู้ดูแล
            </Link>
          </div>
        </div>  
      </div>

      
       

        {/* Footer */}
        <footer className="mt-20 text-center text-slate-400 text-sm">
          Community Care Hub © 2026
        </footer>
    </div>
   
  );
}


