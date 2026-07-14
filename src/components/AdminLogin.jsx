import { useState } from 'react'

export default function AdminLogin({ onSuccess }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD

    if (!adminPassword) {
      setError('관리자 비밀번호가 설정되지 않았습니다. 환경변수(VITE_ADMIN_PASSWORD)를 확인하세요.')
      return
    }

    if (password === adminPassword) {
      onSuccess()
    } else {
      setError('비밀번호가 일치하지 않습니다.')
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <div className="rounded-lg border border-radar-border bg-radar-panel p-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-radar-cyan">
          Admin Access
        </p>
        <h1 className="mt-1 text-xl font-bold text-slate-100">관리자 로그인</h1>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            autoFocus
            className="w-full rounded-md border border-radar-border bg-[#0a0e17] px-3 py-2 text-slate-100 outline-none focus:border-radar-cyan focus:ring-1 focus:ring-radar-cyan"
          />
          {error && (
            <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-md bg-radar-amber py-2 font-semibold text-radar-bg transition hover:brightness-110"
          >
            입장
          </button>
        </form>

        <a href="#" className="mt-4 inline-block text-xs text-slate-500 underline hover:text-slate-300">
          ← 예약 화면으로 돌아가기
        </a>
      </div>
    </div>
  )
}
