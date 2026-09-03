/* ============================================================
   관리자 탭 이벤트 (검색 / 날짜 / 인쇄 / 설정 폼 / 주문·매장·떡 관리)
   ============================================================ */
import { state } from '../../core/state.js';
import { addDays, todayStr, formatPhone } from '../../core/utils.js';
import { render } from '../../core/app.js';
import { findProduct } from '../order/catalog.js';
import { refreshOrders } from '../order/data.js';
import { runOrderSearch, clearOrderSearch } from '../order/actions.js';
import { printProductionSheets } from '../production/print.js';
import {
  changeOrderStatus, deleteOrder,
  addStore, deleteStore,
  addProduct, deleteProduct, saveProductEdit,
} from './actions.js';

export function handleClick(btn){
  var action = btn.getAttribute('data-action');
  var id = btn.getAttribute('data-id');

  switch (action){
    case 'admin-search': { runOrderSearch(); return true; }
    case 'admin-search-clear': { clearOrderSearch(); return true; }

    case 'admin-date-prev': { state.admin.date = addDays(state.admin.date, -1); render(); return true; }
    case 'admin-date-next': { state.admin.date = addDays(state.admin.date, 1); render(); return true; }
    case 'admin-date-today': { state.admin.date = addDays(todayStr(), 1); render(); return true; }
    case 'admin-refresh': { refreshOrders().then(function(){ state.admin.banner = ''; render(); }); return true; }
    case 'admin-print': {
      printProductionSheets({
        date: state.admin.date,
        orders: state.orders.filter(function(o){ return o.deliveryDate === state.admin.date; }),
        mode: 'admin',
      });
      return true;
    }
    case 'admin-open-settings': { state.admin.view = 'settings'; render(); return true; }
    case 'admin-back-dashboard': { state.admin.view = 'dashboard'; render(); return true; }
    case 'admin-delete': { state.admin.deleteConfirmId = id; render(); return true; }
    case 'admin-delete-cancel': { state.admin.deleteConfirmId = null; render(); return true; }
    case 'admin-delete-confirm': { deleteOrder(id); return true; }

    case 'add-store': { addStore(); return true; }
    case 'delete-store': { deleteStore(id); return true; }

    case 'add-product': { addProduct(); return true; }
    case 'delete-product': { state.admin.settingsForm.prodDeleteId = id; render(); return true; }
    case 'delete-product-cancel': { state.admin.settingsForm.prodDeleteId = null; render(); return true; }
    case 'delete-product-confirm': { deleteProduct(id); return true; }
    case 'edit-product': {
      var ep = findProduct(Number(id));
      if (ep){
        state.admin.settingsForm.prodDeleteId = null;
        state.admin.settingsForm.prodEdit = {
          id: ep.id,
          name: ep.name,
          mal: String(ep.mal),
          half: ep.half == null ? '' : String(ep.half),
          kg: ep.kg ? String(ep.kg) : '',
          piecePrice: ep.piecePrice ? String(ep.piecePrice) : '',
          note: ep.note || '',
          cutSelect: !!ep.cutSelect,
          surchargeEligible: !!ep.surchargeEligible,
        };
        render();
      }
      return true;
    }
    case 'edit-product-cancel': { state.admin.settingsForm.prodEdit = null; render(); return true; }
    case 'save-product': { saveProductEdit(); return true; }
  }
  return false;
}

export function handleInput(t){
  if (t.id === 'admin-date'){ state.admin.date = t.value; render(); return true; }
  if (t.id === 'admin-search'){
    var lp = formatPhone(t.value);
    t.value = lp;
    try { t.setSelectionRange(lp.length, lp.length); } catch (err){ /* noop */ }
    state.admin.search = lp;
    return true;
  }

  var sf = state.admin.settingsForm;
  if (t.id === 'set-store-name'){ sf.newStoreName = t.value; return true; }
  if (t.id === 'set-store-addr'){ sf.newStoreAddr = t.value; return true; }
  if (t.id === 'set-prod-name'){ sf.prodName = t.value; return true; }
  if (t.id === 'set-prod-mal'){ sf.prodMal = t.value; return true; }
  if (t.id === 'set-prod-half'){ sf.prodHalf = t.value; return true; }
  if (t.id === 'set-prod-kg'){ sf.prodKg = t.value; return true; }
  if (t.id === 'set-prod-piece'){ sf.prodPiece = t.value; return true; }
  if (t.id === 'set-prod-note'){ sf.prodNote = t.value; return true; }
  if (t.id.indexOf('edit-prod-') === 0 && sf.prodEdit){
    var ef = t.id.slice('edit-prod-'.length);
    var pe = sf.prodEdit;
    if (ef === 'name') pe.name = t.value;
    else if (ef === 'mal') pe.mal = t.value;
    else if (ef === 'half') pe.half = t.value;
    else if (ef === 'kg') pe.kg = t.value;
    else if (ef === 'piece') pe.piecePrice = t.value;
    else if (ef === 'note') pe.note = t.value;
    return true;
  }
  return false;
}

export function handleChange(t){
  var sf = state.admin.settingsForm;
  if (t.id === 'set-prod-cut'){ sf.prodCut = t.checked; return true; }
  if (t.id === 'set-prod-surcharge'){ sf.prodSurcharge = t.checked; return true; }
  if (t.id === 'edit-prod-cut' && sf.prodEdit){ sf.prodEdit.cutSelect = t.checked; return true; }
  if (t.id === 'edit-prod-surcharge' && sf.prodEdit){ sf.prodEdit.surchargeEligible = t.checked; return true; }
  if (t.matches('select[data-action-select="status"]')){
    changeOrderStatus(t.getAttribute('data-id'), t.value);
    return true;
  }
  return false;
}

export function handleKeydown(e){
  if (e.key === 'Enter' && e.target && e.target.id === 'admin-search'){ runOrderSearch(); return true; }
  return false;
}
