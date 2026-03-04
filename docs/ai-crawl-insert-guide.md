# AI 크롤러 DB 삽입 가이드

OpenClaw 등 AI 에이전트가 크롤링한 데이터를 Supabase에 삽입할 때
**데이터가 깨지지 않도록** 지켜야 할 규칙과 예시를 담았습니다.

---

## 핵심 원칙

1. SQL 직접 실행보다 **Supabase REST API(JSON)** 방식을 우선 사용할 것
2. SQL을 써야 한다면 **달러 인용(`$$`)** 으로 따옴표 충돌을 방지할 것
3. 삽입 전 **slug 중복 체크** 또는 `on conflict` 처리를 반드시 포함할 것
4. content 내 단락 구분은 **실제 줄바꿈 2번(`\n\n`)** 으로 할 것

---

## 방법 1 — Supabase REST API (권장)

문자열 이스케이프 문제가 없고 가장 안전합니다.

### 엔드포인트

```
POST https://<project-ref>.supabase.co/rest/v1/posts
POST https://<project-ref>.supabase.co/rest/v1/post_sections
```

### 헤더

```
apikey: <SUPABASE_SERVICE_ROLE_KEY>
Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
Content-Type: application/json
Prefer: resolution=merge-duplicates          ← slug 중복 시 업데이트
```

### Step 1 — posts 삽입

```json
POST /rest/v1/posts

{
  "slug": "galaxy-s25-ultra-review",
  "title": "갤럭시 S25 울트라 2주 사용 후기",
  "description": "출시 직후 구매해 2주간 실사용한 솔직 리뷰입니다.",
  "category": "smartphone",
  "tags": ["갤럭시", "삼성", "플래그십", "S25"],
  "read_minutes": 8,
  "author": "에디터 김지훈",
  "featured": false,
  "created_at": "2026-03-04T09:00:00+09:00"
}
```

응답에서 `id` 값을 꺼내 다음 단계에 사용합니다.

### Step 2 — post_sections 삽입

```json
POST /rest/v1/post_sections

[
  {
    "post_id": 1,
    "position": 0,
    "heading": "박스 구성 및 첫인상",
    "content": "갤럭시 S25 울트라의 박스 구성은 전작과 크게 다르지 않습니다.\n\n처음 손에 쥐었을 때 인상은 무겁지만 고급스럽다는 것이었습니다."
  },
  {
    "post_id": 1,
    "position": 1,
    "heading": "카메라 성능",
    "content": "주간 촬영은 압도적인 해상도와 자연스러운 색감을 보여줍니다.\n\n야간 촬영에서도 노이즈 제어가 훌륭합니다."
  }
]
```

> **`\n\n`** 은 JSON 문자열 안에서 그대로 `\\n\\n` 이 아니라 **`\n\n`** 으로 씁니다.
> JSON은 `\n`을 줄바꿈으로 해석하기 때문에 이스케이프 없이 사용합니다.

---

## 방법 2 — SQL (달러 인용 방식)

SQL Editor에서 직접 실행하거나 스크립트로 생성할 때 사용합니다.
큰따옴표, 작은따옴표, 특수문자가 포함된 한국어 텍스트에 안전합니다.

### 달러 인용이란?

```sql
-- 일반 방식 (작은따옴표가 있으면 깨짐)
insert into ... values ('그는 "좋다"고 말했다');   -- 오류 위험

-- 달러 인용 방식 (어떤 문자도 안전)
insert into ... values ($$그는 "좋다"고 말했다$$);  -- 항상 안전
```

### 전체 예시

```sql
-- ① 포스트 메타 등록
insert into public.posts (slug, title, description, category, tags, read_minutes, author, featured)
values (
  $$galaxy-s25-ultra-review$$,
  $$갤럭시 S25 울트라 2주 사용 후기$$,
  $$출시 직후 구매해 2주간 실사용한 솔직 리뷰입니다.$$,
  $$smartphone$$,
  array[$$갤럭시$$, $$삼성$$, $$플래그십$$, $$S25$$],
  8,
  $$에디터 김지훈$$,
  false
)
on conflict (slug) do update
  set title        = excluded.title,
      description  = excluded.description,
      read_minutes = excluded.read_minutes;

-- ② ID 확인
select id from public.posts where slug = $$galaxy-s25-ultra-review$$;
-- 결과: id = 1 이라고 가정

-- ③ 섹션 등록 (기존 섹션 삭제 후 재삽입 — 멱등성 보장)
delete from public.post_sections where post_id = 1;

insert into public.post_sections (post_id, position, heading, content) values
(1, 0,
  $$박스 구성 및 첫인상$$,
  $$갤럭시 S25 울트라의 박스 구성은 전작과 크게 다르지 않습니다.

처음 손에 쥐었을 때 인상은 무겁지만 고급스럽다는 것이었습니다.$$
),
(1, 1,
  $$카메라 성능 — 주간·야간 비교$$,
  $$주간 촬영은 압도적인 해상도와 자연스러운 색감을 보여줍니다.

야간 촬영에서도 노이즈 제어가 훌륭합니다. 다만 AI 처리가 과하게 적용될 수 있습니다.$$
);
```

> SQL에서 content 단락 구분은 `$$` 안에서 **실제로 엔터를 두 번** 누른 빈 줄로 표현합니다.

---

## 필드별 생성 규칙 (AI 에이전트용)

### `slug` — URL 식별자

```
규칙:
- 영문 소문자, 숫자, 하이픈(-) 만 허용
- 공백 → 하이픈
- 한글·특수문자 → 제거 또는 영문 변환
- 최대 80자

예시:
  원문 제목: "갤럭시 S25 울트라 리뷰 (2026년 3월)"
  slug:      "galaxy-s25-ultra-review-2026-03"
```

### `category` — 카테고리 슬러그

```
smartphone  →  스마트폰 관련
laptop      →  노트북 관련
review      →  기타 기기 리뷰 (태블릿, 이어폰, 워치 등)
deal        →  할인/최저가 정보

새 카테고리가 필요하면 영문 소문자 슬러그 자유롭게 추가 가능.
ex) tablet, earbuds, smartwatch
```

### `tags` — 태그 배열

```
- 최대 8개 권장
- 한글 키워드 위주 (검색·필터 용도)
- 중복·빈 문자열 제거 후 삽입

REST API:  "tags": ["갤럭시", "삼성", "카메라"]
SQL:       array[$$갤럭시$$, $$삼성$$, $$카메라$$]
```

### `read_minutes` — 읽기 시간 자동 계산

```
전체 content 글자 수 기준:
  ~500자   → 3분
  ~1000자  → 5분
  ~2000자  → 7분
  ~3000자  → 10분
  3000자+  → ceil(글자수 / 300) 분
```

### `content` — 본문 단락 구분

```
단락 구분:  빈 줄 1개 (줄바꿈 2번, \n\n)
단락 내 줄바꿈: 줄바꿈 1번 (같은 단락으로 처리됨)

올바른 예:
  첫 번째 단락입니다.
  (빈 줄)
  두 번째 단락입니다.

잘못된 예:
  첫 번째 단락입니다. 두 번째 단락입니다.   ← 한 덩어리로 렌더링됨
```

### `created_at` — 발행일

```
ISO 8601 형식 권장:
  "2026-03-04T09:00:00+09:00"   ← 한국 시간(KST) 명시
  "2026-03-04T00:00:00Z"        ← UTC도 가능

크롤링한 원문의 발행일을 그대로 사용.
발행일 파악 불가 시 생략 → DB 기본값(현재 시각) 자동 적용.
```

---

## 중복 처리 (멱등성)

같은 기사를 두 번 크롤링해도 오류 없이 업데이트되도록 처리합니다.

### REST API

```
헤더에 추가:
Prefer: resolution=merge-duplicates
```

`slug`가 unique key이므로 중복 삽입 시 기존 행을 업데이트합니다.

### SQL

```sql
-- posts: upsert
insert into public.posts (...)
values (...)
on conflict (slug) do update
  set title        = excluded.title,
      description  = excluded.description,
      updated_at   = now();

-- post_sections: 삭제 후 재삽입
delete from public.post_sections where post_id = (
  select id from public.posts where slug = $$target-slug$$
);
insert into public.post_sections (...) values (...);
```

---

## 깨짐 방지 체크리스트

AI 에이전트가 삽입 전 반드시 확인해야 할 항목입니다.

```
[ ] slug가 영문·숫자·하이픈만으로 구성되어 있는가?
[ ] slug가 80자 이하인가?
[ ] title이 빈 문자열이 아닌가?
[ ] description이 빈 문자열이 아닌가?
[ ] category가 유효한 슬러그 형식(영문 소문자+하이픈)인가?
[ ] tags가 배열 형태인가? (문자열 하나가 아닌)
[ ] read_minutes가 1 이상의 정수인가?
[ ] sections 배열이 최소 1개 이상인가?
[ ] 각 section에 heading과 content가 모두 있는가?
[ ] content 안에 SQL 인젝션 위험 문자가 있다면 달러 인용을 쓰는가?
[ ] created_at이 유효한 ISO 8601 형식인가?
```

---

## 전체 플로우 요약

```
크롤링
  ↓
데이터 정제
  - slug 생성 (영문 변환)
  - 본문 → sections 분리 (제목 기준)
  - read_minutes 계산
  - tags 추출
  ↓
slug 중복 확인
  SELECT id FROM posts WHERE slug = '...'
  ↓ 없으면           ↓ 있으면
  INSERT             UPDATE + sections 재삽입
  ↓
완료
```
