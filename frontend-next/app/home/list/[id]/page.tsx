'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Thermometer, Gauge, HeartPulse, Waves, Weight, Wind, Droplet } from 'lucide-react'
import ItemMenuList from '@/components/ItemMenuList'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE

interface RiskRecord {
    risk_level: string
    symptoms: string
    recorded_at: string
}

interface VisitLog {
    note: string
    visited_at: string
}

// Metrics parsed out of the checkup note text — one hue, ordered by month (magnitude over time)
const TREND_METRICS = [
    { key: 'weight', label: 'Weight',               unit: 'kg',    re: /Weight:\s*([\d.]+)\s*kg/i },
    { key: 'pulse',  label: 'Pulse',                unit: 'bpm',   re: /Pulse:\s*([\d.]+)\s*bpm/i },
    { key: 'temp',   label: 'Temperature',          unit: '°C',    re: /Temp:\s*([\d.]+)\s*°C/i },
    { key: 'resp',   label: 'Respiratory Rate',     unit: '/min',  re: /Resp:\s*([\d.]+)\s*\/min/i },
    { key: 'spo2',   label: 'Oxygen (SpO2)',        unit: '%',     re: /SpO2:\s*([\d.]+)\s*%/i },
    { key: 'sugar',  label: 'Blood Sugar',          unit: 'mg/dL', re: /Blood sugar:\s*([\d.]+)\s*mg\/dL/i },
    { key: 'bp',     label: 'Blood Pressure (sys)', unit: 'mmHg',  re: /BP:\s*([\d.]+)\/[\d.]+\s*mmHg/i },
] as const

// ไอคอนของเมนูเลือก metric — ครบทุกตัว ตรงตามชื่อใน dropdown เดิม ธีมเดียวกัน (lucide-react, สไตล์ outline)
const TREND_ICONS = {
    'Weight':               Weight,
    'Pulse':                HeartPulse,
    'Temperature':          Thermometer,
    'Respiratory Rate':     Wind,
    'Oxygen (SpO2)':        Waves,
    'Blood Sugar':          Droplet,
    'Blood Pressure (sys)': Gauge,
}

// Catmull-Rom → cubic-Bezier smoothing (same technique as the Overview age-distribution chart)
function smoothPathD(points: { x: number; y: number }[], padTop: number, baseline: number) {
    if (points.length < 2) return ''
    if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`
    const clampY = (y: number) => Math.min(baseline, Math.max(padTop, y))
    let d = `M ${points[0].x} ${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] || points[i]
        const p1 = points[i]
        const p2 = points[i + 1]
        const p3 = points[i + 2] || p2
        const cp1x = p1.x + (p2.x - p0.x) / 6
        const cp1y = clampY(p1.y + (p2.y - p0.y) / 6)
        const cp2x = p2.x - (p3.x - p1.x) / 6
        const cp2y = clampY(p2.y - (p3.y - p1.y) / 6)
        d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
    }
    return d
}

// Monthly-average vital trend — smoothed line chart, single hue
function TrendLine({ points, unit }: { points: { label: string; value: number }[]; unit: string }) {
    if (points.length === 0) return <div className="vp-empty">Not enough monthly data for this metric yet</div>

    const h = 150, padX = 30, padTop = 20, padBottom = 26
    const n = points.length
    const w = Math.max(380, padX * 2 + (n - 1) * 64)
    const values = points.map(p => p.value)
    const max = Math.max(...values)
    const min = Math.min(...values)
    const range = max - min || 1
    const innerW = w - padX * 2
    const innerH = h - padTop - padBottom
    const stepX = n > 1 ? innerW / (n - 1) : 0
    const baseline = padTop + innerH

    const pts = points.map((p, i) => ({
        x: padX + (n > 1 ? i * stepX : innerW / 2),
        y: padTop + innerH - ((p.value - min) / range) * innerH,
        ...p,
    }))
    // จุดเดียว (มีข้อมูลแค่เดือนเดียว) วาดเส้น/พื้นที่ไม่ได้ — แสดงแค่จุดเดียวพอ
    const pathD = n > 1 ? smoothPathD(pts, padTop, baseline) : ''
    const areaD = n > 1 ? `${pathD} L ${pts[pts.length - 1].x} ${baseline} L ${pts[0].x} ${baseline} Z` : ''

    return (
        <div style={{ overflowX: 'auto' }}>
            <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
                <line x1={padX} y1={baseline} x2={w - padX} y2={baseline} stroke="#e5e7eb" strokeWidth={1} />
                {n > 1 && <path d={areaD} fill="rgba(22,163,74,0.08)" stroke="none" />}
                {n > 1 && <path d={pathD} fill="none" stroke="#16a34a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
                {pts.map((p, i) => (
                    <g key={i}>
                        <circle cx={p.x} cy={p.y} r={4} fill="#16a34a" stroke="#ffffff" strokeWidth={1.5} />
                        <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="11" fontWeight={700} fill="#000000" fontFamily="'Inter', sans-serif">{p.value}{unit}</text>
                        <text x={p.x} y={h - 6} textAnchor="middle" fontSize="10" fontWeight={600} fill="#374151" fontFamily="'Inter', sans-serif">{p.label}</text>
                        <title>{`${p.label}: ${p.value} ${unit}`}</title>
                    </g>
                ))}
            </svg>
        </div>
    )
}

interface Disease {
    id: number
    name: string
    note: string | null
    created_at: string
}

interface ElderlyDetail {
    id: number
    full_name: string
    photo: string | null
    age: number | null
    national_id: string | null
    created_at: string
    diseases: Disease[]
    latest_risk: RiskRecord | null
    recent_visits: VisitLog[]
}

export default function ElderlyDetailPage() {
    const params = useParams()
    const [elderly, setElderly] = useState<ElderlyDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [role, setRole] = useState<string>('')
    const [activeTab, setActiveTab] = useState<'health' | 'visits'>('health')
    const [fullVisits, setFullVisits] = useState<VisitLog[]>([])
    const [trendMetric, setTrendMetric] = useState<string>('weight')

    useEffect(() => {
        const storedRole = localStorage.getItem('role')
        if (storedRole) setRole(storedRole)
    }, [])

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await fetch(`${API_BASE}/elderly/${params.id}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                })
                const data = await res.json()
                if (data.success) setElderly(data.data)
                else setError(data.message || 'Recipient not found')
            } catch {
                setError('Unable to connect to the server')
            } finally {
                setLoading(false)
            }
        }
        if (params.id) fetchDetail()
    }, [params.id])

    // Full checkup history (unlike `recent_visits`, which the detail endpoint caps at 5) —
    // reuses the same /visits endpoint the Health Check History page already calls, so this
    // needs no backend change: it's the source for the "by month" vital signs trend below.
    useEffect(() => {
        const fetchAllVisits = async () => {
            try {
                const res = await fetch(`${API_BASE}/visits?elderly_id=${params.id}`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                })
                const data = await res.json()
                if (data.success) setFullVisits(data.data)
            } catch {
                // silent — the trend chart just falls back to "not enough data"
            }
        }
        if (params.id) fetchAllVisits()
    }, [params.id])

    // Group every checkup's parsed value for the selected metric by calendar month, average within
    // each month, and sort chronologically — this is what makes the trend chart "by month".
    // (Kept above the loading/error early-returns below — hooks can't be called conditionally.)
    const currentTrendMetric = TREND_METRICS.find(m => m.key === trendMetric) || TREND_METRICS[0]
    const monthlyTrend = useMemo(() => {
        const buckets = new Map<string, number[]>()
        for (const v of fullVisits) {
            const m = (v.note || '').match(currentTrendMetric.re)
            if (!m) continue
            const val = parseFloat(m[1])
            if (Number.isNaN(val)) continue
            const raw = v.visited_at.endsWith('Z') || v.visited_at.includes('+') ? v.visited_at : v.visited_at + 'Z'
            const d = new Date(raw)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            if (!buckets.has(key)) buckets.set(key, [])
            buckets.get(key)!.push(val)
        }
        return [...buckets.keys()].sort().map(key => {
            const vals = buckets.get(key)!
            const avg = vals.reduce((a, b) => a + b, 0) / vals.length
            const [y, mo] = key.split('-')
            const label = new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
            return { label, value: Math.round(avg * 10) / 10 }
        })
    }, [fullVisits, currentTrendMetric])

    const toUTC = (d: string) => d.endsWith('Z') || d.includes('+') ? d : d + 'Z'
    const formatDateShort = (d: string) => new Date(toUTC(d)).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })

    const css = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .dw { font-family: 'Inter', sans-serif; }

        /* BACK */
        .back-link {
            display: inline-flex; align-items: center; gap: 6px;
            font-size: 13px; font-weight: 600; color: #64748b;
            text-decoration: none; margin-bottom: 20px;
            padding: 7px 14px; border-radius: 10px;
            border: 1.5px solid #e2e8f0; background: white;
            transition: all 0.15s;
        }
        .back-link:hover { color: #16a34a; border-color: #bbf7d0; background: #f0fdf4; }

        /* 2-COL GRID */
        .two-col {
            display: grid;
            grid-template-columns: 300px 1fr;
            gap: 16px;
            align-items: start;
        }

        /* ── LEFT: HERO PANEL ── */
        .hero-panel {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            overflow: hidden;
        }

        /* gradient banner top */
        .hero-banner {
            height: 72px;
            background: #16a34a;
            position: relative;
        }

        .hero-body { padding: 0 22px 22px; }

        .hero-avatar-wrap { margin-bottom: 14px; padding-top: 16px; }
        .hero-avatar {
            width: 56px; height: 56px; border-radius: 16px; overflow: hidden;
            background: #16a34a;
            display: flex; align-items: center; justify-content: center;
            font-size: 22px; font-weight: 800; color: white;
            box-shadow: 0 6px 20px rgba(22,163,74,0.35);
            border: 3px solid white;
        }

        .disease-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
        .d-chip {
            display: inline-block; padding: 3px 11px; border-radius: 20px;
            background: #f0fdf4; border: 1px solid #bbf7d0;
            font-size: 12px; font-weight: 600; color: #15803d;
        }

        .hero-name {
            font-family: 'Inter', sans-serif; font-weight: 700;
            font-size: 20px; color: #000000;
            letter-spacing: -0.02em; line-height: 1.25;
            margin-bottom: 10px;
        }

        /* divider */
        .hero-divider { height: 1px; background: #f1f5f9; margin: 16px 0; }

        /* info rows */
        .info-item {
            display: flex; flex-direction: column; gap: 3px;
            padding: 10px 12px; border-radius: 10px;
            background: #f8fafc; border: 1px solid #f1f5f9;
            margin-bottom: 8px;
        }
        .info-item:last-child { margin-bottom: 0; }
        .info-lbl { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em; }
        .info-val { font-size: 13px; font-weight: 600; color: #000000; }

        /* stat row */
        .stat-row { display: flex; gap: 8px; margin-bottom: 8px; }
        .stat-box {
            flex: 1; background: #f8fafc; border: 1px solid #f1f5f9;
            border-radius: 10px; padding: 10px 10px 8px;
            text-align: center;
        }
        .stat-num  { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 22px; color: #000000; line-height: 1; }
        .stat-lbl2 { font-size: 10px; color: #6b7280; font-weight: 600; margin-top: 3px; }

        .btn-primary {
            display: flex; align-items: center; justify-content: center; gap: 7px;
            width: 100%; padding: 10px; border-radius: 11px; border: none; cursor: pointer;
            background: #16a34a;
            color: white; font-family: 'Inter', sans-serif;
            font-size: 13px; font-weight: 700; text-decoration: none;
            box-shadow: 0 4px 14px rgba(22,163,74,0.28); transition: all 0.18s;
            margin-top: 4px;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(22,163,74,0.38); }

        /* ── RIGHT: TAB PANEL ── */
        .tab-panel {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            overflow: hidden;
        }
        .tab-bar {
            display: flex; gap: 4px;
            border-bottom: 1px solid #f1f5f9;
            background: #fafbfc; padding: 0 8px;
        }
        .tab-btn {
            display: flex; align-items: center; gap: 8px;
            padding: 15px 18px; border: none; background: none;
            font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
            color: #6b7280; cursor: pointer; position: relative;
            transition: color 0.15s; white-space: nowrap;
        }
        .tab-btn:hover { color: #475569; }
        .tab-btn.on { color: #16a34a; }
        .tab-btn.on::after {
            content: ''; position: absolute;
            bottom: 0; left: 10px; right: 10px; height: 2.5px;
            border-radius: 2px 2px 0 0;
            background: #16a34a;
        }
        .tab-badge {
            min-width: 20px; height: 20px; border-radius: 10px; padding: 0 6px;
            background: #e2e8f0; color: #64748b;
            font-size: 11px; font-weight: 700;
            display: flex; align-items: center; justify-content: center;
        }
        .tab-btn.on .tab-badge { background: #dcfce7; color: #16a34a; }

        /* TAB BODY */
        .tab-body { padding: 22px 24px; min-height: 300px; }

        /* HEALTH rows */
        .h-row {
            display: flex; flex-direction: column; gap: 4px;
            padding: 13px 16px; background: #f8fafc;
            border: 1px solid #f1f5f9; border-radius: 12px; margin-bottom: 10px;
        }
        .h-row:last-child { margin-bottom: 0; }
        .h-lbl { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.07em; }
        .h-val { font-size: 14px; font-weight: 500; color: #000000; white-space: pre-wrap; padding-top: 2px; }

        /* VISIT timeline */
        .visit-item {
            display: flex; gap: 14px; align-items: flex-start;
            padding: 14px 0; border-bottom: 1px solid #f1f5f9;
        }
        .visit-item:last-child { border-bottom: none; }
        .visit-tl { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; padding-top: 6px; }
        .visit-dot {
            width: 12px; height: 12px; border-radius: 50%;
            background: #16a34a; border: 2px solid #bbf7d0;
            flex-shrink: 0;
        }
        .visit-line { width: 1.5px; flex: 1; min-height: 14px; background: #e2e8f0; margin-top: 5px; }
        .visit-content { flex: 1; min-width: 0; padding-top: 3px; }
        .visit-date { font-size: 11px; color: #6b7280; font-weight: 600; margin-bottom: 5px; }
        .visit-note { font-size: 14px; color: #334155; line-height: 1.55; }

        .empty-msg { text-align: center; padding: 52px 16px; color: #6b7280; font-size: 14px; }

        .view-all {
            display: block; text-align: center; padding: 14px;
            font-size: 13px; font-weight: 600; color: #16a34a;
            text-decoration: none; border-top: 1px solid #f1f5f9;
            background: #fafbfc; transition: background 0.12s;
        }
        .view-all:hover { background: #f1f5f9; }

        /* STATES */
        .loading-wrap { display: flex; justify-content: center; padding: 80px 0; }
        .spinner { width: 44px; height: 44px; border-radius: 50%; border: 3px solid #e2e8f0; border-top-color: #16a34a; animation: spin 0.75s linear infinite; }
        .error-wrap { text-align: center; padding: 80px 24px; }
        .error-title { font-size: 20px; font-weight: 700; color: #000000; margin-bottom: 8px; }
        .error-msg   { font-size: 14px; color: #ef4444; margin-bottom: 16px; }
        .error-back  { font-size: 13px; color: #16a34a; text-decoration: none; }
        .error-back:hover { text-decoration: underline; }

        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fadeIn 0.2s ease both; }

        /* RIGHT COLUMN + VITALS PANEL */
        .right-col { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
        .vitals-panel {
            background: #ffffff;
            border: 1px solid #e5e7eb; border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04); padding: 20px 22px;
        }
        .vp-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
        .vp-title { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 17px; color: #000000; }
        .vp-date { font-size: 12px; color: #6b7280; font-weight: 600; white-space: nowrap; }
        .vp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; }
        .vp-tile {
            background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px;
            padding: 11px 13px;
        }
        .vp-lbl { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 5px; }
        .vp-val { font-size: 18px; font-weight: 700; color: #000000; line-height: 1; }
        .vp-unit { font-size: 11px; font-weight: 600; color: #6b7280; margin-left: 4px; }
        .vp-empty { font-size: 13px; color: #6b7280; padding: 8px 2px; }
    `

    if (loading) return (<><style>{css}</style><div className="loading-wrap"><div className="spinner" /></div></>)
    if (error) return (<><style>{css}</style><div className="error-wrap"><div className="error-title">An error occurred</div><div className="error-msg">{error}</div><Link href="/home/list" className="error-back">← Back to list</Link></div></>)
    if (!elderly) return null

    const visitCount = elderly.recent_visits.length

    // ── ดึง Daily Vital Signs ล่าสุดจาก note ของการตรวจ (รูปแบบ "BP: 120/80 mmHg | Pulse: 72 bpm | ...") ──
    const parseVitals = (note: string) => {
        const grab = (re: RegExp) => note.match(re)?.[1]?.trim() || null
        return {
            bp:     grab(/BP:\s*([^|\n]+?)\s*mmHg/i),
            pulse:  grab(/Pulse:\s*([^|\n]+?)\s*bpm/i),
            temp:   grab(/Temp:\s*([^|\n]+?)\s*°C/i),
            resp:   grab(/Resp:\s*([^|\n]+?)\s*\/min/i),
            spo2:   grab(/SpO2:\s*([^|\n]+?)\s*%/i),
            sugar:  grab(/Blood sugar:\s*([^|\n]+?)\s*mg\/dL/i),
            weight: grab(/Weight:\s*([^|\n]+?)\s*kg/i),
        }
    }
    const latestVitalVisit = elderly.recent_visits.find(v => {
        const p = parseVitals(v.note || '')
        return Object.values(p).some(Boolean)
    })
    const vitals = latestVitalVisit ? parseVitals(latestVitalVisit.note) : null
    const vitalTiles = vitals ? ([
        { label: 'Blood Pressure', value: vitals.bp, unit: 'mmHg' },
        { label: 'Pulse', value: vitals.pulse, unit: 'bpm' },
        { label: 'Temperature', value: vitals.temp, unit: '°C' },
        { label: 'Respiratory Rate', value: vitals.resp, unit: '/min' },
        { label: 'Oxygen (SpO2)', value: vitals.spo2, unit: '%' },
        { label: 'Blood Sugar', value: vitals.sugar, unit: 'mg/dL' },
        { label: 'Weight', value: vitals.weight, unit: 'kg' },
    ].filter(t => t.value)) : []

    return (
        <div className="dw">
            <style>{css}</style>

            {/* BACK */}
            <Link href="/home/list" className="back-link">
                ← Back to list
            </Link>

            <div className="two-col">

                {/* ── LEFT: HERO PANEL ── */}
                <div className="hero-panel">
                    <div className="hero-banner" />
                    <div className="hero-body">
                        <div className="hero-avatar-wrap">
                            <div className="hero-avatar">
                                {elderly.photo
                                    ? <img src={elderly.photo} alt={elderly.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : elderly.full_name.charAt(0)}
                            </div>
                        </div>

                        <div className="hero-name">{elderly.full_name}</div>

                        {elderly.diseases && elderly.diseases.length > 0 && (
                            <div className="disease-chips">
                                {elderly.diseases.map(d => (
                                    <span key={d.id} className="d-chip" title={d.note || undefined}>{d.name}</span>
                                ))}
                            </div>
                        )}

                        <div className="hero-divider" />

                        {/* stat boxes */}
                        <div className="stat-row">
                            <div className="stat-box">
                                <div className="stat-num">{visitCount}</div>
                                <div className="stat-lbl2">Health Checks</div>
                            </div>
                            <div className="stat-box">
                                <div className="stat-num">{elderly.diseases?.length || 0}</div>
                                <div className="stat-lbl2">Diseases</div>
                            </div>
                        </div>

                        <div className="hero-divider" />

                        {/* detail rows */}
                        <div className="info-item">
                            <span className="info-lbl">Recipient ID</span>
                            <span className="info-val"># {elderly.id}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-lbl">Age</span>
                            <span className="info-val">{elderly.age != null ? `${elderly.age} years` : '—'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-lbl">National ID</span>
                            <span className="info-val">{elderly.national_id || '—'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-lbl">Added On</span>
                            <span className="info-val">{formatDateShort(elderly.created_at)}</span>
                        </div>
                        {visitCount > 0 && (
                            <div className="info-item">
                                <span className="info-lbl">Last Health Check</span>
                                <span className="info-val">{formatDateShort(elderly.recent_visits[0].visited_at)}</span>
                            </div>
                        )}

                        {role !== 'guardian' && (
                            <>
                                <div className="hero-divider" />
                                <Link href={`/home/visit?elderly_id=${elderly.id}`} className="btn-primary">
                                    Health Check History
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* ── RIGHT COLUMN ── */}
                <div className="right-col">

                {/* LATEST DAILY VITAL SIGNS */}
                <div className="vitals-panel">
                    <div className="vp-head">
                        <div className="vp-title">Latest Daily Vital Signs</div>
                        {latestVitalVisit && <div className="vp-date">{formatDateShort(latestVitalVisit.visited_at)}</div>}
                    </div>
                    {vitalTiles.length > 0 ? (
                        <div className="vp-grid">
                            {vitalTiles.map(t => (
                                <div className="vp-tile" key={t.label}>
                                    <div className="vp-lbl">{t.label}</div>
                                    <div className="vp-val">{t.value}<span className="vp-unit">{t.unit}</span></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="vp-empty">No vital signs recorded yet</div>
                    )}
                </div>

                {/* VITAL SIGNS TREND — by month */}
                <div className="vitals-panel">
                    <div className="vp-head">
                        <div className="vp-title">Vital Signs Trend</div>
                        <ItemMenuList
                            mode="dropdown"
                            items={TREND_METRICS.map(m => m.label)}
                            activeItem={currentTrendMetric.label}
                            icons={TREND_ICONS}
                            maxHeight={220}
                            onSelect={(label) => {
                                const found = TREND_METRICS.find(m => m.label === label)
                                if (found) setTrendMetric(found.key)
                            }}
                        />
                    </div>
                    <TrendLine points={monthlyTrend} unit={currentTrendMetric.unit} />
                </div>

                {/* ── TAB PANEL ── */}
                <div className="tab-panel">
                    <div className="tab-bar">
                        <button className={`tab-btn${activeTab === 'health' ? ' on' : ''}`} onClick={() => setActiveTab('health')}>
                            Diseases
                            <span className="tab-badge">{elderly.diseases?.length || 0}</span>
                        </button>
                        <button className={`tab-btn${activeTab === 'visits' ? ' on' : ''}`} onClick={() => setActiveTab('visits')}>
                            Health Check History
                            <span className="tab-badge">{visitCount}</span>
                        </button>
                    </div>

                    {/* DISEASES TAB */}
                    {activeTab === 'health' && (
                        <div className="tab-body fade-in">
                            {elderly.diseases && elderly.diseases.length > 0 ? (
                                elderly.diseases.map(d => (
                                    <div className="h-row" key={d.id}>
                                        <span className="h-lbl">{d.name}</span>
                                        <span className="h-val">{d.note || 'No additional notes'}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-msg">
                                    No diseases recorded
                                </div>
                            )}
                        </div>
                    )}

                    {/* VISITS TAB */}
                    {activeTab === 'visits' && (
                        <>
                            <div className="tab-body fade-in" style={{ paddingBottom: visitCount > 0 ? 4 : 24 }}>
                                {visitCount > 0 ? elderly.recent_visits.map((visit, i) => (
                                    <div className="visit-item" key={i}>
                                        <div className="visit-tl">
                                            <div className="visit-dot" />
                                            {i < visitCount - 1 && <div className="visit-line" />}
                                        </div>
                                        <div className="visit-content">
                                            <div className="visit-date">{formatDateShort(visit.visited_at)}</div>
                                            <div className="visit-note">{visit.note || 'No additional notes'}</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="empty-msg">
                                        No health check history yet
                                    </div>
                                )}
                            </div>
                            {visitCount > 0 && (
                                <Link href={`/home/visit?elderly_id=${elderly.id}`} className="view-all">
                                    View all history →
                                </Link>
                            )}
                        </>
                    )}
                </div>

                </div>

            </div>
        </div>
    )
}
