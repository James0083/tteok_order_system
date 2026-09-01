/* ============================================================
   주문 관련 액션 (제출 / 조회 / 수정 / 취소)
   ============================================================ */
import { state, makeEmptyDraft, resetFormFields } from './state.js';
import { val, genId, addDays, todayStr, formatPhone, phoneDigits } from './utils.js';
import { collectOrderFromDraft } from './pricing.js';
import { loadOrders, insertOrder, updateOrder, refreshOrders } from './store.js';
import { render } from './render/index.js';

/* ---------- 입력값 → 저장 payload ---------- */
export function buildOrderPayload(){
  var inStore = !!state.formFields.inStore;
  var phone = formatPhone(val('#f-phone'));
  var deliveryDate = val('#f-date');
  var memo = val('#f-memo').trim();
  var receiveMethod = state.formFields.receiveMethod;
  var storeName = receiveMethod === 'store' ? (val('#f-store-search') || '').trim() : '';
  var address = receiveMethod === 'delivery' ? (val('#f-address') || '').trim() : '';
  state.formFields = { phone:phone, date:deliveryDate, memo:memo, receiveMethod:receiveMethod, storeName:storeName, address:address, inStore:inStore };

  var totals = collectOrderFromDraft();

  if (!inStore && (!phone || phoneDigits(phone).length < 9)){ return { error:'연락처를 정확히 입력해주세요. (매장 접수 주문이면 위 체크박스를 선택하세요)' }; }
  if (inStore && phone && phoneDigits(phone).length < 9){ return { error:'연락처를 입력하셨다면 정확히 입력하거나 비워주세요.' }; }
  if (!deliveryDate){ return { error:'수령(배송) 희망일을 선택해주세요.' }; }
  if (deliveryDate < addDays(todayStr(), 1)){ return { error:'수령 희망일은 내일 이후로 선택해주세요.' }; }
  if (!receiveMethod){ return { error:'수령 방법(매장 수령/집으로 배송)을 선택해주세요.' }; }
  if (receiveMethod === 'store'){
    var storeOk = state.stores.some(function(s){ return s.name === storeName; });
    if (!storeName || !storeOk){ return { error:'목록에 있는 매장을 검색해 선택해주세요.' }; }
  }
  if (receiveMethod === 'delivery' && !address){ return { error:'배송 받으실 주소를 입력해주세요.' }; }
  if (totals.items.length === 0 && totals.ritual.length === 0){ return { error:'주문할 떡을 1개 이상 담아주세요.' }; }

  return { payload:{
    phone:phone, inStore:inStore, deliveryDate:deliveryDate, memo:memo,
    receiveMethod:receiveMethod,
    storeName: receiveMethod === 'store' ? storeName : null,
    address: receiveMethod === 'delivery' ? address : null,
    items:totals.items, ritual:totals.ritual, itemsTotal:totals.itemsTotal,
    surchargeApplies:totals.surcharge.applies, surchargeUnits:totals.surcharge.units, surchargeAmount:totals.surcharge.amount,
    total:totals.total,
  } };
}

export async function submitOrder(){
  var result = buildOrderPayload();
  if (result.error){ state.submitError = result.error; render(); return; }
  state.submitError = '';
  var btn = document.getElementById('submit-btn');
  if (btn){ btn.disabled = true; btn.textContent = '저장 중...'; }

  var editing = state.editing;
  var newId = editing ? editing.orderId : genId('ORD');

  var ok;
  if (editing){
    ok = await updateOrder(editing.orderId, result.payload);
  } else {
    var newOrder = Object.assign({ id:newId, createdAt:new Date().toISOString(), status:'접수' }, result.payload);
    ok = await insertOrder(newOrder);
  }

  if (!ok){
    state.submitError = '저장에 실패했습니다. 잠시 후 다시 시도해주세요. (백엔드 연결 확인)';
    render();
    return;
  }

  await refreshOrders();

  if (editing){
    state.editing = null;
    state.draft = makeEmptyDraft();
    resetFormFields();
    state.tab = editing.returnTab || 'lookup';
    if (state.tab === 'admin'){ state.admin.banner = '주문이 수정되었습니다.'; }
    if (state.tab === 'lookup'){ doLookup(); return; }
    render();
  } else {
    state.confirmation = Object.assign({ id:newId }, result.payload);
    state.draft = makeEmptyDraft();
    render();
  }
}

/* ---------- 주문조회 ---------- */
export async function doLookup(){
  var phone = (val('#lookup-phone') || state.lookup.phone).trim();
  state.lookup.phone = phone;
  if (!phone){ state.lookup.searched = false; state.lookup.results = []; render(); return; }
  var orders = await loadOrders();
  state.orders = orders;
  var digits = phone.replace(/[^0-9]/g, '');
  var results = orders.filter(function(o){ return o.phone.replace(/[^0-9]/g, '') === digits; });
  results.sort(function(a, b){ return b.createdAt.localeCompare(a.createdAt); });
  state.lookup.searched = true;
  state.lookup.results = results;
  render();
}

export function startEditOrder(orderId, returnTab){
  var order = state.orders.find(function(o){ return o.id === orderId; });
  if (!order) return;
  var draft = makeEmptyDraft();
  draft.items = order.items.map(function(i){ return { productId:i.productId, unit:i.unit, qty:i.qty, cut:i.cut || '' }; });
  order.ritual.forEach(function(r){
    var it = draft.ritual.find(function(x){ return x.id === r.id; });
    if (it){ it.sets = r.sets; }
  });
  state.draft = draft;
  state.formFields = { phone:order.phone || '', date:order.deliveryDate, memo:order.memo || '', receiveMethod:order.receiveMethod || '', storeName:order.storeName || '', address:order.address || '', inStore:!!order.inStore };
  state.editing = { orderId: order.id, returnTab: returnTab || 'lookup' };
  state.confirmation = null;
  state.submitError = '';
  state.tab = 'order';
  render();
}

export async function cancelMyOrder(orderId){
  var ok = await updateOrder(orderId, { status:'취소' });
  if (ok) await refreshOrders();
  doLookup();
}
