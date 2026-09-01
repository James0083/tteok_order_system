/* ============================================================
   렌더 : 여러 탭에서 공유하는 조각
   ============================================================ */
import { state } from '../state.js';
import { CONTACT } from '../config.js';
import { esc, fmtWon, formatMal, shortId, receiveMethodLabel, orderItemsSummary } from '../utils.js';
import { findProduct } from '../catalog.js';

export function renderContactFooter(){
  return '<footer class="contact-foot no-print">주문 관련 문의는 3일 전 미리 연락 부탁드립니다.<br>' +
    '전화/문자 (' + CONTACT.hours + ') ' + CONTACT.phone1 + ', ' + CONTACT.phone2 + '</footer>';
}

export function statCard(label, value){
  return '<div class="stat-card"><div class="slbl">' + esc(label) + '</div><div class="sval tabular">' + value + '</div></div>';
}

/* ---------- 생산분 요약 (말/1·2말을 합산 표기, 금액 없음) ---------- */
export function renderProductionSummary(orders){
  var totals = {};
  orders.forEach(function(o){
    o.items.forEach(function(i){
      if (!totals[i.productId]){
        var p = findProduct(i.productId);
        totals[i.productId] = { name: (p && p.name) || i.name || ('#' + i.productId), malEq:0, cuts:{} };
      }
      var eq = i.unit === 'mal' ? i.qty : i.qty * 0.5;
      totals[i.productId].malEq += eq;
      if (i.cut){ totals[i.productId].cuts[i.cut] = (totals[i.productId].cuts[i.cut] || 0) + 1; }
    });
  });
  var summaryItems = Object.keys(totals).map(function(k){ return totals[k]; })
    .sort(function(a, b){ return a.name.localeCompare(b.name, 'ko'); });
  var rows = summaryItems.map(function(t, idx){
    var kg = Math.round(t.malEq * 10 * 10) / 10;
    var cutNote = Object.keys(t.cuts).length ? Object.keys(t.cuts).map(function(k){ return k + ' x' + t.cuts[k]; }).join(', ') : '';
    return '<tr><td class="num">' + (idx + 1) + '</td><td>' + esc(t.name) + (cutNote ? ('<br><small class="muted">' + esc(cutNote) + '</small>') : '') + '</td>' +
      '<td class="num tabular">' + kg + 'kg (' + formatMal(t.malEq) + ')</td></tr>';
  }).join('');

  var out = '';
  if (!rows){
    out += '<div class="empty-state">이 날짜에 접수된 떡 주문이 없습니다.</div>';
  } else {
    out += '<div class="table-scroll fit"><table class="dtab dtab-auto">';
    out += '<thead><tr><th class="num">No</th><th>품목</th><th class="num">수량 (중량)</th></tr></thead>';
    out += '<tbody>' + rows + '</tbody></table></div>';
  }

  var ritualTotals = {};
  orders.forEach(function(o){
    o.ritual.forEach(function(r){
      if (!ritualTotals[r.id]) ritualTotals[r.id] = { sets:0, name:r.name };
      ritualTotals[r.id].sets += r.sets;
    });
  });
  var ritualKeys = Object.keys(ritualTotals);
  if (ritualKeys.length){
    var ritualStart = summaryItems.length;
    var rRows = ritualKeys.map(function(k, idx){
      var t = ritualTotals[k];
      return '<tr><td class="num">' + (ritualStart + idx + 1) + '</td><td>' + esc(t.name) + '</td><td class="num tabular">' + t.sets + '세트</td><td class="num tabular">' + (t.sets * 3) + '쪽</td></tr>';
    }).join('');
    out += '<h3 style="font-size:13.5px; margin:14px 0 6px;">제사용 편</h3>';
    out += '<div class="table-scroll fit"><table class="dtab dtab-auto"><thead><tr><th class="num">No</th><th>품목</th><th class="num">세트</th><th class="num">쪽수</th></tr></thead><tbody>' + rRows + '</tbody></table></div>';
  }

  var surchargeCount = orders.filter(function(o){ return o.surchargeApplies; }).length;
  if (surchargeCount > 0){
    out += '<div class="notice notice-warn" style="margin-top:10px;">절편·바람떡·쑥개떡 단독 추가요금 적용 주문 ' + surchargeCount + '건 포함</div>';
  }
  return out;
}

/* ---------- 주문 목록 (관리자: 수정/삭제 가능, 모니터링: 상태만) ---------- */
export function renderOrderStatusTable(orders, adminMode){
  if (!orders.length){ return '<div class="empty-state">이 날짜에 접수된 주문이 없습니다.</div>'; }
  var rows = orders.map(function(o){
    var statusOptions = ['접수', '생산중', '완료', '취소'].map(function(s){
      return '<option value="' + s + '" ' + (o.status === s ? 'selected' : '') + '>' + s + '</option>';
    }).join('');
    var actionsCell = '';
    if (adminMode){
      var confirming = state.admin.deleteConfirmId === o.id;
      if (confirming){
        actionsCell = '<span style="font-size:12px;">정말 삭제할까요? </span>' +
          '<button class="btn btn-danger btn-sm no-print" data-action="admin-delete-confirm" data-id="' + o.id + '">삭제 확정</button> ' +
          '<button class="btn btn-outline btn-sm no-print" data-action="admin-delete-cancel">취소</button>';
      } else {
        actionsCell = '<button class="btn btn-outline btn-sm no-print" data-action="edit-order" data-id="' + o.id + '" data-return="admin">수정</button> ' +
          '<button class="btn btn-danger btn-sm no-print" data-action="admin-delete" data-id="' + o.id + '">삭제</button>';
      }
    }
    return '<tr>' +
      '<td class="muted">#' + esc(shortId(o.id)) + '</td>' +
      '<td>' + (o.phone ? esc(o.phone) : '<span class="muted">연락처 없음</span>') + '<br><span class="muted" style="font-size:11.5px;">' + esc(receiveMethodLabel(o)) + (o.inStore ? ' · 매장접수' : '') + '</span></td>' +
      '<td style="max-width:280px; white-space:pre-line;">' + esc(orderItemsSummary(o)) + (o.memo ? ('<br><span class="muted" style="font-size:11.5px;">메모: ' + esc(o.memo) + '</span>') : '') + '</td>' +
      (adminMode ? '<td class="num tabular">' + fmtWon(o.total) + '</td>' : '') +
      '<td><select class="status-select" data-action-select="status" data-id="' + o.id + '">' + statusOptions + '</select></td>' +
      (adminMode ? '<td>' + actionsCell + '</td>' : '') +
    '</tr>';
  }).join('');
  var head = '<tr><th>번호</th><th>연락처/수령</th><th>주문 내역</th>' + (adminMode ? '<th class="num">금액</th>' : '') + '<th>상태</th>' + (adminMode ? '<th class="no-print">관리</th>' : '') + '</tr>';
  return '<div class="table-scroll"><table class="dtab"><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div>';
}

export function renderTrend(){
  var byDate = {};
  state.orders.forEach(function(o){
    if (o.status === '취소') return;
    if (!byDate[o.deliveryDate]) byDate[o.deliveryDate] = { count:0, revenue:0 };
    byDate[o.deliveryDate].count++;
    byDate[o.deliveryDate].revenue += o.total;
  });
  var dates = Object.keys(byDate).sort().reverse().slice(0, 14);
  if (!dates.length){ return '<div class="empty-state">아직 통계를 표시할 주문 데이터가 없습니다.</div>'; }
  var max = Math.max.apply(null, dates.map(function(d){ return byDate[d].revenue; }));
  return dates.map(function(d){
    var t = byDate[d];
    var pct = max > 0 ? Math.round(t.revenue / max * 100) : 0;
    return '<div class="trend-row">' +
      '<div class="trend-date">' + d + '</div>' +
      '<div class="trend-bar-track"><div class="trend-bar-fill" style="width:' + pct + '%;"></div></div>' +
      '<div class="trend-val tabular">' + t.count + '건 · ' + fmtWon(t.revenue) + '</div>' +
    '</div>';
  }).join('');
}
