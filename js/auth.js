/* ============================================================
   직원 로그인 (Supabase Auth)
   ------------------------------------------------------------
   주문조회·수정 / 모니터링 / 관리자 탭은 여기서 발급되는 세션이
   있어야 데이터를 볼 수 있습니다 (실제 접근 제어는 DB의 RLS 정책 —
   supabase/schema.sql — 이 authenticated role 만 허용).
   직원 계정은 Supabase 대시보드 → Authentication → Users 에서
   직접 만듭니다 (앱에는 회원가입 화면이 없습니다).
   ============================================================ */
import { supabase } from './supabaseClient.js';

export async function getSession(){
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error){ console.error('getSession', error); return null; }
  return data.session;
}

export async function signIn(email, password){
  if (!supabase) return { error: '백엔드(Supabase)가 설정되지 않았습니다.' };
  const { error } = await supabase.auth.signInWithPassword({ email: email, password: password });
  return { error: error ? error.message : null };
}

export async function signOut(){
  if (!supabase) return;
  await supabase.auth.signOut();
}

/* 로그인/로그아웃/토큰 갱신 시 콜백 호출. 구독 해제 함수를 반환합니다. */
export function onAuthChange(cb){
  if (!supabase) return function(){};
  const { data } = supabase.auth.onAuthStateChange(function(_event, session){ cb(session); });
  return function(){ data.subscription.unsubscribe(); };
}
