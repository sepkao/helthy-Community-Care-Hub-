'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 🔗 เตรียมไว้สำหรับ backend
      const res = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }

      // สมมติ backend login ผ่าน
      localStorage.setItem('login', 'true');
      router.push('/home');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form
        onSubmit={handleLogin}
        className="bg-white w-full max-w-md p-8 rounded-2xl shadow"
      >
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center">
  <Users className="text-white w-7 h-7" />
</div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center">
          Community Care Hub
        </h1>
        <p className="text-center text-slate-500 text-sm mb-6">
          ระบบดูแลประชาชนในชุมชน
        </p>

        {/* Username */}
        <label className="text-sm text-slate-600">ชื่อผู้ใช้งาน</label>
        <input
          className="w-full border rounded-xl p-3 mt-1 mb-4"
          placeholder="เช่น admin หรือ osm"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />

        {/* Password */}
        <label className="text-sm text-slate-600">รหัสผ่าน</label>
        <input
          type="password"
          className="w-full border rounded-xl p-3 mt-1 mb-4"
          placeholder="รหัสผ่าน"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm text-center mb-3">
            {error}
          </p>
        )}

        {/* Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold"
        >
          {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
        </button>
      </form>
    </div>
  );
}
