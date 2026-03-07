'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

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

interface ElderlyDetail {
    id: number
    full_name: string
    created_at: string
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
                else setError(data.message || 'ไม่พบข้อมูล')
            } catch {
                setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
            } finally {
                setLoading(false)
            }
        }
        if (params.id) fetchDetail()
    }, [params.id])

    const riskConfig: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
        low: { label: 'เสี่ยงต่ำ', dot: '#10b981', bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
        medium: { label: 'ปานกลาง', dot: '#f59e0b', bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
        high: { label: 'สูง', dot: '#f97316', bg: '#fff7ed', text: '#9a3412', border: '#fed7aa' },
        critical: { label: 'วิกฤต', dot: '#ef4444', bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
    }

    const getRiskBadge = (level: string) => {
        const cfg = riskConfig[level]
        if (!cfg) return (
            <span style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                ไม่ระบุ
            </span>
        )
        return (
            <span style={{ background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`, padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, flexShrink: 0, display: 'inline-block' }} />
                {cfg.label}
            </span>
        )
    }

    const toUTC = (d: string) => d.endsWith('Z') || d.includes('+') ? d : d + 'Z'
    const formatDate = (d: string) => new Date(toUTC(d)).toLocaleDateString('th-TH', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
    const formatDateShort = (d: string) => new Date(toUTC(d)).toLocaleDateString('th-TH', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })

    const css = `
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&family=DM+Serif+Display&display=swap');

        .dw { font-family: 'Sarabun', sans-serif; }

        /* BACK */
        .back-link {
            display: inline-flex; align-items: center; gap: 6px;
            font-size: 13px; font-weight: 600; color: #64748b;
            text-decoration: none; margin-bottom: 20px;
            padding: 7px 14px; border-radius: 10px;
            border: 1.5px solid #e2e8f0; background: white;
            transition: all 0.15s;
        }
        .back-link:hover { color: #3b82f6; border-color: #bfdbfe; background: #eff6ff; }

        /* 2-COL GRID */
        .two-col {
            display: grid;
            grid-template-columns: 300px 1fr;
            gap: 16px;
            align-items: start;
        }

        /* ── LEFT: HERO PANEL ── */
        .hero-panel {
            background: rgba(255,255,255,0.88);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255,255,255,0.7);
            border-radius: 22px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.06);
            overflow: hidden;
        }

        /* gradient banner top */
        .hero-banner {
            height: 72px;
            background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
            position: relative;
        }
        .hero-banner::after {
            content: '';
            position: absolute; inset: 0;
            background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.06'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }

        .hero-body { padding: 0 22px 22px; }

        .hero-avatar-wrap { margin-bottom: 14px; padding-top: 16px; }
        .hero-avatar {
            width: 56px; height: 56px; border-radius: 16px;
            background: linear-gradient(135deg, #3b82f6, #6366f1);
            display: flex; align-items: center; justify-content: center;
            font-size: 22px; font-weight: 800; color: white;
            box-shadow: 0 6px 20px rgba(59,130,246,0.35);
            border: 3px solid white;
        }

        .hero-name {
            font-family: 'DM Serif Display', serif;
            font-size: 20px; color: #0f172a;
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
        .info-lbl { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; }
        .info-val { font-size: 13px; font-weight: 600; color: #1e293b; }

        /* stat row */
        .stat-row { display: flex; gap: 8px; margin-bottom: 8px; }
        .stat-box {
            flex: 1; background: #f8fafc; border: 1px solid #f1f5f9;
            border-radius: 10px; padding: 10px 10px 8px;
            text-align: center;
        }
        .stat-num  { font-family: 'DM Serif Display', serif; font-size: 22px; color: #1e293b; line-height: 1; }
        .stat-lbl2 { font-size: 10px; color: #94a3b8; font-weight: 600; margin-top: 3px; }

        .btn-primary {
            display: flex; align-items: center; justify-content: center; gap: 7px;
            width: 100%; padding: 10px; border-radius: 11px; border: none; cursor: pointer;
            background: linear-gradient(135deg, #3b82f6, #6366f1);
            color: white; font-family: 'Sarabun', sans-serif;
            font-size: 13px; font-weight: 700; text-decoration: none;
            box-shadow: 0 4px 14px rgba(59,130,246,0.28); transition: all 0.18s;
            margin-top: 4px;
        }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(59,130,246,0.38); }

        /* ── RIGHT: TAB PANEL ── */
        .tab-panel {
            background: rgba(255,255,255,0.88);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255,255,255,0.7);
            border-radius: 22px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.06);
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
            font-family: 'Sarabun', sans-serif; font-size: 14px; font-weight: 600;
            color: #94a3b8; cursor: pointer; position: relative;
            transition: color 0.15s; white-space: nowrap;
        }
        .tab-btn:hover { color: #475569; }
        .tab-btn.on { color: #3b82f6; }
        .tab-btn.on::after {
            content: ''; position: absolute;
            bottom: 0; left: 10px; right: 10px; height: 2.5px;
            border-radius: 2px 2px 0 0;
            background: linear-gradient(90deg, #3b82f6, #6366f1);
        }
        .tab-ic {
            width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center; font-size: 14px;
            background: #f1f5f9; transition: background 0.15s;
        }
        .tab-btn.on .tab-ic { background: #eff6ff; }
        .tab-badge {
            min-width: 20px; height: 20px; border-radius: 10px; padding: 0 6px;
            background: #e2e8f0; color: #64748b;
            font-size: 11px; font-weight: 700;
            display: flex; align-items: center; justify-content: center;
        }
        .tab-btn.on .tab-badge { background: #dbeafe; color: #3b82f6; }

        /* TAB BODY */
        .tab-body { padding: 22px 24px; min-height: 300px; }

        /* HEALTH rows */
        .h-row {
            display: flex; flex-direction: column; gap: 4px;
            padding: 13px 16px; background: #f8fafc;
            border: 1px solid #f1f5f9; border-radius: 12px; margin-bottom: 10px;
        }
        .h-row:last-child { margin-bottom: 0; }
        .h-lbl { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; }
        .h-val { font-size: 14px; font-weight: 500; color: #1e293b; white-space: pre-wrap; padding-top: 2px; }

        /* VISIT timeline */
        .visit-item {
            display: flex; gap: 14px; align-items: flex-start;
            padding: 14px 0; border-bottom: 1px solid #f1f5f9;
        }
        .visit-item:last-child { border-bottom: none; }
        .visit-tl { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
        .visit-dot {
            width: 30px; height: 30px; border-radius: 9px;
            background: #eff6ff; border: 1.5px solid #bfdbfe;
            display: flex; align-items: center; justify-content: center;
            font-size: 13px; color: #3b82f6; font-weight: 700;
        }
        .visit-line { width: 1.5px; flex: 1; min-height: 14px; background: #e2e8f0; margin-top: 5px; }
        .visit-content { flex: 1; min-width: 0; padding-top: 3px; }
        .visit-date { font-size: 11px; color: #94a3b8; font-weight: 600; margin-bottom: 5px; }
        .visit-note { font-size: 14px; color: #334155; line-height: 1.55; }

        .empty-msg { text-align: center; padding: 52px 16px; color: #94a3b8; font-size: 14px; }
        .empty-ico  { font-size: 32px; margin-bottom: 10px; }

        .view-all {
            display: block; text-align: center; padding: 14px;
            font-size: 13px; font-weight: 600; color: #3b82f6;
            text-decoration: none; border-top: 1px solid #f1f5f9;
            background: #fafbfc; transition: background 0.12s;
        }
        .view-all:hover { background: #f1f5f9; }

        /* STATES */
        .loading-wrap { display: flex; justify-content: center; padding: 80px 0; }
        .spinner { width: 44px; height: 44px; border-radius: 50%; border: 3px solid #e2e8f0; border-top-color: #3b82f6; animation: spin 0.75s linear infinite; }
        .error-wrap { text-align: center; padding: 80px 24px; }
        .error-title { font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
        .error-msg   { font-size: 14px; color: #ef4444; margin-bottom: 16px; }
        .error-back  { font-size: 13px; color: #3b82f6; text-decoration: none; }
        .error-back:hover { text-decoration: underline; }

        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        .fade-in { animation: fadeIn 0.2s ease both; }
    `

    if (loading) return (<><style>{css}</style><div className="loading-wrap"><div className="spinner" /></div></>)
    if (error) return (<><style>{css}</style><div className="error-wrap"><div className="error-title">เกิดข้อผิดพลาด</div><div className="error-msg">{error}</div><Link href="/home/list" className="error-back">← กลับไปหน้ารายชื่อ</Link></div></>)
    if (!elderly) return null

    const visitCount = elderly.recent_visits.length

    return (
        <div className="dw">
            <style>{css}</style>

            {/* BACK */}
            <Link href="/home/list" className="back-link">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
                กลับไปหน้ารายชื่อ
            </Link>

            <div className="two-col">

                {/* ── LEFT: HERO PANEL ── */}
                <div className="hero-panel">
                    <div className="hero-banner" />
                    <div className="hero-body">
                        <div className="hero-avatar-wrap">
                            <div className="hero-avatar">{elderly.full_name.charAt(0)}</div>
                        </div>

                        <div className="hero-name">{elderly.full_name}</div>

                        <div style={{ marginBottom: 12 }}>
                            {getRiskBadge(elderly.latest_risk?.risk_level || 'unknown')}
                        </div>

                        <div className="hero-divider" />

                        {/* stat boxes */}
                        <div className="stat-row">
                            <div className="stat-box">
                                <div className="stat-num">{visitCount}</div>
                                <div className="stat-lbl2">การเยี่ยม</div>
                            </div>
                            <div className="stat-box">
                                <div className="stat-num" style={{ fontSize: 14, paddingTop: 4 }}>
                                    {elderly.latest_risk ? '✓' : '—'}
                                </div>
                                <div className="stat-lbl2">มีข้อมูลสุขภาพ</div>
                            </div>
                        </div>

                        <div className="hero-divider" />

                        {/* detail rows */}
                        <div className="info-item">
                            <span className="info-lbl">ID ผู้รับการดูแล</span>
                            <span className="info-val"># {elderly.id}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-lbl">เพิ่มเข้าระบบเมื่อ</span>
                            <span className="info-val">{formatDateShort(elderly.created_at)}</span>
                        </div>
                        {elderly.latest_risk && (
                            <div className="info-item">
                                <span className="info-lbl">บันทึกสุขภาพล่าสุด</span>
                                <span className="info-val">{formatDateShort(elderly.latest_risk.recorded_at)}</span>
                            </div>
                        )}
                        {visitCount > 0 && (
                            <div className="info-item">
                                <span className="info-lbl">เยี่ยมล่าสุด</span>
                                <span className="info-val">{formatDateShort(elderly.recent_visits[0].visited_at)}</span>
                            </div>
                        )}

                        {role !== 'guardian' && (
                            <>
                                <div className="hero-divider" />
                                <Link href={`/home/visit?elderly_id=${elderly.id}`} className="btn-primary">
                                    <span>📝</span> ประวัติการเยี่ยม
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* ── RIGHT: TAB PANEL ── */}
                <div className="tab-panel">
                    <div className="tab-bar">
                        <button className={`tab-btn${activeTab === 'health' ? ' on' : ''}`} onClick={() => setActiveTab('health')}>
                            <span className="tab-ic">🩺</span>
                            ข้อมูลสุขภาพ
                        </button>
                        <button className={`tab-btn${activeTab === 'visits' ? ' on' : ''}`} onClick={() => setActiveTab('visits')}>
                            <span className="tab-ic">🗓️</span>
                            ประวัติการเยี่ยม
                            <span className="tab-badge">{visitCount}</span>
                        </button>
                    </div>

                    {/* HEALTH TAB */}
                    {activeTab === 'health' && (
                        <div className="tab-body fade-in">
                            {elderly.latest_risk ? (
                                <>
                                    <div className="h-row">
                                        <span className="h-lbl">บันทึกเมื่อ</span>
                                        <span className="h-val">{formatDate(elderly.latest_risk.recorded_at)}</span>
                                    </div>
                                    <div className="h-row">
                                        <span className="h-lbl">ระดับความเสี่ยง</span>
                                        <span className="h-val" style={{ paddingTop: 6 }}>
                                            {getRiskBadge(elderly.latest_risk.risk_level)}
                                        </span>
                                    </div>
                                    <div className="h-row">
                                        <span className="h-lbl">อาการ / หมายเหตุ</span>
                                        <span className="h-val">{elderly.latest_risk.symptoms || '-'}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="empty-msg">
                                    <div className="empty-ico">🩺</div>
                                    ไม่มีข้อมูลสุขภาพ
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
                                            <div className="visit-dot">✓</div>
                                            {i < visitCount - 1 && <div className="visit-line" />}
                                        </div>
                                        <div className="visit-content">
                                            <div className="visit-date">{formatDateShort(visit.visited_at)}</div>
                                            <div className="visit-note">{visit.note || 'ไม่มีบันทึกเพิ่มเติม'}</div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="empty-msg">
                                        <div className="empty-ico">🗓️</div>
                                        ยังไม่มีประวัติการเยี่ยม
                                    </div>
                                )}
                            </div>
                            {visitCount > 0 && (
                                <Link href={`/home/visit?elderly_id=${elderly.id}`} className="view-all">
                                    ดูประวัติทั้งหมด →
                                </Link>
                            )}
                        </>
                    )}
                </div>

            </div>
        </div>
    )
}