import { useState } from 'react'
import DateSelector from '../components/DateSelector'
import BoothScheduleGrid from '../components/BoothScheduleGrid'
import BookingModal from '../components/BookingModal'
import { useBookings } from '../hooks/useBookings'
import { saveConsent } from '../lib/consent'
import { isBookableDate, isPastDate, todayStr } from '../utils/booking'

export default function BookingPage() {
  const [dateStr, setDateStr] = useState(todayStr())
  const [selected, setSelected] = useState(null) // { booth, slot }
  const [toast, setToast] = useState('')

  // 화·수·목 요일이면서 지나가지 않은 날짜(한국 시간 기준)만 예약 가능
  const bookable = isBookableDate(dateStr) && !isPastDate(dateStr)
  const { bookings, loading, error, createBooking } = useBookings(bookable ? dateStr : null)

  const handleSelectSlot = (booth, slot) => {
    setSelected({ booth, slot })
  }

  const handleConfirm = async ({ name, phone }) => {
    // 예약을 먼저 확정하고(슬롯 선점 실패 시 여기서 중단), 성공하면 동의 내역을 저장한다.
    await createBooking({ booth: selected.booth, startTime: selected.slot, name, phone })
    // 이름+전화번호가 같으면 마지막 동의만 남도록 upsert 된다.
    await saveConsent({ name, phone })
    setSelected(null)
    setToast('예약이 완료되었습니다!')
    setTimeout(() => setToast(''), 3000)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-radar-cyan">
          Drone Simulation Control Tower
        </p>
        <h1 className="mt-1 text-2xl font-bold leading-snug text-slate-100 sm:text-3xl">
          삼성중공업 생산AX/PI팀
          <br />
          드론 시뮬레이션 부스 예약 시스템
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Booth A / Booth B · 화·수·목 13:00~17:00 (1시간 단위)
        </p>
      </header>

      <div className="space-y-4">
        <DateSelector value={dateStr} onChange={setDateStr} />

        {bookable && (
          <>
            {loading && <p className="text-center text-sm text-slate-400">불러오는 중...</p>}
            {error && (
              <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}
            {!loading && !error && (
              <BoothScheduleGrid bookings={bookings} onSelectSlot={handleSelectSlot} />
            )}
          </>
        )}
      </div>

      {selected && (
        <BookingModal
          booth={selected.booth}
          slot={selected.slot}
          dateStr={dateStr}
          onConfirm={handleConfirm}
          onClose={() => setSelected(null)}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-md border border-radar-cyan/50 bg-radar-panel px-4 py-2 text-sm text-radar-cyan shadow-lg">
          {toast}
        </div>
      )}

      <footer className="mt-10 text-center text-xs text-slate-500">
        <p>관리자 : 생산AX/PI팀 생산자동화그룹 황** 프로 (내선번호 14162)</p>
        <a href="#admin" className="mt-2 inline-block underline hover:text-slate-300">
          관리자 화면
        </a>
      </footer>
    </div>
  )
}
