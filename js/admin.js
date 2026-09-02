/* ============================================================
   직원 로그인 / 관리자 / 매장 / 떡 종류 액션
   ============================================================ */
import { state } from './state.js';
import { val, genId } from './utils.js';
import { nextProductId } from './catalog.js';
import { computeKgPrice } from './pricing.js';
import { signIn, signOut } from './auth.js';
import {
  refreshOrders, updateOrder, removeOrder,
  insertStore, removeStore, refreshStores,
  insertProduct, updateProduct, removeProduct, refreshProducts,
} from './store.js';
import { render } from './render/index.js';

/* ---------- 직원 로그인 ---------- */
export async function staffLogin(){
  var a = state.auth;
  if (!a.emailInput || !a.passwordInput){
    a.error = '이메일과 비밀번호를 입력해주세요.';
    render();
    return;
  }
  a.busy = true; a.error = '';
  render();
  var result = await signIn(a.emailInput, a.passwordInput);
  a.busy = false;
  if (result.error){
    a.error = '로그인에 실패했습니다: ' + result.error;
    render();
    return;
  }
  a.passwordInput = '';
  a.error = '';
  // 세션은 auth.js 의 onAuthStateChange 구독(main.js)이 감지해 state.auth.session 을 채우고 다시 render() 합니다.
}

export async function staffLogout(){
  await signOut();
  state.tab = 'order';
  // state.auth.session 갱신 및 render() 는 onAuthStateChange 구독이 처리합니다.
}

/* ---------- 관리자 주문 관리 ---------- */
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

/* ---------- 매장 관리 ---------- */
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
  var s = String(v == null ? '' : v).replace(/[^0-9]/g, '');
  if (s === '') return null;
  var n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}

/* 폼 값(문자열) → 저장용 숫자 필드. 실패 시 {error}. */
function parseProductPrices(malRaw, halfRaw, kgRaw, pieceRaw){
  var mal = toWon(malRaw);
  if (mal == null || mal <= 0) return { error: '1말 가격을 숫자로 입력해주세요.' };
  var halfStr = String(halfRaw == null ? '' : halfRaw).trim();
  var half = halfStr === '' ? null : toWon(halfStr);
  if (halfStr !== '' && (half == null || half <= 0)) return { error: '1/2말 가격이 올바르지 않습니다. (없으면 비워두세요)' };
  var kgStr = String(kgRaw == null ? '' : kgRaw).trim();
  var kg = kgStr === '' ? computeKgPrice(mal, half) : toWon(kgStr);
  if (kgStr !== '' && (kg == null || kg <= 0)) return { error: '1kg 가격이 올바르지 않습니다. (비우면 자동 계산)' };
  var pieceStr = String(pieceRaw == null ? '' : pieceRaw).trim();
  var piecePrice = pieceStr === '' ? 0 : (toWon(pieceStr) || 0);
  if (piecePrice < 0) piecePrice = 0;
  return { mal: mal, half: half, kg: kg, piecePrice: piecePrice };
}

export async function addProduct(){
  var sf = state.admin.settingsForm;
  var name = (sf.prodName || '').trim();

  if (!name){ sf.prodMsg = '떡 이름을 입력해주세요.'; sf.prodMsgType = 'error'; render(); return; }
  if (state.products.some(function(p){ return p.name === name; })){ sf.prodMsg = '이미 등록된 떡 이름입니다.'; sf.prodMsgType = 'error'; render(); return; }
  var prices = parseProductPrices(sf.prodMal, sf.prodHalf, sf.prodKg, sf.prodPiece);
  if (prices.error){ sf.prodMsg = prices.error; sf.prodMsgType = 'error'; render(); return; }

  var ok = await insertProduct({
    id: nextProductId(),
    name: name,
    mal: prices.mal,
    half: prices.half,
    kg: prices.kg,
    piecePrice: prices.piecePrice,
    cutSelect: !!sf.prodCut,
    note: (sf.prodNote || '').trim(),
    surchargeEligible: !!sf.prodSurcharge,
    active: true,
  });
  if (!ok){ sf.prodMsg = '저장에 실패했습니다. (백엔드 연결 확인)'; sf.prodMsgType = 'error'; render(); return; }
  await refreshProducts();
  sf.prodName = ''; sf.prodMal = ''; sf.prodHalf = ''; sf.prodKg = ''; sf.prodPiece = '';
  sf.prodCut = false; sf.prodNote = ''; sf.prodSurcharge = false;
  sf.prodMsg = '"' + name + '" 이(가) 추가되었습니다.'; sf.prodMsgType = 'ok';
  render();
}

export async function saveProductEdit(){
  var sf = state.admin.settingsForm;
  var e = sf.prodEdit;
  if (!e) return;
  var name = (e.name || '').trim();

  if (!name){ sf.prodMsg = '떡 이름을 입력해주세요.'; sf.prodMsgType = 'error'; render(); return; }
  if (state.products.some(function(p){ return p.name === name && p.id !== e.id; })){
    sf.prodMsg = '이미 등록된 떡 이름입니다.'; sf.prodMsgType = 'error'; render(); return;
  }
  var prices = parseProductPrices(e.mal, e.half, e.kg, e.piecePrice);
  if (prices.error){ sf.prodMsg = prices.error; sf.prodMsgType = 'error'; render(); return; }

  var ok = await updateProduct(e.id, {
    name: name,
    mal: prices.mal,
    half: prices.half,
    kg: prices.kg,
    piecePrice: prices.piecePrice,
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
