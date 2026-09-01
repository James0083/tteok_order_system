/* ============================================================
   렌더 : 주문조회·수정 탭
   ============================================================ */
import { state } from '../state.js';
import { esc, fmtWon, fmtDateLong, shortId, receiveMethodLabel, orderItemsSummary } from '../utils.js';

export function renderLookupTab(){
  var l = state.lookup;
  var html = '<div class="wrap">';
  html += '<div class="panel">';
  html += '<h2>주문조회·수정</h2>';
  html += '<p class="panel-sub">주문하실 때 입력하신 연락처로 조회할 수 있어요.</p>';
  html += '<div class="field-row">';
  html += '<div class="field" style="flex:2;"><label>연락처</label><input id="lookup-phone" type="tel" placeholder="010-0000-0000" value="' + esc(l.phone) + '"></div>';
  html += '<div class="field" style="justify-content:flex-end;"><button class="btn btn-primary" data-action="do-lookup" style="height:38px;">조회</button></div>';
  html += '</div></div>';

  if (l.searched){
    if (l.results.length === 0){
      html += '<div class="empty-state">해당 연락처로 접수된 주문이 없습니다.</div>';
    } else {
      html += l.results.map(renderOrderCard).join('');
    }
  }
  html += '</div>';
  return html;
}

export function renderOrderCard(order){
  var canEdit = order.status === '접수';
  var actions = '';
  if (canEdit){
    actions =
      '<button class="btn btn-outline btn-sm" data-action="edit-order" data-id="' + order.id + '" data-return="' + state.tab + '">수정</button>' +
      '<button class="btn btn-danger btn-sm" data-action="cancel-my-order" data-id="' + order.id + '">주문 취소</button>';
  } else if (order.status !== '취소'){
    actions = '<span class="muted" style="font-size:12px;">생산이 시작되어 수정할 수 없습니다.<br>매장으로 문의해주세요.</span>';
  }
  return (
    '<div class="order-card">' +
      '<div class="order-card-top">' +
        '<div><div class="odate">' + esc(fmtDateLong(order.deliveryDate)) + '</div><div class="oid">#' + esc(shortId(order.id)) + ' · ' + esc(receiveMethodLabel(order)) + (order.inStore ? ' · 매장접수' : '') + '</div></div>' +
        '<span class="badge badge-' + order.status + '">' + order.status + '</span>' +
      '</div>' +
      '<div class="order-items-sum">' + esc(orderItemsSummary(order)) + '</div>' +
      '<div class="order-card-bottom">' +
        '<div class="order-amt">' + fmtWon(order.total) + '</div>' +
        '<div class="card-actions">' + actions + '</div>' +
      '</div>' +
    '</div>'
  );
}
