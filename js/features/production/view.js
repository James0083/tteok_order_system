/* ============================================================
   생산분 렌더링 조각 (모니터링 화면 · 관리자 화면 공용)
   ------------------------------------------------------------
   생산분 요약 표 / 주문 목록 표 / 통계 카드.
   ============================================================ */
import { state } from '../../core/state.js';
import { esc, fmtWon, formatMal, shortId, receiveMethodLabel, orderItemsSummary } from '../../core/utils.js';
import { aggregateProduction } from './aggregate.js';

export function statCard(label, value){
  return '<div class="stat-card"><div class="slbl">' + esc(label) + '</div><div class="sval tabular">' + value + '</div></div>';
}

/* ---------- 생산분 요약 (말/1·2말을 합산 표기, 금액 없음) ---------- */
export function renderProductionSummary(orders){
  var agg = aggregateProduction(orders);
  var summaryItems = agg.items;
  var rows = summaryItems.map(function(t, idx){
    var kg = Math.round(t.malEq * 10 * 10) / 10;
    var qtyParts = [];
    if (kg > 0){ qtyParts.push(kg + 'kg (' + formatMal(t.malEq) + ')'); }
    if (t.pieces > 0){ qtyParts.push('낱개 ' + t.pieces + '개'); }
    var cutNote = Object.keys(t.cuts).length ? Object.keys(t.cuts).map(function(k){ return k + ' x' + t.cuts[k]; }).join(', ') : '';
    return '<tr><td class="num">' + (idx + 1) + '</td><td>' + esc(t.name) + (cutNote ? ('<br><small class="muted">' + esc(cutNote) + '</small>') : '') + '</td>' +
      '<td class="num tabular">' + (qtyParts.join(' + ') || '-') + '</td></tr>';
  }).join('');

  var out = '';
  if (!rows){
    out += '<div class="empty-state">이 날짜에 접수된 떡 주문이 없습니다.</div>';
  } else {
    out += '<div class="table-scroll fit"><table class="dtab dtab-auto">';
    out += '<thead><tr><th class="num">No</th><th>품목</th><th class="num">수량 (중량)</th></tr></thead>';
    out += '<tbody>' + rows + '</tbody></table></div>';
  }

  if (agg.rituals.length){
    var ritualStart = summaryItems.length;
    var rRows = agg.rituals.map(function(t, idx){
      return '<tr><td class="num">' + (ritualStart + idx + 1) + '</td><td>' + esc(t.name) + '</td><td class="num tabular">' + t.sets + '세트</td><td class="num tabular">' + (t.sets * 3) + '쪽</td></tr>';
    }).join('');
    out += '<h3 style="font-size:13.5px; margin:14px 0 6px;">제사용 편</h3>';
    out += '<div class="table-scroll fit"><table class="dtab dtab-auto"><thead><tr><th class="num">No</th><th>품목</th><th class="num">세트</th><th class="num">쪽수</th></tr></thead><tbody>' + rRows + '</tbody></table></div>';
  }

  var surchargeCount = agg.surchargeCount;
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
