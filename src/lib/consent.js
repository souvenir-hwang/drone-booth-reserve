import { supabase } from './supabaseClient'

// 동의서 문구가 바뀌면 이 버전을 올려 어떤 버전에 동의했는지 기록한다.
export const CONSENT_VERSION = 'v1'

// 개인정보 수집·이용 동의 내역을 저장한다.
// 이름+전화번호가 동일하면 마지막에 접수된 동의만 남도록 upsert(덮어쓰기)한다.
// (consents 테이블의 unique(customer_name, customer_phone) 제약과 연동)
export async function saveConsent({ name, phone }) {
  const { error } = await supabase.from('consents').upsert(
    {
      customer_name: name,
      customer_phone: phone,
      consent_version: CONSENT_VERSION,
      agreed_at: new Date().toISOString(),
    },
    { onConflict: 'customer_name,customer_phone' },
  )
  if (error) throw new Error(error.message)
}
