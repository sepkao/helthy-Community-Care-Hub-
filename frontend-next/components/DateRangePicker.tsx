'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

export interface DateRangePickerProps {
    /** วันเริ่มต้นที่เลือก — รับได้ทั้ง Date, "YYYY-MM-DD" หรือ "MM/DD/YYYY" */
    startDate: string | Date
    /** วันสิ้นสุดที่เลือก — รูปแบบเดียวกับ startDate */
    endDate: string | Date
    /** เรียกกลับเมื่อผู้ใช้เลือกช่วงวันใหม่เสร็จ (จากปฏิทิน, พิมพ์ในช่อง input, หรือกด quick-select) */
    onRangeChange: (startDate: Date, endDate: Date) => void
    className?: string
    style?: React.CSSProperties
}

const pad = (n: number) => String(n).padStart(2, '0')
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime()
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1)
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }

function parseDate(input: string | Date): Date {
    if (input instanceof Date) return startOfDay(input)
    const iso = input.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))
    const mdy = input.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (mdy) return new Date(Number(mdy[3]), Number(mdy[1]) - 1, Number(mdy[2]))
    const d = new Date(input)
    return Number.isNaN(d.getTime()) ? startOfDay(new Date()) : startOfDay(d)
}

const fmtMDY = (d: Date) => `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`
const fmtTrigger = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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

const css = `
    .drp { position: relative; display: inline-block; font-family: 'Inter', sans-serif; }
    .drp-trigger {
        display: inline-flex; align-items: center; gap: 8px;
        background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 999px;
        padding: 8px 16px; cursor: pointer; outline: none;
        font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; color: #0f172a;
        transition: border-color 0.15s, background 0.15s;
    }
    .drp-trigger:hover { border-color: #bbf7d0; background: #f0fdf4; }
    .drp-trigger svg { color: #16a34a; flex-shrink: 0; }

    .drp-panel {
        position: absolute; top: calc(100% + 8px); left: 0; z-index: 30;
        width: 300px; background: #ffffff; border-radius: 20px;
        box-shadow: 0 12px 32px rgba(0,0,0,0.14);
        padding: 16px;
    }

    .drp-inputs { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
    .drp-input {
        flex: 1; min-width: 0; border: 1.5px solid #e2e8f0; border-radius: 10px;
        padding: 8px 10px; font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 600;
        color: #0f172a; outline: none; text-align: center; transition: border-color 0.15s;
    }
    .drp-input:focus { border-color: #16a34a; }
    .drp-input-sep { color: #cbd5e1; font-size: 12px; flex-shrink: 0; }

    .drp-quick { display: flex; gap: 6px; margin-bottom: 14px; }
    .drp-quick-btn {
        flex: 1; padding: 7px 0; border-radius: 999px; border: 1.5px solid #e2e8f0;
        background: #ffffff; font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 600;
        color: #475569; cursor: pointer; transition: all 0.15s; white-space: nowrap;
    }
    .drp-quick-btn:hover { background: #f0fdf4; border-color: #bbf7d0; color: #16a34a; }

    .cal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .cal-month-label { font-size: 13px; font-weight: 700; color: #0f172a; }
    .cal-nav {
        width: 26px; height: 26px; border-radius: 50%; border: none; background: transparent;
        display: flex; align-items: center; justify-content: center; cursor: pointer; color: #475569;
        transition: background 0.15s;
    }
    .cal-nav:hover { background: #f1f5f9; }

    .cal-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 2px; }
    .cal-wd { text-align: center; font-size: 10px; font-weight: 700; color: #94a3b8; padding: 4px 0; }

    .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
    .cal-cell {
        position: relative; border: none; background: transparent; cursor: pointer;
        font-family: 'Inter', sans-serif; font-size: 12px; font-weight: 500; color: #0f172a;
        display: flex; align-items: center; justify-content: center;
        height: 34px; padding: 0;
    }
    .cal-cell.muted { color: #cbd5e1; }
    .cal-cell.in-range::before {
        content: ''; position: absolute; top: 4px; bottom: 4px; left: 0; right: 0;
        background: #f1f5f9; z-index: 0;
    }
    .cal-cell.range-start.in-range::before { left: 50%; border-radius: 999px 0 0 999px; }
    .cal-cell.range-end.in-range::before { right: 50%; border-radius: 0 999px 999px 0; }
    .cal-cell.range-start.range-end.in-range::before { display: none; }
    .cal-day-num {
        position: relative; z-index: 1;
        width: 26px; height: 26px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
    }
    .cal-cell.range-start .cal-day-num, .cal-cell.range-end .cal-day-num {
        background: #000000; color: #ffffff; font-weight: 700;
    }
`

export default function DateRangePicker({ startDate, endDate, onRangeChange, className, style }: DateRangePickerProps) {
    const [open, setOpen] = useState(false)
    const [rangeStart, setRangeStart] = useState(() => parseDate(startDate))
    const [rangeEnd, setRangeEnd] = useState(() => parseDate(endDate))
    const [pendingStart, setPendingStart] = useState<Date | null>(null)
    const [viewMonth, setViewMonth] = useState(() => addMonths(parseDate(startDate), 0))
    const [startText, setStartText] = useState(() => fmtMDY(parseDate(startDate)))
    const [endText, setEndText] = useState(() => fmtMDY(parseDate(endDate)))
    const rootRef = useRef<HTMLDivElement>(null)

    // sync เมื่อ props เปลี่ยนจากภายนอก (เช่น parent ตั้งค่าเริ่มต้นใหม่)
    useEffect(() => {
        const s = parseDate(startDate), e = parseDate(endDate)
        setRangeStart(s); setRangeEnd(e)
        setStartText(fmtMDY(s)); setEndText(fmtMDY(e))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [String(startDate), String(endDate)])

    useEffect(() => {
        if (!open) return
        const handleClick = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [open])

    const commit = (s: Date, e: Date) => {
        const [lo, hi] = s <= e ? [s, e] : [e, s]
        setRangeStart(lo); setRangeEnd(hi)
        setStartText(fmtMDY(lo)); setEndText(fmtMDY(hi))
        setViewMonth(addMonths(lo, 0))
        onRangeChange(lo, hi)
    }

    const handleDayClick = (day: Date) => {
        if (!pendingStart) {
            setPendingStart(day)
            setRangeStart(day); setRangeEnd(day)
            setStartText(fmtMDY(day)); setEndText(fmtMDY(day))
        } else {
            commit(pendingStart, day)
            setPendingStart(null)
            setOpen(false)
        }
    }

    const commitStartText = () => {
        const m = startText.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
        if (!m) { setStartText(fmtMDY(rangeStart)); return }
        commit(parseDate(startText), rangeEnd)
    }
    const commitEndText = () => {
        const m = endText.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
        if (!m) { setEndText(fmtMDY(rangeEnd)); return }
        commit(rangeStart, parseDate(endText))
    }

    const applyQuick = (days: number) => {
        const today = startOfDay(new Date())
        commit(addDays(today, -(days - 1)), today)
        setOpen(false)
    }

    const cells = buildMonthGrid(viewMonth)

    return (
        <>
            <style>{css}</style>
            <div ref={rootRef} className={`drp${className ? ' ' + className : ''}`} style={style}>
                <button type="button" className="drp-trigger" onClick={() => setOpen(o => !o)}>
                    <Calendar size={15} strokeWidth={2} />
                    <span>{fmtTrigger(rangeStart)} ~ {fmtTrigger(rangeEnd)}</span>
                </button>

                {open && (
                    <div className="drp-panel">
                        <div className="drp-inputs">
                            <input
                                className="drp-input" value={startText}
                                onChange={e => setStartText(e.target.value)}
                                onBlur={commitStartText}
                                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                            />
                            <span className="drp-input-sep">–</span>
                            <input
                                className="drp-input" value={endText}
                                onChange={e => setEndText(e.target.value)}
                                onBlur={commitEndText}
                                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                            />
                        </div>

                        <div className="drp-quick">
                            <button type="button" className="drp-quick-btn" onClick={() => applyQuick(7)}>Last week</button>
                            <button type="button" className="drp-quick-btn" onClick={() => applyQuick(30)}>Last month</button>
                            <button type="button" className="drp-quick-btn" onClick={() => applyQuick(365)}>Last year</button>
                        </div>

                        <div className="cal-head">
                            <button type="button" className="cal-nav" onClick={() => setViewMonth(m => addMonths(m, -1))}>
                                <ChevronLeft size={15} />
                            </button>
                            <div className="cal-month-label">{fmtHeader(viewMonth)}</div>
                            <button type="button" className="cal-nav" onClick={() => setViewMonth(m => addMonths(m, 1))}>
                                <ChevronRight size={15} />
                            </button>
                        </div>

                        <div className="cal-weekdays">
                            {WEEKDAYS.map(w => <div key={w} className="cal-wd">{w}</div>)}
                        </div>

                        <div className="cal-grid">
                            {cells.map(({ date, inMonth }, i) => {
                                const inRange = date >= rangeStart && date <= rangeEnd
                                const isStart = sameDay(date, rangeStart)
                                const isEnd = sameDay(date, rangeEnd)
                                return (
                                    <button
                                        key={i}
                                        type="button"
                                        className={[
                                            'cal-cell',
                                            inRange ? 'in-range' : '',
                                            isStart ? 'range-start' : '',
                                            isEnd ? 'range-end' : '',
                                            !inMonth ? 'muted' : '',
                                        ].filter(Boolean).join(' ')}
                                        onClick={() => handleDayClick(date)}
                                    >
                                        <span className="cal-day-num">{date.getDate()}</span>
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
