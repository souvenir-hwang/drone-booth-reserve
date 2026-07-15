import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// 저장된 개인정보 수집·이용 동의 내역을 최신순으로 조회한다 (관리자 화면용).
export function useConsents(enabled) {
  const [consents, setConsents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchConsents = useCallback(async () => {
    if (!enabled) {
      setConsents([])
      return
    }
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('consents')
      .select('*')
      .order('agreed_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setConsents(data ?? [])
    }
    setLoading(false)
  }, [enabled])

  useEffect(() => {
    fetchConsents()

    if (!enabled) return undefined

    const channel = supabase
      .channel('consents-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consents' }, () => {
        fetchConsents()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled, fetchConsents])

  return { consents, loading, error }
}
