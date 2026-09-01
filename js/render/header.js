/* ============================================================
   렌더 : 상단 헤더 / 탭
   ============================================================ */
import { state } from '../state.js';

export function renderHeader(){
  var tabs = [
    ['order', '주문하기'],
    ['monitor', '모니터링'],
    ['admin', '관리자'],
  ];
  var tabsHtml = tabs.map(function(t){
    return '<button class="tab-btn ' + (state.tab === t[0] ? 'active' : '') + '" data-action="go-tab" data-tab="' + t[0] + '">' + t[1] + '</button>';
  }).join('');
  return (
    '<header class="site-header no-print">' +
      '<div class="brand-row"><div class="brand-mark">떡</div>' +
      '<div class="brand-text"><h1>떡 주문 관리</h1><p>개별 주문 접수 · 생산분 모니터링</p></div></div>' +
      '<nav class="tabs">' + tabsHtml + '</nav>' +
    '</header>'
  );
}
