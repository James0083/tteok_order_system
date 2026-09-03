/* ============================================================
   앱 셸 : 상단 헤더 + 탭 + 최상위 렌더 오케스트레이터
   ============================================================ */
import { state, isStaff } from './state.js';
import { renderOrderTab, afterOrderRender } from '../features/order/view.js';
import { renderMonitorTab } from '../features/monitor/view.js';
import { renderAdminTab, afterAdminRender } from '../features/admin/view.js';
import { renderStaffLogin } from '../features/auth/view.js';

var STAFF_ONLY_TABS = ['monitor', 'admin'];

function renderHeader(){
  var tabs = [
    ['order', '주문하기'],
    ['monitor', '모니터링'],
    ['admin', '관리자'],
  ];
  var tabsHtml = tabs.map(function(t){
    var on = state.tab === t[0];
    return '<button class="tab-btn ' + (on ? 'active' : '') + '"' + (on ? ' aria-current="page"' : '') +
      ' data-action="go-tab" data-tab="' + t[0] + '">' + t[1] + '</button>';
  }).join('');
  return (
    '<header class="site-header no-print">' +
      '<div class="brand-row"><div class="brand-mark">떡</div>' +
      '<div class="brand-text"><h1>떡 주문 관리</h1><p>개별 주문 접수 · 생산분 모니터링</p></div></div>' +
      '<nav class="tabs">' + tabsHtml + '</nav>' +
    '</header>'
  );
}

function renderTabContent(){
  if (STAFF_ONLY_TABS.indexOf(state.tab) > -1 && !isStaff()){
    return renderStaffLogin();
  }
  if (state.tab === 'order') return renderOrderTab();
  if (state.tab === 'monitor') return renderMonitorTab();
  if (state.tab === 'admin') return renderAdminTab();
  return '';
}

export function render(){
  var app = document.getElementById('app');
  app.innerHTML = renderHeader() + '<main>' + renderTabContent() + '</main>';
  afterRender();
}

function afterRender(){
  if (state.tab === 'order' && !state.confirmation){
    afterOrderRender();
  }
  if (state.tab === 'admin' && isStaff()){
    afterAdminRender();
  }
}
