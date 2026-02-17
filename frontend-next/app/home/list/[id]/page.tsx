'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
    const router = useRouter()
    const [elderly, setElderly] = useState<ElderlyDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [role, setRole] = useState<string>('')

    useEffect(() => {
        const storedRole = localStorage.getItem('role')
        if (storedRole) setRole(storedRole)
    }, [])

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await fetch(`${API_BASE}/elderly/${params.id}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })
                const data = await res.json()

                if (data.success) {
                    setElderly(data.data)
                } else {
                    setError(data.message || 'ไม่พบข้อมูล')
                }
            } catch {
                setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
            } finally {
                setLoading(false)
            }
        }

        if (params.id) {
            fetchDetail()
        }
    }, [params.id])

    // Helper: Risk Badge Color
    const getRiskBadge = (level: string) => {
        switch (level) {
            case 'low': return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">🟢 เสี่ยงต่ำ (Low)</span>
            case 'medium': return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">🟡 เสี่ยงปานกลาง (Medium)</span>
            case 'high': return <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">🟠 เสี่ยงสูง (High)</span>
            case 'critical': return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">🔴 วิกฤต (Critical)</span>
            default: return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">ไม่ระบุ</span>
        }
    }

    // Helper: Date Format
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (loading) return (
        <div className="flex justify-center py-20">
            <svg className="animate-spin h-10 w-10 text-blue-500" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
        </div>
    )

    if (error) return (
        <div className="text-center py-20 space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">เกิดข้อผิดพลาด</h2>
            <p className="text-red-500">{error}</p>
            <Link href="/home/list" className="text-blue-600 hover:underline">กลับไปหน้ารายชื่อ</Link>
        </div>
    )

    if (!elderly) return null

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Back Button */}
            <Link href="/home/list" className="inline-flex items-center text-gray-500 hover:text-blue-600 transition-colors">
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                กลับไปหน้ารายชื่อ
            </Link>

            {/* Header Card */}
            <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl p-8 border border-white/20">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-lg flex-shrink-0">
                        {elderly.full_name.charAt(0)}
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-800">{elderly.full_name}</h1>
                            {getRiskBadge(elderly.latest_risk?.risk_level || 'unknown')}
                        </div>
                        <p className="text-gray-500">
                            เข้าสู่ระบบเมื่อ {formatDate(elderly.created_at)}
                        </p>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-2">
                            {role !== 'guardian' && (
                                <Link
                                    href={`/home/visit?elderly_id=${elderly.id}`}
                                    className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-md hover:shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center gap-2"
                                >
                                    <span className="text-lg">📝</span>
                                    บันทึกการเยี่ยม
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Risk Info */}
                <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-white/20">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">🩺</span>
                        ข้อมูลสุขภาพล่าสุด
                    </h2>

                    {elderly.latest_risk ? (
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">บันทึกเมื่อ</p>
                                <p className="font-medium text-gray-800">{formatDate(elderly.latest_risk.recorded_at)}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">อาการ / หมายเหตุ</p>
                                <p className="font-medium text-gray-800 whitespace-pre-wrap">
                                    {elderly.latest_risk.symptoms || '-'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">ไม่มีข้อมูลความเสี่ยง</p>
                    )}
                </div>

                {/* Recent Visits */}
                <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-xl p-6 border border-white/20">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="text-2xl">🗓️</span>
                        ประวัติการเยี่ยมล่าสุด
                    </h2>

                    <div className="space-y-4">
                        {elderly.recent_visits.length > 0 ? (
                            elderly.recent_visits.map((visit, index) => (
                                <div key={index} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:bg-white hover:shadow-md transition-all">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600">
                                        ✓
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-500 mb-1">
                                            {formatDate(visit.visited_at)}
                                        </p>
                                        <p className="text-gray-800 line-clamp-2">
                                            {visit.note || 'ไม่มีบันทึกเพิ่มเติม'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                ยังไม่มีประวัติการเยี่ยม
                            </div>
                        )}

                        {elderly.recent_visits.length > 0 && (
                            <Link
                                href={`/home/visit?elderly_id=${elderly.id}`}
                                className="block text-center text-blue-600 hover:underline text-sm font-medium pt-2"
                            >
                                ดูทั้งหมด
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
