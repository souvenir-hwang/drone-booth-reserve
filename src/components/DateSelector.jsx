import { useEffect, useRef, useState } from 'react'
import { formatDate, isBookableDate, isPastDate, parseLocalDate, todayStr, weekdayName } from '../utils/booking'

const WEEKDAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토']

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

// allowPast: 과거 날짜 선택 허용 여부 (관리자 화면은 지난 예약 조회를 위해 허용)
export default function DateSelector({ value, onChange, label = '예약 날짜 선택', allowPast = false }) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => (value ? parseLocalDate(value) : new Date()))
  const containerRef = useRef(null)

  const bookable = isBookableDate(value)
  const todayDateStr = todayStr()
  const isPast = !allowPast && isPastDate(value)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const totalDays = daysInMonth(year, month)

  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(d)

  const goPrevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const goNextMonth = () => setViewDate(new Date(year, month + 1, 1))

  const handlePick = (day) => {
    onChange(formatDate(new Date(year, month, day)))
    setOpen(false)
  }

  const shiftDay = (delta) => {
    const base = value ? parseLocalDate(value) : new Date()
    const next = new Date(base.getFullYear(), base.getMonth(), base.getDate() + delta)
    const nextStr = formatDate(next)
    // 과거 날짜 선택이 금지된 경우 오늘(한국 시간 기준) 이전으로는 이동 불가
    if (!allowPast && nextStr < todayDateStr) return
    onChange(nextStr)
    setViewDate(next)
  }

  const goPrevDay = () => shiftDay(-1)
  const goNextDay = () => shiftDay(1)
  const prevDisabled = !allowPast && Boolean(value) && value <= todayDateStr

  return (
    <div className="relative rounded-lg border border-radar-border bg-radar-panel p-4" ref={containerRef}>
      <label className="mb-2 block text-sm font-semibold tracking-wide text-radar-cyan">
        {label}
      </label>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={goPrevDay}
          disabled={prevDisabled}
          aria-label="이전 날짜"
          className="shrink-0 rounded-md border border-radar-border bg-[#0a0e17] px-3 py-2 text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:text-slate-700 disabled:hover:bg-transparent"
        >
          ‹
        </button>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full rounded-md border border-radar-border bg-[#0a0e17] px-3 py-2 text-left font-mono text-slate-100 outline-none focus:border-radar-cyan focus:ring-1 focus:ring-radar-cyan"
        >
          {value ? `${value} (${weekdayName(value)}요일)` : '날짜를 선택하세요'}
        </button>

        <button
          type="button"
          onClick={goNextDay}
          aria-label="다음 날짜"
          className="shrink-0 rounded-md border border-radar-border bg-[#0a0e17] px-3 py-2 text-slate-300 hover:bg-slate-800"
        >
          ›
        </button>
      </div>

      {open && (
        <div className="absolute left-4 right-4 top-full z-40 mt-2 rounded-lg border border-radar-border bg-radar-panel p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={goPrevMonth}
              className="rounded px-2 py-1 text-slate-300 hover:bg-slate-800"
            >
              ‹
            </button>
            <p className="font-semibold text-slate-100">
              {year}년 {month + 1}월
            </p>
            <button
              type="button"
              onClick={goNextMonth}
              className="rounded px-2 py-1 text-slate-300 hover:bg-slate-800"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
            {WEEKDAY_HEADERS.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} />
              const dStr = formatDate(new Date(year, month, day))
              const cellPast = !allowPast && dStr < todayDateStr
              const isSelectable = isBookableDate(dStr) && !cellPast
              const isSelected = dStr === value
              return (
                <button
                  key={dStr}
                  type="button"
                  disabled={!isSelectable}
                  onClick={() => handlePick(day)}
                  className={
                    isSelected
                      ? 'rounded-md bg-radar-amber py-1.5 text-sm font-semibold text-radar-bg'
                      : isSelectable
                        ? 'rounded-md py-1.5 text-sm text-radar-cyan transition hover:bg-radar-cyan/10'
                        : 'cursor-not-allowed rounded-md py-1.5 text-sm text-slate-600'
                  }
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <p className="mt-2 text-xs text-slate-400">
        운영 요일: 화요일 · 수요일 · 목요일 (13:00 ~ 17:00)
      </p>

      {value && isPast && (
        <p className="mt-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          이미 지나간 날짜는 예약할 수 없습니다. 오늘 이후의 화·수·목요일을 선택해주세요.
        </p>
      )}

      {value && !isPast && !bookable && (
        <p className="mt-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {weekdayName(value)}요일은 예약할 수 없습니다. 화·수·목요일 중에서 선택해주세요.
        </p>
      )}

      {value && !isPast && bookable && (
        <p className="mt-2 rounded-md border border-radar-amber/40 bg-radar-amber/10 px-3 py-2 text-sm text-radar-amber">
          {value} ({weekdayName(value)}요일) 예약 가능한 시간표를 아래에서 확인하세요.
        </p>
      )}
    </div>
  )
}
