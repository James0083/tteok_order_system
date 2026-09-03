/* ============================================================
   Supabase 클라이언트
   ------------------------------------------------------------
   빌드 도구 없이 CDN(ESM)에서 supabase-js 를 불러옵니다.
   env.js 값이 채워지지 않았으면 CDN 조차 받아오지 않고
   앱은 "저장 불가" 상태로만 동작합니다. (각 feature 의 data.js 에서 방어)
   ============================================================ */
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env.js';

export const isConfigured =
  !!SUPABASE_URL &&
  !!SUPABASE_ANON_KEY &&
  SUPABASE_URL.indexOf('YOUR-PROJECT') === -1 &&
  SUPABASE_ANON_KEY.indexOf('YOUR-ANON') === -1;

let client = null;

if (isConfigured){
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err){
    console.error('[tteok] supabase-js 로드 실패 (네트워크 확인)', err);
  }
} else {
  console.warn(
    '[tteok] Supabase 접속 정보가 설정되지 않았습니다. js/env.js 를 확인하세요.\n' +
    '설정 전까지는 주문이 저장되지 않습니다.'
  );
}

export const supabase = client;
