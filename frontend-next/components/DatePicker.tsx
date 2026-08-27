'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import ItemMenuList from './ItemMenuList'

export interface DatePickerProps {
    /** ค่าปัจจุบัน — รับได้ทั้ง Date หรือ "YYYY-MM-DD" ปล่อยว่างได้ถ้ายังไม่เลือก */
    value: string | Date | null
    /** เรียกกลับพร้อม Date object ทุกครั้งที่เลือกวันใหม่ */
    onChange: (date: Date) => void
    /** วันที่ล่าสุดที่เลือกได้ (ค่าเริ่มต้น = วันนี้) — กันเลือกวันในอนาคต เหมาะกับวันเกิด */
    maxDate?: Date
    /** ข้อความตอนยังไม่มีค่า */
    placeholder?: string
    /** ให้ trigger ยืดเต็มความกว้าง (เอาไว้ใช้แทน <input> ในฟอร์ม) */
    fullWidth?: boolean
    className?: string
    style?: React.CSSProperties
}

const pad = (n: number) => String(n).padStart(2, '0')
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime()
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1)

function parseValue(input: string | Date | null | undefined): Date | null {
    if (!input) return null
    if (input instanceof Date) return startOfDay(input)
    const m = input.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    const d = new Date(input)
    return Number.isNaN(d.getTime()) ? null : startOfDay(d)
}

const fmtTrigger = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function buildMonthGrid(viewMonth: Date) {
    const year = viewMonth.getFullYear(), month = viewMonth.getMonth()
    const firstWeekday = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const cells: { date: Date; inMonth: boolean }[] = []
    for (let i = firstWeekday - 1; i >= 0; i--) {
        cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), inMonth: false })
    }
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ date: new Date(year, month, d), inMonth: true })
    }
    let next = 1
    while (cells.length % 7 !== 0) {
        cells.push({ date: new Date(year, month + 1, next++), inMonth: false })
    }
    return cells
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const css = `
    .dp { position: relative; display: inline-block; font-family: 'Inter', sans-serif; }
    .dp.full { display: block; width: 100%; }
    .dp-trigger {
        display: inline-flex; align-items: center; gap: 8px;
        background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 11px;
        padding: 10px 14px; cursor: pointer; outline: none;
        font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; color: #000000;
        transition: all 0.15s;
    }
    .dp-trigger.full { width: 100%; box-sizing: border-box; justify-content: flex-start; }
    .dp-trigger.placeholder { color: #94a3b8; }
    .dp-trigger:hover { border-color: #bbf7d0; }
    .dp-trigger.open { border-color: #16a34a; background: white; box-shadow: 0 0 0 3px rgba(22,163,74,0.1); }
    .dp-trigger svg { color: #16a34a; flex-shrink: 0; }

    .dp-panel {
        position: absolute; top: calc(100% + 8px); left: 0; z-index: 30;
        width: 280px; background: #ffffff; border-radius: 20px;
        box-shadow: 0 12px 32px rgba(0,0,0,0.14);
        padding: 16px;
    }

    .dp-head { display: flex; align-items: center; gap: 6px; margin-bottom: 12px; }
    .dp-head-dd { flex: 1; }
    .dp-head-dd .iml-dd.full { display: block; width: 100%; }
    .dp-head-dd .iml-dd-trigger.full {
        width: 100%; box-sizing: border-box; justify-content: space-between;
        background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 8px;
        padding: 6px 8px; font-size: 12px; font-weight: 600; color: #0f172a;
    }
    .dp-head-dd.month { flex: 1.4; }
    .dp-nav {
        width: 26px; height: 26px; border-radius: 50%; border: none; background: transparent;
        display: flex; align-items: center; justify-content: center; cursor: pointer; color: #475569;
        transition: background 0.15s; flex-shrink: 0;
    }
    .dp-nav:hover { background: #f1f5f9; }

    .dp-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 2px; }
    .dp-wd { text-align: center; font-size: 10px; font-weight: 700; color: #94a3b8; padding: 4px 0; }

    .dp-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
    .dp-cell {
        border: none; background: transparent; cursor: pointer;
        font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500; color: #0f172a;
        display: flex; align-items: center; justify-content: center;
        height: 34px; padding: 0;
    }
    .dp-cell.muted { color: #cbd5e1; }
    .dp-cell.disabled { color: #e2e8f0; cursor: not-allowed; }
    .dp-day-num { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .dp-cell.selected .dp-day-num { background: #000000; color: #ffffff; font-weight: 700; }
`

export default function DatePicker({ value, onChange, maxDate, placeholder = 'Select date', fullWidth = false, className, style }: DatePickerProps) {
    const max = maxDate ? startOfDay(maxDate) : startOfDay(new Date())
    const [open, setOpen] = useState(false)
    const [selected, setSelected] = useState<Date | null>(() => parseValue(value))
    const [viewMonth, setViewMonth] = useState(() => parseValue(value) || max)
    const rootRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const parsed = parseValue(value)
        setSelected(parsed)
        if (parsed) setViewMonth(parsed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [String(value)])

    useEffect(() => {
        if (!open) return
        const handleClick = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [open])

    const handleDayClick = (day: Date) => {
        if (day > max) return
        setSelected(day)
        onChange(day)
        setOpen(false)
    }

    const years = Array.from({ length: 121 }, (_, i) => String(max.getFullYear() - i))
    const setYear = (y: string) => setViewMonth(m => new Date(Number(y), m.getMonth(), 1))
    const setMonth = (name: string) => setViewMonth(m => new Date(m.getFullYear(), MONTH_NAMES.indexOf(name), 1))

    const cells = buildMonthGrid(viewMonth)

    return (
        <>
            <style>{css}</style>
            <div ref={rootRef} className={`dp${fullWidth ? ' full' : ''}${className ? ' ' + className : ''}`} style={style}>
                <button
                    type="button"
                    className={`dp-trigger${fullWidth ? ' full' : ''}${open ? ' open' : ''}${!selected ? ' placeholder' : ''}`}
                    onClick={() => setOpen(o => !o)}
                >
                    <Calendar size={15} strokeWidth={2} />
                    <span>{selected ? fmtTrigger(selected) : placeholder}</span>
                </button>

                {open && (
                    <div className="dp-panel">
                        <div className="dp-head">
                            <button type="button" className="dp-nav" onClick={() => setViewMonth(m => addMonths(m, -1))}>
                                <ChevronLeft size={15} />
                            </button>
                            <div className="dp-head-dd month">
                                <ItemMenuList mode="dropdown" fullWidth items={MONTH_NAMES} activeItem={MONTH_NAMES[viewMonth.getMonth()]} onSelect={setMonth} maxHeight={200} />
                            </div>
                            <div className="dp-head-dd">
                                <ItemMenuList mode="dropdown" fullWidth items={years} activeItem={String(viewMonth.getFullYear())} onSelect={setYear} maxHeight={200} />
                            </div>
                            <button type="button" className="dp-nav" onClick={() => setViewMonth(m => addMonths(m, 1))}>
                                <ChevronRight size={15} />
                            </button>
                        </div>

                        <div className="dp-weekdays">
                            {WEEKDAYS.map(w => <div key={w} className="dp-wd">{w}</div>)}
                        </div>

                        <div className="dp-grid">
                            {cells.map(({ date, inMonth }, i) => {
                                const disabled = date > max
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        className={[
                                            'dp-cell',
                                            selected && sameDay(date, selected) ? 'selected' : '',
                                            !inMonth ? 'muted' : '',
                                            disabled ? 'disabled' : '',
                                        ].filter(Boolean).join(' ')}
                                        onClick={() => handleDayClick(date)}
                                        disabled={disabled}
                                    >
                                        <span className="dp-day-num">{date.getDate()}</span>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
