/* ============================================================
   렌더 : 최상위 오케스트레이터
   ============================================================ */
import { state, isStaff } from '../state.js';
import { renderHeader } from './header.js';
import { renderOrderTab, afterOrderRender } from './order.js';
import { renderMonitorTab } from './monitor.js';
import { renderAdminTab } from './admin.js';
import { renderStaffLogin } from './auth.js';

var STAFF_ONLY_TABS = ['monitor', 'admin'];

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
}
