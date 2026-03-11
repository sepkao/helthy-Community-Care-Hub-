'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE

interface Elderly {
    id: number
    full_name: string
    created_at: string
    risk_level: string | null
}

function ElderlyListPageInner() {
    const router = useRouter()
    const searchParams = useSearchParams()
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

    const [showModal, setShowModal] = useState(false)
    const [newName, setNewName] = useState('')
    const [riskLevel, setRiskLevel] = useState('low')
    const [symptoms, setSymptoms] = useState('')
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState('')

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState<Elderly | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Edit risk level state
    const [editRiskTarget, setEditRiskTarget] = useState<Elderly | null>(null)
    const [editRiskLevel, setEditRiskLevel] = useState<string>('low')
    const [editRiskNote, setEditRiskNote] = useState<string>('')
    const [editingRisk, setEditingRisk] = useState(false)
    const [editRiskError, setEditRiskError] = useState<string>('')

    interface User { id: number; email: string; role: string }
    const [guardians, setGuardians] = useState<User[]>([])
    const [selectedGuardian, setSelectedGuardian] = useState<string>('')

    const fetchElderly = async (searchQuery = '', riskLevel = '') => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (searchQuery) params.set('search', searchQuery)
            if (riskLevel) params.set('risk_level', riskLevel)
            const queryString = params.toString()
            const url = queryString ? `${API_BASE}/elderly?${queryString}` : `${API_BASE}/elderly`
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            const data = await res.json()
            if (data.success) setElderlyList(data.data)
            else setError(data.message || 'ไม่สามารถดึงข้อมูลได้')
        } catch {
            setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
        } finally {
            setLoading(false)
        }
    }

    const fetchGuardians = async () => {
        try {
            const res = await fetch(`${API_BASE}/auth/users`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            const data = await res.json()
            if (data.success) setGuardians(data.data)
        } catch (error) {
            console.error('Failed to fetch guardians', error)
        }
    }

    useEffect(() => {
        const riskParam = searchParams.get('risk')?.toLowerCase() || ''
        if (riskParam) {
            setRiskFilter(riskParam)
            fetchElderly('', riskParam)
        } else {
            fetchElderly()
        }
        fetchGuardians()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        fetchElderly(search, riskFilter)
    }

    const handleRiskFilter = (level: string) => {
        setRiskFilter(level)
        fetchElderly(search, level)
    }

    const riskConfig: Record<string, { label: string; dot: string; bg: string; text: string }> = {
        low:    { label: 'เสี่ยงต่ำ',  dot: '#10b981', bg: '#ecfdf5', text: '#065f46' },
        medium: { label: 'ปานกลาง',   dot: '#f59e0b', bg: '#fffbeb', text: '#92400e' },
        high:   { label: 'สูง',        dot: '#f97316', bg: '#fff7ed', text: '#9a3412' },
    }

    const getRiskBadge = (level: string | null) => {
        const cfg = level ? riskConfig[level] : null
        if (!cfg) return (
            <span style={{ background: '#f1f5f9', color: '#64748b', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                ไม่ระบุ
            </span>
        )
        return (
            <span style={{ background: cfg.bg, color: cfg.text, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
                {cfg.label}
            </span>
        )
    }

    const riskOptions = [
        { value: '', label: 'ทั้งหมด' },
        { value: 'low', label: 'เสี่ยงต่ำ 🟢' },
        { value: 'medium', label: 'ปานกลาง🟡' },
        { value: 'high', label: 'สูง🟠' }
    ]

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreateError('')
        if (!newName.trim()) { setCreateError('กรุณากรอกชื่อ-นามสกุล'); return }
        setCreating(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${API_BASE}/elderly`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    full_name: newName, risk_level: riskLevel, symptoms,
                    guardian_id: selectedGuardian ? parseInt(selectedGuardian) : null
                }),
            })
            const data = await res.json()
            if (data.success) {
                setShowModal(false); setNewName(''); setRiskLevel('low')
                setSymptoms(''); setSelectedGuardian(''); fetchElderly(search)
            } else { setCreateError(data.message || 'ไม่สามารถเพิ่มข้อมูลได้') }
        } catch { setCreateError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้') }
        finally { setCreating(false) }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setDeleting(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${API_BASE}/elderly/${deleteTarget.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            })
            const data = await res.json()
            if (data.success) {
                setDeleteTarget(null)
                fetchElderly(search, riskFilter)
            } else {
                alert(data.message || 'ไม่สามารถลบข้อมูลได้')
            }
        } catch {
            alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
        } finally {
            setDeleting(false)
        }
    }

    const handleEditRisk = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editRiskTarget) return
        setEditRiskError('')
        setEditingRisk(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${API_BASE}/elderly/${editRiskTarget.id}/risk`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ risk_level: editRiskLevel, symptoms: editRiskNote }),
            })
            const data = await res.json()
            if (data.success) {
                setEditRiskTarget(null)
                setEditRiskNote('')
                fetchElderly(search, riskFilter)
            } else {
                setEditRiskError(data.message || 'ไม่สามารถแก้ไขได้')
            }
        } catch {
            setEditRiskError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
        } finally {
            setEditingRisk(false)
        }
    }

    const toUTC = (d: string) => d.endsWith('Z') || d.includes('+') ? d : d + 'Z'
    const formatDate = (dateString: string) =>
        new Date(toUTC(dateString)).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })

    const css = `
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap');
        .page-wrap { font-family: 'Sarabun', sans-serif; }

        .toolbar {
            background: rgba(255,255,255,0.85); backdrop-filter: blur(16px);
            border: 1px solid rgba(255,255,255,0.7); border-radius: 20px;
            padding: 20px 24px; margin-bottom: 16px; box-shadow: 0 2px 16px rgba(0,0,0,0.05);
        }
        .toolbar-top { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
        .page-title { font-size: 22px; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 10px; }
        .page-sub   { font-size: 13px; color: #94a3b8; margin-top: 3px; }

        .btn-add {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 10px 20px; border-radius: 12px; border: none; cursor: pointer;
            background: linear-gradient(135deg, #3b82f6, #6366f1); color: white;
            font-family: 'Sarabun', sans-serif; font-size: 14px; font-weight: 600;
            box-shadow: 0 4px 14px rgba(59,130,246,0.35); transition: all 0.18s;
        }
        .btn-add:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(59,130,246,0.45); }

        .search-row { display: flex; gap: 10px; margin-bottom: 12px; }
        .search-box { flex: 1; position: relative; }
        .search-box input {
            width: 100%; padding: 10px 14px 10px 40px;
            border: 1.5px solid #e2e8f0; border-radius: 12px;
            font-family: 'Sarabun', sans-serif; font-size: 14px; color: #1e293b;
            background: #f8fafc; outline: none; transition: all 0.15s;
        }
        .search-box input:focus { border-color: #3b82f6; background: white; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
        .btn-search {
            padding: 10px 20px; border-radius: 12px; border: 1.5px solid #e2e8f0;
            background: white; font-family: 'Sarabun', sans-serif; font-size: 14px;
            font-weight: 600; color: #475569; cursor: pointer; transition: all 0.15s;
        }
        .btn-search:hover { background: #f1f5f9; border-color: #cbd5e1; }

        .filter-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .filter-label { font-size: 12px; color: #94a3b8; font-weight: 600; }
        .fpill {
            padding: 5px 14px; border-radius: 20px; border: 1.5px solid transparent;
            font-family: 'Sarabun', sans-serif; font-size: 12px; font-weight: 600;
            cursor: pointer; transition: all 0.15s; background: #f1f5f9; color: #64748b;
        }
        .fpill:hover { background: #e2e8f0; }
        .fpill.active { background: #eff6ff; color: #3b82f6; border-color: #bfdbfe; }

        .table-wrap {
            background: rgba(255,255,255,0.85); backdrop-filter: blur(16px);
            border: 1px solid rgba(255,255,255,0.7); border-radius: 20px;
            overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.05);
        }
        table { width: 100%; border-collapse: collapse; }
        thead tr { background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; }
        th { padding: 12px 20px; text-align: left; font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap; }
        th:last-child { text-align: right; }
        tbody tr { border-bottom: 1px solid #f1f5f9; transition: background 0.12s; }
        tbody tr:last-child { border-bottom: none; }
        tbody tr:hover { background: rgba(59,130,246,0.03); }
        td { padding: 14px 20px; vertical-align: middle; }
        td:last-child { text-align: right; }

        .td-name { display: flex; align-items: center; gap: 12px; }
        .avatar {
            width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
            background: linear-gradient(135deg, #3b82f6, #6366f1);
            display: flex; align-items: center; justify-content: center;
            font-size: 15px; font-weight: 700; color: white;
        }
        .name-text { font-size: 14px; font-weight: 600; color: #1e293b; }
        .name-id   { font-size: 11px; color: #94a3b8; margin-top: 1px; }
        .date-text { font-size: 13px; color: #64748b; }

        .act-row { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
        .btn-view {
            padding: 6px 14px; border-radius: 8px; border: 1.5px solid #e2e8f0;
            background: white; font-family: 'Sarabun', sans-serif;
            font-size: 13px; font-weight: 600; color: #475569;
            cursor: pointer; text-decoration: none; transition: all 0.15s;
            display: inline-flex; align-items: center; gap: 5px;
        }
        .btn-view:hover { background: #f8fafc; border-color: #cbd5e1; color: #1e293b; }
        .btn-visit {
            padding: 6px 14px; border-radius: 8px; border: none;
            background: #eff6ff; font-family: 'Sarabun', sans-serif;
            font-size: 13px; font-weight: 600; color: #3b82f6;
            cursor: pointer; transition: all 0.15s;
            display: inline-flex; align-items: center; gap: 5px;
        }
        .btn-visit:hover { background: #dbeafe; }
        .btn-delete {
            padding: 6px 14px; border-radius: 8px; border: none;
            background: #fef2f2; font-family: 'Sarabun', sans-serif;
            font-size: 13px; font-weight: 600; color: #dc2626;
            cursor: pointer; transition: all 0.15s;
            display: inline-flex; align-items: center; gap: 5px;
        }
        .btn-delete:hover { background: #fee2e2; }
        .btn-edit-risk {
            padding: 6px 14px; border-radius: 8px; border: none;
            background: #f0fdf4; font-family: 'Sarabun', sans-serif;
            font-size: 13px; font-weight: 600; color: #16a34a;
            cursor: pointer; transition: all 0.15s;
            display: inline-flex; align-items: center; gap: 5px;
        }
        .btn-edit-risk:hover { background: #dcfce7; }

        .del-modal { background: white; border-radius: 20px; box-shadow: 0 24px 60px rgba(0,0,0,0.18); padding: 28px; width: 100%; max-width: 400px; text-align: center; }
        .del-icon { width: 56px; height: 56px; border-radius: 16px; background: #fef2f2; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 26px; }
        .del-title { font-size: 17px; font-weight: 700; color: #1e293b; margin-bottom: 6px; }
        .del-sub { font-size: 13px; color: #64748b; margin-bottom: 20px; line-height: 1.5; }
        .del-name { font-weight: 700; color: #dc2626; }
        .del-btns { display: flex; gap: 10px; }
        .btn-del-cancel { flex: 1; padding: 11px; border-radius: 11px; border: 1.5px solid #e2e8f0; background: white; font-family: 'Sarabun', sans-serif; font-size: 14px; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.15s; }
        .btn-del-cancel:hover { background: #f1f5f9; }
        .btn-del-confirm { flex: 1; padding: 11px; border-radius: 11px; border: none; background: linear-gradient(135deg, #ef4444, #dc2626); font-family: 'Sarabun', sans-serif; font-size: 14px; font-weight: 700; color: white; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px rgba(239,68,68,0.3); }
        .btn-del-confirm:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(239,68,68,0.4); }
        .btn-del-confirm:disabled { opacity: 0.55; cursor: not-allowed; }

        .count-bar { padding: 12px 24px; border-top: 1px solid #f1f5f9; font-size: 13px; color: #94a3b8; background: #fafbfc; }

        .empty-box { padding: 64px 24px; text-align: center; }
        .empty-icon { width: 64px; height: 64px; border-radius: 20px; background: #f1f5f9; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center; font-size: 28px; }
        .empty-title { font-size: 16px; font-weight: 700; color: #1e293b; margin-bottom: 6px; }
        .empty-sub   { font-size: 13px; color: #94a3b8; }

        .ebox { background: #fef2f2; border: 1px solid #fecaca; border-radius: 14px; padding: 12px 18px; margin-bottom: 14px; font-size: 13px; color: #dc2626; display: flex; align-items: center; gap: 8px; }

        .loading-wrap { display: flex; justify-content: center; padding: 64px 0; }
        .spinner { width: 40px; height: 40px; border-radius: 50%; border: 3px solid #e2e8f0; border-top-color: #3b82f6; animation: spin 0.75s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .overlay { position: fixed; inset: 0; z-index: 50; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal { background: white; border-radius: 24px; box-shadow: 0 24px 60px rgba(0,0,0,0.18); padding: 28px 28px 24px; width: 100%; max-width: 440px; }
        .modal-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 22px; }
        .modal-title { font-size: 18px; font-weight: 700; color: #1e293b; }
        .modal-sub   { font-size: 12px; color: #94a3b8; margin-top: 3px; }
        .modal-close { width: 30px; height: 30px; border-radius: 8px; border: none; background: #f1f5f9; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; transition: background 0.15s; }
        .modal-close:hover { background: #e2e8f0; }
        .form-group { margin-bottom: 16px; }
        .form-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
        .form-input, .form-select, .form-textarea {
            width: 100%; padding: 10px 14px; box-sizing: border-box;
            border: 1.5px solid #e2e8f0; border-radius: 11px;
            font-family: 'Sarabun', sans-serif; font-size: 14px; color: #1e293b;
            background: #f8fafc; outline: none; transition: all 0.15s;
        }
        .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: #3b82f6; background: white; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
        .form-textarea { resize: none; }
        .form-error { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #dc2626; margin-bottom: 14px; }
        .btn-row { display: flex; gap: 10px; margin-top: 20px; }
        .btn-cancel { flex: 1; padding: 11px; border-radius: 11px; border: 1.5px solid #e2e8f0; background: white; font-family: 'Sarabun', sans-serif; font-size: 14px; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.15s; }
        .btn-cancel:hover { background: #f1f5f9; }
        .btn-submit { flex: 1; padding: 11px; border-radius: 11px; border: none; background: linear-gradient(135deg, #3b82f6, #6366f1); font-family: 'Sarabun', sans-serif; font-size: 14px; font-weight: 700; color: white; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px rgba(59,130,246,0.3); }
        .btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(59,130,246,0.4); }
        .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }
    `

    return (
        <div className="page-wrap">
            <style>{css}</style>

            <div className="toolbar">
                <div className="toolbar-top">
                    <div>
                        <div className="page-title">
                            <span style={{ width: 38, height: 38, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', borderRadius: 11, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👥</span>
                            รายชื่อผู้รับการดูแล
                        </div>
                        <div className="page-sub">จัดการข้อมูลผู้สูงอายุในความดูแล</div>
                    </div>
                    {role !== 'guardian' && (
                        <button className="btn-add" onClick={() => setShowModal(true)}>
                            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>
                            เพิ่มผู้รับการดูแล
                        </button>
                    )}
                </div>

                <form className="search-row" onSubmit={handleSearch}>
                    <div className="search-box">
                        <svg className="search-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                        </svg>
                        <input type="text" placeholder="ค้นหาด้วยชื่อ..."
                            value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <button type="submit" className="btn-search">ค้นหา</button>
                </form>

                <div className="filter-row">
                    <span className="filter-label">คัดกรอง:</span>
                    {riskOptions.map(opt => (
                        <button key={opt.value} className={`fpill${riskFilter === opt.value ? ' active' : ''}`}
                            onClick={() => handleRiskFilter(opt.value)}>
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="ebox">
                    <svg width="15" height="15" fill="currentColor" viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    {error}
                </div>
            )}

            <div className="table-wrap">
                {loading ? (
                    <div className="loading-wrap"><div className="spinner" /></div>
                ) : elderlyList.length === 0 ? (
                    <div className="empty-box">
                        <div className="empty-icon">👥</div>
                        <div className="empty-title">ยังไม่มีข้อมูล</div>
                        <div className="empty-sub">กดปุ่ม &quot;เพิ่มผู้รับการดูแล&quot; เพื่อเริ่มต้น</div>
                    </div>
                ) : (
                    <>
                        <table>
                            <thead>
                                <tr>
                                    <th>ชื่อ-นามสกุล</th>
                                    <th>ระดับความเสี่ยง</th>
                                    <th>วันที่เพิ่ม</th>
                                    <th>การดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {elderlyList.map((elderly) => (
                                    <tr key={elderly.id}>
                                        <td>
                                            <div className="td-name">
                                                <div className="avatar">{elderly.full_name.charAt(0)}</div>
                                                <div>
                                                    <div className="name-text">{elderly.full_name}</div>
                                                    <div className="name-id">ID #{elderly.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{getRiskBadge(elderly.risk_level)}</td>
                                        <td><span className="date-text">{formatDate(elderly.created_at)}</span></td>
                                        <td>
                                            <div className="act-row">
                                                <Link href={`/home/list/${elderly.id}`} className="btn-view">
                                                    ดูข้อมูล →
                                                </Link>
                                                {role !== 'guardian' && (
                                                    <button className="btn-visit"
                                                        onClick={() => router.push(`/home/visit/new?elderly_id=${elderly.id}`)}>
                                                        📝 บันทึกเยี่ยม
                                                    </button>
                                                )}
                                                {role === 'caregiver' && (
                                                    <button className="btn-edit-risk"
                                                        onClick={() => { setEditRiskTarget(elderly); setEditRiskLevel(elderly.risk_level || 'low'); setEditRiskNote(''); setEditRiskError('') }}>
                                                        🏷️ ความเสี่ยง
                                                    </button>
                                                )}
                                                {role !== 'guardian' && (
                                                    <button className="btn-delete"
                                                        onClick={() => setDeleteTarget(elderly)}>
                                                        🗑️ ลบ
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="count-bar">พบทั้งหมด {elderlyList.length} รายการ</div>
                    </>
                )}
            </div>

            {/* CREATE MODAL */}
            {showModal && (
                <div className="overlay">
                    <div className="modal">
                        <div className="modal-head">
                            <div>
                                <div className="modal-title">เพิ่มผู้รับการดูแลใหม่</div>
                                <div className="modal-sub">กรอกข้อมูลเบื้องต้นและประเมินความเสี่ยง</div>
                            </div>
                            <button className="modal-close" onClick={() => { setShowModal(false); setNewName(''); setRiskLevel('low'); setSymptoms(''); setCreateError(''); setSelectedGuardian('') }}>
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {createError && <div className="form-error">{createError}</div>}

                        <form onSubmit={handleCreate}>
                            <div className="form-group">
                                <label className="form-label">ชื่อ-นามสกุล *</label>
                                <input className="form-input" type="text" placeholder="เช่น นายสมชาย ใจดี"
                                    value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">ผู้ดูแลรับผิดชอบ</label>
                                <select className="form-select" value={selectedGuardian} onChange={(e) => setSelectedGuardian(e.target.value)}>
                                    <option value="">-- เลือกผู้ดูแล --</option>
                                    {guardians.map(u => <option key={u.id} value={u.id}>{u.email}{u.role === 'admin' ? ' (Admin)' : ''}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">ระดับความเสี่ยง *</label>
                                <select className="form-select" value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)}>
                                    <option value="low">🟢 เสี่ยงต่ำ</option>
                                    <option value="medium">🟡 เสี่ยงปานกลาง</option>
                                    <option value="high">🟠 เสี่ยงสูง</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">อาการเบื้องต้น / หมายเหตุ</label>
                                <textarea className="form-textarea" placeholder="เช่น ความดันสูง, เดินลำบาก..."
                                    value={symptoms} onChange={(e) => setSymptoms(e.target.value)} rows={3} />
                            </div>
                            <div className="btn-row">
                                <button type="button" className="btn-cancel"
                                    onClick={() => { setShowModal(false); setNewName(''); setRiskLevel('low'); setSymptoms(''); setCreateError(''); setSelectedGuardian('') }}>
                                    ยกเลิก
                                </button>
                                <button type="submit" className="btn-submit" disabled={creating}>
                                    {creating ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT RISK LEVEL MODAL — Caregiver only */}
            {editRiskTarget && (
                <div className="overlay">
                    <div className="modal">
                        <div className="modal-head">
                            <div>
                                <div className="modal-title">🏷️ แก้ไขระดับความเสี่ยง</div>
                                <div className="modal-sub">{editRiskTarget.full_name}</div>
                            </div>
                            <button className="modal-close" onClick={() => setEditRiskTarget(null)}>
                                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {editRiskError && <div className="form-error">{editRiskError}</div>}

                        <form onSubmit={handleEditRisk}>
                            <div className="form-group">
                                <label className="form-label">ระดับความเสี่ยงใหม่ *</label>
                                <select className="form-select" value={editRiskLevel} onChange={(e) => setEditRiskLevel(e.target.value)}>
                                    <option value="low">🟢 เสี่ยงต่ำ</option>
                                    <option value="medium">🟡 เสี่ยงปานกลาง</option>
                                    <option value="high">🟠 เสี่ยงสูง</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">หมายเหตุ / อาการ</label>
                                <textarea className="form-textarea" placeholder="เช่น ความดันสูงขึ้น, เดินลำบาก..."
                                    value={editRiskNote} onChange={(e) => setEditRiskNote(e.target.value)} rows={3} />
                            </div>
                            <div className="btn-row">
                                <button type="button" className="btn-cancel" onClick={() => setEditRiskTarget(null)}>ยกเลิก</button>
                                <button type="submit" className="btn-submit" disabled={editingRisk}>
                                    {editingRisk ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {deleteTarget && (
                <div className="overlay">
                    <div className="del-modal">
                        <div className="del-icon">⚠️</div>
                        <div className="del-title">ยืนยันการลบ</div>
                        <div className="del-sub">
                            คุณต้องการลบ <span className="del-name">{deleteTarget.full_name}</span> ออกจากระบบหรือไม่?<br/>
                            ข้อมูลทั้งหมดที่เกี่ยวข้องจะถูกลบถาวร
                        </div>
                        <div className="del-btns">
                            <button className="btn-del-cancel" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                                ยกเลิก
                            </button>
                            <button className="btn-del-confirm" onClick={handleDelete} disabled={deleting}>
                                {deleting ? 'กำลังลบ...' : 'ยืนยันลบ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function ElderlyListPage() {
    return (
        <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', animation: 'spin 0.75s linear infinite' }} /></div>}>
            <ElderlyListPageInner />
        </Suspense>
    )
}