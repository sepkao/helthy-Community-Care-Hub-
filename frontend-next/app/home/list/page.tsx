'use client';

import { useEffect, useState } from 'react';
import {
  getPatients,
  createPatient,
  updatePatient,
  deletePatient,
} from '@/lib/api';

type Patient = {
  id: number;
  name: string;
  age: number | null;
  risk_level: 'urgent' | 'watch' | 'normal';
};

export default function ListPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    age: '',
    risk_level: 'normal',
  });
  const [errors, setErrors] = useState<{
  name?: string;
  age?: string;
  }>({});

  function isFormValid() {
  return (
    form.name.trim() !== '' &&
    !/\d/.test(form.name) &&
    form.age !== '' &&
    Number(form.age) >= 0
  );
}

  function validate(form: { name: string; age: string }) {
  const newErrors: any = {};

  if (!form.name.trim()) {
    newErrors.name = 'กรุณากรอกชื่อ';
  } else if (/\d/.test(form.name)) {
    newErrors.name = 'ชื่อห้ามมีตัวเลข';
  }

  if (!form.age) {
    newErrors.age = 'กรุณากรอกอายุ';
  } else if (Number(form.age) < 0) {
    newErrors.age = 'อายุต้องมากกว่าหรือเท่ากับ 0';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
}


  async function load() {
    const data = await getPatients();
    setPatients(data);
  }

  async function handleCreate() {
  if (!validate(form)) return;

  await createPatient({
    name: form.name.trim(),
    age: Number(form.age),
    risk_level: form.risk_level,
  });
    setErrors({});

    setForm({ name: '', age: '', risk_level: 'normal' });
    load();
  }

  async function handleUpdate(id: number) {
  if (!validate(form)) return;

  await updatePatient(id, {
    name: form.name.trim(),
    age: Number(form.age),
    risk_level: form.risk_level,
  });

  setEditingId(null);
  setErrors({});
  load();
}


  async function handleDelete(id: number) {
    if (!confirm('ลบข้อมูลนี้หรือไม่')) return;
    await deletePatient(id);
    load();
  }

  function startEdit(p: Patient) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      age: String(p.age ?? ''),
      risk_level: p.risk_level,
    });
  }
  function validateField(
  name: 'name' | 'age',
  value: string
) {
  setErrors((prev) => {
    const next = { ...prev };

    if (name === 'name') {
      if (!value.trim()) {
        next.name = 'กรุณากรอกชื่อ';
      } else if (/\d/.test(value)) {
        next.name = 'ชื่อห้ามมีตัวเลข';
      } else {
        delete next.name;
      }
    }

    if (name === 'age') {
      if (!value) {
        next.age = 'กรุณากรอกอายุ';
      } else if (Number(value) < 0) {
        next.age = 'อายุต้องมากกว่าหรือเท่ากับ 0';
      } else {
        delete next.age;
      }
    }

    return next;
  });
}

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">รายชื่อผู้รับการดูแล</h1>

      {/* Add */}
      <div className="bg-white p-4 rounded-xl border mb-6 flex gap-2">
         <input
            placeholder="ชื่อ"
            value={form.name}
            onChange={(e) => {
                const value = e.target.value;
                if (!/\d/.test(value)) {
                    setForm({ ...form, name: value });
                    validateField('name', value);
                }
            }}

            className={`border p-2 rounded w-full ${
                errors.name ? 'border-red-500' : ''
            }`}
        />
  {errors.name && (
    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
  )}

         <input
            type="text"
            inputMode="numeric"
            placeholder="อายุ"
            value={form.age}
            onChange={(e) => {
                const v = e.target.value;

                if (/^\d*$/.test(v)) {
                    setForm({ ...form, age: v });

                // 🔥 ล้าง error อายุ
                    if (errors.age) {
                        setErrors((prev) => ({ ...prev, age: undefined }));
                }
    }
}}

                className="border p-2 rounded w-24"
        />
        <select
          value={form.risk_level}
          onChange={(e) =>
            setForm({ ...form, risk_level: e.target.value })
          }
          className="border p-2 rounded"
        >
          <option value="normal">ปกติ</option>
          <option value="watch">เฝ้าระวัง</option>
          <option value="urgent">เร่งด่วน</option>
        </select>

        <button
            onClick={handleCreate}
            disabled={!isFormValid()}
            className="bg-blue-600 text-white px-4 rounded disabled:opacity-50"
        >
            เพิ่ม
        </button>

      </div>

      {/* Table */}
      <table className="w-full bg-white rounded-xl border">
        <thead className="bg-slate-50">
          <tr>
            <th className="p-3 text-left">ชื่อ</th>
            <th className="p-3">อายุ</th>
            <th className="p-3">ความเสี่ยง</th>
            <th className="p-3">จัดการ</th>
          </tr>
        </thead>

        <tbody>
          {patients.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="p-3">{p.name}</td>
              <td className="p-3 text-center">{p.age ?? '-'}</td>
              <td className="p-3 text-center">{p.risk_level}</td>
              <td className="p-3 space-x-2 text-center">
                <button
                  onClick={() => startEdit(p)}
                  className="text-blue-600"
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="text-red-600"
                >
                  ลบ
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit */}
      {editingId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-96">
            <h2 className="font-bold mb-4">แก้ไขข้อมูล</h2>

            <input
                value={form.name}
                onChange={(e) => {
                    const value = e.target.value;
                    if (!/\d/.test(value)) {
                        setForm({ ...form, name: value });
                    }
                }}
                className="border p-2 w-full mb-2"
            />


            <input
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              className="border p-2 w-full mb-2"
            />
            <select
              value={form.risk_level}
              onChange={(e) =>
                setForm({ ...form, risk_level: e.target.value })
              }
              className="border p-2 w-full mb-4"
            >
              <option value="normal">ปกติ</option>
              <option value="watch">เฝ้าระวัง</option>
              <option value="urgent">เร่งด่วน</option>
            </select>

            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingId(null)}>ยกเลิก</button>
              <button
                onClick={() => handleUpdate(editingId)}
                className="bg-blue-600 text-white px-4 py-1 rounded"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
