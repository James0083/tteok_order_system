/* ============================================================
   렌더 : 인쇄 전용 문서 (생산분 요약 / 주문 목록을 각각 별도 페이지로)
   ------------------------------------------------------------
   화면 캡처 대신 목록 형태의 인쇄물을 만든다.
   본문 14pt, 상단 날짜 제목 17pt ('_월_일(요일)' 형식).
   품목은 품목별 한 줄, 주문은 주문건별 한 줄로 출력한다.
   ============================================================ */
import { esc, fmtWon, shortId, receiveMethodLabel, lineQtyText } from '../utils.js';
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

function line(no, text){
  return '<div class="p-line"><span class="p-no">' + no + '.</span> ' + text + '</div>';
}

/* 주문 1건의 품목/제사 편을 한 줄 문자열로 */
function orderItemsInline(o){
  var parts = [];
  o.items.forEach(function(i){
    parts.push(esc(i.name + ' ' + lineQtyText(i) + (i.cut ? (' (' + i.cut + ')') : '')));
  });
  o.ritual.forEach(function(r){ parts.push(esc(r.name + ' ' + r.sets + '세트')); });
  return parts.join(' / ');
}

/* ---------- 1페이지 : 생산분 요약 ---------- */
function summaryPage(dateStr, activeOrders){
  var agg = aggregateProduction(activeOrders);
  var html = '<section class="print-page">';
  html += pageHead(dateStr, '생산분 요약');

  if (!agg.items.length && !agg.rituals.length){
    html += '<p class="p-empty">이 날짜에 접수된 떡 주문이 없습니다.</p></section>';
    return html;
  }

  agg.items.forEach(function(t, i){
    var note = productionCutNote(t);
    html += line(i + 1, '<strong>' + esc(t.name) + '</strong> — ' + esc(productionQtyText(t)) +
      (note ? ('  [' + esc(note) + ']') : ''));
  });

  if (agg.rituals.length){
    html += '<h3 class="p-h3">제사용 편</h3>';
    var start = agg.items.length;
    agg.rituals.forEach(function(t, i){
      html += line(start + i + 1, '<strong>' + esc(t.name) + '</strong> — ' + t.sets + '세트 (' + (t.sets * 3) + '쪽)');
    });
  }

  html += '</section>';
  return html;
}

/* ---------- 2페이지 : 주문 목록 ---------- */
function ordersPage(dateStr, orders, showAmount){
  var html = '<section class="print-page">';
  html += pageHead(dateStr, '주문 목록 (' + orders.length + '건)');

  if (!orders.length){
    html += '<p class="p-empty">이 날짜에 접수된 주문이 없습니다.</p></section>';
    return html;
  }

  orders.forEach(function(o, i){
    var head = [
      '#' + esc(shortId(o.id)),
      esc(o.phone || '연락처 없음'),
      esc(receiveMethodLabel(o)) + (o.inStore ? ' · 매장접수' : ''),
    ];
    if (showAmount){ head.push(esc(fmtWon(o.total))); }
    var body = '<span class="p-head">' + head.join(' · ') + '</span>' +
      '<span class="p-detail"> — ' + orderItemsInline(o) + '</span>' +
      (o.memo ? ('<span class="p-memo"> · 메모: ' + esc(o.memo) + '</span>') : '');
    html += line(i + 1, body);
  });

  html += '</section>';
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
  host.innerHTML = summaryPage(opts.date, active) + ordersPage(opts.date, active, showAmount);

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
