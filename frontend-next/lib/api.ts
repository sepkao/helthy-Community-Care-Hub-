const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export async function getPatients() {
  const res = await fetch(`${API_BASE}/patients`);
  return res.json();
}

export async function createPatient(data: any) {
  await fetch(`${API_BASE}/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function updatePatient(id: number, data: any) {
  await fetch(`${API_BASE}/patients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function deletePatient(id: number) {
  await fetch(`${API_BASE}/patients/${id}`, {
    method: 'DELETE',
  });
}
