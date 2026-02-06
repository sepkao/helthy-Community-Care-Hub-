'use client';

import { useState } from 'react';

export default function VisitPage() {
  const [urgency, setUrgency] = useState<'green' | 'yellow' | 'red'>('green');
  const [note, setNote] = useState('');

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xl cursor-pointer">‹</span>
        <h1 className="text-xl font-bold">บันทึกการเยี่ยมบ้าน</h1>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl border p-6 space-y-6">
        {/* Select patient */}
        <div>
          <label className="text-sm font-medium">
            เลือกผู้รับการดูแล
          </label>
          <select className="mt-1 w-full border rounded-xl p-3">
            {/* ต่อ database เอง */}
            <option>-- เลือกผู้รับการดูแล --</option>
          </select>
        </div>

        {/* Patient info */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
          โรคประจำตัว: - <br />
          สถานะเดิม: -
        </div>

        {/* Urgency */}
        <div>
          <label className="text-sm font-medium block mb-3">
            ประเมินระดับความเร่งด่วน (หลังการเยี่ยม) <span className="text-red-500">*</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Green */}
            <button
              type="button"
              onClick={() => setUrgency('green')}
              className={`border rounded-xl p-4 text-left transition
                ${
                  urgency === 'green'
                    ? 'border-green-500 bg-green-50'
                    : 'hover:border-slate-300'
                }`}
            >
              <div className="text-green-600 font-semibold mb-1">
                ปกติ (เขียว)
              </div>
              <p className="text-sm text-slate-600">
                อาการคงที่ ปลอดภัย
              </p>
            </button>

            {/* Yellow */}
            <button
              type="button"
              onClick={() => setUrgency('yellow')}
              className={`border rounded-xl p-4 text-left transition
                ${
                  urgency === 'yellow'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'hover:border-slate-300'
                }`}
            >
              <div className="text-yellow-600 font-semibold mb-1">
                เฝ้าระวัง (เหลือง)
              </div>
              <p className="text-sm text-slate-600">
                มีอาการผิดปกติเล็กน้อย
              </p>
            </button>

            {/* Red */}
            <button
              type="button"
              onClick={() => setUrgency('red')}
              className={`border rounded-xl p-4 text-left transition
                ${
                  urgency === 'red'
                    ? 'border-red-500 bg-red-50'
                    : 'hover:border-slate-300'
                }`}
            >
              <div className="text-red-600 font-semibold mb-1">
                เร่งด่วน (แดง)
              </div>
              <p className="text-sm text-slate-600">
                ต้องการความช่วยเหลือทันที
              </p>
            </button>
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="text-sm font-medium">
            บันทึกอาการ / รายละเอียดการเยี่ยม
          </label>
          <textarea
            className="mt-1 w-full border rounded-xl p-3 min-h-[120px]"
            placeholder="ระบุอาการ สัญญาณชีพ การทานยา หรือปัญหาที่พบ..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* Submit */}
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
        >
          📋 บันทึกข้อมูล
        </button>
      </div>
    </div>
  );
}
