'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE

interface Disease {
    id: number
    name: string
    note: string | null
}

interface Elderly {
    id: number
    full_name: string
    created_at: string
    photo?: string | null
    age?: number | null
    national_id?: string | null
    diseases?: Disease[]
}

function ElderlyListPageInner() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [elderlyList, setElderlyList] = useState<Elderly[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [role, setRole] = useState<string>('')
    const [diseaseFilter, setDiseaseFilter] = useState<string>('')
    const [categories, setCategories] = useState<string[]>([])

    useEffect(() => {
        const storedRole = localStorage.getItem('role')
        if (storedRole) setRole(storedRole)
    }, [])

    const [showModal, setShowModal] = useState(false)
    const [newFirstName, setNewFirstName] = useState('')
    const [newLastName, setNewLastName] = useState('')
    const [newDob, setNewDob] = useState('')
    const [newNationalId, setNewNationalId] = useState('')
    const [photo, setPhoto] = useState('')           // base64 data URI
    const [diseases, setDiseases] = useState<string[]>([])
    const [diseaseInput, setDiseaseInput] = useState('')
    const [creating, setCreating] = useState(false)
    const [createError, setCreateError] = useState('')

    // Delete state
    const [deleteTarget, setDeleteTarget] = useState<Elderly | null>(null)
    const [deleting, setDeleting] = useState(false)

    interface User { id: number; email: string; role: string }
    const [guardians, setGuardians] = useState<User[]>([])
    const [selectedGuardian, setSelectedGuardian] = useState<string>('')

    const resetCreateForm = () => {
        setNewFirstName(''); setNewLastName(''); setNewDob(''); setNewNationalId('')
        setPhoto(''); setDiseases([]); setDiseaseInput('')
        setSelectedGuardian(''); setCreateError('')
    }

    // ต้องกรอก ชื่อ + นามสกุล + วันเกิด + เลขบัตร (13 หลัก) ถึงจะบันทึกได้
    const canCreate = !!newFirstName.trim() && !!newLastName.trim() && !!newDob.trim() && newNationalId.length === 13

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) { setCreateError('กรุณาเลือกไฟล์รูปภาพ'); return }
        if (file.size > 1.5 * 1024 * 1024) { setCreateError('รูปภาพต้องมีขนาดไม่เกิน 1.5MB'); return }
        const reader = new FileReader()
        reader.onload = () => { setPhoto(reader.result as string); setCreateError('') }
        reader.readAsDataURL(file)
    }

    const addDisease = () => {
        const v = diseaseInput.trim()
        if (v && !diseases.includes(v)) setDiseases([...diseases, v])
        setDiseaseInput('')
    }
    const removeDisease = (idx: number) => setDiseases(diseases.filter((_, i) => i !== idx))

    const fetchElderly = async (searchQuery = '', disease = '') => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (searchQuery) params.set('search', searchQuery)
            if (disease) params.set('disease', disease)
            const queryString = params.toString()
            const url = queryString ? `${API_BASE}/elderly?${queryString}` : `${API_BASE}/elderly`
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            const data = await res.json()
            if (data.success) setElderlyList(data.data)
            else setError(data.message || 'Unable to load data')
        } catch {
            setError('Unable to connect to the server')
        } finally {
            setLoading(false)
        }
    }

    const fetchCategories = async () => {
        try {
            const res = await fetch(`${API_BASE}/elderly/categories`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            const data = await res.json()
            if (data.success) setCategories(data.data)
        } catch (error) {
            console.error('Failed to fetch categories', error)
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
        const diseaseParam = searchParams.get('disease') || ''
        if (diseaseParam) {
            setDiseaseFilter(diseaseParam)
            fetchElderly('', diseaseParam)
        } else {
            fetchElderly()
        }
        fetchCategories()
        fetchGuardians()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        fetchElderly(search, diseaseFilter)
    }

    // Live search: ค้นเองอัตโนมัติเมื่อพิมพ์/ลบตัวอักษร (debounce) — ลบจนว่างก็รีเซ็ตกลับมาทั้งหมด
    const didMount = useRef(false)
    useEffect(() => {
        if (!didMount.current) { didMount.current = true; return }
        const t = setTimeout(() => { fetchElderly(search, diseaseFilter) }, 350)
        return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search])

    const handleDiseaseFilter = (name: string) => {
        setDiseaseFilter(name)
        fetchElderly(search, name)
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreateError('')
        if (!newFirstName.trim()) { setCreateError('Please enter the first name'); return }
        if (!newLastName.trim()) { setCreateError('Please enter the last name'); return }
        if (!newDob.trim()) { setCreateError('Please enter the date of birth'); return }
        const dobDate = new Date(newDob)
        if (Number.isNaN(dobDate.getTime()) || dobDate > new Date()) { setCreateError('Invalid date of birth'); return }
        if (!newNationalId.trim()) { setCreateError('Please enter the national ID'); return }
        if (newNationalId.length !== 13) { setCreateError('National ID must be exactly 13 digits'); return }
        setCreating(true)
        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${API_BASE}/elderly`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    full_name: `${newFirstName.trim()} ${newLastName.trim()}`,
                    date_of_birth: newDob,
                    national_id: newNationalId,
                    guardian_id: selectedGuardian ? parseInt(selectedGuardian) : null,
                    photo: photo || null,
                    diseases,
                }),
            })
            const data = await res.json()
            if (data.success) {
                setShowModal(false); resetCreateForm()
                fetchElderly(search, diseaseFilter); fetchCategories()
            } else { setCreateError(data.message || 'Unable to add recipient') }
        } catch { setCreateError('Unable to connect to the server') }
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
                fetchElderly(search, diseaseFilter); fetchCategories()
            } else {
                alert(data.message || 'Unable to delete recipient')
            }
        } catch {
            alert('Unable to connect to the server')
        } finally {
            setDeleting(false)
        }
    }

    const toUTC = (d: string) => d.endsWith('Z') || d.includes('+') ? d : d + 'Z'
    const formatDate = (dateString: string) =>
        new Date(toUTC(dateString)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

    const css = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .page-wrap { font-family: 'Inter', sans-serif; }

        .toolbar {
            background: #ffffff;
            border: 1px solid #e5e7eb; border-radius: 8px;
            padding: 20px 24px; margin-bottom: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .toolbar-top { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
        .page-title { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 24px; color: #000000; letter-spacing: -0.01em; }
        .page-sub   { font-size: 13px; color: #6b7280; margin-top: 3px; }

        .btn-add {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 10px 20px; border-radius: 12px; border: none; cursor: pointer;
            background: #16a34a; color: white;
            font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600;
            box-shadow: 0 4px 14px rgba(22,163,74,0.35); transition: all 0.18s;
        }
        .btn-add:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(22,163,74,0.45); }

        .search-row { display: flex; gap: 10px; margin-bottom: 12px; }
        .search-box { flex: 1; position: relative; }
        .search-box input {
            width: 100%; padding: 10px 14px;
            border: 1.5px solid #e2e8f0; border-radius: 12px;
            font-family: 'Inter', sans-serif; font-size: 14px; color: #000000;
            background: #f8fafc; outline: none; transition: all 0.15s;
        }
        .search-box input:focus { border-color: #16a34a; background: white; box-shadow: 0 0 0 3px rgba(22,163,74,0.1); }
        .btn-search {
            padding: 10px 20px; border-radius: 12px; border: 1.5px solid #e2e8f0;
            background: white; font-family: 'Inter', sans-serif; font-size: 14px;
            font-weight: 600; color: #475569; cursor: pointer; transition: all 0.15s;
        }
        .btn-search:hover { background: #f1f5f9; border-color: #cbd5e1; }

        .filter-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .filter-label { font-size: 12px; color: #6b7280; font-weight: 600; }
        .fpill {
            padding: 5px 14px; border-radius: 20px; border: 1.5px solid transparent;
            font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600;
            cursor: pointer; transition: all 0.15s; background: #f1f5f9; color: #64748b;
        }
        .fpill:hover { background: #e2e8f0; }
        .fpill.active { background: #f0fdf4; color: #16a34a; border-color: #bbf7d0; }

        .table-wrap {
            background: #ffffff;
            border: 1px solid #e5e7eb; border-radius: 8px;
            overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        table { width: 100%; border-collapse: collapse; }
        thead tr { background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; }
        th { padding: 12px 20px; text-align: left; font-size: 11px; font-weight: 700; color: #6b7280; letter-spacing: 0.07em; text-transform: uppercase; white-space: nowrap; }
        th:last-child { text-align: right; }
        tbody tr { border-bottom: 1px solid #f1f5f9; transition: background 0.12s; }
        tbody tr:last-child { border-bottom: none; }
        tbody tr:hover { background: rgba(22,163,74,0.03); }
        td { padding: 14px 20px; vertical-align: middle; }
        td:last-child { text-align: right; }

        .td-name { display: flex; align-items: center; gap: 12px; }
        .avatar {
            width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0; overflow: hidden;
            background: #16a34a;
            display: flex; align-items: center; justify-content: center;
            font-size: 15px; font-weight: 700; color: white;
        }
        .name-text { font-size: 14px; font-weight: 600; color: #000000; }
        .name-id   { font-size: 11px; color: #6b7280; margin-top: 1px; }
        .date-text { font-size: 13px; color: #64748b; }

        .disease-cell { display: flex; flex-wrap: wrap; gap: 5px; max-width: 320px; }
        .d-chip {
            display: inline-block; padding: 3px 10px; border-radius: 20px;
            background: #f0fdf4; border: 1px solid #bbf7d0;
            font-size: 12px; font-weight: 600; color: #15803d;
        }
        .d-none { font-size: 13px; color: #cbd5e1; font-style: italic; }

        .act-row { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
        .btn-view {
            padding: 6px 14px; border-radius: 8px; border: 1.5px solid #e2e8f0;
            background: white; font-family: 'Inter', sans-serif;
            font-size: 13px; font-weight: 600; color: #475569;
            cursor: pointer; text-decoration: none; transition: all 0.15s;
            display: inline-flex; align-items: center; gap: 5px;
        }
        .btn-view:hover { background: #f8fafc; border-color: #cbd5e1; color: #000000; }
        .btn-visit {
            padding: 6px 14px; border-radius: 8px; border: none;
            background: #f0fdf4; font-family: 'Inter', sans-serif;
            font-size: 13px; font-weight: 600; color: #16a34a;
            cursor: pointer; transition: all 0.15s;
            display: inline-flex; align-items: center; gap: 5px;
        }
        .btn-visit:hover { background: #dcfce7; }
        .btn-delete {
            padding: 6px 14px; border-radius: 8px; border: none;
            background: #fef2f2; font-family: 'Inter', sans-serif;
            font-size: 13px; font-weight: 600; color: #dc2626;
            cursor: pointer; transition: all 0.15s;
            display: inline-flex; align-items: center; gap: 5px;
        }
        .btn-delete:hover { background: #fee2e2; }

        .del-modal { background: white; border-radius: 8px; box-shadow: 0 24px 60px rgba(0,0,0,0.18); padding: 28px; width: 100%; max-width: 400px; text-align: center; }
        .del-title { font-size: 17px; font-weight: 700; color: #000000; margin-bottom: 6px; }
        .del-sub { font-size: 13px; color: #64748b; margin-bottom: 20px; line-height: 1.5; }
        .del-name { font-weight: 700; color: #dc2626; }
        .del-btns { display: flex; gap: 10px; }
        .btn-del-cancel { flex: 1; padding: 11px; border-radius: 11px; border: 1.5px solid #e2e8f0; background: white; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.15s; }
        .btn-del-cancel:hover { background: #f1f5f9; }
        .btn-del-confirm { flex: 1; padding: 11px; border-radius: 11px; border: none; background: #ef4444; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700; color: white; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px rgba(239,68,68,0.3); }
        .btn-del-confirm:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(239,68,68,0.4); }
        .btn-del-confirm:disabled { opacity: 0.55; cursor: not-allowed; }

        .count-bar { padding: 12px 24px; border-top: 1px solid #f1f5f9; font-size: 13px; color: #6b7280; background: #fafbfc; }

        .empty-box { padding: 64px 24px; text-align: center; }
        .empty-title { font-size: 16px; font-weight: 700; color: #000000; margin-bottom: 6px; }
        .empty-sub   { font-size: 13px; color: #6b7280; }

        .ebox { background: #fef2f2; border: 1px solid #fecaca; border-radius: 14px; padding: 12px 18px; margin-bottom: 14px; font-size: 13px; color: #dc2626; }

        .loading-wrap { display: flex; justify-content: center; padding: 64px 0; }
        .spinner { width: 40px; height: 40px; border-radius: 50%; border: 3px solid #e2e8f0; border-top-color: #16a34a; animation: spin 0.75s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .overlay { position: fixed; inset: 0; z-index: 50; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; padding: 20px; }
        .modal { background: white; border-radius: 8px; box-shadow: 0 24px 60px rgba(0,0,0,0.18); padding: 28px 28px 24px; width: 100%; max-width: 440px; max-height: calc(100vh - 40px); overflow-y: auto; }
        .modal-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 22px; }
        .modal-title { font-size: 18px; font-weight: 700; color: #000000; }
        .modal-sub   { font-size: 12px; color: #6b7280; margin-top: 3px; }
        .modal-close { width: 30px; height: 30px; border-radius: 8px; border: none; background: #f1f5f9; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 18px; line-height: 1; transition: background 0.15s; }
        .modal-close:hover { background: #e2e8f0; }
        .form-group { margin-bottom: 16px; }
        .name-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .name-row .form-group { margin-bottom: 16px; }
        .form-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
        .form-input, .form-select, .form-textarea {
            width: 100%; padding: 10px 14px; box-sizing: border-box;
            border: 1.5px solid #e2e8f0; border-radius: 11px;
            font-family: 'Inter', sans-serif; font-size: 14px; color: #000000;
            background: #f8fafc; outline: none; transition: all 0.15s;
        }
        .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: #16a34a; background: white; box-shadow: 0 0 0 3px rgba(22,163,74,0.1); }
        .form-error { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 10px 14px; font-size: 13px; color: #dc2626; margin-bottom: 14px; }
        .btn-row { display: flex; gap: 10px; margin-top: 20px; }
        .btn-cancel { flex: 1; padding: 11px; border-radius: 11px; border: 1.5px solid #e2e8f0; background: white; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.15s; }
        .btn-cancel:hover { background: #f1f5f9; }
        .btn-submit { flex: 1; padding: 11px; border-radius: 11px; border: none; background: #16a34a; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700; color: white; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px rgba(22,163,74,0.3); }
        .btn-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(22,163,74,0.4); }
        .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        /* photo uploader */
        .photo-row { display: flex; align-items: center; gap: 14px; }
        .photo-preview {
            width: 72px; height: 72px; border-radius: 14px; flex-shrink: 0; overflow: hidden;
            background: #16a34a; display: flex; align-items: center; justify-content: center;
            border: 1.5px solid #e2e8f0;
        }
        .photo-preview img { width: 100%; height: 100%; object-fit: cover; }
        .photo-placeholder { font-size: 28px; font-weight: 700; color: white; }
        .photo-actions { display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
        .photo-btn {
            display: inline-block; padding: 8px 16px; border-radius: 10px; cursor: pointer;
            background: #f0fdf4; color: #16a34a; font-size: 13px; font-weight: 600;
            border: 1.5px solid #bbf7d0; transition: background 0.15s;
        }
        .photo-btn:hover { background: #dcfce7; }
        .photo-remove {
            background: none; border: none; cursor: pointer; padding: 0;
            font-size: 12px; font-weight: 600; color: #dc2626; font-family: 'Inter', sans-serif;
        }
        .photo-hint { font-size: 11px; color: #6b7280; }

        /* disease chips input */
        .disease-add-row { display: flex; gap: 8px; }
        .disease-add-row .form-input { flex: 1; }
        .chip-row { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }
        .chip {
            display: inline-flex; align-items: center; gap: 6px;
            background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 20px;
            padding: 4px 6px 4px 12px; font-size: 13px; font-weight: 600; color: #475569;
        }
        .chip-x {
            width: 18px; height: 18px; border-radius: 50%; border: none; cursor: pointer;
            background: #e2e8f0; color: #64748b; font-size: 13px; line-height: 1;
            display: flex; align-items: center; justify-content: center; transition: background 0.15s;
        }
        .chip-x:hover { background: #fecaca; color: #dc2626; }
    `

    return (
        <div className="page-wrap">
            <style>{css}</style>

            <div className="toolbar">
                <div className="toolbar-top">
                    <div>
                        <div className="page-title">Care Recipients</div>
                        <div className="page-sub">Manage elderly recipients under your care</div>
                    </div>
                    {role !== 'guardian' && (
                        <button className="btn-add" onClick={() => setShowModal(true)}>
                            Add Recipient
                        </button>
                    )}
                </div>

                <form className="search-row" onSubmit={handleSearch}>
                    <div className="search-box">
                        <input type="text" placeholder="Search by name or disease..."
                            value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <button type="submit" className="btn-search">Search</button>
                </form>

                <div className="filter-row">
                    <span className="filter-label">Disease:</span>
                    <button className={`fpill${diseaseFilter === '' ? ' active' : ''}`}
                        onClick={() => handleDiseaseFilter('')}>All</button>
                    {categories.map(name => (
                        <button key={name} className={`fpill${diseaseFilter === name ? ' active' : ''}`}
                            onClick={() => handleDiseaseFilter(name)}>
                            {name}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="ebox">
                    {error}
                </div>
            )}

            <div className="table-wrap">
                {loading ? (
                    <div className="loading-wrap"><div className="spinner" /></div>
                ) : elderlyList.length === 0 ? (
                    <div className="empty-box">
                        <div className="empty-title">No recipients yet</div>
                        <div className="empty-sub">Click &quot;Add Recipient&quot; to get started</div>
                    </div>
                ) : (
                    <>
                        <table>
                            <thead>
                                <tr>
                                    <th>Full Name</th>
                                    <th>Diseases</th>
                                    <th>Date Added</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {elderlyList.map((elderly) => (
                                    <tr key={elderly.id}>
                                        <td>
                                            <div className="td-name">
                                                <div className="avatar">
                                                    {elderly.photo
                                                        ? <img src={elderly.photo} alt={elderly.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        : elderly.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="name-text">{elderly.full_name}</div>
                                                    <div className="name-id">
                                                        {elderly.age != null ? `Age ${elderly.age}` : `ID #${elderly.id}`}
                                                        {elderly.national_id ? ` · ${elderly.national_id}` : ''}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            {elderly.diseases && elderly.diseases.length > 0 ? (
                                                <div className="disease-cell">
                                                    {elderly.diseases.map(d => (
                                                        <span key={d.id} className="d-chip" title={d.note || undefined}>{d.name}</span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="d-none">—</span>
                                            )}
                                        </td>
                                        <td><span className="date-text">{formatDate(elderly.created_at)}</span></td>
                                        <td>
                                            <div className="act-row">
                                                <Link href={`/home/list/${elderly.id}`} className="btn-view">
                                                    View →
                                                </Link>
                                                {role !== 'guardian' && (
                                                    <button className="btn-visit"
                                                        onClick={() => router.push(`/home/visit/new?elderly_id=${elderly.id}`)}>
                                                        New Health Check
                                                    </button>
                                                )}
                                                {role !== 'guardian' && (
                                                    <button className="btn-delete"
                                                        onClick={() => setDeleteTarget(elderly)}>
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="count-bar">{elderlyList.length} recipients found</div>
                    </>
                )}
            </div>

            {/* CREATE MODAL */}
            {showModal && (
                <div className="overlay">
                    <div className="modal">
                        <div className="modal-head">
                            <div>
                                <div className="modal-title">Add New Recipient</div>
                                <div className="modal-sub">Enter basic details, photo and diseases</div>
                            </div>
                            <button className="modal-close" onClick={() => { setShowModal(false); resetCreateForm() }}>
                                ×
                            </button>
                        </div>

                        {createError && <div className="form-error">{createError}</div>}

                        <form onSubmit={handleCreate}>
                            {/* PHOTO */}
                            <div className="form-group">
                                <label className="form-label">Photo</label>
                                <div className="photo-row">
                                    <div className="photo-preview">
                                        {photo
                                            ? <img src={photo} alt="preview" />
                                            : <span className="photo-placeholder">{newFirstName ? newFirstName.charAt(0) : '?'}</span>}
                                    </div>
                                    <div className="photo-actions">
                                        <label className="photo-btn">
                                            {photo ? 'Change Photo' : 'Upload Photo'}
                                            <input type="file" accept="image/*" onChange={handlePhotoChange} hidden />
                                        </label>
                                        {photo && (
                                            <button type="button" className="photo-remove" onClick={() => setPhoto('')}>Remove</button>
                                        )}
                                        <div className="photo-hint">JPG / PNG, up to 1.5MB</div>
                                    </div>
                                </div>
                            </div>

                            <div className="name-row">
                                <div className="form-group">
                                    <label className="form-label">First Name *</label>
                                    <input className="form-input" type="text" placeholder="e.g. John"
                                        value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} autoFocus required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Last Name *</label>
                                    <input className="form-input" type="text" placeholder="e.g. Smith"
                                        value={newLastName} onChange={(e) => setNewLastName(e.target.value)} required />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Date of Birth *</label>
                                <input className="form-input" type="date"
                                    max={new Date().toISOString().slice(0, 10)}
                                    value={newDob}
                                    onChange={(e) => setNewDob(e.target.value)}
                                    required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">National ID * <span style={{ fontWeight: 500, color: '#6b7280' }}>({newNationalId.length}/13)</span></label>
                                <input className="form-input" type="text" inputMode="numeric" placeholder="13 digits"
                                    value={newNationalId}
                                    onChange={(e) => setNewNationalId(e.target.value.replace(/\D/g, '').slice(0, 13))}
                                    required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Guardian</label>
                                <select className="form-select" value={selectedGuardian} onChange={(e) => setSelectedGuardian(e.target.value)}>
                                    <option value="">-- Select guardian --</option>
                                    {guardians.map(u => <option key={u.id} value={u.id}>{u.email}{u.role === 'admin' ? ' (Admin)' : ''}</option>)}
                                </select>
                            </div>

                            {/* DISEASES */}
                            <div className="form-group">
                                <label className="form-label">Diseases / Conditions</label>
                                <div className="disease-add-row">
                                    <input className="form-input" type="text" placeholder="e.g. Obesity"
                                        value={diseaseInput}
                                        onChange={(e) => setDiseaseInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDisease() } }} />
                                    <button type="button" className="btn-search" onClick={addDisease}>Add</button>
                                </div>
                                {diseases.length > 0 && (
                                    <div className="chip-row">
                                        {diseases.map((d, i) => (
                                            <span key={i} className="chip">
                                                {d}
                                                <button type="button" className="chip-x" onClick={() => removeDisease(i)}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="btn-row">
                                <button type="button" className="btn-cancel"
                                    onClick={() => { setShowModal(false); resetCreateForm() }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit" disabled={creating || !canCreate}>
                                    {creating ? 'Saving...' : 'Save'}
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
                        <div className="del-title">Confirm Deletion</div>
                        <div className="del-sub">
                            Do you want to remove <span className="del-name">{deleteTarget.full_name}</span> from the system?<br/>
                            All related data will be permanently deleted.
                        </div>
                        <div className="del-btns">
                            <button className="btn-del-cancel" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                                Cancel
                            </button>
                            <button className="btn-del-confirm" onClick={handleDelete} disabled={deleting}>
                                {deleting ? 'Deleting...' : 'Confirm Delete'}
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
        <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#16a34a', animation: 'spin 0.75s linear infinite' }} /></div>}>
            <ElderlyListPageInner />
        </Suspense>
    )
}
