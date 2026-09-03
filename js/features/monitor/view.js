/* ============================================================
   렌더 : 모니터링 탭 (직원 로그인 필요 — core/app.js 에서 게이트)
   ============================================================ */
import { state } from '../../core/state.js';
import { esc, todayStr, fmtDateLong } from '../../core/utils.js';
import { statCard, renderProductionSummary, renderOrderStatusTable } from '../production/view.js';
import { weightText } from '../production/aggregate.js';
import { renderStaffBar } from '../auth/view.js';

export function renderMonitorTab(){
  var d = state.monitor.date;
  var isToday = d === todayStr();
  var dateOrders = state.orders.filter(function(o){ return o.deliveryDate === d; });
  var active = dateOrders.filter(function(o){ return o.status !== '취소'; });

  var html = '<div class="wrap-wide">';
  html += renderStaffBar();
  html += '<div class="date-nav no-print">';
  html += '<button class="btn btn-outline btn-sm" data-action="monitor-date-prev">◀</button>';
  html += '<input type="date" id="monitor-date" value="' + d + '">';
  html += '<button class="btn btn-outline btn-sm" data-action="monitor-date-next">▶</button>';
  html += '<button class="btn btn-outline btn-sm" data-action="monitor-date-today">오늘</button>';
  html += '<span class="dtitle" style="margin-left:6px;">' + esc(fmtDateLong(d)) + (isToday ? ' (오늘)' : '') + ' 생산분</span>';
  html += '<span style="flex:1;"></span>';
  html += '<button class="btn btn-outline btn-sm" data-action="monitor-refresh">새로고침</button>';
  html += '<button class="btn btn-jade btn-sm" data-action="monitor-print">인쇄</button>';
  html += '</div>';

  html += '<div class="stat-cards">';
  html += statCard('주문 건수', active.length + '건');
  html += statCard('총 생산 중량', weightText(active));
  html += '</div>';

  html += '<div class="panel" id="print-area">';
  html += '<h2 style="margin-bottom:10px;">생산분 요약</h2>';
  html += renderProductionSummary(active);
  html += '<h2 style="margin:20px 0 10px;">주문 목록</h2>';
  html += renderOrderStatusTable(dateOrders, false);
  html += '</div>';
  html += '</div>';
  return html;
}
