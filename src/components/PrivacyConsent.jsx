// 개인정보 수집 및 이용 동의서 (양식: 드론_시뮬레이션_부스_개인정보_수집_및_이용_동의서.docx)
// 문구를 수정하면 CONSENT_VERSION(src/lib/consent.js)도 함께 올려주세요.
const CONSENT_ITEMS = [
  {
    title: '1. 수집·이용 목적',
    body: '드론 시뮬레이션 부스 예약 확인, 대기 순번 안내 및 부스 운영 관련 연락',
  },
  {
    title: '2. 수집하는 항목',
    body: '이름, 휴대전화번호',
  },
  {
    title: '3. 보유 및 이용 기간',
    body: '신청하신 예약 기간 만료 후 지체 없이 파기 (예약 취소 시에는 취소 즉시 파기)',
    emphasis: true,
  },
  {
    title: '4. 동의 거부 권리 및 불이익 안내',
    body: '귀하는 개인정보 수집 및 이용 동의를 거부할 권리가 있습니다. 단, 동의를 거부하실 경우 드론 시뮬레이션 부스 예약 및 이용이 제한될 수 있습니다.',
  },
]

export default function PrivacyConsent({ agreed, onChange }) {
  return (
    <div className="rounded-md border border-radar-border bg-[#0a0e17] p-3">
      <p className="text-xs font-semibold text-radar-cyan">개인정보 수집 및 이용 동의서</p>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
        드론 시뮬레이션 부스 예약 및 운영을 위해 아래와 같이 개인정보를 수집·이용하고자 합니다.
        내용을 자세히 읽으신 후 동의 여부를 결정해 주시기 바랍니다.
      </p>

      <dl className="mt-2 max-h-40 space-y-2 overflow-y-auto pr-1 text-[11px]">
        {CONSENT_ITEMS.map((item) => (
          <div key={item.title}>
            <dt className="font-semibold text-slate-300">{item.title}</dt>
            <dd className={`mt-0.5 ${item.emphasis ? 'text-radar-amber' : 'text-slate-400'}`}>
              {item.body}
            </dd>
          </div>
        ))}
      </dl>

      <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-md border border-radar-border bg-radar-panel px-3 py-2">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-radar-amber"
        />
        <span className="text-xs text-slate-200">
          위의 개인정보 수집 및 이용 안내를 확인하였으며, 이에 동의합니다.
          <span className="ml-1 font-semibold text-radar-amber">(필수)</span>
        </span>
      </label>
    </div>
  )
}
