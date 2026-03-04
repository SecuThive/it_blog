# 오늘의 IT 블로그

스마트폰·노트북·태블릿·IT 액세서리를 직접 구매하고 사용한 경험을 바탕으로
솔직한 리뷰와 구매 가이드를 제공하는 IT 블로그입니다.

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL) |
| Styling | Tailwind CSS v4 + Custom CSS |
| Font | Pretendard Variable |
| 기타 | date-fns, lucide-react |

---

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 Supabase 정보를 입력합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000` 에서 확인할 수 있습니다.

---

## 프로젝트 구조

```
app/
├── (pages)
│   ├── page.tsx              # 메인 홈
│   ├── post/[slug]/          # 포스트 상세
│   ├── category/[slug]/      # 카테고리 목록
│   ├── about/                # 블로그 소개
│   ├── contact/              # 문의
│   ├── disclaimer/           # 광고·제휴 고지
│   └── privacy/              # 개인정보처리방침
│
├── components/
│   ├── Navbar.tsx            # 상단 네비게이션
│   ├── PostCard.tsx          # 포스트 카드
│   ├── AnimationInit.tsx     # 스크롤 애니메이션
│   └── DynamicUI.tsx         # 동적 UI 효과
│
├── lib/
│   ├── supabase.ts           # Supabase 클라이언트 (public)
│   ├── supabase-admin.ts     # Supabase 클라이언트 (서버)
│   └── posts.ts              # 포스트 데이터 함수
│
└── api/
    └── comments/             # 댓글 API
```

---

## 주요 기능

- **포스트** — 카테고리별 IT 리뷰 및 구매 가이드
- **댓글** — 포스트별 댓글 시스템
- **에디터 추천** — 구매 만족도 높은 콘텐츠 큐레이션
- **카테고리** — 스마트폰, 노트북, 리뷰, 딜 등 분류
- **반응형** — 모바일·태블릿·데스크톱 대응

---

## 빌드 및 배포

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 린트 검사
npm run lint
```

---

## 환경 변수 목록

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon public 키 |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role 키 (서버 전용) |
