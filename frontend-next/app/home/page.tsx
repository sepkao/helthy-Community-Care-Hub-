'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, FileText } from 'lucide-react';

// ── Static Date Badge — pill-shaped, display-only (no click affordance) ──
function DateBadge({ date }: { date: string }) {
  return (
    <div className="date-badge">
      <Calendar size={13} strokeWidth={1.75} />
      <span>{date}</span>
    </div>
  );
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE;
const POLL_MS = 15000; // "real-time": refresh charts every 15s without flashing

interface DashboardStats {
  total_elderly: number;
  diseased_elderly: number;
  today_visits: number;
}

interface ElderlyLite {
  id: number;
  full_name: string;
  age: number | null;
  photo: string | null;
  created_at: string;
}

// Single accent hue for the line chart (magnitude across ordered age bands — one hue, not per-bucket color)
const AGE_LINE_COLOR = '#16a34a';
const UNKNOWN_COLOR = '#cbd5e1';

// 5-year bands — narrower, evenly-spaced buckets give the line more points to travel through,
// so as more recipients are added the curve fills in and reads as a smooth distribution
// instead of a few wide, unevenly-sized buckets that make the line jump sharply.
const AGE_BUCKETS: { label: string; test: (age: number) => boolean }[] = [
  { label: 'Under 60', test: (a) => a < 60 },
  { label: '60–64', test: (a) => a >= 60 && a <= 64 },
  { label: '65–69', test: (a) => a >= 65 && a <= 69 },
  { label: '70–74', test: (a) => a >= 70 && a <= 74 },
  { label: '75–79', test: (a) => a >= 75 && a <= 79 },
  { label: '80–84', test: (a) => a >= 80 && a <= 84 },
  { label: '85–89', test: (a) => a >= 85 && a <= 89 },
  { label: '90–94', test: (a) => a >= 90 && a <= 94 },
  { label: '95+',   test: (a) => a >= 95 },
];

// Catmull-Rom → cubic-Bezier smoothing, so the line curves through points instead of
// bending sharply at each one. Control points are clamped to the plot's vertical range
// so the curve never overshoots above/below the chart area.
function smoothPathD(points: { x: number; y: number }[], padTop: number, baseline: number) {
  if (points.length < 2) return '';
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  const clampY = (y: number) => Math.min(baseline, Math.max(padTop, y));
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = clampY(p1.y + (p2.y - p0.y) / 6);
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = clampY(p2.y - (p3.y - p1.y) / 6);
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

// ── Age distribution — smoothed line chart across ordered age bands, single hue ──
function AgeLine({ segments, total }: { segments: { label: string; value: number; color: string }[]; total: number }) {
  const [hover, setHover] = useState<number | null>(null);
  if (total === 0) return <div className="chart-empty">No age data yet</div>;

  const h = 130, padX = 26, padTop = 22, padBottom = 24;
  const n = segments.length;
  const w = Math.max(420, padX * 2 + (n - 1) * 52);
  const max = Math.max(...segments.map(s => s.value), 1);
  const innerW = w - padX * 2;
  const innerH = h - padTop - padBottom;
  const stepX = n > 1 ? innerW / (n - 1) : 0;
  const baseline = padTop + innerH;

  const points = segments.map((s, i) => ({
    x: padX + (n > 1 ? i * stepX : innerW / 2),
    y: padTop + innerH - (s.value / max) * innerH,
    ...s,
  }));
  const pathD = smoothPathD(points, padTop, baseline);
  const areaD = `${pathD} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
        <line x1={padX} y1={baseline} x2={w - padX} y2={baseline} stroke="#e5e7eb" strokeWidth={1} />
        <path d={areaD} fill="rgba(22,163,74,0.08)" stroke="none" />
        <path d={pathD} fill="none" stroke="#16a34a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={p.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }}>
            <circle cx={p.x} cy={p.y} r={hover === i ? 5 : 4} fill="#16a34a" stroke="#ffffff" strokeWidth={1.5} />
            <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="11" fontWeight={700} fill="#000000" fontFamily="'Inter', sans-serif">{p.value}</text>
            <text x={p.x} y={h - 6} textAnchor="middle" fontSize="10" fontWeight={600} fill="#374151" fontFamily="'Inter', sans-serif">{p.label}</text>
            <title>{`${p.label}: ${p.value} (${Math.round((p.value / total) * 100)}%)`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [elderlyList, setElderlyList] = useState<ElderlyLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }

    let cancelled = false;

    // Fetches dashboard stats + the recipient list (for the charts below) together.
    // On poll ticks (isInitial=false) we don't touch `loading` — the previous
    // chart/stat render stays on screen, no skeleton flash, per real-time refresh.
    const fetchAll = async (isInitial: boolean) => {
      try {
        const [statsRes, elderlyRes] = await Promise.all([
          fetch(`${API_BASE}/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE}/elderly`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const statsData = await statsRes.json().catch(() => null);
        const elderlyData = await elderlyRes.json().catch(() => null);
        if (cancelled) return;

        if (statsData?.success) setStats(statsData.data);
        if (elderlyData?.success) setElderlyList(elderlyData.data);

        if (!statsData?.success && !elderlyData?.success) setError('Unable to load data');
        else setError('');
      } catch (err) {
        console.error(err);
        if (isInitial) setError('Connection error');
      } finally {
        if (isInitial) setLoading(false);
      }
    };

    fetchAll(true);
    const interval = setInterval(() => fetchAll(false), POLL_MS);
    return () => { cancelled = true; clearInterval(interval); };
  }, [router]);

  // ── chart data, derived from the same live recipient list ──
  const ageSegments = useMemo(() => {
    const counts = AGE_BUCKETS.map(() => 0);
    let unknown = 0;
    for (const e of elderlyList) {
      if (e.age == null) { unknown++; continue; }
      const idx = AGE_BUCKETS.findIndex(b => b.test(e.age as number));
      if (idx >= 0) counts[idx]++; else unknown++;
    }
    const segs = AGE_BUCKETS.map((b, i) => ({ label: b.label, value: counts[i], color: AGE_LINE_COLOR }));
    if (unknown > 0) segs.push({ label: 'Unknown', value: unknown, color: UNKNOWN_COLOR });
    return segs;
  }, [elderlyList]);

  // Recipients added today (local date, matching the same toUTC convention used elsewhere in the app)
  const todayAddedList = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return elderlyList.filter(e => {
      if (!e.created_at) return false;
      const raw = e.created_at.endsWith('Z') || e.created_at.includes('+') ? e.created_at : e.created_at + 'Z';
      const d = new Date(raw);
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return dStr === todayStr;
    });
  }, [elderlyList]);
  const todayAddedCount = todayAddedList.length;

  // Total Patient growth badge — % added this calendar month vs. the base that existed before it
  const monthlyGrowthPercent = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let thisMonth = 0;
    let before = 0;
    for (const e of elderlyList) {
      if (!e.created_at) { before++; continue; }
      const raw = e.created_at.endsWith('Z') || e.created_at.includes('+') ? e.created_at : e.created_at + 'Z';
      const d = new Date(raw);
      if (d >= monthStart) thisMonth++; else before++;
    }
    if (before === 0) return thisMonth > 0 ? 100 : 0;
    return Math.round((thisMonth / before) * 100);
  }, [elderlyList]);

  const todayLabel = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    .topbar {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 28px; gap: 16px; flex-wrap: wrap;
    }
    .ptitle { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 32px; color: #000000; letter-spacing: -0.02em; }
    .psub   { font-size: 13px; color: #6b7280; margin-top: 4px; }

    /* Static Date Badge — pill, display-only, thin calendar icon + date text */
    .date-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: 999px;
      background: #f3f4f6; border: 1px solid #e5e7eb;
      color: #111827; font-family: 'Inter', sans-serif;
      font-weight: 700; font-size: 12px;
      white-space: nowrap; flex-shrink: 0;
    }
    .date-badge svg { flex-shrink: 0; color: #111827; }

    .ebox {
      background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.2);
      border-radius: 8px; padding: 13px 18px; font-size: 13px; color: #dc2626;
      margin-bottom: 24px;
    }
    .lwrap { display: flex; align-items: center; justify-content: center; min-height: 300px; }
    .sring {
      width: 44px; height: 44px; border-radius: 50%;
      border: 3px solid rgba(22,163,74,0.15); border-top-color: #16a34a;
      animation: spin 0.8s linear infinite;
    }

    .sgrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }

    /* bottom row: Recipients Added Today (70%) + Age Distribution (30%) — stretched to the same height */
    .bottom-row { display: grid; grid-template-columns: 7fr 3fr; gap: 24px; align-items: stretch; }
    .age-card { display: flex; flex-direction: column; height: 100%; }
    .age-body { flex: 1; display: flex; align-items: center; }
    /* vertical stat card: label on top, badge below it, number+unit at the bottom */
    .sc {
      border-radius: 8px; padding: 18px 18px 16px;
      display: flex; flex-direction: column; gap: 8px;
      background: #ffffff;
      border: 1.5px solid #e5e7eb;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      position: relative; overflow: hidden;
      animation: fadeUp 0.6s ease both;
    }
    .sc-watermark {
      position: absolute; top: -10px; right: -10px; z-index: 0;
      color: #000000; opacity: 0.06; pointer-events: none;
    }
    .slabel { font-size: 11px; font-weight: 600; color: #6b7280; letter-spacing: 0.03em; position: relative; z-index: 1; }
    .snum  { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 28px; color: #000000; line-height: 1; letter-spacing: -0.02em; }
    .snum-row { display: flex; align-items: baseline; gap: 6px; margin-top: auto; position: relative; z-index: 1; }
    .sunit { font-size: 12px; color: #6b7280; white-space: nowrap; }
    .sub-badge {
      display: inline-flex; align-items: center; align-self: flex-start;
      padding: 2px 8px; border-radius: 999px;
      background: #dcfce7; color: #15803d;
      font-size: 10px; font-weight: 700; letter-spacing: 0.01em;
      white-space: nowrap;
      position: relative; z-index: 1;
    }

    .ccard {
      background: #ffffff;
      border: 1.5px solid #e5e7eb;
      border-radius: 8px; padding: 20px 22px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .chead { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; gap: 10px; }
    .ctitle { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 14px; color: #000000; }
    .chart-empty { padding: 40px 0; text-align: center; font-size: 12px; color: #6b7280; }

    .today-table-wrap { overflow-x: auto; }
    .today-table { width: 100%; border-collapse: collapse; }
    .today-table thead tr { border-bottom: 1.5px solid #e5e7eb; }
    .today-table th {
      padding: 8px 12px; text-align: left;
      font-size: 10px; font-weight: 700; color: #6b7280;
      letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap;
    }
    .today-table tbody tr { border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background 0.12s; }
    .today-table tbody tr:last-child { border-bottom: none; }
    .today-table tbody tr:hover { background: #f9fafb; }
    .today-table td { padding: 8px 12px; vertical-align: middle; }
    .today-name-cell { display: flex; align-items: center; gap: 9px; }
    .today-avatar {
      width: 26px; height: 26px; border-radius: 6px; flex-shrink: 0;
      background: #16a34a; color: white; font-weight: 700; font-size: 11px;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }
    .today-name  { font-size: 13px; font-weight: 600; color: #000000; }
    .today-muted { font-size: 12px; color: #6b7280; }

    @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
    @keyframes spin   { to { transform: rotate(360deg); } }

    @media (max-width: 860px) {
      .bottom-row { grid-template-columns: 1fr; }
    }
  `;

  return (
    <>
      <style>{css}</style>

      <div className="topbar">
        <div>
          <h1 className="ptitle">Care Overview</h1>
          <p className="psub">Community Care Hub Management</p>
        </div>
        <DateBadge date={todayLabel} />
      </div>

      {error && (
        <div className="ebox">
          {error}
        </div>
      )}

      {loading ? (
        <div className="lwrap"><div className="sring" /></div>
      ) : (
        <>
          <div className="sgrid">
            <div className="sc">
              <Users className="sc-watermark" size={72} strokeWidth={1.5} />
              <div className="slabel">Total Patient</div>
              {monthlyGrowthPercent > 0 && <span className="sub-badge">+{monthlyGrowthPercent}% this month</span>}
              <div className="snum-row">
                <span className="snum">{stats?.total_elderly ?? 0}</span>
                <span className="sunit">people</span>
              </div>
            </div>
            <div className="sc">
              <Calendar className="sc-watermark" size={72} strokeWidth={1.5} />
              <div className="slabel">Today&apos;s Appointments</div>
              {todayAddedCount > 0 && <span className="sub-badge">+{todayAddedCount} patient</span>}
              <div className="snum-row">
                <span className="snum">{todayAddedCount}</span>
                <span className="sunit">added today</span>
              </div>
            </div>
            <div className="sc">
              <FileText className="sc-watermark" size={72} strokeWidth={1.5} />
              <div className="slabel">Health Check Records</div>
              <div className="snum-row">
                <span className="snum">{stats?.today_visits ?? 0}</span>
                <span className="sunit">checks</span>
              </div>
            </div>
          </div>

          <div className="bottom-row">
            <div className="ccard" style={{ marginBottom: 0 }}>
              <div className="chead">
                <div className="ctitle">Recipients Added Today</div>
              </div>
              {todayAddedList.length === 0 ? (
                <div className="chart-empty">No recipients added today</div>
              ) : (
                <div className="today-table-wrap">
                  <table className="today-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Created At</th>
                        <th>Age</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayAddedList.map(e => {
                        const raw = e.created_at.endsWith('Z') || e.created_at.includes('+') ? e.created_at : e.created_at + 'Z';
                        const createdAt = new Date(raw).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                        return (
                          <tr key={e.id} onClick={() => router.push(`/home/list/${e.id}`)}>
                            <td>
                              <div className="today-name-cell">
                                <span className="today-avatar">
                                  {e.photo
                                    ? <img src={e.photo} alt={e.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
                                    : e.full_name.charAt(0).toUpperCase()}
                                </span>
                                <span className="today-name">{e.full_name}</span>
                              </div>
                            </td>
                            <td className="today-muted">{createdAt}</td>
                            <td className="today-muted">{e.age != null ? e.age : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="ccard age-card" style={{ marginBottom: 0 }}>
              <div className="chead">
                <div className="ctitle">Age Distribution</div>
              </div>
              <div className="age-body">
                <AgeLine segments={ageSegments} total={elderlyList.length} />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
