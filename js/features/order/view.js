/* ============================================================
   렌더 : 주문 탭 + 주문 탭 렌더 후처리
   ============================================================ */
import { state } from '../../core/state.js';
import { RITUAL_ITEMS, CUT_OPTIONS, CONTACT } from '../../core/config.js';
import {
  esc, fmtWon, val, addDays, todayStr, fmtDateLong,
  findRitual, shortId, receiveMethodLabel, lineQtyText,
} from '../../core/utils.js';
import { activeProducts, findProduct } from './catalog.js';
import { unitPriceOf, collectOrderFromDraft } from './pricing.js';

export function renderContactFooter(){
  return '<footer class="contact-foot no-print">주문 관련 문의는 3일 전 미리 연락 부탁드립니다.<br>' +
    '전화/문자 (' + CONTACT.hours + ') ' + CONTACT.phone1 + ', ' + CONTACT.phone2 + '</footer>';
}

export function renderOrderTab(){
  if (state.confirmation){ return renderConfirmation(); }

  var editingBanner = '';
  if (state.editing){
    editingBanner = '<div class="wrap"><div class="edit-banner"><span>주문 <strong>#' + esc(shortId(state.editing.orderId)) + '</strong> 내용을 수정하는 중입니다.</span>' +
      '<button class="link-btn" data-action="cancel-edit">수정 취소</button></div></div>';
  }

  var minDate = addDays(todayStr(), 1);
  var f = state.formFields;

  var html = '';
  html += editingBanner;
  html += '<div class="wrap">';

  html += '<div class="panel">';
  html += '<h2>주문자 정보</h2>';
  html += '<p class="panel-sub">연락처로 주문을 조회·관리합니다.</p>';
  html += '<div class="field-row">';
  html += '<div class="field"><label class="' + (f.inStore ? '' : 'req') + '">연락처' + (f.inStore ? ' (선택)' : '') + '</label>' +
    '<input id="f-phone" type="tel" inputmode="numeric" placeholder="010-0000-0000" value="' + esc(f.phone) + '"></div>';
  html += '<div class="field"><label class="req">수령(배송) 희망일</label><input id="f-date" type="date" min="' + minDate + '" value="' + esc(f.date) + '"></div>';
  html += '</div>';
  html += '<label class="checkline"><input type="checkbox" id="f-in-store" ' + (f.inStore ? 'checked' : '') + '> 매장에서 접수한 주문 (연락처 없이 접수 가능)</label>';
  html += '<div id="date-notice"></div>';

  html += '<div class="field" style="margin-top:12px;"><label class="req">수령 방법</label>';
  html += '<div class="method-choice">';
  html += '<button type="button" class="method-btn ' + (f.receiveMethod === 'store' ? 'active' : '') + '" data-action="pick-receive" data-method="store">매장 수령</button>';
  html += '<button type="button" class="method-btn ' + (f.receiveMethod === 'factory' ? 'active' : '') + '" data-action="pick-receive" data-method="factory">공장 수령</button>';
  html += '<button type="button" class="method-btn ' + (f.receiveMethod === 'delivery' ? 'active' : '') + '" data-action="pick-receive" data-method="delivery">집으로 배송</button>';
  html += '</div>';
  html += '<div id="receive-detail">' + renderReceiveDetail() + '</div>';
  html += '</div>';
  html += '</div>';

  html += '<div class="panel">';
  html += '<h2>떡 담기</h2>';
  html += '<p class="panel-sub">① 떡 종류 → ② 단위 → ③ 수량 → ④ 쪽수 선택 순서로 골라 담아주세요. (1말 = 10kg · 1/2말 = 5kg · 1kg · 낱개). 여러 종류를 kg 단위로 나눠 담으면 복합 주문도 가능합니다.</p>';
  html += '<div id="picker-panel">' + renderPickerPanel() + '</div>';
  html += '<div id="cart-list">' + renderCartList() + '</div>';
  html += '</div>';

  html += '<div class="panel">';
  html += '<h2>제사용 편 (별도 주문)</h2>';
  html += '<p class="panel-sub">동부편·콩시루편 3쪽 12,000원 · 동부인절미편·콩인절미편 3쪽 15,000원</p>';
  html += '<div class="rlist">' + RITUAL_ITEMS.map(renderRitualRow).join('') + '</div>';
  html += '</div>';

  html += '<div class="panel">';
  html += '<h2>요청사항</h2>';
  html += '<div class="field"><label>특이사항 (포장 방법, 픽업 시간 등)</label><textarea id="f-memo" placeholder="요청사항을 적어주세요">' + esc(f.memo) + '</textarea></div>';
  html += '<div class="notice notice-info" style="margin-top:12px;">절편(혼합절편)·바람떡·쑥개떡만으로 주문하실 경우 1말 기준 10,000원이 자동으로 추가됩니다. 제사용 편, 이바지떡, 답례떡 주문도 가능합니다.</div>';
  html += '</div>';

  html += '<div id="submit-error"></div>';
  html += '</div>'; // wrap

  html += renderContactFooter();

  html += '<div class="total-bar no-print"><div class="total-bar-inner">';
  html += '<div><div class="total-amt"><span class="lbl">합계 금액</span><span id="grand-total">0원</span></div><div class="surcharge-line" id="surcharge-line"></div></div>';
  html += '<div style="display:flex; gap:8px;">';
  html += '<button class="btn btn-outline" data-action="reset-order">초기화</button>';
  html += '<button class="btn btn-primary" id="submit-btn" data-action="submit-order">' + (state.editing ? '수정 저장하기' : '주문 제출하기') + '</button>';
  html += '</div></div></div>';

  return html;
}

export function renderReceiveDetail(){
  var f = state.formFields;
  if (f.receiveMethod === 'store'){
    var storeOptions = state.stores.map(function(s){ return '<option value="' + esc(s.name) + '">'; }).join('');
    var warn = state.stores.length === 0 ? '<div class="notice notice-warn">등록된 매장이 없습니다. 매장 등록은 관리자 화면에서 할 수 있어요.</div>' : '';
    return '<div class="field" style="margin-top:8px;"><label class="req">수령 매장 (검색 가능)</label>' +
      '<input id="f-store-search" list="store-datalist" placeholder="매장명을 입력해 검색하세요" value="' + esc(f.storeName) + '">' +
      '<datalist id="store-datalist">' + storeOptions + '</datalist>' + warn + '</div>';
  }
  if (f.receiveMethod === 'delivery'){
    return '<div class="field" style="margin-top:8px;"><label class="req">배송 받으실 주소</label>' +
      '<textarea id="f-address" placeholder="도로명 주소와 상세주소를 입력해주세요">' + esc(f.address) + '</textarea></div>';
  }
  if (f.receiveMethod === 'factory'){
    return '<div class="notice notice-info" style="margin-top:8px;">공장에서 직접 수령하시는 방법입니다. 수령 시간은 요청사항에 적어주시면 확인 후 연락드립니다.</div>';
  }
  return '';
}

export function renderPickerPanel(){
  var picker = state.draft.picker;
  var product = picker.productId ? findProduct(Number(picker.productId)) : null;

  var html = '<div class="picker-grid">';

  html += '<div class="field"><label>① 떡 종류</label><select id="pick-product">';
  html += '<option value="">선택하세요</option>';
  html += activeProducts().map(function(p){
    return '<option value="' + p.id + '" ' + (product && product.id === p.id ? 'selected' : '') + '>' + esc(p.name) + '</option>';
  }).join('');
  html += '</select></div>';

  html += '<div class="field"><label>② 단위</label><select id="pick-unit" ' + (product ? '' : 'disabled') + '>';
  if (!product){
    html += '<option value="">먼저 떡 종류를 선택하세요</option>';
  } else {
    html += '<option value="">선택하세요</option>';
    html += '<option value="mal" ' + (picker.unit === 'mal' ? 'selected' : '') + '>1말 (10kg) · ' + fmtWon(product.mal) + '</option>';
    if (product.half != null){
      html += '<option value="half" ' + (picker.unit === 'half' ? 'selected' : '') + '>1/2말 (5kg) · ' + fmtWon(product.half) + '</option>';
    }
    if (product.kg > 0){
      html += '<option value="kg" ' + (picker.unit === 'kg' ? 'selected' : '') + '>1kg · ' + fmtWon(product.kg) + '</option>';
    }
    if (product.piecePrice > 0){
      html += '<option value="piece" ' + (picker.unit === 'piece' ? 'selected' : '') + '>낱개(1개) · ' + fmtWon(product.piecePrice) + '</option>';
    }
  }
  html += '</select></div>';

  var qtyReady = !!(product && picker.unit);
  var qtyStep = picker.unit === 'kg' ? '0.5' : '1';
  var qtyMin = picker.unit === 'kg' ? '0.5' : '1';
  var qtyHint = picker.unit === 'kg' ? ' <span class="muted">(0.5 단위)</span>' : picker.unit === 'piece' ? ' <span class="muted">(개)</span>' : '';
  html += '<div class="field"><label>③ 수량' + qtyHint + '</label><input id="pick-qty" type="number" min="' + qtyMin + '" step="' + qtyStep + '" inputmode="decimal" value="' + (picker.qty || qtyMin) + '" ' + (qtyReady ? '' : 'disabled') + '></div>';

  var needsCut = !!(product && product.cutSelect && (picker.unit === 'mal' || picker.unit === 'half'));
  var fixedNote = (product && product.note && !product.cutSelect) ? product.note : '';
  html += '<div class="field"><label>④ 쪽수 선택</label>';
  if (needsCut){
    html += '<select id="pick-cut" ' + (qtyReady ? '' : 'disabled') + '>';
    html += '<option value="">선택하세요</option>';
    CUT_OPTIONS.forEach(function(c){ html += '<option value="' + c + '" ' + (picker.cut === c ? 'selected' : '') + '>' + c + '</option>'; });
    html += '</select>';
  } else if (fixedNote){
    html += '<div class="fixed-note">' + esc(fixedNote) + '</div>';
  } else if (product){
    html += '<div class="fixed-note muted" style="background:var(--paper-2); color:var(--ink-soft);">해당 없음</div>';
  } else {
    html += '<select disabled><option>-</option></select>';
  }
  html += '</div>';

  html += '</div>'; // picker-grid

  var ready = !!(product && picker.unit && (picker.qty > 0) && (!needsCut || picker.cut));
  html += '<button type="button" class="btn btn-primary btn-sm" id="pick-add-btn" data-action="add-cart-line" ' + (ready ? '' : 'disabled') + '>담기</button>';
  return html;
}

export function renderCartList(){
  var lines = state.draft.items;
  if (!lines.length){ return '<div class="empty-state" style="padding:16px 4px;">아직 담은 떡이 없습니다.</div>'; }
  var rows = lines.map(function(line, idx){
    var p = findProduct(line.productId);
    var price = unitPriceOf(p, line.unit);
    return '<div class="cart-line">' +
      '<div class="cl-main"><strong>' + esc(p.name) + '</strong> · ' + esc(lineQtyText(line)) + (line.cut ? (' · ' + esc(line.cut)) : '') + '</div>' +
      '<div class="cl-sub">' + fmtWon(price * line.qty) + '</div>' +
      '<button type="button" class="link-btn" data-action="remove-cart-line" data-idx="' + idx + '">삭제</button>' +
    '</div>';
  }).join('');
  return '<div class="cart-list">' + rows + '</div>';
}

export function renderRitualRow(r){
  var draftR = state.draft.ritual.find(function(x){ return x.id === r.id; });
  var sets = draftR.sets || 0;
  var sub = sets * r.price;
  return (
    '<div class="rrow" data-rrow="' + r.id + '">' +
      '<div class="rname">' + esc(r.name) + '</div>' +
      '<div class="rprice">' + fmtWon(r.price) + ' / 세트</div>' +
      '<div class="stepper"><button type="button" data-action="dec-ritual" data-id="' + r.id + '">−</button>' +
        '<input type="number" min="0" step="1" inputmode="numeric" data-field="rsets" data-id="' + r.id + '" value="' + sets + '">' +
        '<button type="button" data-action="inc-ritual" data-id="' + r.id + '">+</button></div>' +
      '<div class="rsub" data-rsub="' + r.id + '">' + fmtWon(sub) + '</div>' +
    '</div>'
  );
}

export function renderConfirmation(){
  var c = state.confirmation;
  var html = '<div class="wrap">';
  html += '<div class="panel confirm-box">';
  html += '<div class="confirm-mark">✓</div>';
  html += '<h2>주문이 접수되었습니다</h2>';
  html += '<p class="muted">아래 주문번호로 주문조회·수정 탭에서 확인하실 수 있어요.</p>';
  html += '<div class="confirm-id">#' + esc(shortId(c.id)) + '</div>';
  html += '<div class="confirm-summary">';
  html += '<div><span>연락처</span><span>' + (c.phone ? esc(c.phone) : '매장 접수 (연락처 없음)') + '</span></div>';
  html += '<div><span>수령 희망일</span><span>' + esc(fmtDateLong(c.deliveryDate)) + '</span></div>';
  html += '<div><span>수령 방법</span><span>' + esc(receiveMethodLabel(c)) + '</span></div>';
  html += '<div><span>주문 품목</span><span>' + (c.items.length + c.ritual.length) + '종</span></div>';
  html += '<div><span>합계 금액</span><span>' + fmtWon(c.total) + '</span></div>';
  html += '</div>';
  html += '<button class="btn btn-primary" data-action="new-order">새 주문 입력하기</button>';
  html += '</div></div>';
  return html;
}

/* ============================================================
   주문 탭 렌더 후처리 (DOM 직접 갱신)
   ============================================================ */
export function afterOrderRender(){
  updateGrandTotal();
  renderDateNotice();
  if (state.submitError){
    var box = document.getElementById('submit-error');
    if (box) box.innerHTML = '<div class="notice notice-error" style="margin-top:6px;">' + esc(state.submitError) + '</div>';
  }
}

export function renderDateNotice(){
  var box = document.getElementById('date-notice');
  if (!box) return;
  var dateVal = val('#f-date') || state.formFields.date;
  var soon = addDays(todayStr(), 3);
  if (dateVal && dateVal < soon){
    box.innerHTML = '<div class="notice notice-warn">3일 이내 수령을 원하시면 재고 상황 확인을 위해 전화 문의 부탁드립니다: ' + CONTACT.phone1 + ' / ' + CONTACT.phone2 + '</div>';
  } else {
    box.innerHTML = '';
  }
}

export function updateRitualSub(id){
  var def = findRitual(id);
  var item = state.draft.ritual.find(function(r){ return r.id === id; });
  var subEl = document.querySelector('[data-rsub="' + id + '"]');
  if (subEl) subEl.textContent = fmtWon((item.sets || 0) * def.price);
}

export function updateGrandTotal(){
  var totals = collectOrderFromDraft();
  var el = document.getElementById('grand-total');
  if (el) el.textContent = fmtWon(totals.total);
  var sc = document.getElementById('surcharge-line');
  if (sc){
    sc.textContent = totals.surcharge.applies ? ('절편·바람떡·쑥개떡 단독주문 추가요금 +' + fmtWon(totals.surcharge.amount) + ' 포함') : '';
  }
}

export function refreshPickerAddButton(){
  var picker = state.draft.picker;
  var product = picker.productId ? findProduct(Number(picker.productId)) : null;
  var needsCut = !!(product && product.cutSelect && (picker.unit === 'mal' || picker.unit === 'half'));
  var ready = !!(product && picker.unit && (picker.qty > 0) && (!needsCut || picker.cut));
  var btn = document.getElementById('pick-add-btn');
  if (btn) btn.disabled = !ready;
}
