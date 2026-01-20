'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
      <div className="max-w-4xl w-full px-8">
        {/* Header */}
        <header className="mb-16 text-center">
          <h1 className="text-4xl font-extrabold text-blue-700 mb-4">
            🏥 Community Care Hub
          </h1>
          <p className="text-slate-600 text-lg">
            ระบบจัดการและติดตามการดูแลผู้ป่วยในชุมชน
          </p>
        </header>

        {/* Features */}
        <section className="grid md:grid-cols-3 gap-6 mb-16">
          <Feature
            icon="👥"
            title="จัดการผู้รับการดูแล"
            desc="บันทึกข้อมูลผู้ป่วย ติดตามอายุ และระดับความเสี่ยง"
          />
          <Feature
            icon="⚠️"
            title="แจ้งเตือนเคสเร่งด่วน"
            desc="ช่วยให้เจ้าหน้าที่ไม่พลาดเคสสำคัญ"
          />
          <Feature
            icon="📊"
            title="ภาพรวมสถานการณ์"
            desc="ดูข้อมูลสถิติชุมชนในรูปแบบ Dashboard"
          />
        </section>

        {/* Action */}
        <div className="text-center">
          <Link
            href="/login"
            className="inline-block bg-blue-600 text-white px-10 py-4 rounded-2xl text-lg font-medium hover:bg-blue-700 transition"
          >
            เข้าสู่ระบบผู้ดูแล
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-20 text-center text-slate-400 text-sm">
          Community Care Hub © 2026
        </footer>
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-slate-600 text-sm">{desc}</p>
    </div>
  );
}
