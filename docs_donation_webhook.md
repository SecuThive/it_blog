# Donation Webhook Setup

## 1) Supabase 테이블 생성
`scripts/donation_schema.sql` 내용을 Supabase SQL Editor에서 실행합니다.

## 2) 환경 변수
`.env`에 아래 값을 추가합니다.

```bash
DONATION_WEBHOOK_SECRET=your-strong-webhook-secret
DONATION_BANK_NAME=국민은행
DONATION_ACCOUNT_NUMBER=000000-00-000000
DONATION_ACCOUNT_HOLDER=오늘의IT블로그
```

## 3) 기부 의도 생성 API
`POST /api/donation-intents`

요청 예시:
```json
{
  "donorName": "홍길동",
  "amount": 30000,
  "message": "좋은 콘텐츠 감사합니다"
}
```

응답에는 `intentId`와 입금 안내 정보가 포함됩니다.

## 4) 가상계좌 입금 완료 웹훅
`POST /api/webhooks/virtual-account`

헤더:
- `x-donation-webhook-secret: {DONATION_WEBHOOK_SECRET}`

바디 예시:
```json
{
  "eventType": "VIRTUAL_ACCOUNT_DEPOSITED",
  "intentId": "e8fbe4a4-2f95-4df3-9d0f-9ff1a6fa5e7d",
  "providerTxId": "va_tx_20260221_0001",
  "donorName": "홍길동",
  "amount": 30000,
  "depositedAt": "2026-02-21T12:10:00+09:00",
  "message": "자동입금"
}
```

정상 처리되면 투명성 페이지(`/donation`)의 후원 수입 내역에 자동 반영됩니다.

## 5) 기부 인증 페이지
- 사용자 상태 조회: `/donation/verify`
- 운영자 수동 인증: `/donation/admin`

### 상태 조회 API
`GET /api/donation-intents/{intentId}`

### 운영자 수동 인증 API
`POST /api/donation/admin-confirm`

요청 예시:
```json
{
  "adminPassword": "환경변수 ADMIN_PASSWORD 값",
  "intentId": "기부요청ID(선택)",
  "providerTxId": "중복되지 않는 거래ID",
  "amount": 30000,
  "donorName": "홍길동",
  "message": "수동 반영",
  "depositedAt": "2026-02-21T12:10:00+09:00"
}
```
