import { useState } from 'react'
import AdminLogin from '../components/AdminLogin'
import DateSelector from '../components/DateSelector'
import { useBookings, useUpcomingBookings } from '../hooks/useBookings'
import { useConsents } from '../hooks/useConsents'
import { BOOTHS, slotLabel, todayStr, weekdayName } from '../utils/booking'

const SESSION_KEY = 'drone_booth_admin_authed'

export default function AdminPage() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === 'true')
  const [dateStr, setDateStr] = useState(todayStr())
  const { bookings, loading, error, cancelBooking } = useBookings(authed ? dateStr : null)
  const {
    bookings: upcomingBookings,
    loading: upcomingLoading,
    error: upcomingError,
  } = useUpcomingBookings(authed)
  const {
    consents,
    loading: consentsLoading,
    error: consentsError,
  } = useConsents(authed)
  const [cancelingId, setCancelingId] = useState(null)
  const [actionError, setActionError] = useState('')
  const [showConsents, setShowConsents] = useState(false)

  const handleLoginSuccess = () => {
    sessionStorage.setItem(SESSION_KEY, 'true')
    setAuthed(true)
  }

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setAuthed(false)
  }

  const handleCancel = async (id) => {
    if (!window.confirm('이 예약을 취소하시겠습니까?')) return
    setCancelingId(id)
    setActionError('')
    try {
      await cancelBooking(id)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setCancelingId(null)
    }
  }

  if (!authed) {
    return <AdminLogin onSuccess={handleLoginSuccess} />
  }

  // 오늘 이후 예약을 날짜별로 묶어서 "한눈에 보기" 요약을 만든다
  const upcomingByDate = upcomingBookings.reduce((acc, b) => {
    ;(acc[b.booking_date] = acc[b.booking_date] || []).push(b)
    return acc
  }, {})
  const upcomingDates = Object.keys(upcomingByDate).sort()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-radar-cyan">
            Admin Console
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-100">예약 관리</h1>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-md border border-radar-border px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800"
        >
          로그아웃
        </button>
      </header>

      <section className="mb-4 rounded-lg border border-radar-border bg-radar-panel p-4">
        <h2 className="mb-3 text-sm font-semibold tracking-wide text-radar-cyan">
          예약 현황 한눈에 보기 <span className="font-normal text-slate-500">(오늘 이후)</span>
        </h2>

        {upcomingLoading && <p className="text-sm text-slate-400">불러오는 중...</p>}
        {upcomingError && (
          <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {upcomingError}
          </p>
        )}
        {!upcomingLoading && !upcomingError && upcomingDates.length === 0 && (
          <p className="text-sm text-slate-500">예정된 예약이 없습니다.</p>
        )}
        {!upcomingLoading && !upcomingError && upcomingDates.length > 0 && (
          <ul className="space-y-2">
            {upcomingDates.map((d) => {
              const dayBookings = upcomingByDate[d]
              return (
                <li key={d}>
                  <button
                    type="button"
                    onClick={() => setDateStr(d)}
                    className={`w-full rounded-md border px-3 py-2 text-left transition hover:border-radar-cyan/60 ${
                      d === dateStr
                        ? 'border-radar-amber/60 bg-radar-amber/5'
                        : 'border-radar-border bg-[#0a0e17]'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-mono text-sm text-slate-100">
                        {d} ({weekdayName(d)})
                      </span>
                      <span className="shrink-0 rounded-full border border-radar-cyan/40 px-2 py-0.5 text-xs text-radar-cyan">
                        {dayBookings.length}건
                      </span>
                    </span>
                    <span className="mt-1 block text-xs text-slate-400">
                      {BOOTHS.map((booth) => {
                        const slots = dayBookings
                          .filter((b) => b.booth === booth.id)
                          .map((b) => b.start_time.slice(0, 5))
                        return slots.length > 0 ? `${booth.label}: ${slots.join(', ')}` : null
                      })
                        .filter(Boolean)
                        .join(' · ')}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
        <p className="mt-3 text-xs text-slate-500">날짜를 클릭하면 아래에서 상세 내역을 볼 수 있습니다.</p>
      </section>

      <DateSelector value={dateStr} onChange={setDateStr} label="조회할 날짜" allowPast />

      {loading && <p className="mt-4 text-center text-sm text-slate-400">불러오는 중...</p>}
      {error && (
        <p className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      {actionError && (
        <p className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {actionError}
        </p>
      )}

      {!loading && !error && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {BOOTHS.map((booth) => {
            const boothBookings = bookings.filter((b) => b.booth === booth.id)
            return (
              <div key={booth.id} className="rounded-lg border border-radar-border bg-radar-panel p-4">
                <h2 className="mb-3 font-semibold text-radar-cyan">{booth.label}</h2>
                {boothBookings.length === 0 ? (
                  <p className="text-sm text-slate-500">예약 없음</p>
                ) : (
                  <ul className="space-y-2">
                    {boothBookings.map((b) => (
                      <li
                        key={b.id}
                        className="flex items-center justify-between rounded-md border border-radar-border bg-[#0a0e17] px-3 py-2"
                      >
                        <div className="text-sm">
                          <p className="font-mono text-radar-amber">
                            {slotLabel(b.start_time.slice(0, 5))}
                          </p>
                          <p className="text-slate-200">{b.customer_name}</p>
                          <p className="text-slate-400">{b.customer_phone}</p>
                        </div>
                        <button
                          onClick={() => handleCancel(b.id)}
                          disabled={cancelingId === b.id}
                          className="rounded-md border border-red-500/50 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                        >
                          {cancelingId === b.id ? '취소 중...' : '취소'}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}

      <section className="mt-8 rounded-lg border border-radar-border bg-radar-panel p-4">
        <button
          type="button"
          onClick={() => setShowConsents((v) => !v)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-sm font-semibold tracking-wide text-radar-cyan">
            개인정보 수집·이용 동의 내역{' '}
            <span className="font-normal text-slate-500">({consents.length}명)</span>
          </span>
          <span className="text-slate-400">{showConsents ? '▲' : '▼'}</span>
        </button>

        {showConsents && (
          <div className="mt-3">
            {consentsLoading && <p className="text-sm text-slate-400">불러오는 중...</p>}
            {consentsError && (
              <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {consentsError}
              </p>
            )}
            {!consentsLoading && !consentsError && consents.length === 0 && (
              <p className="text-sm text-slate-500">저장된 동의 내역이 없습니다.</p>
            )}
            {!consentsLoading && !consentsError && consents.length > 0 && (
              <ul className="space-y-2">
                {consents.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between rounded-md border border-radar-border bg-[#0a0e17] px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="text-slate-200">{c.customer_name}</p>
                      <p className="text-slate-400">{c.customer_phone}</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p className="text-radar-cyan">동의함</p>
                      <p>{new Date(c.agreed_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-slate-500">
              동일한 이름·전화번호로 재신청하면 가장 최근 동의만 남습니다.
            </p>
          </div>
        )}
      </section>

      <footer className="mt-10 text-center">
        <a href="#" className="text-xs text-slate-500 underline hover:text-slate-300">
          ← 예약 화면으로 돌아가기
        </a>
      </footer>
    </div>
  )
}
