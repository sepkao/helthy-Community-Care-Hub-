// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_BASE;

export async function getItems() {
  const res = await fetch(`${API_BASE}/items`);
  return res.json();
}
