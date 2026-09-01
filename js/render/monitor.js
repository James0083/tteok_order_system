/* ============================================================
   렌더 : 모니터링 탭 (직원용 PIN)
   ============================================================ */
import { state } from '../state.js';
import { esc, todayStr, fmtDateLong } from '../utils.js';
import { statCard, renderProductionSummary, renderOrderStatusTable } from './shared.js';

export function renderMonitorTab(){
  if (!state.monitor.unlocked){ return renderMonitorPin(); }

  var d = state.monitor.date;
  var isToday = d === todayStr();
  var dateOrders = state.orders.filter(function(o){ return o.deliveryDate === d; });
  var active = dateOrders.filter(function(o){ return o.status !== '취소'; });
  var totalKg = 0;
  active.forEach(function(o){ o.items.forEach(function(i){ totalKg += (i.unit === 'mal' ? i.qty * 10 : i.qty * 5); }); });

  var html = '<div class="wrap-wide">';
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
  html += statCard('총 생산 중량', totalKg.toLocaleString('ko-KR') + 'kg');
  html += '</div>';

  html += '<div class="panel" id="print-area">';
  html += '<h2 style="margin-bottom:10px;">생산분 요약 — ' + esc(fmtDateLong(d)) + '</h2>';
  html += renderProductionSummary(active);
  html += '<h2 style="margin:20px 0 10px;">주문 목록</h2>';
  html += renderOrderStatusTable(dateOrders, false);
  html += '</div>';
  html += '</div>';
  return html;
}

export function renderMonitorPin(){
  var m = state.monitor;
  var html = '<div class="wrap pin-box">';
  html += '<div class="brand-mark" style="margin:0 auto;">떡</div>';
  html += '<h2 style="margin:14px 0 4px;">직원 확인</h2>';
  html += '<p class="muted" style="font-size:13px; margin-bottom:16px;">오늘의 생산분을 확인하려면 직원용 PIN을 입력하세요.</p>';
  html += '<input id="monitor-pin" type="password" inputmode="numeric" placeholder="PIN" value="' + esc(m.pinInput) + '" style="margin-bottom:10px;">';
  if (m.pinError){ html += '<div class="notice notice-error" style="margin-bottom:10px;">' + esc(m.pinError) + '</div>'; }
  html += '<button class="btn btn-primary" data-action="monitor-unlock" style="width:100%;">입장</button>';
  html += '</div>';
  return html;
}
