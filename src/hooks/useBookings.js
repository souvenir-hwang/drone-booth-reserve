import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { todayStr } from '../utils/booking'

// 특정 날짜의 예약 목록을 조회하고, Supabase Realtime으로 다른 사용자의
// 예약/취소를 즉시 반영한다.
export function useBookings(dateStr) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchBookings = useCallback(async () => {
    if (!dateStr) {
      setBookings([])
      return
    }
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_date', dateStr)
      .order('start_time', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setBookings(data ?? [])
    }
    setLoading(false)
  }, [dateStr])

  useEffect(() => {
    fetchBookings()

    if (!dateStr) return undefined

    const channel = supabase
      .channel(`bookings-${dateStr}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `booking_date=eq.${dateStr}`,
        },
        () => {
          fetchBookings()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [dateStr, fetchBookings])

  const createBooking = useCallback(async ({ booth, startTime, name, phone }) => {
    const { error: insertError } = await supabase.from('bookings').insert({
      booth,
      booking_date: dateStr,
      start_time: startTime,
      customer_name: name,
      customer_phone: phone,
    })
    if (insertError) {
      if (insertError.code === '23505') {
        throw new Error('방금 다른 사용자가 이 시간대를 예약했습니다. 목록을 새로고침합니다.')
      }
      throw new Error(insertError.message)
    }
    await fetchBookings()
  }, [dateStr, fetchBookings])

  const cancelBooking = useCallback(async (id) => {
    const { error: deleteError } = await supabase.from('bookings').delete().eq('id', id)
    if (deleteError) {
      throw new Error(deleteError.message)
    }
    await fetchBookings()
  }, [fetchBookings])

  return { bookings, loading, error, refetch: fetchBookings, createBooking, cancelBooking }
}

// 오늘(한국 시간 기준) 이후의 모든 예약을 조회한다.
// 관리자 화면의 "예약 현황 한눈에 보기"용 — 날짜/시간 순으로 정렬하고,
// 다른 사용자의 예약/취소도 Realtime으로 즉시 반영한다.
export function useUpcomingBookings(enabled) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchUpcoming = useCallback(async () => {
    if (!enabled) {
      setBookings([])
      return
    }
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .gte('booking_date', todayStr())
      .order('booking_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setBookings(data ?? [])
    }
    setLoading(false)
  }, [enabled])

  useEffect(() => {
    fetchUpcoming()

    if (!enabled) return undefined

    const channel = supabase
      .channel('bookings-upcoming')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchUpcoming()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled, fetchUpcoming])

  return { bookings, loading, error }
}
