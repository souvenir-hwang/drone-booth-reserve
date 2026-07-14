// 부스 목록
export const BOOTHS = [
  { id: 'A', label: 'Booth A' },
  { id: 'B', label: 'Booth B' },
]

// 예약 가능한 1시간 단위 슬롯 (13:00~17:00)
export const TIME_SLOTS = ['13:00', '14:00', '15:00', '16:00']

export function slotLabel(slot) {
  const [h] = slot.split(':').map(Number)
  const endH = h + 1
  return `${slot} ~ ${String(endH).padStart(2, '0')}:00`
}

// 예약 가능 요일: 화(2), 수(3), 목(4) — Date.getDay() 기준 (일요일 = 0)
const BOOKABLE_WEEKDAYS = [2, 3, 4]
const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

export function isBookableDate(dateStr) {
  if (!dateStr) return false
  const date = parseLocalDate(dateStr)
  if (Number.isNaN(date.getTime())) return false
  return BOOKABLE_WEEKDAYS.includes(date.getDay())
}

export function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function weekdayName(dateStr) {
  const date = parseLocalDate(dateStr)
  return WEEKDAY_NAMES[date.getDay()]
}

export function todayStr() {
  // 방문자 PC의 시간대와 무관하게 대한민국(Asia/Seoul) 기준 오늘 날짜를 반환
  // ('en-CA' 로케일은 YYYY-MM-DD 형식을 반환)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
}

// 대한민국 시간대 기준으로 이미 지나간 날짜인지 확인
export function isPastDate(dateStr) {
  if (!dateStr) return false
  return dateStr < todayStr()
}

export function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 휴대폰 번호 형식 검증 (010-1234-5678, 01012345678 등 허용)
export function isValidPhone(phone) {
  const digits = phone.replace(/[^0-9]/g, '')
  return /^01[0-9]{8,9}$/.test(digits)
}

export function formatPhone(phone) {
  const digits = phone.replace(/[^0-9]/g, '')
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
  if (digits.length === 10) return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
  return phone
}
