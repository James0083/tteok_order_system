# 떡 주문 관리 시스템

기존에는 단일 HTML 파일 + Claude 아티팩트 저장소(`window.storage`)를 사용했지만,
이제 **Supabase(관리형 Postgres) 백엔드**를 저장소로 사용하고,
프론트엔드 코드는 **빌드 도구 없는 순수 ES 모듈**로 분리했습니다.

## 폴더 구조

```
index.html            진입 HTML (마크업 + CSS/JS 링크만)
styles.css            전체 스타일
js/
  config.js           기본 상수·시딩용 상품 데이터 (DEFAULT_PRODUCTS, RITUAL_ITEMS, PIN 기본값)
  catalog.js          떡 종류 런타임 조회 헬퍼 (products 테이블 기반, 가나다 정렬)
  utils.js            포맷·escape·전화번호 포맷 등 공용 유틸
  state.js            전역 상태 객체 + 초기화 헬퍼
  pricing.js          가격/추가요금 계산
  env.js              Supabase URL / anon key  ← 직접 채워야 함 (git 제외)
  env.example.js      env.js 템플릿
  supabaseClient.js   supabase-js 클라이언트 생성 (CDN ESM)
  store.js            데이터 접근 계층 (orders / config / stores CRUD)
  orders.js           주문 제출·조회·수정·취소 액션
  admin.js            관리자/모니터링 액션 (PIN, 상태변경, 매장관리)
  events.js           #app 이벤트 위임
  main.js             앱 진입점
  render/
    index.js          렌더 오케스트레이터 (render())
    header.js          헤더/탭
    order.js           주문 탭 + 렌더 후처리
    lookup.js          주문조회·수정 탭
    monitor.js         모니터링 탭
    admin.js           관리자 탭(대시보드/설정)
    shared.js          탭 공용 조각 (생산분 요약, 주문표, 통계)
supabase/
  schema.sql          테이블(orders/config/stores/products) + RLS 정책
```

> 떡 종류는 `products` 테이블에서 관리하며, 처음 실행 시 `DEFAULT_PRODUCTS` 로 자동 시딩됩니다.
> 이후 관리자 설정 → "떡 종류 관리" 에서 추가/삭제할 수 있습니다.

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

> `env.js` 는 공개 저장소에 커밋하지 마세요. (`.gitignore` 에 이미 포함)
> anon 키는 브라우저에 노출되는 공개 키이며, 접근 제어는 `schema.sql` 의 RLS 정책으로 합니다.

### 3. 로컬 실행
ES 모듈은 `file://` 로 열 수 없으므로 정적 서버가 필요합니다.

```bash
# 아무거나 하나
npx serve .
python3 -m http.server 5173
```

그다음 브라우저에서 `http://localhost:5173` (또는 serve 가 안내한 주소) 접속.

### 4. 배포 (GitHub Pages)

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

### ⚠️ 공개 배포 전 반드시 확인

현재 `supabase/schema.sql` 의 RLS 는 **누구나 모든 테이블 읽기/쓰기** 허용입니다.
사이트 주소만 알면 주문 열람·삭제, PIN 변경이 가능합니다 (PIN 검사는 브라우저에서만).
실제 고객에게 오픈하기 전에 최소한 다음을 적용하세요:

- 쓰기는 `orders` insert 만 허용, `update/delete` 와 `config` 는 차단
- 관리자·주문조회 화면은 Supabase Auth(이메일 로그인) 뒤로 이동
- 또는 관리 기능을 별도 비공개 배포로 분리

## 기본 PIN
- 관리자: `0207`
- 직원(모니터링): `1111`

관리자 화면 → 설정에서 변경할 수 있고, 변경값은 `config` 테이블에 저장됩니다.

## 보안 참고
PIN 검증은 클라이언트에서만 이뤄지고 anon 키로 모든 테이블에 접근할 수 있는 데모 수준입니다.
실제 매장 운영에 쓰려면 `supabase/schema.sql` 하단 주석의 강화 방안을 검토하세요.
