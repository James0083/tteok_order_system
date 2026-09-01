/* ============================================================
   Supabase 접속 정보 (예시 파일)
   ------------------------------------------------------------
   1. 이 파일을 같은 폴더에 `env.js` 로 복사하세요.
   2. Supabase 대시보드 → Project Settings → API 에서
      Project URL 과 anon public key 를 복사해 아래에 붙여넣으세요.
   3. env.js 는 공개 저장소에 커밋하지 마세요. (.gitignore 권장)

   anon key 는 브라우저에 노출되어도 되는 공개 키입니다.
   실제 접근 제어는 Supabase RLS 정책으로 관리합니다.
   (supabase/schema.sql 참고)
   ============================================================ */
export const SUPABASE_URL = 'https://YOUR-PROJECT-ref.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR-ANON-PUBLIC-KEY';
