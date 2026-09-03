/* ============================================================
   렌더 : 인쇄 전용 문서 (생산분 요약 / 주문 목록을 각각 별도 페이지로)
   ------------------------------------------------------------
   화면 캡처 대신 목록 형태의 인쇄물을 만든다.
   본문 14pt, 상단 날짜 제목 17pt ('_월_일(요일)' 형식).
   ============================================================ */
import { esc, fmtWon, shortId, receiveMethodLabel, orderItemsSummary } from '../utils.js';
import { aggregateProduction, productionQtyText, productionCutNote } from './shared.js';

/* '2026-09-03' -> '9월 3일(수)' */
function printDateTitle(dateStr){
  var p = dateStr.split('-').map(Number);
  var dt = new Date(p[0], p[1] - 1, p[2]);
  var days = ['일', '월', '화', '수', '목', '금', '토'];
  return p[1] + '월 ' + p[2] + '일(' + days[dt.getDay()] + ')';
}

function pageHead(dateStr, sub){
  return '<div class="p-date">' + esc(printDateTitle(dateStr)) + '</div>' +
    '<div class="p-sub">' + esc(sub) + '</div>';
}

/* ---------- 1페이지 : 생산분 요약 ---------- */
function summaryPage(dateStr, activeOrders){
  var agg = aggregateProduction(activeOrders);
  var html = '<section class="print-page">';
  html += pageHead(dateStr, '생산분 요약');

  if (!agg.items.length && !agg.rituals.length){
    html += '<p class="p-empty">이 날짜에 접수된 떡 주문이 없습니다.</p>';
    html += '</section>';
    return html;
  }

  if (agg.items.length){
    html += '<table><thead><tr><th class="num">No</th><th>품목</th><th>수량 (중량)</th><th>비고</th></tr></thead><tbody>';
    html += agg.items.map(function(t, i){
      return '<tr><td class="num">' + (i + 1) + '</td><td>' + esc(t.name) + '</td>' +
        '<td>' + esc(productionQtyText(t)) + '</td>' +
        '<td>' + esc(productionCutNote(t)) + '</td></tr>';
    }).join('');
    html += '</tbody></table>';
  }

  if (agg.rituals.length){
    var start = agg.items.length;
    html += '<h3 class="p-h3">제사용 편</h3>';
    html += '<table><thead><tr><th class="num">No</th><th>품목</th><th>세트</th><th>쪽수</th></tr></thead><tbody>';
    html += agg.rituals.map(function(t, i){
      return '<tr><td class="num">' + (start + i + 1) + '</td><td>' + esc(t.name) + '</td>' +
        '<td>' + t.sets + '세트</td><td>' + (t.sets * 3) + '쪽</td></tr>';
    }).join('');
    html += '</tbody></table>';
  }

  if (agg.surchargeCount > 0){
    html += '<p class="p-note">절편·바람떡·쑥개떡 단독 추가요금 적용 주문 ' + agg.surchargeCount + '건 포함</p>';
  }

  html += '</section>';
  return html;
}

/* ---------- 2페이지 : 주문 목록 ---------- */
function ordersPage(dateStr, orders, showAmount){
  var html = '<section class="print-page">';
  html += pageHead(dateStr, '주문 목록 (' + orders.length + '건)');

  if (!orders.length){
    html += '<p class="p-empty">이 날짜에 접수된 주문이 없습니다.</p>';
    html += '</section>';
    return html;
  }

  html += '<table><thead><tr>' +
    '<th class="num">No</th><th>번호</th><th>연락처</th><th>수령 방법</th><th>주문 내역</th>' +
    (showAmount ? '<th>금액</th>' : '') +
    '<th>상태</th></tr></thead><tbody>';

  html += orders.map(function(o, i){
    var detail = esc(orderItemsSummary(o));
    if (o.memo){ detail += '\n메모: ' + esc(o.memo); }
    return '<tr>' +
      '<td class="num">' + (i + 1) + '</td>' +
      '<td>#' + esc(shortId(o.id)) + '</td>' +
      '<td>' + esc(o.phone || '연락처 없음') + '</td>' +
      '<td>' + esc(receiveMethodLabel(o)) + (o.inStore ? ' · 매장접수' : '') + '</td>' +
      '<td class="p-items">' + detail + '</td>' +
      (showAmount ? '<td>' + esc(fmtWon(o.total)) + '</td>' : '') +
      '<td>' + esc(o.status) + '</td>' +
    '</tr>';
  }).join('');

  html += '</tbody></table></section>';
  return html;
}

var afterPrintBound = false;

/* 인쇄 실행 : opts = { date, orders, mode: 'monitor' | 'admin' } */
export function printProductionSheets(opts){
  var all = opts.orders.slice().sort(function(a, b){
    return String(a.createdAt || a.id).localeCompare(String(b.createdAt || b.id));
  });
  var active = all.filter(function(o){ return o.status !== '취소'; });
  var showAmount = opts.mode === 'admin';

  var host = document.getElementById('print-doc');
  if (!host){
    host = document.createElement('div');
    host.id = 'print-doc';
    document.body.appendChild(host);
  }
  host.innerHTML = summaryPage(opts.date, active) + ordersPage(opts.date, all, showAmount);

  if (!afterPrintBound){
    afterPrintBound = true;
    window.addEventListener('afterprint', function(){
      document.body.classList.remove('print-sheets');
      var h = document.getElementById('print-doc');
      if (h){ h.innerHTML = ''; }
    });
  }

  document.body.classList.add('print-sheets');
  window.print();
}
