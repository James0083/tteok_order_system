/* ============================================================
   렌더 : 최상위 오케스트레이터
   ============================================================ */
import { state } from '../state.js';
import { renderHeader } from './header.js';
import { renderOrderTab, afterOrderRender } from './order.js';
import { renderLookupTab } from './lookup.js';
import { renderMonitorTab } from './monitor.js';
import { renderAdminTab } from './admin.js';

function renderTabContent(){
  if (state.tab === 'order') return renderOrderTab();
  if (state.tab === 'lookup') return renderLookupTab();
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
