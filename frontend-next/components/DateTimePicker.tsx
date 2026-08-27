'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import ItemMenuList from './ItemMenuList'

export interface DateTimePickerProps {
    /** ค่าปัจจุบัน — รับได้ทั้ง Date หรือ string แบบ datetime-local ("YYYY-MM-DDTHH:mm") */
    value: string | Date
    /** เรียกกลับพร้อม Date object ทุกครั้งที่เปลี่ยนวันหรือเวลา */
    onChange: (date: Date) => void
    /** ให้ trigger ยืดเต็มความกว้าง (เอาไว้ใช้แทน <input> ในฟอร์ม) */
    fullWidth?: boolean
    className?: string
    style?: React.CSSProperties
}

const pad = (n: number) => String(n).padStart(2, '0')
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1)

function parseValue(input: string | Date): Date {
    if (input instanceof Date) return input
    const m = input.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]))
    const d = new Date(input)
    return Number.isNaN(d.getTime()) ? new Date() : d
}

const fmtTrigger = (d: Date) =>
    `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
const fmtHeader = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

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
const HOURS_12 = Array.from({ length: 12 }, (_, i) => pad(i + 1))
const MINUTES_60 = Array.from({ length: 60 }, (_, i) => pad(i))

const css = `
    .dtp { position: relative; display: inline-block; font-family: 'Inter', sans-serif; }
    .dtp.full { display: block; width: 100%; }
    .dtp-trigger {
        display: inline-flex; align-items: center; gap: 8px;
        background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 11px;
        padding: 10px 14px; cursor: pointer; outline: none;
        font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; color: #000000;
        transition: all 0.15s;
    }
    .dtp-trigger.full { width: 100%; box-sizing: border-box; justify-content: flex-start; }
    .dtp-trigger:hover { border-color: #bbf7d0; }
    .dtp-trigger.open { border-color: #16a34a; background: white; box-shadow: 0 0 0 3px rgba(22,163,74,0.1); }
    .dtp-trigger svg { color: #16a34a; flex-shrink: 0; }

    .dtp-panel {
        position: absolute; top: calc(100% + 8px); left: 0; z-index: 30;
        width: 280px; background: #ffffff; border-radius: 20px;
        box-shadow: 0 12px 32px rgba(0,0,0,0.14);
        padding: 16px;
    }

    .dtp-time-row { display: flex; align-items: center; gap: 6px; margin-bottom: 14px; }
    .dtp-time-label { font-size: 12px; font-weight: 700; color: #6b7280; margin-right: 4px; }
    .dtp-time-colon { font-size: 13px; font-weight: 700; color: #94a3b8; }
    .dtp-time-dd .iml-dd-panel { min-width: 76px; right: auto; left: 0; }

    .dtp-cal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .dtp-cal-month { font-size: 13px; font-weight: 700; color: #0f172a; }
    .dtp-cal-nav {
        width: 26px; height: 26px; border-radius: 50%; border: none; background: transparent;
        display: flex; align-items: center; justify-content: center; cursor: pointer; color: #475569;
        transition: background 0.15s;
    }
    .dtp-cal-nav:hover { background: #f1f5f9; }

    .dtp-cal-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 2px; }
    .dtp-cal-wd { text-align: center; font-size: 10px; font-weight: 700; color: #94a3b8; padding: 4px 0; }

    .dtp-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
    .dtp-cal-cell {
        border: none; background: transparent; cursor: pointer;
        font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500; color: #0f172a;
        display: flex; align-items: center; justify-content: center;
        height: 34px; padding: 0;
    }
    .dtp-cal-cell.muted { color: #cbd5e1; }
    .dtp-day-num {
        width: 26px; height: 26px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
    }
    .dtp-cal-cell.selected .dtp-day-num { background: #000000; color: #ffffff; font-weight: 700; }
`

export default function DateTimePicker({ value, onChange, fullWidth = false, className, style }: DateTimePickerProps) {
    const [open, setOpen] = useState(false)
    const [selected, setSelected] = useState(() => parseValue(value))
    const [viewMonth, setViewMonth] = useState(() => addMonths(parseValue(value), 0))
    const rootRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        setSelected(parseValue(value))
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

    const commit = (next: Date) => {
        setSelected(next)
        onChange(next)
    }

    const handleDayClick = (day: Date) => {
        const next = new Date(day)
        next.setHours(selected.getHours(), selected.getMinutes(), 0, 0)
        commit(next)
    }

    // ── เวลาแบบ 12 ชม. (Hour / Minute / AM-PM) — คำนวณจาก selected แล้วแปลงกลับเป็น 24 ชม. ตอนบันทึก ──
    const hour24 = selected.getHours()
    const minute = selected.getMinutes()
    const ampm = hour24 >= 12 ? 'PM' : 'AM'
    const hour12 = pad(hour24 % 12 || 12)
    const minuteStr = pad(minute)

    const setHour12 = (h: string) => {
        let next24 = Number(h) % 12
        if (ampm === 'PM') next24 += 12
        const next = new Date(selected); next.setHours(next24, minute, 0, 0)
        commit(next)
    }
    const setMinute = (m: string) => {
        const next = new Date(selected); next.setHours(hour24, Number(m), 0, 0)
        commit(next)
    }
    const setAmPm = (v: string) => {
        let next24 = hour24 % 12
        if (v === 'PM') next24 += 12
        const next = new Date(selected); next.setHours(next24, minute, 0, 0)
        commit(next)
    }

    const cells = buildMonthGrid(viewMonth)

    return (
        <>
            <style>{css}</style>
            <div ref={rootRef} className={`dtp${fullWidth ? ' full' : ''}${className ? ' ' + className : ''}`} style={style}>
                <button
                    type="button"
                    className={`dtp-trigger${fullWidth ? ' full' : ''}${open ? ' open' : ''}`}
                    onClick={() => setOpen(o => !o)}
                >
                    <Calendar size={15} strokeWidth={2} />
                    <span>{fmtTrigger(selected)}</span>
                </button>

                {open && (
                    <div className="dtp-panel">
                        <div className="dtp-time-row">
                            <span className="dtp-time-label">Time</span>
                            <ItemMenuList
                                mode="dropdown" className="dtp-time-dd" maxHeight={160}
                                items={HOURS_12} activeItem={hour12} onSelect={setHour12}
                            />
                            <span className="dtp-time-colon">:</span>
                            <ItemMenuList
                                mode="dropdown" className="dtp-time-dd" maxHeight={160}
                                items={MINUTES_60} activeItem={minuteStr} onSelect={setMinute}
                            />
                            <ItemMenuList
                                mode="dropdown" className="dtp-time-dd"
                                items={['AM', 'PM']} activeItem={ampm} onSelect={setAmPm}
                            />
                        </div>

                        <div className="dtp-cal-head">
                            <button type="button" className="dtp-cal-nav" onClick={() => setViewMonth(m => addMonths(m, -1))}>
                                <ChevronLeft size={15} />
                            </button>
                            <div className="dtp-cal-month">{fmtHeader(viewMonth)}</div>
                            <button type="button" className="dtp-cal-nav" onClick={() => setViewMonth(m => addMonths(m, 1))}>
                                <ChevronRight size={15} />
                            </button>
                        </div>

                        <div className="dtp-cal-weekdays">
                            {WEEKDAYS.map(w => <div key={w} className="dtp-cal-wd">{w}</div>)}
                        </div>

                        <div className="dtp-cal-grid">
                            {cells.map(({ date, inMonth }, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className={`dtp-cal-cell${sameDay(date, selected) ? ' selected' : ''}${!inMonth ? ' muted' : ''}`}
                                    onClick={() => handleDayClick(date)}
                                >
                                    <span className="dtp-day-num">{date.getDate()}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}
