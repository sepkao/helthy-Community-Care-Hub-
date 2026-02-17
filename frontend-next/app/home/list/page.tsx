'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE

interface Elderly {
    id: number
    full_name: string
    created_at: string
    risk_level: string | null
}

export default function ElderlyListPage() {
    const [elderlyList, setElderlyList] = useState<Elderly[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [role, setRole] = useState<string>('')
    const [riskFilter, setRiskFilter] = useState<string>('')

    useEffect(() => {
        const storedRole = localStorage.getItem('role')
        if (storedRole) setRole(storedRole)
    }, [])

    // Modal states
    const [showModal, setShowModal] = useState(false)
    const [newName, setNewName] = useState('')
    const [riskLevel, setRiskLevel] = useState('low')
    const [symptoms, setSymptoms] = useState('')
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState('')

    // Guardian states
    interface User { id: number; email: string; role: string }
    const [guardians, setGuardians] = useState<User[]>([])
    const [selectedGuardian, setSelectedGuardian] = useState<string>('')

    // Fetch elderly list
    const fetchElderly = async (searchQuery = '', riskLevel = '') => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (searchQuery) params.set('search', searchQuery)
            if (riskLevel) params.set('risk_level', riskLevel)
            const queryString = params.toString()
            const url = queryString
                ? `${API_BASE}/elderly?${queryString}`
                : `${API_BASE}/elderly`

            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            const data = await res.json()

            if (data.success) {
                setElderlyList(data.data)
            } else {
                setError(data.message || 'ไม่สามารถดึงข้อมูลได้')
            }
        } catch {
            setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
        } finally {
            setLoading(false)
        }
    }

    // Fetch guardians
    const fetchGuardians = async () => {
        try {
            const res = await fetch(`${API_BASE}/auth/users`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            const data = await res.json()
            if (data.success) {
                setGuardians(data.data)
            }
        } catch (error) {
            console.error('Failed to fetch guardians', error)
        }
    }

    useEffect(() => {
        fetchElderly()
        fetchGuardians()
    }, [])

    // Handle search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        fetchElderly(search, riskFilter)
    }

    // Handle risk filter change
    const handleRiskFilter = (level: string) => {
        setRiskFilter(level)
        fetchElderly(search, level)
    }

    // Risk badge helper
    const getRiskBadge = (level: string | null) => {
        switch (level) {
            case 'low': return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">🟢 เสี่ยงต่ำ</span>
            case 'medium': return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">🟡 ปานกลาง</span>
            case 'high': return <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">🟠 สูง</span>
            case 'critical': return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">🔴 วิกฤต</span>
            default: return <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">ไม่ระบุ</span>
        }
    }

    const riskOptions = [
        { value: '', label: 'ทั้งหมด', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
        { value: 'low', label: '🟢 เสี่ยงต่ำ', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
        { value: 'medium', label: '🟡 ปานกลาง', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
        { value: 'high', label: '🟠 สูง', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
        { value: 'critical', label: '🔴 วิกฤต', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
    ]

    // Handle create new elderly
    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreateError('')

        if (!newName.trim()) {
            setCreateError('กรุณากรอกชื่อ-นามสกุล')
            return
        }

        setCreating(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${API_BASE}/elderly`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    full_name: newName,
                    risk_level: riskLevel,
                    symptoms: symptoms,
                    guardian_id: selectedGuardian ? parseInt(selectedGuardian) : null
                }),
            })

            const data = await res.json()

            if (data.success) {
                setShowModal(false)
                setNewName('')
                setRiskLevel('low')
                setSymptoms('')
                setSelectedGuardian('')
                fetchElderly(search) // Refresh list
            } else {
                setCreateError(data.message || 'ไม่สามารถเพิ่มข้อมูลได้')
            }
        } catch {
            setCreateError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
        } finally {
            setCreating(false)
        }
    }

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        })
    }

    // Visit Modal states
    const [showVisitModal, setShowVisitModal] = useState(false)
    const [selectedElderlyForVisit, setSelectedElderlyForVisit] = useState<Elderly | null>(null)
    const [visitUrgency, setVisitUrgency] = useState<'green' | 'yellow' | 'red'>('green')
    const [visitNote, setVisitNote] = useState('')
    const [submittingVisit, setSubmittingVisit] = useState(false)

    // Handle open visit modal
    const openVisitModal = (elderly: Elderly) => {
        setSelectedElderlyForVisit(elderly)
        setVisitUrgency('green')
        setVisitNote('')
        setShowVisitModal(true)
    }

    // Handle submit visit
    const handleVisitSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedElderlyForVisit) return

        try {
            setSubmittingVisit(true)
            const token = localStorage.getItem('token')
            const res = await fetch(`${API_BASE}/visits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    elderly_id: selectedElderlyForVisit.id,
                    urgency: visitUrgency,
                    note: visitNote
                })
            })

            const data = await res.json()

            if (data.success) {
                setShowVisitModal(false)
                setSelectedElderlyForVisit(null)
                setVisitUrgency('green')
                setVisitNote('')
                // Optional: Show success message or refresh something
            } else {
                alert(data.message || 'บันทึกไม่สำเร็จ')
            }
        } catch (error) {
            console.error('Submit visit error:', error)
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ')
        } finally {
            setSubmittingVisit(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="max-w-6xl">
                {/* Header */}
                <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <span className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white text-lg">
                                    👥
                                </span>
                                รายชื่อผู้รับการดูแล
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">จัดการข้อมูลผู้สูงอายุในความดูแล</p>
                        </div>

                        {/* Show Add Button only if NOT guardian */}
                        {role !== 'guardian' && (
                            <button
                                onClick={() => setShowModal(true)}
                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                เพิ่มผู้รับการดูแล
                            </button>
                        )}
                    </div>

                    {/* Search */}
                    <form onSubmit={handleSearch} className="mt-6 flex gap-3">
                        <div className="flex-1 relative">
                            <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="ค้นหาด้วยชื่อ..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all"
                        >
                            ค้นหา
                        </button>
                    </form>

                    {/* Risk Level Filter */}
                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="text-sm text-gray-500 py-2 mr-1">คัดกรอง:</span>
                        {riskOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => handleRiskFilter(opt.value)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${riskFilter === opt.value
                                        ? opt.color + ' ring-2 ring-offset-1 ring-blue-400 shadow-sm'
                                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="flex justify-center py-12">
                        <svg className="animate-spin h-10 w-10 text-blue-500" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    </div>
                )}

                {/* Cards Grid */}
                {!loading && elderlyList.length === 0 && (
                    <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-12 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-4">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700">ยังไม่มีข้อมูล</h3>
                        <p className="text-gray-500 mt-2">กดปุ่ม "เพิ่มผู้รับการดูแล" เพื่อเริ่มต้น</p>
                    </div>
                )}

                {!loading && elderlyList.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {elderlyList.map((elderly) => (
                            <div key={elderly.id} className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-white/20 flex flex-col gap-4">
                                <Link
                                    href={`/home/list/${elderly.id}`}
                                    className="block group"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                                            {elderly.full_name.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-semibold text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                                                {elderly.full_name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                {getRiskBadge(elderly.risk_level)}
                                                <span className="text-xs text-gray-400">•</span>
                                                <p className="text-sm text-gray-500">
                                                    เพิ่มเมื่อ {formatDate(elderly.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>

                                {/* Show Record Visit button only if NOT guardian */}
                                {role !== 'guardian' && (
                                    <button
                                        onClick={() => openVisitModal(elderly)}
                                        className="w-full py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 font-medium"
                                    >
                                        <span className="text-lg">📝</span> บันทึกการเยี่ยม
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Total Count */}
                {!loading && elderlyList.length > 0 && (
                    <div className="mt-6 text-center text-gray-500">
                        พบทั้งหมด {elderlyList.length} รายการ
                    </div>
                )}
            </div>

            {/* Create Elderly Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">เพิ่มผู้รับการดูแลใหม่</h2>
                                <p className="text-sm text-gray-500 mt-1">กรอกข้อมูลเบื้องต้นและประเมินความเสี่ยง</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowModal(false)
                                    setNewName('')
                                    setRiskLevel('low')
                                    setSymptoms('')
                                    setCreateError('')
                                    setSelectedGuardian('')
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {createError && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">
                                {createError}
                            </div>
                        )}

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">ชื่อ-นามสกุล *</label>
                                <input
                                    type="text"
                                    placeholder="เช่น นายสมชาย ใจดี"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    autoFocus
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">ผู้ดูแลรับผิดชอบ (Guardian)</label>
                                <select
                                    value={selectedGuardian}
                                    onChange={(e) => setSelectedGuardian(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                                >
                                    <option value="">-- เลือกผู้ดูแล --</option>
                                    {guardians.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.email} {user.role === 'admin' ? '(Admin)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">ระดับความเสี่ยง *</label>
                                <select
                                    value={riskLevel}
                                    onChange={(e) => setRiskLevel(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                                >
                                    <option value="low">🟢 เสี่ยงต่ำ (Low)</option>
                                    <option value="medium">🟡 เสี่ยงปานกลาง (Medium)</option>
                                    <option value="high">🟠 เสี่ยงสูง (High)</option>
                                    <option value="critical">🔴 วิกฤต (Critical)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">อาการเบื้องต้น / หมายเหตุ</label>
                                <textarea
                                    placeholder="เช่น ความดันสูง, เดินลำบาก, หลงลืม..."
                                    value={symptoms}
                                    onChange={(e) => setSymptoms(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false)
                                        setNewName('')
                                        setRiskLevel('low')
                                        setSymptoms('')
                                        setCreateError('')
                                        setSelectedGuardian('')
                                    }}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50"
                                >
                                    {creating ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Visit Modal */}
            {showVisitModal && selectedElderlyForVisit && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">บันทึกการเยี่ยม</h2>
                                <p className="text-sm text-gray-500 mt-1">คุณกำลังบันทึกเยี่ยม: <span className="font-semibold text-blue-600">{selectedElderlyForVisit.full_name}</span></p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowVisitModal(false)
                                    setSelectedElderlyForVisit(null)
                                }}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-all"
                            >
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleVisitSubmit} className="space-y-4">
                            {/* Urgency */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-3">
                                    ระดับความเร่งด่วน <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setVisitUrgency('green')}
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${visitUrgency === 'green'
                                            ? 'border-green-500 bg-green-50 text-green-700 ring-2 ring-green-500 ring-offset-1'
                                            : 'border-gray-200 hover:bg-green-50/50'
                                            }`}
                                    >
                                        <div className="w-3 h-3 rounded-full bg-green-500" />
                                        <span className="text-sm font-medium">ปกติ</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setVisitUrgency('yellow')}
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${visitUrgency === 'yellow'
                                            ? 'border-yellow-500 bg-yellow-50 text-yellow-700 ring-2 ring-yellow-500 ring-offset-1'
                                            : 'border-gray-200 hover:bg-yellow-50/50'
                                            }`}
                                    >
                                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                        <span className="text-sm font-medium">เฝ้าระวัง</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setVisitUrgency('red')}
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${visitUrgency === 'red'
                                            ? 'border-red-500 bg-red-50 text-red-700 ring-2 ring-red-500 ring-offset-1'
                                            : 'border-gray-200 hover:bg-red-50/50'
                                            }`}
                                    >
                                        <div className="w-3 h-3 rounded-full bg-red-500" />
                                        <span className="text-sm font-medium">เร่งด่วน</span>
                                    </button>
                                </div>
                            </div>

                            {/* Note */}
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-2">
                                    รายละเอียดการเยี่ยม
                                </label>
                                <textarea
                                    placeholder="อาการ, การวัดค่าต่างๆ, หรือข้อความถึงผู้ดูแล..."
                                    value={visitNote}
                                    onChange={(e) => setVisitNote(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none h-32"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowVisitModal(false)
                                        setSelectedElderlyForVisit(null)
                                    }}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingVisit}
                                    className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50"
                                >
                                    {submittingVisit ? 'กำลังบันทึก...' : 'บันทึกการเยี่ยม'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
