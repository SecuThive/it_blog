# 포스트 DB 등록 가이드

Supabase SQL Editor에서 아래 순서대로 진행합니다.

---

## 1. 테이블 생성 (최초 1회)

```sql
-- 포스트 메타 테이블
create table if not exists public.posts (
  id           bigserial    primary key,
  slug         text         not null unique,
  title        text         not null,
  description  text         not null,
  category     text         not null,
  tags         text[]       not null default '{}',
  created_at   timestamptz  not null default now(),
  read_minutes integer      not null default 5,
  author       text         not null default '에디터',
  featured     boolean      not null default false
);

-- 포스트 본문 섹션 테이블
create table if not exists public.post_sections (
  id        bigserial  primary key,
  post_id   bigint     not null references public.posts(id) on delete cascade,
  position  integer    not null default 0,
  heading   text       not null,
  content   text       not null
);

-- 조회 인덱스
create index if not exists post_sections_post_id_idx
  on public.post_sections (post_id, position);
```

---

## 2. 필드 설명

### `posts` 테이블

| 컬럼 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `slug` | text (unique) | URL 식별자. 영문 소문자 + 하이픈 | `galaxy-s25-review` |
| `title` | text | 포스트 제목 | `갤럭시 S25 울트라 리뷰` |
| `description` | text | 한 줄 요약 (카드·메타에 표시) | `출시 2주 실사용 후 솔직 후기` |
| `category` | text | 카테고리 슬러그 | `smartphone` / `laptop` / `review` / `deal` |
| `tags` | text[] | 태그 배열 | `{"갤럭시","삼성","플래그십"}` |
| `created_at` | timestamptz | 발행일 (미입력 시 현재 시각) | `2026-03-04T09:00:00+09:00` |
| `read_minutes` | integer | 예상 읽기 시간(분) | `8` |
| `author` | text | 작성자 이름 | `에디터 김지훈` |
| `featured` | boolean | 에디터 추천 여부 (메인 노출) | `true` / `false` |

### `post_sections` 테이블

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `post_id` | bigint | 연결된 포스트 ID |
| `position` | integer | 섹션 순서 (0부터 시작, 오름차순 정렬) |
| `heading` | text | 섹션 제목 (h2로 렌더링) |
| `content` | text | 섹션 본문 — **`\n\n`으로 단락 구분** |

---

## 3. 글 등록 예시

```sql
-- ① 포스트 메타 등록
insert into public.posts (slug, title, description, category, tags, read_minutes, author, featured)
values (
  'galaxy-s25-ultra-review',
  '갤럭시 S25 울트라 2주 사용 후기 — AI 기능이 진짜 쓸만한가?',
  '출시 직후 구매해 2주간 메인폰으로 사용한 솔직 리뷰. 카메라·배터리·S펜 중심으로 정리했습니다.',
  'smartphone',
  '{"갤럭시","삼성","안드로이드","플래그십","S25"}',
  10,
  '에디터 김지훈',
  true
);

-- ② 방금 등록한 포스트 ID 확인
-- select id from public.posts where slug = 'galaxy-s25-ultra-review';
-- 예: id = 1

-- ③ 섹션 본문 등록 (position 순서대로)
insert into public.post_sections (post_id, position, heading, content) values
(1, 0, '박스 구성 및 첫인상',
'갤럭시 S25 울트라의 박스 구성은 전작과 크게 다르지 않습니다. 본체, S펜, USB-C 케이블, 방침서로 구성되며 충전기는 별도 구매해야 합니다.

처음 손에 쥐었을 때 인상은 "무겁지만 고급스럽다"는 것이었습니다. 티타늄 프레임 덕분에 전작보다 질감이 훨씬 고급스럽게 느껴집니다. 약 218g의 무게는 장시간 사용 시 손목에 부담을 줄 수 있으니 참고하세요.'),

(1, 1, '카메라 성능 — 주간·야간 비교',
'메인 카메라는 2억 화소 광각 + 5000만 화소 망원(x5) + 1200만 화소 초광각 트리플 구성입니다. 주간 촬영은 압도적인 해상도와 자연스러운 색감으로 현재 시중 스마트폰 중 최고 수준입니다.

야간 촬영에서도 노이즈 제어가 훌륭합니다. 다만 AI 야경 처리가 과하게 적용되면 피사체 윤곽이 뭉개지는 현상이 간헐적으로 발생했습니다. 이 부분은 소프트웨어 업데이트로 개선될 것으로 기대합니다.

망원은 x10 줌까지 실용적으로 사용 가능하며, x100 줌은 참고용 정도로 활용하는 것이 현실적입니다.'),

(1, 2, 'AI 기능 — 실제로 얼마나 유용한가?',
'갤럭시 AI의 핵심 기능은 "서클 투 서치"와 "실시간 통화 번역"입니다. 서클 투 서치는 화면 어디서든 원을 그려 검색할 수 있어 생각보다 자주 사용하게 됩니다.

실시간 통화 번역은 아직 자연스럽지 않은 부분이 있지만, 기본적인 업무 통화에는 충분히 활용 가능한 수준입니다. 2주 사용 동안 가장 많이 쓴 AI 기능은 노트 요약으로, S펜으로 작성한 메모를 자동으로 정리해주는 기능이 업무 효율을 높여줬습니다.'),

(1, 3, '배터리 지속 시간',
'5000mAh 배터리는 일반 사용 기준으로 하루 이상 충분히 버팁니다. 유튜브 2시간 + SNS 1시간 + 카메라 50컷 기준으로 퇴근 후 약 40~50% 잔량이 남았습니다.

45W 유선 충전 시 0%에서 80%까지 약 40분이 소요됩니다. 무선 충전은 15W로 상대적으로 느리지만, 야간 충전 시에는 충분합니다.'),

(1, 4, '최종 구매 추천 대상',
'갤럭시 S25 울트라는 다음과 같은 분께 추천합니다. 첫째, S펜을 업무에 활용하는 분. 둘째, 카메라 화질을 최우선으로 고려하는 분. 셋째, 삼성 생태계(갤럭시 워치, 버즈 등)를 이미 사용 중인 분.

반면 가성비를 중시하거나 S펜이 불필요한 분이라면 S25+ 혹은 S25 기본형도 충분한 선택입니다. 가격 차이가 상당하므로 자신의 사용 패턴을 먼저 파악하는 것이 중요합니다.');
```

---

## 4. 카테고리 슬러그 목록

| 슬러그 | 표시 이름 | 예시 콘텐츠 |
|--------|-----------|-------------|
| `smartphone` | Smartphone | 스마트폰 리뷰, 비교, 구매 가이드 |
| `laptop` | Laptop | 노트북 리뷰, 스펙 분석 |
| `review` | Review | 태블릿, 이어폰, 스마트워치 등 |
| `deal` | Deal | 할인 정보, 최저가 공유 |

> 카테고리 슬러그는 영문 소문자 + 하이픈 조합으로 자유롭게 추가 가능합니다.
> 새 슬러그를 사용하면 자동으로 네비게이션에 추가됩니다.

---

## 5. 본문 작성 규칙

### 단락 구분: `\n\n` (빈 줄 하나)

```
첫 번째 단락입니다. 여기에 내용을 작성합니다.

두 번째 단락입니다. \n\n 기준으로 단락이 분리되어 렌더링됩니다.

세 번째 단락입니다.
```

- 단락 사이에 빈 줄(`\n\n`)을 넣으면 별도의 `<p>` 태그로 렌더링됩니다.
- 단순 줄바꿈(`\n`)은 같은 단락으로 처리됩니다.
- 섹션은 최소 2개 이상 작성하는 것이 목차 표시에 유리합니다.

---

## 6. 글 수정 / 삭제

```sql
-- 포스트 제목 수정
update public.posts
set title = '새 제목'
where slug = 'galaxy-s25-ultra-review';

-- 특정 섹션 내용 수정
update public.post_sections
set content = '수정된 내용입니다.'
where post_id = 1 and position = 2;

-- 글 삭제 (섹션도 cascade 삭제됨)
delete from public.posts where slug = 'galaxy-s25-ultra-review';
```

---

## 7. 에디터 추천 설정

```sql
-- 추천 글로 설정
update public.posts set featured = true where slug = 'galaxy-s25-ultra-review';

-- 추천 해제
update public.posts set featured = false where slug = 'galaxy-s25-ultra-review';
```

메인 페이지 "에디터 추천" 섹션에는 `featured = true` 인 글만 표시됩니다.
