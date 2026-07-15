import { useState } from 'react'
import { formatPhone, isValidPhone, slotLabel } from '../utils/booking'
import PrivacyConsent from './PrivacyConsent'

export default function BookingModal({ booth, slot, dateStr, onConfirm, onClose }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('이름을 입력해주세요.')
      return
    }
    if (!isValidPhone(phone)) {
      setError('올바른 휴대폰 번호를 입력해주세요. (예: 010-1234-5678)')
      return
    }
    if (!agreed) {
      setError('개인정보 수집 및 이용에 동의해주세요. (필수)')
      return
    }

    setSubmitting(true)
    try {
      await onConfirm({ name: name.trim(), phone: formatPhone(phone) })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg border border-radar-border bg-radar-panel p-6 shadow-xl">
        <h3 className="text-lg font-bold text-radar-cyan">예약 정보 입력</h3>
        <p className="mt-1 text-sm text-slate-400">
          {dateStr} · Booth {booth} · {slotLabel(slot)}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-radar-border bg-[#0a0e17] px-3 py-2 text-slate-100 outline-none focus:border-radar-cyan focus:ring-1 focus:ring-radar-cyan"
              placeholder="홍길동"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-300">
              연락처 (휴대폰 번호)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-md border border-radar-border bg-[#0a0e17] px-3 py-2 text-slate-100 outline-none focus:border-radar-cyan focus:ring-1 focus:ring-radar-cyan"
              placeholder="010-1234-5678"
            />
          </div>

          <PrivacyConsent agreed={agreed} onChange={setAgreed} />

          {error && (
            <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-md border border-radar-border py-2 text-slate-300 transition hover:bg-slate-800"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting || !agreed}
              className="flex-1 rounded-md bg-radar-amber py-2 font-semibold text-radar-bg transition hover:brightness-110 disabled:opacity-60"
            >
              {submitting ? '예약 중...' : '예약 확정'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
