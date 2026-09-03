/* ============================================================
   직원 로그인 / 로그아웃 액션
   ------------------------------------------------------------
   세션 변화는 auth/data.js 의 onAuthChange 구독(main.js)이
   감지해 state.auth.session 을 채우고 다시 render() 합니다.
   ============================================================ */
import { state } from '../../core/state.js';
import { render } from '../../core/app.js';
import { signIn, signOut } from './data.js';

export async function staffLogin(){
  var a = state.auth;
  if (!a.emailInput || !a.passwordInput){
    a.error = '이메일과 비밀번호를 입력해주세요.';
    render();
    return;
  }
  a.busy = true; a.error = '';
  render();
  var result = await signIn(a.emailInput, a.passwordInput);
  a.busy = false;
  if (result.error){
    a.error = '로그인에 실패했습니다: ' + result.error;
    render();
    return;
  }
  a.passwordInput = '';
  a.error = '';
}

export async function staffLogout(){
  await signOut();
  state.tab = 'order';
}
