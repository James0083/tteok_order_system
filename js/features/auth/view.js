/* ============================================================
   렌더 : 직원 로그인 화면 / 로그인 상태 표시줄
   ============================================================ */
import { state } from '../../core/state.js';
import { esc } from '../../core/utils.js';

export function renderStaffLogin(){
  var a = state.auth;
  var html = '<div class="wrap pin-box">';
  html += '<div class="brand-mark" style="margin:0 auto;">떡</div>';
  html += '<h2 style="margin:14px 0 4px;">직원 로그인</h2>';
  html += '<p class="muted" style="font-size:13px; margin-bottom:16px;">주문조회·모니터링·관리자 화면은 직원 계정으로 로그인해야 볼 수 있어요.</p>';
  html += '<div class="field" style="margin-bottom:10px; text-align:left;"><label>이메일</label>' +
    '<input id="auth-email" type="email" autocomplete="username" placeholder="staff@example.com" value="' + esc(a.emailInput) + '"></div>';
  html += '<div class="field" style="margin-bottom:10px; text-align:left;"><label>비밀번호</label>' +
    '<input id="auth-password" type="password" autocomplete="current-password" value="' + esc(a.passwordInput) + '"></div>';
  if (a.error){ html += '<div class="notice notice-error" style="margin-bottom:10px;">' + esc(a.error) + '</div>'; }
  html += '<button class="btn btn-primary" data-action="staff-login" style="width:100%;" ' + (a.busy ? 'disabled' : '') + '>' + (a.busy ? '로그인 중...' : '로그인') + '</button>';
  html += '</div>';
  return html;
}

export function renderStaffBar(){
  var session = state.auth.session;
  var email = session && session.user ? session.user.email : '';
  return '<div class="staff-bar no-print"><span class="muted">' + esc(email) + ' 로 로그인됨</span>' +
    '<button class="link-btn" data-action="staff-logout">로그아웃</button></div>';
}
