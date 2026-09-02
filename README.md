# 떡 주문 관리 시스템

기존에는 단일 HTML 파일 + Claude 아티팩트 저장소(`window.storage`)를 사용했지만,
이제 **Supabase(관리형 Postgres) 백엔드**를 저장소로 사용하고,
프론트엔드 코드는 **빌드 도구 없는 순수 ES 모듈**로 분리했습니다.

## 폴더 구조

```
index.html            진입 HTML (마크업 + CSS/JS 링크만)
styles.css            전체 스타일
js/
  config.js           기본 상수·시딩용 상품 데이터 (DEFAULT_PRODUCTS, RITUAL_ITEMS)
  catalog.js          떡 종류 런타임 조회 헬퍼 (products 테이블 기반, 가나다 정렬)
  utils.js            포맷·escape·전화번호 포맷 등 공용 유틸
  state.js            전역 상태 객체 + 초기화 헬퍼
  pricing.js          가격/추가요금 계산
  env.js              Supabase URL / anon key  ← 직접 채워야 함
  env.example.js      env.js 템플릿
  supabaseClient.js   supabase-js 클라이언트 생성 (CDN ESM)
  auth.js             직원 로그인 (Supabase Auth: signIn/signOut/세션 구독)
  store.js            데이터 접근 계층 (orders / stores / products CRUD)
  orders.js           주문 제출·검색·수정·취소 액션
  admin.js            직원 로그인 액션 + 관리자 액션(상태변경, 매장·떡 관리)
  events.js           #app 이벤트 위임
  main.js             앱 진입점 (세션 로드, 로그인 상태 구독)
  render/
    index.js          렌더 오케스트레이터 (render()) — 직원 전용 탭 게이트
    header.js          헤더/탭
    order.js           주문 탭 + 렌더 후처리
    monitor.js         모니터링 탭 (직원 전용)
    admin.js           관리자 탭 — 대시보드/연락처검색/설정 (직원 전용)
    auth.js             직원 로그인 화면 + 로그인 상태 표시줄
    shared.js          탭 공용 조각 (생산분 요약, 주문표, 주문카드, 통계)
supabase/
  schema.sql          테이블(orders/stores/products) + RLS 정책
  products.csv        떡 종류 전체 목록 (Supabase Table Editor 에서 CSV import 용)
  stores.csv          매장 목록 (CSV import 용)
  stores_seed.sql     매장 목록 (SQL Editor 로 넣는 대안)
```

> 떡 종류는 `products` 테이블에서 관리합니다. 관리자 설정 → "떡 종류 관리" 에서
> 이름·가격(1말/½말/**1kg**/**개당**)·쪽수선택·추가요금 여부를 추가·수정·삭제할 수 있습니다.
> 목록을 통째로 갈아끼우려면 `supabase/products.csv` 를 Table Editor 로 import 하세요.
>
> **주문 단위**: 1말(10kg) · 1/2말(5kg) · 1kg · 낱개(개당). `1kg 가격`은 비워두면
> `1/2말가÷5`(없으면 `1말가÷10`)로 자동 계산됩니다. `개당 가격`이 0이면 낱개 주문 불가.
> 여러 종류를 kg 단위로 나눠 담으면 "약식 1.5kg + 쑥개떡 1.5kg" 같은 복합 주문이 됩니다.

## 설정 순서

### 1. Supabase 프로젝트 만들기
1. https://supabase.com 에서 프로젝트 생성
2. **SQL Editor** 에 `supabase/schema.sql` 내용을 붙여넣고 실행
3. **Project Settings → API** 에서 `Project URL` 과 `anon public` 키 복사

### 2. 접속 정보 입력
`js/env.js` 를 열어 값을 채웁니다:

```js
export const SUPABASE_URL = 'https://xxxxxxxx.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGci...';
```

> anon 키는 브라우저에 노출되는 공개 키이며, 실제 접근 제어는 `schema.sql` 의 RLS 정책 +
> 아래 직원 계정(Supabase Auth)이 담당합니다.

### 3. 직원 계정 만들기
모니터링·관리자 화면은 로그인해야 보입니다. 앱에는 회원가입 화면이 없으므로
계정은 Supabase 대시보드에서 직접 만듭니다.

1. 대시보드 → **Authentication → Users → Add user**
2. 이메일/비밀번호 입력, **Auto Confirm User** 체크 (이메일 인증 없이 바로 로그인 가능하게)
3. 직원마다 하나씩 만들거나, 매장 공용 계정 하나만 만들어도 됩니다 (권한 차등은 없음 — 로그인하면 전부 접근 가능)

> **Authentication → Providers → Email → "Allow new users to sign up"** 은 꺼두는 걸 권장합니다.
> (이 앱은 로그인 폼만 있고 가입 폼은 없지만, API로 직접 가입을 시도하는 걸 막아줍니다.)

### 4. 로컬 실행
ES 모듈은 `file://` 로 열 수 없으므로 정적 서버가 필요합니다.

```bash
# 아무거나 하나
npx serve .
python3 -m http.server 5173
```

그다음 브라우저에서 `http://localhost:5173` (또는 serve 가 안내한 주소) 접속.

### 5. 배포 (GitHub Pages)

정적 파일만 있으므로 빌드 없이 배포됩니다. 모든 경로가 상대경로(`./js/…`)라
`username.github.io/repo/` 같은 하위 경로에서도 그대로 동작합니다.

1. **env.js 를 커밋에 포함**
   `.gitignore` 의 `js/env.js` 줄은 주석 처리되어 있어야 합니다. anon 키는 공개용,
   DB 비밀번호는 이 파일에 없습니다. (접근 제어는 RLS 담당)

2. **저장소 만들고 푸시**
   ```bash
   cd "이 폴더"
   git init
   git add .
   git commit -m "떡 주문 관리 시스템"
   gh repo create tteok-order-system --public --source=. --push
   # gh 가 없으면 github.com 에서 repo 만들고
   #   git remote add origin https://github.com/<id>/<repo>.git
   #   git branch -M main && git push -u origin main
   ```

3. **Pages 켜기**
   저장소 → Settings → Pages → Build and deployment
   - Source: **Deploy from a branch**
   - Branch: **main** / 폴더 **/(root)** → Save
   - 1~2분 뒤 `https://<id>.github.io/<repo>/` 로 접속

4. **이후 업데이트**: `git push` 하면 자동 재배포.

> 무료 플랜은 **public 저장소**에서만 Pages 가 동작합니다. 즉 소스코드와 anon 키가
> 전부 공개됩니다. (Supabase 설계상 anon 키 공개 자체는 정상)

**키를 저장소에 넣기 싫다면** — `.gitignore` 의 `js/env.js` 주석을 풀고,
`.github/workflows/deploy.yml` 에서 저장소 Secrets(`SUPABASE_URL`, `SUPABASE_ANON_KEY`)로
`js/env.js` 를 만든 뒤 `actions/deploy-pages` 로 배포하세요. (단, 키는 결국 브라우저로
전송되므로 "git 이력에 안 남는다"는 효과뿐입니다.)

## 화면 구성
- **주문하기** (공개): 고객이 새 주문 접수. 로그인 불필요.
- **모니터링** (직원): 날짜별 생산분 요약·주문 목록.
- **관리자** (직원): 날짜별 대시보드 + **연락처 검색**(전 기간, 날짜 무관하게 주문 카드로 조회·수정·취소) + 설정(매장·떡 종류).

## 직원 로그인
- PIN 방식은 폐지되었습니다. 모니터링·관리자 탭은 **Supabase Auth 이메일 로그인**으로 보호됩니다.
- 계정은 앱이 아니라 Supabase 대시보드 → Authentication → Users 에서 만듭니다. (위 "3. 직원 계정 만들기" 참고)
- 권한 차등은 없습니다 — 로그인한 사람은 두 탭 모두, 모든 조작이 가능합니다.
- 로그아웃은 각 탭 우측 상단 "로그아웃" 버튼.

## 보안 참고
- **고객(비로그인)**: 새 주문 등록만 가능. 기존 주문 조회·수정·삭제, 매장/떡 목록 수정은 불가.
- **직원(로그인)**: 주문 조회·수정·삭제, 매장/떡 목록 관리 가능.
- 실제 접근 제어는 anon 키가 아니라 `supabase/schema.sql` 의 RLS 정책(`auth.role() = 'authenticated'`)이 합니다 — REST API를 직접 두드려도 우회할 수 없습니다.
- 기존 프로젝트에서 이 버전으로 올릴 때는 **`supabase/schema.sql`을 다시 실행**해서 RLS를 갱신하세요. 실행 전까지는 예전처럼 "누구나 읽기/쓰기" 상태입니다.
- 예전 PIN 저장용 `config` 테이블은 schema.sql 재실행 시 `drop table` 로 자동 정리됩니다.
