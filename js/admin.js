/* ============================================================
   관리자 / 모니터링 액션
   ============================================================ */
import { state } from './state.js';
import { val, genId } from './utils.js';
import { nextProductId } from './catalog.js';
import {
  refreshOrders, updateOrder, removeOrder,
  saveConfig, insertStore, removeStore, refreshStores,
  insertProduct, updateProduct, removeProduct, refreshProducts,
} from './store.js';
import { render } from './render/index.js';

export async function adminUnlock(){
  var pin = val('#admin-pin');
  if (pin && pin === state.config.adminPin){
    state.admin.unlocked = true;
    state.admin.pinError = '';
    await refreshOrders();
    render();
  } else {
    state.admin.pinError = 'PIN이 일치하지 않습니다.';
    render();
  }
}

export async function monitorUnlock(){
  var pin = val('#monitor-pin');
  if (pin && pin === state.config.staffPin){
    state.monitor.unlocked = true;
    state.monitor.pinError = '';
    await refreshOrders();
    render();
  } else {
    state.monitor.pinError = 'PIN이 일치하지 않습니다.';
    render();
  }
}

export async function changeOrderStatus(orderId, newStatus){
  var ok = await updateOrder(orderId, { status:newStatus });
  if (ok) await refreshOrders();
  render();
}

export async function deleteOrder(orderId){
  var ok = await removeOrder(orderId);
  if (ok) await refreshOrders();
  state.admin.deleteConfirmId = null;
  render();
}

export async function saveAdminPin(){
  var sf = state.admin.settingsForm;
  var a = val('#set-admin-pin-new'), b = val('#set-admin-pin-confirm');
  if (!a || a.length < 4){ sf.pinMsg = 'PIN은 4자리 이상으로 입력해주세요.'; sf.pinMsgType = 'error'; render(); return; }
  if (a !== b){ sf.pinMsg = '확인 PIN이 일치하지 않습니다.'; sf.pinMsgType = 'error'; render(); return; }
  var newCfg = Object.assign({}, state.config, { adminPin:a });
  var ok = await saveConfig(newCfg);
  if (!ok){ sf.pinMsg = '저장에 실패했습니다. (백엔드 연결 확인)'; sf.pinMsgType = 'error'; render(); return; }
  state.config = newCfg;
  sf.adminPinNew = ''; sf.adminPinConfirm = '';
  sf.pinMsg = '관리자 PIN이 변경되었습니다.'; sf.pinMsgType = 'ok';
  render();
}

export async function saveStaffPin(){
  var sf = state.admin.settingsForm;
  var a = val('#set-staff-pin-new'), b = val('#set-staff-pin-confirm');
  if (!a || a.length < 4){ sf.pinMsg = 'PIN은 4자리 이상으로 입력해주세요.'; sf.pinMsgType = 'error'; render(); return; }
  if (a !== b){ sf.pinMsg = '확인 PIN이 일치하지 않습니다.'; sf.pinMsgType = 'error'; render(); return; }
  var newCfg = Object.assign({}, state.config, { staffPin:a });
  var ok = await saveConfig(newCfg);
  if (!ok){ sf.pinMsg = '저장에 실패했습니다. (백엔드 연결 확인)'; sf.pinMsgType = 'error'; render(); return; }
  state.config = newCfg;
  sf.staffPinNew = ''; sf.staffPinConfirm = '';
  sf.pinMsg = '직원용 PIN이 변경되었습니다.'; sf.pinMsgType = 'ok';
  render();
}

export async function addStore(){
  var sf = state.admin.settingsForm;
  var name = val('#set-store-name').trim();
  var addr = val('#set-store-addr').trim();
  if (!name){ sf.storeMsg = '매장명을 입력해주세요.'; sf.storeMsgType = 'error'; render(); return; }
  if (state.stores.some(function(s){ return s.name === name; })){ sf.storeMsg = '이미 등록된 매장명입니다.'; sf.storeMsgType = 'error'; render(); return; }
  var ok = await insertStore({ id: genId('ST'), name:name, address:addr });
  if (!ok){ sf.storeMsg = '저장에 실패했습니다. (백엔드 연결 확인)'; sf.storeMsgType = 'error'; render(); return; }
  await refreshStores();
  sf.newStoreName = ''; sf.newStoreAddr = '';
  sf.storeMsg = '매장이 추가되었습니다.'; sf.storeMsgType = 'ok';
  render();
}

export async function deleteStore(id){
  var ok = await removeStore(id);
  if (ok) await refreshStores();
  render();
}

/* ---------- 떡 종류 관리 ---------- */
function toWon(v){
  var n = parseInt(String(v).replace(/[^0-9]/g, ''), 10);
  return isNaN(n) ? null : n;
}

export async function addProduct(){
  var sf = state.admin.settingsForm;
  var name = (sf.prodName || '').trim();
  var mal = toWon(sf.prodMal);
  var half = (sf.prodHalf || '').trim() === '' ? null : toWon(sf.prodHalf);

  if (!name){ sf.prodMsg = '떡 이름을 입력해주세요.'; sf.prodMsgType = 'error'; render(); return; }
  if (state.products.some(function(p){ return p.name === name; })){ sf.prodMsg = '이미 등록된 떡 이름입니다.'; sf.prodMsgType = 'error'; render(); return; }
  if (mal == null || mal <= 0){ sf.prodMsg = '1말 가격을 숫자로 입력해주세요.'; sf.prodMsgType = 'error'; render(); return; }
  if (sf.prodHalf && (half == null || half <= 0)){ sf.prodMsg = '1/2말 가격이 올바르지 않습니다. (없으면 비워두세요)'; sf.prodMsgType = 'error'; render(); return; }

  var ok = await insertProduct({
    id: nextProductId(),
    name: name,
    mal: mal,
    half: half,
    cutSelect: !!sf.prodCut,
    note: (sf.prodNote || '').trim(),
    surchargeEligible: !!sf.prodSurcharge,
    active: true,
  });
  if (!ok){ sf.prodMsg = '저장에 실패했습니다. (백엔드 연결 확인)'; sf.prodMsgType = 'error'; render(); return; }
  await refreshProducts();
  sf.prodName = ''; sf.prodMal = ''; sf.prodHalf = ''; sf.prodCut = false; sf.prodNote = ''; sf.prodSurcharge = false;
  sf.prodMsg = '"' + name + '" 이(가) 추가되었습니다.'; sf.prodMsgType = 'ok';
  render();
}

export async function saveProductEdit(){
  var sf = state.admin.settingsForm;
  var e = sf.prodEdit;
  if (!e) return;
  var name = (e.name || '').trim();
  var halfRaw = String(e.half == null ? '' : e.half).trim();
  var mal = toWon(e.mal);
  var half = halfRaw === '' ? null : toWon(halfRaw);

  if (!name){ sf.prodMsg = '떡 이름을 입력해주세요.'; sf.prodMsgType = 'error'; render(); return; }
  if (state.products.some(function(p){ return p.name === name && p.id !== e.id; })){
    sf.prodMsg = '이미 등록된 떡 이름입니다.'; sf.prodMsgType = 'error'; render(); return;
  }
  if (mal == null || mal <= 0){ sf.prodMsg = '1말 가격을 숫자로 입력해주세요.'; sf.prodMsgType = 'error'; render(); return; }
  if (halfRaw !== '' && (half == null || half <= 0)){ sf.prodMsg = '1/2말 가격이 올바르지 않습니다. (없으면 비워두세요)'; sf.prodMsgType = 'error'; render(); return; }

  var ok = await updateProduct(e.id, {
    name: name,
    mal: mal,
    half: half,
    cutSelect: !!e.cutSelect,
    note: (e.note || '').trim(),
    surchargeEligible: !!e.surchargeEligible,
  });
  if (!ok){ sf.prodMsg = '저장에 실패했습니다. (백엔드 연결 확인)'; sf.prodMsgType = 'error'; render(); return; }
  await refreshProducts();
  sf.prodEdit = null;
  sf.prodMsg = '"' + name + '" 수정되었습니다.'; sf.prodMsgType = 'ok';
  render();
}

export async function deleteProduct(id){
  var sf = state.admin.settingsForm;
  var pid = Number(id);
  var used = state.orders.some(function(o){
    return (o.items || []).some(function(it){ return it.productId === pid; });
  });
  if (used){
    sf.prodDeleteId = null;
    sf.prodMsg = '이 떡이 포함된 주문이 있어 삭제할 수 없습니다. (주문 기록 보존)';
    sf.prodMsgType = 'error';
    render();
    return;
  }
  var ok = await removeProduct(pid);
  if (ok) await refreshProducts();
  sf.prodDeleteId = null;
  sf.prodMsg = ok ? '삭제되었습니다.' : '삭제에 실패했습니다.';
  sf.prodMsgType = ok ? 'ok' : 'error';
  render();
}
