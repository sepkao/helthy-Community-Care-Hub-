'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface ItemMenuListProps {
    /** รายชื่อข้อความที่จะแสดงเป็นแต่ละแถว เช่น ชื่อโรค หรือชื่อเมนู */
    items: string[]
    /** ข้อความที่ตรงกับแถวที่กำลังถูกเลือกอยู่ */
    activeItem: string
    /** เรียกเมื่อผู้ใช้กดแถวใดแถวหนึ่ง */
    onSelect?: (item: string) => void
    /** ไอคอนต่อรายการ (ไม่บังคับ) — key คือข้อความใน items, value คือ lucide icon component */
    icons?: Partial<Record<string, LucideIcon>>
    /** ความสูงสูงสุดของรายการก่อนจะเริ่มมี scrollbar (px หรือ css unit ใดๆ) */
    maxHeight?: number | string
    /**
     * 'list'     — กล่องรายการแสดงอยู่กับที่ (ใช้ collapsible ควบคุมพับ/กางได้)
     * 'dropdown' — ตัวเล็กกะทัดรัด กดแล้วค่อยกางเป็น panel ลอยด้านล่าง (เหมือน select)
     */
    mode?: 'list' | 'dropdown'
    /** พับเก็บได้ (เฉพาะ mode="list") — แสดงลูกศรมุมขวาบน กดแล้วซ่อน/แสดงแถวที่เหลือ */
    collapsible?: boolean
    /** สถานะเริ่มต้นตอนเปิดหน้า (เฉพาะตอน collapsible เป็น true) */
    defaultOpen?: boolean
    /** ให้ trigger ยืดเต็มความกว้าง (เฉพาะ mode="dropdown") — เอาไว้ใช้แทน <select> ในฟอร์ม */
    fullWidth?: boolean
    /** ข้อความที่แสดงตอนยังไม่มี activeItem ที่ตรงกับ items (เฉพาะ mode="dropdown") */
    placeholder?: string
    className?: string
    style?: React.CSSProperties
}

const css = `
    .iml-box {
        position: relative;
        background: #ffffff;
        border: none;
        border-radius: 20px;
        padding: 8px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 3px;
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 transparent;
    }
    .iml-box::-webkit-scrollbar { width: 5px; }
    .iml-box::-webkit-scrollbar-track { background: transparent; }
    .iml-box::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
    .iml-box::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

    .iml-row {
        display: flex; align-items: center;
        border-radius: 14px; color: #0f172a;
        transition: background 0.15s, color 0.15s;
    }
    .iml-row:hover { background: #f8fafc; }
    .iml-row.active { background: #d1fae5; color: #047857; }

    .iml-row-btn {
        flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px;
        border: none; background: transparent; cursor: pointer; text-align: left;
        padding: 10px 14px; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500;
        color: inherit;
    }
    .iml-row.active .iml-row-btn { font-weight: 700; }
    .iml-icon { flex-shrink: 0; opacity: 0.8; }
    .iml-row.active .iml-icon { opacity: 1; }

    .iml-toggle {
        position: absolute; top: 5px; right: 5px; z-index: 1;
        display: flex; align-items: center; justify-content: center;
        width: 12px; height: 12px; border-radius: 4px; border: none;
        background: transparent; cursor: pointer; color: #16a34a;
        transition: transform 0.2s ease, color 0.15s, background 0.15s;
    }
    .iml-toggle:hover { background: rgba(0,0,0,0.06); }
    .iml-toggle.closed { transform: rotate(-90deg); color: #9ca3af; }

    /* ── DROPDOWN MODE — เล็กกะทัดรัด, กางเป็น panel ลอย ── */
    .iml-dd { position: relative; display: inline-block; }
    .iml-dd.full { display: block; width: 100%; }
    .iml-dd-trigger {
        display: flex; align-items: center; gap: 6px;
        background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;
        padding: 5px 10px; cursor: pointer; outline: none;
        font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600; color: #15803d;
        transition: background 0.15s;
    }
    .iml-dd-trigger.full {
        width: 100%; box-sizing: border-box; justify-content: space-between;
        background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 11px;
        padding: 10px 14px; font-size: 14px; font-weight: 500; color: #000000;
    }
    .iml-dd-trigger.full:hover { border-color: #bbf7d0; background: #f8fafc; }
    .iml-dd-trigger.full .iml-dd-label { flex: 1; text-align: left; }
    .iml-dd-trigger:hover { background: #dcfce7; }
    .iml-dd-chevron { flex-shrink: 0; transition: transform 0.2s ease; }
    .iml-dd-chevron.open { transform: rotate(180deg); }
    .iml-dd-panel {
        position: absolute; top: calc(100% + 6px); right: 0; z-index: 30;
        min-width: 190px;
        background: #ffffff; border-radius: 16px;
        box-shadow: 0 10px 28px rgba(0,0,0,0.14);
        padding: 6px; display: flex; flex-direction: column; gap: 2px;
        overflow-y: auto;
        scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent;
    }
    .iml-dd-panel::-webkit-scrollbar { width: 5px; }
    .iml-dd-panel::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
    .iml-dd.full .iml-dd-panel { left: 0; right: 0; min-width: 0; }
    .dd-item {
        display: flex; align-items: center; gap: 8px; width: 100%;
        border: none; background: transparent; cursor: pointer; text-align: left;
        padding: 8px 12px; border-radius: 12px;
        font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 500; color: #0f172a;
    }
    .dd-item:hover { background: #f8fafc; }
    .dd-item.active { background: #d1fae5; color: #047857; font-weight: 700; }
`

/**
 * รายการเมนู/รายชื่อ พร้อม active state สีเขียวมิ้นต์ ไม่มีขอบ
 * รับ items (string[]) + activeItem (string) — ไอคอนใส่เพิ่มได้ต่อรายการผ่าน props.icons
 * mode="list" (ค่าเริ่มต้น): กล่องอยู่กับที่ ตั้ง collapsible ให้พับเก็บได้ผ่านลูกศรมุมขวาบน
 * mode="dropdown": ตัวเล็ก กดแล้วกางเป็น panel ลอย เหมือน <select> — เหมาะกับวางในหัวการ์ด
 */
export default function ItemMenuList({
    items, activeItem, onSelect, icons, maxHeight = 220,
    mode = 'list', collapsible = false, defaultOpen = mode !== 'dropdown',
    fullWidth = false, placeholder, className, style,
}: ItemMenuListProps) {
    const [open, setOpen] = useState(defaultOpen)
    const ddRef = useRef<HTMLDivElement>(null)
    const panelRef = useRef<HTMLDivElement>(null)

    // ปิด dropdown เมื่อคลิกข้างนอก
    useEffect(() => {
        if (mode !== 'dropdown' || !open) return
        const handleClick = (e: MouseEvent) => {
            if (ddRef.current && !ddRef.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [mode, open])

    // เลื่อนไปที่รายการ active ให้เห็นทันทีตอนเปิด (สำคัญมากถ้ารายการยาว เช่น เวลา 60 นาที)
    useEffect(() => {
        if (mode !== 'dropdown' || !open || !panelRef.current) return
        panelRef.current.querySelector('.dd-item.active')?.scrollIntoView({ block: 'center' })
    }, [mode, open])

    if (mode === 'dropdown') {
        const ActiveIcon = icons?.[activeItem]
        const hasActive = items.includes(activeItem)
        return (
            <>
                <style>{css}</style>
                <div ref={ddRef} className={`iml-dd${fullWidth ? ' full' : ''}${className ? ' ' + className : ''}`} style={style}>
                    <button
                        type="button"
                        className={`iml-dd-trigger${fullWidth ? ' full' : ''}`}
                        onClick={() => setOpen(o => !o)}
                    >
                        {ActiveIcon && <ActiveIcon size={13} strokeWidth={2.2} />}
                        <span className={fullWidth ? 'iml-dd-label' : undefined}>
                            {hasActive ? activeItem : (placeholder ?? activeItem)}
                        </span>
                        <ChevronDown size={12} strokeWidth={2.5} className={`iml-dd-chevron${open ? ' open' : ''}`} />
                    </button>
                    {open && (
                        <div ref={panelRef} className="iml-dd-panel" style={{ maxHeight }}>
                            {items.map(item => {
                                const isActive = item === activeItem
                                const Icon = icons?.[item]
                                return (
                                    <button
                                        key={item}
                                        type="button"
                                        className={`dd-item${isActive ? ' active' : ''}`}
                                        onClick={() => { onSelect?.(item); setOpen(false) }}
                                    >
                                        {Icon && <Icon size={15} strokeWidth={2} className="iml-icon" />}
                                        <span>{item}</span>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </>
        )
    }

    const visibleItems = collapsible && !open ? items.slice(0, 1) : items

    return (
        <>
            <style>{css}</style>
            <div
                className={`iml-box${className ? ' ' + className : ''}`}
                style={{ maxHeight: collapsible && !open ? 'none' : maxHeight, ...style }}
            >
                {collapsible && (
                    <button
                        type="button"
                        aria-label={open ? 'Collapse' : 'Expand'}
                        className={`iml-toggle${open ? '' : ' closed'}`}
                        onClick={() => setOpen(o => !o)}
                    >
                        <ChevronDown size={8} strokeWidth={2.5} />
                    </button>
                )}
                {visibleItems.map(item => {
                    const isActive = item === activeItem
                    const Icon = icons?.[item]
                    return (
                        <div key={item} className={`iml-row${isActive ? ' active' : ''}`}>
                            <button type="button" className="iml-row-btn" onClick={() => onSelect?.(item)}>
                                {Icon && <Icon size={16} strokeWidth={2} className="iml-icon" />}
                                <span>{item}</span>
                            </button>
                        </div>
                    )
                })}
            </div>
        </>
    )
}
