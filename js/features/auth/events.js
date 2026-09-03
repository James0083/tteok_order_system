/* ============================================================
   직원 로그인 이벤트
   ============================================================ */
import { state } from '../../core/state.js';
import { staffLogin, staffLogout } from './actions.js';

export function handleClick(btn){
  switch (btn.getAttribute('data-action')){
    case 'staff-login': { staffLogin(); return true; }
    case 'staff-logout': { staffLogout(); return true; }
  }
  return false;
}

export function handleInput(t){
  if (t.id === 'auth-email'){ state.auth.emailInput = t.value; return true; }
  if (t.id === 'auth-password'){ state.auth.passwordInput = t.value; return true; }
  return false;
}

export function handleKeydown(e){
  if (e.key === 'Enter' && e.target && (e.target.id === 'auth-email' || e.target.id === 'auth-password')){
    staffLogin();
    return true;
  }
  return false;
}
